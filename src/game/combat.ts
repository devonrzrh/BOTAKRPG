import type { Content, Effect, Item, Question, Skill } from "../content/schema";
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
}
export function createBattle(
  enemy: {
    id: string;
    title: string;
    hp: number;
    attack: number;
    mixedQuestions: boolean;
    lessons?: string[];
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
  };
}
export function selectSkill(
  battle: Battle,
  save: Save,
  skill: Skill,
  questions: Question[],
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
  const pool = lessonPools
    ? Array.from(
        { length: Math.max(...lessonPools.map((p) => p.length)) },
        (_, i) => lessonPools.flatMap((p) => (p[i] ? [p[i]] : [])),
      ).flat()
    : battle.mixedQuestions
      ? questions
      : questions.filter((q) => q.lesson === skill.lesson);
  if (!pool.length) throw new Error("No questions for this skill");
  return {
    ...battle,
    phase: "question",
    skill: skill.id,
    question: pool[(battle.turn - 1) % pool.length].id,
    assisted: false,
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
    const damage = stats(save, content).attack + skill.power;
    next.hp = Math.max(0, next.hp - damage);
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
  } else next.log.push("Incorrect answer. Turn spent.");
  next.log.push(question.explanation);
  next.phase = next.hp === 0 ? "won" : "feedback";
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
  }
  if (next.hp === 0) {
    next.phase = "won";
    next.guarding = false;
    return { battle: next, save: player };
  }
  const intent = enemyIntent(battle, player, content);
  const incoming = intent.damage;
  if (intent.kind === "recover") {
    player.character.focus = Math.min(
      stats(player, content).maxFocus,
      player.character.focus + 3,
    );
    next.log.push(`${battle.enemyName} pauses. You recover 3 focus.`);
  } else {
    player.character.hp = Math.max(0, player.character.hp - incoming);
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
  const kind = (["strike", "heavy", "recover"] as const)[(battle.turn - 1) % 3];
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
  const base =
    kind === "heavy" ? Math.ceil(battle.attack * 1.7) : battle.attack;
  const reduction = battle.effects
    .filter((e) => e.id === "shield" || e.id === "weaken")
    .reduce((sum, e) => sum + e.magnitude, 0);
  let damage = Math.max(1, base - stats(save, content).defense - reduction);
  if (battle.guarding) damage = Math.max(1, damage - Math.ceil(damage * 0.7));
  if (poisonedToDeath) damage = 0;
  return {
    kind,
    label: kind === "heavy" ? "Heavy Strike" : "Strike",
    description: `${battle.enemyName} will ${kind === "heavy" ? "unleash a heavy strike" : "strike"} for ${damage} damage.`,
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
    log: [...battle.log, "You brace for the incoming attack."],
  };
  const player = structuredClone(save);
  player.character.focus = Math.min(
    stats(save, content).maxFocus,
    player.character.focus + 4,
  );
  return enemyTurn(guarded, player, content);
}
export function useItem(
  battle: Battle,
  save: Save,
  item: Item,
  content: Content,
): { battle: Battle; save: Save } {
  if (
    battle.phase !== "choose" ||
    item.kind === "equipment" ||
    !(save.inventory[item.id] > 0) ||
    (item.kind === "healing" &&
      save.character.hp >= stats(save, content).maxHp) ||
    (item.kind === "focus" &&
      save.character.focus >= stats(save, content).maxFocus)
  )
    throw new Error("Item unavailable");
  const player = structuredClone(save),
    limits = stats(save, content);
  player.inventory[item.id]--;
  if (item.kind === "healing")
    player.character.hp = Math.min(
      limits.maxHp,
      player.character.hp + item.amount,
    );
  else
    player.character.focus = Math.min(
      limits.maxFocus,
      player.character.focus + item.amount,
    );
  return enemyTurn(
    {
      ...battle,
      phase: "feedback",
      log: [...battle.log, `Used ${item.title}.`],
    },
    player,
    content,
  );
}
