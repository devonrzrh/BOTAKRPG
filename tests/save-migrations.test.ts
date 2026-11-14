import { describe, expect, it } from "vitest";
import raw from "../src/generated/content.json";
import legacy from "./fixtures/journal-v1.json";
import legacyV2 from "./fixtures/journal-v2.json";
import legacyV3 from "./fixtures/journal-v3.json";
import { validateContent, type Quest } from "../src/content/schema";
import { claimQuest, initialSave, parseSave } from "../src/game/state";
import {
  activityUnlocked,
  finaleAvailable,
  nextObjective,
  questComplete,
} from "../src/game/investigation";
import { rewardPuzzle } from "../src/game/puzzleProgress";
import { solvePuzzle } from "./helpers/solvePuzzle";
import { createQuestGraph } from "../src/game/questGraph";
import { visibleGraphButtons } from "../src/game/questGraph";
import { createOfficeUi } from "../src/game/officeUi";
import { loadSave, storeSave } from "../src/storage";
import "fake-indexeddb/auto";

const content = validateContent(raw);
const route = content.entities.find(
  (e): e is Quest => e.type === "quest" && e.id === "routing-trace",
)!;

describe("journal migration", () => {
  it("upgrades v1 in place without mutating input, losing data, or paying inherited gates", () => {
    const input = structuredClone(legacy);
    const original = structuredClone(input);
    const save = parseSave(input, content);
    expect(input).toEqual(original);
    expect(save.version).toBe(4);
    expect(save.character).toEqual(input.character);
    expect(save.code).toBe(input.code);
    expect(save.notes).toEqual(input.notes);
    expect(save.blocks).toEqual(input.blocks);
    expect(save.bookmarks).toEqual(input.bookmarks);
    expect(save.trialBest).toBe(input.trialBest);
    expect(save.story.seenDialogues).toEqual(input.story.seenDialogues);
    expect(save.settings).toMatchObject(input.settings);
    expect(save.completed).toEqual(
      expect.arrayContaining([
        "puzzle-sort-log",
        "puzzle-search-archive",
        "puzzle-hanoi-lock",
      ]),
    );
    expect(save.completed).not.toContain("puzzle-route-packet");
    expect(nextObjective(save, route)).toBe("puzzle-route-packet");
    expect(save.claimed).toEqual(
      expect.arrayContaining([
        "case-sort-log",
        "case-search-archive",
        "case-hanoi-lock",
      ]),
    );
    const puzzle = content.entities.find((e) => e.id === "puzzle-sort-log")!;
    if (puzzle.type !== "activity") throw new Error("missing puzzle");
    expect(rewardPuzzle(save, puzzle, content, true).character.xp).toBe(
      save.character.xp,
    );
    expect(parseSave(JSON.parse(JSON.stringify(save)), content)).toEqual(save);
  });

  it("uses the same migration for stored journals and JSON import", async () => {
    const input = structuredClone(legacy);
    // Simulate a previously persisted v1 record in the existing object store.
    await storeSave(input as unknown as ReturnType<typeof initialSave>);
    const local = parseSave(await loadSave(), content);
    const imported = parseSave(JSON.parse(JSON.stringify(input)), content);
    expect(local).toEqual(imported);
    await storeSave(local);
    expect(parseSave(await loadSave(), content)).toEqual(local);
  });

  it("keeps an old finished campaign finished without duplicate XP", () => {
    const save = initialSave();
    save.story.caseAccepted = true;
    const branches = content.entities.filter(
      (e): e is Quest => e.type === "quest" && e.kind === "branch",
    );
    const old = {
      ...save,
      version: 1,
      completed: [
        ...branches.flatMap((b) =>
          b.objectives.filter((id) => !id.startsWith("puzzle-")),
        ),
        "echo-battle",
      ],
      claimed: [...branches.map((b) => b.id), "confront-echo"],
    };
    const migrated = parseSave(old, content);
    expect(branches.every((b) => questComplete(migrated, b))).toBe(true);
    expect(finaleAvailable(migrated, content)).toBe(true);
    expect(migrated.completed).toContain("echo-battle");
    expect(migrated.character.xp).toBe(save.character.xp);
    expect(migrated.claimed).toEqual(expect.arrayContaining(old.claimed));
  });

  it("leaves new gates required if an old save has not passed them", () => {
    const save = initialSave();
    save.story.caseAccepted = true;
    const prefix = route.objectives.slice(
      0,
      route.objectives.indexOf("puzzle-sort-log"),
    );
    const migrated = parseSave(
      { ...save, version: 1, completed: prefix },
      content,
    );
    expect(nextObjective(migrated, route)).toBe("puzzle-sort-log");
    expect(migrated.claimed).toEqual([]);
    expect(activityUnlocked(migrated, "puzzle-sort-log", content)).toBe(true);
    expect(activityUnlocked(migrated, "encounter-source-alg-03", content)).toBe(
      false,
    );
  });

  it("does not grandfather v2 progress or accept future/malformed journals", () => {
    const save = initialSave();
    save.completed = ["encounter-source-alg-03"];
    expect(parseSave({ ...save, version: 2 }, content).completed).toEqual(
      save.completed,
    );
    for (const version of [0, 5, 1.5, "1"])
      expect(() => parseSave({ ...save, version }, content)).toThrow();
    expect(() =>
      parseSave({ ...save, version: 1, completed: ["unknown"] }, content),
    ).toThrow(/unknown activity/);
  });

  it("merges retired Throttle into Firewall without losing any other v2 journal data", () => {
    const input = structuredClone(legacyV2);
    const original = structuredClone(input);
    const save = parseSave(input, content);
    expect(input).toEqual(original);
    expect(save).toEqual({
      ...input,
      version: 4,
      supply: initialSave().supply,
      character: { ...input.character, skills: ["insight", "ward", "trace"] },
    });
    expect(parseSave(JSON.parse(JSON.stringify(save)), content)).toEqual(save);
  });

  it("uses the v2 skill migration for local load and JSON import", async () => {
    const input = structuredClone(legacyV2);
    await storeSave(input as unknown as ReturnType<typeof initialSave>);
    const local = parseSave(await loadSave(), content);
    expect(local).toEqual(
      parseSave(JSON.parse(JSON.stringify(input)), content),
    );
    await storeSave(local);
    expect(parseSave(await loadSave(), content)).toEqual(local);
  });

  it("keeps claimed v2 rewards claimed and rejects unknown data instead of dropping it", () => {
    const input = structuredClone(legacyV2);
    const migrated = parseSave(input, content);
    const quest = content.entities.find(
      (entity): entity is Quest =>
        entity.type === "quest" && entity.id === "case-sort-log",
    )!;
    expect(claimQuest(migrated, quest, content)).toEqual(migrated);
    const puzzle = content.entities.find(
      (entity) => entity.id === "puzzle-sort-log",
    )!;
    if (puzzle.type !== "activity") throw new Error("missing puzzle");
    expect(rewardPuzzle(migrated, puzzle, content, false).character.xp).toBe(
      input.character.xp,
    );
    expect(rewardPuzzle(migrated, puzzle, content, true).character.xp).toBe(
      input.character.xp,
    );
    const unknownSkill = {
      ...input,
      character: { ...input.character, skills: ["simplify", "unknown-skill"] },
    };
    const original = structuredClone(unknownSkill);
    expect(() => parseSave(unknownSkill, content)).toThrow(/unknown skill/);
    expect(unknownSkill).toEqual(original);
    expect(() =>
      parseSave({ ...input, unknownSlot: { preserved: true } }, content),
    ).toThrow();
  });

  it("chains v1 campaign and skill upgrades and grants Firewall to Throttle-only owners", () => {
    const input = {
      ...structuredClone(legacy),
      character: {
        ...legacy.character,
        skills: ["insight", "simplify", "trace", "simplify"],
      },
    };
    const save = parseSave(input, content);
    expect(save.version).toBe(4);
    expect(save.character.skills).toEqual(["insight", "ward", "trace"]);
    expect(save.completed).toContain("puzzle-sort-log");
    expect(save.claimed).toContain("case-sort-log");
    expect(save.character.xp).toBe(input.character.xp);
    expect(parseSave(save, content)).toEqual(save);
  });

  it("does not treat optional puzzle completion as having passed a campaign gate", () => {
    const save = initialSave();
    save.story.caseAccepted = true;
    const upgraded = parseSave(
      { ...save, version: 1, completed: ["puzzle-hanoi-lock"] },
      content,
    );
    expect(upgraded.completed).toEqual(["puzzle-hanoi-lock"]);
    expect(upgraded.claimed).toEqual([]);
    expect(nextObjective(upgraded, route)).toBe("maze-chamber");
  });

  it("adds starter tokens once to v3 journals loaded locally or imported", async () => {
    const input = structuredClone(legacyV3);
    await storeSave(input as unknown as ReturnType<typeof initialSave>);
    const local = parseSave(await loadSave(), content);
    expect(local).toEqual({
      ...input,
      version: 4,
      supply: initialSave().supply,
    });
    expect(parseSave(JSON.parse(JSON.stringify(input)), content)).toEqual(local);
    local.supply.tokens -= 1;
    expect(parseSave(local, content)).toEqual(local);
    expect(input).toEqual(legacyV3);
  });
});

