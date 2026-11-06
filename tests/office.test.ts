import { expect, it } from "vitest";
import { shortestTurn, wallYaw } from "../src/world/Office";
it("turns between walls along the shortest arc, including the wrap back to the first wall", () => {
  expect(shortestTurn(wallYaw.desk, wallYaw.investigation)).toBeCloseTo(
    Math.PI / 2,
  );
  expect(shortestTurn(wallYaw.investigation, wallYaw.desk)).toBeCloseTo(
    -Math.PI / 2,
  );
  for (const from of Object.values(wallYaw))
    for (const to of Object.values(wallYaw))
      expect(Math.abs(shortestTurn(from, to))).toBeLessThanOrEqual(Math.PI);
});
