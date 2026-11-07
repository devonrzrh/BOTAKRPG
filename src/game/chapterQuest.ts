import type { Content, Quest } from "../content/schema";
import { evidence, type Save } from "./state";
export const chapterForActivity = (content: Content, id: string) =>
  content.entities.find(
    (e): e is Quest =>
      e.type === "quest" && e.kind === "chapter" && e.objectives.includes(id),
  );
export const chaptersForBranch = (content: Content, id: string) =>
  content.entities.filter(
    (e): e is Quest =>
      e.type === "quest" && e.kind === "chapter" && e.branch === id,
  );
export const needsGuidedPractice = (save: Save, chapter: Quest) =>
  !chapter.objectives.every((id) => save.completed.includes(id)) &&
  !save.chapterProgress[chapter.id]?.practiced;
export function introduceChapter(save: Save, chapter: Quest): Save {
  return {
    ...save,
    chapterProgress: {
      ...save.chapterProgress,
      [chapter.id]: {
        introduced: true,
        practiced: save.chapterProgress[chapter.id]?.practiced ?? false,
        attempts: save.chapterProgress[chapter.id]?.attempts ?? 0,
      },
    },
  };
}
export function practiceChapter(save: Save, chapter: Quest, answer: number) {
  if (!chapter.learning || !save.chapterProgress[chapter.id]?.introduced)
    throw new Error("Read the worked example before practicing.");
  if (
    !Number.isInteger(answer) ||
    answer < 0 ||
    answer >= chapter.learning.practice.options.length
  )
    throw new Error("Choose a valid practice answer.");
  const correct = answer === chapter.learning.practice.answer,
    old = save.chapterProgress[chapter.id];
  let next = {
    ...save,
    chapterProgress: {
      ...save.chapterProgress,
      [chapter.id]: {
        ...old,
        attempts: old.attempts + 1,
        practiced: old.practiced || correct,
      },
    },
  };
  if (correct && chapter.lesson)
    next = evidence(next, chapter.lesson, `guided-practice-${chapter.id}`);
  return { save: next, correct };
}
const names: Record<string, string[]> = {
  alg: [
    "Python",
    "Algorithms",
    "Sorting",
    "Search & Big-O",
    "Recursion",
    "Complexity",
    "Graph search",
    "Greedy choices",
    "Dynamic prog.",
    "Inventory",
    "Planning",
  ],
  ds: [
    "Data structures",
    "Linear structures",
    "Arrays",
    "Linked lists",
    "Stacks",
    "Queues",
    "Nonlinear",
    "Trees",
    "Graphs",
    "Data versioning",
  ],
  ai: [
    "AI foundations",
    "Neural networks",
    "Applications",
    "Activations",
    "Time series",
    "Forecast ranges",
    "Online learning",
    "Recommend.",
    "RL",
    "Model training",
  ],
};
export function chapterLabel(chapter: Quest) {
  const [, group, num] =
    chapter.lesson?.match(/^source-(alg|ds|ai)-(\d+)$/) ?? [];
  return group
    ? `${num} ${names[group][Number(num) - (group === "alg" ? 0 : 1)]}`
    : chapter.title;
}
