import { expect, it } from "vitest";
import { validateContent } from "../src/content/schema";
import raw from "../src/generated/content.json";
import { initialSave, parseSave } from "../src/game/state";

const content = validateContent(raw);

it("defaults reading preferences when loading a legacy save", () => {
  const { reading: _reading, ...legacy } = initialSave();
  expect(parseSave(legacy, content).reading).toEqual({
    mode: "book",
    fontSize: 22,
    positions: {},
  });
});

it("round trips reading preferences and per lesson positions", () => {
  const save = initialSave();
  save.reading = {
    mode: "fullscreen",
    fontSize: 24,
    positions: { "graph-search": { block: 7, offset: 0.625 } },
    lastChapterByTopic: { algorithms: "graph-search" },
    finishedLessons: ["graph-search"],
  };
  expect(parseSave(JSON.parse(JSON.stringify(save)), content)).toEqual(save);
});

it("validates completed reading against the library", () => {
  const save = initialSave();
  save.reading.finishedLessons = ["missing"];
  expect(() => parseSave(save, content)).toThrow(/unknown lesson/i);
});

it("rejects a saved volume chapter from a different subject", () => {
  const save = initialSave();
  save.reading.lastChapterByTopic = { ai: "graph-search" };
  expect(() => parseSave(save, content)).toThrow(/invalid reading chapter/i);
});

it("rejects invalid reading preferences, positions, and lesson ids", () => {
  const save = initialSave();
  expect(() =>
    parseSave({ ...save, reading: { ...save.reading, fontSize: 21 } }, content),
  ).toThrow();
  expect(() =>
    parseSave(
      {
        ...save,
        reading: {
          ...save.reading,
          positions: { "graph-search": { block: -1, offset: 0 } },
        },
      },
      content,
    ),
  ).toThrow();
  expect(() =>
    parseSave(
      {
        ...save,
        reading: {
          ...save.reading,
          positions: { "graph-search": { block: 1, offset: 1.1 } },
        },
      },
      content,
    ),
  ).toThrow();
  expect(() =>
    parseSave(
      {
        ...save,
        reading: {
          ...save.reading,
          positions: { missing: { block: 0, offset: 0 } },
        },
      },
      content,
    ),
  ).toThrow(/unknown lesson/i);
});

it("preserves unrelated progress when reading state is updated", () => {
  const save = initialSave();
  save.completed = ["maze-chamber"];
  save.bookmarks = ["graph-search"];
  save.reading = {
    ...save.reading,
    positions: { "graph-search": { block: 3, offset: 0.4 } },
  };
  const parsed = parseSave(save, content);
  expect(parsed.completed).toEqual(save.completed);
  expect(parsed.bookmarks).toEqual(save.bookmarks);
  expect(parsed.reading).toEqual(save.reading);
});
