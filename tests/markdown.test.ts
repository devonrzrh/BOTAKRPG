import { expect, it } from "vitest";
import { renderLessonMarkdown } from "../src/game/markdown";

it("assigns stable, unique heading IDs without treating fenced code as headings", () => {
  const html = renderLessonMarkdown(
    "# One **idea**\n\n## Practice\n\n## Practice\n\n```text\n# Not a heading\n```",
  );
  expect(html).toContain('id="one-idea"');
  expect(html).toContain('id="practice-1"');
  expect(html).not.toContain('id="not-a-heading"');
});
it("repairs unique old fragments but preserves ambiguous and cross-lesson links", () => {
  const html = renderLessonMarkdown(
    "[Old](#implementation) [Course](#15--course-wrap-up) [Other](#lesson=source-ai-01) [Ambiguous](#examples)\n\n## 3. Implementation\n\n## 15 — Course Wrap-up\n\n## 1. Examples\n\n## 2. Examples",
  );
  expect(html).toContain('href="#3-implementation"');
  expect(html).toContain('href="#15-course-wrap-up"');
  expect(html).toContain('href="#lesson=source-ai-01"');
  expect(html).toContain('href="#examples"');
});
