import { expect, it } from "vitest";
import { readFile, stat } from "node:fs/promises";
import { createHash } from "node:crypto";
import {
  validateContent,
  type Quest,
  type Question,
  type Skill,
} from "../src/content/schema";
import raw from "../src/generated/content.json";
import manifest from "../content/source-manifest.json";
import { initialSave, completeActivity, parseSave } from "../src/game/state";
import {
  nextObjective,
  finaleAvailable,
  activityUnlocked,
} from "../src/game/investigation";
import { createBattle, selectSkill, isCorrect } from "../src/game/combat";
const content = validateContent(raw);
const questions = content.entities.filter(
  (e): e is Question => e.type === "question",
);
it("preserves every supplied file byte-for-byte in the distributable archive", async () => {
  expect(manifest.chapters).toHaveLength(31);
  expect(manifest.files).toHaveLength(405);
  await Promise.all(
    manifest.files.map(async (file) => {
      const bytes = await readFile(`public/materials/${file.path}`);
      expect(createHash("sha256").update(bytes).digest("hex"), file.path).toBe(
        file.sha256,
      );
    }),
  );
});
it("includes every chapter, practice/code section, and resolvable local illustration or lesson link", async () => {
  for (const chapter of manifest.chapters) {
    const lesson = content.entities.find(
      (e) => e.type === "lesson" && e.id === chapter.id,
    );
    expect(lesson?.type).toBe("lesson");
    if (lesson?.type !== "lesson") continue;
    const original = await readFile(`public/materials/${chapter.file}`, "utf8");
    expect((lesson.body.match(/```/g) ?? []).length, chapter.id).toBe(
      (original.match(/```/g) ?? []).length,
    );
    for (const link of lesson.body.matchAll(/\]\(([^)]+)\)/g)) {
      if (link[1].startsWith("/materials/"))
        expect(
          (await stat(`public${decodeURI(link[1].split("#")[0])}`)).isFile(),
          link[1],
        ).toBe(true);
      if (link[1].startsWith("#lesson="))
        expect(
          content.entities.some((e) => e.id === link[1].slice(8)),
          link[1],
        ).toBe(true);
    }
    expect(
      questions.some((q) => q.lesson === chapter.id),
      chapter.id,
    ).toBe(true);
  }
});
it("provides non-animated editions of all animated illustrations for reduced motion", async () => {
  for (const file of manifest.files.filter(
    (f) => f.path.includes("/Animated/") && f.path.endsWith(".svg"),
  )) {
    const svg = await readFile(`public/materials-still/${file.path}`, "utf8");
    expect(svg, file.path).toContain("animation: none !important");
    expect(svg, file.path).not.toMatch(
      /<(?:animate|animateTransform|animateMotion|set)\b/,
    );
  }
});
it("imports all 82 objective questions and all 13 written exercises with their explained answers", () => {
  expect(questions.filter((q) => q.id.startsWith("bank-a"))).toHaveLength(40);
  expect(questions.filter((q) => q.id.startsWith("bank-b"))).toHaveLength(42);
  const book = content.entities.find((e) => e.id === "source-test-bank");
  expect(
    book?.type === "lesson" && [...book.body.matchAll(/^## C\d+$/gm)].length,
  ).toBe(13);
  expect(
    questions.every((q) => q.prompt.length > 10 && q.explanation.length > 20),
  ).toBe(true);
  expect(questions.find((q) => q.id === "bank-b37")?.options).toEqual([
    "9",
    "7",
    "6.5",
    "12",
  ]);
  expect(questions.find((q) => q.id === "bank-b39")?.prompt).toContain(
    "A = [3, 4, 0]",
  );
  expect(questions.find((q) => q.id === "bank-b39")?.options).toEqual([
    "0.96",
    "1",
    "0.5",
    "0",
  ]);
  expect(questions.find((q) => q.id === "bank-b13")?.prompt).toContain(
    "root A",
  );
  expect(questions.find((q) => q.id === "bank-b12")?.options.slice(2)).toEqual([
    "A, C, F, B, E, D",
    "D, E, B, F, C, A",
  ]);
  for (const q of questions)
    expect(q.prompt).not.toMatch(/KEY ›|SHOW|MISSION PROGRESS/);
});
it("scores select-all questions as exact sets, independent of selection order", () => {
  const q = questions.find((q) => q.id === "bank-b21")!;
  expect(q.format).toBe("multiple");
  expect(isCorrect(q, [3, 0, 1])).toBe(true);
  for (const wrong of [
    [0, 1],
    [0, 1, 2, 3],
    [0, 0, 1],
  ])
    expect(isCorrect(q, wrong)).toBe(false);
});
it("connects all 31 chapter encounters and three bosses to parallel clue branches", () => {
  let save = initialSave();
  save.story.caseAccepted = true;
  const branches = content.entities.filter(
    (e): e is Quest => e.type === "quest" && e.kind === "branch",
  );
  const skill = content.entities.find(
    (e): e is Skill => e.type === "skill" && e.id === "insight",
  )!;
  for (const chapter of manifest.chapters)
    expect(
      branches.some((b) => b.objectives.includes(`encounter-${chapter.id}`)),
    ).toBe(true);
  for (const branch of branches) {
    for (const id of branch.objectives) {
      expect(nextObjective(save, branch)).toBe(id);
      expect(activityUnlocked(save, id, content)).toBe(true);
      for (const later of branch.objectives.slice(
        branch.objectives.indexOf(id) + 1,
      ))
        expect(activityUnlocked(save, later, content)).toBe(false);
      expect(activityUnlocked(save, "echo-battle", content)).toBe(false);
      expect(finaleAvailable(save, content)).toBe(false);
      const activity = content.entities.find((e) => e.id === id);
      if (activity?.type === "activity" && activity.enemy?.lessons) {
        const battle = selectSkill(
          createBattle(activity.enemy),
          save,
          skill,
          questions,
        );
        expect(activity.enemy.lessons).toContain(
          questions.find((q) => q.id === battle.question)!.lesson,
        );
      }
      save = completeActivity(save, id);
    }
    expect(branch.objectives.at(-1)).toMatch(/warden|keeper|mimic/);
  }
  expect(finaleAvailable(save, content)).toBe(true);
});
it("restores previous completed cases without fabricating new chapter completion", () => {
  const save = initialSave();
  const legacy: Record<string, unknown> = {
    ...save,
    completed: [
      "maze-chamber",
      "guardian-battle",
      "perceptron-exhibit",
      "echo-battle",
    ],
  };
  delete legacy.curriculumVersion;
  expect(parseSave(legacy, content).completed).toHaveLength(4);
  expect(() => parseSave({ ...legacy, curriculumVersion: 2 }, content)).toThrow(
    /all clue branches/,
  );
  expect(() =>
    parseSave({ ...save, notes: { missing: "invalid" } }, content),
  ).toThrow(/unknown lesson/);
});
