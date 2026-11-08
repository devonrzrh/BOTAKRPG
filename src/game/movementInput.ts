import type { Direction } from "./contracts";

const keys: Record<string, Direction> = {
  w: "north",
  arrowup: "north",
  d: "east",
  arrowright: "east",
  s: "south",
  arrowdown: "south",
  a: "west",
  arrowleft: "west",
};

export const movementKey = (key: string) => keys[key.toLowerCase()];

/** Map the screen's four directions to the nearest orthogonal ground axes. */
export function cameraRelativeDirection(
  direction: Direction,
  alpha: number,
): Direction {
  const forwardX = -Math.cos(alpha),
    forwardZ = -Math.sin(alpha);
  const up: Direction =
    Math.abs(forwardX) > Math.abs(forwardZ)
      ? forwardX > 0
        ? "east"
        : "west"
      : forwardZ > 0
        ? "south"
        : "north";
  const cardinal: Direction[] = ["north", "east", "south", "west"];
  return cardinal[(cardinal.indexOf(up) - cardinal.indexOf(direction) + 4) % 4];
}

/** Own repeat timing: a newly pressed direction takes over immediately. */
export function createMovementInput() {
  let held: string[] = [];
  let nextAt = Infinity;
  const press = (key: string, now: number) => {
    const normalized = key.toLowerCase(),
      direction = movementKey(normalized);
    if (!direction || held.includes(normalized)) return;
    held.push(normalized);
    nextAt = now + 170;
    return direction;
  };
  const release = (key: string, now: number) => {
    const normalized = key.toLowerCase(),
      active = held.at(-1) === normalized;
    held = held.filter((item) => item !== normalized);
    if (active) nextAt = now + 125;
  };
  const tick = (now: number) => {
    if (!held.length || now < nextAt) return;
    nextAt = now + 125;
    return movementKey(held.at(-1)!);
  };
  return {
    press,
    release,
    tick,
    clear: () => {
      held = [];
      nextAt = Infinity;
    },
  };
}
