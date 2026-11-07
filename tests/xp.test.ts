import { it, expect } from "vitest";
import { xpProgress } from "../src/game/xp";
it("shows XP progress at level boundaries and the level cap", () => {
  expect(xpProgress(0)).toEqual({
    level: 1,
    current: 0,
    needed: 100,
    maxed: false,
  });
  expect(xpProgress(99)).toEqual({
    level: 1,
    current: 99,
    needed: 1,
    maxed: false,
  });
  expect(xpProgress(100)).toEqual({
    level: 2,
    current: 0,
    needed: 100,
    maxed: false,
  });
  expect(xpProgress(120)).toEqual({
    level: 2,
    current: 20,
    needed: 80,
    maxed: false,
  });
  expect(xpProgress(9900)).toEqual({
    level: 100,
    current: 100,
    needed: 0,
    maxed: true,
  });
});
