import { BookOpenCheck, Eye, RotateCcw } from "lucide-react";
import {
  TUTORIAL_IDS,
  manualSections,
  tutorialById,
  type TutorialId,
} from "../game/tutorials";
export function FieldManual({
  seenTips,
  tipsEnabled,
  onReplayTip,
  onToggleTips,
  onResetTips,
}: {
  seenTips: TutorialId[];
  tipsEnabled: boolean;
  onReplayTip: (id: TutorialId) => void;
  onToggleTips: (enabled: boolean) => void;
  onResetTips: () => void;
}) {
  return (
    <div className="field-manual">
      <section className="manual-controls" aria-labelledby="manual-controls">
        <h3 id="manual-controls">Controls</h3>
        <dl>
          <div>
            <dt>Turn the room</dt>
            <dd>
              <kbd>←</kbd> <kbd>→</kbd> or move the cursor to an edge
            </dd>
          </div>
          <div>
            <dt>Interact</dt>
            <dd>
              <kbd>E</kbd> on a highlighted prop
            </dd>
          </div>
          <div>
            <dt>Keyboard navigation</dt>
            <dd>
              <kbd>Tab</kbd> / <kbd>Shift</kbd> + <kbd>Tab</kbd> cycle controls.
              Arrows choose nearby options; <kbd>Enter</kbd> / <kbd>Space</kbd>{" "}
              select. <kbd>F10</kbd> focuses the top menu; <kbd>Esc</kbd> goes
              back.
            </dd>
          </div>
          <div>
            <dt>Controller</dt>
            <dd>
              Standard controller: D-pad / left stick navigate or move. A / ✕
              confirms; B / ○ goes back. Start focuses the menu. Bumpers cycle
              controls or turn book pages; X / □ focuses the world; right stick
              scrolls. Press and release a button to connect.
            </dd>
          </div>
          <div>
            <dt>Move in the network</dt>
            <dd>
              <kbd>W</kbd> <kbd>A</kbd> <kbd>S</kbd> <kbd>D</kbd> or arrow keys
            </dd>
          </div>
          <div>
            <dt>Run Python</dt>
            <dd>
              <kbd>Ctrl</kbd> + <kbd>Enter</kbd> in the editor
            </dd>
          </div>
          <div>
            <dt>Close</dt>
            <dd>
              <kbd>Esc</kbd> closes the current panel or dialogue
            </dd>
          </div>
        </dl>
      </section>
      <section className="manual-sections" aria-labelledby="manual-rules">
        <h3 id="manual-rules">How the case works</h3>
        <div className="manual-grid">
          {manualSections.map((section) => (
            <article key={section.title}>
              <h4>{section.title}</h4>
              {section.lines.map((line) => (
                <p key={line}>{line}</p>
              ))}
              {section.keys && (
                <div className="manual-keys">
                  {section.keys.map((key) => (
                    <kbd key={key}>{key}</kbd>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      </section>
      <section className="manual-tips" aria-labelledby="manual-tips">
        <div className="manual-tips-head">
          <h3 id="manual-tips">Field tips</h3>
          <button
            type="button"
            className="text-button"
            onClick={() => onToggleTips(!tipsEnabled)}
          >
            {tipsEnabled ? "Pause automatic tips" : "Resume automatic tips"}
          </button>
        </div>
        <p className="muted">
          Contextual tips appear once when you first reach an activity. Replay
          any of them here.
        </p>
        <ul>
          {TUTORIAL_IDS.map((id) => {
            const tutorial = tutorialById(id),
              seen = seenTips.includes(id);
            return (
              <li key={id}>
                <span className={seen ? "tip-seen" : ""}>
                  {seen ? <BookOpenCheck size={16} /> : <Eye size={16} />}
                  <span>
                    <strong>{tutorial.title}</strong>
                    <small>{tutorial.steps.length} steps</small>
                  </span>
                </span>
                <button type="button" onClick={() => onReplayTip(id)}>
                  Show tip
                </button>
              </li>
            );
          })}
        </ul>
        <button type="button" className="text-button" onClick={onResetTips}>
          <RotateCcw size={15} />
          Show every tip again
        </button>
      </section>
    </div>
  );
}
