import { Component, useEffect, useRef, useState, type ReactNode } from "react";
import { Engine } from "@babylonjs/core/Engines/engine";
import { WebGPUEngine } from "@babylonjs/core/Engines/webgpuEngine";
import { Scene } from "@babylonjs/core/scene";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import { PointLight } from "@babylonjs/core/Lights/pointLight";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { PointerEventTypes } from "@babylonjs/core/Events/pointerEvents";
import "@babylonjs/core/Engines/Extensions/engine.dynamicTexture";
import "@babylonjs/core/Engines/WebGPU/Extensions/engine.dynamicTexture";
import type { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import type {
  Cell,
  Direction,
  RendererPreference,
  SceneId,
} from "../game/contracts";
import type { Maze } from "../game/maze";
import { buildOffice, type HomeWall } from "./Office";
export interface WorldMetrics {
  backend: string;
  fps: number;
  frameMs: number;
  p95: number;
  samples: number;
  frameTimes: number[];
}
interface Props {
  scene: SceneId;
  encounter?: boolean;
  finalBoss?: boolean;
  homeWall?: HomeWall;
  homeLookLocked?: boolean;
  maze: Maze;
  renderer: RendererPreference;
  reducedMotion: boolean;
  locked: boolean;
  onInteract: (id: string) => void;
  onMove: (direction: Direction) => void;
  onMetrics: (metrics: WorldMetrics) => void;
}
const locations = [
  { id: "library", label: "Library", x: -5, z: -3 },
  { id: "maze", label: "Packet labyrinth", x: 5, z: -3 },
  { id: "battle", label: "Sentinel A-03", x: 5, z: 4 },
  { id: "garden", label: "Perceptron lab", x: -5, z: 4 },
  { id: "quest", label: "Caseboard", x: 0, z: -5 },
];
class WorldBoundary extends Component<
  { children: ReactNode },
  { error: string }
> {
  state = { error: "" };
  static getDerivedStateFromError(error: Error) {
    return { error: error.message };
  }
  render() {
    return this.state.error ? (
      <div className="world-error">
        <h2>The world couldn’t render</h2>
        <p>{this.state.error}</p>
        <p>
          Try another renderer in Settings. All activities remain available
          through the navigation.
        </p>
      </div>
    ) : (
      this.props.children
    );
  }
}
export function World(props: Props) {
  return (
    <WorldBoundary key={props.renderer}>
      <WorldCanvas {...props} />
    </WorldBoundary>
  );
}
function WorldCanvas(props: Props) {
  const canvas = useRef<HTMLCanvasElement>(null),
    latest = useRef(props);
  latest.current = props;
  const engineRef = useRef<AbstractEngine | null>(null),
    sceneRef = useRef<Scene | null>(null),
    actorRef = useRef<Mesh | null>(null);
  const [ready, setReady] = useState(0),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("Establishing the scene…");
  const hubPosition = useRef(new Vector3(0, 0.5, 1));
  useEffect(() => {
    let disposed = false;
    let engine: AbstractEngine | null = null;
    const start = async () => {
      try {
        if (props.renderer !== "webgl") {
          try {
            if (await WebGPUEngine.IsSupportedAsync) {
              const gpu = new WebGPUEngine(canvas.current!, {
                antialias: true,
              });
              engine = gpu;
              await gpu.initAsync();
              setNotice("");
            } else if (props.renderer === "webgpu")
              setNotice("WebGPU is unavailable here. Using WebGL2.");
          } catch {
            engine?.dispose();
            engine = null;
            setNotice("WebGPU initialization failed. Using WebGL2.");
          }
        }
        if (!engine) {
          const gl = new Engine(canvas.current!, true, {
            preserveDrawingBuffer: true,
            stencil: true,
            disableWebGL2Support: false,
          });
          engine = gl;
          if (gl.webGLVersion < 2)
            throw new Error("WebGL2 or WebGPU is required.");
          if (props.renderer === "webgl" || props.renderer === "auto")
            setNotice("");
        }
        if (disposed) {
          engine.dispose();
          return;
        }
        engineRef.current = engine;
        setReady((n) => n + 1);
        let ticks: number[] = [],
          lastReport = performance.now();
        engine.runRenderLoop(() => {
          const scene = sceneRef.current;
          if (!scene) return;
          const actor = actorRef.current;
          if (actor) {
            const p = latest.current;
            let target: Vector3;
            if (p.scene === "maze")
              target = new Vector3(
                p.maze.position[0] - p.maze.size / 2,
                0.5,
                p.maze.position[1] - p.maze.size / 2,
              );
            else target = hubPosition.current;
            actor.position = Vector3.Lerp(
              actor.position,
              target,
              p.reducedMotion ? 1 : Math.min(1, engine!.getDeltaTime() / 85),
            );
          }
          scene.render();
          const delta = engine!.getDeltaTime();
          if (delta > 0 && delta < 1000) ticks.push(delta);
          if (performance.now() - lastReport > 1200) {
            const sorted = [...ticks].sort((a, b) => a - b),
              avg = ticks.reduce((a, b) => a + b, 0) / (ticks.length || 1);
            latest.current.onMetrics({
              backend: engine!.isWebGPU ? "WebGPU" : "WebGL2",
              fps: Math.round(1000 / (avg || 16)),
              frameMs: Math.round(avg * 10) / 10,
              p95:
                Math.round(
                  (sorted[Math.floor(sorted.length * 0.95)] ?? 0) * 10,
                ) / 10,
              samples: ticks.length,
              frameTimes: ticks,
            });
            ticks = [];
            lastReport = performance.now();
          }
        });
      } catch (e) {
        setError(String(e));
        engine?.dispose();
      }
    };
    void start();
    const resize = () => engine?.resize();
    window.addEventListener("resize", resize);
    const sizeObserver = new ResizeObserver(resize);
    if (canvas.current) sizeObserver.observe(canvas.current);
    return () => {
      disposed = true;
      window.removeEventListener("resize", resize);
      sizeObserver.disconnect();
      sceneRef.current?.dispose();
      sceneRef.current = null;
      engine?.dispose();
      engineRef.current = null;
    };
  }, [props.renderer]);
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    const scene = new Scene(engine);
    sceneRef.current = scene;
    if (props.scene === "desk") {
      actorRef.current = null;
      const disposeOffice = buildOffice(
        scene,
        canvas.current!.parentElement!,
        () => ({
          wall: latest.current.homeWall ?? "investigation",
          reducedMotion: latest.current.reducedMotion,
          locked: latest.current.homeLookLocked ?? false,
        }),
        (id) => latest.current.onInteract(id),
      );
      return () => {
        disposeOffice();
        if (sceneRef.current === scene) sceneRef.current = null;
        scene.dispose();
      };
    }
    scene.clearColor = new Color4(0.043, 0.082, 0.114, 1);
    scene.ambientColor = new Color3(0.3, 0.3, 0.25);
    const camera = new ArcRotateCamera(
      "camera",
      -Math.PI / 2.8,
      0.76,
      props.scene === "maze" ? 21 : 27,
      new Vector3(0, 0, 0),
      scene,
    );
    camera.mode = ArcRotateCamera.ORTHOGRAPHIC_CAMERA;
    if (props.encounter) {
      camera.alpha = -Math.PI / 2;
      camera.beta = 1.18;
      camera.target.set(5, 1.55, 4);
    }
    const view = props.encounter ? 2.9 : props.scene === "maze" ? 9 : 12;
    const resize = () => {
      const aspect = engine.getRenderWidth() / engine.getRenderHeight();
      const vertical = view / Math.min(1, aspect);
      camera.orthoTop = vertical;
      camera.orthoBottom = -vertical;
      camera.orthoLeft = -vertical * aspect;
      camera.orthoRight = vertical * aspect;
    };
    resize();
    const obs = engine.onResizeObservable.add(resize);
    camera.attachControl(canvas.current!, true);
    camera.inputs.removeByType("ArcRotateCameraKeyboardMoveInput");
    camera.lowerBetaLimit = 0.4;
    camera.upperBetaLimit = 1.15;
    camera.lowerRadiusLimit = 18;
    camera.upperRadiusLimit = 32;
    camera.panningSensibility = 0;
    new HemisphericLight("sky", new Vector3(0.3, 1, 0.2), scene).intensity =
      0.58;
    const sun = new DirectionalLight("sun", new Vector3(-0.5, -1, 0.5), scene);
    sun.intensity = 0.72;
    sun.diffuse = new Color3(1, 0.93, 0.79);
    const mat = (name: string, color: string, emissive = false) => {
      const m = new StandardMaterial(name, scene);
      m.diffuseColor = Color3.FromHexString(color);
      m.specularColor = new Color3(0.06, 0.06, 0.06);
      if (emissive) m.emissiveColor = m.diffuseColor.scale(0.35);
      return m;
    };
    const stone = mat("steel", "#344854"),
      light = mat("alloy", "#728c94"),
      edge = mat("carbon", "#142630"),
      grass = mat("circuit floor", "#172d35"),
      dark = mat("deep carbon", "#14242d"),
      gold = mat("amber", "#d6a25f", true),
      teal = mat("signal cyan", "#4fb6c2", true),
      wood = mat("walnut", "#655044"),
      red = mat("oxblood", "#a15c58");
    const box = (
      name: string,
      x: number,
      y: number,
      z: number,
      w: number,
      h: number,
      d: number,
      m = stone,
    ) => {
      const mesh = MeshBuilder.CreateBox(
        name,
        { width: w, height: h, depth: d },
        scene,
      );
      mesh.position.set(x, y, z);
      mesh.material = m;
      return mesh;
    };
    const cylinder = (
      name: string,
      x: number,
      y: number,
      z: number,
      r: number,
      h: number,
      m = stone,
      vertices = 12,
    ) => {
      const mesh = MeshBuilder.CreateCylinder(
        name,
        { diameter: r * 2, height: h, tessellation: vertices },
        scene,
      );
      mesh.position.set(x, y, z);
      mesh.material = m;
      return mesh;
    };
    const label = (
      text: string,
      x: number,
      y: number,
      z: number,
      id: string,
    ) => {
      const texture = new DynamicTexture(
        `label-${id}`,
        { width: 768, height: 128 },
        scene,
        false,
      );
      texture.hasAlpha = true;
      texture.drawText(
        text,
        null,
        82,
        "500 48px Georgia",
        "#eee7cf",
        "rgba(20,38,34,0.86)",
        true,
      );
      const material = mat(`label-${id}`, "#ffffff");
      material.diffuseTexture = texture;
      material.emissiveColor = Color3.White();
      material.useAlphaFromDiffuseTexture = true;
      material.backFaceCulling = false;
      material.disableLighting = true;
      const plane = MeshBuilder.CreatePlane(
        `sign-${id}`,
        { width: 4.8, height: 0.8 },
        scene,
      );
      plane.position.set(x, y, z);
      plane.billboardMode = Mesh.BILLBOARDMODE_ALL;
      plane.material = material;
      plane.metadata = { interaction: id };
    };
    const tree = (x: number, z: number, scale = 1) => {
      box(
        "data tower",
        x,
        1.2 * scale,
        z,
        0.7 * scale,
        2.4 * scale,
        0.7 * scale,
        dark,
      );
      for (let n = 0; n < 5; n++)
        box(
          "data indicator",
          x,
          (0.4 + n * 0.4) * scale,
          z - 0.36 * scale,
          0.45 * scale,
          0.06 * scale,
          0.04,
          n % 2 ? teal : gold,
        );
      box(
        "tower cap",
        x,
        2.45 * scale,
        z,
        0.85 * scale,
        0.12,
        0.85 * scale,
        stone,
      );
    };
    const pillar = (x: number, z: number, height = 2.4) => {
      box("plinth", x, 0.15, z, 0.85, 0.3, 0.85, edge);
      cylinder("column", x, height / 2 + 0.3, z, 0.27, height, light);
      box("capital", x, height + 0.35, z, 0.85, 0.25, 0.85, light);
    };
    if (props.scene === "maze") {
      const m = props.maze;
      box(
        "maze foundation",
        -0.5,
        -0.65,
        -0.5,
        m.size + 1,
        1.2,
        m.size + 1,
        edge,
      );
      for (let y = 0; y < m.size; y++)
        for (let x = 0; x < m.size; x++) {
          const px = x - m.size / 2,
            pz = y - m.size / 2;
          if (m.grid[y][x]) {
            box("maze wall", px, 0.48, pz, 0.94, 1.1, 0.94, stone);
            box("wall cap", px, 1.06, pz, 0.98, 0.12, 0.98, light);
          } else
            box(
              "path",
              px,
              -0.03,
              pz,
              0.92,
              0.12,
              0.92,
              (x + y) % 3 ? edge : grass,
            );
        }
      const [gx, gy] = m.goal;
      cylinder(
        "goal seal",
        gx - m.size / 2,
        0.08,
        gy - m.size / 2,
        0.43,
        0.12,
        gold,
      );
      label("THE EXIT", gx - m.size / 2, 1.6, gy - m.size / 2, "exit");
      for (const [x, z] of [
        [-7, -5],
        [-7, 4],
        [6, 5],
        [5, -6],
      ])
        tree(x, z, 0.85);
    } else if (props.encounter) {
      box("arena floor", 5, -0.2, 4, 24, 0.3, 18, dark);
      box("arena wall", 5, 3, 8, 24, 7, 0.3, edge);
      for (let i = 0; i < 9; i++) {
        const x = -3 + i * 2;
        box("server rack", x, 2, 7, 1.2, 4, 0.7, stone);
        for (let j = 0; j < 7; j++)
          box(
            "server light",
            x,
            0.6 + j * 0.45,
            6.62,
            0.7,
            0.04,
            0.03,
            j % 3 ? teal : gold,
          );
      }
      cylinder("sentinel platform", 5, 0.05, 4, 3, 0.2, stone, 32);
      cylinder("platform ring", 5, 0.17, 4, 2.4, 0.04, teal, 32);
      cylinder("platform inset", 5, 0.2, 4, 2.25, 0.04, edge, 32);
      box("sentinel torso", 5, 1.55, 4, 1.45, 1.65, 0.85, light);
      box("chest plate", 5, 1.55, 3.53, 1.14, 1.1, 0.13, stone);
      box("chest indicator", 5, 1.7, 3.44, 0.42, 0.13, 0.05, teal);
      box("sentinel head", 5, 2.75, 4, 1.05, 0.7, 0.8, stone);
      box(
        "optical visor",
        5,
        2.8,
        3.57,
        0.84,
        0.16,
        0.06,
        props.finalBoss ? red : gold,
      );
      for (const side of [-1, 1]) {
        box("shoulder", 5 + side * 1.03, 2.12, 4, 0.55, 0.5, 0.85, stone);
        box("arm", 5 + side * 1.03, 1.43, 4, 0.4, 1.05, 0.55, light);
        box("hand", 5 + side * 1.03, 0.82, 4, 0.44, 0.32, 0.55, stone);
        box("leg", 5 + side * 0.43, 0.52, 4, 0.47, 0.6, 0.6, light);
        box("foot", 5 + side * 0.43, 0.28, 3.86, 0.57, 0.2, 0.9, stone);
      }
      const spotlight = new PointLight(
        "sentinel light",
        new Vector3(5, 3, 1),
        scene,
      );
      spotlight.diffuse = new Color3(0.45, 0.78, 1);
      spotlight.intensity = 1;
      spotlight.range = 9;
    } else {
      box("floating foundation", 0, -1.1, 0, 20, 2, 17, edge);
      box("academy grounds", 0, -0.1, 0, 20, 0.25, 17, grass);
      box("front trim", 0, -0.5, 8.6, 20.5, 0.4, 0.3, light);
      for (let x = -8; x <= 8; x++)
        for (let z = -6; z <= 6; z++)
          if (Math.abs(x) < 2 || Math.abs(z) < 2)
            box(
              "courtyard tile",
              x,
              0.05,
              z,
              0.95,
              0.15,
              0.95,
              (x + z) % 4 === 0 ? light : stone,
            );
      // Open library pavilion and an actual selectable desk.
      box("library platform", -5, 0.13, -3, 5, 0.3, 4.5, light);
      for (const x of [-7, -3]) for (const z of [-4.8, -1.2]) pillar(x, z, 3.1);
      box("library lintel", -5, 3.7, -4.8, 5, 0.45, 0.8, light);
      box("library canopy", -5, 3.9, -3, 5.5, 0.25, 4.8, edge);
      const desk = box("reading desk", -5, 1, -2.8, 2.7, 0.25, 1.4, wood);
      desk.metadata = { interaction: "library" };
      for (const x of [-6, -4])
        box("desk leg", x, 0.5, -2.8, 0.18, 1, 0.7, wood);
      for (let i = 0; i < 5; i++) {
        const book = box(
          "book",
          -5.8 + i * 0.32,
          1.2,
          -2.8,
          0.25,
          0.15 + (i % 2) * 0.12,
          0.6,
          i % 2 ? teal : red,
        );
        book.metadata = { interaction: "library" };
      }
      label("THE LIBRARY", -5, 4.8, -3, "library");
      // Maze gate.
      for (const x of [3.7, 6.3]) pillar(x, -3, 3.2);
      box("arch", 5, 3.7, -3, 3.5, 0.7, 1, light);
      const door = box("maze portal", 5, 1.6, -3, 1.8, 2.8, 0.18, teal);
      door.metadata = { interaction: "maze" };
      label("PACKET LABYRINTH", 5, 4.8, -3, "maze");
      for (let i = 0; i < 3; i++)
        box(
          "gate steps",
          5,
          0.08 + i * 0.1,
          -1.8 - i * 0.3,
          3 - i * 0.2,
          0.16,
          0.4,
          stone,
        );
      // Guardian arena.
      cylinder("arena", 5, 0.1, 4, 2.6, 0.3, stone, 24);
      cylinder("arena seal", 5, 0.28, 4, 1.9, 0.06, edge, 24);
      const guardian = box("archive guardian", 5, 1.2, 4, 1.15, 1.6, 0.8, edge);
      guardian.metadata = { interaction: "battle" };
      const head = box("guardian head", 5, 2.2, 4, 0.85, 0.65, 0.8, light);
      head.metadata = { interaction: "battle" };
      box("guardian eye", 5, 2.25, 3.58, 0.55, 0.12, 0.08, gold);
      for (const x of [4.15, 5.85])
        box("guardian arm", x, 1.25, 4, 0.4, 1.1, 0.55, stone);
      if (!props.encounter) label("SENTINEL A-03", 5, 3.6, 4, "battle");
      // The learning garden.
      cylinder("garden pool", -5, 0.1, 4, 2.4, 0.3, stone, 24);
      cylinder("garden water", -5, 0.28, 4, 2, 0.1, teal, 32);
      for (let i = 0; i < 7; i++) {
        const a = (i / 7) * Math.PI * 2;
        const node = MeshBuilder.CreateSphere(
          "neuron",
          { diameter: 0.45, segments: 8 },
          scene,
        );
        node.position.set(
          -5 + Math.cos(a) * 1.4,
          0.85 + (i % 2) * 0.55,
          4 + Math.sin(a) * 1.4,
        );
        node.material = gold;
        node.metadata = { interaction: "garden" };
        cylinder(
          "neuron stem",
          node.position.x,
          0.5,
          node.position.z,
          0.06,
          0.8,
          wood,
        );
      }
      label("INFERENCE LAB", -5, 3.6, 4, "garden");
      cylinder("academy seal", 0, 0.2, -5, 1.1, 0.35, gold);
      label("TRACE RELAY", 0, 2, -5, "quest");
      for (const [x, z, s] of [
        [-9, -6, 1],
        [-8, 6, 1.2],
        [9, -6, 1.2],
        [9, 6, 1],
        [-1, -7, 1],
        [2, 7, 0.8],
      ])
        tree(x, z, s);
      for (let i = 0; i < 28; i++) {
        const x = Math.sin(i * 8.2) * 9,
          z = Math.cos(i * 3.8) * 7;
        if (Math.abs(x) < 2 || Math.abs(z) < 2) continue;
        box("grass tuft", x, 0.15, z, 0.13, 0.3, 0.13, dark);
      }
      hubPosition.current.set(0, 0.5, 1);
    }
    const actor = cylinder("wanderer", 0, 0.5, 0, 0.24, 0.75, red, 8);
    actorRef.current = actor;
    if (props.encounter) actor.setEnabled(false);
    const head = MeshBuilder.CreateSphere(
      "wanderer head",
      { diameter: 0.4, segments: 8 },
      scene,
    );
    head.parent = actor;
    head.position.y = 0.58;
    head.material = light;
    const hat = MeshBuilder.CreateCylinder(
      "wanderer hat",
      { diameterTop: 0, diameterBottom: 0.65, height: 0.55, tessellation: 7 },
      scene,
    );
    hat.parent = actor;
    hat.position.y = 0.95;
    hat.material = dark;
    if (props.scene === "maze")
      actor.position.set(
        props.maze.position[0] - props.maze.size / 2,
        0.5,
        props.maze.position[1] - props.maze.size / 2,
      );
    else actor.position.copyFrom(hubPosition.current);
    const interactions = scene.onPointerObservable.add((info) => {
      if (info.type === PointerEventTypes.POINTERPICK) {
        const id = info.pickInfo?.pickedMesh?.metadata?.interaction;
        if (id) latest.current.onInteract(id);
      }
    });
    const down = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (latest.current.scene === "desk" || latest.current.encounter) return;
      if (
        target.closest(
          'input,textarea,select,[contenteditable="true"],.blocklyDiv',
        ) ||
        latest.current.locked
      )
        return;
      const keys: Record<string, Direction> = {
        w: "north",
        ArrowUp: "north",
        d: "east",
        ArrowRight: "east",
        s: "south",
        ArrowDown: "south",
        a: "west",
        ArrowLeft: "west",
      };
      const direction = keys[event.key];
      if (direction) {
        event.preventDefault();
        if (latest.current.scene === "maze") latest.current.onMove(direction);
        else {
          const vectors: Record<Direction, Cell> = {
            north: [0, -0.45],
            east: [0.45, 0],
            south: [0, 0.45],
            west: [-0.45, 0],
          };
          const [dx, dz] = vectors[direction],
            p = hubPosition.current,
            nx = p.x + dx,
            nz = p.z + dz;
          const blocked =
            (nx > -6.5 && nx < -3.5 && nz > -3.5 && nz < -2.1) ||
            (Math.abs(nx - 5) < 0.9 && Math.abs(nz - 4) < 0.9);
          if (!blocked && Math.abs(nx) < 9 && Math.abs(nz) < 7.5)
            hubPosition.current.set(nx, 0.5, nz);
        }
      }
      if (event.key === "e" || event.key === "Enter") {
        const p = hubPosition.current;
        const nearest = [...locations].sort(
          (a, b) =>
            Math.hypot(a.x - p.x, a.z - p.z) - Math.hypot(b.x - p.x, b.z - p.z),
        )[0];
        if (Math.hypot(nearest.x - p.x, nearest.z - p.z) < 3)
          latest.current.onInteract(nearest.id);
      }
    };
    window.addEventListener("keydown", down);
    return () => {
      window.removeEventListener("keydown", down);
      engine.onResizeObservable.remove(obs);
      scene.onPointerObservable.remove(interactions);
      if (sceneRef.current === scene) sceneRef.current = null;
      actorRef.current = null;
      scene.dispose();
    };
  }, [
    ready,
    props.scene,
    props.maze.seed,
    props.renderer,
    props.encounter,
    props.finalBoss,
  ]);
  return (
    <>
      <canvas
        ref={canvas}
        className={`world-canvas ${props.scene === "maze" ? "maze-world" : ""} ${props.encounter ? "boss-world" : ""}`}
        aria-label={
          props.scene === "desk"
            ? "Detective office. Investigation wall, bookshelf, quest board, and inventory desk."
            : "Interactive network world. WASD to move, E to interact. Use destination buttons for keyboard navigation."
        }
        tabIndex={0}
      />
      {error ? (
        <div className="world-error">
          <h2>The 3D world couldn’t start</h2>
          <p>{error}</p>
          <p>You can still use the destination controls and 2D maze below.</p>
        </div>
      ) : (
        notice && <div className="world-notice">{notice}</div>
      )}
    </>
  );
}
