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

it("does not repeat the same battle question while the subject pool lasts", () => {
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
  for (let turn = 0; turn < 6; turn++) {
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
  const firstLesson = questions.find((q) => q.id === seen[0])!.lesson;
  expect(firstLesson).toBe("stacks-queues");
  // The pool widened beyond the single lesson to the same subject.
  const widened = seen.some(
    (id) => questions.find((q) => q.id === id)!.lesson !== "stacks-queues",
  );
  expect(widened).toBe(true);
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
});
