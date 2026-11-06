import { it, expect } from "vitest";
import { parseMarkdown } from "../scripts/compile-content";
import { validateContent } from "../src/content/schema";
import raw from "../src/generated/content.json";
it("compiles sample curriculum with all public record types", () => {
  const c = validateContent(raw);
  expect(new Set(c.entities.map((x) => x.type)).size).toBe(8);
});
it("parses Markdown frontmatter and removes executable-looking entity blocks from lesson body", () => {
  const result = parseMarkdown(
    "---\ntype: lesson\nid: example\ntitle: Example\ntopic: ai\nsummary: A lesson\n---\n# Hello\n```question\nid: q\ntitle: A question\nlesson: example\nformat: choice\nprompt: A prompt\noptions: [one, two]\nanswer: [0]\nexplanation: Because one\n```",
  );
  expect(result[0].type).toBe("lesson");
  expect((result[0] as { body: string }).body).toBe("# Hello");
  expect(result[1].id).toBe("q");
});
it("rejects duplicates, missing references, invalid answers and prerequisite cycles", () => {
  const mutate = (fn: (c: typeof raw) => void) => {
    const c = structuredClone(raw);
    fn(c);
    return () => validateContent(c);
  };
  expect(mutate((c) => c.entities.push(c.entities[0]))).toThrow(/Duplicate/);
  expect(
    mutate((c) => {
      const q = c.entities.find((e) => e.type === "question")!;
      q.lesson = "missing";
    }),
  ).toThrow(/missing/);
  expect(
    mutate((c) => {
      const q = c.entities.find((e) => e.type === "question")!;
      q.answer = [99];
    }),
  ).toThrow(/answer/);
  expect(
    mutate((c) => {
      const l = c.entities.find((e) => e.type === "lesson")!;
      l.prerequisites = [l.id];
    }),
  ).toThrow(/cycle/);
});
