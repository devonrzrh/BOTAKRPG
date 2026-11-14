import type { Scene } from "@babylonjs/core/scene";
import "@babylonjs/core/Culling/ray";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { PointerEventTypes } from "@babylonjs/core/Events/pointerEvents";
import {
  hitControl,
  wrapLines,
  type SurfaceModel,
  type SurfaceButton,
  type OfficeAction,
} from "../game/officeUi";
import {
  BOOK_OPEN_MS,
  BOOK_CLOSE_MS,
  BOOK_SHELF_SCALE,
  bookPose,
  bookReadingScale,
} from "../game/bookAnimation";
import { drawQuestGraph } from "./QuestGraphSurface";
import {
  GRAPH_AREA,
  panGraph,
  zoomGraph,
  type GraphView,
} from "../game/questGraph";
import { wallYaw, type HomeWall } from "./Office";
export interface OfficeSurfaceState {
  models: SurfaceModel[];
  wall: HomeWall;
  locked: boolean;
  focused: string | null;
  reducedMotion?: boolean;
}
interface Zone {
  x: number;
  y: number;
  w: number;
  h: number;
  control: SurfaceButton;
}
type Ctx = CanvasRenderingContext2D;

/** Every menu target is a photograph, paper, book spine, or physical page. */
export function attachOfficeSurfaces(
  scene: Scene,
  surface: HTMLElement,
  state: () => OfficeSurfaceState,
  action: (a: OfficeAction) => void,
) {
  const anchors = new Map<HomeWall, TransformNode>();
  for (const id of Object.keys(wallYaw) as HomeWall[]) {
    const root = new TransformNode(`props / ${id}`, scene);
    root.rotation.y = wallYaw[id];
    anchors.set(id, root);
  }
  const material = (name: string, color: string) => {
    const m = new StandardMaterial(name, scene);
    m.diffuseColor = Color3.FromHexString(color);
    m.specularColor = new Color3(0.04, 0.04, 0.04);
    return m;
  };
  const paperMat = material("paper edges", "#c4b28e"),
    pinMat = material("red drawing pins", "#a84f3d"),
    coverMat = material("worn book cloth", "#513c31");
  const widgets: {
    wall: HomeWall;
    face: Mesh;
    outline: Mesh;
    texture: DynamicTexture;
    draw: (c: Ctx, m: SurfaceModel) => Zone[];
    zones: Zone[];
    width: number;
    height: number;
    aspect?: number;
    key: string;
    model: SurfaceModel | null;
    selection: string | null;
    lift?: TransformNode;
    baseZ?: number;
  }[] = [];
  let hovered: (typeof widgets)[number] | null = null,
    hoverControl: string | null = null;
  const outlineMat = material("interaction outline", "#f0c986");
  outlineMat.emissiveColor = Color3.FromHexString("#f0c986");
  outlineMat.disableLighting = true;
  const outline = (parent: TransformNode, w: number, h: number, z: number) => {
    const border = MeshBuilder.CreateTube(
      "hover outline",
      {
        path: [
          [-w / 2, -h / 2],
          [w / 2, -h / 2],
          [w / 2, h / 2],
          [-w / 2, h / 2],
          [-w / 2, -h / 2],
        ].map(([x, y]) => new Vector3(x, y, z)),
        radius: 0.012,
        tessellation: 6,
      },
      scene,
    );
    border.parent = parent;
    border.material = outlineMat;
    border.isPickable = false;
    border.setEnabled(false);
    return border;
  };
  const modelFor = (wall: HomeWall) =>
    state().models.find((m) => m.id === wall)!;
  const control = (m: SurfaceModel, id: string) =>
    m.buttons.find((b) => b.id === id);
  const zone = (
    m: SurfaceModel,
    id: string,
    x = 0,
    y = 0,
    w = 600,
    h = 800,
  ): Zone[] => {
    const b = control(m, id);
    return b ? [{ x, y, w, h, control: b }] : [];
  };
  let textAspect = 1;
  const ink = (
    c: Ctx,
    value: string,
    x: number,
    y: number,
    size = 30,
    width = 530,
    color = "#34332d",
  ) => {
    c.fillStyle = color;
    c.font = `${size}px Consolas, monospace`;
    c.textBaseline = "top";
    c.save();
    c.translate(x, y);
    c.scale(1, textAspect);
    wrapLines(value, Math.max(8, Math.floor(width / (size * 0.61)))).forEach(
      (line, i) => c.fillText(line, 0, i * size * 1.3),
    );
    c.restore();
  };
  const texture = (name: string, w = 1024, h = 1024) => {
    const t = new DynamicTexture(name, { width: w, height: h }, scene, false);
    t.anisotropicFilteringLevel = 8;
    return t;
  };
  const face = (
    name: string,
    parent: TransformNode,
    w: number,
    h: number,
    t: DynamicTexture,
  ) => {
    const m = MeshBuilder.CreatePlane(name, { width: w, height: h }, scene);
    m.parent = parent;
    const mat = material(name + " ink", "#ffffff");
    mat.diffuseTexture = t;
    mat.emissiveColor = new Color3(0.22, 0.2, 0.17);
    mat.backFaceCulling = false;
    m.material = mat;
    return m;
  };
  const pin = (parent: TransformNode, x: number, y: number, z: number) => {
    const p = MeshBuilder.CreateCylinder(
      "drawing pin",
      { diameter: 0.07, height: 0.065, tessellation: 12 },
      scene,
    );
    p.parent = parent;
    p.position.set(x, y, z);
    p.rotation.x = Math.PI / 2;
    p.material = pinMat;
    p.isPickable = false;
  };
  const sheet = (
    name: string,
    wall: HomeWall,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    roll: number,
    draw: (c: Ctx, m: SurfaceModel) => Zone[],
    pinIt = true,
    logicalWidth = 600,
    logicalHeight = 800,
  ) => {
    const root = new TransformNode(name, scene);
    root.parent = anchors.get(wall)!;
    root.position.set(x, y, z);
    root.rotation.z = roll;
    const body = MeshBuilder.CreateBox(
      name + " paper thickness",
      { width: w, height: h, depth: 0.018 },
      scene,
    );
    body.parent = root;
    body.material = paperMat;
    body.isPickable = false;
    const t = texture(name),
      p = face(name + " face", root, w, h, t);
    p.position.z = -0.013;
    const widget = {
      wall,
      face: p,
      outline: outline(root, w + 0.025, h + 0.025, -0.04),
      texture: t,
      draw,
      zones: [] as Zone[],
      width: logicalWidth,
      height: logicalHeight,
      aspect: w / h / (logicalWidth / logicalHeight),
      key: "",
      model: null as SurfaceModel | null,
      selection: null as string | null,
    };
    p.metadata = { propPage: widget };
    widgets.push(widget);
    if (pinIt) pin(root, 0, h * 0.43, -0.04);
    return root;
  };
  const paper = (c: Ctx, color = "#d8c7a1") => {
    c.fillStyle = color;
    c.fillRect(0, 0, 600, 800);
    c.fillStyle = "#7261430b";
    for (let i = 0; i < 1500; i++)
      c.fillRect((i * 83) % 600, (i * 137) % 800, 2, 2);
  };
  const rule = (c: Ctx, y: number) => {
    c.strokeStyle = "#88795b88";
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(35, y);
    c.lineTo(565, y);
    c.stroke();
  };
  // Cork texture and real string geometry, with no screen-sized menu plane.
  for (const id of ["investigation"] as const) {
    const board = scene.getMeshByName(
      id === "investigation" ? "investigation board" : "quest board",
    );
    if (board?.material instanceof StandardMaterial) {
      const t = texture(id + " cork");
      const c = t.getContext() as unknown as Ctx;
      c.fillStyle = id === "investigation" ? "#665440" : "#4b5146";
      c.fillRect(0, 0, 1024, 1024);
      for (let n = 0; n < 18000; n++) {
        c.fillStyle = ["#b0976720", "#171c1620", "#d8ba8530"][n % 3];
        c.fillRect((n * 83) % 1024, (n * 311) % 1024, 2 + (n % 3), 2);
      }
      t.update();
      board.material.diffuseTexture = t;
      board.isPickable = false;
    }
  }
  const thread = (wall: HomeWall, points: [number, number][]) => {
    const path = points.map(([x, y]) => new Vector3(x, y, 4.445));
    const wire = MeshBuilder.CreateTube(
      "evidence thread",
      { path, radius: 0.009, tessellation: 6 },
      scene,
    );
    wire.parent = anchors.get(wall)!;
    wire.material = pinMat;
    wire.isPickable = false;
  };
  thread("investigation", [
    [-2.25, 3.85],
    [0.05, 3.95],
    [2.2, 3.15],
    [0.1, 1.95],
    [-2.15, 1.2],
  ]);
  thread("investigation", [
    [-2.25, 3.85],
    [2.15, 1.2],
    [2.2, 3.15],
  ]);
  sheet(
    "ECHO-7 evidence photograph",
    "investigation",
    -2.3,
    2.85,
    4.54,
    1.75,
    2.35,
    -0.075,
    (c, m) => {
      paper(c, "#ddd0ae");
      c.fillStyle = "#293844";
      c.fillRect(38, 48, 524, 530);
      const gradient = c.createLinearGradient(40, 50, 560, 570);
      gradient.addColorStop(0, "#72858b");
      gradient.addColorStop(1, "#18262f");
      c.fillStyle = gradient;
      c.fillRect(48, 58, 504, 510);
      c.fillStyle = "#819197";
      c.fillRect(185, 150, 225, 200);
      c.fillStyle = "#3c505b";
      c.fillRect(205, 170, 185, 155);
      c.fillStyle = "#b9d4cb";
      c.fillRect(218, 221, 159, 20);
      c.fillStyle = "#627c85";
      c.fillRect(133, 371, 325, 195);
      c.fillStyle = "#425967";
      c.fillRect(163, 395, 265, 171);
      c.strokeStyle = "#d2d8cf12";
      for (let y = 60; y < 566; y += 5) {
        c.beginPath();
        c.moveTo(48, y);
        c.lineTo(552, y);
        c.stroke();
      }
      ink(c, "ECHO-7", 40, 610, 53);
      ink(
        c,
        m.texts.some((t) => t.text === "CASE CLOSED")
          ? "CONTAINED"
          : "UNIT MISSING",
        40,
        690,
        40,
      );
      return zone(m, "briefing");
    },
  );
  sheet(
    "case report",
    "investigation",
    -0.05,
    3.45,
    4.53,
    1.85,
    1.15,
    0.065,
    (c, m) => {
      paper(c);
      ink(c, "CASE 007", 40, 65, 60);
      rule(c, 170);
      ink(c, "RECALL ORDER", 40, 225, 43);
      ink(c, "ECHO-7 / missing unit", 40, 330, 40);
      ink(c, "Gateway access records", 40, 470, 40);
      ink(c, "OPEN CASE FILE", 40, 676, 36, 530, "#844e38");
      return zone(m, "quests");
    },
  );
  sheet(
    "transit routing map",
    "investigation",
    2.15,
    2.65,
    4.53,
    2.25,
    1.65,
    -0.045,
    (c, m) => {
      paper(c, "#c5c5af");
      ink(c, "OUTBOUND CONNECTION", 28, 40, 36);
      c.strokeStyle = "#7e8a7838";
      c.lineWidth = 8;
      for (let i = 0; i < 8; i++) {
        c.beginPath();
        c.moveTo(30, 170 + i * 63);
        c.lineTo(570, 170 + i * 63);
        c.stroke();
        c.beginPath();
        c.moveTo(30 + i * 76, 165);
        c.lineTo(30 + i * 76, 650);
        c.stroke();
      }
      c.strokeStyle = "#964d39";
      c.lineWidth = 9;
      c.beginPath();
      c.moveTo(70, 570);
      c.lineTo(180, 570);
      c.lineTo(180, 320);
      c.lineTo(420, 320);
      c.lineTo(420, 200);
      c.stroke();
      ink(c, "Trace connection >", 35, 690, 40);
      return zone(m, "online");
    },
  );
  sheet(
    "library archive slip",
    "investigation",
    0,
    1.65,
    4.53,
    1.7,
    0.9,
    -0.04,
    (c, m) => {
      paper(c, "#c7c6a5");
      ink(c, "REFERENCE ARCHIVE", 35, 80, 47);
      rule(c, 270);
      ink(c, "Algorithms\nData structures\nConnectionist AI", 35, 300, 42);
      ink(c, "See bookshelf", 35, 695, 44);
      return zone(m, "books");
    },
  );
  sheet(
    "clue ledger index",
    "investigation",
    -2.25,
    0.95,
    4.53,
    1.75,
    0.6,
    0.045,
    (c, m) => {
      paper(c);
      ink(c, "CLUE LEDGER", 30, 80, 48);
      rule(c, 300);
      ink(c, "Evidence recovered", 30, 400, 46);
      return zone(m, "inventory");
    },
  );
  sheet(
    "motive sticky note",
    "investigation",
    2.1,
    1.0,
    4.53,
    1.65,
    0.82,
    0.08,
    (c) => {
      paper(c, "#d1b873");
      ink(c, "Why ignore\nthe recall?", 45, 120, 55);
      return [];
    },
  );
  // A single luminous display mounted in the room; the same quest actions remain ray-picked.
  const display = sheet(
    "quest display",
    "quests",
    0,
    2.5,
    4.54,
    7.45,
    4.1,
    0,
    (c, m) =>
      drawQuestGraph(c, m.graph!, m.buttons, state().focused ?? hoverControl),
    false,
    1024,
    576,
  );
  for (const mesh of display.getChildMeshes()) {
    const mat = mesh.material as StandardMaterial;
    if (mat.diffuseTexture) {
      mat.disableLighting = true;
      mat.emissiveColor = Color3.White();
    } else mesh.isVisible = false;
  }

  const books = modelFor("bookshelf")?.books ?? [];
  const volumes = books.map((book, index) => {
    const root = new TransformNode("reference volume / " + book.id, scene);
    root.parent = anchors.get("bookshelf")!;
    root.position.set(-2.2 + index * 2.2, 2.12, 4.38);
    const cloth = material(
      "cloth / " + book.id,
      ["#425d68", "#70483b", "#5d6b4d"][index % 3],
    );
    const binding = MeshBuilder.CreateBox(
      "cloth binding",
      { width: 0.9, height: 1.07, depth: 0.06 },
      scene,
    );
    binding.parent = root;
    binding.material = cloth;
    binding.isPickable = false;
    for (const z of [-0.04, 0.04]) {
      const cover = MeshBuilder.CreateBox(
        "book cover",
        { width: 0.93, height: 1.1, depth: 0.02 },
        scene,
      );
      cover.parent = root;
      cover.position.z = z;
      cover.material = cloth;
      cover.isPickable = false;
    }
    const t = texture("spine / " + book.id),
      p = face("clickable book spine", root, 0.89, 1.06, t);
    p.position.z = -0.052;
    const draw = (c: Ctx, m: SurfaceModel) => {
      c.fillStyle = ["#425d68", "#70483b", "#5d6b4d"][index % 3];
      c.fillRect(0, 0, 600, 800);
      c.strokeStyle = "#c3aa75";
      c.lineWidth = 5;
      c.strokeRect(35, 34, 530, 732);
      c.fillStyle = "#c3aa75";
      c.fillRect(36, 130, 528, 7);
      c.fillRect(36, 655, 528, 7);
      const title = [
        ["ALGORITHMS"],
        ["DATA", "STRUCTURES"],
        ["NEURAL", "NETWORKS"],
      ][index] ?? [book.topic];
      title.forEach((line, row) =>
        ink(c, line, 40, 300 + row * 100, 80, 530, "#e0ca95"),
      );
      ink(c, String(index + 1).padStart(2, "0"), 235, 705, 65, 130, "#e0ca95");
      return zone(m, "lesson-" + book.id);
    };
    const widget = {
      wall: "bookshelf" as HomeWall,
      face: p,
      outline: outline(root, 0.95, 1.12, -0.065),
      texture: t,
      draw,
      zones: [] as Zone[],
      width: 600,
      height: 800,
      aspect: 0.89 / 1.06 / (600 / 800),
      key: "",
      model: null as SurfaceModel | null,
      selection: null as string | null,
      lift: root,
      baseZ: 4.38,
    };
    p.metadata = { propPage: widget };
    widgets.push(widget);
    return { id: book.id, root, index };
  });
  // Small library index card; the shelf itself remains completely visible.
  sheet(
    "library index card",
    "bookshelf",
    3.0,
    1.1,
    4.1,
    1.35,
    0.75,
    -0.03,
    (c, m) => {
      paper(c);
      ink(c, "INDEX", 35, 60, 65);
      const query = control(m, "search")?.label.replace(/^Search: /, "");
      ink(
        c,
        query && query !== "all lessons" ? query.slice(0, 14) : "Find book",
        35,
        300,
        55,
      );
      ink(
        c,
        (control(m, "topic")?.label ?? "Topic: all").replace("Topic: ", ""),
        35,
        575,
        55,
      );
      return [
        ...zone(m, "search", 0, 250, 600, 280),
        ...zone(m, "topic", 0, 530, 600, 270),
      ];
    },
    false,
  );

  const locker = sheet(
    "supply locker label",
    "desk",
    2.2,
    1.43,
    4.46,
    1.6,
    0.86,
    0,
    (c, m) => {
      c.fillStyle = "#273b3d";
      c.fillRect(0, 0, 600, 260);
      c.strokeStyle = "#b39862";
      c.lineWidth = 4;
      c.strokeRect(18, 18, 564, 224);
      ink(c, "SUPPLY", 105, 43, 94, 485, "#ead6a4");
      ink(c, "LOCKER", 105, 141, 94, 485, "#ead6a4");
      return zone(m, "supply-locker", 0, 0, 600, 260);
    },
    false,
    600,
    260,
  );
  locker.rotation.x = Math.PI / 2;
  const lockerBody = MeshBuilder.CreateBox(
    "steel supply locker",
    { width: 1.68, height: 0.93, depth: 0.32 },
    scene,
  );
  lockerBody.parent = locker;
  lockerBody.position.z = 0.16;
  lockerBody.material = material("locker steel", "#34494a");
  lockerBody.isPickable = false;

  // Books have a real spine and hinged cover. The library volume leaves its shelf.
  const makeBook = (name: string, wall: HomeWall) => {
    const root = new TransformNode(name, scene);
    root.parent = anchors.get(wall)!;
    const hinge = new TransformNode(name + " cover hinge", scene);
    hinge.parent = root;
    hinge.position.z = -0.09;
    for (const [parent, x] of [
      [root, 1.45],
      [hinge, -1.45],
    ] as const) {
      const cover = MeshBuilder.CreateBox(
        name + " cover",
        { width: 2.98, height: 3.34, depth: 0.065 },
        scene,
      );
      cover.parent = parent;
      cover.position.set(x, 0, 0.015);
      cover.material = coverMat;
      cover.isPickable = false;
      const block = MeshBuilder.CreateBox(
        "page edges",
        { width: 2.87, height: 3.23, depth: 0.035 },
        scene,
      );
      block.parent = parent;
      block.position.set(x, 0, -0.024);
      block.material = paperMat;
      block.isPickable = false;
    }
    const pages = [
      face(
        name + " left page",
        hinge,
        2.88,
        3.23,
        texture(name + " left page ink", 1024, 1152),
      ),
      face(
        name + " right page",
        root,
        2.88,
        3.23,
        texture(name + " right page ink", 1024, 1152),
      ),
    ];
    pages[0].position.set(-1.45, 0, -0.049);
    pages[1].position.set(1.45, 0, -0.049);
    const outside = face(
      name + " outer cover",
      hinge,
      2.98,
      3.34,
      texture(name + " title"),
    );
    outside.position.set(-1.45, 0, 0.052);
    outside.rotation.y = Math.PI;
    outside.isPickable = false;
    const source = document.createElement("canvas");
    source.width = 2048;
    source.height = 1152;
    let key = "",
      lastModel: SurfaceModel | null = null;
    const draw = (model: SurfaceModel, selected: string | null) => {
      if (lastModel === model && key === (selected ?? "")) return;
      lastModel = model;
      key = selected ?? "";
      textAspect = 1;
      const c = source.getContext("2d")!;
      c.setTransform(2, 0, 0, 2, 0, 0);
      c.fillStyle = "#e2d4b4";
      c.fillRect(0, 0, 1024, 576);
      const coverTexture = (outside.material as StandardMaterial)
        .diffuseTexture as DynamicTexture;
      const coverContext = coverTexture.getContext() as unknown as Ctx;
      coverContext.fillStyle = wall === "desk" ? "#45352e" : "#4b5351";
      coverContext.fillRect(0, 0, 1024, 1024);
      coverContext.strokeStyle = "#ba9d65";
      coverContext.lineWidth = 8;
      coverContext.strokeRect(70, 65, 884, 894);
      ink(coverContext, model.title, 110, 280, 55, 810, "#d8bd83");
      coverTexture.update();
      // The 3D prop is a transition, not a second reading surface. Blank pages
      // avoid duplicate controls and warped lesson text during the opening.
      if (wall === "bookshelf") {
        // Quiet paper texture bridges the prop and the reader without loading copy.
        c.strokeStyle = "#b7a78644";
        c.lineWidth = 1;
        for (let row = 0; row < 15; row++) {
          for (const x of [75, 590]) {
            c.beginPath();
            c.moveTo(x, 120 + row * 22);
            c.lineTo(x + (row % 4 === 3 ? 240 : 345), 120 + row * 22);
            c.stroke();
          }
        }
        c.strokeStyle = "#b7a786";
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(512, 70);
        c.lineTo(512, 330);
        c.stroke();
        pages.forEach((page, index) => {
          const t = (page.material as StandardMaterial)
            .diffuseTexture as DynamicTexture;
          const pc = t.getContext() as unknown as Ctx;
          pc.setTransform(1, 0, 0, 1, 0, 0);
          pc.drawImage(source, index * 1024, 0, 1024, 1152, 0, 0, 1024, 1152);
          t.update();
        });
        return;
      }
      const shade = c.createLinearGradient(472, 0, 552, 0);
      shade.addColorStop(0, "#c8b58b00");
      shade.addColorStop(0.5, "#8f795d77");
      shade.addColorStop(1, "#c8b58b00");
      c.fillStyle = shade;
      c.fillRect(472, 0, 80, 576);
      c.strokeStyle = "#b7a78644";
      c.lineWidth = 0.6;
      for (let y = 106; y < 470; y += 23) {
        c.beginPath();
        c.moveTo(28, y);
        c.lineTo(482, y);
        c.moveTo(544, y);
        c.lineTo(996, y);
        c.stroke();
      }
      if (wall === "desk") {
        c.fillStyle = "#30464a";
        c.fillRect(20, 14, 463, 48);
        c.fillRect(535, 14, 469, 48);
      }
      ink(
        c,
        wall === "desk" ? "CLUE LEDGER" : model.title,
        35,
        25,
        wall === "desk" ? 32 : 22,
        440,
        wall === "desk" ? "#eee2c6" : "#453d30",
      );
      if (wall === "desk")
        ink(c, "EVIDENCE FILES", 550, 25, 32, 430, "#eee2c6");
      for (const t of model.texts) {
        const width = Math.min(
          t.maxWidth ?? 440,
          t.x < 512 ? 482 - t.x : 1000 - t.x,
        );
        ink(
          c,
          t.text,
          t.x,
          t.y,
          wall === "desk" ? Math.max(30, t.size ?? 18) : (t.size ?? 18),
          width,
        );
      }
      for (const b of model.buttons) {
        if (b.prop) continue;
        c.globalAlpha = 1;
        if (wall === "desk" && b.x > 512) {
          c.fillStyle = selected === b.id ? "#b0b8a855" : "#f6efdf66";
          c.fillRect(b.x, b.y - 4, b.w, b.h + 8);
          c.strokeStyle = b.disabled ? "#9f957b" : "#667c72";
          c.lineWidth = b.disabled ? 1 : 2;
          c.strokeRect(b.x, b.y - 4, b.w, b.h + 8);
          c.fillStyle = b.disabled ? "#9f957b" : "#667c72";
          c.fillRect(b.x, b.y - 4, 3, b.h + 8);
        }
        c.globalAlpha = b.disabled ? 0.72 : 1;
        const size = wall === "desk" ? 30 : 20,
          lines = wrapLines(
            b.label,
            Math.max(7, Math.floor((b.w - 10) / (size * 0.61))),
          );
        ink(
          c,
          lines.slice(0, 2).join("\n"),
          b.x + 5,
          b.y + 6,
          size,
          b.w - 10,
          selected === b.id ? "#9a4f31" : "#66503b",
        );
        if (!b.disabled) {
          c.strokeStyle = selected === b.id ? "#a35738" : "#9b8052";
          c.lineWidth = selected === b.id ? 2 : 1;
          c.beginPath();
          c.moveTo(b.x + 5, b.y + b.h - 3);
          c.lineTo(
            b.x + Math.min(b.w - 5, b.label.length * 9.8),
            b.y + b.h - 3,
          );
          c.stroke();
          if (selected === b.id) {
            c.strokeStyle = "#9a4f25";
            c.lineWidth = 2.5;
            c.strokeRect(b.x, b.y, b.w, b.h);
          }
        }
      }
      c.globalAlpha = 1;
      pages.forEach((page, index) => {
        const t = (page.material as StandardMaterial)
          .diffuseTexture as DynamicTexture;
        const pc = t.getContext() as unknown as Ctx;
        pc.setTransform(1, 0, 0, 1, 0, 0);
        pc.drawImage(source, index * 1024, 0, 1024, 1152, 0, 0, 1024, 1152);
        t.update();
      });
    };
    return { root, hinge, pages, draw };
  };
  const reading = makeBook("selected reference book", "bookshelf"),
    ledger = makeBook("clue ledger", "desk");
  ledger.root.position.set(0, 1.14, 3.35);
  ledger.root.rotation.x = Math.PI / 2;
  ledger.root.scaling.setAll(0.8);
  ledger.hinge.rotation.y = 0;
  let progress = 0,
    activeBook = "",
    lastReadingModel: SurfaceModel | null = null;
  const bookPageTargets = new Map<
    AbstractMesh,
    { book: typeof reading; side: number; wall: HomeWall }
  >();
  reading.pages.forEach((p, side) => {
    p.metadata = { bookPage: true };
    bookPageTargets.set(p, { book: reading, side, wall: "bookshelf" });
  });
  ledger.pages.forEach((p, side) => {
    p.metadata = { bookPage: true };
    bookPageTargets.set(p, { book: ledger, side, wall: "desk" });
  });
  const render = scene.onBeforeRenderObservable.add(() => {
    const s = state(),
      library = modelFor("bookshelf");
    if (!library) return;
    if (progress === 0 && library.selectedLesson !== activeBook) {
      activeBook = library.selectedLesson ?? books[0]?.id ?? "";
    }
    const target = library.bookOpen ? 1 : 0,
      dt = Math.min(0.05, scene.getEngine().getDeltaTime() / 1000);
    progress = s.reducedMotion
      ? target
      : Math.max(
          0,
          Math.min(
            1,
            progress +
              ((target ? 1 : -1) * dt * 1000) /
                (target ? BOOK_OPEN_MS : BOOK_CLOSE_MS),
          ),
        );
    const camera = scene.activeCamera;
    const aspect =
      scene.getEngine().getRenderWidth() /
      Math.max(1, scene.getEngine().getRenderHeight());
    const pose = bookPose(
        progress,
        bookReadingScale(aspect, camera?.fov ?? 1.03, 3.46) * 0.87,
      ),
      volume =
        volumes.find((v) => v.id === activeBook) ??
        volumes.find((v) => books[v.index].topic === library.selectedTopic) ??
        volumes[0],
      x = volume ? -2.2 + volume.index * 2.2 : 0;
    reading.root.setEnabled(progress > 0.001);
    reading.root.position = Vector3.Lerp(
      new Vector3(x - 1.45 * BOOK_SHELF_SCALE, 2.12, 4.38),
      new Vector3(0, 2.2 + pose.lift, 3.46),
      pose.travel,
    );
    reading.root.scaling.setAll(pose.scale);
    reading.root.rotation.x = -0.035 * Math.sin(pose.travel * Math.PI);
    reading.hinge.rotation.y = pose.coverYaw;
    for (const v of volumes)
      v.root.setEnabled(v.id !== volume?.id || progress < 0.01);
    if (library.bookOpen) lastReadingModel = library;
    reading.draw(
      lastReadingModel ?? library,
      s.wall === "bookshelf" ? (s.focused ?? hoverControl) : null,
    );
    ledger.draw(
      modelFor("desk"),
      s.wall === "desk" ? (s.focused ?? hoverControl) : null,
    );
    for (const w of widgets) {
      const m = modelFor(w.wall);
      if (!m) continue;
      const selected =
        w === hovered ? hoverControl : s.wall === w.wall ? s.focused : null;
      w.outline.setEnabled(
        !s.locked &&
          s.wall === w.wall &&
          Boolean(
            selected &&
            w.zones.some(
              (z) => z.control.id === selected && !z.control.disabled,
            ),
          ),
      );
      if (w.lift && w.baseZ !== undefined)
        w.lift.position.z +=
          (w.baseZ - (w === hovered ? 0.08 : 0) - w.lift.position.z) *
          Math.min(1, dt * 15);
      if (w.model === m && w.selection === selected) continue;
      w.model = m;
      w.selection = selected;
      const c = w.texture.getContext() as unknown as Ctx;
      c.setTransform(1024 / w.width, 0, 0, 1024 / w.height, 0, 0);
      textAspect = w.aspect ?? 1;
      w.zones = w.draw(c, m);
      if (selected && w.zones.some((z) => z.control.id === selected)) {
        c.strokeStyle = "#c09a55";
        c.lineWidth = 5;
        c.strokeRect(8, 8, w.width - 16, w.height - 16);
      }
      w.texture.update();
    }
  });
  let graphDrag: {
    x: number;
    y: number;
    clientX: number;
    clientY: number;
    view: GraphView;
    moved: boolean;
    pointerId: number;
  } | null = null;
  const insideGraph = (x: number, y: number) =>
    x >= GRAPH_AREA.x &&
    x <= GRAPH_AREA.x + GRAPH_AREA.w &&
    y >= GRAPH_AREA.y &&
    y <= GRAPH_AREA.y + GRAPH_AREA.h;
  const pointer = scene.onPointerObservable.add((info) => {
    if (
      info.type !== PointerEventTypes.POINTERMOVE &&
      info.type !== PointerEventTypes.POINTERUP &&
      info.type !== PointerEventTypes.POINTERDOWN
    )
      return;
    const s = state(),
      pick = info.pickInfo,
      uv = pick?.getTextureCoordinates();
    let selected: SurfaceButton | undefined,
      nextWidget: typeof hovered = null;
    const event = info.event as PointerEvent;
    const widget = pick?.pickedMesh?.metadata?.propPage as
      (typeof widgets)[number] | undefined;
    const graphPoint =
      uv && widget?.wall === "quests"
        ? { x: uv.x * 1024, y: (1 - uv.y) * 576 }
        : null;
    if (graphDrag && info.type === PointerEventTypes.POINTERMOVE) {
      const dx = graphPoint
        ? graphPoint.x - graphDrag.x
        : (event.clientX - graphDrag.clientX) * 1.1;
      const dy = graphPoint
        ? graphPoint.y - graphDrag.y
        : (event.clientY - graphDrag.clientY) * 1.1;
      if (Math.hypot(dx, dy) > 6) graphDrag.moved = true;
      if (graphDrag.moved && !s.locked && s.wall === "quests")
        action({
          kind: "graph-view",
          id: "pan",
          view: panGraph(graphDrag.view, dx, dy),
        });
      surface.style.cursor = "grabbing";
      return;
    }
    if (info.type === PointerEventTypes.POINTERUP && graphDrag) {
      const moved = graphDrag.moved;
      const canvas = scene.getEngine().getRenderingCanvas();
      if (canvas?.hasPointerCapture(graphDrag.pointerId))
        canvas.releasePointerCapture(graphDrag.pointerId);
      graphDrag = null;
      if (moved) {
        surface.style.cursor = "grab";
        return;
      }
    }
    if (
      info.type === PointerEventTypes.POINTERDOWN &&
      event.button === 0 &&
      !s.locked &&
      s.wall === "quests" &&
      graphPoint &&
      insideGraph(graphPoint.x, graphPoint.y)
    ) {
      graphDrag = {
        ...graphPoint,
        clientX: event.clientX,
        clientY: event.clientY,
        view: modelFor("quests").graph!.view,
        moved: false,
        pointerId: event.pointerId,
      };
      scene
        .getEngine()
        .getRenderingCanvas()
        ?.setPointerCapture(event.pointerId);
    }
    if (!s.locked && uv && pick?.pickedMesh) {
      const w = pick.pickedMesh.metadata?.propPage as
        (typeof widgets)[number] | undefined;
      if (w && w.wall === s.wall) {
        const x = uv.x * w.width,
          y = (1 - uv.y) * w.height;
        selected = w.zones.find(
          (z) =>
            !z.control.disabled &&
            x >= z.x &&
            x <= z.x + z.w &&
            y >= z.y &&
            y <= z.y + z.h,
        )?.control;
        nextWidget = w;
      }
      const page = bookPageTargets.get(pick.pickedMesh);
      if (
        page &&
        page.wall === s.wall &&
        (page.wall === "desk" || libraryIsReady())
      )
        selected = hitControl(
          modelFor(page.wall).buttons.filter((button) => !button.prop),
          (uv.x + page.side) * 512,
          (1 - uv.y) * 576,
        );
    }
    if (info.type === PointerEventTypes.POINTERMOVE) {
      hovered = nextWidget;
      hoverControl = selected?.id ?? null;
      surface.style.cursor = selected
        ? "pointer"
        : graphPoint && insideGraph(graphPoint.x, graphPoint.y)
          ? "grab"
          : "";
    }
    if (
      info.type === PointerEventTypes.POINTERUP &&
      info.event.button === 0 &&
      selected
    )
      action(selected.action);
  });
  function libraryIsReady() {
    return progress > 0.97 && Boolean(modelFor("bookshelf").bookOpen);
  }
  const wheel = (event: WheelEvent) => {
    const s = state();
    if (s.locked || s.wall !== "quests") return;
    const canvas = scene.getEngine().getRenderingCanvas()!,
      rect = canvas.getBoundingClientRect();
    const pick = scene.pick(
        event.clientX - rect.left,
        event.clientY - rect.top,
      ),
      uv = pick?.getTextureCoordinates();
    if (!uv || pick?.pickedMesh?.metadata?.propPage?.wall !== "quests") return;
    const x = uv.x * 1024,
      y = (1 - uv.y) * 576;
    if (!insideGraph(x, y)) return;
    event.preventDefault();
    action({
      kind: "graph-view",
      id: "zoom",
      view: zoomGraph(
        modelFor("quests").graph!.view,
        Math.exp(-Math.max(-200, Math.min(200, event.deltaY)) * 0.002),
        { x: x - GRAPH_AREA.x, y: y - GRAPH_AREA.y },
      ),
    });
  };
  const cancelDrag = () => {
    graphDrag = null;
  };
  surface.addEventListener("wheel", wheel, { passive: false });
  surface.addEventListener("pointercancel", cancelDrag);
  const clearHover = () => {
    hovered = null;
    hoverControl = null;
    surface.style.cursor = "";
  };
  surface.addEventListener("pointerleave", clearHover);
  return () => {
    surface.removeEventListener("wheel", wheel);
    surface.removeEventListener("pointercancel", cancelDrag);
    surface.removeEventListener("pointerleave", clearHover);
    scene.onBeforeRenderObservable.remove(render);
    scene.onPointerObservable.remove(pointer);
    surface.style.cursor = "";
  };
}
