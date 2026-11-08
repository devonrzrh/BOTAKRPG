import { useEffect, useRef, useState } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";
import { FileSearch, Check, ChevronRight, X } from "lucide-react";
import type { Quest } from "../content/schema";
import type { Save } from "../game/state";

export function LearningQuest(p: {
  chapter: Quest;
  progress: Save["chapterProgress"][string] | undefined;
  unlocked: boolean;
  onIntroduce: () => void;
  onAnswer: (answer: number) => boolean;
  onEncounter: () => void;
  onRead: () => void;
  puzzleTitle?: string;
  onPuzzle?: () => void;
  onClose: () => void;
}) {
  const c = p.chapter,
    l = c.learning!,
    [page, setPage] = useState<"concept" | "example" | "practice" | "ready">(
      p.progress?.practiced
        ? "ready"
        : p.progress?.introduced
          ? "practice"
          : "concept",
    ),
    [answer, setAnswer] = useState<number | null>(null),
    [feedback, setFeedback] = useState<boolean | null>(null),
    root = useRef<HTMLElement>(null);
  const stages = [
      "Concept",
      "Worked example",
      "Guided practice",
      "Chapter check",
    ],
    stage = ["concept", "example", "practice", "ready"].indexOf(page);
  useEffect(() => {
    root.current?.querySelector<HTMLElement>("h2")?.focus();
  }, [page]);
  return (
    <div className="learning-backdrop">
      <section
        className="learning-quest"
        role="dialog"
        aria-modal="true"
        aria-label={`Chapter: ${c.title}`}
        ref={root}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === "Escape") p.onClose();
          if (e.key === "Tab") {
            const nodes = [
                ...root.current!.querySelectorAll<HTMLButtonElement>(
                  "button:not(:disabled)",
                ),
              ],
              i = nodes.indexOf(document.activeElement as HTMLButtonElement);
            e.preventDefault();
            nodes[
              (i + (e.shiftKey ? -1 : 1) + nodes.length) % nodes.length
            ]?.focus();
          }
        }}
      >
        <header>
          <FileSearch size={26} aria-hidden="true" />
          <span>{c.title}</span>
          <button onClick={p.onClose}>
            <X size={20} aria-hidden="true" /> Close
          </button>
        </header>
        <ol className="learning-route" aria-label="Chapter progress">
          {stages.map((label, index) => (
            <li
              key={label}
              aria-current={index === stage ? "step" : undefined}
              className={index < stage ? "visited" : ""}
            >
              <span className="learning-step-mark" aria-hidden="true">
                {index < stage ? <Check size={18} /> : index + 1}
              </span>
              <span>{label}</span>
              {index < stages.length - 1 && (
                <ChevronRight
                  className="learning-step-arrow"
                  size={18}
                  aria-hidden="true"
                />
              )}
            </li>
          ))}
        </ol>
        <main>
          <p className="learning-stage">
            {page === "concept"
              ? "Concept"
              : page === "example"
                ? "Worked example"
                : page === "practice"
                  ? "Guided practice"
                  : "Chapter check"}
          </p>
          <h2 tabIndex={-1}>
            {page === "practice"
              ? l.practice.prompt
              : page === "ready"
                ? "Apply what you learned"
                : l.goal}
          </h2>
          {page === "concept" && <p>{l.concept}</p>}
          {page === "example" && (
            <div
              className="learning-example"
              dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(
                  marked.parse(l.example, { async: false }) as string,
                ),
              }}
            />
          )}
          {page === "practice" && (
            <>
              <div className="learning-options">
                {l.practice.options.map((option, index) => (
                  <button
                    key={index}
                    aria-pressed={answer === index}
                    onClick={() => {
                      setAnswer(index);
                      setFeedback(null);
                    }}
                  >
                    <span className="learning-option-number" aria-hidden="true">
                      {String.fromCharCode(65 + index)}
                    </span>
                    <span>{option}</span>
                  </button>
                ))}
              </div>
              {feedback !== null && (
                <div className="learning-feedback" role="status">
                  <strong>{feedback ? "Correct." : "Try again."}</strong>
                  <p>{l.practice.explanation}</p>
                </div>
              )}
            </>
          )}
          {page === "ready" && (
            <p>
              The next encounter checks this chapter. You can review the example
              or read the full chapter first.
            </p>
          )}
          {page === "ready" && !p.unlocked && (
            <p>
              Complete the preceding encounter to continue this investigation.
            </p>
          )}
        </main>
        <footer>
          <button onClick={p.onRead}>Read chapter</button>
          {p.onPuzzle && (
            <button onClick={p.onPuzzle}>Puzzle: {p.puzzleTitle}</button>
          )}
          {page !== "concept" && (
            <button
              onClick={() => {
                setPage(page === "practice" ? "example" : "concept");
                setFeedback(null);
              }}
            >
              Review
            </button>
          )}
          {page === "concept" && (
            <button className="primary" onClick={() => setPage("example")}>
              Worked example
            </button>
          )}
          {page === "example" && (
            <button
              className="primary"
              onClick={() => {
                p.onIntroduce();
                setPage("practice");
                setFeedback(null);
              }}
            >
              Try it
            </button>
          )}
          {page === "practice" && feedback !== true && (
            <button
              className="primary"
              disabled={answer === null}
              onClick={() => setFeedback(p.onAnswer(answer!))}
            >
              Check reasoning
            </button>
          )}
          {page === "practice" && feedback === true && (
            <button className="primary" onClick={() => setPage("ready")}>
              Continue
            </button>
          )}
          {page === "ready" && (
            <button
              className="primary"
              disabled={!p.unlocked}
              onClick={p.onEncounter}
            >
              Enter encounter
            </button>
          )}
        </footer>
      </section>
    </div>
  );
}
