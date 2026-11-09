import { expect, it } from "vitest";
import {
  BOOK_SHELF_SCALE,
  bookPose,
  bookReadingScale,
} from "../src/game/bookAnimation";

it("pulls the closed book clear before opening, then closes before returning", () => {
  expect(bookPose(0).travel).toBe(0);
  expect(bookPose(0).coverYaw).toBeCloseTo(-Math.PI);
  expect(bookPose(0.4).opening).toBe(0);
  expect(bookPose(0.42).opening).toBe(0);
  expect(bookPose(0.55).travel).toBe(1);
  expect(bookPose(0.55).opening).toBeGreaterThan(0);
  expect(bookPose(1).travel).toBe(1);
  expect(bookPose(1).coverYaw).toBeCloseTo(0);
  expect(bookPose(0.8).lift).toBeGreaterThan(0);
});

it("fits the full reading spread after resizing without cropping either page", () => {
  for (const aspect of [1280 / 664, 1920 / 1024, 2560 / 1024, 1024 / 712]) {
    const height = 2 * 2.76 * Math.tan(1.03 / 2);
    const scale = bookReadingScale(aspect, 1.03);
    const widthFill = (5.96 * scale) / (height * aspect);
    const heightFill = (3.34 * scale) / height;
    expect(widthFill).toBeLessThanOrEqual(0.99001);
    expect(heightFill).toBeLessThanOrEqual(0.99001);
    expect(Math.max(widthFill, heightFill)).toBeCloseTo(0.99);
    expect(bookPose(1, scale).scale).toBeCloseTo(scale);
    expect(bookPose(0, scale).scale).toBe(BOOK_SHELF_SCALE);
  }
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
