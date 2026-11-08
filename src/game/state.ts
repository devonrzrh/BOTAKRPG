import { z } from "zod";
import type { Content, Quest, Skill } from "../content/schema";
import { STARTER_CODE } from "./maze";
import { questUnlocked } from "./investigation";
import { DEFAULT_PLAYER_NAME, assertPlayerName } from "./player";
import { TUTORIAL_IDS, type TutorialId } from "./tutorials";
import { createPuzzle, puzzleCommand } from "./puzzles";
const puzzleRunSchema = z.object({
  commands: z
    .array(
      z.union([
        z.object({ type: z.enum(["push", "pop", "rotate", "dispatch"]) }),
        z.object({
          type: z.literal("swap"),
          index: z.number().int().nonnegative(),
        }),
        z.object({ type: z.literal("move"), node: z.number().int() }),
      ]),
    )
    .max(1000),
  assisted: z.boolean(),
});
const masterySchema = z.object({
  correct: z.number().int().nonnegative(),
  attempted: z.number().int().nonnegative(),
  evidence: z.array(z.string()),
  answered: z.array(z.string()),
});
const finite = z.number().finite();
const readingSchema = z
  .object({
    mode: z.enum(["book", "fullscreen"]).default("book"),
    fontSize: z
      .union([z.literal(20), z.literal(22), z.literal(24)])
      .default(22),
    positions: z
      .record(
        z.object({
          block: z.number().int().nonnegative(),
          offset: finite.min(0).max(1).default(0),
        }),
      )
      .default({}),
  })
  .default({ mode: "book", fontSize: 22, positions: {} });
const signalSampleSchema = z.object({
  x: finite.min(-1).max(1),
  y: finite.min(-1).max(1),
  label: z.union([z.literal(0), z.literal(1)]),
});
const signalNetworkSchema = z.object({
  weights: z.tuple([finite, finite]),
  bias: finite,
  epochs: z.number().int().min(0).max(1_000_000),
});
const signalExperimentSchema = z
  .object({
    samples: z.array(signalSampleSchema).max(200),
    network: signalNetworkSchema,
    rate: finite.gt(0).max(1),
    epochs: z.number().int().min(1).max(100),
    label: z.union([z.literal(0), z.literal(1)]),
    tested: z.boolean(),
  })
  .nullable()
  .default(null);
export const saveSchema = z
  .object({
    version: z.literal(1),
    curriculumVersion: z.union([z.literal(1), z.literal(2)]).default(1),
    signalExperiment: signalExperimentSchema,
    chapterProgress: z
      .record(
        z.object({
          introduced: z.boolean(),
          practiced: z.boolean(),
          attempts: z.number().int().nonnegative(),
        }),
      )
      .default({}),
    story: z
      .object({
        prologueSeen: z.boolean(),
        briefingSeen: z.boolean().default(false),
        caseAccepted: z.boolean().default(false),
        networkIntroSeen: z.boolean().default(false),
        seenDialogues: z.array(z.string()).default([]),
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
      equipment: z.string().nullable().optional(),
    }),
    inventory: z.record(z.number().int().min(0).max(999)).optional(),
    completed: z.array(z.string()),
    claimed: z.array(z.string()),
    mastery: z.record(masterySchema),
    bookmarks: z.array(z.string()),
    notes: z.record(z.string().max(20000)),
    reading: readingSchema,
    puzzleRuns: z.record(puzzleRunSchema).default({}),
    code: z.string().max(200000),
    blocks: z.unknown().nullable(),
    seed: z.number().int().min(0).max(2147483647),
    trialBest: z.number().nonnegative().nullable(),
    settings: z.object({
      renderer: z.enum(["auto", "webgpu", "webgl"]),
      reducedMotion: z.boolean(),
    }),
    onboarding: z
      .object({
        intakeComplete: z.boolean().default(false),
        tipsEnabled: z.boolean().default(true),
        seenTips: z.array(z.enum(TUTORIAL_IDS)).default([]),
      })
      .default({ intakeComplete: false, tipsEnabled: true, seenTips: [] }),
  })
  .strict()
  .transform(({ inventory: _inventory, character, ...save }) => {
    const { equipment: _equipment, ...player } = character;
    return { ...save, character: player };
  });
