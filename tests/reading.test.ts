import { expect, it } from "vitest";
import { bookLayout, clampSpread } from "../src/game/reading";

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
it("supports a single page column and clamps page jumps after repagination", () => {
  const narrow = bookLayout(600, 1880, 40, 1);
  expect(narrow.pages).toBe(3);
  expect(narrow.extent - 600).toBe(2 * narrow.step);
  expect(clampSpread(99, 5, 2)).toBe(2);
  expect(clampSpread(-1, 5, 2)).toBe(0);
  expect(clampSpread(1, 1, 2)).toBe(0);
});
