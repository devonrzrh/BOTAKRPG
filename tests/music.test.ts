import { afterEach, describe, expect, it, vi } from "vitest";
import {
  chooseMusic,
  createMusic,
  DUCKED_GAIN,
  fadeDuration,
  MUSIC_TRACKS,
  READING_GAIN,
  trackLevel,
} from "../src/game/music";

const calm = {
  intake: false,
  panel: null,
  reading: false,
  boss: false,
  dialogue: false,
};

describe("music direction", () => {
  it("stays silent during intake", () => {
    expect(chooseMusic({ ...calm, intake: true })).toEqual({
      track: null,
      gain: 0,
    });
  });

  it("routes each screen to its own score", () => {
    expect(chooseMusic({ ...calm, panel: "battle" }).track).toBe("battle");
    expect(chooseMusic({ ...calm, panel: "battle", boss: true }).track).toBe(
      "boss",
    );
    expect(chooseMusic({ ...calm, panel: "puzzles" }).track).toBe("puzzle");
    expect(chooseMusic({ ...calm, panel: "maze" }).track).toBe("puzzle");
    expect(chooseMusic({ ...calm, panel: "garden" }).track).toBe("puzzle");
    expect(chooseMusic({ ...calm, panel: "settings" }).track).toBe("menu");
    expect(chooseMusic(calm).track).toBe("menu");
  });

  it("keeps the menu score for reading, only quieter", () => {
    expect(chooseMusic({ ...calm, reading: true })).toEqual({
      track: "menu",
      gain: READING_GAIN,
    });
    expect(chooseMusic({ ...calm, panel: "library" }).gain).toBe(READING_GAIN);
    expect(MUSIC_TRACKS).not.toHaveProperty("library");
  });

  it("ducks dialogue and cutscenes without stopping the score", () => {
    const ducked = chooseMusic({ ...calm, panel: "battle", dialogue: true });
    expect(ducked.track).toBe("battle");
    expect(ducked.gain).toBe(DUCKED_GAIN);
  });

  it("keeps ambient under battle and honours the volume slider", () => {
    expect(trackLevel("menu", 0.8)).toBeLessThan(trackLevel("battle", 0.8));
    expect(trackLevel("battle", 0.8)).toBeLessThan(trackLevel("boss", 0.8));
    expect(trackLevel("menu", 0)).toBe(0);
    expect(trackLevel("menu", 2)).toBe(MUSIC_TRACKS.menu.gain);
    expect(trackLevel("boss", 0.5, DUCKED_GAIN)).toBeCloseTo(
      0.5 * MUSIC_TRACKS.boss.gain * DUCKED_GAIN,
    );
  });

  it("cuts battles in and lets ambient crossfade", () => {
    expect(fadeDuration("battle", "menu")).toBe(420);
    expect(fadeDuration("boss", "battle")).toBe(420);
    expect(fadeDuration("menu", "battle")).toBe(1500);
    expect(fadeDuration("puzzle", "menu")).toBe(1100);
    expect(fadeDuration(null, "menu")).toBe(1100);
  });
});

