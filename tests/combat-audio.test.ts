import { afterEach, describe, expect, it, vi } from "vitest";
import { createCombatAudio } from "../src/game/combatAudio";
import type { BattleCue } from "../src/game/combatPresentation";

const cue: BattleCue = {
  sequence: 1,
  kind: "player",
  skill: "strike",
  amount: 5,
  heavy: false,
  blocked: false,
  defeated: false,
};

describe("combat audio", () => {
  let priorWindow: PropertyDescriptor | undefined;
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    if (priorWindow) Object.defineProperty(globalThis, "window", priorWindow);
    else Reflect.deleteProperty(globalThis, "window");
    priorWindow = undefined;
  });

  it("creates no audio context until unlocked and ignores duplicate cues", () => {
    vi.useFakeTimers();
    const oscillator = {
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
    };
    const gain = {
      gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
      connect: vi.fn(),
      disconnect: vi.fn(),
    };
    const context = {
      state: "running",
      currentTime: 0,
      destination: {},
      createOscillator: vi.fn(() => oscillator),
      createGain: vi.fn(() => gain),
      close: vi.fn(() => Promise.resolve()),
      resume: vi.fn(() => Promise.resolve()),
    };
    const constructor = vi.fn(function AudioContextMock() {
      return context;
    });
    priorWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: { AudioContext: constructor },
    });
    const audio = createCombatAudio();
    audio.play(cue);
    expect(constructor).not.toHaveBeenCalled();
    audio.unlock();
    expect(constructor).toHaveBeenCalledTimes(1);
    audio.play(cue);
    audio.play(cue);
    vi.advanceTimersByTime(300);
    expect(context.createOscillator).toHaveBeenCalledTimes(1);
    expect(oscillator.start).toHaveBeenCalledTimes(1);
    audio.play({ ...cue, sequence: 2 }, true);
    vi.advanceTimersByTime(64);
    expect(context.createOscillator).toHaveBeenCalledTimes(2);
    audio.play({ ...cue, sequence: 3 });
    audio.setMuted(true);
    vi.advanceTimersByTime(1000);
    expect(context.createOscillator).toHaveBeenCalledTimes(2);
    expect(oscillator.disconnect).toHaveBeenCalled();
    context.state = "suspended";
    audio.setMuted(false);
    audio.unlock();
    expect(context.resume).toHaveBeenCalledTimes(1);
    audio.dispose();
    expect(context.close).toHaveBeenCalledTimes(1);
    expect(oscillator.disconnect).toHaveBeenCalled();
    expect(gain.disconnect).toHaveBeenCalled();
  });

  it("does not schedule audible cues while muted", () => {
    vi.useFakeTimers();
    const audio = createCombatAudio();
    audio.setMuted(true);
    audio.play(cue);
    vi.advanceTimersByTime(1000);
    audio.dispose();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("scales the master level and volume zero silences voices without changing mute state", () => {
    vi.useFakeTimers();
    const oscillator = {
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
    };
    const gain = {
      gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
      connect: vi.fn(),
      disconnect: vi.fn(),
    };
    const context = {
      state: "running",
      currentTime: 0,
      destination: {},
      createOscillator: vi.fn(() => oscillator),
      createGain: vi.fn(() => gain),
      close: vi.fn(() => Promise.resolve()),
      resume: vi.fn(() => Promise.resolve()),
    };
    const constructor = vi.fn(function AudioContextMock() {
      return context;
    });
    priorWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: { AudioContext: constructor },
    });
    const audio = createCombatAudio();
    audio.setVolume(0.5);
    audio.unlock();
    audio.play(cue);
    vi.advanceTimersByTime(300);
    expect(gain.gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(
      0.0275,
      0.012,
    );

    audio.play({ ...cue, sequence: 2 });
    audio.setVolume(0);
    expect(oscillator.disconnect).toHaveBeenCalled();
    expect(gain.disconnect).toHaveBeenCalled();
    vi.advanceTimersByTime(1000);
    expect(context.createOscillator).toHaveBeenCalledTimes(1);
    audio.setVolume(1);
    audio.play({ ...cue, sequence: 3 });
    vi.advanceTimersByTime(300);
    expect(context.createOscillator).toHaveBeenCalledTimes(2);

    audio.setMuted(true);
    audio.setVolume(0);
    audio.setVolume(1);
    audio.play({ ...cue, sequence: 4 });
    vi.advanceTimersByTime(1000);
    expect(context.createOscillator).toHaveBeenCalledTimes(2);
    audio.setMuted(false);
    audio.play({ ...cue, sequence: 5 });
    vi.advanceTimersByTime(300);
    expect(context.createOscillator).toHaveBeenCalledTimes(3);
    audio.dispose();
  });

  it("does not create an audio context at zero volume", () => {
    const constructor = vi.fn();
    priorWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: { AudioContext: constructor },
    });
    const audio = createCombatAudio();
    audio.setVolume(Number.NaN);
    audio.unlock();
    expect(constructor).not.toHaveBeenCalled();
    audio.setVolume(0.2);
    expect(constructor).not.toHaveBeenCalled();
    audio.dispose();
  });

  it("adds filtered noise texture to heavy enemy impacts", () => {
    vi.useFakeTimers();
    const oscillator = {
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
    };
    const gain = {
      gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
      connect: vi.fn(),
      disconnect: vi.fn(),
    };
    const filter = {
      frequency: { setValueAtTime: vi.fn() },
      Q: { setValueAtTime: vi.fn() },
      connect: vi.fn(),
      disconnect: vi.fn(),
      type: "lowpass",
    };
    const noiseSource = {
      buffer: null,
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      disconnect: vi.fn(),
      onended: null as (() => void) | null,
    };
    const channel = new Float32Array(4);
    const context = {
      state: "running",
      currentTime: 0,
      sampleRate: 12,
      destination: {},
      createOscillator: vi.fn(() => oscillator),
      createGain: vi.fn(() => gain),
      createBuffer: vi.fn(() => ({ getChannelData: () => channel })),
      createBufferSource: vi.fn(() => noiseSource),
      createBiquadFilter: vi.fn(() => filter),
      close: vi.fn(() => Promise.resolve()),
      resume: vi.fn(() => Promise.resolve()),
    };
    const constructor = vi.fn(function AudioContextMock() {
      return context;
    });
    priorWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: { AudioContext: constructor },
    });
    const audio = createCombatAudio();
    audio.unlock();
    audio.play({ ...cue, kind: "enemy", heavy: true });
    vi.advanceTimersByTime(402);
    expect(oscillator.start).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(noiseSource.start).toHaveBeenCalledTimes(1);
    expect(gain.gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(
      0.18,
      0.006,
    );
    expect(oscillator.stop).toHaveBeenCalledWith(0.23);
    expect(filter.type).toBe("lowpass");
    expect(filter.frequency.setValueAtTime).toHaveBeenCalledWith(320, 0);
    audio.setVolume(0.5);
    audio.play({ ...cue, sequence: 2, kind: "enemy" });
    vi.advanceTimersByTime(403);
    expect(oscillator.type).toBe("square");
    expect(gain.gain.exponentialRampToValueAtTime).toHaveBeenCalledWith(
      0.07,
      0.006,
    );
    expect(filter.type).toBe("bandpass");
    expect(filter.frequency.setValueAtTime).toHaveBeenCalledWith(920, 0);
    audio.dispose();
    expect(noiseSource.disconnect).toHaveBeenCalled();
    expect(filter.disconnect).toHaveBeenCalled();
  });

  it("keeps only the latest cue while a gesture-triggered resume is pending", async () => {
    vi.useFakeTimers();
    let resolveResume!: () => void;
    const resumed = new Promise<void>((resolve) => {
      resolveResume = resolve;
    });
    const oscillator = {
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
    };
    const gain = {
      gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
      connect: vi.fn(),
      disconnect: vi.fn(),
    };
    const context = {
      state: "suspended",
      currentTime: 0,
      destination: {},
      createOscillator: vi.fn(() => oscillator),
      createGain: vi.fn(() => gain),
      close: vi.fn(() => Promise.resolve()),
      resume: vi.fn(() => resumed),
    };
    const constructor = vi.fn(function AudioContextMock() {
      return context;
    });
    priorWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: { AudioContext: constructor },
    });
    const audio = createCombatAudio();
    audio.unlock();
    audio.play({ ...cue, sequence: 2 });
    audio.play({ ...cue, sequence: 3, kind: "enemy", heavy: true }, true);
    expect(context.createOscillator).not.toHaveBeenCalled();
    context.state = "running";
    resolveResume();
    await Promise.resolve();
    await Promise.resolve();
    vi.advanceTimersByTime(125);
    expect(context.createOscillator).toHaveBeenCalledTimes(1);
    expect(oscillator.frequency.setValueAtTime).toHaveBeenCalledWith(105, 0);
    // A running context can accept a new cue before the resume promise drains.
    context.state = "suspended";
    audio.unlock();
    audio.play({ ...cue, sequence: 4 }, true);
    context.state = "running";
    audio.play({ ...cue, sequence: 5, kind: "enemy", heavy: true }, true);
    await Promise.resolve();
    await Promise.resolve();
    vi.advanceTimersByTime(125);
    expect(context.createOscillator).toHaveBeenCalledTimes(2);
    audio.dispose();
  });

  it.each(["mute", "dispose"] as const)(
    "cancels a queued cue when %s happens before resume",
    async (action) => {
      let resolveResume!: () => void;
      const resumed = new Promise<void>((resolve) => {
        resolveResume = resolve;
      });
      const context = {
        state: "suspended",
        currentTime: 0,
        destination: {},
        createOscillator: vi.fn(),
        createGain: vi.fn(),
        close: vi.fn(() => Promise.resolve()),
        resume: vi.fn(() => resumed),
      };
      const constructor = vi.fn(function AudioContextMock() {
        return context;
      });
      priorWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
      Object.defineProperty(globalThis, "window", {
        configurable: true,
        value: { AudioContext: constructor },
      });
      const audio = createCombatAudio();
      audio.unlock();
      audio.play(cue);
      if (action === "mute") audio.setMuted(true);
      else audio.dispose();
      context.state = "running";
      resolveResume();
      await Promise.resolve();
      await Promise.resolve();
      expect(context.createOscillator).not.toHaveBeenCalled();
      if (action === "mute") audio.dispose();
    },
  );
});
