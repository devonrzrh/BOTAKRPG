import { expect, it } from "vitest";
import { turnBlur } from "../src/game/turnBlur";
const blur = (yaw: number, dt = 1 / 60, enabled = true) =>
  turnBlur(yaw, 0, dt, 1280, 720, 1.03, enabled);
it("tracks camera speed and direction without depending on frame rate", () => {
  const right = blur(0.02),
    left = blur(-0.02);
  expect(right.x).toBeLessThan(0);
  expect(left.x).toBeGreaterThan(0);
  expect(right.pixels).toBeCloseTo(left.pixels);
  expect(blur(0.01, 1 / 120).pixels).toBeCloseTo(right.pixels);
  expect(blur(0.03).pixels).toBeGreaterThan(right.pixels);
});
it("clears exactly for stationary, settled, reduced-motion, and tiny cursor movements", () => {
  for (const result of [blur(0), blur(0.0001), blur(0.4, 1 / 60, false)])
    expect(result).toEqual({ x: 0, y: 0, pixels: 0 });
});
it("limits fast-turn streaks and skips delayed or invalid frames", () => {
  expect(blur(Math.PI / 2).pixels).toBeLessThanOrEqual(40);
  expect(blur(0.5, 0.4).pixels).toBe(0);
  expect(blur(0.5, 0).pixels).toBe(0);
  expect(blur(NaN).pixels).toBe(0);
});
