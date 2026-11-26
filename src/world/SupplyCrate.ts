import { Color3 } from "@babylonjs/core/Maths/math.color";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { CreateGround } from "@babylonjs/core/Meshes/Builders/groundBuilder";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { Scene } from "@babylonjs/core/scene";

export function buildSupplyCrate(scene: Scene) {
  const root = new TransformNode("supply crate", scene);
  const hinge = new TransformNode("supply crate lid hinge", scene);
  hinge.parent = root;
  hinge.position.set(0, 0.59, 0.55);

  const material = (name: string, color: string, sheen = 0.1) => {
    const surface = new StandardMaterial(name, scene);
    surface.diffuseColor = Color3.FromHexString(color);
    surface.specularColor.setAll(sheen);
    return surface;
  };
  const enamel = material("green enamel", "#486056");
  const edge = material("painted steel", "#263c37");
  const brass = material("brushed brass", "#b69a61", 0.34);
  const rubber = material("rubber trim", "#192423");
  const liner = material("padded interior", "#314440");

  const box = (
    name: string,
    at: [number, number, number],
    [width, height, depth]: [number, number, number],
    surface: StandardMaterial,
    parent = root,
  ) => {
    const mesh = CreateBox(name, { width, height, depth }, scene);
    mesh.parent = parent;
    mesh.position.set(...at);
    mesh.material = surface;
    mesh.isPickable = false;
    return mesh;
  };

  const base = box("steel base", [0, 0.095, 0], [1.83, 0.12, 1.12], edge);
  box("padded compartment", [0, 0.16, 0], [1.67, 0.045, 0.95], liner);
  for (const x of [-0.88, 0.88]) {
    box("side wall", [x, 0.355, 0], [0.085, 0.46, 1.12], enamel);
    box("side lip", [x, 0.57, 0], [0.11, 0.045, 1.12], edge);
    for (const z of [-0.43, 0.43])
      box("rubber foot", [x * 0.89, 0.025, z], [0.19, 0.05, 0.2], rubber);
  }
  for (const z of [-0.52, 0.52]) {
    box("end wall", [0, 0.355, z], [1.72, 0.46, 0.085], enamel);
    box("rim", [0, 0.57, z], [1.87, 0.045, 0.1], edge);
  }
  for (const x of [-0.66, 0.66]) {
    box("corner reinforcement", [x, 0.355, -0.573], [0.16, 0.45, 0.035], edge);
    box("latch keeper", [x, 0.505, -0.605], [0.15, 0.12, 0.052], brass);
    box("latch clasp", [x, -0.025, -1.149], [0.115, 0.19, 0.049], brass, hinge);
    box("rear hinge knuckle", [x, 0.59, 0.58], [0.28, 0.078, 0.072], brass);
  }
  for (const x of [-0.24, 0.24])
    box("handle mount", [x, 0.33, -0.605], [0.1, 0.11, 0.1], brass);
  box("carry handle", [0, 0.3, -0.685], [0.51, 0.081, 0.085], rubber);

  box("hinged cover", [0, 0.052, -0.55], [1.89, 0.105, 1.16], edge, hinge);
  box("lid panel", [0, 0.112, -0.55], [1.78, 0.044, 1.05], enamel, hinge);
  box("lid liner", [0, -0.015, -0.55], [1.66, 0.024, 0.94], liner, hinge);
  for (const x of [-0.76, 0.76])
    box(
      "raised lid rail",
      [x, 0.142, -0.55],
      [0.085, 0.044, 1.015],
      edge,
      hinge,
    );
  const plate = CreateGround(
    "supplies nameplate",
    { width: 1.3, height: 0.32 },
    scene,
  );
  plate.parent = hinge;
  plate.position.set(0, 0.136, -0.55);
  plate.isPickable = false;
  const lettering = new DynamicTexture(
    "supplies nameplate lettering",
    { width: 512, height: 126 },
    scene,
    false,
  );
  const ink = lettering.getContext();
  ink.fillStyle = "#233a36";
  ink.fillRect(0, 0, 512, 126);
  ink.strokeStyle = "#baa071";
  ink.lineWidth = 4;
  ink.strokeRect(5, 5, 502, 116);
  ink.fillStyle = "#f4d9a4";
  ink.font = "84px monospace";
  ink.fillText("SUPPLIES", 256 - ink.measureText("SUPPLIES").width / 2, 91);
  lettering.update();
  const nameplate = material("supply nameplate", "#ffffff");
  nameplate.diffuseTexture = lettering;
  nameplate.emissiveColor.setAll(0.24);
  plate.material = nameplate;

  return { root, hinge, base };
}
