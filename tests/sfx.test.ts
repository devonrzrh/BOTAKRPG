import { afterEach, describe, expect, it, vi } from "vitest";
import { createSfx, evadeSoundCues } from "../src/game/sfx";
import { createEvade, stepEvade } from "../src/game/evade";

describe("dodge sound timing", () => {
  it("warns once before each lane and sounds each hit or miss once", () => {
    let state = createEvade(7);
    state = {
      ...state,
      playerX: state.hazards[0].kind === "gap" ? 24 : state.hazards[0].lane,
    };
    const events: string[] = [];
    for (let i = 0; i < 280; i++) {
      const next = stepEvade(state, 0.01, 0);
      events.push(...evadeSoundCues(state, next));
      expect(evadeSoundCues(next, next)).toEqual([]);
      state = next;
    }
    expect(events.filter((cue) => cue === "hazard")).toHaveLength(3);
    expect(events.filter((cue) => cue === "hit")).toHaveLength(
      state.collisions,
    );
    expect(events.filter((cue) => cue === "dodge")).toHaveLength(
      3 - state.collisions,
    );
    expect(events.slice(0, 2)).toEqual(["hazard", "hit"]);
  });

  it("does not replay passed warnings or completed hazards", () => {
    const before = stepEvade(createEvade(7), 1, 0);
    expect(evadeSoundCues(before, stepEvade(before, 0.01, 0))).toEqual([]);
  });
});

function mockAudio(state: "running" | "suspended" = "running") {
  const oscillator = () => ({
    frequency: {
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    },
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    disconnect: vi.fn(),
    onended: null as (() => void) | null,
    type: "sine",
  });
  const gain = () => ({
    gain: {
      setValueAtTime: vi.fn(),
      setTargetAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    },
    connect: vi.fn(),
    disconnect: vi.fn(),
  });
  const ctx = {
    state,
    currentTime: 0,
    sampleRate: 44100,
    destination: {},
    createOscillator: vi.fn(oscillator),
    createGain: vi.fn(gain),
    createBuffer: vi.fn((_channels: number, length: number) => ({
      getChannelData: () => new Float32Array(length),
    })),
    createBufferSource: vi.fn(() => ({
      buffer: null,
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      disconnect: vi.fn(),
      onended: null as (() => void) | null,
    })),
    createBiquadFilter: vi.fn(() => ({
      type: "highpass",
      frequency: { setValueAtTime: vi.fn() },
      connect: vi.fn(),
      disconnect: vi.fn(),
    })),
    resume: vi.fn(() => Promise.resolve()),
    close: vi.fn(() => Promise.resolve()),
  };
  const Ctor = vi.fn(function AudioContextMock() {
    return ctx;
  });
  return { ctx, Ctor };
}

describe("interface SFX", () => {
  let priorWindow: PropertyDescriptor | undefined;
  afterEach(() => {
    vi.restoreAllMocks();
    if (priorWindow) Object.defineProperty(globalThis, "window", priorWindow);
    else Reflect.deleteProperty(globalThis, "window");
    priorWindow = undefined;
  });
  const install = (Ctor: ReturnType<typeof mockAudio>["Ctor"]) => {
    priorWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: { AudioContext: Ctor },
    });
  };

  it("stays lazy until unlock, then plays textured paper and layered clue cues", () => {
    const { ctx, Ctor } = mockAudio();
    install(Ctor);
    const sfx = createSfx();
    sfx.play("click");
    expect(Ctor).not.toHaveBeenCalled();
    sfx.unlock();
    sfx.play("page");
    sfx.play("clue");
    expect(ctx.createBuffer).toHaveBeenCalledTimes(1);
    expect(ctx.createBufferSource).toHaveBeenCalledTimes(1);
    expect(ctx.createOscillator).toHaveBeenCalledTimes(4);
    sfx.dispose();
    expect(ctx.close).toHaveBeenCalledOnce();
    expect(
      ctx.createBiquadFilter.mock.results[0].value.disconnect,
    ).toHaveBeenCalled();
  });

  it("clamps volume, mutes by cancelling active voices, and disposes safely", () => {
    const { ctx, Ctor } = mockAudio();
    install(Ctor);
    const sfx = createSfx();
    sfx.unlock();
    sfx.setVolume(4);
    sfx.play("open");
    expect(ctx.createOscillator).toHaveBeenCalledTimes(2);
    sfx.setVolume(0);
    expect(
      ctx.createOscillator.mock.results.map(({ value }) => value.stop),
    ).toHaveLength(2);
    for (const { value } of ctx.createOscillator.mock.results)
      expect(value.stop).toHaveBeenCalledTimes(2);
    sfx.play("success");
    expect(ctx.createOscillator).toHaveBeenCalledTimes(2);
    sfx.setVolume(-5);
    sfx.unlock();
    expect(ctx.resume).not.toHaveBeenCalled();
    sfx.dispose();
    sfx.play("click");
    expect(ctx.close).toHaveBeenCalledOnce();
    const silent = createSfx();
    silent.setVolume(0);
    silent.unlock();
    silent.setVolume(NaN);
    silent.unlock();
    expect(Ctor).toHaveBeenCalledOnce();
    silent.dispose();
  });

  it("rate limits repeated cues and caps simultaneous voices", () => {
    const { ctx, Ctor } = mockAudio();
    install(Ctor);
    let clock = 1000;
    vi.spyOn(performance, "now").mockImplementation(() => clock);
    const sfx = createSfx();
    sfx.unlock();
    sfx.play("click");
    sfx.play("click");
    expect(ctx.createOscillator).toHaveBeenCalledTimes(1);
    for (let i = 0; i < 15; i++) {
      clock += 350;
      sfx.play("levelUp");
    }
    expect(ctx.createOscillator.mock.calls.length).toBeGreaterThan(13);
    expect(
      ctx.createOscillator.mock.results.filter(
        ({ value }) => value.stop.mock.calls.length > 1,
      ).length,
    ).toBeGreaterThan(0);
    sfx.dispose();
  });

  it("keeps only the latest cue during explicit gesture resume", async () => {
    let resolve!: () => void;
    const resumed = new Promise<void>((done) => {
      resolve = done;
    });
    const { ctx, Ctor } = mockAudio("suspended");
    ctx.resume.mockReturnValue(resumed);
    install(Ctor);
    const sfx = createSfx();
    sfx.unlock();
    sfx.play("page");
    sfx.play("clue");
    ctx.state = "running";
    resolve();
    await Promise.resolve();
    await Promise.resolve();
    expect(ctx.createBufferSource).not.toHaveBeenCalled();
    expect(ctx.createOscillator).toHaveBeenCalledTimes(3);
    sfx.dispose();
  });

  it.each([
    "connect",
    "pursuit",
    "train",
    "scan",
    "hazard",
    "dodge",
    "hit",
    "speechHuman",
    "speechRobot",
    "speechEcho",
    "speechSoft",
  ] as const)("renders %s and cancels every layer when muted", (cue) => {
    const { ctx, Ctor } = mockAudio();
    install(Ctor);
    const sfx = createSfx();
    sfx.unlock();
    sfx.play(cue);
    expect(ctx.createOscillator).toHaveBeenCalled();
    const sources = [
      ...ctx.createOscillator.mock.results,
      ...ctx.createBufferSource.mock.results,
    ];
    for (const { value } of sources) expect(value.start).toHaveBeenCalledOnce();
    sfx.setVolume(0);
    for (const { value } of sources) {
      expect(value.stop).toHaveBeenCalledTimes(2);
      expect(value.disconnect).toHaveBeenCalledOnce();
    }
    sfx.dispose();
  });
});
