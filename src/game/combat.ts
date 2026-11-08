import type {
  CombatTactics,
  Content,
  Effect,
  Question,
  Skill,
} from "../content/schema";
export type { CombatTactics } from "../content/schema";
import { stats, type Save } from "./state";
export interface ActiveEffect {
  id: "shield" | "poison" | "weaken";
  remaining: number;
  magnitude: number;
}
export interface Battle {
  enemyId: string;
  enemyName: string;
  attack: number;
  mixedQuestions: boolean;
  lessons?: string[];
  hp: number;
  maxHp: number;
  turn: number;
  phase: "choose" | "question" | "feedback" | "won" | "lost";
  skill: string | null;
  question: string | null;
  effects: ActiveEffect[];
  log: string[];
  assisted: boolean;
  guarding?: boolean;
  tactics?: CombatTactics;
  resolve?: number;
  staggered?: boolean;
  breakFresh?: boolean;
  boost?: number;
  boostSpend?: number;
  limit?: number;
  correctAnswers?: number;
  analyzed?: boolean;
  weaknessKnown?: boolean;
  resolution?: "defeated" | "pacified";
  finisher?: boolean;
  evasion?: number;
  asked?: string[];
  mechanicSkill?: string;
  archiveOpen?: boolean;
  phaseShiftTurn?: number;
}
export function createBattle(
  enemy: {
    id: string;
    title: string;
    hp: number;
    attack: number;
    mixedQuestions: boolean;
    lessons?: string[];
    tactics?: CombatTactics;
  } = {
    id: "sentinel",
    title: "Sentinel A-03",
    hp: 76,
    attack: 10,
    mixedQuestions: false,
  },
): Battle {
  return {
    enemyId: enemy.id,
    enemyName: enemy.title,
    attack: enemy.attack,
    mixedQuestions: enemy.mixedQuestions,
    lessons: enemy.lessons,
    hp: enemy.hp,
    maxHp: enemy.hp,
    turn: 1,
    phase: "choose",
    skill: null,
    question: null,
    effects: [],
    log: [`${enemy.title} encounter started.`],
    assisted: false,
    asked: [],
    ...(enemy.tactics
      ? {
          tactics: enemy.tactics,
          resolve: 0,
          staggered: false,
          breakFresh: false,
          boost: 0,
          boostSpend: 0,
          limit: 0,
          correctAnswers: 0,
          analyzed: false,
          weaknessKnown: false,
        }
      : {}),
  };
}
export function selectBoost(battle: Battle, amount: number): Battle {
  if (
    !battle.tactics ||
    battle.phase !== "choose" ||
    !Number.isInteger(amount) ||
    amount < 0 ||
    amount > 3 ||
    amount > (battle.boost ?? 0)
  )
    throw new Error("Boost unavailable");
  return { ...battle, boostSpend: amount };
}
export function previewDamage(
  battle: Battle,
  save: Save,
  skill: Skill,
  content: Content,
): number {
  let damage = stats(save, content).attack + skill.power;
  damage = Math.floor(damage * (1 + 0.25 * (battle.boostSpend ?? 0)));
  if (battle.finisher && skill.id === "insight") damage *= 3;
  if (battle.staggered) damage = Math.floor(damage * 1.5);
  if (
    battle.tactics?.mechanic === "routing" &&
    !battle.staggered &&
    !(battle.boostSpend ?? 0)
  )
    damage = Math.max(1, Math.floor(damage * 0.5));
  if (battle.tactics?.mechanic === "archive" && !battle.archiveOpen)
    damage = Math.max(1, Math.floor(damage * 0.5));
  if (battle.tactics?.mechanic === "mimic" && battle.mechanicSkill === skill.id)
    damage = Math.max(1, Math.floor(damage * 0.5));
  if (battle.tactics?.mechanic === "echo" && battle.hp <= battle.maxHp / 2)
    damage = Math.floor(damage * 1.15);
  return damage;
}

