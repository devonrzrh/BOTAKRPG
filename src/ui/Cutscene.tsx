import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { preload } from "react-dom";
import { ArrowRight, Pause, Play, SkipForward } from "lucide-react";
import type { Story } from "../content/schema";
import type { RendererPreference } from "../game/contracts";
import { personalizeText } from "../game/player";
import type { SfxName } from "../game/soundManager";
import { useGameSound } from "./GameSound";
import "./Cutscene.css";

const CinematicCanvas = lazy(() => import("../world/CinematicCanvas"));
const shotUrl = (shot: string) =>
  `${import.meta.env.BASE_URL}cutscenes/${shot}.webp`;

const effects: Partial<Record<string, [atMs: number, sound: SfxName][]>> = {
  "transit-platform": [
    [1880, "cinematicTrain"],
    [4170, "pursuit"],
    [4504, "pursuit"],
    [4838, "pursuit"],
  ],
  "rail-pursuit": [
    [1150, "cinematicTrain"],
    ...Array.from({ length: 13 }, (_, step): [number, SfxName] => [
      170 + step * 334,
      "pursuit",
    ]),
  ],
  "abandoned-chassis": [
    [440, "move"],
    [2550, "connect"],
  ],
  "evidence-board": [
    [850, "page"],
    [3350, "clue"],
  ],
  "echo-threshold": [
    [880, "open"],
    [2520, "connect"],
  ],
  "office-terminal": [
    [300, "click"],
    [490, "click"],
    [680, "click"],
    [1850, "connect"],
  ],
  "gateway-sentry": [
    [1150, "blocked"],
    [1660, "hazard"],
  ],
  "echo-isolation": [[4650, "close"]],
  "ledger-open": [[600, "page"]],
  "ledger-closed": [
    [1150, "page"],
    [2650, "bookClose"],
  ],
};

export function Cutscene({
  story,
  savedName = "",
  renderer,
  reducedMotion,
  onFinish,
}: {
  story: Story;
  savedName?: string;
  renderer: RendererPreference;
  reducedMotion: boolean;
  onFinish: () => void;
}) {
  const sound = useGameSound();
  const [{ frame, line }, setPosition] = useState({ frame: 0, line: 0 });
  const [paused, setPaused] = useState(false);
  const [systemReducedMotion, setSystemReducedMotion] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const elapsed = useRef(0);
  const readyShot = useRef<string | null>(null);
  const stops = useRef<(() => void)[]>([]);
  const nextButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setSystemReducedMotion(query.matches);
    query.addEventListener("change", update);
    nextButton.current?.focus();
    return () => {
      query.removeEventListener("change", update);
      if (previous?.isConnected) previous.focus();
    };
  }, []);

  const still = reducedMotion || systemReducedMotion;
  const current = story.frames[frame];
  const next = story.frames[frame + 1];
  const cue = current.dialogue[line];
  const nextLine = line + 1 < current.dialogue.length;
  const cueStart = current.dialogue
    .slice(0, line)
    .reduce((time, entry) => time + entry.holdMs, 0);
  const cueEnd = cueStart + cue.holdMs;
  if (next) preload(shotUrl(next.shot), { as: "image" });

  useEffect(() => {
    return () => {
      for (const stop of stops.current) stop();
      stops.current = [];
    };
  }, [frame, paused, still]);

  useEffect(() => {
    if (paused || still) return;
    let request: number;
    let previous: number | undefined;
    let waitingFrom: number | undefined;
    const tick = (now: number) => {
      waitingFrom ??= now;
      // Give the live shot a head start and keep the poster playable on a slow renderer.
      if (
        elapsed.current === 0 &&
        readyShot.current !== current.shot &&
        now - waitingFrom < 750
      ) {
        request = requestAnimationFrame(tick);
        return;
      }
      // Bound the delta so returning to the tab never skips dialogue.
      const delta = previous === undefined ? 0 : Math.min(100, now - previous);
      previous = now;
      const from = elapsed.current;
      elapsed.current = Math.min(cueEnd, from + delta);
      for (const [at, effect] of effects[current.shot] ?? []) {
        if (from < at && at <= elapsed.current) {
          const stop = sound(effect);
          if (stop) stops.current.push(stop);
        }
      }
      if (elapsed.current < cueEnd) {
        request = requestAnimationFrame(tick);
      } else if (nextLine) {
        setPosition({ frame, line: line + 1 });
      } else if (next) {
        elapsed.current = 0;
        setPosition({ frame: frame + 1, line: 0 });
      }
    };
    request = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(request);
  }, [current.shot, cueEnd, frame, line, next, nextLine, paused, sound, still]);

  const advance = () => {
    sound("dialogue");
    if (nextLine) {
      elapsed.current = cueEnd;
      setPosition({ frame, line: line + 1 });
    } else if (next) {
      elapsed.current = 0;
      setPosition({ frame: frame + 1, line: 0 });
    } else {
      onFinish();
    }
  };

  return (
    <section
      className="prologue"
      role="dialog"
      aria-modal="true"
      aria-label={story.title}
      onKeyDown={(event) => {
        if (event.key === "Tab") {
          const buttons = [...event.currentTarget.querySelectorAll("button")];
          const index = buttons.indexOf(
            document.activeElement as HTMLButtonElement,
          );
          event.preventDefault();
          buttons[
            (index + (event.shiftKey ? -1 : 1) + buttons.length) %
              buttons.length
          ]?.focus();
        } else if (event.key === "ArrowRight") {
          event.preventDefault();
          if (!event.repeat) advance();
        }
      }}
    >
      <div className="cutscene-picture">
        <img key={current.shot} src={shotUrl(current.shot)} alt={current.alt} />
        {!still && (
          <Suspense fallback={null}>
            <CinematicCanvas
              key={renderer}
              shot={current.shot}
              renderer={renderer}
              elapsed={elapsed}
              readyShot={readyShot}
            />
          </Suspense>
        )}
      </div>
      <p className="cutscene-location">{current.time}</p>
      <button className="cutscene-skip" onClick={onFinish}>
        <SkipForward size={16} aria-hidden="true" />
        Skip scene
      </button>
      <div className="cutscene-footer">
        <div className="cutscene-caption" aria-live="polite" aria-atomic="true">
          <p className="cutscene-speaker">
            {personalizeText(cue.speaker, savedName)}
          </p>
          <p>{personalizeText(cue.text, savedName)}</p>
        </div>
        <div className="cutscene-actions">
          {!still && (
            <button
              className="cutscene-pause"
              aria-label={paused ? "Play scene" : "Pause scene"}
              title={paused ? "Play scene" : "Pause scene"}
              onClick={() => setPaused(!paused)}
            >
              {paused ? (
                <Play size={18} aria-hidden="true" />
              ) : (
                <Pause size={18} aria-hidden="true" />
              )}
            </button>
          )}
          <button
            ref={nextButton}
            className="primary"
            onClick={advance}
            data-sfx-silent
          >
            {nextLine
              ? "Next line"
              : next
                ? "Next shot"
                : story.trigger
                  ? "Continue"
                  : story.visual === "network"
                    ? "Enter network"
                    : "Return to office"}
            <ArrowRight size={18} aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}
