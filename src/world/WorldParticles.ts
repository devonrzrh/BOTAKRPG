import { Color3 } from "@babylonjs/core/Maths/math.color";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import type { Scene } from "@babylonjs/core/scene";

type Point3 = { x: number; y: number; z: number };
export type WorldParticleState = {
  position: Point3;
  goal?: Point3;
  atGoal: boolean;
  reducedMotion: boolean;
  locked: boolean;
};
type Particle = {
  mesh: Mesh;
  age: number;
  life: number;
  vx: number;
  vy: number;
  vz: number;
  startX: number;
  startY: number;
  startZ: number;
};

const POOL_SIZE = 32;
const STEP_COUNT = 14;
const LIFE_MS = 450;

/** Subtle pooled footstep motes and a one-shot arrival burst for 3D exploration. */
export function attachWorldParticles(
  scene: Scene,
  read: () => WorldParticleState,
): () => void {
  const teal = new StandardMaterial("world step mote material", scene);
  teal.emissiveColor = new Color3(0.12, 0.88, 0.82);
  teal.diffuseColor = new Color3(0.04, 0.22, 0.2);
  const amber = new StandardMaterial("world goal mote material", scene);
  amber.emissiveColor = new Color3(1, 0.62, 0.16);
  amber.diffuseColor = new Color3(0.28, 0.13, 0.03);
  const tealSource = MeshBuilder.CreateBox(
    "world step mote source",
    { size: 0.055 },
    scene,
  );
  tealSource.material = teal;
  tealSource.isVisible = false;
  const amberSource = tealSource.clone("world goal mote source", null, true);
  if (!amberSource) throw new Error("Could not create world mote source");
  amberSource.material = amber;
  amberSource.isVisible = false;

  const particles: Particle[] = Array.from({ length: POOL_SIZE }, (_, i) => {
    const isAmber = i >= STEP_COUNT;
    // Clones share the source geometry/material while keeping per-particle visibility for fading.
    const mesh = (isAmber ? amberSource : tealSource).clone(
      `world mote ${i}`,
      null,
      true,
    );
    if (!mesh) throw new Error("Could not create world mote");
    mesh.isVisible = false;
    mesh.isPickable = false;
    mesh.checkCollisions = false;
    return {
      mesh,
      age: LIFE_MS,
      life: LIFE_MS,
      vx: 0,
      vy: 0,
      vz: 0,
      startX: 0,
      startY: 0,
      startZ: 0,
    };
  });
  let cursor = 0;
  let havePosition = false;
  let sampleX = 0;
  let sampleY = 0;
  let sampleZ = 0;
  let lastStepX = 0;
  let lastStepY = 0;
  let lastStepZ = 0;
  let lastStepAt = -Infinity;
  let priorAtGoal = false;
  let didInitialRead = false;
  let lastFrameAt = performance.now();

  const emit = (
    amberParticle: boolean,
    x: number,
    y: number,
    z: number,
    vx: number,
    vy: number,
    vz: number,
  ) => {
    // The two reserved portions of the fixed pool prevent a goal burst from consuming step slots.
    const start = amberParticle ? STEP_COUNT : 0;
    const count = amberParticle ? POOL_SIZE - STEP_COUNT : STEP_COUNT;
    const particle = particles[start + (cursor++ % count)]!;
    particle.age = 0;
    particle.life = LIFE_MS;
    particle.startX = x;
    particle.startY = y;
    particle.startZ = z;
    particle.vx = vx;
    particle.vy = vy;
    particle.vz = vz;
    particle.mesh.isVisible = true;
  };
  const clear = () => {
    for (const particle of particles) {
      particle.mesh.isVisible = false;
      particle.mesh.visibility = 0;
    }
  };

  const observer = scene.onBeforeRenderObservable.add(() => {
    const state = read();
    const now = performance.now();
    const dt = Math.max(0, now - lastFrameAt);
    lastFrameAt = now;
    const hidden = typeof document !== "undefined" && document.hidden;
    if (!didInitialRead) {
      priorAtGoal = state.atGoal;
      didInitialRead = true;
    } else if (
      state.atGoal &&
      !priorAtGoal &&
      state.goal &&
      !state.reducedMotion &&
      !hidden
    ) {
      for (let i = 0; i < 18; i++) {
        const angle = (i / 18) * Math.PI * 2;
        const speed = 0.18 + (i % 4) * 0.045;
        emit(
          true,
          state.goal.x,
          state.goal.y + 0.12,
          state.goal.z,
          Math.cos(angle) * speed,
          0.24 + (i % 3) * 0.04,
          Math.sin(angle) * speed,
        );
      }
    }
    priorAtGoal = state.atGoal;

    if (state.reducedMotion || hidden) {
      // Keep already emitted motes from appearing after an overlay or visibility change.
      clear();
      lastStepX = state.position.x;
      lastStepY = state.position.y;
      lastStepZ = state.position.z;
      sampleX = state.position.x;
      sampleY = state.position.y;
      sampleZ = state.position.z;
      havePosition = true;
      return;
    }
    if (!havePosition) {
      lastStepX = state.position.x;
      lastStepY = state.position.y;
      lastStepZ = state.position.z;
      sampleX = state.position.x;
      sampleY = state.position.y;
      sampleZ = state.position.z;
      havePosition = true;
    } else if (state.locked) {
      lastStepX = state.position.x;
      lastStepY = state.position.y;
      lastStepZ = state.position.z;
    } else {
      const frameX = state.position.x - sampleX;
      const frameY = state.position.y - sampleY;
      const frameZ = state.position.z - sampleZ;
      const sx = state.position.x - lastStepX;
      const sy = state.position.y - lastStepY;
      const sz = state.position.z - lastStepZ;
      if (
        frameX * frameX + frameY * frameY + frameZ * frameZ > 0 &&
        sx * sx + sy * sy + sz * sz >= 0.09 &&
        now - lastStepAt >= 100
      ) {
        emit(
          false,
          state.position.x,
          state.position.y + 0.08,
          state.position.z,
          -0.035,
          0.16,
          -0.02,
        );
        emit(
          false,
          state.position.x,
          state.position.y + 0.06,
          state.position.z,
          0.035,
          0.12,
          0.02,
        );
        lastStepX = state.position.x;
        lastStepY = state.position.y;
        lastStepZ = state.position.z;
        lastStepAt = now;
      }
    }
    sampleX = state.position.x;
    sampleY = state.position.y;
    sampleZ = state.position.z;
    for (const particle of particles) {
      if (!particle.mesh.isVisible) continue;
      particle.age += dt;
      const t = particle.age / particle.life;
      if (t >= 1) {
        particle.mesh.isVisible = false;
        particle.mesh.visibility = 0;
        continue;
      }
      particle.mesh.position.set(
        particle.startX + (particle.vx * particle.age) / 1000,
        particle.startY +
          (particle.vy * particle.age) / 1000 -
          0.22 * (particle.age / 1000) ** 2,
        particle.startZ + (particle.vz * particle.age) / 1000,
      );
      particle.mesh.visibility = 1 - t;
      const scale = 1 - t * 0.55;
      particle.mesh.scaling.set(scale, scale, scale);
    }
  });

  return () => {
    scene.onBeforeRenderObservable.remove(observer);
    clear();
    particles.forEach(({ mesh }) => mesh.dispose());
    tealSource.dispose();
    amberSource.dispose();
    teal.dispose();
    amber.dispose();
  };
}
