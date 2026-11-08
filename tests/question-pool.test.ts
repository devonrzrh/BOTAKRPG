import { expect, it } from "vitest";
import raw from "../src/generated/content.json";
import {
  validateContent,
  type Question,
  type Skill,
} from "../src/content/schema";
import { createBattle, selectSkill, type Battle } from "../src/game/combat";
import { initialSave } from "../src/game/state";
const content = validateContent(raw);
const questions = content.entities.filter(
  (e): e is Question => e.type === "question",
);
const insight = content.entities.find(
  (e): e is Skill => e.type === "skill" && e.id === "insight",
)!;

it("uses only chapter and prerequisite questions without repeating before exhaustion", () => {
  const save = initialSave();
  let battle: Battle = createBattle({
    id: "pool-test",
    title: "Pool test",
    hp: 500,
    attack: 1,
    mixedQuestions: false,
    lessons: ["stacks-queues"],
  });
  const seen: string[] = [];
  const eligibleLessons = new Set<string>();
  const addPrerequisites = (id: string) => {
    if (eligibleLessons.has(id)) return;
    eligibleLessons.add(id);
    const lesson = content.entities.find(
      (e) => e.type === "lesson" && e.id === id,
    );
    if (lesson?.type === "lesson")
      lesson.prerequisites.forEach(addPrerequisites);
  };
  addPrerequisites("stacks-queues");
  const eligibleQuestions = questions.filter((q) =>
    eligibleLessons.has(q.lesson),
  );
  for (let turn = 0; turn < eligibleQuestions.length; turn++) {
    battle = selectSkill(
      { ...battle, phase: "choose", turn: turn + 1 },
      save,
      insight,
      questions,
      content,
    );
    seen.push(battle.question!);
  }
  expect(new Set(seen).size).toBe(seen.length);
  expect(new Set(seen)).toEqual(new Set(eligibleQuestions.map((q) => q.id)));
  expect(
    seen.every((id) =>
      eligibleLessons.has(questions.find((q) => q.id === id)!.lesson),
    ),
  ).toBe(true);
  expect(
    seen.some(
      (id) => questions.find((q) => q.id === id)!.lesson !== "stacks-queues",
    ),
  ).toBe(true);
});

it("restarts the cycle without repeating the prompt on screen", () => {
  const save = initialSave();
  let battle: Battle = createBattle({
    id: "cycle",
    title: "Cycle",
    hp: 500,
    attack: 1,
    mixedQuestions: false,
    lessons: ["stacks-queues"],
  });
  battle = selectSkill(battle, save, insight, questions, content);
  const first = battle.question;
  // Force every candidate to count as asked, as if the subject were exhausted.
  battle = {
    ...battle,
    phase: "choose",
    turn: 2,
    asked: questions.map((q) => q.id),
  };
  const next = selectSkill(battle, save, insight, questions, content);
  expect(next.question).not.toBe(first);
  const cleared = selectSkill(
    {
      ...battle,
      question: null,
      asked: [
        ...questions.filter((q) => q.id !== first).map((q) => q.id),
        first!,
      ],
    },
    save,
    insight,
    questions,
    content,
  );
  expect(cleared.question).not.toBe(first);
});
