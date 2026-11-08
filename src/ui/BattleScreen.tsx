import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Content, Question, Skill } from "../content/schema";
import {
  canSpare,
  previewDamage,
  enemyIntent,
  bossReadout,
  type Battle,
} from "../game/combat";
import { Evade } from "./Evade";
import "./BattleDepth.css";
import { stats, type Save } from "../game/state";
import { combatCueDuration, type BattleCue } from "../game/combatPresentation";
import { XpMeter } from "./XpMeter";
import { useGameSound } from "./GameSound";
import { useGameParticles } from "./GameParticles";
import { createCombatAudio } from "../game/combatAudio";
import {
  Crosshair,
  ScanSearch,
  LogOut,
  ShieldCheck,
  Volume2,
  VolumeX,
  BookOpen,
} from "lucide-react";

interface Props {
  battle: Battle;
  cue: BattleCue | null;
  save: Save;
  content: Content;
  question?: Question;
  answer: number[];
  notice: string;
  onAnswer: (answer: number[]) => void;
  onSkill: (skill: Skill) => void;
  onGuard: () => void;
  onBoost: (amount: number) => void;
  onFinisher: () => void;
  onAct: (choice: number) => void;
  onSpare: () => void;
  onEvade: (collisions: number) => void;
  onSubmit: (answer?: number[]) => void;
  onToggleSound: () => void;
  onToggleAutoAdvance: () => void;
  onHint: () => void;
  onContinue: () => void;
  onReview: () => void;
  onRetreat: () => void;
  onJournal: () => void;
  victoryActionLabel?: string;
  onRecover: () => void;
  onRetry?: () => void;
}
function enemyKind(id: string) {
  if (id.startsWith("echo")) return "echo";
  if (id.includes("warden")) return "warden";
  if (id.includes("keeper")) return "keeper";
  if (id.includes("mimic")) return "mimic";
  if (id.startsWith("guard-source-alg")) return "interceptor";
  if (id.startsWith("guard-source-ds")) return "drone";
  if (id.startsWith("guard-source-ai")) return "decoy";
  return "sentinel";
}
function enemySigil(id: string) {
  return {
    echo: "✦",
    warden: "▲",
    keeper: "▣",
    mimic: "◉",
    interceptor: "➤",
    drone: "◇",
    decoy: "◌",
    sentinel: "◆",
  }[enemyKind(id)];
}
export function BattleScreen(p: Props) {
  const sound = useGameSound();
  const particles = useGameParticles();
  const victoryBurstSent = useRef(false);
  const { battle: b, save, question: q } = p,
    limits = stats(save, p.content);
  const [menu, setMenu] = useState<"skills" | "inspect" | "act" | null>(
    "skills",
  );
  const [evading, setEvading] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [impact, setImpact] = useState("");
  const [motion, setMotion] = useState<BattleCue["kind"] | null>(null);
  const [impactLanded, setImpactLanded] = useState(false);
  const audio = useRef<ReturnType<typeof createCombatAudio> | null>(null);
  const lastAnswer = useRef<{ question: Question; correct: boolean } | null>(
    null,
  );
  const submitted = useRef<Battle | null>(null);
  useEffect(() => {
    audio.current = createCombatAudio();
    return () => {
      audio.current?.dispose();
      audio.current = null;
    };
  }, []);
  useEffect(() => {
    audio.current?.setMuted(save.settings.combatMuted);
  }, [save.settings.combatMuted]);
  useEffect(() => {
    audio.current?.setVolume(save.settings.sfxVolume);
  }, [save.settings.sfxVolume]);
  const startingSave = useRef(save),
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
    if (q && (b.phase === "feedback" || b.phase === "won"))
      lastAnswer.current = {
        question: q,
        correct: p.notice === "Correct",
      };
  }, [b.phase, q, p.notice]);
  useEffect(() => {
    setReviewing(false);
    if (b.phase === "choose") setMenu("skills");
  }, [b.turn, b.phase]);
  useEffect(() => {
    if (!correctFeedback || reviewing || !save.settings.battleAutoAdvance)
      return;
    const timer = setTimeout(
      advance,
      combatCueDuration(save.settings.reducedMotion) + 80,
    );
    return () => clearTimeout(timer);
  }, [
    b,
    correctFeedback,
    reviewing,
    save.settings.reducedMotion,
    save.settings.battleAutoAdvance,
  ]);
  useLayoutEffect(() => {
    const cue = p.cue;
    if (!cue) {
      setMotion(null);
      return;
    }
    setMotion(cue.kind);
    setImpactLanded(false);
    audio.current?.play(cue, save.settings.reducedMotion);
    const contactTimer = setTimeout(
      () => setImpactLanded(true),
      combatCueDuration(save.settings.reducedMotion) *
        (cue.kind === "enemy" ? 0.62 : 0.32),
    );
    setImpact(
      cue.phaseShift
        ? "ECHO-7 · Phase 2"
        : cue.special === "limit"
          ? "Limit release"
          : cue.special === "pacify"
            ? "Target stood down"
            : cue.special === "break"
              ? "Stance broken · response skipped"
              : cue.special === "weakness"
                ? "Weakness hit"
                : cue.special === "evade"
                  ? "Dodge resolved"
                  : cue.kind === "player"
                    ? `${p.content.entities.find((e) => e.id === cue.skill)?.title ?? "Hit"}`
                    : cue.kind === "poison"
                      ? "Poison"
                      : cue.kind === "miss"
                        ? "Turn spent"
                        : cue.kind === "recover"
                          ? "Opening"
                          : cue.blocked
                            ? "Guard absorbed the hit"
                            : cue.heavy
                              ? "Heavy strike"
                              : "Enemy strike",
    );
    if (b.phase !== "choose") setMenu(null);
    const timer = setTimeout(
      () => setMotion(null),
      combatCueDuration(save.settings.reducedMotion),
    );
    return () => {
      clearTimeout(timer);
      clearTimeout(contactTimer);
    };
  }, [p.cue, save.settings.reducedMotion]);
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
  const meter = (label: string, value: number, max: number, kind: string) => {
    const pendingHit =
      !impactLanded &&
      p.cue &&
      ((label === "Enemy HP" && (motion === "player" || motion === "poison")) ||
        (label === "HP" && motion === "enemy"));
    const shown = pendingHit ? Math.min(max, value + p.cue!.amount) : value;
    return (
      <div className={`battle-meter ${kind}`}>
        <div>
          <span>{label}</span>
          <strong>
            {shown} / {max}
          </strong>
        </div>
        <div
          role="progressbar"
          aria-label={label}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-valuenow={shown}
        >
          <i style={{ width: `${Math.max(0, shown / max) * 100}%` }} />
        </div>
      </div>
    );
  };
  const activeCard =
    !evading &&
    !motion &&
    (b.phase !== "choose" || (menu && menu !== "skills")) &&
    !(correctFeedback && save.settings.battleAutoAdvance && !reviewing);
  const boss = bossReadout(b);
  const upcomingIntent = enemyIntent(b, save, p.content);
  const intent =
    motion === "enemy" && p.cue
      ? {
          kind: p.cue.heavy ? "heavy" : "strike",
          label: p.cue.heavy ? "Heavy Strike" : "Strike",
          damage: p.cue.amount,
        }
      : motion === "recover"
        ? { kind: "recover", label: "Opening", damage: 0 }
        : upcomingIntent;
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
    sound("click");
    if (q.format === "choice") {
      if (submitted.current === b) return;
      submitted.current = b;
      p.onAnswer([index]);
      p.onSubmit([index]);
      return;
    }
    p.onAnswer(
      p.answer.includes(index)
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
  useEffect(() => {
    if (
      b.phase === "won" &&
      !motion &&
      gainedXp > 0 &&
      !victoryBurstSent.current
    ) {
      victoryBurstSent.current = true;
      particles("clue");
    }
  }, [b.phase, motion, gainedXp, particles]);
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
      data-sfx-silent
      onClickCapture={(event) => {
        if (
          event.target instanceof Element &&
          event.target.closest("button:not(:disabled)")
        )
          sound("click");
      }}
      onPointerDownCapture={() => audio.current?.unlock()}
      onKeyDownCapture={() => audio.current?.unlock()}
      onKeyDown={(e) => {
        if (evading) return;
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
      <div className="battle-playback" aria-label="Battle playback">
        <button
          onClick={p.onToggleSound}
          aria-label={
            save.settings.combatMuted
              ? "Enable battle sound"
              : "Mute battle sound"
          }
          title={
            save.settings.combatMuted
              ? "Enable battle sound"
              : "Mute battle sound"
          }
        >
          {save.settings.combatMuted ? (
            <VolumeX size={22} />
          ) : (
            <Volume2 size={22} />
          )}
        </button>
        <button
          aria-pressed={save.settings.battleAutoAdvance}
          onClick={p.onToggleAutoAdvance}
          title="Correct answers advance automatically. Turn off to read every explanation."
        >
          {save.settings.battleAutoAdvance ? "Auto turns" : "Manual turns"}
        </button>
        {lastAnswer.current && (
          <button
            disabled={!!motion || !["choose", "feedback"].includes(b.phase)}
            onClick={() => {
              setReviewing(true);
              if (b.phase === "choose") setMenu("inspect");
            }}
          >
            <BookOpen size={18} /> Review
          </button>
        )}
      </div>
      <div className="battle-enemy-hud">
        {b.tactics && b.phase !== "won" && b.phase !== "lost" && (
          <div className="battle-stance">
            <span>
              {b.staggered
                ? "BROKEN · next hit ×1.5"
                : `Stance ${b.resolve ?? 0} / ${b.tactics.resolve}`}
            </span>
            <strong>
              {b.weaknessKnown
                ? `Weak: ${p.content.entities.find((s) => s.type === "skill" && s.id === b.tactics!.weakness)?.title ?? b.tactics.weakness}`
                : "Weakness unknown"}
            </strong>
          </div>
        )}
        <h2 className={`enemy-name enemy-${enemyKind(b.enemyId)}`}>
          <span className="enemy-sigil" aria-hidden="true">
            {enemySigil(b.enemyId)}
          </span>
          {b.enemyName}
        </h2>
        {meter("Enemy HP", b.hp, b.maxHp, "enemy")}
        {boss && b.phase === "choose" && !motion && (
          <div className="battle-boss-rule" role="status">
            <strong>
              {boss.phase} · {boss.title}
            </strong>
            <span>{boss.description}</span>
          </div>
        )}
        {b.phase !== "won" && b.phase !== "lost" && (
          <div className={`battle-intent intent-${intent.kind}`} role="status">
            <span>{intent.label}</span>
            <strong>
              {intent.damage
                ? `${intent.damage} damage`
                : intent.kind === "recover"
                  ? b.breakFresh ||
                    (motion === "recover" && p.cue?.special === "break")
                    ? "Response skipped"
                    : "+3 focus"
                  : "Poison will finish"}
            </strong>
            {b.tactics &&
              intent.kind === "heavy" &&
              b.phase === "choose" &&
              !motion &&
              !evading && (
                <button
                  onClick={() => {
                    setMenu(null);
                    setEvading(true);
                  }}
                >
                  Evade
                </button>
              )}
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
      {evading && (
        <Evade
          seed={b.turn}
          reducedMotion={save.settings.reducedMotion}
          onResolve={(hits) => {
            setEvading(false);
            p.onEvade(hits);
          }}
          onCancel={() => {
            setEvading(false);
            p.onGuard();
          }}
        />
      )}
      {motion && (
        <>
          {motion === "enemy" && !p.cue?.blocked && (
            <div
              className="battle-hit-flash"
              aria-hidden="true"
              key={`flash-${p.cue?.sequence}`}
            />
          )}
          {(impactLanded || motion === "recover") && (
            <div
              key={p.cue?.sequence}
              className={`battle-damage-number number-${motion} ${p.cue?.blocked ? "is-blocked" : ""}`}
              aria-hidden="true"
              style={{
                animationDuration: `${combatCueDuration(save.settings.reducedMotion) * (motion === "enemy" ? 0.34 : 0.6)}ms`,
              }}
            >
              {motion === "miss"
                ? "MISS"
                : motion === "recover"
                  ? p.cue?.amount
                    ? `+${p.cue.amount} FP`
                    : p.cue?.special === "break"
                      ? "BREAK"
                      : p.cue?.special === "pacify"
                        ? "STAND DOWN"
                        : "OPENING"
                  : `${p.cue?.blocked ? "BLOCK " : ""}−${p.cue?.amount ?? 0}`}
            </div>
          )}
          <div className="battle-impact" role="status">
            {impact}
            {p.cue && p.cue.amount > 0
              ? ` · ${p.cue.amount}${motion === "recover" ? " focus" : " damage"}`
              : ""}
          </div>
        </>
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
                    : menu === "act"
                      ? "ACT"
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
              {menu === "act" && b.tactics && (
                <div className="battle-act-options">
                  <p>
                    {b.analyzed
                      ? b.tactics.act.explanation
                      : b.tactics.act.prompt}
                  </p>
                  {!b.analyzed && (
                    <>
                      <p>
                        ACT spends a turn. A successful read reveals the
                        weakness.
                      </p>
                      {b.tactics.act.options.map((option, index) => (
                        <button key={index} onClick={() => p.onAct(index)}>
                          {option}
                        </button>
                      ))}
                    </>
                  )}
                  {b.analyzed && b.tactics.spare && (
                    <>
                      <button
                        className="primary"
                        disabled={!canSpare(b)}
                        onClick={p.onSpare}
                      >
                        Stand down
                      </button>
                      {!canSpare(b) && (
                        <p>
                          Land {b.tactics.boss ? 3 : 1} correct attacks and
                          reduce enemy HP below {b.tactics.boss ? 35 : 65}%. (
                          {b.correctAnswers ?? 0} correct)
                        </p>
                      )}
                    </>
                  )}
                </div>
              )}
              {menu === "inspect" && (
                <>
                  {lastAnswer.current && (
                    <details open={reviewing}>
                      <summary>
                        Last answer:{" "}
                        {lastAnswer.current.correct ? "Correct" : "Review"}
                      </summary>
                      <p>{lastAnswer.current.question.prompt}</p>
                      <p>{lastAnswer.current.question.explanation}</p>
                    </details>
                  )}
                  {boss && (
                    <p>
                      {boss.title}: {boss.description}
                    </p>
                  )}
                  <p>
                    Attack {b.attack} · Your defense {limits.defense}
                  </p>
                  <p>
                    Guard reduces the next hit and restores 4 focus. A wrong
                    answer spends the turn. Shield and weaken reduce incoming
                    damage; poison damages the enemy.
                    {b.tactics &&
                      " Weakness hits break stance, skipping one response and strengthening your next hit. Correct answers and Guard bank Boost; each spent point adds 25% damage. Limit builds from correct answers and taking hits. ACT can reveal a peaceful resolution."}
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
                {q.format !== "choice" && (
                  <button
                    className="primary"
                    disabled={!answerReady}
                    onClick={() => p.onSubmit()}
                  >
                    {b.finisher
                      ? "Release Limit"
                      : `Use ${skills.find((s) => s.id === b.skill)?.title ?? "skill"}`}{" "}
                    <kbd>Enter</kbd>
                  </button>
                )}
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
              {(!correctFeedback ||
                reviewing ||
                !save.settings.battleAutoAdvance) && (
                <p className="battle-explanation">{q?.explanation}</p>
              )}
              {!correctFeedback && q && (
                <p className="battle-correct-answer">
                  Correct answer:{" "}
                  {q.answer
                    .map((index) => q.options[index])
                    .join(q.format === "ordering" ? " → " : "; ")}
                </p>
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
                <button onClick={p.onReview}>Bookmark chapter</button>
              </footer>
            </>
          )}
          {b.phase === "won" && (
            <>
              <h2 ref={title} tabIndex={-1}>
                {b.resolution === "pacified"
                  ? `${b.enemyName} stood down`
                  : b.enemyId === "echo-7"
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
                        in the character menu.
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
      {b.phase === "choose" && !motion && !evading && menu === "skills" && (
        <div className="battle-skill-tray" aria-label="Available skills">
          {b.tactics && (
            <div className="battle-special-actions">
              <button onClick={() => setMenu("act")}>
                {canSpare(b) ? "ACT · Stand down" : "ACT"}
              </button>
              <button
                disabled={!b.boost}
                aria-label={`Boost ${b.boostSpend ?? 0} of ${b.boost ?? 0}`}
                onClick={() =>
                  p.onBoost(((b.boostSpend ?? 0) + 1) % ((b.boost ?? 0) + 1))
                }
                title="Cycle stored Boost. Each point adds 25% damage to your next skill."
              >
                Boost {b.boostSpend ?? 0} / {b.boost ?? 0}
              </button>
              <button
                className={b.limit === 100 ? "limit-ready" : ""}
                disabled={b.limit !== 100}
                onClick={p.onFinisher}
                title="At 100%, answer correctly for a triple-power Probe."
              >
                Limit {b.limit ?? 0}%
              </button>
            </div>
          )}
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
                {previewDamage(b, save, s, p.content)} damage
                {b.weaknessKnown && b.tactics?.weakness === s.id
                  ? " · WEAK"
                  : ""}
                {s.effect ? ` · ${s.effect}` : ""}
              </span>
            </button>
          ))}
        </div>
      )}
      <nav className="battle-command-menu" aria-label="Battle commands">
        <span>Turn {b.turn}</span>
        {(["skills", "inspect"] as const).map((id) => (
          <button
            key={id}
            aria-expanded={b.phase === "choose" && menu === id}
            disabled={b.phase !== "choose" || !!motion || evading}
            onClick={() => setMenu(menu === id ? null : id)}
          >
            {id === "skills" ? (
              <Crosshair size={22} aria-hidden="true" />
            ) : (
              <ScanSearch size={22} aria-hidden="true" />
            )}
            {id[0].toUpperCase() + id.slice(1)}
          </button>
        ))}
        <button
          disabled={b.phase !== "choose" || !!motion || evading}
          onClick={p.onGuard}
          title="Reduce the incoming hit by 70% and restore 4 focus. Spends a turn; no question."
        >
          <ShieldCheck size={22} aria-hidden="true" />
          Guard <span>+4 FP</span>
        </button>
        <button disabled={!!motion || evading} onClick={p.onRetreat}>
          <LogOut size={22} aria-hidden="true" />
          Retreat
        </button>
      </nav>
    </div>
  );
}
