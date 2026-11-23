import { Scene } from "@babylonjs/core/scene";
import { UniversalCamera } from "@babylonjs/core/Cameras/universalCamera";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { PointLight } from "@babylonjs/core/Lights/pointLight";
import { attachSoftShadows } from "./SoftShadows";

export type HomeWall = "investigation" | "bookshelf" | "quests" | "desk";
export const deskOffsetZ = -1.03;
const deskEye = new Vector3(-0.48, 4.56, 0);
const roomEye = new Vector3(0, 2.2, 0);
const deskPitch = 0.94;
export const wallYaw: Record<HomeWall, number> = {
  investigation: 0,
  bookshelf: Math.PI / 2,
  quests: Math.PI,
  desk: Math.PI * 1.5,
};
export function shortestTurn(from: number, to: number) {
  return Math.atan2(Math.sin(to - from), Math.cos(to - from));
}

export function buildOffice(
  scene: Scene,
  surface: HTMLElement,
  state: () => {
    wall: HomeWall;
    reducedMotion: boolean;
    locked: boolean;
    reading?: boolean;
  },
  onCameraTurn?: () => void,
  shadows: () => boolean = () => false,
) {
  scene.clearColor = new Color4(0.025, 0.035, 0.045, 1);
  const camera = new UniversalCamera(
    "office first person",
    roomEye.clone(),
    scene,
  );
  camera.fov = 1.03;
  camera.minZ = 0.05;
  camera.rotation.y = wallYaw[state().wall];
  if (state().wall === "desk") {
    camera.position.copyFrom(deskEye);
    camera.rotation.x = deskPitch;
  }
  let previousWall = state().wall;
  const ambient = new HemisphericLight(
    "office ambient",
    new Vector3(0, 1, 0),
    scene,
  );
  ambient.intensity = 0.45;
  ambient.diffuse = Color3.FromHexString("#c8d8e6");
  ambient.groundColor = Color3.FromHexString("#717a86");

  const ceilingLight = new PointLight(
    "ceiling light",
    new Vector3(0.9, 4.1, -0.7),
    scene,
  );
  ceilingLight.intensity = 1.55;
  ceilingLight.range = 15;
  ceilingLight.diffuse = Color3.FromHexString("#ffe0b5");
  ceilingLight.specular = Color3.FromHexString("#e8cbac");
  const materials = new Map<string, StandardMaterial>();
  const mat = (color: string) => {
    if (materials.has(color)) return materials.get(color)!;
    const m = new StandardMaterial(color, scene);
    m.diffuseColor = Color3.FromHexString(color);
    m.specularColor = new Color3(0.06, 0.06, 0.06);
    materials.set(color, m);
    return m;
  };
  const box = (
    name: string,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    color: string,
    parent?: TransformNode,
  ) => {
    const mesh = MeshBuilder.CreateBox(
      name,
      { width: w, height: h, depth: d },
      scene,
    );
    mesh.position.set(x, y, z);
    mesh.material = mat(color);
    if (parent) mesh.parent = parent;
    return mesh;
  };
  mat("#d9ae70").emissiveColor = Color3.FromHexString("#a5642f");
  box("floor", 0, -0.12, 0, 11, 0.2, 11, "#332e2a");
  box("ceiling", 0, 4.7, 0, 11, 0.15, 11, "#17222a");
  for (let i = 0; i < 4; i++) {
    const wall = new TransformNode(`wall ${i}`, scene);
    wall.rotation.y = (i * Math.PI) / 2;
    box("plaster", 0, 2.3, 5.2, 10.5, 4.8, 0.25, "#29343a", wall);
    box("wainscot", 0, 0.55, 5.03, 10.5, 1.1, 0.14, "#20292e", wall);
    box("wood rail", 0, 1.14, 4.92, 10.5, 0.08, 0.14, "#54473b", wall);
    for (let x = -5; x <= 5; x += 1.25)
      box("wall seam", x, 2.8, 5.04, 0.018, 3.3, 0.02, "#1e2a31", wall);
    box(
      "sconce",
      -4,
      3.2,
      4.8,
      0.16,
      0.55,
      0.2,
      "#d9ae70",
      wall,
    );
    if (i === 0 || i === 2) {
      box(
        i === 0 ? "investigation board" : "quest board",
        0,
        2.5,
        4.82,
        7.5,
        4.1,
        0.18,
        i === 0 ? "#443a2d" : "#10181d",
        wall,
      );
      for (const y of [0.4, 4.6])
        box(
          "board frame",
          0,
          y,
          4.66,
          7.7,
          0.12,
          0.22,
          i === 0 ? "#74614a" : "#10181d",
          wall,
        );
      for (const x of [-3.8, 3.8])
        box(
          "board frame",
          x,
          2.5,
          4.66,
          0.12,
          4.3,
          0.22,
          i === 0 ? "#74614a" : "#10181d",
          wall,
        );
    } else if (i === 1) {
      box("bookshelf back", 0, 2.25, 4.86, 8, 4.3, 0.2, "#272b2c", wall);
      for (const x of [-4, 4])
        box("bookcase side", x, 2.25, 4.5, 0.18, 4.5, 0.9, "#584b3f", wall);
      for (let row = 0; row < 4; row++) {
        const y = 0.3 + row * 1.25;
        box("shelf", 0, y, 4.5, 8, 0.12, 0.95, "#71604b", wall);
        for (let n = 0; n < 25; n++) {
          if (
            row === 1 &&
            [-2.2, 0, 2.2].some((x) => Math.abs(-3.7 + n * 0.3 - x) < 0.65)
          )
            continue;
          const height = 0.42 + ((n * 7 + row * 3) % 8) * 0.045;
          const book = box(
            "reference book",
            -3.7 + n * 0.3,
            y + 0.09 + height / 2,
            4.45,
            0.22,
            height,
            0.55,
            ["#677d7d", "#957953", "#545e6c", "#8e6553"][n % 4],
            wall,
          );
          book.rotation.z = n % 9 === 0 ? 0.08 : 0;
        }
      }
    } else {
      const table = new TransformNode("detective table", scene);
      table.parent = wall;
      table.position.z = deskOffsetZ;
      const deskTop = box("desk top", 0, 1, 3.4, 6.2, 0.18, 2.7, "#64503e", table);
      for (const x of [-2.8, 2.8])
        box("drawers", x, 0.45, 3.6, 0.9, 0.9, 2, "#3a342f", table);
      const deskMat = box("desk mat", 0, 1.11, 3.1, 4, 0.025, 1.9, "#192a30", table);
      box("supply shelf", 0.38, 1.72, 4.42, 1.83, 0.12, 1.04, "#4b4438", wall);
      for (const x of [-0.2, 0.96])
        box("shelf bracket", x, 1.53, 4.74, 0.08, 0.29, 0.36, "#343b39", wall);

      for (const x of [-2.7, 2.7])
        for (const z of [2.3, 4.45])
          box("desk leg", x, 0.45, z, 0.14, 0.9, 0.14, "#3d3026", table);
      for (let n = 0; n < 3; n++) {
        box(
          "drawer front",
          -2.3,
          0.2 + n * 0.25,
          2.34,
          1.1,
          0.22,
          0.1,
          "#72553c",
          table,
        );
        box(
          "brass handle",
          -2.3,
          0.2 + n * 0.25,
          2.26,
          0.35,
          0.035,
          0.07,
          "#b39764",
          table,
        );
      }
      box("window frame", 0, 3.25, 4.98, 6.8, 2.15, 0.13, "#171e23", wall);
      box("night window", 0, 3.25, 4.87, 6.55, 1.96, 0.04, "#203b49", wall);
      for (let n = 0; n < 18; n++) {
        const h = 0.25 + ((n * 13) % 8) * 0.09;
        box(
          "city silhouette",
          -3 + n * 0.35,
          2.29 + h / 2,
          4.81,
          0.27,
          h,
          0.02,
          "#101c25",
          wall,
        );
      }
      for (const x of [-1.1, 1.1])
        box("window mullion", x, 3.25, 4.75, 0.05, 2, 0.08, "#171e23", wall);
      box("window crossbar", 0, 3.3, 4.75, 6.6, 0.05, 0.08, "#171e23", wall);
      const mug = MeshBuilder.CreateCylinder(
        "coffee cup",
        { diameter: 0.35, height: 0.4, tessellation: 24 },
        scene,
      );
      mug.parent = table;
      mug.position.set(2.85, 1.33, 4.05);
      mug.material = mat("#c0b294");
      const coffee = MeshBuilder.CreateCylinder(
        "coffee",
        { diameter: 0.3, height: 0.012, tessellation: 24 },
        scene,
      );
      coffee.parent = table;
      coffee.position.set(2.85, 1.54, 4.05);
      coffee.material = mat("#2b1d16");
      const handle = MeshBuilder.CreateTorus(
        "cup handle",
        { diameter: 0.26, thickness: 0.05, tessellation: 16 },
        scene,
      );
      handle.parent = table;
      handle.position.set(3.07, 1.34, 4.05);
      handle.rotation.z = Math.PI / 2;
      handle.material = mat("#c0b294");
      const deskProps = [mug, handle];
      for (const [x, color] of [
        [-2.9, "#739c8b"],
        [-2.55, "#a5895b"],
      ] as const) {
        const vial = MeshBuilder.CreateCylinder(
          "supply bottle",
          { diameter: 0.23, height: 0.47, tessellation: 16 },
          scene,
        );
        vial.parent = table;
        vial.position.set(x, 1.36, 4.3);
        vial.material = mat(color);
        const cap = box("bottle cap", x, 1.63, 4.3, 0.16, 0.1, 0.16, "#b5aa8c", table);
        deskProps.push(vial, cap);
      }
      // A working evidence tray makes the desk read as a detective's clue station.
      const tray = box("evidence tray", -2.75, 1.2, 3.25, 0.68, 0.16, 0.82, "#443b32", table);
      deskProps.push(tray);
      box("case folder", -2.75, 1.3, 3.25, 0.54, 0.08, 0.62, "#b29b6c", table);
      box("evidence sheet", -2.75, 1.35, 3.25, 0.44, 0.025, 0.47, "#d8c7a1", table);
      box("redacted evidence mark", -2.75, 1.368, 3.22, 0.24, 0.008, 0.045, "#964d39", table);
      box("lamp stem", -3, 1.9, 4.4, 0.05, 1.6, 0.05, "#b09566", table);
      box("lamp shade", -3, 2.65, 4.4, 0.8, 0.25, 0.5, "#957953", table);
      const deskLamp = new PointLight(
        "desk lamp",
        new Vector3(-3, 2.48, 4.18),
        scene,
      );
      deskLamp.parent = table;
      deskLamp.diffuse = Color3.FromHexString("#ffc27c");
      deskLamp.intensity = 1.25;
      deskLamp.range = 5.5;
      attachSoftShadows(
        deskLamp,
        new Vector3(0.6, -1, -0.35),
        deskProps,
        [deskTop, deskMat],
        shadows,
        true,
      );

      const windowLight = new PointLight(
        "night window fill",
        new Vector3(0, 3.55, 4.55),
        scene,
      );
      windowLight.parent = wall;
      windowLight.diffuse = Color3.FromHexString("#83b8ef");
      windowLight.intensity = 1.05;
      windowLight.range = 7;
    }
  }
  let px = 0,
    py = 0;
  const pointer = (event: PointerEvent) => {
    const r = surface.getBoundingClientRect();
    px = ((event.clientX - r.left) / r.width - 0.5) * 2;
    py = ((event.clientY - r.top) / r.height - 0.5) * 2;
  };
  const leave = () => {
    px = 0;
    py = 0;
  };
  surface.addEventListener("pointermove", pointer);
  surface.addEventListener("pointerleave", leave);
  const observer = scene.onBeforeRenderObservable.add(() => {
    const s = state(),
      frameTime = scene.getEngine().getDeltaTime() / 1000,
      dt = Math.min(0.05, frameTime);
    if (s.wall !== previousWall) {
      previousWall = s.wall;
      onCameraTurn?.();
    }
    const steady =
      s.reducedMotion ||
      s.locked ||
      (s.wall === "bookshelf" && s.reading) ||
      s.wall === "quests";
    const target = wallYaw[s.wall] + (steady ? 0 : px * 0.025);
    const turn = shortestTurn(camera.rotation.y, target);
    const blend = s.reducedMotion ? 1 : 1 - Math.exp(-dt * 19);
    const eye = s.wall === "desk" ? deskEye : roomEye;
    camera.position = Vector3.Lerp(
      camera.position,
      eye,
      s.reducedMotion ? 1 : 1 - Math.exp(-dt * 12),
    );
    camera.rotation.y += turn * blend;
    camera.rotation.x +=
      ((s.wall === "desk" ? deskPitch : 0) +
        (steady ? 0 : py * 0.018) -
        camera.rotation.x) *
      blend;
    if (
      s.reducedMotion ||
      Math.abs(shortestTurn(camera.rotation.y, target)) < 0.0015
    ) {
      camera.rotation.y = target;
    }
  });
  return () => {
    surface.removeEventListener("pointermove", pointer);
    surface.removeEventListener("pointerleave", leave);
    scene.onBeforeRenderObservable.remove(observer);
  };
}
