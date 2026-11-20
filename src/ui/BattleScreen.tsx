import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Content, Item, Question, Skill } from "../content/schema";
import {
  canSpare,
  battleAnswerOrder,
  battleQuizDuration,
  previewDamage,
  enemyIntent,
  bossReadout,
  type Battle,
} from "../game/combat";
import { Evade } from "./Evade";
import { evadeSeed } from "../game/evade";
import "./BattleDepth.css";
import "./BattleConsole.css";
import { stats, type Save } from "../game/state";
import {
  combatContactMs,
  combatCueDuration,
  combatPresentationDuration,
  QUIZ_CAST_MS,
  type BattleCue,
  type QuizOrigin,
} from "../game/combatPresentation";
import { XpMeter } from "./XpMeter";
import { SupplyIcon } from "./SupplyIcon";
import { RpgIcon } from "./RpgIcon";
import { useGameSound } from "./GameSound";
import { enemyArchetype, enemyThreatName } from "../game/enemyIdentity";
import { EnemySpeech } from "./EnemySpeech";
import { useSceneTransitioning } from "./SceneTransition";
import { createCombatAudio } from "../game/combatAudio";
import { createCombatHaptics } from "../game/combatHaptics";
import { useBattleFeedback } from "./useBattleFeedback";
import "./BattleFeedback.css";
import {
  Volume2,
  VolumeX,
  BookOpen,
} from "lucide-react";