export function bossReadout(
  battle: Battle,
): { phase: string; title: string; description: string } | null {
  switch (battle.tactics?.mechanic) {
    case "routing":
      return {
        phase: "Firewall",
        title: "Route Firewall",
        description:
          "Unboosted hits are halved. Spend Boost or strike while Broken to pierce armor.",
      };
    case "archive":
      return battle.archiveOpen
        ? {
            phase: "Open",
            title: "Audit Window",
            description:
              "The archive is exposed this turn; attacks deal full damage.",
          }
        : {
            phase: "Checksum",
            title: "Checksum Lock",
            description:
              "Attacks are halved. Guard to expose it for your next turn.",
          };
    case "mimic":
      return {
        phase: "Adapting",
        title: "Signal Adaptation",
        description: battle.mechanicSkill
          ? "Repeating your last skill is resisted. Switch skills or Guard to clear adaptation."
          : "Hits are full. Switch skills after a hit; Guard clears adaptation.",
      };
    case "echo": {
      const phaseTwo = battle.hp <= battle.maxHp / 2;
      return {
        phase: phaseTwo ? "Phase 2" : "Phase 1",
        title: phaseTwo ? "Escalation" : "Containment Pattern",
        description: phaseTwo
          ? "Strikes hit harder; Recover opens a safe turn to attack."
          : "At half health ECHO shifts. Follow its telegraph; Recover opens a safe attack.",
      };
    }
    default:
      return null;
  }
}
export function selectFinisher(
  battle: Battle,
  save: Save,
  questions: Question[],
  content?: Content,
): Battle {
  if (
    !battle.tactics ||
    battle.phase !== "choose" ||
    battle.limit !== 100 ||
    !save.character.skills.includes("insight")
  )
    throw new Error("Finisher unavailable");
  const base: Skill = {
    type: "skill",
    id: "insight",
    title: "Limit release",
    description: "",
    level: 1,
    power: 5,
    cost: 0,
    lesson: battle.lessons?.[0] ?? "stacks-queues",
  };
  return {
    ...selectSkill(battle, save, base, questions, content),
    finisher: true,
  };
}
export function selectSkill(
  battle: Battle,
  save: Save,
  skill: Skill,
  questions: Question[],
  content?: Content,
): Battle {
  if (
    battle.phase !== "choose" ||
    !save.character.skills.includes(skill.id) ||
    save.character.focus < skill.cost
  )
    throw new Error("Skill unavailable");
  const lessonPools = battle.lessons?.map((lesson) =>
    questions.filter((q) => q.lesson === lesson),
  );
  let pool = lessonPools
    ? Array.from(
        { length: Math.max(...lessonPools.map((p) => p.length)) },
        (_, i) => lessonPools.flatMap((p) => (p[i] ? [p[i]] : [])),
      ).flat()
    : battle.mixedQuestions
      ? questions
      : questions.filter((q) => q.lesson === skill.lesson);
  // A single lesson can hold only two or three questions. Widen the pool to
  // prerequisite lessons, keeping future chapters out of early encounters.
  if (content && pool.length < 6) {
    const lessonIds = new Set<string>();
    const addPrerequisites = (lessonId: string) => {
      if (lessonIds.has(lessonId)) return;
      lessonIds.add(lessonId);
      const lesson = content.entities.find(
        (e) => e.type === "lesson" && e.id === lessonId,
      );
      if (lesson?.type === "lesson")
        lesson.prerequisites.forEach(addPrerequisites);
    };
    (battle.lessons?.length ? battle.lessons : [skill.lesson]).forEach(
      addPrerequisites,
    );
    const related = questions.filter((q) => {
      if (pool.some((p) => p.id === q.id)) return false;
      const lesson = content.entities.find(
        (e) => e.type === "lesson" && e.id === q.lesson,
      );
      return lesson?.type === "lesson" && lessonIds.has(lesson.id);
    });
    pool = [...pool, ...related];
  }
  if (!pool.length) throw new Error("No questions for this skill");
  const asked = new Set(battle.asked ?? []);
  let candidates = pool.filter((q) => !asked.has(q.id));
  if (!candidates.length) {
    // Every question in the subject has been asked this encounter. Restart the
    // cycle but never repeat the prompt that is still on screen.
    candidates = pool.filter(
      (q) => q.id !== (battle.question ?? battle.asked?.at(-1)),
    );
  }
  if (!candidates.length) candidates = pool;
  const chosen = candidates[Math.max(0, battle.turn - 1) % candidates.length];
  return {
    ...battle,
    phase: "question",
    skill: skill.id,
    question: chosen.id,
    assisted: false,
    asked: [...(battle.asked ?? []), chosen.id],
  };
}
export function isCorrect(question: Question, answer: number[]): boolean {
  if (question.format === "multiple")
    return (
      new Set(answer).size === answer.length &&
      answer.length === question.answer.length &&
      question.answer.every((x) => answer.includes(x))
    );
  return (
    question.answer.length === answer.length &&
    question.answer.every((x, i) => x === answer[i])
  );
}
export function answerBattle(
  battle: Battle,
  save: Save,
  content: Content,
  answer: number[],
): { battle: Battle; save: Save; correct: boolean } {
  if (battle.phase !== "question") throw new Error("No pending question");
  const skill = content.entities.find(
    (e): e is Skill => e.type === "skill" && e.id === battle.skill,
  )!;
  const question = content.entities.find(
    (e): e is Question => e.type === "question" && e.id === battle.question,
  )!;
  const correct = isCorrect(question, answer),
    next = structuredClone(battle),
    player = structuredClone(save);
  player.character.focus -= skill.cost;
  if (correct) {
    let damage = previewDamage(next, save, skill, content);
    const consumedStagger = Boolean(next.tactics && next.staggered);
    if (consumedStagger) {
      next.staggered = false;
      next.resolve = 0;
    }
    const matching = Boolean(
      next.tactics && skill.id === next.tactics.weakness,
    );
    if (next.tactics) {
      next.correctAnswers = (next.correctAnswers ?? 0) + 1;
      next.limit = Math.min(100, (next.limit ?? 0) + 20 + (matching ? 10 : 0));
      if (matching) next.weaknessKnown = true;
      if (next.tactics.mechanic === "mimic") next.mechanicSkill = skill.id;
      if (!consumedStagger && !next.staggered && matching) {
        next.resolve = (next.resolve ?? 0) + 1;
        if (next.resolve >= next.tactics.resolve) {
          next.staggered = true;
          next.breakFresh = true;
        }
      }
    }
    next.hp = Math.max(0, next.hp - damage);
    if (
      next.tactics?.mechanic === "echo" &&
      battle.hp > battle.maxHp / 2 &&
      next.hp <= battle.maxHp / 2 &&
      next.hp > 0
    ) {
      next.phaseShiftTurn = next.turn;
      next.log.push(
        `${battle.enemyName} shifts into Phase 2. Its attack pattern intensifies.`,
      );
    }
    next.log.push(`${skill.title} deals ${damage} damage.`);
    if (skill.effect) {
      const def = content.entities.find(
        (e): e is Effect => e.type === "effect" && e.id === skill.effect,
      )!;
      next.effects = next.effects.filter((e) => e.id !== def.id);
      next.effects.push({
        id: skill.effect,
        remaining: def.duration,
        magnitude: def.magnitude,
      });
    }
  } else {
    next.log.push("Incorrect answer. Turn spent.");
  }
  if (next.tactics?.mechanic === "archive") next.archiveOpen = false;
  if (next.tactics) {
    next.boost = Math.min(
      3,
      Math.max(0, (next.boost ?? 0) - (next.boostSpend ?? 0)) +
        (correct ? 1 : 0),
    );
    next.boostSpend = 0;
    if (next.finisher) next.limit = 0;
    next.finisher = false;
  }
  next.log.push(question.explanation);
  next.phase = next.hp === 0 ? "won" : "feedback";
  if (next.tactics && next.hp === 0) next.resolution = "defeated";
  return { battle: next, save: player, correct };
}
export function enemyTurn(
  battle: Battle,
  save: Save,
  content: Content,
): { battle: Battle; save: Save } {
  if (battle.phase !== "feedback") return { battle, save };
  const next = structuredClone(battle),
    player = structuredClone(save);
  const poison = next.effects.find((e) => e.id === "poison");
  if (poison) {
    next.hp = Math.max(0, next.hp - poison.magnitude);
    next.log.push(`Poison deals ${poison.magnitude} damage.`);
    if (
      next.tactics?.mechanic === "echo" &&
      battle.hp > battle.maxHp / 2 &&
      next.hp <= next.maxHp / 2 &&
      next.hp > 0
    ) {
      next.phaseShiftTurn = next.turn;
      next.log.push(
        `${battle.enemyName} shifts into Phase 2. Its attack pattern intensifies.`,
      );
    }
  }
  if (next.hp === 0) {
    next.phase = "won";
    next.guarding = false;
    return { battle: next, save: player };
  }
  if (next.tactics && next.breakFresh) {
    next.breakFresh = false;
    next.log.push(`${battle.enemyName} is Broken and loses its response.`);
    next.effects = next.effects
      .map((e) => ({ ...e, remaining: e.remaining - 1 }))
      .filter((e) => e.remaining > 0);
    next.turn++;
    next.phase = "choose";
    next.guarding = false;
    next.skill = null;
    next.question = null;
    next.evasion = undefined;
    return { battle: next, save: player };
  }
  const intent = enemyIntent(battle, player, content);
  const incoming = Math.max(
    0,
    Math.floor(intent.damage * (1 - (next.evasion ?? 0))),
  );
  if (intent.kind === "recover") {
    player.character.focus = Math.min(
      stats(player, content).maxFocus,
      player.character.focus + 3,
    );
    next.log.push(`${battle.enemyName} pauses. You recover 3 focus.`);
  } else {
    player.character.hp = Math.max(0, player.character.hp - incoming);
    if (next.tactics)
      next.limit = Math.min(100, (next.limit ?? 0) + (incoming > 0 ? 10 : 0));
    next.log.push(
      `${battle.enemyName} ${intent.kind === "heavy" ? "unleashes a heavy strike" : "strikes"} for ${incoming} damage.`,
    );
  }
  next.effects = next.effects
    .map((e) => ({ ...e, remaining: e.remaining - 1 }))
    .filter((e) => e.remaining > 0);
  next.turn++;
  next.phase = player.character.hp === 0 ? "lost" : "choose";
  next.guarding = false;
  next.skill = null;
  next.question = null;
  next.evasion = undefined;
  return { battle: next, save: player };
}

