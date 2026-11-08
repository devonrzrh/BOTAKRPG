import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import type { Scene } from "@babylonjs/core/scene";

import { enemyArchetype } from "../game/enemyIdentity";
export { enemyArchetype, enemyThreatName } from "../game/enemyIdentity";

/** Each enemy has its own silhouette, not a reskinned humanoid. Scene owns the rig. */
export function buildEnemyModel(scene: Scene, id: string) {
  const kind = enemyArchetype(id);
  const palettes = {
    echo: ["#19232e", "#b9d7e2", "#ff535d"],
    warden: ["#433025", "#bd8b51", "#ffc368"],
    keeper: ["#302b48", "#9d88be", "#d4b9ff"],
    mimic: ["#16424a", "#72c9c8", "#d5ffff"],
    interceptor: ["#44232b", "#b66966", "#ff8b70"],
    drone: ["#513324", "#c99c65", "#94dbff"],
    decoy: ["#143d40", "#62b7b3", "#a5fff1"],
    sentinel: ["#293c47", "#839ca3", "#e3b66e"],
  };
  const materials = palettes[kind].map((color, i) => {
    const material = new StandardMaterial(
      `${kind} ${["shell", "alloy", "signal"][i]}`,
      scene,
    );
    material.diffuseColor = Color3.FromHexString(color);
    material.emissiveColor = material.diffuseColor.scale(i === 2 ? 0.6 : 0.08);
    material.specularColor = new Color3(0.14, 0.14, 0.14);
    return material;
  });
  const [shell, alloy, signal] = materials;
  const root = new TransformNode("enemy combat rig", scene);
  root.position.set(5, 0, 4);
  root.metadata = { archetype: kind };
  const leftArm = new TransformNode("left shoulder pivot", scene);
  const rightArm = new TransformNode("right shoulder pivot", scene);
  for (const [pivot, side] of [
    [leftArm, -1],
    [rightArm, 1],
  ] as const) {
    pivot.parent = root;
    pivot.position.set(side * 1.05, 1.8, 0);
  }
  const meshes: Mesh[] = [];
  const place = (
    mesh: Mesh,
    x: number,
    y: number,
    z: number,
    material = shell,
    parent = root,
  ) => {
    mesh.parent = parent;
    mesh.position.set(x, y, z);
    mesh.material = material;
    mesh.isPickable = false;
    meshes.push(mesh);
    return mesh;
  };
  const box = (
    name: string,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    material = shell,
    parent = root,
  ) =>
    place(
      MeshBuilder.CreateBox(
        `${kind} ${name}`,
        { width: w, height: h, depth: d },
        scene,
      ),
      x,
      y,
      z,
      material,
      parent,
    );
  const sphere = (
    name: string,
    x: number,
    y: number,
    z: number,
    diameter: number,
    material = shell,
    parent = root,
  ) =>
    place(
      MeshBuilder.CreateSphere(
        `${kind} ${name}`,
        { diameter, segments: 12 },
        scene,
      ),
      x,
      y,
      z,
      material,
      parent,
    );
  const ring = (
    name: string,
    x: number,
    y: number,
    z: number,
    diameter: number,
    thickness: number,
    material = signal,
  ) => {
    const mesh = place(
      MeshBuilder.CreateTorus(
        `${kind} ${name}`,
        { diameter, thickness, tessellation: 24 },
        scene,
      ),
      x,
      y,
      z,
      material,
    );
    mesh.rotation.x = Math.PI / 2;
    return mesh;
  };
  const shard = (
    name: string,
    x: number,
    y: number,
    z: number,
    size: number,
    material = alloy,
    parent = root,
  ) =>
    place(
      MeshBuilder.CreatePolyhedron(`${kind} ${name}`, { type: 1, size }, scene),
      x,
      y,
      z,
      material,
      parent,
    );

  if (kind === "interceptor") {
    // A packet-sniffing spider: swept claws surround stolen packet fragments.
    const core = shard("dart core", 0, 1.8, 0, 0.65);
    core.scaling.set(0.75, 0.65, 1.65);
    sphere("target lens", 0, 1.8, -0.86, 0.36, signal);
    for (const [pivot, side] of [
      [leftArm, -1],
      [rightArm, 1],
    ] as const) {
      const blade = box(
        "swept blade",
        side * 0.05,
        0,
        0.2,
        1.5,
        0.14,
        0.85,
        alloy,
        pivot,
      );
      blade.rotation.y = side * -0.5;
      box(
        "blade edge",
        side * 0.05,
        0.08,
        -0.05,
        1.25,
        0.055,
        0.13,
        signal,
        pivot,
      ).rotation.y = side * -0.5;
      for (let i = 0; i < 3; i++) {
        box(
          "sniffer claw",
          side * 0.35,
          -0.35,
          (i - 1) * 0.55,
          0.85,
          0.12,
          0.12,
          shell,
          pivot,
        ).rotation.z = side * -0.48;
        box(
          "claw tip",
          side * 0.7,
          -0.72,
          (i - 1) * 0.55,
          0.12,
          0.7,
          0.12,
          alloy,
          pivot,
        ).rotation.z = side * 0.22;
      }
    }
    box("tail fin", 0, 2.26, 0.65, 0.12, 0.8, 0.55, shell);
    ring("engine exhaust", 0, 1.75, 0.85, 0.55, 0.08);
    for (let i = 0; i < 3; i++)
      box(
        "captured packet",
        (i - 1) * 0.4,
        2.65 + (i % 2) * 0.18,
        -0.2,
        0.28,
        0.36,
        0.12,
        signal,
      ).rotation.z = (i - 1) * 0.22;
  } else if (kind === "drone") {
    // A literal tracking cookie watches through its embedded surveillance eye.
    const cookie = place(
      MeshBuilder.CreateCylinder(
        "drone cookie body",
        { diameter: 1.95, height: 0.36, tessellation: 20 },
        scene,
      ),
      0,
      1.9,
      0,
      alloy,
    );
    cookie.rotation.x = Math.PI / 2;
    sphere("dark socket", 0, 1.9, -0.23, 0.85, shell).scaling.z = 0.32;
    sphere("single iris", 0, 1.9, -0.39, 0.5, signal).scaling.z = 0.3;
    for (let i = 0; i < 7; i++) {
      const angle = (i * Math.PI * 2) / 7;
      const chip = shard(
        "cookie chip",
        Math.cos(angle) * 0.7,
        1.9 + Math.sin(angle) * 0.7,
        -0.23,
        0.12,
        shell,
      );
      chip.scaling.z = 0.4;
    }
    ring("vertical gyroscope", 0, 1.9, 0, 2.5, 0.12, alloy);
    const orbit = ring("cross gyroscope", 0, 1.9, 0, 2.5, 0.09);
    orbit.rotation.set(0, 0, 0.4);
    for (const pivot of [leftArm, rightArm])
      box("sensor boom", 0, -0.25, 0, 0.22, 0.8, 0.22, shell, pivot);
  } else if (kind === "keeper") {
    // An archive shrine: stacked drawers, floating folios and a crowned keyhole.
    box("archive plinth", 0, 0.35, 0, 1.65, 0.5, 1.15, shell);
    box("archive cabinet", 0, 1.6, 0, 1.25, 2.15, 0.9, alloy);
    for (let i = 0; i < 4; i++) {
      box("drawer", 0, 0.88 + i * 0.43, -0.48, 1.1, 0.33, 0.12, shell);
      box("drawer seal", 0, 0.88 + i * 0.43, -0.56, 0.18, 0.07, 0.035, signal);
      box(
        "cache file tab",
        -0.25,
        1.08 + i * 0.43,
        -0.53,
        0.42,
        0.09,
        0.13,
        alloy,
      );
    }
    shard("crown key", 0, 2.92, 0, 0.42, signal);
    for (const [pivot, side] of [
      [leftArm, -1],
      [rightArm, 1],
    ] as const) {
      const folio = box(
        "floating folio cover",
        side * 0.1,
        0.05,
        -0.1,
        0.72,
        1.25,
        0.22,
        shell,
        pivot,
      );
      folio.rotation.z = side * -0.18;
      const pages = box(
        "folio pages",
        side * 0.1,
        0.05,
        -0.24,
        0.61,
        1.1,
        0.08,
        signal,
        pivot,
      );
      pages.rotation.z = side * -0.18;
    }
  } else if (kind === "warden") {
    // A gate on four heavy pylons, with a shield dominating one side.
    box("gate body", 0, 1.45, 0, 1.55, 1.65, 1.15, alloy);
    box("narrow slit", 0, 2.05, -0.61, 0.95, 0.14, 0.1, signal);
    for (const side of [-1, 1]) {
      box("gate battlement", side * 0.58, 2.67, 0, 0.38, 0.9, 0.6, shell);
      for (const z of [-0.38, 0.38])
        box("pylon foot", side * 0.63, 0.35, z, 0.5, 0.65, 0.5, shell);
    }
    box("tower shield", -0.12, -0.1, -0.42, 0.8, 1.9, 0.2, shell, leftArm);
    box("shield stripe", -0.12, -0.1, -0.55, 0.12, 1.7, 0.06, signal, leftArm);
    for (let i = 0; i < 3; i++)
      box(
        "blocked port",
        -0.12,
        -0.65 + i * 0.55,
        -0.59,
        0.52,
        0.25,
        0.06,
        alloy,
        leftArm,
      );
    for (let i = 0; i < 4; i++)
      box(
        "firewall brick",
        i % 2 ? 0.24 : -0.24,
        0.93 + i * 0.29,
        -0.62,
        0.65,
        0.21,
        0.08,
        shell,
      );
    box("breaker hammer", 0, -0.15, 0, 0.2, 1.25, 0.2, shell, rightArm);
    box("hammer block", 0, 0.45, 0, 0.75, 0.45, 0.55, signal, rightArm);
  } else if (kind === "mimic") {
    // A phishing mask dangles a counterfeit credential from a visible hook.
    const mask = box("mask left", -0.36, 2.1, -0.1, 0.62, 1.5, 0.3, alloy);
    mask.rotation.z = -0.12;
    const half = box("mask right", 0.36, 2.02, 0.03, 0.62, 1.45, 0.3, shell);
    half.rotation.z = 0.12;
    box("left eye", -0.34, 2.27, -0.29, 0.35, 0.13, 0.06, signal);
    box("right eye", 0.34, 2.26, -0.17, 0.35, 0.13, 0.06, signal);
    box("false smile", 0.09, 1.76, -0.22, 0.58, 0.08, 0.08, signal).rotation.z =
      -0.13;
    ring("broken collar", 0, 1.1, 0.1, 1.55, 0.1, alloy).rotation.x = 0;
    for (const [pivot, side] of [
      [leftArm, -1],
      [rightArm, 1],
    ] as const) {
      for (let i = 0; i < 3; i++) {
        const fragment = shard(
          "mask fragment",
          side * (0.12 + i * 0.1),
          (i - 1) * 0.48,
          0.1,
          0.22,
          i % 2 ? signal : alloy,
          pivot,
        );
        fragment.scaling.set(0.7, 1.4, 0.45);
      }
    }
    box("phishing line", 0.35, 0.3, -0.32, 0.055, 1.4, 0.055, signal, rightArm);
    const hookPath = Array.from({ length: 13 }, (_, i) => {
      const angle = (Math.PI * i) / 12;
      return new Vector3(
        0.13 + Math.cos(angle) * 0.22,
        -0.4 - Math.sin(angle) * 0.22,
        -0.32,
      );
    });
    place(
      MeshBuilder.CreateTube(
        "mimic phishing hook",
        { path: hookPath, radius: 0.045, tessellation: 6 },
        scene,
      ),
      0,
      0,
      0,
      signal,
      rightArm,
    );
    box("counterfeit credential", -0.58, 0.75, -0.32, 0.72, 0.52, 0.1, alloy);
    box("credential portrait", -0.77, 0.8, -0.39, 0.18, 0.22, 0.04, shell);
    box("credential forged seal", -0.42, 0.75, -0.39, 0.23, 0.06, 0.04, signal);
  } else if (kind === "decoy") {
    // A swarm of spam windows, each pretending to be the one worth clicking.
    for (let i = 0; i < 3; i++) {
      const x = (i - 1) * 0.57,
        y = 1.65 + (i % 2) * 0.55,
        z = (1 - i) * 0.2;
      box("spam popup window", x, y, z, 1.55, 1.35, 0.12, shell);
      box("popup title bar", x, y + 0.5, z - 0.09, 1.46, 0.21, 0.08, alloy);
      box(
        "fake close button",
        x + 0.57,
        y + 0.5,
        z - 0.15,
        0.15,
        0.13,
        0.045,
        signal,
      );
      box(
        "spam subject",
        x - 0.1,
        y + 0.12,
        z - 0.09,
        1.02,
        0.09,
        0.045,
        signal,
      );
      box("spam lure", x, y - 0.13, z - 0.09, 0.95, 0.07, 0.045, alloy);
      box("fake download", x, y - 0.4, z - 0.09, 0.65, 0.2, 0.045, signal);
    }
    shard(
      "popup cursor claw",
      0,
      -0.4,
      -0.35,
      0.32,
      signal,
      leftArm,
    ).scaling.set(0.7, 1.6, 0.3);
    shard(
      "popup cursor claw",
      0,
      0.4,
      -0.35,
      0.32,
      signal,
      rightArm,
    ).scaling.set(0.7, 1.6, 0.3);
  } else if (kind === "echo") {
    // The escaped program is now a fragmented network worm, not a robot chassis.
    for (let i = 0; i < 7; i++) {
      const segment = shard(
        "worm segment",
        Math.sin(i * 0.9) * 0.58,
        0.72 + i * 0.36,
        Math.cos(i * 0.9) * 0.16,
        0.35 + i * 0.017,
        i % 2 ? alloy : shell,
      );
      segment.rotation.z = Math.cos(i * 0.9) * 0.5;
      box(
        "segment packet seam",
        segment.position.x,
        segment.position.y,
        segment.position.z - 0.34,
        0.38,
        0.075,
        0.045,
        signal,
      );
    }
    const headX = Math.sin(6 * 0.9) * 0.58;
    for (const side of [-1, 1]) {
      sphere("worm eye", headX + side * 0.18, 2.98, -0.35, 0.18, signal);
      box(
        "worm antenna",
        headX + side * 0.25,
        3.34,
        0,
        0.06,
        0.5,
        0.06,
        signal,
      ).rotation.z = side * -0.4;
    }
    ring("network route ring", 0, 1.85, 0.4, 2.9, 0.055, alloy);
    for (const [pivot, side] of [
      [leftArm, -1],
      [rightArm, 1],
    ] as const) {
      for (let i = 0; i < 2; i++) {
        const fragment = shard(
          "fragmented packet",
          side * (0.2 + i * 0.11),
          -0.5 + i * 1.1,
          0.12,
          0.32,
          i % 2 ? shell : alloy,
          pivot,
        );
        fragment.scaling.set(0.5, 1.6, 0.4);
        fragment.rotation.z = side * (0.25 + i * 0.12);
      }
    }
  } else {
    // The original patrol sentinel remains the one grounded humanoid chassis.
    box("torso", 0, 1.55, 0, 1.35, 1.5, 0.85, alloy);
    box("chest plate", 0, 1.6, -0.48, 1.05, 0.9, 0.15, shell);
    box("head", 0, 2.7, 0, 1.05, 0.7, 0.8, shell);
    box("visor", 0, 2.76, -0.43, 0.84, 0.16, 0.06, signal);
    for (const [pivot, side] of [
      [leftArm, -1],
      [rightArm, 1],
    ] as const) {
      box("arm", 0, -0.35, 0, 0.42, 1.05, 0.55, alloy, pivot);
      box("hand", 0, -0.98, 0, 0.5, 0.3, 0.6, shell, pivot);
      box("leg", side * 0.43, 0.58, 0, 0.48, 0.75, 0.6, alloy);
      box("foot", side * 0.43, 0.22, -0.16, 0.6, 0.2, 0.9, shell);
    }
  }
  return { root, leftArm, rightArm, materials, meshes, archetype: kind };
}
