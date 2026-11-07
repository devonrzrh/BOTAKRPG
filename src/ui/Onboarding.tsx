import { useEffect, useId, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Fingerprint } from "lucide-react";
import { PLAYER_NAME_LIMIT, playerInitials } from "../game/player";

const suggestions = ["Vale", "Rook", "Quinn", "Ash"];
const rooms = [
  {
    title: "Investigation wall",
    detail: "Pinned evidence and red string. The case grows here.",
  },
  {
    title: "Bookshelf",
    detail: "Real volumes. Read a chapter, mark it, take notes.",
  },
  {
    title: "Quest board",
    detail: "Leads, chapter checks, and locked nodes on one screen.",
  },
  {
    title: "Clue ledger",
    detail: "Every recovered clue, filed by branch.",
  },
];
export function Onboarding({
  initialName,
  lessonCount,
  onComplete,
}: {
  initialName: string;
  lessonCount: number;
  onComplete: (name: string) => void;
}) {
  const [step, setStep] = useState(0),
    [name, setName] = useState(initialName === "Vale" ? "" : initialName),
    input = useRef<HTMLInputElement>(null),
    screen = useRef<HTMLElement>(null),
    titleId = useId();
  const clean = name.replace(/\s+/g, " ").trim(),
    valid = clean.length > 0 && clean.length <= PLAYER_NAME_LIMIT;
  useEffect(() => {
    if (step === 0) input.current?.focus();
    else screen.current?.querySelector<HTMLButtonElement>(".primary")?.focus();
  }, [step]);
  const submit = () => {
    if (!valid) return;
    setStep(1);
  };
  return (
    <section
      ref={screen}
      tabIndex={-1}
      className="onboarding"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onKeyDown={(event) => {
        if (event.key === "Enter" && step === 0 && valid) {
          event.preventDefault();
          submit();
        }
      }}
    >
      <header className="onboarding-header">
        <span className="case-wordmark">NULL / TRACE</span>
        <span className="onboarding-file">
          CASE 007 · INTAKE · {step + 1} / 2
        </span>
      </header>
      {step === 0 ? (
        <div className="onboarding-body">
          <article className="intake-report">
            <span className="section-eyebrow">22:14 · LOWER CITY</span>
            <h1 id={titleId}>Sign for the case.</h1>
            <p>
              ECHO-7 abandoned its body at a transit terminal and left through
              the maintenance grid. The recall order is still open. Someone has
              to put a name on the report.
            </p>
            <dl className="intake-facts">
              <div>
                <dt>Case</dt>
                <dd>007 · Rogue signal</dd>
              </div>
              <div>
                <dt>Jurisdiction</dt>
                <dd>Sector 07 network</dd>
              </div>
              <div>
                <dt>Status</dt>
                <dd className="open">Open</dd>
              </div>
            </dl>
            <span className="intake-stamp" aria-hidden="true">
              OPEN
            </span>
          </article>
          <form
            className="intake-form"
            onSubmit={(event) => {
              event.preventDefault();
              submit();
            }}
          >
            <label htmlFor="detective-name">Detective name</label>
            <div className="intake-name-row">
              <span className="intake-initials" aria-hidden="true">
                {playerInitials(clean || "Vale")}
              </span>
              <input
                id="detective-name"
                ref={input}
                value={name}
                maxLength={PLAYER_NAME_LIMIT}
                autoComplete="off"
                spellCheck={false}
                placeholder="e.g. Rhea Vance"
                aria-describedby="name-hint"
                onChange={(event) => setName(event.target.value)}
              />
            </div>
            <p id="name-hint" className="intake-hint">
              {clean.length > PLAYER_NAME_LIMIT
                ? `Too long by ${clean.length - PLAYER_NAME_LIMIT}.`
                : "This name appears on the case file, the ledger, and in dialogue. Change it later from your badge."}
            </p>
            <div className="intake-suggestions" aria-label="Suggested names">
              {suggestions.map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setName(value)}
                  aria-pressed={clean === value}
                >
                  {value}
                </button>
              ))}
            </div>
            <button className="primary" type="submit" disabled={!valid}>
              <Fingerprint size={17} />
              Sign the file
            </button>
          </form>
        </div>
      ) : (
        <div className="onboarding-body orientation">
          <article className="intake-report">
            <span className="section-eyebrow">ORIENTATION · THE OFFICE</span>
            <h1 id={titleId}>Your desk holds the case.</h1>
            <p>
              The office is the case. Four walls hold everything you need
              between expeditions, and the top bar stays with you everywhere.
            </p>
            <ul className="orientation-list">
              {rooms.map((room) => (
                <li key={room.title}>
                  <span className="orientation-mark" aria-hidden="true">
                    <Check size={15} />
                  </span>
                  <div>
                    <strong>{room.title}</strong>
                    <span>{room.detail}</span>
                  </div>
                </li>
              ))}
            </ul>
            <p className="intake-hint">
              {lessonCount} volumes are shelved. Field tips appear when you
              reach a new activity, and the Field manual keeps every control.
            </p>
          </article>
          <div className="orientation-card">
            <span className="section-eyebrow">SIGNED</span>
            <strong className="orientation-name">{clean}</strong>
            <span className="orientation-role">NETWORK INVESTIGATOR</span>
            <div className="orientation-actions">
              <button type="button" onClick={() => setStep(0)}>
                <ArrowLeft size={16} />
                Back
              </button>
              <button
                className="primary"
                type="button"
                onClick={() => onComplete(clean)}
              >
                Open the case
                <ArrowRight size={17} />
              </button>
            </div>
          </div>
        </div>
      )}
      <footer className="onboarding-footer">
        <span>
          <i className={step === 0 ? "active" : ""} />
          <i className={step === 1 ? "active" : ""} />
        </span>
        <span>Every field is saved locally</span>
      </footer>
    </section>
  );
}
