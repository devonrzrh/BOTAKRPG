import { NullEngine } from "@babylonjs/core/Engines/nullEngine";
import { Scene } from "@babylonjs/core/scene";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { afterEach, describe, expect, it, vi } from "vitest";
import { attachExplorationMotes } from "../src/world/AmbientParticles";
import {
  attachWorldParticles,
  type WorldParticleState,
} from "../src/world/WorldParticles";

describe("world particles", () => {
  let engine: NullEngine | undefined;
  let scene: Scene | undefined;
  let clock: ReturnType<typeof vi.spyOn> | undefined;
  afterEach(() => {
    vi.restoreAllMocks();
    scene?.dispose();
    engine?.dispose();
    scene = undefined;
    engine = undefined;
    clock = undefined;
  });

  function setup(initial: Partial<WorldParticleState> = {}) {
    engine = new NullEngine();
    scene = new Scene(engine);
    let time = 0;
    clock = vi.spyOn(performance, "now").mockImplementation(() => time);
    let state: WorldParticleState = {
      position: { x: 0, y: 0, z: 0 },
      goal: { x: 3, y: 0, z: 4 },
      atGoal: false,
      reducedMotion: false,
      locked: false,
      ...initial,
    };
    const dispose = attachWorldParticles(scene, () => state);
    const frame = (elapsed = 0) => {
      time += elapsed;
      scene!.onBeforeRenderObservable.notifyObservers(scene!);
    };
    const particles = () =>
      scene!.meshes.filter((mesh) => mesh.name.startsWith("world mote "));
    return {
      frame,
      dispose,
      particles,
      setState: (next: Partial<WorldParticleState>) => {
        state = { ...state, ...next };
      },
    };
  }

  it("uses a fixed, non-pickable pool and emits bounded footstep bursts", () => {
    const { frame, particles, setState } = setup();
    expect(particles()).toHaveLength(54);
    expect(
      particles().every((mesh) => !mesh.isPickable && !mesh.checkCollisions),
    ).toBe(true);
    frame();
    setState({ position: { x: 0.31, y: 0, z: 0 } });
    frame(100);
    expect(particles().filter((mesh) => mesh.isVisible)).toHaveLength(4);
    setState({ position: { x: 0.7, y: 0, z: 0 } });
    frame(50);
    expect(particles().filter((mesh) => mesh.isVisible)).toHaveLength(4);
    setState({ position: { x: 0.71, y: 0, z: 0 } });
    frame(60);
    expect(particles().filter((mesh) => mesh.isVisible)).toHaveLength(8);
    frame(500);
    expect(particles().every((mesh) => !mesh.isVisible)).toBe(true);
  });

  it("bursts once on a false-to-true goal transition, but not on initial true", () => {
    const first = setup({ atGoal: true });
    first.frame();
    expect(first.particles().filter((mesh) => mesh.isVisible)).toHaveLength(0);
    first.setState({ atGoal: false });
    first.frame();
    first.setState({ atGoal: true });
    first.frame();
    expect(first.particles().filter((mesh) => mesh.isVisible)).toHaveLength(30);
    first.frame(100);
    expect(first.particles().filter((mesh) => mesh.isVisible)).toHaveLength(30);
    first.setState({ atGoal: false });
    first.frame();
    first.setState({ atGoal: true });
    first.frame();
    expect(first.particles().filter((mesh) => mesh.isVisible)).toHaveLength(30);
  });

  it("does not emit in reduced motion and disposes only its own scene resources", () => {
    const { frame, particles, dispose, setState } = setup({
      reducedMotion: true,
    });
    const baseline = scene!.meshes.length;
    frame();
    setState({ reducedMotion: false });
    frame(200);
    expect(particles().filter((mesh) => mesh.isVisible)).toHaveLength(0);
    setState({ position: { x: 0.31, y: 0, z: 0 } });
    frame(100);
    expect(particles().filter((mesh) => mesh.isVisible)).toHaveLength(4);
    dispose();
    expect(scene!.meshes.length).toBe(baseline - 56);
  });

  it.each(["desk", "hub", "maze", "garden"] as const)(
    "keeps %s ambience in one bounded mesh and pauses it live",
    (location) => {
      engine = new NullEngine();
      scene = new Scene(engine);
      let paused = false;
      const dispose = attachExplorationMotes(scene, location, () => paused);
      const [mesh] = scene.meshes;
      if (!(mesh instanceof Mesh)) throw new Error("Missing ambient particle mesh");
      expect(scene.meshes).toHaveLength(1);
      expect(mesh.isPickable).toBe(false);
      expect(mesh.thinInstanceCount).toBeGreaterThan(60);
      expect(mesh.thinInstanceCount).toBeLessThanOrEqual(120);
      expect(mesh.isEnabled()).toBe(true);
      paused = true;
      scene.onBeforeRenderObservable.notifyObservers(scene);
      expect(mesh.isEnabled()).toBe(false);
      dispose();
      expect(scene.meshes).toHaveLength(0);
      expect(scene.materials).toHaveLength(0);
    },
  );
});
