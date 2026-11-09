export type PadAction =
  | "up"
  | "down"
  | "left"
  | "right"
  | "confirm"
  | "back"
  | "previous"
  | "next"
  | "menu"
  | "world"
  | "scrollUp"
  | "scrollDown";
export type PadSnapshot = Pick<
  Gamepad,
  "mapping" | "connected" | "buttons" | "axes"
>;

/** W3C standard mapping: south/east face buttons confirm/back. */
export function gamepadActions(pad: PadSnapshot): Set<PadAction> {
  const actions = new Set<PadAction>();
  if (!pad.connected || pad.mapping !== "standard") return actions;
  const pressed = (index: number) =>
    Boolean(pad.buttons[index]?.pressed || pad.buttons[index]?.value > 0.5);
  const buttons: [number, PadAction][] = [
    [0, "confirm"],
    [1, "back"],
    [2, "world"],
    [4, "previous"],
    [5, "next"],
    [9, "menu"],
    [12, "up"],
    [13, "down"],
    [14, "left"],
    [15, "right"],
  ];
  for (const [index, action] of buttons)
    if (pressed(index)) actions.add(action);
  const axis = (index: number) =>
    Number.isFinite(pad.axes[index]) ? pad.axes[index] : 0;
  if (
    !["up", "down", "left", "right"].some((key) =>
      actions.has(key as PadAction),
    )
  ) {
    const x = axis(0),
      y = axis(1);
    if (Math.max(Math.abs(x), Math.abs(y)) > 0.55)
      actions.add(
        Math.abs(x) > Math.abs(y)
          ? x > 0
            ? "right"
            : "left"
          : y > 0
            ? "down"
            : "up",
      );
  }
  if (Math.abs(axis(3)) > 0.55)
    actions.add(axis(3) > 0 ? "scrollDown" : "scrollUp");
  return actions;
}

/** Neutral-to-arm prevents a held connect/resume button selecting an option. */
export function createPadRepeater() {
  let armed = false;
  let previous = new Set<PadAction>();
  const nextAt = new Map<PadAction, number>();
  const repeating = new Set<PadAction>([
    "up",
    "down",
    "left",
    "right",
    "scrollUp",
    "scrollDown",
    "previous",
    "next",
  ]);
  return {
    reset() {
      armed = false;
      previous.clear();
      nextAt.clear();
    },
    sample(held: Set<PadAction>, now: number) {
      const fired: PadAction[] = [];
      if (!armed) {
        if (!held.size) armed = true;
        return { fired, held: new Set<PadAction>() };
      }
      for (const action of held) {
        if (!previous.has(action)) {
          fired.push(action);
          nextAt.set(action, now + 340);
        } else if (
          repeating.has(action) &&
          now >= (nextAt.get(action) ?? Infinity)
        ) {
          fired.push(action);
          nextAt.set(action, now + 120);
        }
      }
      for (const action of previous)
        if (!held.has(action)) nextAt.delete(action);
      previous = new Set(held);
      return { fired, held };
    },
  };
}
