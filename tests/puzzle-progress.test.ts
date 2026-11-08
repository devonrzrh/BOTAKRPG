import { expect, it } from "vitest";
import raw from "../src/generated/content.json";
import { validateContent, type Activity } from "../src/content/schema";
import { initialSave, parseSave } from "../src/game/state";
import { rewardPuzzle } from "../src/game/puzzleProgress";
import {
  createPuzzle,
  puzzleCommand,
  type PuzzleCommand,
} from "../src/game/puzzles";
const content = validateContent(raw);
const activity = content.entities.find(
  (e): e is Activity => e.type === "activity" && e.id === "puzzle-stack-buffer",
)!;

it("awards first puzzle completion once and separates hints from mastery", () => {
  const start = initialSave();
  const assisted = rewardPuzzle(start, activity, content, true);
  expect(assisted.character.xp).toBe(start.character.xp + 25);
  expect(assisted.completed).toContain(activity.id);
  expect(assisted.mastery[activity.lesson]).toBeUndefined();
  const replay = rewardPuzzle(assisted, activity, content, false);
  expect(replay.character.xp).toBe(assisted.character.xp);
  expect(replay.mastery[activity.lesson].evidence).toEqual([
    `puzzle-${activity.id}`,
  ]);
  expect(rewardPuzzle(replay, activity, content, false)).toEqual(replay);
  expect(parseSave(JSON.parse(JSON.stringify(replay)), content)).toEqual(
    replay,
  );
});

it("restores in-progress commands and rejects incompatible imports", () => {
  const save = initialSave();
  save.puzzleRuns[activity.id] = {
    commands: [{ type: "push" }, { type: "push" }],
    assisted: true,
  };
  const restored = parseSave(JSON.parse(JSON.stringify(save)), content);
  const run = restored.puzzleRuns[activity.id];
  const state = run.commands.reduce(
    (s, c) => puzzleCommand(s, c),
    createPuzzle(activity.puzzle!),
  );
  expect(state.buffer).toEqual([1, 2]);
  expect(run.assisted).toBe(true);
  expect(() =>
    parseSave({ ...save, puzzleRuns: { missing: run } }, content),
  ).toThrow(/unknown puzzle/);
  expect(() =>
    parseSave(
      {
        ...save,
        puzzleRuns: {
          [activity.id]: {
            commands: [{ type: "swap", index: 0 }],
            assisted: false,
          },
        },
      },
      content,
    ),
  ).toThrow(/Invalid puzzle command/);
  expect(save.puzzleRuns[activity.id]).toEqual(run);
  const { puzzleRuns: _ignored, ...legacy } = save;
  expect(parseSave(legacy, content).puzzleRuns).toEqual({});
});

it("ships four solvable Markdown puzzles with library and reward links", () => {
  const solutions: Record<string, PuzzleCommand[]> = {
    "puzzle-stack-buffer": [
      "push",
      "push",
      "pop",
      "pop",
      "push",
      "push",
      "pop",
      "pop",
    ].map((type) => ({ type }) as PuzzleCommand),
    "puzzle-queue-relay": [
      "rotate",
      "rotate",
      "dispatch",
      "dispatch",
      "dispatch",
      "dispatch",
    ].map((type) => ({ type }) as PuzzleCommand),
    "puzzle-sort-log": [0, 2, 3, 1, 2, 1, 0].map((index) => ({
      type: "swap",
      index,
    })),
    "puzzle-route-packet": [3, 4, 5, 6].map((node) => ({ type: "move", node })),
  };
  for (const [id, commands] of Object.entries(solutions)) {
    const puzzle = content.entities.find(
      (e): e is Activity => e.type === "activity" && e.id === id,
    )!;
    expect(puzzle.puzzle).toBeDefined();
    expect(
      commands.reduce(
        (s, c) => puzzleCommand(s, c),
        createPuzzle(puzzle.puzzle!),
      ).solved,
    ).toBe(true);
    expect(
      content.entities.some(
        (e) => e.id === puzzle.lesson && e.type === "lesson",
      ),
    ).toBe(true);
    expect(
      content.entities.some(
        (e) => e.type === "quest" && e.objectives.includes(id) && e.xp === 25,
      ),
    ).toBe(true);
  }
});
