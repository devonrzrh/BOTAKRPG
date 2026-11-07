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
    return { battle: next, save: player };
  }
  const reduction = next.effects
    .filter((e) => e.id === "shield" || e.id === "weaken")
    .reduce((sum, e) => sum + e.magnitude, 0);
  const damage = Math.max(
    1,
    battle.attack - stats(save, content).defense - reduction,
  );
  player.character.hp = Math.max(0, player.character.hp - damage);
  next.log.push(`${battle.enemyName} deals ${damage} damage.`);
  next.effects = next.effects
    .map((e) => ({ ...e, remaining: e.remaining - 1 }))
    .filter((e) => e.remaining > 0);
  next.turn++;
  next.phase = player.character.hp === 0 ? "lost" : "choose";
  next.skill = null;
  next.question = null;
  return { battle: next, save: player };
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
    !(save.inventory[item.id] > 0)
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
