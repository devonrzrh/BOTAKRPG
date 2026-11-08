import { expect, it } from "vitest";
import raw from "../src/generated/content.json";
import {
  validateContent,
  type Question,
  type Quest,
  type Skill,
} from "../src/content/schema";
import {
  accuracy,
  heldOut,
  initialNetwork,
  train,
  type Sample,
} from "../src/game/perceptron";
import {
  acknowledgeStory,
  pendingStory,
  storyBranch,
} from "../src/game/questStory";
import {
  addXp,
  claimQuest,
  completeActivity,
  initialSave,
  parseSave,
  recordAnswer,
  stats,
  recoverResources,
} from "../src/game/state";
import {
  activityUnlocked,
  finaleAvailable,
  nextObjective,
  questComplete,
  questUnlocked,
} from "../src/game/investigation";
import {
  chaptersForBranch,
  introduceChapter,
  needsGuidedPractice,
  practiceChapter,
} from "../src/game/chapterQuest";
import {
  answerBattle,
  createBattle,
  enemyTurn,
  isCorrect,
  selectSkill,
} from "../src/game/combat";

const content = validateContent(raw);
import { solvePuzzle } from "./helpers/solvePuzzle";
import { rewardPuzzle } from "../src/game/puzzleProgress";
const signal = content.entities.find(
  (e): e is Quest => e.type === "quest" && e.id === "signal-identification",
)!;
const questions = content.entities.filter(
  (e): e is Question => e.type === "question",
);
const insight = content.entities.find(
  (e): e is Skill => e.type === "skill" && e.id === "insight",
)!;

function trainOrientation() {
  // Four distinct examples on both sides of the exhibit's x₁ + x₂ boundary.
  const samples: Sample[] = [
    { x: -0.8, y: -0.5, label: 0 },
    { x: -0.5, y: 0.2, label: 0 },
    { x: 0.8, y: 0.5, label: 1 },
    { x: 0.2, y: 0.8, label: 1 },
  ];
  const model = train(initialNetwork(), samples, 10, 0.2);
  expect(model.epochs).toBeGreaterThan(0);
  expect(accuracy(model, heldOut)).toBeGreaterThanOrEqual(5 / 6);
  return model;
}

function wrongAnswer(question: Question) {
  const count = question.options.length;
  for (let mask = 0; mask < 1 << count; mask++) {
    const answer = Array.from({ length: count }, (_, i) => i).filter(
      (i) => mask & (1 << i),
    );
    if (!isCorrect(question, answer)) return answer;
  }
  throw new Error(`No wrong answer available for ${question.id}`);
}

function winEncounter(save: ReturnType<typeof initialSave>, id: string) {
  save = recoverResources(save);
  const activity = content.entities.find((e) => e.id === id);
  if (activity?.type !== "activity" || !activity.enemy)
    throw new Error(`Missing encounter ${id}`);
  let battle = createBattle(activity.enemy),
    turns = 0;
  while (battle.phase !== "won" && battle.phase !== "lost" && turns < 100) {
    battle = selectSkill(battle, save, insight, questions);
    const question = questions.find((q) => q.id === battle.question)!;
    const hit = answerBattle(battle, save, content, question.answer);
    save = recordAnswer(hit.save, question.lesson, question.id, true, false);
    const reply = enemyTurn(hit.battle, save, content);
    battle = reply.battle;
    save = reply.save;
    turns++;
  }
  expect(battle.phase, id).toBe("won");
  return { save, turns };
}

it("trains and tests a real orientation model to the Garden's held-out completion threshold", () => {
  const model = trainOrientation();
  expect(model.epochs).toBeGreaterThanOrEqual(10);
  expect(accuracy(model, heldOut)).toBeGreaterThanOrEqual(5 / 6);
});

it("keeps the current signal encounter available after defeat and allows a recovered retry", () => {
  const id = "encounter-source-ai-01";
  let save = initialSave();
  save.story.caseAccepted = true;
  save = completeActivity(save, "perceptron-exhibit");
  save.character.hp = 1;
  expect(activityUnlocked(save, id, content)).toBe(true);
  const activity = content.entities.find((e) => e.id === id);
  if (activity?.type !== "activity" || !activity.enemy) throw new Error(id);
  let battle = selectSkill(
    createBattle(activity.enemy),
    save,
    insight,
    questions,
  );
  const question = questions.find((q) => q.id === battle.question)!;
  const hit = answerBattle(battle, save, content, wrongAnswer(question));
  const defeated = enemyTurn(hit.battle, hit.save, content);
  expect(defeated.battle.phase).toBe("lost");
  expect(defeated.save.completed).not.toContain(id);
  expect(nextObjective(defeated.save, signal)).toBe(id);
  let retry = {
    ...defeated.save,
    character: {
      ...defeated.save.character,
      hp: stats(defeated.save, content).maxHp,
      focus: stats(defeated.save, content).maxFocus,
    },
  };
  expect(activityUnlocked(retry, id, content)).toBe(true);
  const result = winEncounter(retry, id);
  expect(result.save.completed).not.toContain(id);
  expect(result.save.character.hp).toBeGreaterThan(0);
});

