import { afterEach, describe, expect, it, vi } from "vitest";
import { createSfx, evadeSoundCues, type SfxName } from "../src/game/sfx";
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

describe("bundled interface SFX", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("plays mapped clips after unlock and shares volume and cleanup", () => {
    type Clip = {
      src: string;
      volume: number;
      preload: string;
      play: ReturnType<typeof vi.fn>;
      pause: ReturnType<typeof vi.fn>;
      removeAttribute: ReturnType<typeof vi.fn>;
      load: ReturnType<typeof vi.fn>;
      addEventListener: ReturnType<typeof vi.fn>;
    };
    const clips: Clip[] = [];
    class AudioMock {
      volume = 1;
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
    vi.stubGlobal("Audio", AudioMock);

    const names: SfxName[] = [
      "click",
      "open",
      "close",
      "page",
      "bookOpen",
      "bookClose",
      "move",
      "blocked",
      "puzzleAction",
      "success",
      "error",
      "clue",
      "levelUp",
      "dialogue",
      "speechHuman",
      "speechRobot",
      "speechEcho",
      "speechSoft",
      "connect",
      "pursuit",
      "train",
      "scan",
      "hazard",
      "dodge",
      "hit",
      "cameraMove",
    ];
    const sfx = createSfx();
    sfx.play("bookOpen");
    expect(clips).toHaveLength(0);

    sfx.unlock();
    for (const name of names) sfx.play(name);
    expect(clips).toHaveLength(names.length);
    expect(clips.every((clip) => /\.(ogg|mp3)$/.test(clip.src))).toBe(true);
    expect(
      clips.find((clip) => clip.src.includes("bookOpen.ogg"))?.play,
    ).toHaveBeenCalledOnce();
    const cameraSwoosh = clips.find((clip) => clip.src.includes("swoosh.mp3"));
    expect(cameraSwoosh?.play).toHaveBeenCalledOnce();
    expect(cameraSwoosh?.volume).toBeCloseTo(0.65 * 0.12);

    sfx.setVolume(0.25);
    for (const clip of clips.slice(-12))
      expect(clip.volume).toBeCloseTo(
        0.25 * (clip.src.includes("swoosh.mp3") ? 0.12 : 1),
      );
    sfx.setVolume(0);
    expect(
      clips.slice(-12).every((clip) => clip.pause.mock.calls.length > 0),
    ).toBe(true);
    sfx.dispose();
  });
});
