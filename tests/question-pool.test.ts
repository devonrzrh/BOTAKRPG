import { expect, it } from "vitest";
import raw from "../src/generated/content.json";
import {
  validateContent,
  type Activity,
  type Question,
  type Skill,
} from "../src/content/schema";
import {
  battleAnswerOrder,
  createBattle,
  selectSkill,
  type Battle,
} from "../src/game/combat";
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
  expect(cleared.asked).toEqual([cleared.question]);
});

it("gives each chapter a varied six-question opening and changes the first prompt on rematches", () => {
  const save = initialSave();
  const encounters = content.entities.filter(
    (entity): entity is Activity =>
      entity.type === "activity" && entity.id.startsWith("encounter-source-"),
  );
  const replies = new Set<string>();
  expect(encounters).toHaveLength(31);
  for (const encounter of encounters) {
    let battle = createBattle(encounter.enemy!);
    const opening = Array.from({ length: 6 }, (_, i) => {
      battle = selectSkill(
        { ...battle, phase: "choose", turn: i + 1 },
        save,
        insight,
        questions,
        content,
      );
      return questions.find((q) => q.id === battle.question)!;
    });
    expect(new Set(opening.map((q) => q.id)).size, encounter.id).toBe(6);
    expect(opening[0].lesson, encounter.id).toBe(encounter.lesson);
    expect(opening[1].format, encounter.id).not.toBe(opening[0].format);
    const rematch = selectSkill(
      createBattle(encounter.enemy!, 1),
      save,
      insight,
      questions,
      content,
    );
    expect(rematch.question, encounter.id).not.toBe(opening[0].id);
    expect(
      questions.find((q) => q.id === rematch.question)?.lesson,
      encounter.id,
    ).toBe(encounter.lesson);
    const act = encounter.enemy!.tactics!.act;
    replies.add(act.options.slice().sort().join("\n"));
  }
  expect(replies.size).toBe(encounters.length);
});

it("shuffles the visible options without changing answer indices or showing an ordering solution", () => {
  const ordering = questions.find((q) => q.id === "bfs-order")!;
  const layouts = Array.from({ length: 10 }, (_, attempt) =>
    battleAnswerOrder(ordering, 1, attempt),
  );
  for (const order of layouts) {
    expect(order).not.toEqual(ordering.answer);
    expect(order.slice().sort()).toEqual([0, 1, 2, 3]);
  }
  expect(new Set(layouts.map((order) => order.join(","))).size).toBeGreaterThan(
    2,
  );
  expect(battleAnswerOrder(ordering, 1)).toEqual(layouts[0]);
});