it("plays the signal investigation through ordered chapter practice, combat, saved scenes, and its own reward", () => {
  let save = initialSave();
  save.story.caseAccepted = true;
  save.story.prologueSeen = true;
  save.story.networkIntroSeen = true;
  const chapters = chaptersForBranch(content, signal.id);
  expect(chapters).toHaveLength(10);
  let turns = 0,
    potions = 0;

  for (const id of signal.objectives) {
    expect(nextObjective(save, signal)).toBe(id);
    expect(activityUnlocked(save, id, content)).toBe(true);
    expect(storyBranch(content, id)?.id).toBe(signal.id);
    const before = pendingStory(save, content, id, "before");
    expect(before, id).toBeDefined();
    save = acknowledgeStory(save, before!);
    save = parseSave(JSON.parse(JSON.stringify(save)), content);

    if (id === "perceptron-exhibit") {
      const model = trainOrientation();
      expect(model.epochs).toBeGreaterThanOrEqual(10);
      save = completeActivity(save, id);
    } else if (id.startsWith("puzzle-")) {
      const activity = content.entities.find((e) => e.id === id);
      if (activity?.type !== "activity") throw new Error(id);
      save.puzzleRuns[id] = {
        commands: solvePuzzle(activity),
        assisted: false,
      };
      save = rewardPuzzle(save, activity, content, false);
    } else {
      const chapter = chapters.find((c) => c.objectives.includes(id));
      if (chapter) {
        expect(needsGuidedPractice(save, chapter)).toBe(true);
        save = introduceChapter(save, chapter);
        expect(() =>
          practiceChapter(
            initialSave(),
            chapter,
            chapter.learning!.practice.answer,
          ),
        ).toThrow(/worked example/);
        const wrong =
          (chapter.learning!.practice.answer + 1) %
          chapter.learning!.practice.options.length;
        const failedPractice = practiceChapter(save, chapter, wrong);
        expect(failedPractice.correct).toBe(false);
        save = failedPractice.save;
        const guided = practiceChapter(
          save,
          chapter,
          chapter.learning!.practice.answer,
        );
        expect(guided.correct).toBe(true);
        save = guided.save;
        expect(needsGuidedPractice(save, chapter)).toBe(false);
      }
      const result = winEncounter(save, id);
      save = result.save;
      turns += result.turns;
      save = addXp(completeActivity(save, id), 20);
    }
    const after = pendingStory(save, content, id, "after");
    if (after && id !== "signal-mimic") save = acknowledgeStory(save, after);
    save = parseSave(JSON.parse(JSON.stringify(save)), content);
  }

  expect(turns).toBeGreaterThan(0);
  expect(questComplete(save, signal)).toBe(true);
  expect(save.completed).toEqual(expect.arrayContaining(signal.objectives));
  expect(save.completed).not.toContain("maze-chamber");
  expect(save.completed).not.toContain("guardian-battle");
  expect(save.claimed).not.toContain("routing-trace");
  expect(save.claimed).not.toContain("access-records");
  expect(save.mastery["source-ai-01"].correct).toBeGreaterThan(0);
  expect(save.mastery["source-ai-01"].answered.length).toBe(
    save.mastery["source-ai-01"].correct,
  );

  const ending = pendingStory(save, content, "signal-mimic", "after");
  expect(ending?.id).toBe("signal-resolution");
  expect(ending!.nodes.map((n) => n.text).join(" ")).toMatch(
    /Verified handshake.*M-04/is,
  );
  save = acknowledgeStory(save, ending!);
  save = claimQuest(save, signal, content);
  expect(save.claimed).toContain(signal.id);
  expect(claimQuest(save, signal, content)).toBe(save);
  expect(finaleAvailable(save, content)).toBe(false);
  expect(
    parseSave(JSON.parse(JSON.stringify(save)), content).story.seenDialogues,
  ).toContain("signal-resolution");
});

it("preserves the unresolved signal ending across saves and keeps the final encounter locked until all three branches resolve", () => {
  let save = initialSave();
  save.story.caseAccepted = true;
  const finale = content.entities.find(
    (e): e is Quest => e.type === "quest" && e.kind === "finale",
  )!;
  const branches = content.entities.filter(
    (e): e is Quest => e.type === "quest" && e.kind === "branch",
  );
  expect(branches.map((q) => q.id)).toEqual(
    expect.arrayContaining(["routing-trace", "access-records", signal.id]),
  );
  for (const id of signal.objectives) save = completeActivity(save, id);
  const interrupted = parseSave(JSON.parse(JSON.stringify(save)), content);
  expect(pendingStory(interrupted, content, "signal-mimic", "after")?.id).toBe(
    "signal-resolution",
  );
  expect(
    pendingStory(interrupted, content, "route-warden", "after"),
  ).toBeUndefined();
  expect(
    pendingStory(interrupted, content, "archive-keeper", "after"),
  ).toBeUndefined();
  expect(finaleAvailable(interrupted, content)).toBe(false);
  for (const branchId of ["routing-trace", "access-records"]) {
    const branch = branches.find((q) => q.id === branchId)!;
    for (const id of branch.objectives) save = completeActivity(save, id);
    save = claimQuest(save, branch, content);
  }
  expect(branches.every((q) => questUnlocked(save, q, content))).toBe(true);
  expect(finaleAvailable(save, content)).toBe(true);
  expect(activityUnlocked(save, finale.objectives[0], content)).toBe(true);
  expect(stats(save, content).maxHp).toBeGreaterThanOrEqual(60);
});
