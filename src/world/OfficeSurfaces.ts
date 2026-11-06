import type { Scene } from "@babylonjs/core/scene";
import "@babylonjs/core/Culling/ray";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { PointerEventTypes } from "@babylonjs/core/Events/pointerEvents";
import {
  SURFACE_WIDTH as W,
  SURFACE_HEIGHT as H,
  hitControl,
  wrapLines,
  type SurfaceModel,
  type OfficeAction,
} from "../game/officeUi";
import { wallYaw, type HomeWall } from "./Office";

export interface OfficeSurfaceState {
  models: SurfaceModel[];
  wall: HomeWall;
  locked: boolean;
  focused: string | null;
}
export function attachOfficeSurfaces(
  scene: Scene,
  surface: HTMLElement,
  state: () => OfficeSurfaceState,
  action: (a: OfficeAction) => void,
) {
  const surfaces = new Map<
    HomeWall,
    {
      texture: DynamicTexture;
      signature: string;
      hover: string | null;
      lastModel: SurfaceModel | null;
      lastSelection: string | null;
    }
  >();
  for (const id of Object.keys(wallYaw) as HomeWall[]) {
    const anchor = new TransformNode(`world UI anchor / ${id}`, scene);
    anchor.rotation.y = wallYaw[id];
    const mesh = MeshBuilder.CreatePlane(
      `interactive ${id} surface`,
      {
        width: id === "desk" ? 5.68 : id === "bookshelf" ? 6.4 : 7.2,
        height: id === "desk" ? 3.2 : id === "bookshelf" ? 3.6 : 4.05,
      },
      scene,
    );
    mesh.parent = anchor;
    mesh.position.set(
      0,
      id === "desk" ? 2.75 : 2.5,
      id === "investigation" || id === "quests" ? 4.64 : 3.88,
    );
    mesh.metadata = { officeSurface: id };
    const texture = new DynamicTexture(
      `UI texture / ${id}`,
      { width: 2048, height: 1152 },
      scene,
      false,
    );
    texture.anisotropicFilteringLevel = 8;
    const material = new StandardMaterial(`printed UI / ${id}`, scene);
    material.diffuseTexture = texture;
    material.specularColor = Color3.Black();
    material.emissiveColor = new Color3(0.25, 0.25, 0.25);
    material.backFaceCulling = false;
    mesh.material = material;
    surfaces.set(id, {
      texture,
      signature: "",
      hover: null,
      lastModel: null,
      lastSelection: null,
    });
  }
  const draw = (
    model: SurfaceModel,
    texture: DynamicTexture,
    selected: string | null,
  ) => {
    const c = texture.getContext() as unknown as CanvasRenderingContext2D;
    c.save();
    c.setTransform(2, 0, 0, 2, 0, 0);
    const paper = model.theme === "paper",
      cork = model.theme === "cork";
    const ink = paper ? "#29312d" : "#e1e4d5",
      base = paper ? "#ded0ad" : cork ? "#423c2f" : "#12262e";
    c.fillStyle = base;
    c.fillRect(0, 0, W, H);
    if (cork) {
      c.strokeStyle = "#71654d44";
      c.lineWidth = 1;
      for (let y = 0; y < H; y += 5) {
        c.beginPath();
        c.moveTo(0, y);
        c.lineTo(W, y);
        c.stroke();
      }
      c.strokeStyle = "#a7614c88";
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(190, 160);
      c.lineTo(650, 115);
      c.lineTo(800, 450);
      c.lineTo(180, 390);
      c.stroke();
    }
    if (paper) {
      c.fillStyle = "#b9a984";
      c.fillRect(280, 68, 2, 444);
    }
    c.fillStyle = paper ? "#c6b58f" : "#15252b";
    c.fillRect(0, 0, W, 62);
    c.fillStyle = ink;
    c.font = "bold 24px Consolas, monospace";
    c.textBaseline = "top";
    c.fillText(model.title, 28, 20);
    for (const text of model.texts) {
      c.fillStyle = text.color ?? ink;
      c.font = `${text.bold ? "bold " : ""}${text.size ?? 20}px Consolas, monospace`;
      const columns = Math.max(
        8,
        Math.floor((text.maxWidth ?? 950) / ((text.size ?? 20) * 0.61)),
      );
      wrapLines(text.text, columns).forEach((line, i) =>
        c.fillText(line, text.x, text.y + i * (text.size ?? 20) * 1.3),
      );
    }
    for (const b of model.buttons) {
      const hover = selected === b.id,
        nav = b.id.startsWith("nav-");
      c.globalAlpha = b.disabled ? 0.55 : 1;
      c.fillStyle = paper ? "#cab993" : cork ? "#cbbd9a" : "#24444e";
      if (hover) c.fillStyle = paper ? "#eee2c5" : cork ? "#ead7ac" : "#3c6571";
      c.fillRect(b.x, b.y, b.w, b.h);
      c.strokeStyle = hover ? "#e6b962" : paper ? "#9d8a64" : "#7b806d";
      c.lineWidth = hover ? 3 : 1;
      c.strokeRect(b.x + 0.5, b.y + 0.5, b.w - 1, b.h - 1);
      c.fillStyle = paper || cork ? "#263632" : "#d9e8e6";
      c.font = `${nav ? 16 : 18}px Consolas, monospace`;
      const lines = wrapLines(
        b.label,
        Math.max(8, Math.floor((b.w - 24) / ((nav ? 16 : 18) * 0.61))),
      ).slice(0, 2);
      const lineHeight = nav ? 18 : 21;
      lines.forEach((line, i) =>
        c.fillText(
          line,
          b.x + 12,
          b.y + (b.h - lines.length * lineHeight) / 2 + i * lineHeight,
        ),
      );
      if (cork && !nav) {
        c.fillStyle = "#ae5e49";
        c.beginPath();
        c.arc(b.x + b.w / 2, b.y + 4, 3, 0, Math.PI * 2);
        c.fill();
      }
    }
    c.globalAlpha = 1;
    c.restore();
    texture.update();
  };
  const render = scene.onBeforeRenderObservable.add(() => {
    const s = state();
    for (const model of s.models) {
      const entry = surfaces.get(model.id)!;
      const focus = model.id === s.wall ? s.focused : null;
      const selection = focus ?? entry.hover;
      if (entry.lastModel === model && entry.lastSelection === selection)
        continue;
      entry.lastModel = model;
      entry.lastSelection = selection;
      const signature = JSON.stringify([model, selection]);
      if (signature !== entry.signature) {
        entry.signature = signature;
        draw(model, entry.texture, selection);
      }
    }
  });
  const pointer = scene.onPointerObservable.add((info) => {
    if (
      info.type !== PointerEventTypes.POINTERMOVE &&
      info.type !== PointerEventTypes.POINTERUP
    )
      return;
    const s = state(),
      pick = info.pickInfo;
    let hovered: ReturnType<typeof hitControl>;
    const id = pick?.pickedMesh?.metadata?.officeSurface as
      HomeWall | undefined;
    if (id === s.wall && !s.locked) {
      const uv = pick?.getTextureCoordinates();
      const model = s.models.find((m) => m.id === id);
      if (uv && model)
        hovered = hitControl(model.buttons, uv.x * W, (1 - uv.y) * H);
    }
    if (info.type === PointerEventTypes.POINTERMOVE) {
      for (const [key, entry] of surfaces)
        entry.hover = key === id ? (hovered?.id ?? null) : null;
      surface.style.cursor = hovered ? "pointer" : "";
    }
    if (info.type === PointerEventTypes.POINTERUP) {
      if (hovered) action(hovered.action);
    }
  });
  return () => {
    scene.onBeforeRenderObservable.remove(render);
    scene.onPointerObservable.remove(pointer);
    surface.style.cursor = "";
  };
}
