import { expect, it } from "vitest";
import raw from "../src/generated/content.json";
import {
  validateContent,
  type Quest,
  type Question,
  type Skill,
} from "../src/content/schema";
import {
  activityStory,
  pendingStory,
  acknowledgeStory,
} from "../src/game/questStory";
import {
  initialSave,
  completeActivity,
  addXp,
  recordAnswer,
  claimQuest,
  parseSave,
  stats,
} from "../src/game/state";
import {
  activityUnlocked,
  nextObjective,
  questComplete,
  finaleAvailable,
} from "../src/game/investigation";
import { createMaze, shortestPath, move, atGoal } from "../src/game/maze";
import {
  createBattle,
  selectSkill,
  answerBattle,
  enemyTurn,
} from "../src/game/combat";
const content = validateContent(raw);
const route = content.entities.find(
  (e): e is Quest => e.type === "quest" && e.id === "routing-trace",
)!;
const questions = content.entities.filter(
  (e): e is Question => e.type === "question",
);
const probe = content.entities.find(
  (e): e is Skill => e.type === "skill" && e.id === "insight",
)!;

it("plays the complete routing story from the maze to the Warden and files its reward once", () => {
  let save = initialSave();
  save.story.caseAccepted = true;
  save.story.prologueSeen = true;
  save.story.networkIntroSeen = true;
  let turns = 0;
  for (const id of route.objectives) {
    expect(nextObjective(save, route)).toBe(id);
    expect(activityUnlocked(save, id, content)).toBe(true);
    const scene = pendingStory(save, content, id, "before")!;
    expect(scene, id).toBeDefined();
    expect(scene.nodes.every((n) => n.choices.length > 0)).toBe(true);
    save = acknowledgeStory(save, scene);
    expect(pendingStory(save, content, id, "before")).toBeUndefined();
    // Restore between stages: no repeated scene or fabricated activity completion.
    save = parseSave(JSON.parse(JSON.stringify(save)), content);
    expect(save.completed).not.toContain(id);
    if (id === "maze-chamber") {
      let maze = createMaze(save.seed);
      for (const direction of shortestPath(maze)) maze = move(maze, direction);
      expect(atGoal(maze)).toBe(true);
    } else {
      const activity = content.entities.find((e) => e.id === id);
      if (activity?.type !== "activity" || !activity.enemy) throw new Error(id);
      let battle = createBattle({
        ...activity.enemy,
        title: scene.enemyName ?? activity.enemy.title,
      });
      while (battle.phase !== "won" && battle.phase !== "lost" && turns < 100) {
        battle = selectSkill(battle, save, probe, questions);
        const question = questions.find((q) => q.id === battle.question)!;
        const hit = answerBattle(battle, save, content, question.answer);
        save = recordAnswer(
          hit.save,
          question.lesson,
          question.id,
          true,
          false,
        );
        const reply = enemyTurn(hit.battle, save, content);
        save = reply.save;
        battle = reply.battle;
        turns++;
      }
      expect(battle.phase, id).toBe("won");
      save = addXp(save, 20);
    }
    save = completeActivity(save, id);
  }
  expect(turns).toBeLessThan(100);
  expect(questComplete(save, route)).toBe(true);
  const ending = pendingStory(save, content, "route-warden", "after")!;
  expect(ending.nodes.map((n) => n.text).join(" ")).toMatch(/R-17.*02:14/);
  save = acknowledgeStory(save, ending);
  save = claimQuest(save, route, content);
  expect(claimQuest(save, route, content)).toBe(save);
  expect(acknowledgeStory(save, ending)).toBe(save);
  expect(save.character.level).toBeGreaterThan(1);
  expect(save.inventory["focus-tea"]).toBe(3);
  expect(save.story.seenDialogues).toHaveLength(14);
  expect(finaleAvailable(save, content)).toBe(false);
  expect(parseSave(save, content).story.seenDialogues).toHaveLength(14);
});
it("keeps unseen dialogue resumable after leaving and requires a boss victory before the ending", () => {
  const save = initialSave(),
    scene = pendingStory(save, content, "maze-chamber", "before")!;
  expect(pendingStory(save, content, "maze-chamber", "before")?.id).toBe(
    scene.id,
  );
  expect(pendingStory(save, content, "route-warden", "after")).toBeUndefined();
  const invalid = {
    ...save,
    story: { ...save.story, seenDialogues: ["missing-story"] },
  };
  expect(() => parseSave(invalid, content)).toThrow(/unknown dialogue/);
});
it("preserves progress on defeat and permits a fully recovered retry of the current encounter", () => {
  let save = initialSave();
  save.story.caseAccepted = true;
  save = completeActivity(save, "maze-chamber");
  const id = nextObjective(save, route),
    scene = activityStory(content, id, "before")!;
  save = acknowledgeStory(save, scene);
  save.character.hp = 1;
  const activity = content.entities.find((e) => e.id === id);
  if (activity?.type !== "activity") throw new Error(id);
  let battle = selectSkill(
    createBattle(activity.enemy),
    save,
    probe,
    questions,
  );
  const q = questions.find((q) => q.id === battle.question)!;
  const wrong = answerBattle(battle, save, content, [
    (q.answer[0] + 1) % q.options.length,
  ]);
  const lost = enemyTurn(wrong.battle, wrong.save, content);
  expect(lost.battle.phase).toBe("lost");
  expect(nextObjective(lost.save, route)).toBe(id);
  expect(lost.save.completed).toEqual(["maze-chamber"]);
  save = {
    ...lost.save,
    character: {
      ...lost.save.character,
      hp: stats(lost.save).maxHp,
      focus: stats(lost.save).maxFocus,
    },
  };
  expect(activityUnlocked(save, id, content)).toBe(true);
  expect(pendingStory(save, content, id, "before")).toBeUndefined();
  expect(createBattle(activity.enemy).phase).toBe("choose");
});
it("rejects missing or ambiguous story activity triggers", () => {
  const copy = structuredClone(raw),
    scene = copy.entities.find((e) => e.type === "dialogue" && "trigger" in e)!;
  expect(() =>
    validateContent({
      ...copy,
      entities: [...copy.entities, { ...scene, id: "duplicate-story" }],
    }),
  ).toThrow(/duplicate story trigger/);
  expect(() =>
    validateContent({
      ...copy,
      entities: [
        ...copy.entities.filter((e) => e.id !== scene.id),
        { ...scene, trigger: { activity: "missing-activity", when: "before" } },
      ],
    }),
  ).toThrow(/missing activity reference/);
});