export type Save = z.infer<typeof saveSchema>;
export function initialSave(): Save {
  return {
    version: 1,
    curriculumVersion: 2,
    signalExperiment: null,
    chapterProgress: {},
    story: {
      prologueSeen: false,
      briefingSeen: false,
      caseAccepted: false,
      networkIntroSeen: false,
      seenDialogues: [],
    },
    character: {
      name: DEFAULT_PLAYER_NAME,
      level: 1,
      xp: 0,
      hp: 60,
      focus: 12,
      skills: ["insight", "ward"],
    },
    completed: [],
    claimed: [],
    mastery: {},
    bookmarks: [],
    notes: {},
    reading: { mode: "book", fontSize: 22, positions: {} },
    puzzleRuns: {},
    code: STARTER_CODE,
    blocks: null,
    seed: 42,
    trialBest: null,
    settings: { renderer: "auto", reducedMotion: false },
    onboarding: { intakeComplete: false, tipsEnabled: true, seenTips: [] },
  };
}
export function needsIntake(save: Save) {
  return !save.onboarding.intakeComplete && !save.story.prologueSeen;
}
export function renamePlayer(save: Save, raw: string): Save {
  const name = assertPlayerName(raw);
  return save.character.name === name
    ? save
    : { ...save, character: { ...save.character, name } };
}
export function finishIntake(save: Save, raw: string): Save {
  const renamed = renamePlayer(save, raw);
  return {
    ...renamed,
    onboarding: { ...renamed.onboarding, intakeComplete: true },
  };
}
export function markTutorialSeen(save: Save, id: TutorialId): Save {
  return save.onboarding.seenTips.includes(id)
    ? save
    : {
        ...save,
        onboarding: {
          ...save.onboarding,
          seenTips: [...save.onboarding.seenTips, id],
        },
      };
}
export function resetTutorials(save: Save): Save {
  return {
    ...save,
    onboarding: { ...save.onboarding, seenTips: [], tipsEnabled: true },
  };
}
export function setTipsEnabled(save: Save, tipsEnabled: boolean): Save {
  return { ...save, onboarding: { ...save.onboarding, tipsEnabled } };
}
export function stats(save: Save, _content?: Content) {
  return {
    maxHp: 60 + (save.character.level - 1) * 10,
    maxFocus: 12 + (save.character.level - 1) * 2,
    attack: 6 + (save.character.level - 1) * 2,
    defense: 2 + save.character.level - 1,
  };
}
export function recoverResources(save: Save): Save {
  const limits = stats(save);
  return {
    ...save,
    character: { ...save.character, hp: limits.maxHp, focus: limits.maxFocus },
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
  return addXp({ ...save, claimed: [...save.claimed, quest.id] }, quest.xp);
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
  const retiredItems = new Set([
    "healing-draught",
    "focus-tea",
    "scholar-charm",
  ]);
  if (input && typeof input === "object" && !Array.isArray(input)) {
    const legacy = input as {
      inventory?: unknown;
      character?: { equipment?: unknown };
    };
    if (legacy.inventory && typeof legacy.inventory === "object") {
      for (const id of Object.keys(legacy.inventory))
        if (!retiredItems.has(id))
          throw new Error(`Save contains unknown retired item: ${id}`);
    }
    const equipment = legacy.character?.equipment;
    if (typeof equipment === "string" && !retiredItems.has(equipment))
      throw new Error(`Save contains unknown retired item: ${equipment}`);
  }
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
  check(Object.keys(save.reading.positions), "lesson");
  for (const [id, run] of Object.entries(save.puzzleRuns)) {
    const activity = content.entities.find((e) => e.id === id);
    if (
      activity?.type !== "activity" ||
      activity.template !== "puzzle" ||
      !activity.puzzle
    )
      throw new Error(`Save contains unknown puzzle: ${id}`);
    let state = createPuzzle(activity.puzzle);
    for (const command of run.commands) {
      const next = puzzleCommand(state, command);
      if (next.moves === state.moves)
        throw new Error(`Invalid puzzle command in ${id}: ${next.message}`);
      state = next;
    }
  }
  check(Object.keys(save.mastery), "lesson");
  check(save.character.skills, "skill");
  for (const [id, progress] of Object.entries(save.chapterProgress)) {
    const chapter = content.entities.find((e) => e.id === id);
    if (chapter?.type !== "quest" || chapter.kind !== "chapter")
      throw new Error(`Save contains unknown chapter: ${id}`);
    if (progress.practiced && (!progress.introduced || progress.attempts < 1))
      throw new Error(`Invalid chapter progress: ${id}`);
  }
  check(save.story.seenDialogues, "dialogue");
  for (const quest of content.entities.filter(
    (e): e is Quest => e.type === "quest" && e.kind === "finale",
  )) {
    if (
      quest.objectives.some((id) => save.completed.includes(id)) &&
      !questUnlocked(save, quest, content) &&
      !(
        save.curriculumVersion === 1 &&
        ["maze-chamber", "guardian-battle", "perceptron-exhibit"].every((id) =>
          save.completed.includes(id),
        )
      )
    )
      throw new Error("Final encounter requires all clue branches");
  }
  const s = stats(save, content);
  if (
    save.character.level !==
      Math.min(100, 1 + Math.floor(save.character.xp / 100)) ||
    save.character.hp > s.maxHp ||
    save.character.focus > s.maxFocus
  )
    throw new Error("Save has inconsistent character stats");
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
