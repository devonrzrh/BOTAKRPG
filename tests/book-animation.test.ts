import { expect, it } from "vitest";
import { bookPose } from "../src/game/bookAnimation";

it("pulls the closed book clear before opening, then closes before returning", () => {
  expect(bookPose(0).travel).toBe(0);
  expect(bookPose(0).coverYaw).toBeCloseTo(-Math.PI);
  expect(bookPose(0.4).opening).toBe(0);
  expect(bookPose(0.45).travel).toBe(1);
  expect(bookPose(0.45).opening).toBe(0);
  expect(bookPose(1).travel).toBe(1);
  expect(bookPose(1).coverYaw).toBeCloseTo(0);
});

it("swings the cover toward the reader instead of through the back pages", () => {
  const angle = bookPose(0.7).coverYaw;
  // Outer left edge starts at x < 0. Its rotated z must face the reader (-z).
  expect(1.45 * Math.sin(angle)).toBeLessThan(0);
  for (let i = 0; i < 100; i++) {
    const previous = bookPose(i / 100),
      next = bookPose((i + 1) / 100);
    expect(next.travel).toBeGreaterThanOrEqual(previous.travel);
    expect(next.opening).toBeGreaterThanOrEqual(previous.opening);
    expect(next.coverYaw).toBeGreaterThanOrEqual(previous.coverYaw);
  }
  expect(bookPose(-1)).toEqual(bookPose(0));
  expect(bookPose(2)).toEqual(bookPose(1));
});
