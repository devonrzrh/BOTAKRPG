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
import { useGameSound } from "./GameSound";
import { dialogueVoice, shouldBlip } from "../game/dialogueSpeech";
import { usePanelExit } from "./usePanelExit";

const portraits: Record<
  string,
  { color: string; silhouette: string; detail: string }
> = {
  Dispatch: {
    color: "#97c7d3",
    silhouette: "M36 64V45Q36 24 60 24T84 45V64L72 86H49Z M20 124V109L47 93H73L100 109V124Z",
    detail: "M34 50H29V68H38M86 50H91V68H82M86 68L78 77H65M46 52H74M46 62H54M66 62H74",
  },
  Mara: {
    color: "#dcaf89",
    silhouette: "M31 85L34 47Q35 24 60 24Q84 24 87 50L92 85H72L60 90L48 85Z M18 124V112L43 96L60 103L77 96L102 112V124Z",
    detail: "M41 60Q54 54 63 37Q69 47 79 52V66L72 80L60 87L48 80L41 66Z M46 62H53M65 62H72M54 76H64M43 96L60 114L77 96",
  },
  Vale: {
    color: "#d2bc85",
    silhouette: "M24 51L39 44L46 25H73L81 44L96 51Z M40 51H80V68L69 86H51L40 68Z M19 124V111L40 96L60 103L80 96L101 111V124Z",
    detail: "M40 44H80M46 61H54M66 61H74M54 76H66M40 96L60 124L80 96M39 113L35 124M81 113L85 124",
  },
  PATCH: {
    color: "#e0b673",
    silhouette: "M33 35H79L91 48V79L80 88H33L26 78V47Z M23 124V109L40 97H80L97 109V124Z",
    detail: "M26 57H91M42 35L37 22M33 22H42M38 48H48M61 63H79V75H61Z M39 69H49M56 100V121M65 100V121",
  },
  FOLIO: {
    color: "#cfb0dc",
    silhouette: "M34 37L59 29L86 37V80L59 91L34 80Z M19 124V112L43 98H77L101 112V124Z",
    detail: "M59 29V91M40 53L53 49M65 49L80 53M40 64L53 60M65 60L80 64M42 101L50 118H70L78 101",
  },
  LUMA: {
    color: "#9addca",
    silhouette: "M60 25L85 42L91 65L76 86H44L29 65L35 42Z M22 124L35 105L60 96L85 105L98 124Z",
    detail: "M34 56L60 43L86 56M38 64L60 77L82 64M55 57H65V67H55Z M47 107L60 118L73 107",
  },
  "Route Warden": {
    color: "#e5a584",
    silhouette: "M28 43L45 26H75L92 43V76L75 91H45L28 76Z M14 124V109L37 96H83L106 109V124Z",
    detail: "M29 57H91M37 57L48 67H72L83 57M50 78H70M42 99L60 119L78 99M24 111H36M84 111H96",
  },
  "Archive Keeper": {
    color: "#a5bbec",
    silhouette: "M40 31H80L91 49L82 80L60 94L38 80L29 49Z M19 124L25 107L44 96L60 104L76 96L95 107L101 124Z",
    detail: "M43 40H77L81 56L70 77H50L39 56Z M46 52H74M50 61H70M55 70H65M60 104V124",
  },
  "Signal Mimic": {
    color: "#e39cc8",
    silhouette: "M27 49L50 28L85 37L95 61L73 91L43 84Z M21 124L35 104L54 96L83 101L99 124Z",
    detail: "M31 58H46L52 47L60 72L69 53H88M36 72H46M76 77H87M48 105H73M43 113H78",
  },
  "Dispatch Drone": {
    color: "#a5cfe2",
    silhouette: "M17 50L36 40L49 49H71L84 40L103 50V69L84 78L71 72H49L36 78L17 69Z M43 80H77L67 99H53Z",
    detail: "M22 59H42M78 59H98M50 61A10 10 0 1 0 70 61A10 10 0 1 0 50 61M49 112H71",
  },
  Quartermaster: {
    color: "#d2c496",
    silhouette: "M31 35H89V77L78 90H42L31 77Z M15 124V105L39 98H81L105 105V124Z",
    detail: "M30 50H90M39 59H55V68H39Z M65 59H81V68H65Z M48 79H72M24 110H43V124M77 124V110H96",
  },
  "Checkpoint Echo": {
    color: "#a2dcce",
    silhouette: "M60 24L91 45V77L60 93L29 77V45Z M21 124L34 105L60 98L86 105L99 124Z",
    detail: "M60 38L80 51V70L60 81L40 70V51Z M48 57H72M48 66H72M53 112H67",
  },
};

function Portrait({ speaker }: { speaker: string }) {
  const portrait = Object.hasOwn(portraits, speaker)
    ? portraits[speaker]
    : portraits.Dispatch;
  return (
    <div
      className="dialogue-portrait"
      style={{ color: portrait.color }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 120 140" fill="none" focusable="false">
        <path
          className="portrait-grid"
          d="M0 35H120M0 70H120M0 105H120M30 0V140M60 0V140M90 0V140"
        />
        <path className="portrait-fill" d={portrait.silhouette} />
        <path d={portrait.detail} />
        <path
          className="portrait-frame"
          d="M6 18V6H18M102 6H114V18M6 122V134H18M102 134H114V122"
        />
      </svg>
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
  const sound = useGameSound();
  const { leaving, exit } = usePanelExit(onAction, reducedMotion);
  useEffect(() => {
    sound("connect");
  }, [sound]);
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
  const voice = dialogueVoice(node.speaker);
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
    let previousVisible = 0;
    setTyping({ node: node.id, visible: 0 });
    const tick = (now: number) => {
      if (cancelled) return;
      const visible = revealedCharacters(timeline.times, now - start);
      if (
        !document.hidden &&
        shouldBlip(timeline.characters, previousVisible, visible)
      )
        sound(voice);
      previousVisible = visible;
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
  }, [node.id, timeline, instant, voice, sound]);
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
    if (
      complete &&
      (document.activeElement === document.body ||
        document.activeElement === root.current)
    )
      root.current
        ?.querySelector<HTMLButtonElement>(
          ".dialogue-choices button:not(:disabled)",
        )
        ?.focus();
  }, [complete, nodeId]);
  const choose = (index: number) => {
    if (!complete || leaving) return;
    const choice = node.choices[index];
    if (!choice) return;
    sound("dialogue");
    choice.next ? setNodeId(choice.next) : exit(choice.action!);
  };
  return (
    <div
      className={`dialogue-backdrop feedback-panel${leaving ? " is-leaving" : ""}`}
      data-sfx-silent
    >
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
          if (leaving) {
            e.preventDefault();
            return;
          }
          if (e.key === "Escape") {
            e.preventDefault();
            exit("close");
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
            <div>
              <span className="dialogue-channel">{dialogue.title}</span>
              <h2>{speaker}</h2>
            </div>
            <button
              className="dialogue-close"
              aria-label="Close dialogue"
              onClick={() => exit("close")}
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
