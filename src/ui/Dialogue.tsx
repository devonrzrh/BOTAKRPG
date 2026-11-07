import { useEffect, useRef, useState } from "react";
import type { Dialogue as DialogueContent } from "../content/schema";

export function Dialogue({
  dialogue,
  onAction,
}: {
  dialogue: DialogueContent;
  onAction: (action: "accept-case" | "close" | "continue") => void;
}) {
  const [nodeId, setNodeId] = useState(dialogue.start);
  const root = useRef<HTMLElement>(null);
  const node = dialogue.nodes.find((n) => n.id === nodeId)!;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    root.current?.querySelector("button")?.focus();
    return () => previous?.focus();
  }, []);
  useEffect(() => {
    root.current?.querySelector("button")?.focus();
  }, [nodeId]);
  return (
    <div className="dialogue-backdrop">
      <section
        ref={root}
        className="dialogue-box"
        role="dialog"
        aria-modal="true"
        aria-label={dialogue.title}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === "Escape") onAction("close");
          if (e.key === "Tab") {
            const buttons = [...root.current!.querySelectorAll("button")];
            const index = buttons.indexOf(
              document.activeElement as HTMLButtonElement,
            );
            e.preventDefault();
            buttons[
              (index + (e.shiftKey ? -1 : 1) + buttons.length) % buttons.length
            ]?.focus();
          }
        }}
      >
        <div className="dialogue-portrait" aria-hidden="true">
          {node.speaker[0]}
          <span>{node.speaker === "Vale" ? "LOCAL" : "COMMS"}</span>
        </div>
        <div className="dialogue-body">
          <h2>{node.speaker}</h2>
          <p key={node.id} aria-live="polite">
            {node.text}
          </p>
          <div className="dialogue-choices">
            {node.choices.map((choice) => (
              <button
                key={choice.label}
                onClick={() =>
                  choice.next
                    ? setNodeId(choice.next)
                    : onAction(choice.action!)
                }
              >
                {choice.label}
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
