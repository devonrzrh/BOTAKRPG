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