interface Props {
  paused?: boolean;
  covered?: boolean;
  previewVictory?: boolean;
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
  onItem: (item: Item) => void;
  onMomentum: (amount: number) => void;
  onFinisher: () => void;
  onAct: (choice: number) => void;
  onSpare: () => void;
  onEvade: (collisions: number) => void;
  onSubmit: (answer?: number[], elapsedMs?: number, quizOrigin?: QuizOrigin) => void;
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
function enemySigil(kind: ReturnType<typeof enemyArchetype>) {
  return {
    echo: "✦",
    warden: "▲",
    keeper: "▣",
    mimic: "◉",
    interceptor: "➤",
    drone: "◇",
    decoy: "◌",
    mantis: "➤",
    ram: "▣",
    weaver: "◇",
    array: "◉",
    sentinel: "◆",
  }[kind];
}
export function BattleScreen(p: Props) {
  const sceneTransitioning = useSceneTransitioning();
  const sound = useGameSound();
  const [osReduced, setOsReduced] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => setOsReduced(query.matches);
    query.addEventListener("change", change);
    return () => query.removeEventListener("change", change);
  }, []);
  const { battle: b, save, question: q } = p,
    limits = stats(save, p.content);
  const battleEnded = b.phase === "won" || b.phase === "lost";
  const kind = enemyArchetype(b.enemyId);
  const threat = enemyThreatName(b.enemyId);
  const reducedMotion = save.settings.reducedMotion || osReduced;
  const changes = useBattleFeedback(b, save, p.content);
  const changed = (target: string) =>
    changes.filter((change) => change.target === target).at(-1);
  const resultChanges = changes.filter((change) =>
    ["momentum", "effect", "stance"].includes(change.target),
  );
  const [menu, setMenu] = useState<
    "skills" | "analyze" | "talk" | "defend" | "items" | null
  >("skills");
  const [evading, setEvading] = useState(false);
  const skillList = useRef<HTMLDivElement>(null);
  const defenseList = useRef<HTMLDivElement>(null);
  const momentumMenu = useRef<HTMLDetailsElement>(null);
  const dodgeAttempt = useRef(Math.floor(Math.random() * 0x7fffffff));
  const [reviewing, setReviewing] = useState(false);
  const [impact, setImpact] = useState("");
  const [motion, setMotion] = useState<BattleCue["kind"] | null>(null);
  const [landedSequence, setLandedSequence] = useState<number | null>(null);
  const impactLanded = p.cue?.sequence === landedSequence;
  useEffect(() => {
    if ((b.phase !== "choose" || motion) && momentumMenu.current)
      momentumMenu.current.open = false;
  }, [b.phase, b.turn, motion]);
  const audio = useRef<ReturnType<typeof createCombatAudio> | null>(null);
  const haptics = useRef<ReturnType<typeof createCombatHaptics> | null>(null);
  const lastAnswer = useRef<{ question: Question; correct: boolean } | null>(
    null,
  );
  const submitted = useRef<Battle | null>(null);
  useEffect(() => {
    audio.current = createCombatAudio();
    haptics.current = createCombatHaptics();
    const stopWhenHidden = () => {
      if (document.hidden) haptics.current?.cancel();
    };
    document.addEventListener("visibilitychange", stopWhenHidden);
    return () => {
      document.removeEventListener("visibilitychange", stopWhenHidden);
      haptics.current?.cancel();
      haptics.current = null;
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
  const quizDuration = b.phase === "question" && q ? battleQuizDuration(q.format) : 0;
  const quizClock = useRef({ elapsed: 0, started: null as number | null });
  const quizCard = useRef<HTMLElement>(null);
  const castLayer = useRef<HTMLDivElement>(null);
  const pendingCast = useRef<{
    card: HTMLElement;
    left: number;
    top: number;
    width: number;
    height: number;
    scroll: number;
  } | null>(null);
  const [quizElapsed, setQuizElapsed] = useState(0);
  useLayoutEffect(() => {
    quizClock.current = { elapsed: 0, started: null };
    setQuizElapsed(0);
  }, [quizDuration, b.turn, b.question]);
  useLayoutEffect(() => {
    if (!quizDuration || p.paused) return;
    const clock = quizClock.current;
    const started = performance.now();
    clock.started = started;
    const timer = window.setInterval(() => {
      const elapsed = Math.min(quizDuration, clock.elapsed + performance.now() - started);
      setQuizElapsed(elapsed);
      if (elapsed >= quizDuration) window.clearInterval(timer);
    }, 100);
    return () => {
      window.clearInterval(timer);
      clock.elapsed = Math.min(quizDuration, clock.elapsed + performance.now() - started);
      clock.started = null;
    };
  }, [quizDuration, b.turn, b.question, p.paused]);
  const submitQuiz = (answer?: number[]) => {
    const clock = quizClock.current;
    if (!quizDuration || p.paused) return;
    const running = clock.started === null ? 0 : performance.now() - clock.started;
    let origin: QuizOrigin | undefined;
    pendingCast.current = null;
    if (!reducedMotion && quizCard.current && castLayer.current) {
      const live = quizCard.current;
      const stage = castLayer.current.getBoundingClientRect();
      const { left, top, width, height } = live.getBoundingClientRect();
      if (width && height && stage.width && stage.height) {
        const selected = answer ?? p.answer;
        const card = live.cloneNode(true) as HTMLElement;
        card.removeAttribute("aria-label");
        card.querySelectorAll("[id]").forEach((node) => node.removeAttribute("id"));
        card.querySelectorAll(".battle-answer-options button").forEach((button, position) => {
          const chosen = selected.includes(displayOptions[position].index);
          button.classList.toggle("selected", chosen);
          button.setAttribute("aria-pressed", String(chosen));
        });
        const x = left - stage.left;
        const y = top - stage.top;
        pendingCast.current = { card, left: x, top: y, width, height, scroll: live.scrollTop };
        origin = { x: (x + width / 2) / stage.width, y: (y + height / 2) / stage.height };
      }
    }
    p.onSubmit(answer, clock.elapsed + running, origin);
  };
  const remaining = Math.max(0, quizDuration - quizElapsed);
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
    if (
      sceneTransitioning ||
      p.paused ||
      !correctFeedback ||
      reviewing ||
      !save.settings.battleAutoAdvance
    )
      return;
    const timer = setTimeout(advance, combatCueDuration(reducedMotion) + 80);
    return () => clearTimeout(timer);
  }, [
    b,
    correctFeedback,
    reviewing,
    reducedMotion,
    save.settings.battleAutoAdvance,
    sceneTransitioning,
    p.paused,
  ]);
  useLayoutEffect(() => {
    const cue = p.cue;
    if (!cue) {
      setMotion(null);
      return;
    }
    setMotion(cue.kind);
    setLandedSequence(null);
    const cast = pendingCast.current;
    pendingCast.current = null;
    const layer = castLayer.current;
    let castTimer: ReturnType<typeof setTimeout> | undefined;
    if (cue.quizOrigin && cast && layer && !reducedMotion) {
      const snapshot = document.createElement("div");
      snapshot.className = "battle-console quiz-cast-snapshot";
      Object.assign(snapshot.style, {
        left: `${cast.left}px`, top: `${cast.top}px`,
        width: `${cast.width}px`, height: `${cast.height}px`,
        animationDuration: `${QUIZ_CAST_MS}ms`,
      });
      snapshot.append(cast.card);
      layer.append(snapshot);
      cast.card.scrollTop = cast.scroll;
      castTimer = setTimeout(() => snapshot.remove(), QUIZ_CAST_MS);
      if (!layer.closest("[data-enemy-speech-anchor]")) {
        const bolt = document.createElement("span");
        bolt.className = "quiz-cast-bolt";
        bolt.style.left = `${cue.quizOrigin.x * 100}%`;
        bolt.style.top = `${cue.quizOrigin.y * 100}%`;
        layer.append(bolt);
        const dx = (0.5 - cue.quizOrigin.x) * layer.clientWidth;
        const dy = (0.22 - cue.quizOrigin.y) * layer.clientHeight;
        bolt.animate(
          [
            { transform: "translate(-50%, -50%)", opacity: 1 },
            { transform: `translate(-50%, -50%) translate(${dx}px, ${dy}px)`, opacity: 0.7 },
          ],
          {
            duration: combatContactMs(cue, false) - QUIZ_CAST_MS,
            delay: QUIZ_CAST_MS,
            easing: "ease-in",
            fill: "forwards",
          },
        ).onfinish = () => bolt.remove();
      }
    }
    audio.current?.play(cue, reducedMotion);
    const contactTimer = setTimeout(
      () => {
        setLandedSequence(cue.sequence);
        haptics.current?.impact(cue, reducedMotion);
      },
      combatContactMs(cue, reducedMotion),
    );
    setImpact(
      cue.phaseShift
        ? "ECHO-7 · Phase 2"
        : cue.special === "finisher"
          ? "Finisher"
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
                            ? "Defense absorbed the hit"
                            : cue.heavy
                              ? "Heavy strike"
                              : "Enemy strike",
    );
    if (b.phase !== "choose") setMenu(null);
    const timer = setTimeout(
      () => setMotion(null),
      combatPresentationDuration(cue, reducedMotion),
    );
    return () => {
      clearTimeout(timer);
      clearTimeout(contactTimer);
      clearTimeout(castTimer);
      layer?.replaceChildren();
      haptics.current?.cancel();
    };
  }, [p.cue, reducedMotion]);
  useEffect(() => {
    if (motion || evading || p.paused || sceneTransitioning) return;
    if (battleEnded) title.current?.focus();
    else if (menu === "skills")
      skillList.current
        ?.querySelector<HTMLButtonElement>("button:not(:disabled)")
        ?.focus();
    else if (menu === "defend")
      defenseList.current?.querySelector<HTMLButtonElement>("button")?.focus();
    else if (menu || b.phase !== "choose") title.current?.focus();
    else skillsButton.current?.focus();
  }, [b.phase, b.turn, battleEnded, evading, menu, motion, p.paused, sceneTransitioning]);
  const skills = p.content.entities.filter(
    (e): e is Skill =>
      e.type === "skill" && save.character.skills.includes(e.id),
  );
  const items = p.content.entities.filter(
    (entry): entry is Item =>
      entry.type === "item" &&
      (entry.kind === "healing" || entry.kind === "focus") &&
      (save.supply.items[entry.id] ?? 0) > 0,
  );
  const meter = (label: string, value: number, max: number, kind: string) => {
    const pendingHit =
      !impactLanded &&
      p.cue &&
      ((label === "Enemy HP" && (motion === "player" || motion === "poison")) ||
        (label === "HP" && motion === "enemy"));
    const shown = pendingHit ? Math.min(max, value + p.cue!.amount) : value;
    const change = pendingHit ? undefined : changed(kind);
    return (
      <div
        key={`${kind}-${change?.sequence ?? 0}`}
        className={`battle-meter ${kind}${change ? ` meter-changed change-${change.tone}` : ""}${kind === "health" && shown > 0 && shown <= max * 0.25 ? " health-critical" : ""}`}
      >
        <div>
          <span>
            {label}
            {kind === "health" && shown > 0 && shown <= max * 0.25
              ? " · LOW"
              : ""}
          </span>
          <strong>
            {shown} / {max}
          </strong>
        </div>
        {change?.delta !== undefined && (
          <span className="battle-meter-delta" role="status">
            {change.delta > 0 ? "+" : "−"}
            {Math.abs(change.delta)} {label}
          </span>
        )}
        <div
          role="progressbar"
          aria-label={label}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-valuenow={shown}
        >
          {change?.delta !== undefined && change.delta < 0 && (
            <span
              className="battle-meter-trail"
              aria-hidden="true"
              style={{
                width: `${Math.min(100, ((change.previous ?? value) / max) * 100)}%`,
              }}
            />
          )}
          <i style={{ width: `${Math.max(0, shown / max) * 100}%` }} />
        </div>
      </div>
    );
  };
  const activeCard = !battleEnded && !evading && !motion;
  const quizCasting = motion === "player" && Boolean(p.cue?.quizOrigin) && !reducedMotion;
  const inspecting = menu === "analyze" || menu === "talk";
  const boss = bossReadout(b);
  const weakness =
    b.weaknessKnown && b.tactics
      ? (p.content.entities.find(
          (e) => e.type === "skill" && e.id === b.tactics?.weakness,
        )?.title ?? b.tactics.weakness)
      : null;
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
  const displayOptions = q
    ? battleAnswerOrder(q, b.turn, b.questionOffset).map((index) => ({
        text: q.options[index],
        index,
      }))
    : [];
  const selectAnswer = (index: number) => {
    if (!q || b.phase !== "question") return;
    sound("click");
    if (q.format === "choice") {
      if (submitted.current === b) return;
      submitted.current = b;
      p.onAnswer([index]);
      submitQuiz([index]);
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
  const gainedTokens = Math.max(
    0,
    save.supply.tokens - startingSave.current.supply.tokens,
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
      className={`battle-screen battle-layout-console phase-${b.phase} ${quizCasting ? "quiz-casting" : ""} ${motion ? `motion-${motion}` : ""} ${impactLanded && motion && p.cue?.amount && motion === "enemy" ? "impact-damage" : impactLanded && motion && p.cue?.defeated ? "impact-defeat" : ""}`}
      data-cast-skill={quizCasting ? (p.cue?.special === "finisher" ? "finisher" : p.cue?.skill) : undefined}
      hidden={p.covered}
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
        if (e.key === "Escape" && menu !== null && menu !== "skills") {
          e.preventDefault();
          e.stopPropagation();
          setMenu(menu === "talk" ? "analyze" : "skills");
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
          submitQuiz();
        }
      }}
    >
      <div className="battle-enemy-hud" hidden={battleEnded && !motion}>
        <h2 className={`enemy-name enemy-${kind}`}>
          <span className="enemy-sigil" aria-hidden="true">
            {enemySigil(kind)}
          </span>
          {b.enemyName}
        </h2>
        {threat !== b.enemyName && <p className="enemy-threat">{threat}</p>}
        {meter("Enemy HP", b.hp, b.maxHp, "enemy")}
        <div className="battle-status-effects">
          {b.effects
            .filter((e) => e.id !== "shield")
            .map((e) => (
              <span
                key={`${e.id}-${e.remaining}-${e.magnitude}`}
                className={
                  changes.some((change) => change.id === `effect-${e.id}`)
                    ? "effect-changed"
                    : ""
                }
              >
                {e.id} · {e.remaining} turns
              </span>
            ))}
        </div>
      </div>
      <div className="quiz-cast-layer" ref={castLayer} aria-hidden="true" inert />
      <EnemySpeech
        key={b.enemyId}
        battle={b}
        cue={p.cue}
        awaitingImpact={Boolean(p.cue?.quizOrigin) && !impactLanded}
        hidden={evading || b.phase === "question" || battleEnded}
        reducedMotion={reducedMotion}
      />
      {evading && (
        <Evade
          muted={save.settings.combatMuted}
          seed={evadeSeed(b.enemyId, b.turn, dodgeAttempt.current)}
          reducedMotion={reducedMotion}
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
                animationDuration: `${combatCueDuration(reducedMotion) * (motion === "enemy" ? 0.34 : 0.6)}ms`,
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
        </>
      )}
      <div className="battle-console" aria-label="Battle console" hidden={battleEnded}>
        <header className="battle-console-status">
          <div className="battle-player-hud">
            <strong>{save.character.name}</strong>
            {meter("HP", save.character.hp, limits.maxHp, "health")}
            {meter("Focus", save.character.focus, limits.maxFocus, "focus")}
            <details className="battle-momentum" ref={momentumMenu}>
              <summary
                aria-label={`Momentum ${b.momentum} of 100. ${b.momentumSpend} committed. Choose attack power`}
                onClick={(event) => {
                  if (b.phase !== "choose" || motion || evading)
                    event.preventDefault();
                }}
              >
                <span className="momentum-label">
                  Momentum <strong>{b.momentum}/100 ▾</strong>
                </span>
                <span
                  className="momentum-track"
                  role="progressbar"
                  aria-label="Momentum"
                  aria-valuenow={b.momentum}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <i style={{ width: `${b.momentum}%` }} />
                </span>
              </summary>
              <div className="momentum-options">
                <p>Power next attack</p>
                {[0, 25, 50, 75]
                  .filter((amount) => amount <= b.momentum)
                  .map((amount) => (
                    <button
                      key={amount}
                      aria-pressed={b.momentumSpend === amount}
                      disabled={b.phase !== "choose" || !!motion || evading}
                      onClick={() => {
                        p.onMomentum(amount);
                        if (momentumMenu.current)
                          momentumMenu.current.open = false;
                      }}
                    >
                      {amount
                        ? `Spend ${amount} · +${amount}% damage`
                        : "Save Momentum"}
                    </button>
                  ))}
                {b.momentum === 100 && (
                  <button
                    className="finisher-ready"
                    onClick={() => {
                      if (momentumMenu.current)
                        momentumMenu.current.open = false;
                      setMenu(null);
                      p.onFinisher();
                    }}
                  >
                    Finisher · spend 100 · triple Probe
                  </button>
                )}
              </div>
            </details>
            <div className="battle-status-effects">
              {b.effects
                .filter((e) => e.id === "shield")
                .map((e) => (
                  <span
                    key={`${e.id}-${e.remaining}-${e.magnitude}`}
                    className={
                      changes.some((change) => change.id === `effect-${e.id}`)
                        ? "effect-changed"
                        : ""
                    }
                  >
                    Shield · {e.remaining} turns
                  </span>
                ))}
            </div>
          </div>

          <div
            className={`battle-intent intent-${intent.kind}${!motion && changed("intent") ? " intent-changed" : ""}`}
            role="status"
          >
            <span>
              TURN {b.turn} ·{" "}
              {b.phase === "won" ? "ENCOUNTER COMPLETE" : "INCOMING"}
            </span>
            {b.phase !== "won" && (
              <strong
                key={
                  !motion
                    ? changed("intent")?.sequence
                    : `cue-${p.cue?.sequence}`
                }
              >
                {intent.label}
                {intent.damage
                  ? ` · ${intent.damage} damage`
                  : intent.kind === "recover"
                    ? " · focus recovery"
                    : ""}
              </strong>
            )}
            {b.tactics &&
              b.phase === "choose" &&
              (b.staggered || !!b.resolve) && (
                <span>
                  {b.staggered
                    ? "Armor broken · next hit ×1.5"
                    : `Break ${b.resolve}/${b.tactics.resolve}`}
                </span>
              )}
          </div>
          <details className="battle-playback">
            <summary>Battle options</summary>
            <div className="battle-playback-options">
              <button
                onClick={p.onToggleSound}
                aria-label={
                  save.settings.combatMuted
                    ? "Enable battle sound"
                    : "Mute battle sound"
                }
              >
                {save.settings.combatMuted ? (
                  <VolumeX size={18} />
                ) : (
                  <Volume2 size={18} />
                )}
                {save.settings.combatMuted ? "Sound off" : "Sound on"}
              </button>
              <button
                aria-pressed={save.settings.battleAutoAdvance}
                onClick={p.onToggleAutoAdvance}
              >
                {save.settings.battleAutoAdvance
                  ? "Auto turns"
                  : "Manual turns"}
              </button>
            </div>
          </details>
        </header>
        {resultChanges.length > 0 && (
          <div
            className="battle-change-feed"
            role="status"
            aria-label="Turn changes"
          >
            {resultChanges.map((change) => (
              <span
                key={change.sequence}
                className={`battle-change change-${change.tone}`}
              >
                {change.text}
              </span>
            ))}
          </div>
        )}
        {motion && (
          <div className="battle-console-transition" role="status">
            {impact}
            {p.cue?.amount
              ? ` · ${p.cue.amount} ${motion === "recover" ? "focus" : "damage"}`
              : ""}
          </div>
        )}
        {activeCard && (
          <section
            key={`${b.turn}:${b.phase}:${menu}`}
            ref={b.phase === "question" ? quizCard : undefined}
            className={`battle-decision ${b.phase === "choose" ? "command-panel" : "quiz-panel"} ${inspecting ? "analysis-panel" : ""} ${b.phase === "feedback" ? "feedback-panel" : ""} ${correctFeedback ? "answer-correct" : ""}`}
            aria-label={
              b.phase === "question" ? "Battle question" : "Battle decision"
            }
          >
            {b.phase === "choose" && (
              <>
                {inspecting && (
                  <header>
                    <h2 ref={title} tabIndex={-1}>
                      {menu === "talk" ? "Talk" : "Inspect"}
                    </h2>
                    {menu === "talk" && (
                      <span className="analysis-note">
                        Uses a turn. A good reply reveals a weakness and adds 20 Momentum.
                      </span>
                    )}
                    <button
                      onClick={() => setMenu(menu === "talk" ? "analyze" : "skills")}
                    >
                      Back
                    </button>
                  </header>
                )}
                {menu === "skills" && (
                  <div
                    className="battle-skill-options"
                    ref={skillList}
                    aria-label="Available skills"
                  >
                    {skills.map((s, index) => {
                      const icon =
                        s.effect === "shield"
                          ? "firewall"
                          : s.effect === "poison"
                            ? "trace"
                            : "probe";
                      const effects = [
                        s.bonusMomentum && `+${s.bonusMomentum} Momentum`,
                        s.openingPower && `+${s.openingPower} on Opening`,
                        s.effect === "shield" && "Shield",
                        s.effect === "poison" && "Poison",
                      ]
                        .filter(Boolean)
                        .join(" · ");
                      return (
                        <button
                          key={s.id}
                          title={s.description}
                          aria-description={s.description}
                          disabled={
                            save.character.focus < s.cost ||
                            save.character.hp === 0
                          }
                          onClick={() => {
                            setMenu(null);
                            p.onSkill(s);
                          }}
                        >
                          <span>
                            <strong className="battle-icon-label">
                              <RpgIcon name={icon} />
                              {s.title} <kbd>{index + 1}</kbd>
                            </strong>
                            <span className="skill-description">
                              {s.description}
                            </span>
                          </span>
                          <b>
                            {s.cost ? `${s.cost} focus` : "Free"} ·{" "}
                            {previewDamage(b, save, s, p.content)} max damage
                            {b.momentumSpend > 0
                              ? ` · +${b.momentumSpend}% powered`
                              : ""}
                            {b.weaknessKnown && b.tactics?.weakness === s.id
                              ? " · WEAK"
                              : ""}
                            {effects && (
                              <>
                                <br />
                                {effects}
                              </>
                            )}
                          </b>
                        </button>
                      );
                    })}
                  </div>
                )}
                {menu === "defend" && (
                  <div className="battle-defense-options" ref={defenseList}>
                    <button
                      onClick={p.onGuard}
                      aria-description="Spends a turn and banks 15 Momentum."
                    >
                      <RpgIcon name="brace" />
                      Brace · −70% damage · +4 focus
                    </button>
                    <button
                      onClick={() => {
                        setMenu(null);
                        dodgeAttempt.current++;
                        setEvading(true);
                      }}
                    >
                      <RpgIcon name="dodge" />
                      Dodge · timing challenge
                    </button>
                  </div>
                )}
                {menu === "items" && (
                  <>
                    <header>
                      <h2 ref={title} tabIndex={-1}>
                        Items
                      </h2>
                    </header>
                    <p>
                      {items.length
                        ? "Using an item spends your turn."
                        : "No consumables in your kit."}
                    </p>
                    <div className="battle-skill-options">
                      {items.map((item) => (
                        <button
                          key={item.id}
                          disabled={
                            item.kind === "healing"
                              ? save.character.hp >= limits.maxHp
                              : save.character.focus >= limits.maxFocus
                          }
                          onClick={() => p.onItem(item)}
                        >
                          <strong className="battle-icon-label">
                            <SupplyIcon item={item} />
                            {item.title} × {save.supply.items[item.id]}
                          </strong>
                          <span>
                            Restore {item.amount} {item.kind === "healing" ? "HP" : "Focus"}
                          </span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
                {menu === "analyze" && (
                  <>
                    {boss && (
                      <p>
                        <strong>{boss.title}</strong> · {boss.description}
                      </p>
                    )}
                    {weakness && <p>Weak to {weakness}</p>}
                    {!boss && !weakness && !b.tactics && (
                      <p>
                        Next move · {upcomingIntent.label}
                        {upcomingIntent.damage ? ` · ${upcomingIntent.damage} damage` : ""}
                      </p>
                    )}
                    {b.tactics && !b.analyzed && (
                      <button className="inspect-talk" onClick={() => setMenu("talk")}>
                        Talk
                      </button>
                    )}
                    {b.analyzed && b.tactics?.spare && (
                      <div className="battle-act-options">
                        <button
                          className="primary"
                          disabled={!canSpare(b)}
                          onClick={p.onSpare}
                        >
                          Stand down
                        </button>
                        {!canSpare(b) && (
                          <p className="analysis-note">
                            Correct attacks {Math.min(b.correctAnswers ?? 0, b.tactics.boss ? 3 : 1)}/{b.tactics.boss ? 3 : 1}
                            {" · "}Enemy HP must reach {b.tactics.boss ? 35 : 65}% or less.
                          </p>
                        )}
                      </div>
                    )}
                    <details>
                      <summary>Turn history</summary>
                      {lastAnswer.current && (
                        <p>
                          <strong>
                            Last answer · {lastAnswer.current.correct ? "Correct" : "Incorrect"}
                          </strong>
                          <br />
                          {lastAnswer.current.question.explanation}
                        </p>
                      )}
                      {b.log.slice(-3).map((line, i) => (
                        <p key={i}>{line}</p>
                      ))}
                    </details>
                  </>
                )}
                {menu === "talk" && b.tactics && !b.analyzed && (
                  <>
                    <p>{b.tactics.act.prompt}</p>
                    <div className="analysis-replies">
                      {b.tactics.act.options.map((option, index) => (
                        <button key={index} onClick={() => p.onAct(index)}>
                          {option}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
            {b.phase === "question" && q && (
              <>
                <p className="battle-quiz-time">
                  {b.finisher
                    ? "FINISHER"
                    : (skills.find((s) => s.id === b.skill)?.title ??
                      "ATTACK")}{" "}
                  · {remaining > 0
                    ? `${Math.ceil(remaining / 1000)}s · Faster answers deal more damage`
                    : "Time expired · 0 damage"}
                </p>
                <progress
                  className="battle-quiz-timer"
                  aria-label="Time remaining for damage"
                  max={quizDuration}
                  value={remaining}
                />
                <h2 ref={title} tabIndex={-1}>
                  {q.prompt}
                </h2>
                {q.format === "ordering" && (
                  <p>
                    Select steps in order. Select again to undo.
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
                      <span>
                        {q.format === "ordering" && p.answer.includes(index)
                          ? `#${p.answer.indexOf(index) + 1}`
                          : position + 1}
                      </span>
                      {text}
                    </button>
                  ))}
                </div>
                <footer>
                  {q.format !== "choice" && (
                    <button
                      className="primary"
                      disabled={!answerReady}
                      onClick={() => submitQuiz()}
                    >
                      {b.finisher
                        ? "Use finisher"
                        : `Use ${skills.find((s) => s.id === b.skill)?.title ?? "skill"}`}{" "}
                      <kbd>Enter</kbd>
                    </button>
                  )}
                    <button onClick={p.onHint}>
                      <RpgIcon name="hint" />
                      Hint · no mastery credit
                    </button>
                    <button onClick={p.onRetreat}>
                      <RpgIcon name="retreat" /> Retreat
                    </button>
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
                    <RpgIcon name="advance" />
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
                  <button onClick={p.onReview}>
                    <RpgIcon name="bookmark" /> Bookmark chapter
                  </button>
                </footer>
              </>
            )}
          </section>
        )}
        <div
          className="battle-command-slot"
          inert={b.phase !== "choose" || !activeCard}
        >
          <div>
            <nav className="battle-command-menu" aria-label="Battle commands">
              <button
                ref={skillsButton}
                aria-pressed={menu === "skills"}
                disabled={b.phase !== "choose" || !!motion || evading}
                onClick={() => setMenu("skills")}
              >
                <RpgIcon name="skills" />
                <span>Skills</span>
              </button>
              <button
                disabled={b.phase !== "choose" || !!motion || evading}
                aria-pressed={menu === "defend"}
                onClick={() => {
                  if (b.tactics && intent.kind === "heavy") setMenu("defend");
                  else p.onGuard();
                }}
              >
                <RpgIcon name="brace" />
                <span>
                  Defend<small>Brace or dodge</small>
                </span>
              </button>
              <button
                aria-pressed={menu === "items"}
                disabled={b.phase !== "choose" || !!motion || evading}
                onClick={() => setMenu("items")}
              >
                <RpgIcon name="items" />
                <span>Items</span>
              </button>
              <button
                aria-pressed={inspecting}
                disabled={b.phase !== "choose" || !!motion || evading}
                onClick={() => setMenu("analyze")}
              >
                <RpgIcon name="inspect" />
                <span>Inspect</span>
              </button>
              <button
                disabled={!!motion || evading || b.phase === "lost"}
                onClick={p.onRetreat}
              >
                <RpgIcon name="retreat" />
                <span>
                  Retreat<small>Keep evidence</small>
                </span>
              </button>
            </nav>
          </div>
        </div>
      </div>
      {b.phase === "won" && !motion && (
        <section
          className="battle-victory"
          data-pacified={b.resolution === "pacified" || undefined}
          aria-labelledby="battle-victory-title"
        >
          <h2 id="battle-victory-title" ref={title} tabIndex={-1}>
            {b.resolution === "pacified"
              ? `${b.enemyName} stood down`
              : b.enemyId === "echo-7"
                ? "ECHO-7 contained"
                : `${b.enemyName} defeated`}
          </h2>
          <div className="battle-victory-details" role="region" aria-label="Victory details" tabIndex={0}>
            <div className="battle-xp-reward" data-earned={gainedXp > 0 || undefined}>
              <strong role="status">
                {gainedXp
                  ? `+${gainedXp} XP`
                  : p.previewVictory
                    ? "Debug victory · no reward"
                    : "Practice victory · XP already earned"}
              </strong>
              {gainedXp > 0 && (
                <XpMeter
                  xp={save.character.xp}
                  initialXp={startingSave.current.character.xp}
                  reducedMotion={reducedMotion}
                  label="Victory experience"
                />
              )}
              {gainedTokens > 0 && <p>+{gainedTokens} Supply Token</p>}
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
          </div>
          <footer>
            <button className="primary" onClick={p.onJournal}>
              {p.victoryActionLabel ?? "Quest map"}
            </button>
            <button onClick={p.onRetreat}>Return to network</button>
          </footer>
        </section>
      )}
      {b.phase === "lost" && !motion && (
        <section
          className="battle-death"
          role="dialog"
          aria-modal="true"
          aria-labelledby="battle-death-title"
          onKeyDown={(event) => {
            if (event.key !== "Tab") return;
            const buttons = [
              ...event.currentTarget.querySelectorAll<HTMLButtonElement>(
                "button",
              ),
            ];
            const index = buttons.indexOf(
              document.activeElement as HTMLButtonElement,
            );
            event.preventDefault();
            buttons[
              index < 0
                ? event.shiftKey
                  ? buttons.length - 1
                  : 0
                : (index + (event.shiftKey ? -1 : 1) + buttons.length) %
                  buttons.length
            ]?.focus();
          }}
        >
          <h1 id="battle-death-title" ref={title} tabIndex={-1}>
            Signal lost
          </h1>
          <p>Your recovered evidence is safe.</p>
          <div className="death-actions">
            {p.onRetry && (
              <button className="primary" onClick={p.onRetry}>
                Recover & retry
              </button>
            )}
            <button onClick={p.onRecover}>Return to the office</button>
          </div>
        </section>
      )}
    </div>
  );
}
