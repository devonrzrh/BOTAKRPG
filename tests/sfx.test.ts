import { afterEach, describe, expect, it, vi } from "vitest";
import { evadeSoundCues } from "../src/game/sfx";
import { createSoundManager, SFX_CUES, SFX_GAINS } from "../src/game/soundManager";
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
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("plays mapped clips after unlock and shares volume and cleanup", () => {
    type Clip = {
      src: string;
      volume: number;
      playbackRate: number;
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
    vi.stubGlobal("Audio", AudioMock);
    vi.spyOn(Math, "random").mockReturnValue(0.5);

    const names = Object.keys(SFX_CUES) as (keyof typeof SFX_CUES)[];
    const sfx = createSoundManager();
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
    expect(cameraSwoosh?.volume).toBeCloseTo(0.65 * 0.2);
    expect(SFX_CUES.clue.source).not.toBe(SFX_CUES.levelUp.source);
    expect(SFX_GAINS.hover).toBeLessThan(SFX_GAINS.click!);

    sfx.setVolume(0.25);
    names.slice(-12).forEach((name, i) =>
      expect(clips.slice(-12)[i].volume).toBeCloseTo(
        0.25 * (SFX_GAINS[name] ?? 1),
      ),
    );
    sfx.setVolume(0);
    expect(
      clips.slice(-12).every((clip) => clip.pause.mock.calls.length > 0),
    ).toBe(true);
    sfx.setVolume(0.65);
    sfx.play("battleInsight");
    const stopStrike = sfx.play("battleStrike");
    const strike = clips.at(-1)!;
    const other = clips.at(-2)!;
    stopStrike?.();
    expect(strike.pause).toHaveBeenCalledOnce();
    expect(other.pause).not.toHaveBeenCalled();
    sfx.dispose();
  });

  it("varies repeated cue pitch and level by a small amount", () => {
    type Clip = {
      volume: number;
      playbackRate: number;
      play: ReturnType<typeof vi.fn>;
      pause: ReturnType<typeof vi.fn>;
      removeAttribute: ReturnType<typeof vi.fn>;
      load: ReturnType<typeof vi.fn>;
      addEventListener: ReturnType<typeof vi.fn>;
      preload: string;
    };
    const clips: Clip[] = [];
    class AudioMock {
      volume = 1;
      playbackRate = 1;
      preload = "";
      play = vi.fn(() => Promise.resolve());
      pause = vi.fn();
      removeAttribute = vi.fn();
      load = vi.fn();
      addEventListener = vi.fn();
      constructor() {
        clips.push(this);
      }
    }
    vi.stubGlobal("Audio", AudioMock);
    vi.useFakeTimers();
    vi.spyOn(Math, "random")
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0)
      .mockReturnValueOnce(0.99)
      .mockReturnValueOnce(0.99);
    const sfx = createSoundManager();
    sfx.unlock();
    sfx.play("click");
    vi.advanceTimersByTime(91);
    sfx.play("click");
    expect(clips[0].playbackRate).toBe(0.98);
    expect(clips[1].playbackRate).toBeCloseTo(1.0196);
    expect(clips[1].volume).toBeGreaterThan(clips[0].volume);
    sfx.dispose();
  });
});