export interface EnemyIntent {
  kind: "strike" | "heavy" | "recover";
  label: string;
  description: string;
  damage: number;
}

/** Deterministic telegraph for the enemy action resolving this turn. */
export function enemyIntent(
  battle: Battle,
  save: Save,
  content: Content,
): EnemyIntent {
  if (battle.tactics && battle.breakFresh)
    return {
      kind: "recover",
      label: "Broken",
      description: "The enemy loses this response.",
      damage: 0,
    };
  const phaseTwo =
    battle.tactics?.mechanic === "echo" &&
    battle.hp <= battle.maxHp / 2 &&
    battle.phaseShiftTurn !== battle.turn;
  const pattern = phaseTwo
    ? (["heavy", "strike", "recover", "heavy"] as const)
    : battle.tactics?.pattern;
  const kind =
    pattern?.[(battle.turn - 1) % pattern.length] ??
    (["strike", "heavy", "recover"] as const)[(battle.turn - 1) % 3];
  const poisonedToDeath =
    battle.effects.some((e) => e.id === "poison") &&
    battle.effects.find((e) => e.id === "poison")!.magnitude >= battle.hp;
  if (kind === "recover")
    return {
      kind,
      label: "Opening",
      description: `${battle.enemyName} pauses; you recover 3 focus.`,
      damage: 0,
    };
  const base = Math.ceil(
    (kind === "heavy" ? battle.attack * 1.7 : battle.attack) *
      (phaseTwo ? 1.25 : 1),
  );
  const reduction = battle.effects
    .filter((e) => e.id === "shield" || e.id === "weaken")
    .reduce((sum, e) => sum + e.magnitude, 0);
  let damage = Math.max(1, base - stats(save, content).defense - reduction);
  if (battle.guarding) damage = Math.max(1, damage - Math.ceil(damage * 0.7));
  if (poisonedToDeath) damage = 0;
  return {
    kind,
    label: kind === "heavy" ? "Heavy Strike" : "Strike",
    description: `${battle.enemyName} will ${kind === "heavy" ? "unleash a heavy strike" : "strike"} for ${damage} damage${battle.guarding ? " (guarding)" : ""}${battle.evasion !== undefined ? ` (${Math.round(battle.evasion * 100)}% evasion)` : ""}.`,
    damage,
  };
}