it("requires evidence before the next battle and exposes it as a graph node", () => {
  let save = initialSave();
  save.story.caseAccepted = true;
  save.completed = route.objectives.slice(
    0,
    route.objectives.indexOf("puzzle-sort-log"),
  );
  expect(nextObjective(save, route)).toBe("puzzle-sort-log");
  expect(activityUnlocked(save, "encounter-source-alg-03", content)).toBe(
    false,
  );
  const graph = createQuestGraph(save, content, "puzzle-sort-log");
  expect(graph.branch).toBe(route.id);
  expect(graph.nodes.find((n) => n.id === "puzzle-sort-log")?.status).toBe(
    "available",
  );
  const surface = createOfficeUi({
    save,
    content,
    questSelection: "puzzle-sort-log",
    lessonId: "graph-search",
    page: 0,
    search: "",
    topic: "all",
    noteEditing: null,
    noteDraft: "",
    bookOpen: false,
  }).find((s) => s.id === "quests")!;
  expect(
    visibleGraphButtons(surface).find(
      (b) => b.id === "evidence-puzzle-sort-log",
    ),
  ).toMatchObject({
    disabled: false,
    action: { kind: "open", id: "puzzle-sort-log" },
  });
  const puzzle = content.entities.find((e) => e.id === "puzzle-sort-log")!;
  if (puzzle.type !== "activity") throw new Error("missing puzzle");
  const commands = solvePuzzle(puzzle);
  save = rewardPuzzle(
    { ...save, puzzleRuns: { [puzzle.id]: { commands, assisted: false } } },
    puzzle,
    content,
    false,
  );
  expect(nextObjective(save, route)).toBe("encounter-source-alg-03");
  expect(activityUnlocked(save, "encounter-source-alg-03", content)).toBe(true);
  expect(rewardPuzzle(save, puzzle, content, false)).toEqual(save);
});
