import { expect, it } from "vitest";
import raw from "../src/generated/content.json";
import {
  validateContent,
  type Quest,
  type Skill,
  type Question,
} from "../src/content/schema";
import {
  initialSave,
  completeActivity,
  claimQuest,
  parseSave,
  rewardBattleVictory,
} from "../src/game/state";
import {
  activityUnlocked,
  finaleAvailable,
  investigationProgress,
  questUnlocked,
} from "../src/game/investigation";
import {
  createBattle,
  selectMomentum,
  selectSkill,
  answerBattle,
  enemyTurn,
} from "../src/game/combat";
const content = validateContent(raw);
const branches = content.entities.filter(
  (e): e is Quest => e.type === "quest" && e.kind === "branch",
);
const finale = content.entities.find(
  (e): e is Quest => e.type === "quest" && e.kind === "finale",
)!;
const root = content.entities.find(
  (e): e is Quest => e.type === "quest" && e.id === "first-principles",
)!;
const echo = content.entities.find(
  (e) => e.type === "activity" && e.id === "echo-battle",
)!;
const questions = content.entities.filter(
  (e): e is Question => e.type === "question",
);
const firewall = content.entities.find(
  (e): e is Skill => e.type === "skill" && e.id === "ward",
)!;
const probe = content.entities.find(
  (e): e is Skill => e.type === "skill" && e.id === "insight",
)!;
it("tracks required steps across the opening, leads and finale", () => {
  let save = initialSave();
  const progress = () => investigationProgress(save, content);
  expect(progress()).toMatchObject({ percent: 0, stage: "Awaiting briefing" });
  save.story.prologueSeen = true;
  expect(progress().percent).toBeGreaterThan(0);
  save.story.caseAccepted = true;
  expect(progress().stage).toBe("Connect to gateway");
  save.story.networkIntroSeen = true;
  const firstLead = progress();
  expect(firstLead.stage).toBe("Following leads");
  save.character.xp += 300;
  expect(progress()).toEqual(firstLead);
  save = completeActivity(save, branches[0].objectives[0]);
  const oneObjective = progress();
  expect(oneObjective.percent).toBeGreaterThan(firstLead.percent);
  save = completeActivity(save, branches[0].objectives[0]);
  expect(progress()).toEqual(oneObjective);
  for (const branch of branches)
    for (const id of branch.objectives) save = completeActivity(save, id);
  expect(progress().stage).toBe("Reconstruct evidence");
  save = completeActivity(save, "evidence-chain");
  expect(progress().stage).toBe("Confront ECHO-7");
  expect(progress().percent).toBeLessThan(100);
  save = completeActivity(save, "echo-battle");
  const closed = progress();
  expect(closed).toMatchObject({ stage: "Case closed", caseClosed: true });
  expect(closed.percent).toBeLessThan(100);
  expect(closed.categories.find((category) => category.title === "Finale"))
    .toMatchObject({ percent: 100 });
  expect(closed.categories.find((category) => category.title === "Reading"))
    .toMatchObject({ percent: 0 });
  const lessons = content.entities.filter((entity) => entity.type === "lesson");
  save.reading.finishedLessons = lessons.slice(0, 5).map((lesson) => lesson.id);
  save.reading.finishedLessons.push(lessons[0].id);
  expect(progress().percent).toBeGreaterThan(closed.percent);
  expect(progress().categories.find((category) => category.title === "Reading"))
    .toMatchObject({ done: 5, total: lessons.length });
  save.reading.finishedLessons = lessons.map((lesson) => lesson.id);
  expect(progress()).toMatchObject({ percent: 100, stage: "Case closed" });
});

it("keeps a completed legacy investigation closed", () => {
  const save = completeActivity(initialSave(), "echo-battle");
  save.story.legacyFinale = true;
  expect(investigationProgress(save, content)).toMatchObject({
    caseClosed: true,
    stage: "Case closed",
  });
});

