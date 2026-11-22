import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Matrix, Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import "@babylonjs/core/Meshes/thinInstanceMesh";
import type { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { Scene } from "@babylonjs/core/scene";
import type { SceneId } from "../game/contracts";

export function attachAmbientParticles(
  scene: Scene,
  name: string,
  color: Color3,
  count: number,
  paused: () => boolean,
  pose: (
    index: number,
    time: number,
    position: Vector3,
    scale: Vector3,
    rotation: Quaternion,
  ) => void,
  parent?: TransformNode,
) {
  const material = new StandardMaterial(`${name} material`, scene);
  material.disableLighting = true;
  material.emissiveColor = color;
  const flecks = MeshBuilder.CreateBox(name, { size: 1 }, scene);
  if (parent) flecks.parent = parent;
  flecks.material = material;
  flecks.isPickable = false;
  flecks.alwaysSelectAsActiveMesh = true;

  const matrices = new Float32Array(count * 16);
  const position = new Vector3();
  const scale = new Vector3();
  const rotation = new Quaternion();
  const matrix = new Matrix();
  let time = 0;
  const layout = () => {
    for (let i = 0; i < count; i++) {
      pose(i, time, position, scale, rotation);
      Matrix.ComposeToRef(scale, rotation, position, matrix);
      matrix.copyToArray(matrices, i * 16);
    }
  };
  const canAnimate = () => !paused() && !globalThis.document?.hidden;
  layout();
  flecks.thinInstanceSetBuffer("matrix", matrices, 16, false);
  flecks.setEnabled(canAnimate());
  const observer = scene.onBeforeRenderObservable.add(() => {
    const animate = canAnimate();
    flecks.setEnabled(animate);
    if (!animate) return;
    time += Math.min(scene.getEngine().getDeltaTime(), 50) / 1000;
    layout();
    flecks.thinInstanceBufferUpdated("matrix");
  });

  return () => {
    scene.onBeforeRenderObservable.remove(observer);
    flecks.dispose();
    material.dispose();
  };
}

const environments = {
  desk: {
    color: "#967d60",
    count: 78,
    width: 8,
    ceiling: 3.6,
    size: 0.015,
    speed: 0.12,
  },
  hub: {
    color: "#489c9e",
    count: 116,
    width: 26,
    ceiling: 4.5,
    size: 0.049,
    speed: 0.32,
  },
  maze: {
    color: "#79a87a",
    count: 112,
    width: 18,
    ceiling: 3.2,
    size: 0.041,
    speed: 0.24,
  },
  garden: {
    color: "#b9a46e",
    count: 102,
    width: 20,
    ceiling: 3.8,
    size: 0.041,
    speed: 0.2,
  },
};

export function attachExplorationMotes(
  scene: Scene,
  location: SceneId,
  paused: () => boolean,
) {
  const { color, count, width, ceiling, size, speed } = environments[location];
  return attachAmbientParticles(
    scene,
    `${location} ambient motes`,
    Color3.FromHexString(color),
    count,
    paused,
    (i, time, position, scale, rotation) => {
      const phase = (i * 0.618034 + time * speed * (0.2 + (i % 5) * 0.04)) % 1;
      const drift = Math.sin(phase * Math.PI * 2 + i);
      position.set(
        (((i * 0.754878) % 1) - 0.5) * width + drift * 0.34,
        0.4 + ((i * 0.17337) % 1) * ceiling + (phase - 0.5) * 0.8,
        (((i * 0.56984) % 1) - 0.5) * width + drift * 0.22,
      );
      const extent = size * (0.5 + (i % 7) * 0.13) * Math.sin(phase * Math.PI);
      scale.set(extent, extent * (location === "hub" ? 1.8 : 0.85), extent);
      Quaternion.FromEulerAnglesToRef(i, i * 0.33 + phase, 0, rotation);
    },
  );
}
