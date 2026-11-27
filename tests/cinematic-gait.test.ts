import { NullEngine } from "@babylonjs/core/Engines/nullEngine";
import { Scene } from "@babylonjs/core/scene";
import { expect, it } from "vitest";
import { createCinematicGait } from "../src/world/CinematicGait";
import { buildEnemyModel } from "../src/world/EnemyModel";

it("holds a planted boot level while the chassis advances and banks", () => {
  const engine = new NullEngine();
  const scene = new Scene(engine);
  try {
    const rig = buildEnemyModel(scene, "echo-7", 0.86);
    const path = (time: number) => ({ x: 0, z: -0.9 * time, yaw: 0 });
    const pose = createCinematicGait(rig, path, [400, 800, 1200], 0, 0.15, 0.17);
    const { thigh, shin, foot } = rig.legs![0];
    const at = (time: number) => {
      rig.root.position.set(0, -0.14, path(time).z);
      rig.root.rotation.set(-0.11, 0, time * 0.12);
      pose(time);
      foot.computeWorldMatrix(true);
      return foot.absolutePosition.clone();
    };
    const planted = at(0.4);
    const restDepth = (thigh.position.z + shin.position.z + foot.position.z) * 0.86;
    expect(planted.z).toBeCloseTo(path(0.55).z + restDepth);
    const support = at(0.68);
    expect(support.subtract(planted).length()).toBeLessThan(0.001);
    const boot = foot.getChildMeshes()[0];
    boot.computeWorldMatrix(true);
    expect(boot.getBoundingInfo().boundingBox.minimumWorld.y).toBeGreaterThanOrEqual(-0.004);
    const lifted = at(0.98);
    expect(lifted.y - planted.y).toBeGreaterThan(0.10);
    expect(at(0.4).subtract(planted).length()).toBeLessThan(0.001);
  } finally {
    scene.dispose();
    engine.dispose();
  }
});
