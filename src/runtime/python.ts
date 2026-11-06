import type { ActivityCommand } from "../game/contracts";
export type RunPhase = "idle" | "loading" | "running" | "paused" | "error";
export interface RunnerEvent {
  phase?: RunPhase;
  line?: number;
  message?: string;
  done?: boolean;
}
export class PythonRunner {
  private worker: Worker | null = null;
  private header: Int32Array | null = null;
  private buffer: SharedArrayBuffer | null = null;
  private runId = 0;
  private request = 0;
  private epoch = 0;
  private ready: Promise<void> | null = null;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private stopTimer: ReturnType<typeof setTimeout> | undefined;
  private rejectReady: ((reason: Error) => void) | null = null;
  private pausedAt = 0;
  private remaining = 35000;
  private deadline = 0;
  phase: RunPhase = "idle";
  constructor(
    private command: (command: ActivityCommand) => Promise<unknown>,
    private event: (event: RunnerEvent) => void,
  ) {}
  private emit(event: RunnerEvent) {
    if (event.phase) this.phase = event.phase;
    this.event(event);
  }
  private watchdog(ms: number) {
    clearTimeout(this.timer);
    this.remaining = ms;
    this.deadline = performance.now() + ms;
    this.timer = setTimeout(
      () =>
        this.replace(
          "Python exceeded its execution deadline. The worker was restarted.",
        ),
      ms,
    );
  }
  private replace(message?: string) {
    this.request++;
    this.epoch++;
    this.runId++;
    this.worker?.terminate();
    this.worker = null;
    this.header = null;
    this.buffer = null;
    this.ready = null;
    clearTimeout(this.timer);
    clearTimeout(this.stopTimer);
    this.rejectReady?.(new Error(message ?? "Worker stopped"));
    this.rejectReady = null;
    this.emit({ phase: message ? "error" : "idle", message });
  }
  private initialize() {
    if (!crossOriginIsolated || typeof SharedArrayBuffer === "undefined")
      throw new Error(
        "Python requires cross-origin isolation. Start with npm run dev, or serve COOP: same-origin and COEP: require-corp headers. Manual and block editing remain available.",
      );
    if (this.ready) return this.ready;
    this.emit({ phase: "loading" });
    this.buffer = new SharedArrayBuffer(256 * 1024);
    this.header = new Int32Array(this.buffer, 0, 8);
    const epoch = ++this.epoch;
    this.ready = new Promise<void>((resolve, reject) => {
      this.rejectReady = reject;
      const worker = (this.worker = new Worker("/python-worker.js"));
      this.watchdog(90000);
      worker.onerror = () => {
        if (epoch === this.epoch)
          this.replace(
            "Python worker could not start. Check the local runtime files and reload.",
          );
      };
      worker.onmessage = async ({ data }) => {
        if (epoch !== this.epoch) return;
        if (data.type === "ready") {
          clearTimeout(this.timer);
          this.rejectReady = null;
          resolve();
          return;
        }
        if (data.type === "load-error") {
          this.replace(`Python failed to load: ${data.message}`);
          return;
        }
        if (data.runId !== this.runId) return;
        if (data.type === "call") {
          const run = this.runId;
          try {
            const value = await this.command(data as ActivityCommand);
            if (epoch === this.epoch && run === this.runId)
              this.respond(data.requestId, { value });
          } catch (error) {
            if (epoch === this.epoch && run === this.runId)
              this.respond(data.requestId, { error: String(error) });
          }
          return;
        }
        if (data.type === "paused") {
          if (this.phase !== "paused") {
            this.remaining = Math.max(1000, this.deadline - performance.now());
            clearTimeout(this.timer);
          }
          this.pausedAt = performance.now();
          this.emit({ phase: "paused", line: data.line });
        }
        if (data.type === "line") this.emit({ line: data.line });
        if (data.type === "output")
          this.emit({ message: String(data.message).slice(0, 3000) });
        if (data.type === "finished" || data.type === "error") {
          clearTimeout(this.timer);
          clearTimeout(this.stopTimer);
          this.emit({
            phase: data.type === "error" ? "error" : "idle",
            message: data.message,
            done: true,
          });
        }
      };
      worker.postMessage({ type: "init", buffer: this.buffer });
    });
    return this.ready;
  }
  private respond(request: number, payload: unknown) {
    if (
      !this.header ||
      !this.buffer ||
      Atomics.load(this.header, 1) !== request
    )
      return;
    let bytes = new TextEncoder().encode(JSON.stringify(payload));
    if (bytes.length > this.buffer.byteLength - 32)
      bytes = new TextEncoder().encode(
        '{"error":"Game response exceeds shared channel capacity"}',
      );
    new Uint8Array(this.buffer, 32, bytes.length).set(bytes);
    Atomics.store(this.header, 2, bytes.length);
    Atomics.store(this.header, 0, 2);
    Atomics.notify(this.header, 0);
  }
  async run(code: string) {
    if (
      this.phase === "running" ||
      this.phase === "paused" ||
      this.phase === "loading"
    )
      return;
    const request = ++this.request;
    try {
      await this.initialize();
      if (request !== this.request || !this.worker || !this.header) return;
      this.runId++;
      this.header.fill(0);
      Atomics.store(this.header, 5, this.runId);
      this.emit({ phase: "running", line: 0 });
      this.watchdog(35000);
      this.worker.postMessage({ type: "run", runId: this.runId, code });
    } catch (error) {
      if (request === this.request)
        this.emit({ phase: "error", message: String(error) });
    }
  }
  pause() {
    if (this.header && this.phase === "running")
      Atomics.store(this.header, 3, 1);
  }
  resume() {
    if (this.header && this.phase === "paused") {
      Atomics.store(this.header, 3, 0);
      Atomics.notify(this.header, 3);
      this.emit({ phase: "running" });
      this.watchdog(this.remaining);
    }
  }
  step() {
    if (this.header && this.phase === "paused") {
      Atomics.store(this.header, 3, 2);
      Atomics.notify(this.header, 3);
      this.emit({ phase: "running" });
      this.watchdog(this.remaining);
    }
  }
  stop() {
    if (this.header) {
      Atomics.store(this.header, 3, 3);
      Atomics.notify(this.header, 3);
      Atomics.notify(this.header, 0);
    }
    this.replace();
    this.emit({ message: "Execution stopped." });
  }
  reset() {
    this.replace();
  }
  dispose() {
    this.replace();
  }
}
