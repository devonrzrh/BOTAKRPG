import { useEffect, useRef, useState } from "react";
import type { Content, Item, Question, Skill } from "../content/schema";
import { enemyIntent, type Battle } from "../game/combat";
import { stats, type Save } from "../game/state";
import { combatMotion } from "../game/combatPresentation";
import { XpMeter } from "./XpMeter";
import {
  Crosshair,
  Package,
  ScanSearch,
  LogOut,
  ShieldCheck,
} from "lucide-react";

interface Props {
  battle: Battle;
  save: Save;
  content: Content;
  question?: Question;
  answer: number[];
  notice: string;
  onAnswer: (answer: number[]) => void;
  onSkill: (skill: Skill) => void;
  onItem: (item: Item) => void;
  onGuard: () => void;
  onSubmit: () => void;
  onHint: () => void;
  onContinue: () => void;
  onReview: () => void;
  onRetreat: () => void;
  onJournal: () => void;
  victoryActionLabel?: string;
  onRecover: () => void;
  onRetry?: () => void;
}
export function BattleScreen(p: Props) {
  const { battle: b, save, question: q } = p,
    limits = stats(save, p.content);
  const [menu, setMenu] = useState<"skills" | "items" | "inspect" | null>(
    "skills",
  );
  const [reviewing, setReviewing] = useState(false);
  const [impact, setImpact] = useState("");
  const [motion, setMotion] = useState<
    ReturnType<typeof combatMotion> | "recover"
  >(null);
  const previous = useRef(b),
    startingSave = useRef(save),
    title = useRef<HTMLHeadingElement>(null),
    skillsButton = useRef<HTMLButtonElement>(null);
  const continuation = useRef(p.onContinue),
    resolved = useRef<Battle | null>(null);
  continuation.current = p.onContinue;
  const advance = () => {
    if (b.phase !== "feedback" || resolved.current === b) return;
    resolved.current = b;
    continuation.current();
  };
  const correctFeedback = b.phase === "feedback" && p.notice === "Correct";
  useEffect(() => {
    setReviewing(false);
    if (b.phase === "choose") setMenu("skills");
  }, [b.turn, b.phase]);
  useEffect(() => {
    if (!correctFeedback || reviewing) return;
    const timer = setTimeout(
      advance,
      save.settings.reducedMotion ? 1100 : 1400,
    );
    return () => clearTimeout(timer);
  }, [b, correctFeedback, reviewing, save.settings.reducedMotion]);
  useEffect(() => {
    const next = combatMotion(previous.current, b);
    const cue =
      next === "enemy" &&
      enemyIntent(previous.current, save, p.content).kind === "recover"
        ? "recover"
        : next;
    previous.current = b;
    if (next)
      setImpact(
        next === "player" || next === "miss"
          ? (b.log.at(-2) ?? p.notice)
          : (b.log.at(-1) ?? ""),
      );
    setMotion(save.settings.reducedMotion ? null : cue);
    if (next && b.phase !== "choose") setMenu(null);
    const timer = next ? setTimeout(() => setMotion(null), 500) : undefined;
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [b, save.settings.reducedMotion]);
  useEffect(() => {
    if (motion) return;
    if ((menu && menu !== "skills") || b.phase !== "choose")
      title.current?.focus();
    else skillsButton.current?.focus();
  }, [b.phase, menu, motion]);
  const skills = p.content.entities.filter(
    (e): e is Skill =>
      e.type === "skill" && save.character.skills.includes(e.id),
  );
  const items = p.content.entities.filter(
    (e): e is Item => e.type === "item" && e.kind !== "equipment",
  );
  const meter = (label: string, value: number, max: number, kind: string) => (
    <div className={`battle-meter ${kind}`}>
      <div>
        <span>{label}</span>
        <strong>
          {value} / {max}
        </strong>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={value}
      >
        <i style={{ width: `${Math.max(0, value / max) * 100}%` }} />
      </div>
    </div>
  );
  const activeCard =
    !motion && (b.phase !== "choose" || (menu && menu !== "skills"));
  const intent = enemyIntent(b, save, p.content);
  const displayOptions =
    q?.options
      .map((text, index) => ({ text, index }))
      .sort((a, c) =>
        q.format === "ordering"
          ? ((a.index + 2) % q.options.length) -
            ((c.index + 2) % q.options.length)
          : a.index - c.index,
      ) ?? [];
  const selectAnswer = (index: number) => {
    if (!q || b.phase !== "question") return;
    p.onAnswer(
      q.format === "choice"
        ? [index]
        : p.answer.includes(index)
          ? p.answer.filter((x) => x !== index)
          : [...p.answer, index],
    );
  };
  const answerReady =
    q &&
    (q.format === "choice"
      ? p.answer.length === 1
      : q.format === "multiple"
        ? p.answer.length > 0
        : p.answer.length === q.options.length);
  const gainedXp = Math.max(
    0,
    save.character.xp - startingSave.current.character.xp,
  );
  const oldStats = stats(startingSave.current, p.content);
  const levelGain = save.character.level - startingSave.current.character.level;
  const newSkills = p.content.entities.filter(
    (e): e is Skill =>
      e.type === "skill" &&
      e.level > startingSave.current.character.level &&
      e.level <= save.character.level &&
      (!e.parent || save.character.skills.includes(e.parent)),
  );
  return (
    <div
      className={`battle-screen phase-${b.phase} ${motion ? `motion-${motion}` : ""}`}
      onKeyDown={(e) => {
        if (e.repeat || e.ctrlKey || e.altKey || e.metaKey) return;
        if (e.key === "Escape" && menu) {
          e.preventDefault();
          e.stopPropagation();
          setMenu(menu === "skills" ? null : "skills");
        }
        if (motion) return;
        if (/^[1-9]$/.test(e.key)) {
          const index = Number(e.key) - 1;
          if (b.phase === "question" && q && index < q.options.length) {
            e.preventDefault();
            e.stopPropagation();
            selectAnswer(displayOptions[index].index);
          } else if (
            b.phase === "choose" &&
            menu === "skills" &&
            skills[index] &&
            save.character.focus >= skills[index].cost
          ) {
            e.preventDefault();
            e.stopPropagation();
            p.onSkill(skills[index]);
          }
        }
        if (
          e.key === "Enter" &&
          b.phase === "question" &&
          answerReady &&
          (!(e.target as HTMLElement).closest("button, summary") ||
            Boolean(
              (e.target as HTMLElement).closest(
                '.battle-answer-options button[aria-pressed="true"]',
              ),
            ))
        ) {
          e.preventDefault();
          e.stopPropagation();
          p.onSubmit();
        }
      }}
    >
      <div className="battle-enemy-hud">
        <h2>{b.enemyName}</h2>
        {meter("Enemy HP", b.hp, b.maxHp, "enemy")}
        {b.phase !== "won" && b.phase !== "lost" && (
          <div className={`battle-intent intent-${intent.kind}`} role="status">
            <span>{intent.label}</span>
            <strong>
              {intent.damage
                ? `${intent.damage} damage`
                : intent.kind === "recover"
                  ? "+3 focus"
                  : "Poison will finish"}
            </strong>
          </div>
        )}
        <div className="battle-status-effects">
          {b.effects
            .filter((e) => e.id !== "shield")
            .map((e) => (
              <span key={e.id}>
                {e.id} · {e.remaining} turns
              </span>
            ))}
        </div>
      </div>
      {motion && (
        <div className="battle-impact" role="status">
          {impact}
        </div>
      )}
      {activeCard && (
        <section
          className={`battle-decision ${b.phase === "choose" ? "command-panel" : "quiz-panel"} ${b.phase === "feedback" ? "feedback-panel" : ""} ${correctFeedback ? "answer-correct" : ""}`}
          aria-label={
            b.phase === "question" ? "Battle question" : "Battle decision"
          }
        >
          {b.phase === "choose" && (
            <>
              <header>
                <h2 ref={title} tabIndex={-1}>
                  {menu === "skills"
                    ? "Skills"
                    : menu === "items"
                      ? "Items"
                      : "Inspect"}
                </h2>
                <button onClick={() => setMenu("skills")}>Back</button>
              </header>
              {menu === "skills" && (
                <div className="battle-skill-options">
                  {skills.map((s) => (
                    <button
                      key={s.id}
                      disabled={
                        save.character.focus < s.cost || save.character.hp === 0
                      }
                      onClick={() => {
                        setMenu(null);
                        p.onSkill(s);
                      }}
                    >
                      <span>
                        <strong>{s.title}</strong>
                        <span>{s.description}</span>
                      </span>
                      <b>{s.cost} FP</b>
                    </button>
                  ))}
                </div>
              )}
              {menu === "items" && (
                <>
                  <p>Using an item spends your turn.</p>
                  <div className="battle-item-options">
                    {items.map((item) => (
                      <button
                        key={item.id}
                        disabled={
                          !save.inventory[item.id] ||
                          (item.kind === "healing"
                            ? save.character.hp >= limits.maxHp
                            : save.character.focus >= limits.maxFocus)
                        }
                        onClick={() => {
                          setMenu(null);
                          p.onItem(item);
                        }}
                      >
                        <span>
                          <strong>
                            {item.title} ×{save.inventory[item.id] ?? 0}
                          </strong>
                          <span>
                            Restores {item.amount}{" "}
                            {item.kind === "healing" ? "HP" : "focus"}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              )}
              {menu === "inspect" && (
                <>
                  <p>
                    Attack {b.attack} · Your defense {limits.defense}
                  </p>
                  <p>
                    Guard reduces the next hit and restores 4 focus. A wrong
                    answer spends the turn. Shield and weaken reduce incoming
                    damage; poison damages the enemy.
                  </p>
                  <div
                    className="battle-recent-log"
                    aria-label="Recent battle events"
                  >
                    {b.log.slice(-3).map((line, i) => (
                      <p key={i}>{line}</p>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
          {b.phase === "question" && q && (
            <>
              <h2 ref={title} tabIndex={-1}>
                {q.prompt}
              </h2>
              {q.format === "ordering" && (
                <p>
                  Select the steps in order. Select a step again to remove it.
                </p>
              )}
              {q.format === "multiple" && <p>Select all that apply.</p>}
              <div className="battle-answer-options">
                {displayOptions.map(({ text, index }, position) => (
                  <button
                    key={index}
                    aria-pressed={p.answer.includes(index)}
                    className={p.answer.includes(index) ? "selected" : ""}
                    onClick={() => selectAnswer(index)}
                  >
                    <span>{position + 1}</span>
                    {q.format === "ordering" && p.answer.includes(index) && (
                      <strong className="answer-order">
                        #{p.answer.indexOf(index) + 1}
                      </strong>
                    )}
                    {text}
                  </button>
                ))}
              </div>
              <footer>
                <button
                  className="primary"
                  disabled={!answerReady}
                  onClick={p.onSubmit}
                >
                  Use {skills.find((s) => s.id === b.skill)?.title ?? "skill"}{" "}
                  <kbd>Enter</kbd>
                </button>
                <button onClick={p.onHint}>Hint · no mastery credit</button>
              </footer>
              {p.notice && (
                <p className="battle-explanation" role="status">
                  {p.notice}
                </p>
              )}
            </>
          )}
          {b.phase === "feedback" && (
            <>
              <h2 ref={title} tabIndex={-1}>
                {p.notice}
              </h2>
              {(!correctFeedback || reviewing) && (
                <p className="battle-explanation">{q?.explanation}</p>
              )}
              <footer>
                <button className="primary" onClick={advance}>
                  {correctFeedback ? "Next turn" : "Continue"}
                </button>
                {correctFeedback && !reviewing && (
                  <button
                    onClick={() => {
                      setReviewing(true);
                      title.current?.focus();
                    }}
                  >
                    Pause to review
                  </button>
                )}
                <button onClick={p.onReview}>Review lesson later</button>
              </footer>
            </>
          )}
          {b.phase === "won" && (
            <>
              <h2 ref={title} tabIndex={-1}>
                {b.enemyId === "echo-7"
                  ? "ECHO-7 contained"
                  : `${b.enemyName} defeated`}
              </h2>
              <div className="battle-xp-reward">
                <strong role="status">
                  {gainedXp
                    ? `+${gainedXp} XP`
                    : "Practice victory · XP already earned"}
                </strong>
                <XpMeter
                  xp={save.character.xp}
                  initialXp={startingSave.current.character.xp}
                  reducedMotion={save.settings.reducedMotion}
                  label="Victory experience"
                />
                {levelGain > 0 && (
                  <>
                    <h3>
                      Level up! {startingSave.current.character.level} →{" "}
                      {save.character.level}
                    </h3>
                    <p>
                      HP +{limits.maxHp - oldStats.maxHp} · Focus +
                      {limits.maxFocus - oldStats.maxFocus} · Attack +
                      {limits.attack - oldStats.attack} · Defense +
                      {limits.defense - oldStats.defense}
                    </p>
                    {newSkills.length > 0 && (
                      <p>
                        Available skills:{" "}
                        {newSkills.map((s) => s.title).join(", ")}. Learn them
                        at the desk.
                      </p>
                    )}
                  </>
                )}
              </div>
              {q?.explanation && (
                <details>
                  <summary>Answer explanation</summary>
                  <p>{q.explanation}</p>
                </details>
              )}
              <footer>
                <button className="primary" onClick={p.onJournal}>
                  {p.victoryActionLabel ?? "Quest map"}
                </button>
                <button onClick={p.onRetreat}>Return to network</button>
              </footer>
            </>
          )}
          {b.phase === "lost" && (
            <>
              <h2 ref={title} tabIndex={-1}>
                Connection lost
              </h2>
              <p>Your evidence is safe. Return to recover before retrying.</p>
              {p.onRetry && (
                <button className="primary" onClick={p.onRetry}>
                  Recover and retry encounter
                </button>
              )}
              <button className="primary" onClick={p.onRecover}>
                Return & recover
              </button>
            </>
          )}
        </section>
      )}
      <div className="battle-player-hud">
        <strong>{save.character.name}</strong>
        {meter("HP", save.character.hp, limits.maxHp, "health")}
        {meter("Focus", save.character.focus, limits.maxFocus, "focus")}
        <div className="battle-status-effects">
          {b.effects
            .filter((e) => e.id === "shield")
            .map((e) => (
              <span key={e.id}>Shield · {e.remaining} turns</span>
            ))}
        </div>
      </div>
      {b.phase === "choose" && !motion && menu === "skills" && (
        <div className="battle-skill-tray" aria-label="Available skills">
          {skills.map((s, index) => (
            <button
              key={s.id}
              ref={index === 0 ? skillsButton : undefined}
              disabled={save.character.focus < s.cost}
              onClick={() => p.onSkill(s)}
              title={s.description}
            >
              <span className="battle-skill-title">
                <kbd>{index + 1}</kbd>
                <strong>{s.title}</strong>
                <span>{s.cost ? `${s.cost} FP` : "Free"}</span>
              </span>
              <span className="battle-skill-detail">
                {limits.attack + s.power} damage
                {s.effect ? ` · ${s.effect}` : ""}
              </span>
            </button>
          ))}
        </div>
      )}
      <nav className="battle-command-menu" aria-label="Battle commands">
        <span>Turn {b.turn}</span>
        {(["skills", "items", "inspect"] as const).map((id) => (
          <button
            key={id}
            aria-expanded={b.phase === "choose" && menu === id}
            disabled={b.phase !== "choose" || !!motion}
            onClick={() => setMenu(menu === id ? null : id)}
          >
            {id === "skills" ? (
              <Crosshair size={22} aria-hidden="true" />
            ) : id === "items" ? (
              <Package size={22} aria-hidden="true" />
            ) : (
              <ScanSearch size={22} aria-hidden="true" />
            )}
            {id[0].toUpperCase() + id.slice(1)}
          </button>
        ))}
        <button
          disabled={b.phase !== "choose" || !!motion}
          onClick={p.onGuard}
          title="Reduce the incoming hit by 70% and restore 4 focus. Spends a turn; no question."
        >
          <ShieldCheck size={22} aria-hidden="true" />
          Guard <span>+4 FP</span>
        </button>
        <button disabled={!!motion} onClick={p.onRetreat}>
          <LogOut size={22} aria-hidden="true" />
          Retreat
        </button>
      </nav>
    </div>
  );
}