it("allows all branch orders and unlocks the boss only after every clue", () => {
  const orders = (ids: string[]): string[][] =>
    ids.length
      ? ids.flatMap((id) =>
          orders(ids.filter((other) => other !== id)).map((rest) => [
            id,
            ...rest,
          ]),
        )
      : [[]];
  for (const order of orders(branches.map((branch) => branch.id))) {
    let save = initialSave();
    save.story.caseAccepted = true;
    expect(branches.every((q) => questUnlocked(save, q, content))).toBe(true);
    expect(finaleAvailable(save, content)).toBe(false);
    order.forEach((branchId, step) => {
      const branch = branches.find((q) => q.id === branchId)!;
      for (const id of branch.objectives) save = completeActivity(save, id);
      expect(finaleAvailable(save, content)).toBe(step === order.length - 1);
    });
    // Claiming rewards is optional for unlocking the encounter.
    expect(save.claimed).toEqual([]);
    for (const q of branches) {
      save = claimQuest(save, q, content);
      expect(claimQuest(save, q, content)).toBe(save);
    }
    expect(save.character.xp).toBe(branches.reduce((sum, q) => sum + q.xp, 0));
  }
});
it("rejects premature finale saves and rewards", () => {
  let save = initialSave();
  save = completeActivity(save, "echo-battle");
  expect(() => parseSave(save, content)).toThrow(/all clue branches/);
  expect(claimQuest(save, finale, content)).toBe(save);
  const forged = {
    ...save,
    story: { ...save.story, caseAccepted: true },
  };
  expect(() => parseSave(forged, content)).toThrow(/all clue branches/);
});
it("requires the five-clue evidence chain before ECHO-7", () => {
  let save = initialSave();
  save.story.caseAccepted = true;
  for (const branch of branches)
    for (const id of branch.objectives) save = completeActivity(save, id);
  expect(activityUnlocked(save, "evidence-chain", content)).toBe(true);
  expect(activityUnlocked(save, "echo-battle", content)).toBe(false);
  expect(finaleAvailable(save, content)).toBe(true);
  save = completeActivity(save, "evidence-chain");
  expect(activityUnlocked(save, "echo-battle", content)).toBe(true);
});
it("uses all material topics in the final boss and can complete the case", () => {
  let save = initialSave();
  save.story.caseAccepted = true;
  for (const q of branches)
    for (const id of q.objectives) save = completeActivity(save, id);
  save = claimQuest(save, root, content);
  let battle = createBattle(
    echo.type === "activity" ? echo.enemy : undefined,
    0,
    save.character.level,
  );
  expect(battle.enemyId).toBe("echo-7");
  expect(battle.maxHp).toBe(116);
  const studied = new Set<string>();
  while (battle.phase !== "won" && battle.phase !== "lost") {
    if (battle.momentum >= 25) battle = selectMomentum(battle, 25);
    const skill = save.character.focus >= firewall.cost ? firewall : probe;
    battle = selectSkill(battle, save, skill, questions, content);
    const q = questions.find((q) => q.id === battle.question)!;
    studied.add(q.lesson);
    const result = answerBattle(battle, save, content, q.answer);
    const reply = enemyTurn(result.battle, result.save, content);
    battle = reply.battle;
    save = reply.save;
  }
  expect(battle.phase).toBe("won");
  expect(
    new Set(
      [...studied]
        .map((id) =>
          content.entities.find((e) => e.type === "lesson" && e.id === id),
        )
        .map((e) => (e?.type === "lesson" ? e.topic : "")),
    ),
  ).toEqual(new Set(["algorithms", "structures", "ai"]));
  save = completeActivity(save, "evidence-chain");
  const victory = rewardBattleVictory(save, "echo-battle", "pacified");
  expect(victory.character.xp).toBe(save.character.xp + 60);
  expect(victory.supply.tokens).toBe(save.supply.tokens + 1);
  expect(rewardBattleVictory(victory, "echo-battle", "defeated")).toBe(victory);
  save = claimQuest(victory, finale, content);
  expect(save.claimed).toContain(finale.id);
  expect(claimQuest(save, finale, content)).toBe(save);
  expect(parseSave(save, content).completed).toContain("echo-battle");
  expect(parseSave(save, content).finaleOutcome).toBe("pacified");
});
