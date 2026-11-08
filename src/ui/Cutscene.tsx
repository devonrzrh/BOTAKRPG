import { useEffect, useRef, useState } from "react";
import { ArrowRight, SkipForward } from "lucide-react";
import type { Story } from "../content/schema";
import { personalizeText } from "../game/player";
import { useGameSound } from "./GameSound";
export function Cutscene({
  story,
  savedName = "",
  onFinish,
}: {
  story: Story;
  savedName?: string;
  onFinish: () => void;
}) {
  const sound = useGameSound();
  const [frame, setFrame] = useState(0),
    [steps, setSteps] = useState(0);
  const dialog = useRef<HTMLElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialog.current?.querySelector<HTMLButtonElement>(".primary")?.focus();
    return () => previous?.focus();
  }, []);
  const advance = () => {
    sound(
      story.visual === "network"
        ? "connect"
        : steps + 1 >= story.frames[frame].steps && frame + 1 === 2
          ? "connect"
          : frame < 2 && story.frames[frame].steps > 1
            ? "pursuit"
            : "dialogue",
    );
    if (steps + 1 < story.frames[frame].steps) setSteps((n) => n + 1);
    else if (frame + 1 < story.frames.length) {
      setFrame((n) => n + 1);
      setSteps(0);
    } else onFinish();
  };
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.key === "Tab") {
        const buttons = [
          ...(dialog.current?.querySelectorAll<HTMLButtonElement>("button") ??
            []),
        ];
        const index = buttons.indexOf(
          document.activeElement as HTMLButtonElement,
        );
        event.preventDefault();
        buttons[
          (index + (event.shiftKey ? -1 : 1) + buttons.length) % buttons.length
        ]?.focus();
        return;
      }
      if (
        event.target instanceof HTMLButtonElement &&
        event.key !== "ArrowRight"
      )
        return;
      if (["ArrowRight", " ", "Enter"].includes(event.key)) {
        event.preventDefault();
        advance();
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [frame, steps]);
  const current = story.frames[frame];
  return (
    <section
      ref={dialog}
      className={`prologue cutscene-${story.visual}`}
      role="dialog"
      aria-modal="true"
      aria-label={story.title}
    >
      <header>
        <span className="case-wordmark">NULL / TRACE</span>
        <button onClick={onFinish}>
          <SkipForward size={14} />
          Skip scene
        </button>
      </header>
      {story.visual === "network" ? (
        <div
          className="network-cutscene"
          aria-label="A terminal connecting to the network"
        >
          <div className="connection-grid" />
          <div className="connection-node">
            {frame === 0 ? "CONNECTING" : "GATEWAY 01"}
          </div>
          <span>{current.time}</span>
        </div>
      ) : (
        <div
          className={`chase-scene chase-frame-${frame}`}
          aria-label={
            frame === 2
              ? "An empty robot chassis beside a network terminal"
              : "A detective pursuing a robot across a rain-soaked city"
          }
        >
          <div className="city-moon" />
          <div className="city-skyline">
            {Array.from({ length: 14 }, (_, i) => (
              <span
                key={i}
                style={{
                  height: `${80 + ((i * 47) % 150)}px`,
                  width: `${35 + ((i * 13) % 35)}px`,
                }}
              />
            ))}
          </div>
          <div className="rain-lines" />
          <div className="chase-ground" />
          <div className="street-sign">
            LOWER CITY <b>SECTOR 07</b>
          </div>
          <div
            className="chase-person detective"
            style={{ left: `${22 + steps * 4}%` }}
          >
            <i />
            <span />
            <b />
          </div>
          <div
            className="chase-person fugitive"
            style={{ left: frame === 2 ? "74%" : `${57 + steps * 4}%` }}
          >
            <i />
            <span />
            <b />
          </div>
          {frame === 2 && (
            <div className="empty-signal">
              CONNECTION TRANSFERRED
              <br />
              <strong>DESTINATION UNKNOWN</strong>
            </div>
          )}
          <span className="chase-time">{current.time}</span>
          <span className="chase-caption">
            {frame === 1
              ? `PURSUIT ${steps + 1}/6 · PRESS → OR CONTINUE`
              : frame === 2
                ? "TRANSFER COMPLETE"
                : "PROLOGUE"}
          </span>
        </div>
      )}
      <div className="prologue-copy">
        <div>
          <span className="section-eyebrow">
            CASE 007 · {frame + 1} / {story.frames.length}
          </span>
          <h1>{personalizeText(current.heading, savedName)}</h1>
          <p>{personalizeText(current.body, savedName)}</p>
        </div>
        <button className="primary" onClick={advance}>
          {frame + 1 === story.frames.length
            ? story.visual === "network"
              ? "Enter network"
              : "Return home"
            : current.steps > 1
              ? "Continue pursuit"
              : "Continue"}
          <ArrowRight size={17} />
        </button>
      </div>
      <footer>
        <span>
          {story.frames.map((_, i) => (
            <i key={i} className={i === frame ? "active" : ""} />
          ))}
        </span>
      </footer>
    </section>
  );
}
