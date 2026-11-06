import { z } from "zod";
import type { Content, Item, Quest, Skill } from "../content/schema";
import { STARTER_CODE } from "./maze";
import { questUnlocked } from "./investigation";
const masterySchema = z.object({
  correct: z.number().int().nonnegative(),
  attempted: z.number().int().nonnegative(),
  evidence: z.array(z.string()),
  answered: z.array(z.string()),
});
export const saveSchema = z
  .object({
    version: z.literal(1),
    story: z
      .object({
        prologueSeen: z.boolean(),
        briefingSeen: z.boolean().default(false),
        caseAccepted: z.boolean().default(false),
        networkIntroSeen: z.boolean().default(false),
      })
      .default({
        prologueSeen: false,
        briefingSeen: false,
        caseAccepted: false,
        networkIntroSeen: false,
      }),
    character: z.object({
      name: z.string().min(1).max(40),
      level: z.number().int().min(1).max(100),
      xp: z.number().int().nonnegative(),
      hp: z.number().min(0),
      focus: z.number().min(0),
      skills: z.array(z.string()),
      equipment: z.string().nullable(),
    }),
    inventory: z.record(z.number().int().min(0).max(999)),
    completed: z.array(z.string()),
    claimed: z.array(z.string()),
    mastery: z.record(masterySchema),
    bookmarks: z.array(z.string()),
    notes: z.record(z.string().max(20000)),
    code: z.string().max(200000),
    blocks: z.unknown().nullable(),
    seed: z.number().int().min(0).max(2147483647),
    trialBest: z.number().nonnegative().nullable(),
    settings: z.object({
      renderer: z.enum(["auto", "webgpu", "webgl"]),
      reducedMotion: z.boolean(),
    }),
  })
  .strict();
