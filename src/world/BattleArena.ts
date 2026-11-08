import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { PointLight } from "@babylonjs/core/Lights/pointLight";
import type { Scene } from "@babylonjs/core/scene";
import { enemyArchetype } from "../game/enemyIdentity";

export function battleArenaKind(enemyId: string) {
  const kind = enemyArchetype(enemyId);
  if (kind === "echo") return "abandoned-subnet";
  if (kind === "warden") return "firewall";
  if (kind === "keeper" || kind === "drone") return "cache-vault";
  if (kind === "mimic" || kind === "decoy") return "browser-net";
  if (kind === "interceptor") return "packet-highway";
  return "gateway";
}

/** Static encounter sets keep the enemy's x=5,z=4 sightline clear. */
export function buildBattleArena(scene: Scene, enemyId: string) {
  const kind = battleArenaKind(enemyId);
  const themes = {
    "packet-highway": ["#101c2b", "#294352", "#68c5ed", "#101b2b"],
    "cache-vault": ["#1e182b", "#4b4162", "#bf9ae3", "#151020"],
    "browser-net": ["#101a25", "#26384c", "#53cbbb", "#0d1824"],
    firewall: ["#241d19", "#624b37", "#e5a15d", "#1b1512"],
    "abandoned-subnet": ["#10151c", "#29353d", "#b6505d", "#060a10"],
    gateway: ["#15202b", "#3e5666", "#73b8c3", "#101b27"],
  };
  const [floorColor, shellColor, accentColor, backgroundColor] = themes[kind];
  const previousBackground = scene.clearColor;
  const background = Color4.FromHexString(backgroundColor + "ff");
  scene.clearColor = background;
  const root = new TransformNode(`arena ${kind}`, scene);
  root.position.set(5, 0, 4);
  root.metadata = { arena: kind };
  const materials = [floorColor, shellColor, accentColor].map((color, i) => {
    const material = new StandardMaterial(
      `${kind} ${i === 2 ? "signal" : i === 1 ? "structure" : "floor"}`,
      scene,
    );
    material.diffuseColor = Color3.FromHexString(color);
    material.specularColor = new Color3(0.04, 0.04, 0.04);
    material.emissiveColor = material.diffuseColor.scale(i === 2 ? 0.5 : 0.025);
    return material;
  });
  const [floor, shell, accent] = materials;
  const meshes: Mesh[] = [];
  type Region = "floor" | "backdrop" | "side";
  const place = (
    mesh: Mesh,
    x: number,
    y: number,
    z: number,
    region: Region,
    material = shell,
  ) => {
    mesh.parent = root;
    mesh.position.set(x, y, z);
    mesh.material = material;
    mesh.isPickable = false;
    mesh.metadata = { arena: kind, region };
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
    region: Region = "backdrop",
    material = shell,
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
      region,
      material,
    );
  const platform = (
    name: string,
    diameter: number,
    vertices: number,
    y = -0.14,
    material = floor,
  ) =>
    place(
      MeshBuilder.CreateCylinder(
        `${kind} ${name}`,
        { diameter, height: 0.22, tessellation: vertices },
        scene,
      ),
      0,
      y,
      0,
      "floor",
      material,
    );
  const ring = (
    name: string,
    x: number,
    y: number,
    z: number,
    diameter: number,
    region: Region = "backdrop",
    material = accent,
  ) =>
    place(
      MeshBuilder.CreateTorus(
        `${kind} ${name}`,
        { diameter, thickness: 0.055, tessellation: 32 },
        scene,
      ),
      x,
      y,
      z,
      region,
      material,
    );

  if (kind === "packet-highway") {
    box("suspended causeway", 0, -0.24, 0, 7.8, 0.35, 15, "floor", floor);
    for (const x of [-2.7, -0.9, 0.9, 2.7])
      box("packet lane", x, -0.045, 0, 0.045, 0.025, 15, "floor", accent);
    for (const side of [-1, 1]) {
      box("raised conduit", side * 3.65, 0.28, 0.6, 0.35, 0.7, 12, "side");
      box(
        "conduit signal",
        side * 3.65,
        0.66,
        0.6,
        0.12,
        0.04,
        12,
        "side",
        accent,
      );
      for (let i = 0; i < 4; i++)
        box(
          "route port",
          side * 3.65,
          1.2 + i * 0.58,
          3.8,
          0.45,
          0.34,
          0.45,
          "backdrop",
          i % 2 ? accent : shell,
        );
    }
    box("conduit bridge", 0, 3.7, 3.8, 7.7, 0.25, 0.45);
    for (let i = 0; i < 5; i++) {
      box("packet hatch", (i - 2) * 1.25, 1.5, 4, 0.95, 2.5, 0.25);
      box(
        "route pulse",
        (i - 2) * 1.25,
        2.1 - (i % 3) * 0.3,
        3.84,
        0.55,
        0.12,
        0.05,
        "backdrop",
        accent,
      );
    }
  } else if (kind === "cache-vault") {
    platform("hexagonal vault dais", 7.2, 6);
    platform("inset storage seal", 4.8, 6, -0.015, shell);
    for (const x of [-3.25, 3.25]) {
      box("archive stack", x, 1.7, 2.2, 0.9, 3.6, 1.15, "side");
      for (let i = 0; i < 5; i++)
        box(
          "file slot",
          x,
          0.35 + i * 0.62,
          1.59,
          0.72,
          0.11,
          0.055,
          "side",
          accent,
        );
    }
    box("vault backplate", 0, 2.1, 4, 7.8, 4.4, 0.4);
    const vault = ring("circular archive lock", 0, 2, 3.72, 3.8);
    vault.rotation.x = Math.PI / 2;
    for (const x of [-2.9, 2.9])
      for (let i = 0; i < 4; i++) {
        box(
          "cache drawer",
          x,
          0.6 + i * 0.9,
          3.67,
          1.15,
          0.7,
          0.2,
          "backdrop",
          floor,
        );
        box(
          "drawer index",
          x,
          0.65 + i * 0.9,
          3.53,
          0.4,
          0.08,
          0.045,
          "backdrop",
          accent,
        );
      }
    box("vault axle", 0, 2, 3.52, 0.2, 1.3, 0.1, "backdrop", accent);
    box("vault latch", 0, 2, 3.5, 1.3, 0.2, 0.1, "backdrop", accent);
  } else if (kind === "browser-net") {
    box("browser grid plane", 0, -0.22, 0, 12, 0.3, 12, "floor", floor);
    for (let i = -3; i <= 3; i++) {
      box(
        "horizontal network trace",
        0,
        -0.05,
        i * 1.3,
        10,
        0.025,
        0.025,
        "floor",
        accent,
      );
      box(
        "vertical network trace",
        i * 1.3,
        -0.05,
        0,
        0.025,
        0.025,
        10,
        "floor",
        accent,
      );
    }
    for (let i = 0; i < 4; i++) {
      const x = (i - 1.5) * 1.5,
        y = 1.5 + (i % 2) * 1.4,
        z = 3.5 + i * 0.16;
      box("browser pane", x, y, z, 2.3, 1.8, 0.12);
      box(
        "browser titlebar",
        x,
        y + 0.72,
        z - 0.1,
        2.18,
        0.22,
        0.05,
        "backdrop",
        accent,
      );
      box(
        "browser address field",
        x - 0.2,
        y + 0.38,
        z - 0.1,
        1.65,
        0.15,
        0.05,
        "backdrop",
        floor,
      );
      box(
        "browser content",
        x,
        y - 0.15,
        z - 0.1,
        1.7,
        0.06,
        0.05,
        "backdrop",
        accent,
      );
      box(
        "browser close box",
        x + 0.9,
        y + 0.72,
        z - 0.14,
        0.12,
        0.12,
        0.04,
        "backdrop",
        floor,
      );
    }
    for (const side of [-1, 1]) {
      box(
        "window edge column",
        side * 3.8,
        1.8,
        2.3,
        0.28,
        3.6,
        0.28,
        "side",
        accent,
      );
    }
  } else if (kind === "firewall") {
    box("checkpoint foundation", 0, -0.2, 0, 10, 0.32, 11, "floor", floor);
    for (let i = -3; i <= 3; i++)
      box(
        "inspection stripe",
        i * 0.65,
        -0.025,
        -1.8,
        0.3,
        0.025,
        0.8,
        "floor",
        accent,
      );
    for (const side of [-1, 1]) {
      box("firewall gatepost", side * 3.3, 2, 3.5, 0.65, 4.1, 0.8);
      box("port barrier", side * 3.3, 1.2, 1, 0.42, 2.6, 0.55, "side");
      for (let i = 0; i < 3; i++)
        box(
          "inspection lamp",
          side * 3.3,
          0.65 + i * 0.57,
          0.69,
          0.2,
          0.13,
          0.055,
          "side",
          accent,
        );
    }
    box("gate lintel", 0, 4.05, 3.5, 7.2, 0.4, 0.8);
    for (let row = 0; row < 4; row++)
      for (const side of [-1, 1]) {
        box(
          "firewall brick",
          side * (1.55 + (row % 2) * 0.22),
          0.52 + row * 0.8,
          4,
          2.4,
          0.62,
          0.28,
        );
        box(
          "sealed port",
          side * 1.55,
          0.52 + row * 0.8,
          3.82,
          0.5,
          0.12,
          0.06,
          "backdrop",
          accent,
        );
      }
  } else if (kind === "abandoned-subnet") {
    platform("broken subnet island", 6.8, 8, -0.24);
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      const panel = box(
        "disconnected floor panel",
        Math.cos(angle) * 3.35,
        -0.12 - (i % 2) * 0.12,
        Math.sin(angle) * 3.35,
        0.8,
        0.16,
        1.25,
        "floor",
      );
      panel.rotation.y = angle;
    }
    for (let i = 0; i < 5; i++) {
      const x = (i - 2) * 1.6;
      box(
        "dead server monolith",
        x,
        0.95 + (i % 2) * 0.65,
        4,
        0.75,
        1.9 + (i % 2) * 1.3,
        0.7,
      );
      box(
        "last signal",
        x,
        1.45 + (i % 2) * 0.7,
        3.61,
        0.36,
        0.06,
        0.035,
        "backdrop",
        accent,
      );
    }
    for (const side of [-1, 1]) {
      box("cut uplink", side * 3.7, 2, 1.8, 0.12, 3.8, 0.12, "side");
      box("hanging cable", side * 3.45, 3.65, 2.2, 0.65, 0.08, 0.12, "side");
      box(
        "severed cable",
        side * 3.15,
        3.25,
        2.2,
        0.08,
        0.75,
        0.12,
        "side",
        accent,
      );
    }
  } else {
    platform("gateway pedestal", 7, 8);
    platform("inset gateway disc", 5, 16, -0.02, shell);
    ring("access ring", 0, 0.13, 0, 4.65, "floor");
    for (const side of [-1, 1]) {
      box("gateway tower", side * 3.2, 1.8, 3.6, 0.8, 3.6, 0.9);
      box(
        "gateway light strip",
        side * 3.2,
        1.8,
        3.1,
        0.12,
        3.3,
        0.06,
        "backdrop",
        accent,
      );
    }
    box("gateway arch", 0, 3.6, 3.6, 7.2, 0.35, 0.9);
    for (let i = 0; i < 5; i++)
      box("gateway socket", (i - 2) * 1.2, 1.65, 4.2, 0.6, 2.5, 0.25);
  }
  const key = new PointLight(`${kind} enemy key`, new Vector3(5, 3, 1), scene);
  key.diffuse = new Color3(0.63, 0.78, 0.86);
  key.intensity = 1.1;
  key.range = 10;
  const rim = new PointLight(
    `${kind} backdrop glow`,
    new Vector3(5, 3.8, 7),
    scene,
  );
  rim.diffuse = Color3.FromHexString(accentColor);
  rim.intensity = 0.45;
  rim.range = 7;
  const lights = [key, rim];
  let disposed = false;
  return {
    kind,
    root,
    meshes,
    materials,
    lights,
    dispose: () => {
      if (disposed) return;
      disposed = true;
      root.dispose();
      lights.forEach((light) => light.dispose());
      materials.forEach((material) => material.dispose());
      if (scene.clearColor === background)
        scene.clearColor = previousBackground;
    },
  };
}
