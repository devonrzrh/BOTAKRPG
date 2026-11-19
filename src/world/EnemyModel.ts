import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { VertexData } from "@babylonjs/core/Meshes/mesh.vertexData";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import type { Scene } from "@babylonjs/core/scene";

import { enemyArchetype } from "../game/enemyIdentity";
import echoMesh from "./echoMesh.json";
import sentinelMesh from "./sentinelMesh.json";
export { enemyArchetype, enemyThreatName } from "../game/enemyIdentity";

/** Each enemy has its own silhouette, not a reskinned humanoid. Scene owns the rig. */
export function buildEnemyModel(scene: Scene, id: string) {
  const kind = enemyArchetype(id);
  const palettes = {
    echo: ["#3c5666", "#64848f", "#8adce7"],
    warden: ["#433025", "#bd8b51", "#ffc368"],
    keeper: ["#302b48", "#9d88be", "#d4b9ff"],
    mimic: ["#16424a", "#72c9c8", "#d5ffff"],
    interceptor: ["#44232b", "#b66966", "#ff8b70"],
    drone: ["#513324", "#c99c65", "#94dbff"],
    decoy: ["#143d40", "#62b7b3", "#a5fff1"],
    sentinel: ["#293c47", "#839ca3", "#e3b66e"],
    mantis: ["#203937", "#8aac69", "#d9ff92"],
    ram: ["#2b3a46", "#cb7044", "#ffcf85"],
    weaver: ["#322740", "#a17eaa", "#efafff"],
    array: ["#243145", "#82a3cc", "#a7ebff"],
  };
  const materials = palettes[kind].map((color, i) => {
    const material = new StandardMaterial(
      `${kind} ${["shell", "alloy", "signal"][i]}`,
      scene,
    );
    material.diffuseColor = Color3.FromHexString(color);
    material.emissiveColor = material.diffuseColor.scale(i === 2 ? 0.6 : 0.08);
    material.specularColor = material.diffuseColor.scale(i === 1 ? 0.65 : 0.22);
    material.specularPower = 42;
    return material;
  });
  const [shell, alloy, signal] = materials;
  const root = new TransformNode("enemy combat rig", scene);
  root.position.set(5, 0, 4);
  root.metadata = { archetype: kind };
  const leftArm = new TransformNode("left shoulder pivot", scene);
  const rightArm = new TransformNode("right shoulder pivot", scene);
  let sentinelHead: TransformNode | undefined;
  let echoHead: TransformNode | undefined;
  for (const [pivot, side] of [
    [leftArm, -1],
    [rightArm, 1],
  ] as const) {
    pivot.parent = root;
    pivot.position.set(side * 1.05, 1.8, 0);
  }
  const meshes: Mesh[] = [];
  const joints: TransformNode[] = [];
  const joint = (name: string, x: number, y: number, z: number) => {
    const pivot = new TransformNode(`${kind} ${name}`, scene);
    pivot.parent = root;
    pivot.position.set(x, y, z);
    joints.push(pivot);
    return pivot;
  };
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
  const armorPlate = (
    name: string,
    x: number,
    y: number,
    z: number,
    width: number,
    height: number,
    depth: number,
    material = alloy,
    parent = root,
  ) => {
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    const cut = Math.min(width, height) * 0.19;
    // Octagonal rim with a recessed edge and a beveled face.
    const outline = [
      [-halfWidth + cut, -halfHeight],
      [-halfWidth, -halfHeight + cut],
      [-halfWidth, halfHeight - cut],
      [-halfWidth + cut, halfHeight],
      [halfWidth - cut, halfHeight],
      [halfWidth, halfHeight - cut],
      [halfWidth, -halfHeight + cut],
      [halfWidth - cut, -halfHeight],
    ];
    const positions: number[] = [];
    const indices: number[] = [];
    const face = (points: number[][]) => {
      const offset = positions.length / 3;
      positions.push(...points.flat());
      for (let i = 1; i < points.length - 1; i++)
        indices.push(offset, offset + i, offset + i + 1);
    };
    const front = outline.map(([u, v]) => [u * 0.84, v * 0.88, -depth / 2]);
    const rim = outline.map(([u, v]) => [u, v, -depth * 0.16]);
    const back = outline.map(([u, v]) => [u * 0.92, v * 0.96, depth / 2]);
    face([...front].reverse());
    face(back);
    for (const [outer, inner] of [
      [front, rim],
      [rim, back],
    ]) {
      for (let i = 0; i < outline.length; i++) {
        const next = (i + 1) % outline.length;
        face([outer[i], outer[next], inner[next], inner[i]]);
      }
    }
    const vertices = new VertexData();
    vertices.positions = positions;
    vertices.indices = indices;
    vertices.normals = [];
    VertexData.ComputeNormals(positions, indices, vertices.normals);
    const mesh = new Mesh(`${kind} ${name}`, scene);
    vertices.applyToMesh(mesh);
    return place(mesh, x, y, z, material, parent);
  };
  const ring = (
    name: string,
    x: number,
    y: number,
    z: number,
    diameter: number,
    thickness: number,
    material = signal,
    parent = root,
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
      parent,
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
  const loadPart = (
    name: string,
    part: (typeof echoMesh.parts)[number],
    pivot: TransformNode,
  ) => {
    const mesh = new Mesh(`${kind} ${name}`, scene);
    const vertices = new VertexData();
    vertices.positions = part.positions;
    vertices.normals = part.normals;
    vertices.indices = part.indices;
    vertices.applyToMesh(mesh);
    place(mesh, 0, 0, 0, materials[part.material], pivot);
  };
  const tube = (
    name: string,
    points: [number, number, number][],
    radius: number,
    material = alloy,
    parent = root,
  ) =>
    place(
      MeshBuilder.CreateTube(
        `${kind} ${name}`,
        {
          path: points.map(([x, y, z]) => new Vector3(x, y, z)),
          radius,
          tessellation: 6,
        },
        scene,
      ),
      0,
      0,
      0,
      material,
      parent,
    );

  if (kind === "mantis") {
    armorPlate("split thorax", 0, 1.63, 0.08, 0.65, 1.48, 0.8, shell);
    const head = joint("optics swivel", 0, 2.56, -0.17);
    armorPlate("mantis crown", 0, 0, 0, 0.93, 0.53, 0.57, alloy, head);
    for (const [pivot, side] of [
      [leftArm, -1],
      [rightArm, 1],
    ] as const) {
      armorPlate(
        "split optic",
        side * 0.22,
        0.01,
        -0.29,
        0.29,
        0.14,
        0.09,
        signal,
        head,
      ).rotation.z = side * 0.35;
      tube(
        "antenna",
        [
          [side * 0.26, 0.16, -0.06],
          [side * 0.45, 0.47, -0.03],
          [side * 0.63, 0.62, 0.09],
        ],
        0.029,
        alloy,
        head,
      );
      pivot.position.set(side * 0.56, 2.13, -0.1);
      tube(
        "scythe linkage",
        [
          [0, 0, 0],
          [side * 0.8, 0.35, 0.05],
          [side * 0.97, 0.12, -0.06],
        ],
        0.1,
        shell,
        pivot,
      );
      const scythe = shard(
        "folding scythe",
        side * 0.92,
        -0.41,
        -0.19,
        0.68,
        alloy,
        pivot,
      );
      scythe.scaling.set(0.39, 1.5, 0.3);
      scythe.rotation.z = side * -0.31;
      tube(
        "scythe edge",
        [
          [side * 0.85, 0.21, -0.23],
          [side * 1.11, -0.22, -0.23],
          [side * 0.75, -1.18, -0.23],
        ],
        0.035,
        signal,
        pivot,
      );
      for (const z of [0.08, 0.76]) {
        tube(
          "folded stilt",
          [
            [side * 0.24, 1.42, z],
            [side * 0.69, 0.91, z + 0.12],
            [side * 0.87, 0.12, z - 0.22],
          ],
          0.085,
          alloy,
        );
        armorPlate(
          "stilt shoe",
          side * 0.87,
          0.13,
          z - 0.22,
          0.34,
          0.22,
          0.41,
          shell,
        );
      }
    }
  } else if (kind === "ram") {
    armorPlate("tracked chassis", 0, 0.7, 0.2, 2.13, 0.96, 1.76, shell);
    for (const [pivot, side] of [
      [leftArm, -1],
      [rightArm, 1],
    ] as const) {
      pivot.position.set(side * 0.97, 0.56, 0.22);
      armorPlate("track housing", 0, 0, 0, 0.64, 0.91, 1.92, alloy, pivot);
      armorPlate("track bumper", 0, 0, -0.91, 0.48, 0.66, 0.22, shell, pivot);
      for (let i = -1; i <= 1; i++) {
        box("track grip", 0, i * 0.19, -1.06, 0.36, 0.07, 0.07, alloy, pivot);
      }
    }
    armorPlate("hydraulic collar", 0, 1.24, 0.06, 1.76, 0.96, 1.38, alloy);
    const piston = joint("hydraulic piston", 0, 1.1, -0.55);
    armorPlate("battering plate", 0, 0, -0.36, 1.61, 0.86, 0.42, alloy, piston);
    armorPlate("ram face", 0, 0, -0.59, 1.32, 0.56, 0.16, shell, piston);
    for (const side of [-1, 1]) {
      tube(
        "hydraulic rod",
        [
          [side * 0.62, 0.14, -0.44],
          [side * 0.62, 0.14, 0.7],
        ],
        0.1,
        alloy,
        piston,
      );
      box(
        "pressure gauge",
        side * 0.33,
        0,
        -0.68,
        0.29,
        0.12,
        0.045,
        signal,
        piston,
      );
    }
    for (let i = 0; i < 3; i++) {
      const tier = joint("buffer tier", 0, 1.65 + i * 0.3, 0.18);
      armorPlate(
        "stacked buffer",
        0,
        0,
        0,
        1.5 - i * 0.27,
        0.27,
        0.83,
        i === 1 ? shell : alloy,
        tier,
      );
      box(
        "buffer slot",
        0,
        0,
        -0.43,
        0.62 - i * 0.1,
        0.065,
        0.07,
        signal,
        tier,
      );
    }
  } else if (kind === "weaver") {
    const spindle = joint("spindle", 0, 1.89, 0.08);
    shard("spindle housing", 0, 0, 0, 0.71, shell, spindle).scaling.set(
      1.15,
      1.45,
      0.8,
    );
    ring("thread spool", 0, 0, -0.38, 0.99, 0.12, alloy, spindle);
    shard("central node", 0, 0, -0.49, 0.39, signal, spindle).scaling.set(
      1,
      1,
      0.58,
    );
    for (const [pivot, side] of [
      [leftArm, -1],
      [rightArm, 1],
    ] as const) {
      pivot.position.set(side * 0.37, 1.88, 0.18);
      for (let i = 0; i < 3; i++) {
        const y = 1.1 - i * 0.91;
        const reach = side * (i === 1 ? 1.55 : 1.24);
        tube(
          "articulated edge",
          [
            [0, 0, 0],
            [reach * 0.55, y * 0.68 + 0.12, 0],
            [reach, y, -0.16],
          ],
          0.069,
          alloy,
          pivot,
        );
        const node = shard(
          "terminal node",
          reach,
          y,
          -0.16,
          0.23,
          signal,
          pivot,
        );
        node.scaling.set(1, 1, 0.7);
        if (i < 2)
          tube(
            "tensioned filament",
            [
              [reach, y, -0.16],
              [side * (i === 0 ? 1.55 : 1.24), y - 0.91, -0.16],
            ],
            0.02,
            signal,
            pivot,
          );
      }
    }
  } else if (kind === "array") {
    const core = joint("inference core", 0, 1.92, -0.1);
    shard("suspended core", 0, 0, 0, 0.63, signal, core).scaling.set(
      0.61,
      1.26,
      0.55,
    );
    ring("core gimbal", 0, 0, 0, 1.32, 0.09, alloy, core);
    const crown = joint("upper receiver", 0, 2.96, 0.31);
    leftArm.position.set(-1.16, 1.66, 0.25);
    rightArm.position.set(1.16, 1.66, 0.25);
    for (const [index, pivot] of [leftArm, rightArm, crown].entries()) {
      pivot.rotation.z = [0.36, -0.36, 0][index];
      armorPlate("receiver housing", 0, 0, 0, 1.03, 1.02, 0.54, shell, pivot);
      armorPlate(
        "receiver shroud",
        0,
        0.09,
        -0.24,
        0.94,
        0.63,
        0.24,
        alloy,
        pivot,
      );
      ring("receiver lens", 0, 0.06, -0.39, 0.46, 0.09, signal, pivot);
      sphere("receiver iris", 0, 0.06, -0.4, 0.26, signal, pivot).scaling.z =
        0.5;
      box(
        "receiver heatsink",
        0,
        -0.28,
        -0.28,
        0.51,
        0.065,
        0.08,
        alloy,
        pivot,
      );
    }
  } else if (kind === "interceptor") {
    // A packet-sniffing spider: swept claws surround stolen packet fragments.
    const core = shard("dart core", 0, 1.8, 0, 0.65);
    core.scaling.set(0.75, 0.65, 1.65);
    armorPlate("optical housing", 0, 1.8, -0.76, 0.87, 0.53, 0.42);
    armorPlate("target lens", 0, 1.8, -1.01, 0.62, 0.2, 0.1, signal);
    for (const [pivot, side] of [
      [leftArm, -1],
      [rightArm, 1],
    ] as const) {
      const blade = armorPlate(
        "swept blade",
        side * 0.05,
        0,
        0.2,
        1.5,
        0.85,
        0.22,
        alloy,
        pivot,
      );
      blade.rotation.set(1.15, side * -0.46, side * -0.18);
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
        armorPlate(
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
    ring("machined rim", 0, 1.9, -0.15, 1.82, 0.09, shell);
    ring("lens bezel", 0, 1.9, -0.27, 0.89, 0.11);
    sphere("dark socket", 0, 1.9, -0.23, 0.85, shell).scaling.z = 0.32;
    sphere("single iris", 0, 1.9, -0.39, 0.5, signal).scaling.z = 0.3;
    for (let i = 0; i < 7; i++) {
      const angle = (i * Math.PI * 2) / 7;
      const chip = armorPlate(
        "cookie chip",
        Math.cos(angle) * 0.7,
        1.9 + Math.sin(angle) * 0.7,
        -0.23,
        0.26,
        0.15,
        0.15,
        shell,
      );
      chip.rotation.z = angle + Math.PI / 2;
    }
    ring("vertical gyroscope", 0, 1.9, 0, 2.5, 0.12, alloy);
    const orbit = ring("cross gyroscope", 0, 1.9, 0, 2.5, 0.09);
    orbit.rotation.set(0, 0, 0.4);
    for (const pivot of [leftArm, rightArm])
      box("sensor boom", 0, -0.25, 0, 0.22, 0.8, 0.22, shell, pivot);
  } else if (kind === "keeper") {
    // An archive shrine: stacked drawers, floating folios and a crowned keyhole.
    armorPlate("archive plinth", 0, 0.36, 0, 1.58, 0.52, 1.1, shell);
    armorPlate("archive cabinet", 0, 1.58, 0, 1.42, 2.32, 0.98);
    armorPlate("archive crown", 0, 2.67, 0, 1.58, 0.33, 1.0, shell);
    for (const side of [-1, 1]) {
      armorPlate(
        "cabinet frame rail",
        side * 0.62,
        1.57,
        -0.5,
        0.15,
        2.04,
        0.2,
      );
      armorPlate(
        "crown buttress",
        side * 0.66,
        2.78,
        -0.02,
        0.3,
        0.55,
        0.54,
      ).rotation.z = side * -0.24;
    }
    ring("key halo", 0, 2.99, 0.12, 0.87, 0.063, alloy);
    for (let i = 0; i < 4; i++) {
      const drawer = joint("drawer slide", 0, 0.88 + i * 0.43, -0.49);
      armorPlate("drawer", 0, 0, 0, 1.08, 0.38, 0.43, shell, drawer);
      box("drawer seal", 0.28, 0, -0.23, 0.15, 0.065, 0.045, signal, drawer);
      box("cache file tab", -0.23, 0, -0.23, 0.32, 0.065, 0.11, alloy, drawer);
    }
    shard("crown key", 0, 2.99, -0.06, 0.31, signal).scaling.set(
      0.72,
      1.48,
      0.68,
    );
    for (const [pivot, side] of [
      [leftArm, -1],
      [rightArm, 1],
    ] as const) {
      const folio = armorPlate(
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
      const pages = armorPlate(
        "folio pages",
        side * 0.1,
        0.05,
        -0.24,
        0.61,
        1.1,
        0.08,
        alloy,
        pivot,
      );
      pages.rotation.z = side * -0.18;
      box(
        "folio illuminated clasp",
        side * 0.1,
        0.05,
        -0.3,
        0.14,
        0.5,
        0.07,
        signal,
        pivot,
      ).rotation.z = side * -0.18;
    }
  } else if (kind === "warden") {
    // A gate on four heavy pylons, with a shield dominating one side.
    armorPlate("gate body", 0, 1.51, 0, 1.76, 1.71, 1.18);
    armorPlate("gate visor housing", 0, 2.06, -0.54, 1.38, 0.47, 0.25, shell);
    box("narrow slit", 0, 2.06, -0.681, 1.04, 0.095, 0.044, signal);
    for (const side of [-1, 1]) {
      armorPlate(
        "gate battlement",
        side * 0.62,
        2.58,
        0,
        0.48,
        0.82,
        0.68,
        shell,
      );
      for (const z of [-0.4, 0.39]) {
        const foot = armorPlate(
          "pylon foot",
          side * 0.64,
          0.45,
          z,
          0.58,
          0.9,
          0.57,
          shell,
        );
        foot.rotation.z = side * 0.17;
      }
    }
    armorPlate(
      "tower shield",
      -0.14,
      -0.1,
      -0.43,
      1.06,
      2.16,
      0.32,
      alloy,
      leftArm,
    );
    armorPlate(
      "shield inset",
      -0.14,
      -0.1,
      -0.6,
      0.85,
      1.92,
      0.13,
      shell,
      leftArm,
    );
    for (const side of [-1, 1]) {
      armorPlate(
        "shield brace",
        -0.14 + side * 0.36,
        -0.1,
        -0.68,
        0.12,
        1.66,
        0.14,
        alloy,
        leftArm,
      );
      armorPlate("pylon toe", side * 0.74, 0.14, -0.68, 0.56, 0.26, 0.49);
    }
    box("shield bus", -0.14, -0.1, -0.676, 0.06, 1.6, 0.035, signal, leftArm);
    for (let i = 0; i < 3; i++)
      box(
        "blocked port",
        -0.14,
        -0.65 + i * 0.55,
        -0.7,
        0.56,
        0.13,
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
    armorPlate(
      "hammer block",
      0.12,
      0.45,
      0,
      0.97,
      0.64,
      0.72,
      alloy,
      rightArm,
    );
    armorPlate(
      "hammer core",
      0.12,
      0.45,
      -0.37,
      0.52,
      0.3,
      0.12,
      signal,
      rightArm,
    );
  } else if (kind === "mimic") {
    // A phishing mask dangles a counterfeit credential from a visible hook.
    const mask = joint("left mask hinge", -0.34, 2.1, -0.1);
    const half = joint("right mask hinge", 0.33, 2.02, 0.03);
    mask.rotation.z = -0.12;
    half.rotation.z = 0.12;
    armorPlate("mask left", 0, 0, 0, 0.72, 1.55, 0.44, alloy, mask);
    armorPlate("mask right", 0, 0, 0, 0.72, 1.48, 0.44, shell, half);
    armorPlate("left eye", 0, 0.17, -0.24, 0.35, 0.14, 0.07, signal, mask);
    armorPlate("right eye", 0, 0.24, -0.24, 0.35, 0.14, 0.07, signal, half);
    box(
      "false smile",
      -0.1,
      -0.26,
      -0.24,
      0.4,
      0.08,
      0.08,
      signal,
      half,
    ).rotation.z = -0.25;
    shard("concealed core", 0, 2.04, 0.24, 0.36, signal).scaling.set(
      0.78,
      1.59,
      0.51,
    );
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
    const badge = joint("forged badge", -0.58, 0.75, -0.32);
    box("counterfeit credential", 0, 0, 0, 0.72, 0.52, 0.1, alloy, badge);
    box(
      "credential portrait",
      -0.19,
      0.05,
      -0.07,
      0.18,
      0.22,
      0.04,
      shell,
      badge,
    );
    box(
      "credential forged seal",
      0.16,
      0,
      -0.07,
      0.23,
      0.06,
      0.04,
      signal,
      badge,
    );
  } else if (kind === "decoy") {
    // A swarm of spam windows, each pretending to be the one worth clicking.
    for (let i = 0; i < 3; i++) {
      const panel = joint(
        "popup hinge",
        (i - 1) * 0.73,
        1.65 + (i % 2) * 0.55,
        (1 - i) * 0.26,
      );
      panel.rotation.set(0, (i - 1) * 0.24, (i - 1) * 0.12);
      armorPlate("spam popup window", 0, 0, 0, 1.55, 1.35, 0.24, shell, panel);
      armorPlate(
        "popup title bar",
        0,
        0.5,
        -0.13,
        1.34,
        0.21,
        0.1,
        alloy,
        panel,
      );
      box(
        "fake close button",
        0.57,
        0.5,
        -0.19,
        0.15,
        0.13,
        0.045,
        signal,
        panel,
      );
      box("spam subject", -0.1, 0.12, -0.135, 1.02, 0.09, 0.045, signal, panel);
      box("spam lure", 0, -0.13, -0.135, 0.95, 0.07, 0.045, alloy, panel);
      armorPlate(
        "fake download",
        0,
        -0.4,
        -0.135,
        0.65,
        0.2,
        0.045,
        signal,
        panel,
      );
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
    const pivots: Record<string, TransformNode> = {
      body: root,
      left: leftArm,
      right: rightArm,
    };
    for (const [name, [x, y, z]] of Object.entries(echoMesh.pivots)) {
      if (name === "body") continue;
      const pivot =
        pivots[name] ?? new TransformNode(`echo ${name} pivot`, scene);
      pivot.parent = root;
      pivot.position.set(x, y, z);
      pivots[name] = pivot;
      if (name === "head") echoHead = pivot;
    }
    for (const part of echoMesh.parts) {
      const name =
        part.rig === "head" && part.material === 2
          ? "visor"
          : `${part.rig} armor ${part.material}`;
      loadPart(name, part, pivots[part.rig]);
    }
    for (const side of [-1, 1]) {
      const fragment = joint(
        "detached shoulder plating",
        side * 1.11,
        2.79,
        0.2,
      );
      shard(
        "suspended armor fragment",
        0,
        0,
        0,
        0.42,
        alloy,
        fragment,
      ).scaling.set(0.62, 1.42, 0.58);
      box(
        "exposed chassis bus",
        0,
        -0.03,
        -0.16,
        0.06,
        0.46,
        0.055,
        signal,
        fragment,
      );
      fragment.rotation.z = side * -0.36;
    }
  } else {
    sentinelHead = new TransformNode("sentinel helmet swivel", scene);
    sentinelHead.parent = root;
    sentinelHead.position.y = 2.8;
    const pivots = {
      body: root,
      head: sentinelHead,
      left: leftArm,
      right: rightArm,
    };
    for (const part of sentinelMesh) {
      const pivot = pivots[part.rig as keyof typeof pivots];
      const name =
        part.rig === "head" && part.material === 2
          ? "visor"
          : `${part.rig} armor ${part.material}`;
      loadPart(name, part, pivot);
    }
    tube(
      "radio antenna",
      [
        [0.27, 0.16, 0.12],
        [0.44, 0.44, 0.11],
        [0.45, 0.6, 0.11],
      ],
      0.033,
      alloy,
      sentinelHead,
    );
    sphere("radio tip", 0.45, 0.6, 0.11, 0.105, signal, sentinelHead);
  }
  const rest = [...meshes, ...joints, leftArm, rightArm].map((node) => ({
    node,
    position: node.position.clone(),
    rotation: node.rotation.clone(),
    scaling: node.scaling.clone(),
  }));
  const resetIdle = () => {
    if (sentinelHead) sentinelHead.rotation.y = 0;
    if (echoHead) echoHead.rotation.setAll(0);
    for (const { node, position, rotation, scaling } of rest) {
      node.position.copyFrom(position);
      node.rotation.copyFrom(rotation);
      node.scaling.copyFrom(scaling);
    }
  };
  // Absolute poses avoid drift and let combat cues take over without competing observers.
  const animateIdle = (seconds: number) => {
    const breath = Math.sin(seconds * 1.8);
    const floating = [
      "drone",
      "interceptor",
      "mimic",
      "decoy",
      "weaver",
      "array",
    ].includes(kind);
    root.position.y += floating ? 0.08 + breath * 0.07 : 0;
    root.rotation.y +=
      Math.sin(seconds * 0.65) * (kind === "warden" ? 0.025 : 0.065);
    leftArm.rotation.z -= breath * (kind === "warden" ? 0.025 : 0.07);
    rightArm.rotation.z += Math.sin(seconds * 1.8 + 0.6) * 0.07;
    if (sentinelHead) sentinelHead.rotation.y = Math.sin(seconds * 0.8) * 0.2;
    if (echoHead) {
      echoHead.rotation.x = breath * 0.065;
      echoHead.rotation.y = Math.sin(seconds * 1.1) * 0.14;
    }
    switch (kind) {
      case "mantis":
        joints[0].rotation.y = Math.sin(seconds * 1.2) * 0.26;
        leftArm.rotation.y = breath * 0.13;
        rightArm.rotation.y = -breath * 0.13;
        break;
      case "ram":
        joints[0].position.z -= (1 + breath) * 0.045;
        joints.slice(1).forEach((tier, i) => {
          tier.position.y += Math.sin(seconds * 3 - i * 0.75) * 0.035;
        });
        leftArm.rotation.z = rightArm.rotation.z = 0;
        break;
      case "weaver":
        joints[0].rotation.z = seconds * 0.7;
        leftArm.rotation.y = Math.sin(seconds * 1.6) * 0.24;
        rightArm.rotation.y = Math.sin(seconds * 1.6 + 1.6) * -0.24;
        break;
      case "array":
        joints[0].rotation.y = seconds * 0.8;
        [leftArm, rightArm, joints[1]].forEach((receiver, i) => {
          receiver.position.y += Math.sin(seconds * 1.55 + i * 2) * 0.09;
          receiver.rotation.y = Math.sin(seconds * 1.1 + i * 1.8) * 0.19;
        });
        break;
      case "decoy":
        joints.forEach((panel, i) => {
          panel.position.y += Math.sin(seconds * 2.2 + i * 1.8) * 0.12;
          panel.rotation.y += Math.sin(seconds * 1.2 + i * 1.8) * 0.16;
        });
        break;
      case "mimic":
        joints[0].rotation.z -= breath * 0.07;
        joints[1].rotation.z += breath * 0.07;
        joints[2].rotation.z += breath * 0.14;
        break;
      case "echo":
        joints.forEach((fragment, i) => {
          fragment.position.y += Math.sin(seconds * 1.5 + i * 1.9) * 0.13;
          fragment.rotation.y += Math.sin(seconds * 1.2 + i) * 0.26;
        });
        break;
      case "interceptor":
        leftArm.rotation.y = Math.sin(seconds * 2.3) * 0.14;
        rightArm.rotation.y = -leftArm.rotation.y;
        break;
    }
    meshes.forEach((mesh, i) => {
      const name = mesh.name;
      if (kind === "drone") {
        if (name.includes("gyroscope"))
          mesh.rotation.y += seconds * (name.includes("cross") ? -0.65 : 0.45);
        if (name.includes("single iris"))
          mesh.position.x += Math.sin(seconds * 0.9) * 0.12;
      } else if (kind === "keeper") {
        if (name.includes("folio"))
          mesh.position.y +=
            Math.sin(seconds * 1.4 + (mesh.parent === leftArm ? 0 : 1.5)) *
            0.09;
        if (name.includes("crown key")) mesh.rotation.y += seconds * 0.5;
      } else if (kind === "interceptor" && name.includes("captured packet")) {
        mesh.position.y += Math.sin(seconds * 2.5 + i) * 0.1;
        mesh.rotation.y += seconds * 0.45;
      }
    });
  };
  const ease = (fraction: number) => {
    const x = Math.max(0, Math.min(1, fraction));
    return x * x * (3 - 2 * x);
  };
  // Land at the combat cue's impact beat, with a quick release from the wind-up.
  const animateAttack = (t: number, heavy: boolean, blocked: boolean) => {
    const force = (heavy ? 1 : 0.78) * (blocked ? 0.78 : 1);
    const wind = ease(t / 0.42) * (1 - ease((t - 0.42) / 0.2));
    const hit = ease((t - 0.42) / 0.2) * (1 - ease((t - 0.62) / 0.38));
    const strike = hit * force;
    switch (kind) {
      case "mantis":
        leftArm.rotation.y += wind * -0.78 + strike * 0.95;
        rightArm.rotation.y += wind * 0.78 - strike * 0.95;
        leftArm.rotation.z += wind * -0.48 + strike * 0.55;
        rightArm.rotation.z += wind * 0.48 - strike * 0.55;
        root.position.z -= strike * 0.52;
        break;
      case "ram":
        joints[0].position.z += wind * 0.36 - strike * 0.83;
        joints.slice(1).forEach((tier, i) => {
          tier.position.y += (i + 1) * (wind * 0.045 - strike * 0.055);
        });
        root.position.z += wind * 0.18 - strike * 0.57;
        break;
      case "weaver":
        leftArm.rotation.y += wind * -0.61 + strike * 0.86;
        rightArm.rotation.y += wind * 0.61 - strike * 0.86;
        leftArm.rotation.z += strike * 0.39;
        rightArm.rotation.z -= strike * 0.39;
        joints[0].rotation.z += wind * 0.7 + strike * 1.4;
        root.position.y += strike * 0.29;
        break;
      case "array":
        for (const [receiver, index] of [
          [leftArm, -1],
          [rightArm, 1],
          [joints[1], 0],
        ] as const) {
          receiver.position.x += index * (wind * 0.27 - strike * 0.34);
          receiver.position.y +=
            index === 0
              ? wind * 0.19 - strike * 0.35
              : -wind * 0.09 + strike * 0.16;
          receiver.rotation.y += index * wind * 0.62;
        }
        joints[0].rotation.y += wind * 1.3 + strike * 2.7;
        joints[0].position.z -= strike * 0.45;
        break;
      case "warden":
        leftArm.rotation.y += wind * 0.58 + strike * 0.35;
        rightArm.rotation.x += wind * 1.65 - strike * 1.32;
        root.rotation.x += strike * 0.19;
        break;
      case "keeper":
        joints.forEach((drawer, i) => {
          drawer.position.z -=
            Math.sin(Math.PI * ease((t - i * 0.085) / 0.6)) * force * 0.52;
        });
        leftArm.rotation.y += wind * -0.57 + strike * 0.9;
        rightArm.rotation.y += wind * 0.57 - strike * 0.9;
        leftArm.position.z -= strike * 0.45;
        rightArm.position.z -= strike * 0.45;
        break;
      case "mimic":
        joints[0].position.x -= wind * 0.32 + strike * 0.55;
        joints[1].position.x += wind * 0.32 + strike * 0.55;
        joints[0].rotation.y += strike * 0.82;
        joints[1].rotation.y -= strike * 0.82;
        joints[2].position.z -= strike * 0.65;
        rightArm.rotation.x += wind * 0.45 - strike * 1.6;
        break;
      case "decoy":
        joints.forEach((panel, i) => {
          const side = i - 1;
          panel.position.x += side * (wind * -0.37 + strike * 0.51);
          panel.position.z -= strike * (i === 1 ? 0.72 : 0.38);
          panel.rotation.y += side * (wind * 0.63 - strike * 0.35);
        });
        break;
      case "drone":
        root.rotation.z += wind * -0.44 + strike * 0.75;
        root.position.x += wind * -0.32 + strike * 0.32;
        root.position.z -= strike * 0.66;
        break;
      case "interceptor":
        leftArm.rotation.z += wind * -0.72 + strike * 0.2;
        rightArm.rotation.z += wind * 0.72 - strike * 0.2;
        root.rotation.x += wind * -0.25 + strike * 0.34;
        root.position.z -= strike * 0.68;
        break;
      case "echo":
        echoHead!.rotation.x = strike * 0.24;
        joints.forEach((fragment, i) => {
          fragment.position.x +=
            (i === 0 ? -1 : 1) * (wind * 0.42 + strike * 0.18);
          fragment.position.y += wind * 0.24;
        });
        leftArm.rotation.x -= wind * 0.57 + strike * 1.27;
        rightArm.rotation.x -= wind * 0.57 + strike * 1.27;
        root.position.z -= strike * 0.41;
        break;
      case "sentinel":
        leftArm.rotation.x += wind * 0.35 - strike * 1.34;
        rightArm.rotation.x -= strike * 0.49;
        root.rotation.y += wind * -0.26 + strike * 0.31;
        root.position.z -= strike * 0.33;
        break;
    }
  };
  return {
    root,
    leftArm,
    rightArm,
    materials,
    meshes,
    archetype: kind,
    animateIdle,
    animateAttack,
    resetIdle,
  };
}
