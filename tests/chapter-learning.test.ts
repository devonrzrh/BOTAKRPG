import { expect, it } from "vitest";
import raw from "../src/generated/content.json";
import manifest from "../content/source-manifest.json";
import { validateContent, type Quest } from "../src/content/schema";
import { initialSave, parseSave, completeActivity } from "../src/game/state";
import {
  chapterForActivity,
  chaptersForBranch,
  introduceChapter,
  practiceChapter,
  needsGuidedPractice,
} from "../src/game/chapterQuest";
import { createQuestGraph } from "../src/game/questGraph";
import { questComplete } from "../src/game/investigation";
const content = validateContent(raw),
  chapters = content.entities.filter(
    (e): e is Quest => e.type === "quest" && e.kind === "chapter",
  );
it("maps every supplied chapter to an ordered learning quest and a distinct applied practice", () => {
  expect(chapters).toHaveLength(31);
  for (const source of manifest.chapters) {
    const chapter = chapters.find((c) => c.lesson === source.id)!;
    expect(chapter, source.id).toBeDefined();
    expect(chapterForActivity(content, `encounter-${source.id}`)?.id).toBe(
      chapter.id,
    );
    expect(chapter.learning!.concept.length).toBeGreaterThan(80);
    expect(chapter.learning!.example.length).toBeGreaterThan(80);
    expect(chapter.learning!.practice.prompt).not.toBe(
      content.entities.find(
        (e) => e.id === `${source.id}-checkpoint` && e.type === "question",
      )?.type === "question"
        ? (
            content.entities.find(
              (e) => e.id === `${source.id}-checkpoint`,
            ) as { prompt: string }
          ).prompt
        : "",
    );
  }
  for (const id of [
    "routing-trace",
    "access-records",
    "signal-identification",
  ]) {
    const list = chaptersForBranch(content, id);
    list.forEach((c, i) =>
      expect(c.prerequisites).toEqual(i ? [list[i - 1].id] : []),
    );
  }
});
it("requires the example before practice, gives safe retries and separates guided evidence from quiz mastery", () => {
  const c = chapters[0],
    save = initialSave();
  expect(() => practiceChapter(save, c, 0)).toThrow(/worked example/);
  let next = introduceChapter(save, c);
  const wrong =
    (c.learning!.practice.answer + 1) % c.learning!.practice.options.length;
  const attempt = practiceChapter(next, c, wrong);
  expect(attempt.correct).toBe(false);
  next = attempt.save;
  expect(needsGuidedPractice(next, c)).toBe(true);
  expect(next.character).toEqual(save.character);
  expect(next.completed).toEqual([]);
  const result = practiceChapter(next, c, c.learning!.practice.answer);
  expect(result.correct).toBe(true);
  next = result.save;
  expect(needsGuidedPractice(next, c)).toBe(false);
  expect(questComplete(next, c)).toBe(false);
  expect(next.mastery[c.lesson!].correct).toBe(0);
  expect(next.mastery[c.lesson!].evidence).toEqual([`guided-practice-${c.id}`]);
  next = practiceChapter(next, c, c.learning!.practice.answer).save;
  expect(next.mastery[c.lesson!].evidence).toHaveLength(1);
  expect(next.chapterProgress[c.id].attempts).toBe(3);
  expect(
    parseSave(JSON.parse(JSON.stringify(next)), content).chapterProgress,
  ).toEqual(next.chapterProgress);
});
it("restores old completions without locking earned progress or fabricating practice", () => {
  const c = chapters[0];
  let save = initialSave();
  expect(needsGuidedPractice(save, c)).toBe(true);
  save = completeActivity(save, c.objectives[0]);
  const old = { ...save } as Record<string, unknown>;
  delete old.chapterProgress;
  const restored = parseSave(old, content);
  expect(needsGuidedPractice(restored, c)).toBe(false);
  expect(restored.chapterProgress).toEqual({});
  expect(questComplete(restored, c)).toBe(true);
});
it("offers a readable subject overview and chapter maps with orientation and final checks", () => {
  const save = initialSave();
  save.story.caseAccepted = true;
  expect(createQuestGraph(save, content).nodes.map((n) => n.title)).toEqual(
    expect.arrayContaining([
      "Algorithms",
      "Data structures",
      "Connectionist AI",
    ]),
  );
  for (const id of [
    "routing-trace",
    "access-records",
    "signal-identification",
  ]) {
    const list = chaptersForBranch(content, id),
      graph = createQuestGraph(save, content, list[0].id);
    expect(graph.branch).toBe(id);
    expect(
      graph.nodes.filter((n) => n.kind === "chapter").map((n) => n.id),
    ).toEqual(list.map((c) => c.id));
    expect(graph.nodes.at(-1)?.kind).toBe("boss");
    expect(graph.nodes[0].title).toBe("Orientation");
    expect(graph.edges).toHaveLength(graph.nodes.length - 1);
  }
});
it("rejects invalid guided content and unknown or inconsistent imported chapter progress", () => {
  const c = chapters[0];
  const bad = {
    ...c,
    learning: {
      ...c.learning!,
      practice: { ...c.learning!.practice, answer: 99 },
    },
  };
  expect(() =>
    validateContent({
      ...content,
      entities: content.entities.map((e) => (e.id === c.id ? bad : e)),
    }),
  ).toThrow(/invalid practice answer/);
  expect(() =>
    parseSave(
      {
        ...initialSave(),
        chapterProgress: {
          missing: { introduced: true, practiced: true, attempts: 1 },
        },
      },
      content,
    ),
  ).toThrow(/unknown chapter/);
  expect(() =>
    parseSave(
      {
        ...initialSave(),
        chapterProgress: {
          [c.id]: { introduced: false, practiced: true, attempts: 0 },
        },
      },
      content,
    ),
  ).toThrow(/Invalid chapter progress/);
});
