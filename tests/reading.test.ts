import { expect, it } from "vitest";
import { bookLayout, clampSpread, nextBookChapter } from "../src/game/reading";

it("counts CSS columns and reserves a blank facing page for an odd last spread", () => {
  const layout = bookLayout(1000, 2596, 64, 2);
  expect(layout).toEqual({ pages: 5, columns: 2, step: 1064, extent: 3128 });
  expect(layout.extent - 1000).toBe(2 * layout.step);
  expect(bookLayout(1000, 2064, 64, 2)).toEqual({
    pages: 4,
    columns: 2,
    step: 1064,
    extent: 2064,
  });
});

it("continues in subject order without wrapping or crossing to another book", () => {
  const lessons = [
    { id: "a1", topic: "algorithms" },
    { id: "s1", topic: "structures" },
    { id: "a2", topic: "algorithms" },
    { id: "s2", topic: "structures" },
  ];
  expect(nextBookChapter(lessons, lessons[0])).toBe(lessons[2]);
  expect(nextBookChapter(lessons, lessons[1])).toBe(lessons[3]);
  expect(nextBookChapter(lessons, lessons[2])).toBeUndefined();
  expect(
    nextBookChapter(lessons, { id: "missing", topic: "algorithms" }),
  ).toBeUndefined();
});
it("supports a single page column and clamps page jumps after repagination", () => {
  const narrow = bookLayout(600, 1880, 40, 1);
  expect(narrow.pages).toBe(3);
  expect(narrow.extent - 600).toBe(2 * narrow.step);
  expect(clampSpread(99, 5, 2)).toBe(2);
  expect(clampSpread(-1, 5, 2)).toBe(0);
  expect(clampSpread(1, 1, 2)).toBe(0);
});