describe("music director", () => {
  const restore: Array<[string, unknown]> = [];
  afterEach(() => {
    vi.useRealTimers();
    while (restore.length) {
      const [key, value] = restore.pop()!;
      if (value === undefined) Reflect.deleteProperty(globalThis, key);
      else Object.defineProperty(globalThis, key, { value, configurable: true });
    }
  });

  type FakeAudio = {
    src: string;
    currentTime: number;
    volume: number;
    paused: boolean;
    play: ReturnType<typeof vi.fn>;
    pause: ReturnType<typeof vi.fn>;
    load: ReturnType<typeof vi.fn>;
    removeAttribute: ReturnType<typeof vi.fn>;
  };

  function installDom(allowPlay = true) {
    const gate = { allow: allowPlay };
    const instances: FakeAudio[] = [];
    const listeners = new Map<string, Set<EventListener>>();
    class FakeAudioImpl implements FakeAudio {
      src = "";
      currentTime = 0;
      loop = false;
      preload = "";
      volume = 0;
      paused = true;
      play = vi.fn(() => {
        if (!gate.allow) return Promise.reject(new Error("blocked"));
        this.paused = false;
        return Promise.resolve();
      });
      pause = vi.fn(() => {
        this.paused = true;
      });
      load = vi.fn();
      removeAttribute = vi.fn((name: string) => {
        if (name === "src") this.src = "";
      });
      constructor() {
        instances.push(this);
      }
    }
    for (const key of ["window", "document", "Audio"]) {
      restore.push([key, (globalThis as Record<string, unknown>)[key]]);
    }
    Object.defineProperty(globalThis, "Audio", {
      value: FakeAudioImpl,
      configurable: true,
    });
    Object.defineProperty(globalThis, "window", {
      configurable: true,
      value: {
        addEventListener(type: string, fn: EventListener) {
          const set = listeners.get(type) ?? new Set();
          set.add(fn);
          listeners.set(type, set);
        },
        removeEventListener(type: string, fn: EventListener) {
          listeners.get(type)?.delete(fn);
        },
      },
    });
    const doc = {
      hidden: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    Object.defineProperty(globalThis, "document", {
      configurable: true,
      value: doc,
    });
    return { gate, instances, listeners, doc };
  }

  const flush = async () => {
    await Promise.resolve();
    await Promise.resolve();
  };

  it("crossfades overlapping tracks and settles on the new level", async () => {
    vi.useFakeTimers();
    const { instances } = installDom();
    const music = createMusic();
    music.setTrack("menu");
    expect(instances).toHaveLength(1);
    expect(instances[0].src).toContain("ost_menu.mp3");
    expect(instances[0].play).toHaveBeenCalled();
    vi.advanceTimersByTime(3000);
    expect(instances[0].volume).toBeCloseTo(trackLevel("menu", 0.55), 2);

    music.setTrack("battle");
    vi.advanceTimersByTime(180);
    const battle = instances.find((audio) =>
      audio.src.includes("ost_battle"),
    )!;
    expect(instances[0].volume).toBeGreaterThan(0);
    expect(battle.volume).toBeGreaterThan(0);
    vi.advanceTimersByTime(3000);
    expect(instances[0].volume).toBe(0);
    expect(instances[0].paused).toBe(true);
    expect(battle.volume).toBeCloseTo(trackLevel("battle", 0.55), 2);
    music.dispose();
  });

  it("pauses and resumes ambient where it left off", () => {
    vi.useFakeTimers();
    const { instances } = installDom();
    const music = createMusic();
    music.setTrack("menu");
    vi.advanceTimersByTime(2000);
    const menu = instances[0];
    menu.currentTime = 18.5;
    music.setTrack("puzzle");
    vi.advanceTimersByTime(3000);
    expect(menu.paused).toBe(true);
    expect(menu.currentTime).toBe(18.5);
    music.setTrack("menu");
    vi.advanceTimersByTime(3000);
    expect(menu.currentTime).toBe(18.5);
    expect(menu.paused).toBe(false);
    music.dispose();
  });

  it("restarts battle music instead of resuming it", () => {
    vi.useFakeTimers();
    const { instances } = installDom();
    const music = createMusic();
    music.setTrack("menu");
    vi.advanceTimersByTime(2000);
    music.setTrack("battle");
    vi.advanceTimersByTime(2000);
    const battle = instances.find((audio) =>
      audio.src.includes("ost_battle"),
    )!;
    battle.currentTime = 42;
    music.setTrack("menu");
    vi.advanceTimersByTime(2000);
    expect(battle.paused).toBe(true);
    expect(battle.currentTime).toBe(42);
    music.setTrack("battle");
    expect(battle.currentTime).toBe(0);
    music.dispose();
  });

  it("silences at zero volume and returns to the same position", () => {
    vi.useFakeTimers();
    const { instances } = installDom();
    const music = createMusic();
    music.setTrack("menu");
    vi.advanceTimersByTime(2000);
    const menu = instances[0];
    menu.currentTime = 9;
    music.setVolume(0);
    vi.advanceTimersByTime(1000);
    expect(menu.volume).toBe(0);
    expect(menu.paused).toBe(true);
    music.setVolume(0.8);
    vi.advanceTimersByTime(1000);
    expect(menu.paused).toBe(false);
    expect(menu.currentTime).toBe(9);
    expect(menu.volume).toBeCloseTo(trackLevel("menu", 0.8), 2);
    music.dispose();
  });

  it("waits for a gesture when the browser blocks autoplay", async () => {
    vi.useFakeTimers();
    const { gate, listeners, instances, doc } = installDom(false);
    const music = createMusic();
    music.setTrack("menu");
    vi.advanceTimersByTime(200);
    await flush();
    expect(instances[0].play).toHaveBeenCalled();
    expect(listeners.get("pointerdown")?.size).toBe(1);
    expect(doc.addEventListener).toHaveBeenCalledWith(
      "visibilitychange",
      expect.any(Function),
    );
    gate.allow = true;
    [...(listeners.get("pointerdown") ?? [])].forEach((fn) =>
      fn(new Event("pointerdown")),
    );
    await flush();
    expect(listeners.get("pointerdown")?.size).toBe(0);
    vi.advanceTimersByTime(1000);
    expect(instances[0].paused).toBe(false);
    music.dispose();
  });

  it("pauses while the tab is hidden and resumes when visible", () => {
    vi.useFakeTimers();
    const { instances, doc } = installDom();
    const music = createMusic();
    music.setTrack("menu");
    vi.advanceTimersByTime(1000);
    expect(instances[0].paused).toBe(false);
    const handler = doc.addEventListener.mock.calls.find(
      ([type]) => type === "visibilitychange",
    )![1] as () => void;
    doc.hidden = true;
    handler();
    expect(instances[0].paused).toBe(true);
    doc.hidden = false;
    handler();
    vi.advanceTimersByTime(500);
    expect(instances[0].paused).toBe(false);
    music.dispose();
    expect(doc.removeEventListener).toHaveBeenCalled();
    expect(instances[0].pause).toHaveBeenCalled();
  });
});
