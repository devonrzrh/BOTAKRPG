import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Dialogue as DialogueContent } from "../content/schema";
import { typewriterTimeline, revealedCharacters } from "../game/typewriter";
import { personalizeText, speakerLabel } from "../game/player";

function Portrait({ speaker }: { speaker: string }) {
  const robot = /\b(PATCH|FOLIO|LUMA|Mimic|Warden|Keeper)\b/i.test(speaker);
  return (
    <div
      className={`dialogue-portrait ${robot ? "is-robot" : "is-human"}`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 120 140" fill="none">
        <path
          className="portrait-grid"
          d="M0 35H120M0 70H120M0 105H120M30 0V140M60 0V140M90 0V140"
        />
        {robot ? (
          <>
            <path
              className="portrait-fill"
              d="M34 32H86V87H34zM20 132V108L41 95H79L100 108V132"
            />
            <path d="M44 51H54M66 51H76M47 71H73M60 19V32M27 45H34M86 45H93" />
          </>
        ) : (
          <>
            <path
              className="portrait-fill"
              d="M39 40L48 29H72L81 40V65L72 85H48L39 65zM20 132V109L44 93H76L100 109V132"
            />
            <path d="M39 43L81 43M48 60H53M67 60H72M52 77H68M44 93L60 115L76 93M60 115V132" />
          </>
        )}
        <path
          className="portrait-frame"
          d="M6 18V6H18M102 6H114V18M6 122V134H18M102 134H114V122"
        />
      </svg>
      <span>{robot ? "UNIT" : speaker === "Vale" ? "LOCAL" : "COMMS"}</span>
    </div>
  );
}

export function Dialogue({
  dialogue,
  onAction,
  savedName,
  reducedMotion = false,
}: {
  dialogue: DialogueContent;
  onAction: (action: "accept-case" | "close" | "continue") => void;
  savedName?: string;
  reducedMotion?: boolean;
}) {
  const [nodeId, setNodeId] = useState(dialogue.start),
    root = useRef<HTMLElement>(null),
    speechId = useId();
  const node = dialogue.nodes.find((n) => n.id === nodeId)!;
  const speaker = speakerLabel(node.speaker, savedName),
    line = personalizeText(node.text, savedName ?? "");
  const [osReduced, setOsReduced] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)"),
      change = () => setOsReduced(query.matches);
    query.addEventListener("change", change);
    return () => query.removeEventListener("change", change);
  }, []);
  const instant = reducedMotion || osReduced;
  const timeline = useMemo(() => typewriterTimeline(line), [line]);
  const [typing, setTyping] = useState({ node: "", visible: 0 });
  const frame = useRef<number | null>(null);
  const count = instant
    ? timeline.characters.length
    : typing.node === node.id
      ? typing.visible
      : 0;
  const complete = count >= timeline.characters.length;
  const reveal = useCallback(() => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = null;
    root.current?.focus();
    setTyping({ node: node.id, visible: timeline.characters.length });
  }, [node.id, timeline]);
  useEffect(() => {
    if (instant) {
      setTyping({ node: node.id, visible: timeline.characters.length });
      return;
    }
    if (typing.node === node.id && typing.visible >= timeline.characters.length)
      return;
    const start = performance.now();
    let cancelled = false;
    setTyping({ node: node.id, visible: 0 });
    const tick = (now: number) => {
      if (cancelled) return;
      const visible = revealedCharacters(timeline.times, now - start);
      setTyping((previous) =>
        previous.node === node.id && previous.visible === visible
          ? previous
          : { node: node.id, visible },
      );
      if (visible < timeline.characters.length)
        frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, [node.id, timeline, instant]);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    root.current?.focus();
    return () => {
      if (previous?.isConnected) previous.focus();
    };
  }, []);
  useEffect(() => {
    root.current?.focus();
  }, [nodeId]);
  useEffect(() => {
    if (complete && document.activeElement === document.body)
      root.current?.focus();
  }, [complete]);
  const choose = (index: number) => {
    if (!complete) return;
    const choice = node.choices[index];
    if (!choice) return;
    choice.next ? setNodeId(choice.next) : onAction(choice.action!);
  };
  return (
    <div className="dialogue-backdrop">
      <section
        ref={root}
        tabIndex={-1}
        className={`dialogue-box ${complete ? "line-complete" : "line-typing"}`}
        role="dialog"
        aria-modal="true"
        aria-label={dialogue.title}
        aria-describedby={speechId}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === "Escape") {
            e.preventDefault();
            onAction("close");
          }
          if (
            !complete &&
            (e.key === " " || e.key === "Enter") &&
            !(e.target as HTMLElement).closest("button")
          ) {
            e.preventDefault();
            reveal();
            return;
          }
          if (
            complete &&
            !e.repeat &&
            !e.ctrlKey &&
            !e.altKey &&
            !e.metaKey &&
            /^[1-9]$/.test(e.key)
          ) {
            e.preventDefault();
            choose(Number(e.key) - 1);
          }
          if (e.key === "Tab") {
            const buttons = [
                ...root.current!.querySelectorAll<HTMLButtonElement>(
                  "button:not(:disabled)",
                ),
              ],
              index = buttons.indexOf(
                document.activeElement as HTMLButtonElement,
              );
            e.preventDefault();
            buttons[
              index < 0
                ? e.shiftKey
                  ? buttons.length - 1
                  : 0
                : (index + (e.shiftKey ? -1 : 1) + buttons.length) %
                  buttons.length
            ]?.focus();
          }
        }}
      >
        <Portrait speaker={node.speaker} />
        <div className="dialogue-body">
          <header className="dialogue-header">
            <h2>{speaker}</h2>
            <button
              className="dialogue-close"
              aria-label="Close dialogue"
              onClick={() => onAction("close")}
            >
              <span aria-hidden="true">×</span>
            </button>
          </header>
          <div
            className="dialogue-speech"
            onClick={() => {
              if (!complete) reveal();
            }}
          >
            <p className="dialogue-measure" aria-hidden="true">
              {line}
            </p>
            <p className="dialogue-typed" aria-hidden="true">
              {timeline.characters.slice(0, count).join("")}
              {!complete && <span className="typing-caret" />}
            </p>
          </div>
          <p
            id={speechId}
            className="dialogue-accessible"
            aria-live="polite"
            aria-atomic="true"
          >
            {line}
          </p>
          <div className="dialogue-response-area">
            {!complete && (
              <button className="dialogue-reveal" onClick={reveal}>
                Show line <kbd>Space</kbd>
              </button>
            )}
            <div
              className="dialogue-choices"
              aria-hidden={!complete}
              inert={!complete}
            >
              {node.choices.map((choice, index) => (
                <button
                  key={choice.label}
                  disabled={!complete}
                  onClick={() => choose(index)}
                >
                  <span className="response-number" aria-hidden="true">
                    {index + 1}
                  </span>
                  <span>{choice.label}</span>
                  <span className="response-arrow" aria-hidden="true">
                    ›
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
