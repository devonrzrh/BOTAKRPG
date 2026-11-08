import battleSource from "../../sounds/ost_battle.mp3?url";
import bossSource from "../../sounds/ost_bossbattle.mp3?url";
import menuSource from "../../sounds/ost_menu.mp3?url";
import puzzleSource from "../../sounds/ost_puzzle.mp3?url";

export type MusicTrack = "menu" | "puzzle" | "battle" | "boss";

/** Relative loudness per setting. Ambient sits low; battles lead. */
export const MUSIC_TRACKS: Record<MusicTrack, { source: string; gain: number }> =
  {
    menu: { source: menuSource, gain: 0.5 },
    puzzle: { source: puzzleSource, gain: 0.44 },
    battle: { source: battleSource, gain: 0.62 },
    boss: { source: bossSource, gain: 0.72 },
  };

/** Dialogue and cutscenes duck the score instead of stopping it. */
export const DUCKED_GAIN = 0.38;
/** Reading uses the menu score, just further back. Library music is retired. */
export const READING_GAIN = 0.55;

/** Battles restart from the top; every other track resumes where it paused. */
export const RESTART_TRACKS: MusicTrack[] = ["battle", "boss"];

export interface MusicSituation {
  intake: boolean;
  panel: string | null;
  reading: boolean;
  boss: boolean;
  dialogue: boolean;
}

export interface MusicChoice {
  track: MusicTrack | null;
  gain: number;
}

/** Pick the score for the current screen and how loud it should sit. */
export function chooseMusic({
  intake,
  panel,
  reading,
  boss,
  dialogue,
}: MusicSituation): MusicChoice {
  if (intake) return { track: null, gain: 0 };
  const quiet = reading || panel === "library";
  const track: MusicTrack =
    panel === "battle"
      ? boss
        ? "boss"
        : "battle"
      : panel === "puzzles" || panel === "maze" || panel === "garden"
        ? "puzzle"
        : "menu";
  return {
    track,
    gain: dialogue ? DUCKED_GAIN : quiet ? READING_GAIN : 1,
  };
}

const clamp = (value: number) => Math.max(0, Math.min(1, value));

/** Master volume × track gain × situational gain. Slider 0 means silence. */
export function trackLevel(track: MusicTrack, volume: number, gain = 1) {
  return clamp(volume) * MUSIC_TRACKS[track].gain * clamp(gain);
}

/** Fade length for a transition. Battles cut in; ambient drifts. */
export function fadeDuration(
  next: MusicTrack | null,
  previous: MusicTrack | null,
) {
  const battle = (track: MusicTrack | null) =>
    track === "battle" || track === "boss";
  if (battle(next)) return 420;
  if (battle(previous)) return 1500;
  return 1100;
}

const FADE_TICK_MS = 40;

interface Voice {
  audio: HTMLAudioElement;
  level: number;
  from: number;
  to: number;
  startedAt: number;
  duration: number;
}

/**
 * Looping score with overlapping crossfades. Tracks are fetched once and
 * played from blob URLs, so download managers cannot grab the media requests.
 * Browsers block playback before a gesture, so the director waits for one.
 */
