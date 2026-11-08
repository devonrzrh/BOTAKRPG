import { Component, useEffect, useRef, useState, type ReactNode } from "react";
import { useGameSound } from "../ui/GameSound";
import { Engine } from "@babylonjs/core/Engines/engine";
import { WebGPUEngine } from "@babylonjs/core/Engines/webgpuEngine";
import { Scene } from "@babylonjs/core/scene";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { attachBattleEffects } from "./BattleEffects";
import { buildEnemyModel } from "./EnemyModel";
import { buildBattleArena } from "./BattleArena";
import { attachWorldParticles } from "./WorldParticles";
import type { BattleCue } from "../game/combatPresentation";
import "@babylonjs/core/Rendering/edgesRenderer";
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
import {
  cameraRelativeDirection,
  createMovementInput,
  movementKey,
} from "../game/movementInput";
import { buildOffice, type HomeWall } from "./Office";
import { attachOfficeSurfaces } from "./OfficeSurfaces";
import type { SurfaceModel, OfficeAction } from "../game/officeUi";
export interface WorldMetrics {
  backend: string;
  fps: number;
  frameMs: number;
  p95: number;
  samples: number;
  frameTimes: number[];
}
interface Props {
  officeUi?: SurfaceModel[];
  officeFocused?: string | null;
  onOfficeAction?: (action: OfficeAction) => void;
  onRenderFailure?: () => void;
  onRendererReady?: () => void;
  scene: SceneId;
  encounter?: boolean;
  combatCue?: BattleCue | null;
  finalBoss?: boolean;
  enemyId?: string;
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
  { children: ReactNode; onFailure?: () => void },
  { error: string }
> {
  state = { error: "" };
  static getDerivedStateFromError(error: Error) {
    return { error: error.message };
  }
  componentDidCatch() {
    this.props.onFailure?.();
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
    <WorldBoundary key={props.renderer} onFailure={props.onRenderFailure}>
      <WorldCanvas {...props} />
    </WorldBoundary>
  );
}
function WorldCanvas(props: Props) {
  const sound = useGameSound();
  const [motionQuery] = useState(() =>
    window.matchMedia("(prefers-reduced-motion: reduce)"),
  );
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
        latest.current.onRendererReady?.();
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
        if (engineRef.current === engine) engineRef.current = null;
        if (disposed) return;
        latest.current.onRenderFailure?.();
        setError(String(e));
        engine?.dispose();
      }
    };
    void start();
    // WebGPU resize is valid only after initAsync has installed the engine.
    const resize = () => {
      if (!disposed && engine && engineRef.current === engine) engine.resize();
    };
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
    // Babylon otherwise skips move picking on meshes without ActionManagers.
    // Include foreground geometry so hover keeps the same occlusion as clicks.
    scene.constantlyUpdateMeshUnderPointer = true;
    scene.doNotHandleCursors = true;
    sceneRef.current = scene;
    if (props.scene === "desk") {
      actorRef.current = null;
      const disposeOffice = buildOffice(
        scene,
        canvas.current!.parentElement!,
        () => ({
          wall: latest.current.homeWall ?? "investigation",
          reducedMotion: latest.current.reducedMotion || motionQuery.matches,
          locked: latest.current.homeLookLocked ?? false,
          reading: latest.current.officeUi?.find((m) => m.id === "bookshelf")
            ?.bookOpen,
        }),
      );
      const disposeUi = attachOfficeSurfaces(
        scene,
        canvas.current!.parentElement!,
        () => ({
          models: latest.current.officeUi ?? [],
          wall: latest.current.homeWall ?? "investigation",
          locked: latest.current.homeLookLocked ?? false,
          focused: latest.current.officeFocused ?? null,
          reducedMotion: latest.current.reducedMotion || motionQuery.matches,
        }),
        (action) => latest.current.onOfficeAction?.(action),
      );
      return () => {
        disposeUi();
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
      // Leave the upper strip for the enemy's name and HP, above its silhouette.
      camera.target.set(5, 3.1, 4);
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
    if (!props.encounter) camera.attachControl(canvas.current!, true);
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
    const enemyId = props.enemyId ?? "sentinel-a-03";
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
    let disposeBattleEffects: (() => void) | undefined;
    let disposeBattleArena: (() => void) | undefined;
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
      for (const [x, z] of [
        [-7, -5],
        [-7, 4],
        [6, 5],
        [5, -6],
      ])
        tree(x, z, 0.85);
    } else if (props.encounter) {
      const arena = buildBattleArena(scene, enemyId);
      disposeBattleArena = arena.dispose;
      const enemyRig = buildEnemyModel(scene, enemyId);
      disposeBattleEffects = attachBattleEffects(scene, enemyRig, () => ({
        cue: latest.current.combatCue ?? null,
        reducedMotion: latest.current.reducedMotion || motionQuery.matches,
      }));
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
    const disposeWorldParticles = !props.encounter
      ? attachWorldParticles(scene, () => {
          const current = latest.current;
          const maze = current.maze;
          return {
            position: actor.position,
            goal:
              current.scene === "maze"
                ? {
                    x: maze.goal[0] - maze.size / 2,
                    y: 0.35,
                    z: maze.goal[1] - maze.size / 2,
                  }
                : undefined,
            atGoal:
              current.scene === "maze" &&
              maze.position[0] === maze.goal[0] &&
              maze.position[1] === maze.goal[1],
            reducedMotion: current.reducedMotion || motionQuery.matches,
            locked: current.locked,
          };
        })
      : undefined;
    const targets = scene.meshes.filter((mesh) => mesh.metadata?.interaction);
    for (const mesh of targets) {
      mesh.enableEdgesRendering();
      mesh.edgesColor = new Color4(1, 0.79, 0.45, 1);
      mesh.edgesWidth = 4;
      if (mesh.edgesRenderer) mesh.edgesRenderer.isEnabled = false;
    }
    const clearHover = () => {
      for (const mesh of targets)
        if (mesh.edgesRenderer) mesh.edgesRenderer.isEnabled = false;
      if (canvas.current) canvas.current.style.cursor = "";
    };
    const activeCanvas = canvas.current!;
    activeCanvas.addEventListener("pointerleave", clearHover);
    const interactions = scene.onPointerObservable.add((info) => {
      const id = latest.current.locked
        ? undefined
        : info.pickInfo?.pickedMesh?.metadata?.interaction;
      if (info.type === PointerEventTypes.POINTERMOVE) {
        for (const mesh of targets)
          if (mesh.edgesRenderer)
            mesh.edgesRenderer.isEnabled = Boolean(
              id && mesh.metadata.interaction === id,
            );
        if (canvas.current) canvas.current.style.cursor = id ? "pointer" : "";
      }
      if (info.type === PointerEventTypes.POINTERPICK) {
        if (id) latest.current.onInteract(id);
      }
    });
    const movement = createMovementInput();
    const canMove = (target: EventTarget | null = document.activeElement) => {
      if (
        latest.current.scene === "desk" ||
        latest.current.encounter ||
        latest.current.locked
      )
        return false;
      if (!(target instanceof Element)) return true;
      if (
        target.closest(
          'input,textarea,select,[role="menu"],[role="dialog"],[contenteditable="true"],.blocklyDiv',
        )
      )
        return false;
      // Manual-mode controls must not require an extra click on the canvas.
      if (
        latest.current.scene === "maze" &&
        target.closest(
          ".maze-manual .dpad, .maze-manual .maze-content > .segmented > button.selected",
        )
      )
        return true;
      return !target.closest("button,a,summary");
    };
    const step = (screenDirection: Direction) => {
      const direction = cameraRelativeDirection(screenDirection, camera.alpha);
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
        if (!blocked && Math.abs(nx) < 9 && Math.abs(nz) < 7.5) {
          hubPosition.current.set(nx, 0.5, nz);
          sound("move");
        } else sound("blocked");
      }
    };
    const down = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        event.ctrlKey ||
        event.altKey ||
        event.metaKey ||
        !canMove(event.target)
      ) {
        movement.clear();
        return;
      }
      if (movementKey(event.key)) {
        event.preventDefault();
        if (event.repeat) return;
        const direction = movement.press(event.key, performance.now());
        if (direction) step(direction);
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
    const up = (event: KeyboardEvent) =>
      movement.release(event.key, performance.now());
    const clearMovement = () => movement.clear();
    const movementTimer = window.setInterval(() => {
      if (!canMove() || document.hidden) {
        movement.clear();
        return;
      }
      const direction = movement.tick(performance.now());
      if (direction) step(direction);
    }, 30);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", clearMovement);
    document.addEventListener("visibilitychange", clearMovement);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", clearMovement);
      document.removeEventListener("visibilitychange", clearMovement);
      window.clearInterval(movementTimer);
      engine.onResizeObservable.remove(obs);
      scene.onPointerObservable.remove(interactions);
      activeCanvas.removeEventListener("pointerleave", clearHover);
      if (canvas.current) canvas.current.style.cursor = "";
      if (sceneRef.current === scene) sceneRef.current = null;
      actorRef.current = null;
      disposeBattleEffects?.();
      disposeBattleArena?.();
      disposeWorldParticles?.();
      scene.dispose();
    };
  }, [
    ready,
    props.scene,
    props.maze.seed,
    props.renderer,
    props.encounter,
    props.finalBoss,
    props.enemyId,
  ]);
  return (
    <>
      <canvas
        ref={canvas}
        className={`world-canvas ${props.scene === "maze" ? "maze-world" : ""} ${props.encounter ? "boss-world" : ""}`}
        aria-label={
          props.scene === "desk"
            ? "Detective office. Investigation wall, bookshelf, quest board, and clue ledger."
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
