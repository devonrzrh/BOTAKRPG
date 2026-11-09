import { describe, expect, it } from "vitest";
import {
  createPadRepeater,
  gamepadActions,
  type PadAction,
  type PadSnapshot,
} from "../src/game/gamepad";
import { directionalIndex } from "../src/game/focusNavigation";

const pad = (
  pressed: number[] = [],
  axes: number[] = [0, 0, 0, 0],
): PadSnapshot => ({
  mapping: "standard",
  connected: true,
  buttons: Array.from({ length: 17 }, (_, index) => ({
    pressed: pressed.includes(index),
    touched: false,
    value: pressed.includes(index) ? 1 : 0,
  })),
  axes,
});
const held = (...actions: PadAction[]) => new Set(actions);

describe("standard controller input", () => {
  it("maps confirm/back, menu, world focus and shoulders without guessing unknown layouts", () => {
    expect([...gamepadActions(pad([0, 1, 2, 4, 5, 9]))]).toEqual([
      "confirm",
      "back",
      "world",
      "previous",
      "next",
      "menu",
    ]);
    expect(gamepadActions({ ...pad([0]), mapping: "" }).size).toBe(0);
    expect(gamepadActions({ ...pad([0]), connected: false }).size).toBe(0);
  });
  it("keeps stick drift silent, chooses the dominant axis and gives D-pad priority", () => {
    expect(gamepadActions(pad([], [0.3, -0.5, 0, NaN])).size).toBe(0);
    expect([...gamepadActions(pad([], [0.9, -0.6]))]).toEqual(["right"]);
    expect([...gamepadActions(pad([12], [0.9, 0]))]).toEqual(["up"]);
    expect([...gamepadActions(pad([], [-0.8, 0, 0, 0.9]))]).toEqual([
      "left",
      "scrollDown",
    ]);
  });
  it("requires neutral after connection/resume, never confirms repeatedly, and resets on disconnect", () => {
    const input = createPadRepeater();
    expect(input.sample(held("confirm"), 0).fired).toEqual([]);
    expect(input.sample(held("confirm"), 1000).held.size).toBe(0);
    input.sample(held(), 1001);
    expect(input.sample(held("confirm"), 1002).fired).toEqual(["confirm"]);
    expect(input.sample(held("confirm"), 3000).fired).toEqual([]);
    input.reset();
    expect(input.sample(held("confirm"), 4000).fired).toEqual([]);
  });
  it("repeats focus movement at a bounded cadence without a catch-up burst", () => {
    const input = createPadRepeater();
    input.sample(held(), 0);
    expect(input.sample(held("down"), 10).fired).toEqual(["down"]);
    expect(input.sample(held("down"), 349).fired).toEqual([]);
    expect(input.sample(held("down"), 350).fired).toEqual(["down"]);
    expect(input.sample(held("down"), 9000).fired).toEqual(["down"]);
    expect(input.sample(held("down"), 9000).fired).toEqual([]);
    input.sample(held(), 9001);
    expect(input.sample(held("up"), 9002).fired).toEqual(["up"]);
  });
});

describe("directional menu focus", () => {
  const grid = [
    { left: 0, top: 0, width: 100, height: 50 },
    { left: 120, top: 0, width: 100, height: 50 },
    { left: 0, top: 70, width: 100, height: 50 },
    { left: 120, top: 70, width: 100, height: 50 },
  ];
  it("moves by screen position across quiz and puzzle grids", () => {
    expect(directionalIndex(grid, 0, "right")).toBe(1);
    expect(directionalIndex(grid, 0, "down")).toBe(2);
    expect(directionalIndex(grid, 3, "up")).toBe(1);
    expect(directionalIndex(grid, 3, "left")).toBe(2);
  });
  it("uses document order for projected 3D controls and wraps at edges", () => {
    const proxies = Array.from({ length: 4 }, () => ({
      left: 0,
      top: 0,
      width: 1,
      height: 1,
    }));
    expect(directionalIndex(proxies, 0, "right")).toBe(1);
    expect(directionalIndex(proxies, 0, "left")).toBe(3);
    expect(directionalIndex(proxies, 3, "down")).toBe(0);
    expect(directionalIndex([], 0, "right")).toBe(-1);
    expect(directionalIndex(grid, -1, "down")).toBe(0);
  });
});
