import { it, expect } from "vitest";
import { readFile } from "node:fs/promises";
import { parseMarkdown } from "../scripts/compile-content";
import { validateContent } from "../src/content/schema";
import raw from "../src/generated/content.json";
it("preserves nested Markdown code fences inside a structured worked example", async () => {
  const records = parseMarkdown(
    await readFile("content/11-algorithm-chapters.md", "utf8"),
  );
  const first = records[0];
  expect(first.type === "quest" && first.learning?.example).toContain(
    "```python",
  );
  expect(first.type === "quest" && first.learning?.practice.prompt).toContain(
    "total",
  );
});
it("rejects missing dialogue targets and ambiguous choices", () => {
  const dialogue = {
    type: "dialogue",
    id: "test-dialogue",
    title: "Test",
    start: "start",
    nodes: [
      {
        id: "start",
        speaker: "Dispatch",
        text: "Ready?",
        choices: [{ label: "Continue", next: "missing" }],
      },
    ],
  };
  expect(() => validateContent({ version: 1, entities: [dialogue] })).toThrow(
    /missing dialogue node/,
  );
  dialogue.nodes[0].choices[0].next = "start";
  expect(() =>
    validateContent({
      version: 1,
      entities: [{ ...dialogue, start: "missing" }],
    }),
  ).toThrow(/missing dialogue start/);
  expect(() =>
    validateContent({
      version: 1,
      entities: [
        {
          ...dialogue,
          nodes: [
            {
              ...dialogue.nodes[0],
              choices: [
                { label: "Take case", next: "start", action: "accept-case" },
              ],
            },
          ],
        },
      ],
    }),
  ).toThrow(/exactly one/);
});
it("supports reusable cutscenes with different frame counts and pursuit steps", () => {
  const c = validateContent(raw);
  const intro = c.entities.find(
    (e) => e.type === "story" && e.id === "rogue-signal",
  );
  const connection = c.entities.find(
    (e) => e.type === "story" && e.id === "first-connection",
  );
  expect(intro?.type === "story" && intro.frames[1].steps).toBe(6);
  expect(connection?.type === "story" && connection.frames.length).toBe(2);
});
it("compiles sample curriculum with all public record types", () => {
  const c = validateContent(raw);
  expect(new Set(c.entities.map((x) => x.type)).size).toBe(9);
});
it("validates quest prerequisites and rejects dependency cycles", () => {
  const missing = structuredClone(raw);
  missing.entities.find((e) => e.type === "quest")!.prerequisites = [
    "missing-quest",
  ];
  expect(() => validateContent(missing)).toThrow(/missing quest reference/);
  const cycle = structuredClone(raw);
  const q = cycle.entities.find((e) => e.type === "quest")!;
  q.prerequisites = [q.id];
  expect(() => validateContent(cycle)).toThrow(/cycle/);
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
