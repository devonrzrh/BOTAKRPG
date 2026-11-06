import { z } from "zod";
const id = z.string().regex(/^[a-z][a-z0-9-]*$/);
const base = { id, title: z.string().min(1) };
const effectId = z.enum(["shield", "poison", "weaken"]);
export const lessonSchema = z.object({
  ...base,
  type: z.literal("lesson"),
  topic: z.enum(["algorithms", "structures", "ai"]),
  prerequisites: z.array(id).default([]),
  summary: z.string(),
  body: z.string().default(""),
});
export const questionSchema = z.object({
  ...base,
  type: z.literal("question"),
  lesson: id,
  format: z.enum(["choice", "ordering"]),
  prompt: z.string(),
  options: z.array(z.string()).min(2),
  answer: z.array(z.number().int().nonnegative()).min(1),
  explanation: z.string().min(1),
});
export const itemSchema = z.object({
  ...base,
  type: z.literal("item"),
  description: z.string(),
  kind: z.enum(["healing", "focus", "equipment"]),
  amount: z.number().int().positive(),
});
export const skillSchema = z.object({
  ...base,
  type: z.literal("skill"),
  description: z.string(),
  cost: z.number().int().nonnegative(),
  power: z.number().nonnegative(),
  level: z.number().int().positive(),
  parent: id.optional(),
  effect: effectId.optional(),
  lesson: id,
});
export const effectSchema = z.object({
  ...base,
  type: z.literal("effect"),
  description: z.string(),
  duration: z.number().int().positive(),
  magnitude: z.number().positive(),
});
export const activitySchema = z.object({
  ...base,
  type: z.literal("activity"),
  template: z.enum(["maze", "battle", "perceptron"]),
  lesson: id,
  seed: z.number().int().default(42),
  clue: z
    .object({ title: z.string().min(1), text: z.string().min(1) })
    .optional(),
});
export const questSchema = z.object({
  ...base,
  type: z.literal("quest"),
  description: z.string(),
  objectives: z.array(id).min(1),
  xp: z.number().int().positive(),
  rewards: z.array(id),
});
export const storySchema = z.object({
  ...base,
  type: z.literal("story"),
  visual: z.enum(["chase", "network"]).default("chase"),
  frames: z
    .array(
      z.object({
        time: z.string(),
        heading: z.string(),
        body: z.string(),
        steps: z.number().int().min(1).max(20).default(1),
      }),
    )
    .min(1)
    .max(20),
  body: z.string().default(""),
});
export const dialogueSchema = z.object({
  ...base,
  type: z.literal("dialogue"),
  start: id,
  nodes: z
    .array(
      z.object({
        id,
        speaker: z.string().min(1),
        text: z.string().min(1),
        choices: z
          .array(
            z
              .object({
                label: z.string().min(1),
                next: id.optional(),
                action: z.enum(["accept-case", "close"]).optional(),
              })
              .refine(
                (c) => Boolean(c.next) !== Boolean(c.action),
                "Choose exactly one next node or action",
              ),
          )
          .min(1),
      }),
    )
    .min(1),
  body: z.string().default(""),
});
export const entitySchema = z.discriminatedUnion("type", [
  lessonSchema,
  questionSchema,
  itemSchema,
  skillSchema,
  effectSchema,
  activitySchema,
  questSchema,
  storySchema,
  dialogueSchema,
]);
export const contentSchema = z.object({
  version: z.literal(1),
  entities: z.array(entitySchema),
});
export type Entity = z.infer<typeof entitySchema>;
export type Lesson = z.infer<typeof lessonSchema>;
export type Question = z.infer<typeof questionSchema>;
export type Item = z.infer<typeof itemSchema>;
export type Skill = z.infer<typeof skillSchema>;
export type Effect = z.infer<typeof effectSchema>;
export type Quest = z.infer<typeof questSchema>;
export type Content = z.infer<typeof contentSchema>;
export type Story = z.infer<typeof storySchema>;
export type Dialogue = z.infer<typeof dialogueSchema>;

export function validateContent(input: unknown): Content {
  const content = contentSchema.parse(input);
  const map = new Map<string, Entity>();
  for (const entity of content.entities) {
    if (entity.type === "dialogue") {
      const nodes = new Set(entity.nodes.map((n) => n.id));
      if (nodes.size !== entity.nodes.length)
        throw new Error(`${entity.id}: duplicate dialogue node`);
      if (!nodes.has(entity.start))
        throw new Error(
          `${entity.id}: missing dialogue start '${entity.start}'`,
        );
      for (const node of entity.nodes)
        for (const choice of node.choices)
          if (choice.next && !nodes.has(choice.next))
            throw new Error(
              `${entity.id}: missing dialogue node '${choice.next}'`,
            );
    }
    if (map.has(entity.id))
      throw new Error(`Duplicate content ID: ${entity.id}`);
    map.set(entity.id, entity);
  }
  const ref = (from: string, target: string, type?: Entity["type"]) => {
    if (!map.has(target) || (type && map.get(target)?.type !== type))
      throw new Error(
        `${from}: missing ${type || "content"} reference '${target}'`,
      );
  };
  for (const entity of content.entities) {
    if ("lesson" in entity) ref(entity.id, entity.lesson, "lesson");
    if (entity.type === "lesson")
      for (const prerequisite of entity.prerequisites)
        ref(entity.id, prerequisite, "lesson");
    if (entity.type === "skill") {
      if (entity.parent) ref(entity.id, entity.parent, "skill");
      if (entity.effect) ref(entity.id, entity.effect, "effect");
    }
    if (entity.type === "quest") {
      entity.objectives.forEach((x) => ref(entity.id, x, "activity"));
      entity.rewards.forEach((x) => ref(entity.id, x, "item"));
    }
    if (entity.type === "question") {
      if (
        entity.answer.some((x) => x >= entity.options.length) ||
        new Set(entity.answer).size !== entity.answer.length
      )
        throw new Error(`${entity.id}: invalid answer indices`);
      if (entity.format === "choice" && entity.answer.length !== 1)
        throw new Error(`${entity.id}: choice needs exactly one answer`);
      if (
        entity.format === "ordering" &&
        entity.answer.length !== entity.options.length
      )
        throw new Error(
          `${entity.id}: ordering answer must include every option`,
        );
    }
  }
  const visiting = new Set<string>(),
    visited = new Set<string>();
  function walk(key: string) {
    if (visiting.has(key)) throw new Error(`Prerequisite cycle at '${key}'`);
    if (visited.has(key)) return;
    visiting.add(key);
    const entity = map.get(key)!;
    if (entity.type === "lesson") entity.prerequisites.forEach(walk);
    if (entity.type === "skill" && entity.parent) walk(entity.parent);
    visiting.delete(key);
    visited.add(key);
  }
  map.forEach((_, key) => walk(key));
  return content;
}
