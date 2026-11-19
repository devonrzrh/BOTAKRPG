import { NullEngine } from "@babylonjs/core/Engines/nullEngine";
import { Scene } from "@babylonjs/core/scene";
import { afterEach, expect, it, vi } from "vitest";
import { buildEnemyModel } from "../src/world/EnemyModel";
import { attachBattleEffects } from "../src/world/BattleEffects";
import {
  combatCueDuration,
  type BattleCue,
} from "../src/game/combatPresentation";

afterEach(() => vi.restoreAllMocks());

function setup(id: string) {
  const engine = new NullEngine();
  const scene = new Scene(engine);
  const rig = buildEnemyModel(scene, id);
  let time = 0;
  vi.spyOn(performance, "now").mockImplementation(() => time);
  const state: { cue: BattleCue | null; reducedMotion: boolean } = {
    cue: null,
    reducedMotion: false,
  };
  const dispose = attachBattleEffects(scene, rig, () => state);
  return {
    rig,
    state,
    frame: (ms: number) => {
      time = ms;
      scene.onBeforeRenderObservable.notifyObservers(scene);
    },
    dispose: () => {
      dispose();
      scene.dispose();
      engine.dispose();
    },
  };
}

it.each([
  "sentinel-a-03",
  "guard-source-alg-01",
  "guard-source-ds-01",
  "guard-source-ai-01",
  "guard-source-alg-02",
  "guard-source-ds-02",
  "guard-source-ds-07",
  "guard-source-ai-02",
  "archive-keeper",
  "routing-warden",
  "signal-mimic",
  "echo-7",
])(
  "animates %s at rest without drifting, and freezes immediately for reduced motion",
  (id) => {
    const { rig, state, frame, dispose } = setup(id);
    const pose = () =>
      [rig.root, rig.leftArm, rig.rightArm, ...rig.meshes].map((node) => [
        ...node.position.asArray(),
        ...node.rotation.asArray(),
        ...node.scaling.asArray(),
      ]);
    try {
      const rest = pose();
      frame(1200);
      const idle = pose();
      expect(idle).not.toEqual(rest);
      for (let i = 0; i < 30; i++) frame(1200);
      expect(pose()).toEqual(idle);
      frame(2200);
      expect(pose()).not.toEqual(idle);
      state.reducedMotion = true;
      frame(2400);
      expect(pose()).toEqual(rest);
      frame(5000);
      expect(pose()).toEqual(rest);
    } finally {
      dispose();
    }
  },
);

it.each([
  ["guard-source-alg-02", "left shoulder pivot"],
  ["guard-source-ds-02", "ram hydraulic piston"],
  ["guard-source-ds-07", "weaver spindle"],
  ["guard-source-ai-02", "array upper receiver"],
  ["archive-keeper", "keeper drawer slide"],
  ["signal-mimic", "mimic left mask hinge"],
])("animates %s's %s through wind-up and impact and resets it", (id, joint) => {
  const { rig, state, frame, dispose } = setup(id);
  const pivot = rig.root
    .getChildTransformNodes()
    .find((node) => node.name === joint)!;
  const pose = () => [...pivot.position.asArray(), ...pivot.rotation.asArray()];
  try {
    const rest = pose();
    state.cue = {
      sequence: 1,
      kind: "enemy",
      skill: null,
      amount: 7,
      heavy: true,
      blocked: false,
      defeated: false,
    };
    frame(0);
    const duration = combatCueDuration(false);
    frame(duration * 0.42);
    const wind = pose();
    expect(wind).not.toEqual(rest);
    frame(duration * 0.62);
    const impact = pose();
    expect(impact).not.toEqual(wind);
    frame(duration * 0.62);
    expect(pose()).toEqual(impact);
    state.reducedMotion = true;
    frame(duration * 0.72);
    expect(pose()).toEqual(rest);
  } finally {
    dispose();
  }
});

it("hands idle parts to attacks and holds defeat rather than reviving the enemy", () => {
  const { rig, state, frame, dispose } = setup("guard-source-ds-01");
  const gyro = rig.meshes.find((mesh) =>
    mesh.name.includes("cross gyroscope"),
  )!;
  const restRotation = gyro.rotation.clone();
  try {
    frame(1000);
    expect(gyro.rotation.equals(restRotation)).toBe(false);
    state.cue = {
      sequence: 1,
      kind: "player",
      skill: "insight",
      amount: 100,
      heavy: false,
      blocked: false,
      defeated: true,
    };
    frame(1100);
    expect(gyro.rotation.equals(restRotation)).toBe(true);
    frame(1100 + combatCueDuration(false));
    const fallen = rig.root.position.clone();
    frame(9000);
    expect(rig.root.position.equals(fallen)).toBe(true);
    expect(gyro.rotation.equals(restRotation)).toBe(true);
  } finally {
    dispose();
  }
});
