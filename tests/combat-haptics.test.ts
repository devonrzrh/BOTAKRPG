import { afterEach, expect, it, vi } from "vitest";
import { createCombatHaptics } from "../src/game/combatHaptics";
import type { BattleCue } from "../src/game/combatPresentation";

const hit: BattleCue = {
  sequence: 1,
  kind: "player",
  skill: "insight",
  amount: 12,
  heavy: false,
  blocked: false,
  defeated: false,
};

afterEach(() => vi.unstubAllGlobals());

function hardware() {
  const vibrate = vi.fn(() => true);
  vi.stubGlobal("navigator", {
    vibrate,
    userActivation: { hasBeenActive: true },
  });
  vi.stubGlobal("document", { hidden: false });
  return vibrate;
}

it("uses short distinct pulses for hits, blocks, heavy strikes and defeat", () => {
  const vibrate = hardware();
  const haptics = createCombatHaptics();
  haptics.impact(hit, false);
  expect(vibrate).toHaveBeenLastCalledWith(20);
  haptics.impact({ ...hit, sequence: 2, kind: "enemy" }, false);
  expect(vibrate).toHaveBeenLastCalledWith(45);
  haptics.impact({ ...hit, sequence: 3, kind: "enemy", heavy: true }, false);
  expect(vibrate).toHaveBeenLastCalledWith(80);
  haptics.impact(
    { ...hit, sequence: 4, kind: "enemy", blocked: true, amount: 0 },
    false,
  );
  expect(vibrate).toHaveBeenLastCalledWith(12);
  haptics.impact({ ...hit, sequence: 5, defeated: true }, false);
  expect(vibrate).toHaveBeenLastCalledWith([45, 40, 65]);
  haptics.cancel();
  expect(vibrate).toHaveBeenLastCalledWith(0);
});

it("ignores duplicate and stale cues and stops an active pulse only once", () => {
  const vibrate = hardware();
  const haptics = createCombatHaptics();
  haptics.impact({ ...hit, sequence: 3 }, false);
  haptics.impact({ ...hit, sequence: 3 }, false);
  haptics.impact(hit, false);
  expect(vibrate).toHaveBeenCalledTimes(1);
  haptics.cancel();
  haptics.cancel();
  expect(vibrate.mock.calls).toEqual([[20], [0]]);
});

it("stays silent for reduced motion, hidden pages, no activation and non-hits", () => {
  const vibrate = hardware();
  createCombatHaptics().impact(hit, true);
  for (const kind of ["miss", "recover"] as const)
    createCombatHaptics().impact({ ...hit, kind }, false);
  createCombatHaptics().impact({ ...hit, amount: 0 }, false);
  vi.stubGlobal("document", { hidden: true });
  createCombatHaptics().impact(hit, false);
  vi.stubGlobal("document", { hidden: false });
  vi.stubGlobal("navigator", {
    vibrate,
    userActivation: { hasBeenActive: false },
  });
  createCombatHaptics().impact(hit, false);
  expect(vibrate).not.toHaveBeenCalled();
});

it("tolerates missing, denied and throwing APIs without breaking combat", () => {
  for (const navigator of [
    undefined,
    {},
    { vibrate: () => false },
    {
      vibrate: () => {
        throw new Error("Denied");
      },
    },
  ]) {
    vi.stubGlobal("navigator", navigator);
    const haptics = createCombatHaptics();
    expect(() => haptics.impact(hit, false)).not.toThrow();
    expect(() => haptics.cancel()).not.toThrow();
  }
});
