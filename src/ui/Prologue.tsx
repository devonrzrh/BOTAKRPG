import { useEffect, useRef, useState } from "react";
import { ArrowRight, SkipForward } from "lucide-react";
import type { Story } from "../content/schema";
export function Prologue({
  story,
  onFinish,
}: {
  story: Story;
  onFinish: () => void;
}) {
  const [frame, setFrame] = useState(0),
    [steps, setSteps] = useState(0);
  const dialog = useRef<HTMLElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialog.current?.querySelector<HTMLButtonElement>(".primary")?.focus();
    return () => previous?.focus();
  }, []);
  const advance = () => {
    if (frame === 1) {
      if (steps >= 5) setFrame(2);
      else setSteps((n) => n + 1);
    } else if (frame === 2) onFinish();
    else setFrame(1);
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
      className="prologue"
      role="dialog"
      aria-modal="true"
      aria-label="Prologue: the pursuit"
    >
      <header>
        <span className="case-wordmark">NULL / TRACE</span>
        <button onClick={onFinish}>
          <SkipForward size={14} />
          Skip prologue
        </button>
      </header>
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
      <div className="prologue-copy">
        <div>
          <span className="section-eyebrow">
            CASE FILE 007 · {String(frame + 1).padStart(2, "0")} / 03
          </span>
          <h1>{current.heading}</h1>
          <p>{current.body}</p>
        </div>
        <button className="primary" onClick={advance}>
          {frame === 0
            ? "Begin pursuit"
            : frame === 1
              ? "Continue pursuit"
              : "Open desk"}
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