export type Save = z.infer<typeof saveSchema>;
export function initialSave(): Save {
  return {
    version: 1,
    story: {
      prologueSeen: false,
      briefingSeen: false,
      caseAccepted: false,
      networkIntroSeen: false,
    },
    character: {
      name: "Detective Vale",
      level: 1,
      xp: 0,
      hp: 60,
      focus: 12,
      skills: ["insight", "ward"],
      equipment: null,
    },
    inventory: { "healing-draught": 3, "focus-tea": 2 },
    completed: [],
    claimed: [],
    mastery: {},
    bookmarks: [],
    notes: {},
    code: STARTER_CODE,
    blocks: null,
    seed: 42,
    trialBest: null,
    settings: { renderer: "auto", reducedMotion: false },
  };
}
export function stats(save: Save, content?: Content) {
  const item = content?.entities.find(
    (e): e is Item => e.type === "item" && e.id === save.character.equipment,
  );
  return {
    maxHp: 60 + (save.character.level - 1) * 10,
    maxFocus: 12 + (save.character.level - 1) * 2,
    attack: 6 + (save.character.level - 1) * 2 + (item?.amount ?? 0),
    defense: 2 + save.character.level - 1,
  };
}
export function addXp(save: Save, amount: number): Save {
  const xp = save.character.xp + amount,
    level = Math.min(100, 1 + Math.floor(xp / 100));
  const next = { ...save, character: { ...save.character, xp, level } };
  if (level > save.character.level) {
    const s = stats(next);
    next.character.hp = s.maxHp;
    next.character.focus = s.maxFocus;
  }
  return next;
}
export function completeActivity(save: Save, id: string): Save {
  return save.completed.includes(id)
    ? save
    : { ...save, completed: [...save.completed, id] };
}
export function recordAnswer(
  save: Save,
  lesson: string,
  question: string,
  correct: boolean,
  assisted: boolean,
): Save {
  const entry = save.mastery[lesson] ?? {
    correct: 0,
    attempted: 0,
    evidence: [],
    answered: [],
  };
  const fresh = correct && !assisted && !entry.answered.includes(question);
  return {
    ...save,
    mastery: {
      ...save.mastery,
      [lesson]: {
        ...entry,
        attempted: entry.attempted + 1,
        correct: entry.correct + (fresh ? 1 : 0),
        answered: fresh ? [...entry.answered, question] : entry.answered,
      },
    },
  };
}
export function evidence(save: Save, lesson: string, proof: string): Save {
  const entry = save.mastery[lesson] ?? {
    correct: 0,
    attempted: 0,
    evidence: [],
    answered: [],
  };
  if (entry.evidence.includes(proof)) return save;
  return {
    ...save,
    mastery: {
      ...save.mastery,
      [lesson]: { ...entry, evidence: [...entry.evidence, proof] },
    },
  };
}
export function claimQuest(save: Save, quest: Quest, content?: Content): Save {
  if (
    (quest.prerequisites.length > 0 &&
      (!content || !questUnlocked(save, quest, content))) ||
    save.claimed.includes(quest.id) ||
    !quest.objectives.every((id) => save.completed.includes(id))
  )
    return save;
  const inventory = { ...save.inventory };
  quest.rewards.forEach((id) => (inventory[id] = (inventory[id] ?? 0) + 1));
  return addXp(
    { ...save, inventory, claimed: [...save.claimed, quest.id] },
    quest.xp,
  );
}
export function unlockSkill(save: Save, skill: Skill): Save {
  if (
    save.character.level < skill.level ||
    (skill.parent && !save.character.skills.includes(skill.parent)) ||
    save.character.skills.includes(skill.id)
  )
    return save;
  return {
    ...save,
    character: {
      ...save.character,
      skills: [...save.character.skills, skill.id],
    },
  };
}
export function parseSave(input: unknown, content: Content): Save {
  const save = saveSchema.parse(input),
    ids = new Map(content.entities.map((e) => [e.id, e.type]));
  const check = (values: string[], type: string) =>
    values.forEach((id) => {
      if (ids.get(id) !== type)
        throw new Error(`Save contains unknown ${type}: ${id}`);
    });
  check(save.completed, "activity");
  check(save.claimed, "quest");
  check(save.bookmarks, "lesson");
  check(Object.keys(save.notes), "lesson");
  check(Object.keys(save.mastery), "lesson");
  check(save.character.skills, "skill");
  check(Object.keys(save.inventory), "item");
  for (const quest of content.entities.filter(
    (e): e is Quest => e.type === "quest" && e.kind === "finale",
  )) {
    if (
      quest.objectives.some((id) => save.completed.includes(id)) &&
      !questUnlocked(save, quest, content)
    )
      throw new Error("Final encounter requires all clue branches");
  }
  if (save.character.equipment) check([save.character.equipment], "item");
  const s = stats(save, content);
  if (
    save.character.level !==
      Math.min(100, 1 + Math.floor(save.character.xp / 100)) ||
    save.character.hp > s.maxHp ||
    save.character.focus > s.maxFocus
  )
    throw new Error("Save has inconsistent character stats");
  if (save.character.equipment) {
    const item = content.entities.find(
      (e): e is Item => e.type === "item" && e.id === save.character.equipment,
    );
    if (
      !(save.inventory[save.character.equipment] > 0) ||
      item?.kind !== "equipment"
    )
      throw new Error("Equipped item must be owned equipment");
  }
  for (const [key, value] of Object.entries(save.mastery)) {
    if (
      value.correct !== value.answered.length ||
      new Set(value.answered).size !== value.answered.length ||
      value.correct > value.attempted
    )
      throw new Error(`Invalid mastery for ${key}`);
    for (const q of value.answered)
      if (
        !content.entities.some(
          (e) => e.type === "question" && e.id === q && e.lesson === key,
        )
      )
        throw new Error(`Unknown mastery question ${q}`);
  }
  if (
    save.blocks !== null &&
    (typeof save.blocks !== "object" ||
      Array.isArray(save.blocks) ||
      JSON.stringify(save.blocks).length > 500000)
  )
    throw new Error("Invalid block workspace");
  return save;
}
