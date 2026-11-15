import { NullEngine } from "@babylonjs/core/Engines/nullEngine";
import { Matrix } from "@babylonjs/core/Maths/math.vector";
import { Scene } from "@babylonjs/core/scene";
import { describe, expect, it } from "vitest";
import {
  buildEnemyModel,
  enemyArchetype,
  enemyThreatName,
} from "../src/world/EnemyModel";
import { createBattleSpeechAnchor } from "../src/world/BattleSpeechAnchor";

const cases = [
  ["sentinel-a-03", "sentinel", "visor"],
  ["guard-source-alg-01", "interceptor", "swept blade"],
  ["guard-source-ds-01", "drone", "cookie chip"],
  ["guard-source-ai-01", "decoy", "spam popup window"],
  ["archive-keeper", "keeper", "archive cabinet"],
  ["routing-warden", "warden", "tower shield"],
  ["signal-mimic", "mimic", "phishing hook"],
  ["echo-7", "echo", "visor"],
] as const;

describe("enemy silhouettes", () => {
  it.each(cases)("builds %s as a distinct %s rig", (id, kind, feature) => {
    const engine = new NullEngine();
    const scene = new Scene(engine);
    try {
      const rig = buildEnemyModel(scene, id);
      expect(enemyArchetype(id)).toBe(kind);
      expect(enemyThreatName(id)).toBeTruthy();
      expect(rig.root.metadata.archetype).toBe(kind);
      expect(
        rig.meshes.some((mesh) => mesh.name === `${kind} ${feature}`),
      ).toBe(true);
      expect(rig.leftArm.parent).toBe(rig.root);
      expect(rig.rightArm.parent).toBe(rig.root);
      expect(rig.leftArm.getChildMeshes().length).toBeGreaterThan(0);
      expect(rig.rightArm.getChildMeshes().length).toBeGreaterThan(0);
      expect(rig.meshes.length).toBeLessThan(35);
      expect(rig.materials).toHaveLength(3);
      for (const mesh of rig.meshes) {
        expect(mesh.isPickable).toBe(false);
        expect(mesh.isDescendantOf(rig.root)).toBe(true);
        mesh.computeWorldMatrix(true);
        const bounds = mesh.getBoundingInfo().boundingBox;
        expect(bounds.minimumWorld.y).toBeGreaterThanOrEqual(-0.05);
        expect(bounds.maximumWorld.y).toBeLessThan(3.8);
      }
      if (kind !== "sentinel")
        expect(
          rig.meshes.every((mesh) => !/\b(torso|leg)\b/.test(mesh.name)),
        ).toBe(true);
    } finally {
      scene.dispose();
      engine.dispose();
    }
  });

  it("uses different geometry rather than identical renamed robots", () => {
    const engine = new NullEngine();
    const scene = new Scene(engine);
    try {
      const fingerprints = cases.map(([id]) => {
        const rig = buildEnemyModel(scene, id);
        return rig.meshes
          .map(
            (mesh) =>
              `${mesh.getTotalVertices()}:${mesh.getBoundingInfo().boundingBox.extendSize.asArray().join("/")}`,
          )
          .sort()
          .join(",");
      });
      expect(new Set(fingerprints).size).toBe(cases.length);
    } finally {
      scene.dispose();
      engine.dispose();
    }
  });

  it("moves ECHO-7's helmet and optics together and resets their pose", () => {
    const engine = new NullEngine();
    const scene = new Scene(engine);
    try {
      const rig = buildEnemyModel(scene, "echo-7");
      const helmet = rig.meshes.filter((mesh) => mesh.parent?.name === "echo head pivot");
      expect(helmet).toHaveLength(3);
      const pivot = helmet[0].parent!;
      const rest = pivot.computeWorldMatrix(true).clone();
      rig.animateIdle(0.5);
      expect(pivot.computeWorldMatrix(true).equals(rest)).toBe(false);
      rig.resetIdle();
      // Battle effects restore the root transform independently of the idle joints.
      rig.root.rotation.y = 0;
      expect(pivot.computeWorldMatrix(true).equals(rest)).toBe(true);
    } finally {
      scene.dispose();
      engine.dispose();
    }
  });

  it("projects distinct anchors from enemy geometry and follows a rig's pose", () => {
    const engine = new NullEngine();
    const scene = new Scene(engine);
    try {
      const projection = Matrix.OrthoOffCenterLH(0, 10, 0, 5, -10, 10);
      const anchors = cases.map(([id]) => {
        const rig = buildEnemyModel(scene, id);
        const project = createBattleSpeechAnchor(rig.meshes);
        rig.meshes.forEach((mesh) => mesh.computeWorldMatrix(true));
        const rest = { ...project(projection)! };
        expect(rest.x).toBeGreaterThan(0.5);
        expect(rest.y).toBeGreaterThan(0);
        expect(rest.y).toBeLessThan(1);

        rig.root.position.addInPlaceFromFloats(1, 0.5, 0);
        rig.meshes.forEach((mesh) => mesh.computeWorldMatrix(true));
        const moved = project(projection)!;
        expect(moved.x - rest.x).toBeCloseTo(0.1);
        expect(moved.y - rest.y).toBeCloseTo(-0.1);
        return rest;
      });
      expect(new Set(anchors.map(({ x, y }) => `${x}:${y}`)).size).toBe(cases.length);
    } finally {
      scene.dispose();
      engine.dispose();
    }
  });
});