export function createMusic() {
  const voices = new Map<MusicTrack, Voice>();
  const sources = new Map<MusicTrack, string>();
  const loading = new Map<MusicTrack, Promise<string>>();
  const blobUrls: string[] = [];
  const cleanups: Array<() => void> = [];
  let volume = 0.55;
  let choice: MusicChoice = { track: null, gain: 0 };
  let reducedMotion = false;
  let disposed = false;
  let blocked = false;
  let fadeMs = 1100;
  let ticker: ReturnType<typeof setInterval> | null = null;

  const supported = () =>
    typeof window !== "undefined" && typeof Audio !== "undefined";
  const canStream =
    typeof fetch === "function" &&
    typeof location !== "undefined" &&
    typeof URL !== "undefined" &&
    typeof URL.createObjectURL === "function";

  const targetFor = (track: MusicTrack) =>
    track === choice.track ? trackLevel(track, volume, choice.gain) : 0;

  const stopUnlock = () => {
    while (cleanups.length) cleanups.pop()?.();
  };
  const startUnlock = () => {
    if (cleanups.length || typeof window === "undefined") return;
    const retry = () => {
      if (disposed) return stopUnlock();
      tryStart();
    };
    for (const type of ["pointerdown", "keydown", "touchstart"] as const) {
      window.addEventListener(type, retry);
      cleanups.push(() => window.removeEventListener(type, retry));
    }
  };

  const fetchSource = (track: MusicTrack): Promise<string> => {
    const cached = sources.get(track);
    if (cached) return Promise.resolve(cached);
    const pending = loading.get(track);
    if (pending) return pending;
    const fallback = MUSIC_TRACKS[track].source;
    if (!canStream) return Promise.resolve(fallback);
    const request = fetch(fallback, { cache: "force-cache" })
      .then((response) => {
        if (!response.ok) throw new Error(`Music request failed: ${track}`);
        return response.blob();
      })
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        blobUrls.push(url);
        sources.set(track, url);
        return url;
      })
      .catch(() => fallback);
    loading.set(track, request);
    return request;
  };

  const ensure = (track: MusicTrack): Voice | null => {
    if (!supported()) return null;
    const existing = voices.get(track);
    if (existing) return existing;
    const audio = new Audio();
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = 0;
    const voice: Voice = {
      audio,
      level: 0,
      from: 0,
      to: 0,
      startedAt: 0,
      duration: 0,
    };
    voices.set(track, voice);
    if (canStream) {
      void fetchSource(track).then((url) => {
        if (disposed || voices.get(track) !== voice) return;
        audio.src = url;
        wake();
      });
    } else {
      audio.src = MUSIC_TRACKS[track].source;
    }
    return voice;
  };

  const tryStart = () => {
    if (typeof document !== "undefined" && document.hidden) return false;
    let started = false;
    voices.forEach((voice, track) => {
      const { audio } = voice;
      if (targetFor(track) <= 0 || !audio.src || !audio.paused) return;
      const result = audio.play();
      started = true;
      if (!result?.catch) return;
      void result
        .then(() => {
          blocked = false;
          stopUnlock();
          warmRemaining();
        })
        .catch(() => {
          blocked = true;
          audio.pause();
          startUnlock();
        });
    });
    return started;
  };

  const ease = (t: number) => t * t * (3 - 2 * t);

  const tick = () => {
    const now = Date.now();
    voices.forEach((voice, track) => {
      const target = targetFor(track);
      if (voice.to !== target) {
        voice.from = voice.level;
        voice.to = target;
        voice.startedAt = now;
        voice.duration = reducedMotion ? 0 : fadeMs;
      }
      const progress =
        voice.duration <= 0
          ? 1
          : clamp((now - voice.startedAt) / voice.duration);
      voice.level =
        progress >= 1
          ? voice.to
          : voice.from + (voice.to - voice.from) * ease(progress);
      voice.audio.volume = clamp(voice.level);
      if (voice.level <= 0.002 && voice.to <= 0.002) {
        voice.level = 0;
        voice.audio.volume = 0;
        if (!voice.audio.paused) voice.audio.pause();
      } else if (voice.audio.paused && voice.to > 0.002 && !blocked) {
        tryStart();
      }
    });
    if (voices.size && [...voices.values()].every((v) => v.level === v.to)) {
      if (ticker) clearInterval(ticker);
      ticker = null;
    }
  };

  const wake = () => {
    if (disposed) return;
    if (!ticker) ticker = setInterval(tick, FADE_TICK_MS);
    tick();
  };

  let warmed = false;
  function warmRemaining() {
    if (warmed || disposed) return;
    warmed = true;
    (Object.keys(MUSIC_TRACKS) as MusicTrack[]).forEach((track) => ensure(track));
  }

  const onVisibility = () => {
    if (disposed) return;
    if (typeof document !== "undefined" && document.hidden) {
      voices.forEach((voice) => voice.audio.pause());
    } else if (!blocked) wake();
  };
  if (typeof document !== "undefined")
    document.addEventListener("visibilitychange", onVisibility);

  return {
    /** Switch score. Track `null` fades to silence. */
    setTrack(track: MusicTrack | null, gain = 1) {
      if (disposed) return;
      const previous = choice.track;
      choice = { track, gain: clamp(gain) };
      fadeMs = reducedMotion ? 0 : fadeDuration(track, previous);
      if (track) {
        const voice = ensure(track);
        if (voice && previous !== track && RESTART_TRACKS.includes(track)) {
          try {
            voice.audio.currentTime = 0;
          } catch {
            /* metadata not loaded yet; it starts at zero anyway */
          }
        }
      }
      wake();
    },
    setVolume(value: number) {
      if (disposed) return;
      volume = clamp(value);
      fadeMs = reducedMotion ? 0 : 220;
      wake();
    },
    setReducedMotion(value: boolean) {
      reducedMotion = value;
      if (value) {
        voices.forEach((voice) => {
          voice.from = voice.level;
          voice.duration = 0;
        });
      }
      wake();
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      if (ticker) clearInterval(ticker);
      ticker = null;
      stopUnlock();
      if (typeof document !== "undefined")
        document.removeEventListener("visibilitychange", onVisibility);
      voices.forEach(({ audio }) => {
        audio.pause();
        audio.removeAttribute("src");
        audio.load();
      });
      voices.clear();
      if (typeof URL !== "undefined" && URL.revokeObjectURL)
        blobUrls.forEach((url) => URL.revokeObjectURL(url));
      blobUrls.length = 0;
      sources.clear();
      loading.clear();
    },
  };
}
