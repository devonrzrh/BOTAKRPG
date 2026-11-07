import { useEffect, useRef, useState } from "react";
import type { Content, Item, Question, Skill } from "../content/schema";
import type { Battle } from "../game/combat";
import { stats, type Save } from "../game/state";
import { combatMotion } from "../game/combatPresentation";

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
  onSubmit: () => void;
  onHint: () => void;
  onContinue: () => void;
  onReview: () => void;
  onRetreat: () => void;
  onJournal: () => void;
  onRecover: () => void;
}
export function BattleScreen(p: Props) {
  const { battle: b, save, question: q } = p,
    limits = stats(save, p.content);
  const [menu, setMenu] = useState<"skills" | "items" | "inspect" | null>(null);
  const [motion, setMotion] = useState<ReturnType<typeof combatMotion>>(null);
  const previous = useRef(b),
    title = useRef<HTMLHeadingElement>(null),
    skillsButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const next = combatMotion(previous.current, b);
    previous.current = b;
    setMotion(save.settings.reducedMotion ? null : next);
    if (next) setMenu(null);
    const timer = next ? setTimeout(() => setMotion(null), 500) : undefined;
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [b, save.settings.reducedMotion]);
  useEffect(() => {
    if (motion) return;
    if (menu || b.phase !== "choose") title.current?.focus();
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
  const activeCard = !motion && (b.phase !== "choose" || menu);
  return (
    <div
      className={`battle-screen phase-${b.phase} ${motion ? `motion-${motion}` : ""}`}
      onKeyDown={(e) => {
        if (e.key === "Escape" && menu) {
          e.preventDefault();
          e.stopPropagation();
          setMenu(null);
        }
      }}
    >
      <div className="battle-enemy-hud">
        <h2>{b.enemyName}</h2>
        {meter("Enemy HP", b.hp, b.maxHp, "enemy")}
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
          {motion === "player"
            ? p.notice
            : motion === "enemy"
              ? `${b.enemyName} attacks`
              : "Turn spent"}
        </div>
      )}
      {activeCard && (
        <section
          className={`battle-decision ${b.phase === "choose" ? "command-panel" : "quiz-panel"}`}
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
                <button onClick={() => setMenu(null)}>Back</button>
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
                        disabled={!save.inventory[item.id]}
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
                    Answer a skill’s question to act. A wrong answer spends the
                    turn. Shield and weaken reduce incoming damage; poison
                    damages the enemy.
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
              <div className="battle-answer-options">
                {q.options
                  .map((text, index) => ({ text, index }))
                  .sort((a, c) =>
                    q.format === "ordering"
                      ? ((a.index + 2) % q.options.length) -
                        ((c.index + 2) % q.options.length)
                      : a.index - c.index,
                  )
                  .map(({ text, index }) => (
                    <button
                      key={index}
                      aria-pressed={p.answer.includes(index)}
                      className={p.answer.includes(index) ? "selected" : ""}
                      onClick={() =>
                        p.onAnswer(
                          q.format === "choice"
                            ? [index]
                            : p.answer.includes(index)
                              ? p.answer.filter((x) => x !== index)
                              : [...p.answer, index],
                        )
                      }
                    >
                      <span>
                        {q.format === "ordering"
                          ? p.answer.includes(index)
                            ? p.answer.indexOf(index) + 1
                            : "·"
                          : String.fromCharCode(65 + index)}
                      </span>
                      {text}
                    </button>
                  ))}
              </div>
              <footer>
                <button
                  className="primary"
                  disabled={
                    q.format === "choice"
                      ? p.answer.length !== 1
                      : p.answer.length !== q.options.length
                  }
                  onClick={p.onSubmit}
                >
                  Use skill
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
              <p className="battle-explanation">{q?.explanation}</p>
              <footer>
                <button className="primary" onClick={p.onContinue}>
                  Continue
                </button>
                <button onClick={p.onReview}>Review lesson later</button>
              </footer>
            </>
          )}
          {b.phase === "won" && (
            <>
              <h2 ref={title} tabIndex={-1}>
                {b.enemyId === "echo-7"
                  ? "ECHO-7 contained"
                  : "Sentinel defeated"}
              </h2>
              <p>{q?.explanation ?? "Evidence recovered."}</p>
              <footer>
                <button className="primary" onClick={p.onJournal}>
                  Quest map
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
      <nav className="battle-command-menu" aria-label="Battle commands">
        <span>Turn {b.turn}</span>
        {(["skills", "items", "inspect"] as const).map((id) => (
          <button
            key={id}
            ref={id === "skills" ? skillsButton : undefined}
            aria-expanded={b.phase === "choose" && menu === id}
            disabled={b.phase !== "choose" || !!motion}
            onClick={() => setMenu(menu === id ? null : id)}
          >
            {id[0].toUpperCase() + id.slice(1)}
          </button>
        ))}
        <button disabled={!!motion} onClick={p.onRetreat}>
          Retreat
        </button>
      </nav>
    </div>
  );
}
