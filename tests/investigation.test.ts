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
} from "../src/game/state";
import { finaleAvailable, questUnlocked } from "../src/game/investigation";
import {
  createBattle,
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
const probe = content.entities.find(
  (e): e is Skill => e.type === "skill" && e.id === "insight",
)!;
it("allows all branch orders and unlocks the boss only after every clue", () => {
  for (const order of [
    [0, 1, 2],
    [0, 2, 1],
    [1, 0, 2],
    [1, 2, 0],
    [2, 0, 1],
    [2, 1, 0],
  ]) {
    let save = initialSave();
    save.story.caseAccepted = true;
    expect(branches.every((q) => questUnlocked(save, q, content))).toBe(true);
    expect(finaleAvailable(save, content)).toBe(false);
    order.forEach((index, step) => {
      for (const id of branches[index].objectives)
        save = completeActivity(save, id);
      expect(finaleAvailable(save, content)).toBe(step === 2);
    });
    // Claiming rewards is optional for unlocking the encounter.
    expect(save.claimed).toEqual([]);
    for (const q of branches) {
      save = claimQuest(save, q, content);
      expect(claimQuest(save, q, content)).toBe(save);
    }
    expect(save.character.xp).toBe(60);
  }
});
it("rejects premature finale saves and rewards", () => {
  let save = initialSave();
  save = completeActivity(save, "echo-battle");
  expect(() => parseSave(save, content)).toThrow(/all clue branches/);
  expect(claimQuest(save, finale, content)).toBe(save);
});
it("uses all material topics in the final boss and can complete the case", () => {
  let save = initialSave();
  save.story.caseAccepted = true;
  for (const q of branches)
    for (const id of q.objectives) save = completeActivity(save, id);
  save = claimQuest(save, root, content);
  let battle = createBattle(echo.type === "activity" ? echo.enemy : undefined);
  expect(battle.enemyId).toBe("echo-7");
  expect(battle.maxHp).toBe(105);
  const studied = new Set<string>();
  while (battle.phase !== "won" && battle.phase !== "lost") {
    battle = selectSkill(battle, save, probe, questions);
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
  save = completeActivity(save, "echo-battle");
  save = claimQuest(save, finale, content);
  expect(save.claimed).toContain(finale.id);
  expect(claimQuest(save, finale, content)).toBe(save);
  expect(parseSave(save, content).completed).toContain("echo-battle");
});
