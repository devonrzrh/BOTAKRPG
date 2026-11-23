import { expect, it } from "vitest";
import { crateLidAngle } from "../src/game/supplyCratePresentation";

it("keeps the lid open on reveal and closes it before the next opening", () => {
  const open = crateLidAngle(1, false);
  expect(crateLidAngle(0, false)).toBe(0);
  expect(crateLidAngle(0, true)).toBe(open);
  expect(crateLidAngle(0.24, true)).toBe(0);
  expect(crateLidAngle(0.75, true)).toBeGreaterThan(crateLidAngle(0.5, true));
  expect(crateLidAngle(2, true)).toBe(open);
});
