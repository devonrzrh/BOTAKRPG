import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BATTLE_CUE_PREVIEWS, createCombatAudio } from "../src/game/combatAudio";
import { combatContactMs, type BattleCue } from "../src/game/combatPresentation";

const strike = { ...BATTLE_CUE_PREVIEWS[0].cue, sequence: 1 };

class AudioMock {
  volume = 1;
  playbackRate = 1;
  preload = "";
  play = vi.fn(() => Promise.resolve());
  pause = vi.fn();
  removeAttribute = vi.fn();
  load = vi.fn();
  addEventListener = vi.fn();

  constructor(readonly src: string) {
    clips.push(this);
  }
}

const clips: AudioMock[] = [];
const files = [
  "impactMetal_medium_000", "laserSmall_000", "forceField_000", "laserRetro_000",
  "lowDown", "impactPunch_medium_001", "impactPunch_heavy_000", "metalClick",
  "phaserDown1", "impactGlass_medium_000", "impactGlass_heavy_000",
  "explosionCrunch_000",
];

describe("combat audio", () => {
  beforeEach(() => {
    clips.length = 0;
    vi.useFakeTimers();
    vi.stubGlobal("Audio", AudioMock);
    vi.spyOn(Math, "random").mockReturnValue(0.5);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("plays a bundled OGG for every battle cue preview", () => {
    const audio = createCombatAudio();
    audio.unlock();
    BATTLE_CUE_PREVIEWS.forEach(({ cue }, sequence) => {
      audio.play({ ...cue, sequence });
      vi.advanceTimersByTime(403);
    });
    expect(clips.map(({ src }) => src.split("/").pop())).toEqual(
      files.map((file) => `${file}.ogg`),
    );
    expect(clips.every(({ play }) => play.mock.calls.length === 1)).toBe(true);
    audio.dispose();
  });

  it("plays after a gesture at the impact point and ignores stale cues", () => {
    const audio = createCombatAudio();
    audio.play(strike);
    vi.advanceTimersByTime(1000);
    expect(clips).toHaveLength(0);
    audio.unlock();
    audio.play(strike);
    audio.play(strike);
    vi.advanceTimersByTime(207);
    expect(clips).toHaveLength(0);
    vi.advanceTimersByTime(1);
    expect(clips).toHaveLength(1);

    audio.play({ ...strike, sequence: 2, kind: "enemy", heavy: true }, true);
    vi.advanceTimersByTime(123);
    expect(clips).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(clips[1]?.src).toContain("impactPunch_heavy_000.ogg");
    audio.play(strike);
    vi.advanceTimersByTime(1000);
    expect(clips).toHaveLength(2);
    audio.dispose();
  });

  it("keeps the final hit sound and plays no effect for pacification", () => {
    const audio = createCombatAudio();
    audio.unlock();
    const pacify: BattleCue = { ...strike, kind: "recover", special: "pacify" };
    audio.play(pacify);
    audio.play({ ...strike, sequence: 2, kind: "poison", defeated: true });
    audio.play({ ...strike, sequence: 3, special: "finisher", defeated: true });
    vi.advanceTimersByTime(208);
    expect(clips.map(({ src }) => src.split("/").pop())).toEqual([
      "lowDown.ogg",
      "explosionCrunch_000.ogg",
    ]);
    audio.dispose();
  });

  it.each([false, true])("plays at quiz projectile contact with reduced motion %s", (reducedMotion) => {
    const audio = createCombatAudio();
    audio.unlock();
    const attack = { ...strike, quizOrigin: { x: 0.5, y: 0.7 } };
    audio.play(attack, reducedMotion);
    vi.advanceTimersByTime(combatContactMs(attack, reducedMotion) - 1);
    expect(clips).toHaveLength(0);
    vi.advanceTimersByTime(1);
    expect(clips).toHaveLength(1);
    audio.dispose();
  });

  it.each(["mute", "zero volume", "dispose"])(
    "stops active and pending clips on %s",
    (action) => {
      const audio = createCombatAudio();
      audio.setVolume(0.5);
      audio.unlock();
      audio.play(strike);
      vi.advanceTimersByTime(208);
      expect(clips[0]?.volume).toBeCloseTo(0.5 * 0.65);
      audio.play({ ...strike, sequence: 2 });

      if (action === "mute") audio.setMuted(true);
      if (action === "zero volume") audio.setVolume(0);
      if (action === "dispose") audio.dispose();
      expect(clips[0]?.pause).toHaveBeenCalledOnce();
      expect(vi.getTimerCount()).toBe(0);
      vi.advanceTimersByTime(1000);
      expect(clips).toHaveLength(1);

      if (action === "mute") audio.setMuted(false);
      if (action === "zero volume") audio.setVolume(0.5);
      audio.play({ ...strike, sequence: 3 });
      vi.advanceTimersByTime(208);
      expect(clips).toHaveLength(action === "dispose" ? 1 : 2);
      audio.dispose();
    },
  );
});
