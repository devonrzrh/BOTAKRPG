import type { Content } from "../content/schema";
import type { Save } from "../game/state";
import { recoveredClues } from "../game/evidence";
import "./ClueLedger.css";

export function ClueLedger({
  save,
  content,
  onLesson,
}: {
  save: Save;
  content: Content;
  onLesson: (id: string) => void;
}) {
  const clues = recoveredClues(save, content);
  return (
    <div className="clue-ledger">
      <p>
        {clues.length} recovered {clues.length === 1 ? "clue" : "clues"}
      </p>
      {!clues.length && (
        <p>No evidence filed yet. Follow a lead on the quest board.</p>
      )}
      {clues.map((clue, index) => (
        <article key={clue.id}>
          <span className="clue-file-number">
            FILE {String(index + 1).padStart(2, "0")} · {clue.source}
          </span>
          <h3>{clue.title}</h3>
          <p>
            {clue.id === "echo-battle" && save.finaleOutcome === "pacified"
              ? "ECHO-7 accepted a verified safe channel and was contained intact."
              : clue.id === "echo-battle" && save.finaleOutcome === "defeated"
                ? "ECHO-7 was disabled and contained in the abandoned subnet."
                : clue.text}
          </p>
          <button onClick={() => onLesson(clue.lesson)}>Open reference</button>
        </article>
      ))}
    </div>
  );
}
