import { useEffect, useId, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import type { Tutorial } from "../game/tutorials";
export function TutorialCard({
  tutorial,
  onClose,
  onSkipAll,
}: {
  tutorial: Tutorial;
  onClose: () => void;
  onSkipAll: () => void;
}) {
  const [step, setStep] = useState(0),
    card = useRef<HTMLElement>(null),
    titleId = useId();
  const current = tutorial.steps[step],
    last = step + 1 === tutorial.steps.length;
  useEffect(() => {
    card.current?.querySelector<HTMLButtonElement>(".primary")?.focus();
  }, [step]);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    return () => {
      if (previous?.isConnected) previous.focus();
    };
  }, []);
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onClose();
      }
      if (event.key === "ArrowRight" && !last) {
        event.preventDefault();
        setStep((value) => value + 1);
      }
      if (event.key === "ArrowLeft" && step > 0) {
        event.preventDefault();
        setStep((value) => value - 1);
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [last, onClose, step]);
  return (
    <aside
      ref={card}
      className="tutorial-card"
      role="dialog"
      aria-label={tutorial.title}
      aria-labelledby={titleId}
    >
      <header>
        <span className="section-eyebrow">{tutorial.eyebrow}</span>
        <button
          type="button"
          className="icon-button"
          aria-label="Close field tip"
          onClick={onClose}
        >
          <X size={17} />
        </button>
      </header>
      <div className="tutorial-progress" aria-hidden="true">
        {tutorial.steps.map((_, index) => (
          <i key={index} className={index <= step ? "active" : ""} />
        ))}
      </div>
      <h2 id={titleId}>{current.title}</h2>
      <p>{current.body}</p>
      {current.keys && (
        <div className="tutorial-keys" aria-label="Keys">
          {current.keys.map((key) => (
            <kbd key={key}>{key}</kbd>
          ))}
        </div>
      )}
      <footer>
        <button type="button" className="tutorial-skip" onClick={onSkipAll}>
          Turn off tips
        </button>
        <span className="tutorial-count">
          {step + 1} / {tutorial.steps.length}
        </span>
        <div>
          {step > 0 && (
            <button type="button" onClick={() => setStep((value) => value - 1)}>
              <ArrowLeft size={15} />
              Back
            </button>
          )}
          <button
            type="button"
            className="primary"
            onClick={() => (last ? onClose() : setStep((value) => value + 1))}
          >
            {last ? "Got it" : "Next"}
            {!last && <ArrowRight size={15} />}
          </button>
        </div>
      </footer>
    </aside>
  );
}
