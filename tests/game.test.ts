import { describe, it, expect } from "vitest";
import {
  createMaze,
  shortestPath,
  move,
  atGoal,
  mazeCommand,
  neighbors,
} from "../src/game/maze";
import {
  createBattle,
  selectSkill,
  answerBattle,
  enemyTurn,
  useItem,
} from "../src/game/combat";
import {
  initialSave,
  claimQuest,
  completeActivity,
  parseSave,
  recordAnswer,
  unlockSkill,
  stats,
  addXp,
  evidence,
} from "../src/game/state";
import {
  addSample,
  train,
  initialNetwork,
  accuracy,
  heldOut,
} from "../src/game/perceptron";
import {
  validateContent,
  type Question,
  type Quest,
  type Skill,
  type Item,
} from "../src/content/schema";
import raw from "../src/generated/content.json";
const content = validateContent(raw),
  quest = content.entities.find((e): e is Quest => e.type === "quest")!,
  skills = content.entities.filter((e): e is Skill => e.type === "skill"),
  questions = content.entities.filter(
    (e): e is Question => e.type === "question",
  );
describe("Maze model", () => {
  it("is deterministic and generates distinct layouts", () => {
    expect(createMaze(42)).toEqual(createMaze(42));
    expect(createMaze(43).grid).not.toEqual(createMaze(42).grid);
  });
  it("always provides a route across 200 seeds", () => {
    for (let seed = 0; seed < 200; seed++) {
      let maze = createMaze(seed);
      const route = shortestPath(maze);
      expect(route.length).toBeGreaterThan(0);
      for (const d of route) maze = move(maze, d);
      expect(atGoal(maze)).toBe(true);
    }
  });
  it("manual and API movement follow identical rules", () => {
    let manual = createMaze(),
      program = createMaze();
    for (const direction of shortestPath(manual)) {
      manual = move(manual, direction);
      program = mazeCommand(program, "move", [direction]).maze;
    }
    expect(program).toEqual(manual);
  });
  it("supports a second valid algorithm, DFS", () => {
    let maze = createMaze(87);
    const seen = new Set<string>();
    function dfs(cell: [number, number], path: string[]): string[] | null {
      if (cell.join() === maze.goal.join()) return path;
      seen.add(cell.join());
      for (const [d, next] of neighbors(maze, cell))
        if (!seen.has(next.join())) {
          const result = dfs(next, [...path, d]);
          if (result) return result;
        }
      return null;
    }
    const route = dfs(maze.start, [])!;
    for (const d of route) maze = mazeCommand(maze, "move", [d]).maze;
    expect(atGoal(maze)).toBe(true);
  });
  it("does not walk through walls and validates API requests", () => {
    const maze = createMaze();
    expect(move(maze, "north").position).toEqual(maze.position);
    expect(() => mazeCommand(maze, "move", ["up"])).toThrow();
    expect(() => mazeCommand(maze, "neighbors", [[0, 0]])).toThrow();
    expect(() => mazeCommand(maze, "teleport", [])).toThrow();
  });
  it("limits command count and rejects invalid dimensions", () => {
    expect(() =>
      mazeCommand({ ...createMaze(), commands: 2000 }, "position", []),
    ).toThrow(/budget/);
    expect(() => createMaze(1, 10)).toThrow();
  });
});
describe("Combat rules", () => {
  const insight = skills.find((s) => s.id === "insight")!,
    ward = skills.find((s) => s.id === "ward")!;
  function prepared(skill = insight, save = initialSave()) {
    return selectSkill(createBattle(), save, skill, questions);
  }
  it("correct answers damage the selected enemy and spend focus", () => {
    const battle = prepared(ward),
      q = questions.find((q) => q.id === battle.question)!;
    const result = answerBattle(battle, initialSave(), content, q.answer);
    expect(result.correct).toBe(true);
    expect(result.battle.hp).toBeLessThan(battle.hp);
    expect(result.save.character.focus).toBe(9);
    expect(result.battle.effects[0].id).toBe("shield");
  });
  it("wrong answers spend the turn and enemy acts once", () => {
    const battle = prepared(),
      q = questions.find((q) => q.id === battle.question)!;
    const result = answerBattle(battle, initialSave(), content, [
      (q.answer[0] + 1) % q.options.length,
    ]);
    expect(result.battle.hp).toBe(76);
    expect(result.battle.phase).toBe("feedback");
    const reply = enemyTurn(result.battle, result.save, content);
    expect(reply.save.character.hp).toBe(52);
    expect(enemyTurn(reply.battle, reply.save, content)).toEqual(reply);
  });
  it("expires shield after exactly two attacks", () => {
    const battle = prepared(ward),
      q = questions.find((q) => q.id === battle.question)!;
    let result = answerBattle(battle, initialSave(), content, q.answer);
    let reply = enemyTurn(result.battle, result.save, content);
    expect(reply.save.character.hp).toBe(57);
    expect(reply.battle.effects[0].remaining).toBe(1);
    reply = enemyTurn(
      { ...reply.battle, phase: "feedback" },
      reply.save,
      content,
    );
    expect(reply.save.character.hp).toBe(54);
    expect(reply.battle.effects).toEqual([]);
  });
  it("poison can win before an enemy attacks; weaken reduces damage", () => {
    const save = initialSave(),
      battle = {
        ...createBattle(),
        phase: "feedback" as const,
        hp: 4,
        effects: [{ id: "poison" as const, magnitude: 4, remaining: 3 }],
      };
    const result = enemyTurn(battle, save, content);
    expect(result.battle.phase).toBe("won");
    expect(result.save.character.hp).toBe(60);
    const weakened = enemyTurn(
      {
        ...battle,
        hp: 76,
        effects: [{ id: "weaken", magnitude: 3, remaining: 2 }],
      },
      save,
      content,
    );
    expect(weakened.save.character.hp).toBe(55);
  });
  it("consumes an item once, caps restoration, and spends a turn", () => {
    const save = initialSave();
    save.character.hp = 55;
    const item = content.entities.find(
      (e): e is Item => e.id === "healing-draught" && e.type === "item",
    )!;
    const result = useItem(createBattle(), save, item, content);
    expect(result.save.character.hp).toBe(52);
    expect(result.save.inventory[item.id]).toBe(2);
    expect(result.battle.turn).toBe(2);
    expect(save.inventory[item.id]).toBe(3);
  });
  it("defeat is explicit and unaffordable skills cannot be selected", () => {
    const save = initialSave();
    save.character.hp = 1;
    expect(
      enemyTurn({ ...createBattle(), phase: "feedback" }, save, content).battle
        .phase,
    ).toBe("lost");
    save.character.focus = 0;
    expect(() => selectSkill(createBattle(), save, ward, questions)).toThrow();
  });
  it("validates the full ordering answer", () => {
    const save = initialSave(),
      b = { ...createBattle(), turn: 2 },
      battle = selectSkill(b, save, ward, questions),
      q = questions.find((q) => q.id === battle.question)!;
    expect(q.format).toBe("ordering");
    expect(
      answerBattle(battle, save, content, [...q.answer].reverse()).correct,
    ).toBe(false);
    expect(answerBattle(battle, save, content, q.answer).correct).toBe(true);
  });
});
describe("Progression and saves", () => {
  it("requires all objectives and awards quest rewards only once", () => {
    const save = initialSave();
    expect(claimQuest(save, quest)).toBe(save);
    let next = save;
    for (const id of quest.objectives) next = completeActivity(next, id);
    next = claimQuest(next, quest);
    expect(next.character.level).toBe(2);
    expect(next.inventory["scholar-charm"]).toBe(1);
    expect(claimQuest(next, quest)).toBe(next);
    expect(
      unlockSkill(
        next,
        skills.find((s) => s.id === "trace")!,
      ).character.skills,
    ).toContain("trace");
  });
  it("counts unique unaided answers separately from XP", () => {
    let save = recordAnswer(
      initialSave(),
      "graph-search",
      "bfs-shortest",
      true,
      true,
    );
    expect(save.mastery["graph-search"].correct).toBe(0);
    save = recordAnswer(save, "graph-search", "bfs-shortest", true, false);
    save = recordAnswer(save, "graph-search", "bfs-shortest", true, false);
    expect(save.mastery["graph-search"].correct).toBe(1);
    expect(save.character.xp).toBe(0);
    expect(
      evidence(
        evidence(save, "graph-search", "efficient-route"),
        "graph-search",
        "efficient-route",
      ).mastery["graph-search"].evidence,
    ).toHaveLength(1);
  });
  it("round-trips code, notes, blocks and settings", () => {
    const save = initialSave();
    save.code = "print(42)";
    save.notes["graph-search"] = "A queue explores layers.";
    save.blocks = { blocks: { languageVersion: 0, blocks: [] } };
    expect(parseSave(JSON.parse(JSON.stringify(save)), content)).toEqual(save);
  });
  it("rejects incompatible, unknown and inconsistent saves", () => {
    const save = initialSave();
    expect(() => parseSave({ ...save, version: 2 }, content)).toThrow();
    expect(() =>
      parseSave({ ...save, completed: ["missing"] }, content),
    ).toThrow();
    expect(() =>
      parseSave(
        { ...save, character: { ...save.character, hp: 999 } },
        content,
      ),
    ).toThrow();
    expect(() => parseSave({ ...save, blocks: "bad" }, content)).toThrow();
    expect(save).toEqual(initialSave());
  });
  it("equipment modifies stats and leveling restores resources", () => {
    let save = addXp(initialSave(), 120);
    save.inventory["scholar-charm"] = 1;
    save.character.equipment = "scholar-charm";
    expect(stats(save, content).attack).toBe(11);
    expect(save.character.hp).toBe(70);
  });
});
describe("Perceptron experiment", () => {
  it("learns from user examples and evaluates held-out data", () => {
    const data = [
      { x: -0.8, y: -0.8, label: 0 as const },
      { x: -0.5, y: 0, label: 0 as const },
      { x: 0.8, y: 0.8, label: 1 as const },
      { x: 0.5, y: 0, label: 1 as const },
    ];
    const net = train(initialNetwork(), data, 20, 0.2);
    expect(accuracy(net, heldOut)).toBeGreaterThanOrEqual(5 / 6);
    expect(net.epochs).toBe(20);
  });
  it("rejects missing classes, bad parameters and data leakage", () => {
    expect(() => train(initialNetwork(), [], 10, 0.2)).toThrow();
    expect(() => addSample([], heldOut[0])).toThrow(/held-out/);
    const one = { x: 0, y: 0, label: 0 as const };
    expect(() => addSample([one], one)).toThrow(/exists/);
  });
});
