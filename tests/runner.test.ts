import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PythonRunner, type RunnerEvent } from "../src/runtime/python";
class FakeWorker {
  static instances: FakeWorker[] = [];
  onmessage: ((e: { data: Record<string, unknown> }) => void) | null = null;
  onerror: (() => void) | null = null;
  terminated = false;
  messages: Record<string, unknown>[] = [];
  constructor() {
    FakeWorker.instances.push(this);
  }
  postMessage(data: Record<string, unknown>) {
    this.messages.push(data);
    if (data.type === "init")
      queueMicrotask(() => this.dispatch({ type: "ready" }));
  }
  dispatch(data: Record<string, unknown>) {
    this.onmessage?.({ data });
  }
  terminate() {
    this.terminated = true;
  }
}
beforeEach(() => {
  vi.stubGlobal("crossOriginIsolated", true);
  vi.stubGlobal("Worker", FakeWorker);
  FakeWorker.instances = [];
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
describe("Python worker lifecycle", () => {
  it("explains missing isolation without creating a worker", async () => {
    vi.stubGlobal("crossOriginIsolated", false);
    const events: RunnerEvent[] = [];
    const runner = new PythonRunner(
      async () => null,
      (event) => events.push(event),
    );
    await runner.run("print(1)");
    expect(events.at(-1)?.message).toMatch(/COOP/);
    expect(FakeWorker.instances).toHaveLength(0);
    runner.dispose();
  });
  it("stops by terminating the worker and creates a fresh one on retry", async () => {
    const runner = new PythonRunner(
      async () => null,
      () => {},
    );
    await runner.run("while True: pass");
    const first = FakeWorker.instances[0];
    runner.stop();
    expect(first.terminated).toBe(true);
    expect(runner.phase).toBe("idle");
    await runner.run("print(1)");
    expect(FakeWorker.instances).toHaveLength(2);
    runner.dispose();
  });
  it("ignores stale commands and results after cancellation", async () => {
    const command = vi.fn(async () => 42),
      events: RunnerEvent[] = [];
    const runner = new PythonRunner(command, (e) => events.push(e));
    await runner.run("position()");
    const worker = FakeWorker.instances[0],
      id = worker.messages.find((x) => x.type === "run")!.runId;
    runner.stop();
    worker.dispatch({
      type: "call",
      runId: id,
      requestId: 1,
      method: "position",
      args: [],
    });
    worker.dispatch({ type: "finished", runId: id });
    expect(command).not.toHaveBeenCalled();
    expect(events.at(-1)?.message).toBe("Execution stopped.");
    runner.dispose();
  });
  it("does not publish a command response after a run is replaced", async () => {
    let done: (value: number) => void = () => {};
    const command = () =>
      new Promise<number>((resolve) => {
        done = resolve;
      });
    const runner = new PythonRunner(command, () => {});
    await runner.run("position()");
    const worker = FakeWorker.instances[0],
      id = worker.messages.find((x) => x.type === "run")!.runId;
    worker.dispatch({
      type: "call",
      runId: id,
      requestId: 1,
      method: "position",
      args: [],
    });
    runner.reset();
    done(42);
    await Promise.resolve();
    expect(worker.terminated).toBe(true);
    expect(runner.phase).toBe("idle");
    runner.dispose();
  });
  it("replaces an unresponsive worker after its deadline", async () => {
    vi.useFakeTimers();
    const events: RunnerEvent[] = [];
    const runner = new PythonRunner(
      async () => null,
      (e) => events.push(e),
    );
    const running = runner.run("import time; time.sleep(1000)");
    await vi.runAllTicks();
    await running;
    await vi.advanceTimersByTimeAsync(35001);
    expect(FakeWorker.instances[0].terminated).toBe(true);
    expect(events.at(-1)?.message).toMatch(/deadline/);
    runner.dispose();
  });
  it("pauses at a trace boundary and resumes with the remaining deadline", async () => {
    const runner = new PythonRunner(
      async () => null,
      () => {},
    );
    await runner.run("print(1)");
    const worker = FakeWorker.instances[0],
      id = worker.messages.find((x) => x.type === "run")!.runId;
    runner.pause();
    worker.dispatch({ type: "paused", runId: id, line: 1 });
    expect(runner.phase).toBe("paused");
    runner.step();
    expect(runner.phase).toBe("running");
    worker.dispatch({ type: "paused", runId: id, line: 2 });
    runner.resume();
    expect(runner.phase).toBe("running");
    runner.dispose();
  });
});
