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
  storyBranch,
} from "../src/game/questStory";
import {
  initialSave,
  completeActivity,
  addXp,
  claimQuest,
  parseSave,
  recordAnswer,
  recoverResources,
} from "../src/game/state";
import {
  activityUnlocked,
  nextObjective,
  questComplete,
  finaleAvailable,
} from "../src/game/investigation";
import {
  createBattle,
  selectSkill,
  answerBattle,
  enemyTurn,
  guardTurn,
} from "../src/game/combat";
const content = validateContent(raw),
  branch = content.entities.find(
    (e): e is Quest => e.type === "quest" && e.id === "access-records",
  )!;
const questions = content.entities.filter(
  (e): e is Question => e.type === "question",
);
const probe = content.entities.find(
  (e): e is Skill => e.type === "skill" && e.id === "insight",
)!;

it("plays the entire archive independently, including resource recovery, boss, saved dialogue and its own reward", () => {
  let save = initialSave();
  save.story = {
    ...save.story,
    caseAccepted: true,
    prologueSeen: true,
    networkIntroSeen: true,
  };
  let turns = 0;
  for (const id of branch.objectives) {
    expect(nextObjective(save, branch)).toBe(id);
    expect(activityUnlocked(save, id, content)).toBe(true);
    expect(storyBranch(content, id)?.id).toBe("access-records");
    const scene = pendingStory(save, content, id, "before")!;
    expect(scene, id).toBeDefined();
    save = acknowledgeStory(save, scene);
    save = parseSave(JSON.parse(JSON.stringify(save)), content);
    const activity = content.entities.find((e) => e.id === id);
    if (activity?.type !== "activity") throw new Error(id);
    save = recoverResources(save);
    let battle = createBattle(
      activity.enemy ?? {
        id: "sentinel",
        title: scene.enemyName!,
        hp: 76,
        attack: 10,
        mixedQuestions: false,
        lessons: [activity.lesson],
      },
    );
    while (battle.phase !== "won" && battle.phase !== "lost" && turns < 160) {
      if (
        activity.enemy?.tactics?.mechanic === "archive" &&
        !battle.archiveOpen
      ) {
        const guarded = guardTurn(battle, save, content);
        battle = guarded.battle;
        save = guarded.save;
      }
      battle = selectSkill(battle, save, probe, questions);
      const q = questions.find((q) => q.id === battle.question)!;
      const hit = answerBattle(battle, save, content, q.answer);
      const mastered = recordAnswer(hit.save, q.lesson, q.id, true, false);
      const reply = enemyTurn(hit.battle, mastered, content);
      battle = reply.battle;
      save = reply.save;
      turns++;
    }
    expect(battle.phase, id).toBe("won");
    save = addXp(completeActivity(save, id), 20);
  }
  expect(questComplete(save, branch)).toBe(true);
  expect(save.completed).not.toContain("maze-chamber");
  expect(save.claimed).not.toContain("routing-trace");
  const ending = pendingStory(save, content, "archive-keeper", "after")!;
  expect(ending.nodes.map((n) => n.text).join(" ")).toContain("M-04");
  save = acknowledgeStory(save, ending);
  const owner = storyBranch(content, ending.trigger!.activity)!;
  save = claimQuest(save, owner, content);
  expect(save.claimed).toEqual(["access-records"]);
  expect(claimQuest(save, owner, content)).toBe(save);
  expect(save.character.level).toBe(3);
  expect(save.character.xp).toBe(260);
  expect(save.story.seenDialogues).toHaveLength(13);
  expect(finaleAvailable(save, content)).toBe(false);
  expect(parseSave(save, content).story.seenDialogues).toHaveLength(13);
});
it("keeps archive and routing endings separate and restores an interrupted archive ending", () => {
  let save = initialSave();
  save.story.caseAccepted = true;
  expect(
    pendingStory(save, content, "archive-keeper", "after"),
  ).toBeUndefined();
  for (const id of branch.objectives) save = completeActivity(save, id);
  save = parseSave(JSON.parse(JSON.stringify(save)), content);
  expect(pendingStory(save, content, "archive-keeper", "after")?.id).toBe(
    "access-resolution",
  );
  expect(pendingStory(save, content, "route-warden", "after")).toBeUndefined();
  expect(storyBranch(content, "route-warden")?.id).toBe("routing-trace");
  expect(storyBranch(content, "archive-keeper")?.id).toBe("access-records");
});
