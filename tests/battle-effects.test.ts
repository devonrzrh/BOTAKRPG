import { NullEngine } from "@babylonjs/core/Engines/nullEngine";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Scene } from "@babylonjs/core/scene";
import { afterEach, describe, expect, it, vi } from "vitest";
import { attachBattleEffects } from "../src/world/BattleEffects";
import {
  combatCueDuration,
  type BattleCue,
} from "../src/game/combatPresentation";

const cue = (overrides: Partial<BattleCue> = {}): BattleCue => ({
  sequence: 1,
  kind: "player",
  skill: "insight",
  amount: 12,
  heavy: false,
  blocked: false,
  defeated: false,
  ...overrides,
});

describe("battle effects", () => {
  let engine: NullEngine | undefined;
  let scene: Scene | undefined;
  let now: ReturnType<typeof vi.spyOn> | undefined;

  afterEach(() => {
    vi.restoreAllMocks();
    scene?.dispose();
    engine?.dispose();
    scene = undefined;
    engine = undefined;
    now = undefined;
  });

  function setup(initial: BattleCue | null = null, reducedMotion = false) {
    engine = new NullEngine();
    scene = new Scene(engine);
    let time = 0;
    now = vi.spyOn(performance, "now").mockImplementation(() => time);
    const root = new TransformNode("enemy root", scene);
    root.position.set(2, 3, 4);
    root.rotation.set(0.1, 0.2, 0.3);
    const leftArm = new TransformNode("left arm", scene);
    leftArm.rotation.set(0.4, 0.5, 0.6);
    const rightArm = new TransformNode("right arm", scene);
    rightArm.rotation.set(-0.4, -0.5, -0.6);
    const material = new StandardMaterial("rig material", scene);
    let state = { cue: initial, reducedMotion };
    const baseObserverCount = scene.onBeforeRenderObservable.observers.length;
    const dispose = attachBattleEffects(
      scene,
      { root, leftArm, rightArm, materials: [material] },
      () => state,
    );
    const frame = (elapsed = 0) => {
      time += elapsed;
      scene!.onBeforeRenderObservable.notifyObservers(scene!);
    };
    return {
      root,
      leftArm,
      rightArm,
      material,
      frame,
      setState: (next: typeof state) => {
        state = next;
      },
      dispose,
      baseObserverCount,
    };
  }

  it("flies a player projectile to contact, then recoils the enemy", () => {
    const { root, frame } = setup(cue());
    frame();
    const projectile = scene!.meshes.find(
      (mesh) => mesh.name === "battle projectile",
    )!;
    expect(projectile.isVisible).toBe(true);
    const duration = combatCueDuration(false);
    frame(duration * 0.2);
    expect(projectile.position.z).toBeGreaterThan(-3);
    frame(duration * 0.18);
    expect(projectile.isVisible).toBe(false);
    frame(duration * 0.03);
    expect(root.rotation.y).not.toBeCloseTo(0.2);
    expect(root.position.x).not.toBeCloseTo(2);
  });

  it("moves the root and arm during a heavy enemy cue", () => {
    const { root, leftArm, frame } = setup(
      cue({ kind: "enemy", skill: null, heavy: true }),
    );
    frame();
    frame(288);
    expect(root.position.z).toBeLessThan(4);
    expect(leftArm.rotation.x).toBeLessThan(0.4);
  });

  it("rattles the enemy across multiple axes after contact and damps back to rest", () => {
    const { root, leftArm, rightArm, frame } = setup(cue());
    const duration = combatCueDuration(false);
    frame();
    frame(duration * 0.335);
    const firstOffset = root.position.x - 2;
    expect(Math.abs(firstOffset)).toBeGreaterThan(0.02);
    expect(root.position.z).toBeGreaterThan(4);
    expect(root.rotation.z).not.toBe(0.3);
    expect(leftArm.rotation.z).not.toBe(0.6);
    expect(rightArm.rotation.z).not.toBe(-0.6);
    frame(duration * 0.03);
    expect((root.position.x - 2) * firstOffset).toBeLessThan(0);
    frame(duration * 0.535);
    expect(root.position.x).toBeCloseTo(2);
    expect(root.rotation.z).toBeCloseTo(0.3);
  });

  it("does not shake the enemy when an attack deals zero damage", () => {
    const { root, frame } = setup(cue({ amount: 0 }));
    frame();
    frame(combatCueDuration(false) * 0.4);
    expect(root.position.asArray()).toEqual([2, 3, 4]);
    expect(root.rotation.asArray()).toEqual([0.1, 0.2, 0.3]);
  });

  it("does not recoil or flash the enemy for a missed answer", () => {
    const { root, material, frame } = setup(cue({ kind: "miss", amount: 0 }));
    frame();
    frame(400);
    expect(root.position.asArray()).toEqual([2, 3, 4]);
    expect(root.rotation.asArray()).toEqual([0.1, 0.2, 0.3]);
    expect(material.emissiveColor.asArray()).toEqual([0, 0, 0]);
    expect(
      scene!.meshes.find((mesh) => mesh.name === "impact ring")!.isVisible,
    ).toBe(false);
    expect(
      scene!.meshes
        .filter((mesh) => /^battle particle \d+$/.test(mesh.name))
        .every((mesh) => !mesh.isVisible),
    ).toBe(true);
  });

  it("keeps rig transforms and pooled VFX still under reduced motion", () => {
    const { root, leftArm, rightArm, frame } = setup(cue(), true);
    const transforms = [
      root.position.asArray(),
      root.rotation.asArray(),
      root.scaling.asArray(),
      leftArm.rotation.asArray(),
      rightArm.rotation.asArray(),
    ];
    frame();
    frame(180);
    expect([
      root.position.asArray(),
      root.rotation.asArray(),
      root.scaling.asArray(),
      leftArm.rotation.asArray(),
      rightArm.rotation.asArray(),
    ]).toEqual(transforms);
    expect(
      scene!.meshes
        .filter(
          (mesh) =>
            mesh.name.startsWith("battle ") ||
            mesh.name.startsWith("insight ") ||
            mesh.name.startsWith("guard ") ||
            mesh.name.startsWith("impact "),
        )
        .every((mesh) => !mesh.isVisible),
    ).toBe(true);
  });

  it("restores all poses when the cue clears", () => {
    const rig = setup(cue({ kind: "enemy", heavy: true, skill: null }));
    rig.frame();
    rig.frame(180);
    expect(rig.root.position.z).not.toBe(4);
    rig.setState({ cue: null, reducedMotion: false });
    rig.frame();
    expect(rig.root.position.asArray()).toEqual([2, 3, 4]);
    expect(rig.root.rotation.asArray()).toEqual([0.1, 0.2, 0.3]);
    expect(rig.root.scaling.asArray()).toEqual([1, 1, 1]);
    expect(rig.leftArm.rotation.asArray()).toEqual([0.4, 0.5, 0.6]);
    expect(rig.rightArm.rotation.asArray()).toEqual([-0.4, -0.5, -0.6]);
  });

  it("bounds pooled objects and disposes effects without disposing the rig", () => {
    const rig = setup(null);
    const removeObserver = vi.spyOn(scene!.onBeforeRenderObservable, "remove");
    const meshes = scene!.meshes.length;
    const materials = scene!.materials.length;
    expect(meshes).toBe(29);
    rig.setState({ cue: cue(), reducedMotion: false });
    rig.frame();
    for (let i = 2; i <= 12; i++) {
      rig.setState({ cue: cue({ sequence: i }), reducedMotion: false });
      rig.frame(40);
    }
    expect(scene!.meshes.length).toBe(meshes);
    expect(scene!.materials.length).toBe(materials);
    const rootDisposed = vi.spyOn(rig.root, "dispose");
    rig.dispose();
    expect(removeObserver).toHaveBeenCalledTimes(1);
    expect(scene!.meshes).toHaveLength(0);
    expect(scene!.materials).toContain(rig.material);
    expect(
      scene!.materials.some((material) =>
        /^(battle projectile|insight beam|guard flare|impact ring) material$/.test(
          material.name,
        ),
      ),
    ).toBe(false);
    expect(
      scene!.materials.some(
        (material) => material.name === "battle particle material",
      ),
    ).toBe(false);
    expect(rootDisposed).not.toHaveBeenCalled();
    expect(rig.root.isDisposed()).toBe(false);
  });

  it("emits bounded pooled particles at impact and hides them when cues clear", () => {
    const rig = setup(cue());
    const sparks = () =>
      scene!.meshes.filter((mesh) => /^battle particle \d+$/.test(mesh.name));
    rig.frame();
    rig.frame(combatCueDuration(false) * 0.31);
    expect(sparks().some((mesh) => mesh.isVisible)).toBe(false);
    rig.frame(combatCueDuration(false) * 0.03);
    expect(sparks().filter((mesh) => mesh.isVisible)).toHaveLength(24);
    expect(scene!.meshes).toHaveLength(29);
    rig.setState({
      cue: cue({ sequence: 2, kind: "poison", skill: null }),
      reducedMotion: false,
    });
    rig.frame();
    expect(
      (
        scene!.materials.find(
          (m) => m.name === "battle particle material",
        ) as StandardMaterial
      ).emissiveColor.g,
    ).toBeGreaterThan(0.9);
    rig.frame(combatCueDuration(false) * 0.34);
    expect(sparks().some((mesh) => mesh.isVisible)).toBe(true);
    rig.setState({
      cue: cue({
        sequence: 3,
        kind: "enemy",
        skill: null,
        blocked: true,
        amount: 4,
      }),
      reducedMotion: false,
    });
    rig.frame();
    rig.frame(combatCueDuration(false) * 0.65);
    expect(sparks().some((mesh) => mesh.isVisible)).toBe(true);
    expect(
      (
        scene!.materials.find(
          (m) => m.name === "battle particle material",
        ) as StandardMaterial
      ).emissiveColor.b,
    ).toBeGreaterThan(0.9);
    rig.setState({
      cue: cue({ sequence: 4, defeated: true }),
      reducedMotion: false,
    });
    rig.frame();
    rig.frame(combatCueDuration(false) * 0.34);
    expect(sparks().some((mesh) => mesh.isVisible)).toBe(true);
    rig.setState({ cue: null, reducedMotion: false });
    rig.frame();
    expect(sparks().every((mesh) => !mesh.isVisible)).toBe(true);
  });
});
