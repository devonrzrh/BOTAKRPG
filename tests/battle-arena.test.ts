import { NullEngine } from "@babylonjs/core/Engines/nullEngine";
import { Scene } from "@babylonjs/core/scene";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { describe, expect, it } from "vitest";
import { battleArenaKind, buildBattleArena } from "../src/world/BattleArena";

const arenas = [
  ["guard-source-alg-01", "packet-highway", "suspended causeway"],
  ["archive-keeper", "cache-vault", "circular archive lock"],
  ["guard-source-ai-01", "browser-net", "browser pane"],
  ["route-warden", "firewall", "gate lintel"],
  ["echo-7", "abandoned-subnet", "dead server monolith"],
  ["sentinel-a-03", "gateway", "gateway arch"],
] as const;

describe("battle arenas", () => {
  it.each(arenas)("gives %s a distinct %s setting", (id, kind, feature) => {
    const engine = new NullEngine();
    const scene = new Scene(engine);
    try {
      const arena = buildBattleArena(scene, id);
      expect(battleArenaKind(id)).toBe(kind);
      expect(arena.kind).toBe(kind);
      expect(arena.root.position.asArray()).toEqual([5, 0, 4]);
      expect(
        arena.meshes.some((mesh) => mesh.name === `${kind} ${feature}`),
      ).toBe(true);
      expect(arena.meshes.length).toBeLessThan(65);
      expect(arena.materials).toHaveLength(3);
      expect(arena.lights).toHaveLength(2);
      expect(scene.onBeforeRenderObservable.observers).toHaveLength(1);
      for (const mesh of arena.meshes) {
        expect(mesh.isPickable).toBe(false);
        expect(mesh.isDescendantOf(arena.root)).toBe(true);
        mesh.computeWorldMatrix(true);
        const { minimumWorld: min, maximumWorld: max } =
          mesh.getBoundingInfo().boundingBox;
        if (mesh.metadata.region === "floor")
          expect(max.y).toBeLessThanOrEqual(0.25);
        else if (mesh.metadata.region === "backdrop")
          expect(min.z).toBeGreaterThanOrEqual(6.4);
        else expect(max.x <= 2.2 || min.x >= 7.8).toBe(true);
      }
    } finally {
      scene.dispose();
      engine.dispose();
    }
  });

  it("uses geometric differences beyond palette swaps and maps related threats coherently", () => {
    const engine = new NullEngine();
    const scene = new Scene(engine);
    try {
      const fingerprints = arenas.map(([id]) => {
        const arena = buildBattleArena(scene, id);
        const fingerprint = arena.meshes
          .map(
            (mesh) =>
              `${mesh.getTotalVertices()}:${mesh.getBoundingInfo().boundingBox.extendSize.asArray().join("/")}`,
          )
          .sort()
          .join(",");
        arena.dispose();
        return fingerprint;
      });
      expect(new Set(fingerprints).size).toBe(arenas.length);
      expect(battleArenaKind("guard-source-ds-05")).toBe("cache-vault");
      expect(battleArenaKind("signal-mimic")).toBe("browser-net");
    } finally {
      scene.dispose();
      engine.dispose();
    }
  });

  it("disposes only owned resources and restores the backdrop", () => {
    const engine = new NullEngine();
    const scene = new Scene(engine);
    try {
      const untouched = MeshBuilder.CreateBox("unrelated", {}, scene);
      const material = new StandardMaterial("unrelated", scene);
      untouched.material = material;
      const background = scene.clearColor;
      const arena = buildBattleArena(scene, "echo-7");
      expect(scene.clearColor).not.toBe(background);
      arena.dispose();
      arena.dispose();
      expect(scene.meshes).toEqual([untouched]);
      expect(scene.lights).toHaveLength(0);
      expect(scene.materials).toEqual([material]);
      expect(scene.clearColor).toBe(background);
      expect(untouched.isDisposed()).toBe(false);
    } finally {
      scene.dispose();
      engine.dispose();
    }
  });

  it("frames the same arena differently for regular, miniboss and final fights", () => {
    const engine = new NullEngine();
    const scene = new Scene(engine);
    try {
      const layouts = (["regular", "miniboss", "final"] as const).map((rank) => {
        const arena = buildBattleArena(scene, "echo-7", rank);
        const result = {
          halos: arena.meshes.filter((mesh) => mesh.name.endsWith("command halo")),
          rim: arena.lights[1].intensity,
          particles: (scene.getMeshByName("arena background particles") as Mesh).thinInstanceCount,
        };
        arena.dispose();
        return result;
      });
      expect(layouts.map(({ halos }) => halos.length)).toEqual([0, 1, 2]);
      expect(layouts.map(({ particles }) => particles)).toEqual([48, 72, 156]);
      expect(layouts[2].rim).toBeGreaterThan(layouts[1].rim);
      expect(layouts[1].rim).toBeGreaterThan(layouts[0].rim);
      expect(scene.meshes).toHaveLength(0);
    } finally {
      scene.dispose();
      engine.dispose();
    }
  });

  it("keeps major encounter particles behind the enemy and honors live reduced motion", () => {
    const engine = new NullEngine();
    const scene = new Scene(engine);
    try {
      let reducedMotion = true;
      const arena = buildBattleArena(scene, "echo-7", "final", () => reducedMotion);
      const flecks = scene.getMeshByName("arena background particles");
      if (!(flecks instanceof Mesh)) throw new Error("Missing arena particles");
      expect(flecks.parent).toBe(arena.root);
      expect(flecks.isPickable).toBe(false);
      expect(flecks.thinInstanceCount).toBe(156);
      expect(flecks.thinInstanceGetWorldMatrices().every((matrix) =>
        matrix.getTranslation().z > 3,
      )).toBe(true);
      expect(flecks.isEnabled()).toBe(false);
      reducedMotion = false;
      scene.onBeforeRenderObservable.notifyObservers(scene);
      expect(flecks.isEnabled()).toBe(true);
      reducedMotion = true;
      scene.onBeforeRenderObservable.notifyObservers(scene);
      expect(flecks.isEnabled()).toBe(false);
      arena.dispose();
      expect(flecks.isDisposed()).toBe(true);
      expect(scene.materials).toHaveLength(0);
      expect(scene.onBeforeRenderObservable.hasObservers()).toBe(false);
    } finally {
      scene.dispose();
      engine.dispose();
    }
  });
});
