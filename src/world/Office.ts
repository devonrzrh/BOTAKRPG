import { Scene } from "@babylonjs/core/scene";
import { UniversalCamera } from "@babylonjs/core/Cameras/universalCamera";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { PointLight } from "@babylonjs/core/Lights/pointLight";

export type HomeWall = "investigation" | "bookshelf" | "quests" | "desk";
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
  state: () => { wall: HomeWall; reducedMotion: boolean; locked: boolean },
  interact: (id: string) => void,
) {
  scene.clearColor = new Color4(0.025, 0.035, 0.045, 1);
  const camera = new UniversalCamera(
    "office first person",
    new Vector3(0, 2.2, 0),
    scene,
  );
  camera.fov = 1.03;
  camera.minZ = 0.05;
  camera.rotation.y = wallYaw[state().wall];
  const ambient = new HemisphericLight(
    "office ambient",
    new Vector3(0, 1, 0),
    scene,
  );
  ambient.intensity = 0.45;
  ambient.diffuse = Color3.FromHexString("#adbac4");
  const light = new PointLight("ceiling light", new Vector3(0, 4.2, 0), scene);
  light.intensity = 1.4;
  light.diffuse = Color3.FromHexString("#edbe83");
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
    id?: string,
  ) => {
    const mesh = MeshBuilder.CreateBox(
      name,
      { width: w, height: h, depth: d },
      scene,
    );
    mesh.position.set(x, y, z);
    mesh.material = mat(color);
    if (parent) mesh.parent = parent;
    if (id) mesh.metadata = { interaction: id };
    return mesh;
  };
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
    const sconce = box(
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
    sconce.material = mat("#d9ae70");
    if (i === 0 || i === 2) {
      box(
        i === 0 ? "investigation board" : "quest board",
        0,
        2.5,
        4.82,
        7.5,
        4.1,
        0.18,
        i === 0 ? "#443a2d" : "#303d3d",
        wall,
        i === 0 ? "desk" : "quest",
      );
      for (const y of [0.4, 4.6])
        box("board frame", 0, y, 4.66, 7.7, 0.12, 0.22, "#74614a", wall);
      for (const x of [-3.8, 3.8])
        box("board frame", x, 2.5, 4.66, 0.12, 4.3, 0.22, "#74614a", wall);
    } else if (i === 1) {
      box(
        "bookshelf back",
        0,
        2.25,
        4.86,
        8,
        4.3,
        0.2,
        "#272b2c",
        wall,
        "library",
      );
      for (const x of [-4, 4])
        box(
          "bookcase side",
          x,
          2.25,
          4.5,
          0.18,
          4.5,
          0.9,
          "#584b3f",
          wall,
          "library",
        );
      for (let row = 0; row < 5; row++) {
        const y = 0.3 + row * 0.86;
        box("shelf", 0, y, 4.5, 8, 0.12, 0.95, "#71604b", wall, "library");
        for (let n = 0; n < 25; n++) {
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
            "library",
          );
          book.rotation.z = n % 9 === 0 ? 0.08 : 0;
        }
      }
      box(
        "reading stand frame",
        0,
        2.5,
        4.0,
        6.65,
        3.85,
        0.17,
        "#69533c",
        wall,
      );
      box("reading stand stem", 0, 0.45, 4.2, 0.22, 0.9, 0.25, "#69533c", wall);
    } else {
      box("desk top", 0, 1, 3.4, 6.2, 0.18, 2.7, "#64503e", wall, "inventory");
      for (const x of [-2.8, 2.8])
        box("drawers", x, 0.45, 3.6, 0.9, 0.9, 2, "#3a342f", wall, "inventory");
      box(
        "desk mat",
        0,
        1.11,
        3.1,
        4,
        0.025,
        1.9,
        "#192a30",
        wall,
        "inventory",
      );
      box("terminal", 0, 2.75, 4.02, 5.95, 3.4, 0.2, "#101b23", wall);
      box("terminal keyboard", 0, 1.15, 2.4, 3.6, 0.12, 0.8, "#303e48", wall);
      box(
        "equipment case",
        -2.7,
        1.27,
        2.6,
        0.65,
        0.35,
        0.8,
        "#303e48",
        wall,
        "inventory",
      );
      box("lamp stem", -3, 1.9, 4.4, 0.05, 1.6, 0.05, "#b09566", wall);
      box("lamp shade", -3, 2.65, 4.4, 0.8, 0.25, 0.5, "#957953", wall);
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
      dt = Math.min(0.05, scene.getEngine().getDeltaTime() / 1000);
    const target =
      wallYaw[s.wall] + (s.reducedMotion || s.locked ? 0 : px * 0.025);
    const turn = shortestTurn(camera.rotation.y, target);
    const blend = s.reducedMotion ? 1 : 1 - Math.exp(-dt * 19);
    camera.rotation.y += turn * blend;
    camera.rotation.x +=
      ((s.reducedMotion || s.locked ? 0 : py * 0.018) - camera.rotation.x) *
      blend;
  });
  const click = scene.onPointerObservable.add((info) => {
    if (info.type === 1 && !state().locked) {
      const id = scene.pick(scene.pointerX, scene.pointerY)?.pickedMesh
        ?.metadata?.interaction;
      if (id) interact(id);
    }
  });
  return () => {
    surface.removeEventListener("pointermove", pointer);
    surface.removeEventListener("pointerleave", leave);
    scene.onBeforeRenderObservable.remove(observer);
    scene.onPointerObservable.remove(click);
  };
}