/** Spend a turn bracing; guard reduces the next enemy hit by about 70%. */
export function guardTurn(
  battle: Battle,
  save: Save,
  content: Content,
): { battle: Battle; save: Save } {
  if (battle.phase !== "choose") return { battle, save };
  const guarded = {
    ...battle,
    phase: "feedback" as const,
    guarding: true,
    ...(battle.tactics?.mechanic === "archive" ? { archiveOpen: true } : {}),
    ...(battle.tactics?.mechanic === "mimic"
      ? { mechanicSkill: undefined }
      : {}),
    log: [...battle.log, "You brace for the incoming attack."],
  };
  const player = structuredClone(save);
  if (battle.tactics) guarded.boost = Math.min(3, (battle.boost ?? 0) + 1);
  player.character.focus = Math.min(
    stats(save, content).maxFocus,
    player.character.focus + 4,
  );
  return enemyTurn(guarded, player, content);
}
export function analyzeBattle(
  battle: Battle,
  save: Save,
  content: Content,
  choice: number,
): { battle: Battle; save: Save; correct: boolean } {
  if (!battle.tactics || battle.phase !== "choose" || battle.analyzed)
    throw new Error("Analysis unavailable");
  const act = battle.tactics.act;
  if (!Number.isInteger(choice) || choice < 0 || choice >= act.options.length)
    throw new Error("Invalid analysis choice");
  const correct = choice === act.answer;
  const analyzed = {
    ...battle,
    phase: "feedback" as const,
    analyzed: correct,
    weaknessKnown: battle.weaknessKnown || correct,
    limit: Math.min(100, (battle.limit ?? 0) + (correct ? 20 : 0)),
    log: [
      ...battle.log,
      correct
        ? `Analysis reveals ${act.prompt}`
        : "Analysis failed. Turn spent.",
      act.explanation,
    ],
  };
  return { ...enemyTurn(analyzed, save, content), correct };
}
export function canSpare(battle: Battle): boolean {
  return Boolean(
    battle.tactics?.spare &&
    battle.analyzed &&
    (battle.correctAnswers ?? 0) >= (battle.tactics.boss ? 3 : 1) &&
    battle.phase === "choose" &&
    battle.hp <= battle.maxHp * (battle.tactics.boss ? 0.35 : 0.65),
  );
}
export function spareBattle(
  battle: Battle,
  save: Save,
): { battle: Battle; save: Save } {
  if (!canSpare(battle)) throw new Error("Cannot spare this enemy");
  return {
    battle: {
      ...battle,
      phase: "won",
      resolution: "pacified",
      log: [...battle.log, `${battle.enemyName} powers down peacefully.`],
    },
    save,
  };
}
export function evadeTurn(
  battle: Battle,
  save: Save,
  content: Content,
  collisions: number,
): { battle: Battle; save: Save } {
  if (
    battle.phase !== "choose" ||
    !battle.tactics ||
    !Number.isInteger(collisions) ||
    collisions < 0 ||
    collisions > 3 ||
    enemyIntent(battle, save, content).kind !== "heavy"
  )
    throw new Error("Evade unavailable");
  const fraction = [0.8, 0.6, 0.3, 0][collisions];
  return enemyTurn(
    {
      ...battle,
      phase: "feedback",
      evasion: fraction,
      log: [
        ...battle.log,
        `Evade attempt: ${Math.round(fraction * 100)}% reduction.`,
      ],
    },
    save,
    content,
  );
}
