import { useEffect, useRef, useState } from "react";
import { preload } from "react-dom";
import { ArrowRight, SkipForward } from "lucide-react";
import type { Story } from "../content/schema";
import { personalizeText } from "../game/player";
import { useGameSound } from "./GameSound";
import "./Cutscene.css";

const shotUrl = (shot: string) =>
  `${import.meta.env.BASE_URL}cutscenes/${shot}.webp`;

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
  const [{ frame, step }, setPosition] = useState({ frame: 0, step: 0 });
  const nextButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    nextButton.current?.focus();
    return () => {
      if (previous?.isConnected) previous.focus();
    };
  }, []);

  const current = story.frames[frame];
  const next = story.frames[frame + 1];
  const chasing = current.steps > 1;
  if (next) preload(shotUrl(next.shot), { as: "image" });

  const advance = () => {
    if (step + 1 < current.steps) {
      sound("pursuit");
      setPosition({ frame, step: step + 1 });
    } else if (next) {
      sound(story.visual === "chase" && !chasing ? "pursuit" : "connect");
      setPosition({ frame: frame + 1, step: 0 });
    } else {
      sound("dialogue");
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
        <img
          key={current.shot}
          src={shotUrl(current.shot)}
          alt={current.alt}
          style={{
            translate: `${step * -1}% 0`,
            scale: 1 + step * 0.035,
          }}
        />
        <button className="cutscene-skip" onClick={onFinish}>
          <SkipForward size={16} aria-hidden="true" />
          Skip scene
        </button>
      </div>
      <div className="prologue-copy">
        <div className="cutscene-caption" aria-live="polite" aria-atomic="true">
          <p className="cutscene-time">{current.time}</p>
          <h1>{personalizeText(current.heading, savedName)}</h1>
          <p>{personalizeText(current.body, savedName)}</p>
        </div>
        <div className="cutscene-action">
          <button ref={nextButton} className="primary" onClick={advance}>
            {next
              ? chasing
                ? "Give chase"
                : "Continue"
              : story.visual === "network"
                ? "Enter network"
                : "Return to office"}
            <ArrowRight size={18} aria-hidden="true" />
          </button>
          {chasing && (
            <progress
              value={step + 1}
              max={current.steps}
              aria-label="Pursuit progress"
            />
          )}
        </div>
      </div>
    </section>
  );
}
