import { UniversalCamera } from "@babylonjs/core/Cameras/universalCamera";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { PointLight } from "@babylonjs/core/Lights/pointLight";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { CreateCylinder } from "@babylonjs/core/Meshes/Builders/cylinderBuilder";
import { CreateGround } from "@babylonjs/core/Meshes/Builders/groundBuilder";
import { CreatePlane } from "@babylonjs/core/Meshes/Builders/planeBuilder";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { Scene } from "@babylonjs/core/scene";
import { cinematicFootfalls } from "../game/cinematicFootfalls";
import { createCinematicGait, smooth } from "./CinematicGait";
import { buildEnemyModel } from "./EnemyModel";

const cityShots = ["transit-platform", "rail-pursuit", "abandoned-chassis"];
const networkShots = [
  "gateway-sentry",
  "echo-threshold",
  "echo-surrender",
  "echo-isolation",
];
const deskShots = [
  "office-terminal",
  "evidence-board",
  "ledger-open",
  "ledger-closed",
];
export const cinematicShots = [...cityShots, ...networkShots, ...deskShots];

const cyan = "#77e9ef";
const amber = "#ffbe70";
const steel = "#364a57";
const panel = "#19252f";
const black = "#101820";

export function buildCinematicStage(scene: Scene, shot: string) {
  scene.clearColor = new Color4(0.024, 0.044, 0.066, 1);
  scene.fogMode = Scene.FOGMODE_EXP2;
  scene.fogColor = Color3.FromHexString("#142331");
  scene.fogDensity = 0.038;
  const camera = new UniversalCamera("cinematic camera", Vector3.Zero(), scene);
  scene.activeCamera = camera;
  camera.minZ = 0.08;
  camera.maxZ = 90;
  const aspect = () => scene.getEngine().getAspectRatio(camera);
  const view = (
    x: number,
    y: number,
    z: number,
    targetX: number,
    targetY: number,
    targetZ: number,
    lens = 0.65,
  ) => {
    camera.fov = lens;
    camera.position.set(x, y, z);
    const target = new Vector3(targetX, targetY, targetZ);
    const offset = camera.position.subtract(target);
    if (aspect() < 1.3) camera.position.addInPlace(offset.scale(0.35));
    camera.setTarget(target);
  };

  const fill = new HemisphericLight(
    "overcast fill",
    new Vector3(0, 1, 0),
    scene,
  );
  fill.diffuse = Color3.FromHexString("#b8d7ef");
  fill.groundColor = Color3.FromHexString("#526479");
  fill.intensity = 0.32;
  const light = (
    name: string,
    x: number,
    y: number,
    z: number,
    hue: string,
    intensity: number,
    range: number,
  ) => {
    const result = new PointLight(name, new Vector3(x, y, z), scene);
    result.diffuse = Color3.FromHexString(hue);
    result.intensity = intensity;
    result.range = range;
    return result;
  };
  const materials = new Map<string, StandardMaterial>();
  const material = (color: string, glow = false) => {
    const key = `${color}:${glow}`;
    const existing = materials.get(key);
    if (existing) return existing;
    const result = new StandardMaterial(key, scene);
    result.diffuseColor = Color3.FromHexString(color);
    result.specularColor = new Color3(0.16, 0.2, 0.24);
    if (glow) result.emissiveColor = result.diffuseColor.scale(0.9);
    materials.set(key, result);
    return result;
  };
  const box = (
    name: string,
    x: number,
    y: number,
    z: number,
    width: number,
    height: number,
    depth: number,
    color: string,
    glow = false,
    parent?: TransformNode,
  ) => {
    const mesh = CreateBox(name, { width, height, depth }, scene);
    if (parent) mesh.parent = parent;
    mesh.position.set(x, y, z);
    mesh.material = material(color, glow);
    return mesh;
  };
  const display = (
    x: number,
    y: number,
    z: number,
    width: number,
    height: number,
    parent?: TransformNode,
  ) => {
    box(
      "terminal frame",
      x,
      y,
      z + 0.065,
      width + 0.16,
      height + 0.16,
      0.14,
      steel,
      false,
      parent,
    );
    const glass = CreatePlane("terminal glass", { width, height }, scene);
    if (parent) glass.parent = parent;
    glass.position.set(x, y, z - 0.012);
    const texture = new DynamicTexture(
      "terminal lettering",
      { width: 512, height: 256 },
      scene,
      false,
    );
    const surface = new StandardMaterial("terminal phosphor", scene);
    surface.emissiveTexture = texture;
    surface.disableLighting = true;
    glass.material = surface;
    let previous = "";
    return (title: string, detail: string, ink = cyan) => {
      const key = title + detail + ink;
      if (previous === key) return;
      previous = key;
      const ctx = texture.getContext();
      ctx.fillStyle = "#09171f";
      ctx.fillRect(0, 0, 512, 256);
      ctx.fillStyle = ink;
      ctx.fillRect(30, 64, 452, 2);
      ctx.font = "24px monospace";
      ctx.fillText(title, 30, 48);
      ctx.font = "bold 35px monospace";
      ctx.fillText(detail, 30, 143, 452);
      texture.update();
    };
  };
  const shadowTexture = new DynamicTexture("contact shadow", 128, scene, false);
  const shadowCtx = shadowTexture.getContext();
  const gradient = shadowCtx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, "#03060ad9");
  gradient.addColorStop(0.5, "#03060a82");
  gradient.addColorStop(1, "#03060a00");
  shadowCtx.fillStyle = gradient;
  shadowCtx.fillRect(0, 0, 128, 128);
  shadowTexture.hasAlpha = true;
  shadowTexture.update();
  const contact = new StandardMaterial("contact shadow", scene);
  contact.diffuseTexture = shadowTexture;
  contact.useAlphaFromDiffuseTexture = true;
  contact.disableLighting = true;
  contact.emissiveColor.set(0.018, 0.024, 0.04);
  const shadow = (size: number) => {
    const decal = CreateGround(
      "ground contact",
      { width: size, height: size },
      scene,
    );
    decal.material = contact;
    decal.position.y = 0.018;
    return decal;
  };

  if (deskShots.includes(shot)) {
    const connecting = shot === "office-terminal";
    const channelOpen = shot === "ledger-open";
    scene.fogDensity = 0.012;
    light("desk lamp", -2, 2.7, 0.1, "#ffc58d", 2.45, 8);
    light("window fill", 2.5, 3, 3, "#70b4e9", 1.6, 7);
    box("back wall", 0, 2.8, 3.5, 13, 6, 0.25, panel);
    box("desk", 0, 0.75, 0.3, 8, 0.4, 3.4, "#614932");
    box("desk mat", 0.4, 0.965, 0.3, 4.7, 0.03, 2.2, "#26373a");
    box("window glass", 1.75, 3.3, 3.34, 4.4, 2.8, 0.06, "#344e66", true);
    for (const x of [-0.45, 1.75, 3.95])
      box("window mullion", x, 3.3, 3.28, 0.11, 2.95, 0.12, black);
    for (let i = 0; i < 8; i++) {
      const height = 0.28 + ((i * 7) % 5) * 0.23;
      box(
        "skyline",
        -0.2 + i * 0.55,
        1.9 + height / 2,
        3.26,
        0.48,
        height,
        0.06,
        panel,
      );
    }
    box("lamp base", -2.7, 1.02, 0.6, 0.64, 0.14, 0.62, "#8e6b44");
    box("lamp stem", -2.7, 1.76, 0.6, 0.11, 1.45, 0.1, "#a28357");
    box("lamp shade", -2.45, 2.48, 0.58, 1.15, 0.24, 0.64, "#9b7045");
    box("lamp diffuser", -2.45, 2.35, 0.58, 1.02, 0.026, 0.51, amber, true);
    if (shot === "evidence-board") {
      const boardZ = 2.24;
      box(
        "evidence board frame",
        0,
        2.68,
        boardZ + 0.11,
        5.22,
        2.95,
        0.2,
        "#443329",
      );
      box("cork", 0, 2.68, boardZ + 0.04, 5.02, 2.75, 0.1, "#876244");
      const boardLamp = light("board lamp", -1.35, 3.65, 0.8, "#ffd4a1", 0.9, 6);
      const pins = [
        [-1.77, 3.63],
        [-0.89, 2.58],
        [0.12, 3.7],
        [1.07, 2.58],
        [1.84, 3.54],
      ];
      pins.forEach(([x, y], index) => {
        const paper = new TransformNode("evidence sheet", scene);
        paper.position.set(x, y, boardZ);
        paper.rotation.z = index % 2 ? -0.12 : 0.12;
        box(
          "document",
          0,
          -0.42,
          0,
          0.83,
          1.0,
          0.025,
          index % 2 ? "#b8c9bc" : "#e2c99e",
          false,
          paper,
        );
        box(
          "document heading",
          0,
          -0.19,
          -0.016,
          0.52,
          0.06,
          0.008,
          "#514b3e",
          false,
          paper,
        );
        for (let row = 0; row < 5; row++)
          box(
            "document entry",
            -0.03,
            -0.33 - row * 0.093,
            -0.016,
            0.52 - (row % 3) * 0.08,
            0.024,
            0.008,
            "#777367",
            false,
            paper,
          );
        box("pin", x, y, boardZ - 0.073, 0.085, 0.085, 0.07, "#d27556");
        if (index === 0) return;
        const [fromX, fromY] = pins[index - 1];
        const dx = x - fromX;
        const dy = y - fromY;
        const thread = box(
          "evidence thread",
          (x + fromX) / 2,
          (y + fromY) / 2,
          boardZ - 0.079,
          Math.hypot(dx, dy),
          0.024,
          0.022,
          "#d27556",
        );
        thread.rotation.z = Math.atan2(dy, dx);
      });
      return (t: number) => {
        boardLamp.intensity = 0.2 + smooth(0.65, 1.2, t) * 0.7;
        const push = smooth(0, 5.6, t);
        view(
          -1.9 + push * 2.03,
          2.79 + push * 0.16,
          -4.58 + push * 1.31,
          0,
          2.67,
          boardZ,
          0.6,
        );
      };
    }
    const terminal = new TransformNode("office terminal", scene);
    terminal.position.set(-0.83, 0.94, 0.9);
    terminal.rotation.y = -0.12;
    box(
      "terminal pedestal",
      0,
      0.12,
      0.12,
      0.95,
      0.24,
      0.85,
      panel,
      false,
      terminal,
    );
    const screen = display(0, 0.87, -0.03, 1.8, 0.91, terminal);
    box("keyboard", -0.8, 1.01, 0.04, 1.24, 0.1, 0.38, black);
    for (let i = 0; i < 10; i++)
      for (let j = 0; j < 3; j++)
        box(
          "keycap",
          -1.32 + i * 0.115,
          1.07,
          -0.085 + j * 0.11,
          0.085,
          0.035,
          0.08,
          steel,
        );
    const spine = new TransformNode("case ledger spine", scene);
    spine.position.set(1.19, 1.03, -0.28);
    spine.rotation.y = 0.21;
    box(
      "ledger backing",
      0.49,
      0,
      0,
      1.02,
      0.065,
      1.38,
      "#443735",
      false,
      spine,
    );
    const cover = new TransformNode("ledger cover hinge", scene);
    cover.parent = spine;
    cover.position.y = 0.1;
    box(
      "leather cover",
      -0.5,
      -0.1,
      0,
      1.05,
      0.065,
      1.4,
      "#56453b",
      false,
      cover,
    );
    for (const side of [-1, 1]) {
      const hinge = side < 0 ? cover : spine;
      const base = side < 0 ? -0.1 : 0;
      box(
        "ledger pages",
        side * 0.49,
        base + 0.046,
        0,
        0.98,
        0.045,
        1.32,
        "#b8ae94",
        false,
        hinge,
      );
      for (let row = 0; row < 8; row++)
        box(
          "ledger entry",
          side * 0.49,
          base + 0.07,
          -0.43 + row * 0.12,
          0.74 - (row % 3) * 0.12,
          0.005,
          0.016,
          "#6c6556",
          false,
          hinge,
        );
    }
    box(
      "cover label",
      -0.49,
      -0.135,
      -0.24,
      0.58,
      0.008,
      0.23,
      "#b89765",
      false,
      cover,
    );
    box("ledger spine", 0, 0.063, 0, 0.05, 0.125, 1.4, "#554238", false, spine);
    const relay = box(
      "relay indicator",
      0.46,
      1.08,
      0.78,
      0.2,
      0.11,
      0.2,
      cyan,
      true,
    );
    return (t: number) => {
      const resolved = t >= 1.85;
      const closed = shot === "ledger-closed" ? smooth(1.15, 2.65, t) : 0;
      cover.rotation.z = -Math.PI * closed;
      relay.setEnabled(channelOpen || (connecting && resolved));
      if (connecting) {
        screen(
          "TRANSFER ADDRESS",
          resolved ? "GATEWAY 01 / OPEN" : "RESOLVING…",
        );
        view(
          0.34 - smooth(0, 5.8, t) * 0.62,
          2.03,
          -3.0 + smooth(0, 5.8, t) * 0.62,
          -0.83,
          1.62,
          0.84,
        );
      } else {
        screen(
          "CASE 007 / ECHO-7",
          channelOpen ? "CHANNEL OPEN" : "RELAY OFFLINE",
          channelOpen ? cyan : "#a3a9ad",
        );
        const settle = smooth(0, 4, t);
        view(1.85 - settle * 0.59, 3.48, -2.87, 0.34, 1.21, 0.16, 0.59);
      }
    };
  }

  const city = cityShots.includes(shot);
  const alcove = shot === "abandoned-chassis";
  const chase = shot === "rail-pursuit";
  const platform = shot === "transit-platform";
  const gateway = shot === "gateway-sentry";
  const threshold = shot === "echo-threshold";
  const surrender = shot === "echo-surrender";
  const isolation = shot === "echo-isolation";
  const signal = gateway || city ? amber : cyan;
  const rim = light("cold backlight", 0, 5, 6, "#5acde8", 2.7, 13);
  const rackSignal = isolation ? "#69d8e6" : signal;
  const key = light(
    "side key",
    -3,
    3.6,
    -4,
    city ? "#ffc286" : "#95d6ff",
    3.0,
    13,
  );
  if (city) {
    scene.fogDensity = 0.052;
    fill.intensity = 0.22;
  }
  if (threshold) {
    scene.fogDensity = 0.058;
    fill.intensity = 0.17;
  }
  box("floor foundation", 0, -0.18, 8, 14, 0.32, 65, black);
  const scenery = new Map<StandardMaterial, Mesh[]>();
  const setBox = (...args: Parameters<typeof box>) => {
    const mesh = box(...args);
    const surface = mesh.material as StandardMaterial;
    if (!scenery.has(surface)) scenery.set(surface, []);
    scenery.get(surface)!.push(mesh);
  };
  for (let i = -3; i < 12; i++) {
    const z = i * 3;
    setBox(
      "floor slab",
      0,
      -0.035,
      z,
      city ? 7.8 : 9.8,
      0.07,
      2.94,
      i % 2 === 0 ? "#283744" : "#293b46",
    );
    for (const side of [-1, 1]) {
      const x = side * (city ? 3.85 : 4.65);
      setBox("edge marker", x, 0.013, z, 0.065, 0.027, 1.95, signal, true);
      const columnX = side * (platform ? 4.4 : 4.95);
      setBox("support column", columnX, 2.8, z, 0.42, 5.6, 0.42, steel);
      if (!city || alcove) {
        setBox("recessed wall", side * 5.35, 2.8, z, 0.45, 5.6, 2.93, panel);
        for (let slot = 0; slot < 5; slot++) {
          setBox(
            "rack vent",
            side * 5.06,
            1.25 + slot * 0.46,
            z - 0.8,
            0.22,
            0.37,
            0.97,
            black,
          );
          setBox(
            "rack status",
            side * 4.94,
            1.27 + slot * 0.46,
            z - 0.48,
            0.035,
            0.045,
            0.085,
            rackSignal,
            true,
          );
        }
      } else if (platform) {
        setBox("safety railing", side * 4, 0.88, z, 0.075, 0.085, 2.98, steel);
        setBox("railing upright", side * 4, 0.43, z, 0.105, 0.86, 0.105, steel);
        const height = 5 + ((i * i + 9) % 9);
        setBox(
          "city tower",
          side * (10 + (i % 3)),
          height / 2 - 2,
          z,
          3.2,
          height,
          2.72,
          "#172634",
        );
        for (let row = 0; row < 6; row++)
          setBox(
            "tower lights",
            side * (8.36 + (i % 3)),
            row * 0.88 - 0.6,
            z,
            0.035,
            0.08,
            1.7,
            row % 3 === 0 ? amber : "#507987",
            true,
          );
      } else {
        setBox(
          "retaining wall",
          side * 5.45,
          1.6,
          z,
          0.45,
          3.2,
          2.96,
          "#303b40",
        );
        setBox(
          "steel conduit",
          side * 5.12,
          2.8,
          z,
          0.13,
          0.12,
          2.98,
          "#9c6641",
        );
        setBox(
          "track channel",
          side * 3.45,
          0.025,
          z,
          0.11,
          0.05,
          3,
          "#67737c",
        );
      }
    }
    setBox("roof crossbeam", 0, 5.3, z, 10.45, 0.31, 0.41, steel);
    setBox(
      "overhead strip",
      chase ? -2.2 : 0,
      5.11,
      z,
      chase ? 1.4 : 2.8,
      0.04,
      0.13,
      chase ? amber : cyan,
      true,
    );
    if (chase) {
      setBox("rail deck", 2.96, 5.53, z, 4.75, 0.35, 2.99, black);
      setBox("rail parapet", 0.63, 5.96, z, 0.13, 0.68, 2.98, steel);
    }
    if (platform) setBox("track ties", 5.65, -0.12, z, 2.9, 0.2, 0.3, steel);
  }
  if (platform)
    for (const x of [4.65, 6.65])
      setBox("platform track", x, 0.01, 8, 0.1, 0.16, 65, steel);
  for (const cohort of scenery.values()) Mesh.MergeMeshes(cohort);

  const train = new TransformNode("passing train", scene);
  const passingLight =
    platform || chase
      ? light("passing train light", 0, 0, 0, "#ffd8a2", 0, 16)
      : null;
  if (platform || chase) {
    for (let i = 0; i < 3; i++) {
      const z = i * 5.5;
      box("rail car", 0, 0, z, 2.5, 1.9, 5.35, "#42525b", false, train);
      box("car sill", 0, -0.7, z, 2.58, 0.14, 5.35, amber, true, train);
      for (let j = -2; j <= 2; j++)
        box(
          "car window",
          -1.26,
          0.38,
          z + j * 0.91,
          0.05,
          0.62,
          0.68,
          "#eed4a3",
          true,
          train,
        );
    }
  }
  const doors = threshold
    ? [-1, 1].map((side) => {
        const leaf = new TransformNode("bulkhead leaf", scene);
        box("bulkhead", 0, 2.65, 0, 3.14, 5.32, 0.33, steel, false, leaf);
        box(
          "bulkhead rib",
          -side * 1.22,
          2.64,
          -0.19,
          0.24,
          5.1,
          0.09,
          black,
          false,
          leaf,
        );
        box(
          "bulkhead clearance light",
          -side * 1.42,
          2.64,
          -0.25,
          0.046,
          3.4,
          0.08,
          cyan,
          true,
          leaf,
        );
        return leaf;
      })
    : [];
  if (threshold) {
    box("bulkhead lintel", 0, 5.36, 0.25, 10.6, 0.4, 0.78, steel);
    for (const side of [-1, 1])
      box("bulkhead jamb", side * 3.3, 2.66, 0.25, 0.46, 5.3, 0.78, steel);
    box("end wall", 0, 3.1, 11.7, 10.6, 6.2, 0.5, black);
  }
  const rig = buildEnemyModel(
    scene,
    gateway ? "gateway-sentinel" : "echo-7",
    gateway ? 1.05 : 0.86,
  );
  const actorShadow = shadow(3.6);
  const visor = rig.materials[2];
  const visorColor = Color3.FromHexString(signal);
  const stage = gateway
    ? CreateCylinder(
        "gateway dais",
        { diameter: 5.4, height: 0.17, tessellation: 32 },
        scene,
      )
    : null;
  if (stage) {
    stage.position.set(0, 0.04, 2.1);
    stage.material = material(steel);
    actorShadow.position.y = 0.14;
    for (const side of [-1, 1])
      box("gate upright", side * 2.14, 2.45, 3.55, 0.13, 4.9, 0.2, cyan, true);
    box("gate lintel", 0, 4.89, 3.55, 4.4, 0.13, 0.2, cyan, true);
  }
  let terminal: ReturnType<typeof display> | undefined;
  if (alcove) {
    box("maintenance alcove back wall", 0, 2.7, 3.6, 9.6, 5.4, 0.3, panel);
    box("maintenance console", 1.18, 0.67, 1.48, 1.88, 1.34, 0.84, panel);
    box("console foot rail", 1.18, 0.42, 1.05, 1.78, 0.075, 0.1, steel);
    terminal = display(1.18, 1.82, 1.48, 1.6, 0.8);
    light("receipt spill", 1.12, 1.8, 0.8, cyan, 0.72, 4);
  }
  if (chase) {
    box("service wall", -1.48, 2.6, 16.85, 5.66, 5.2, 0.28, panel);
    box("alcove jamb", 4.14, 2.6, 16.85, 0.76, 5.2, 0.28, panel);
    box("alcove lintel", 2.55, 4.45, 16.85, 2.42, 1.5, 0.28, panel);
    box("alcove interior", 2.55, 2.6, 19.35, 2.42, 5.2, 0.28, black);
    const marker = display(2.55, 4.25, 16.65, 1.55, 0.71);
    marker("MAINTENANCE", "ALCOVE 04", amber);
  }
  const platformPath = (time: number) => {
    const turn = smooth(3.23, 4.28, time);
    const elapsed = Math.max(0, time - 3.93);
    const travel = 3.65 * (elapsed - 0.21 * (1 - Math.exp(-elapsed / 0.21)));
    return { x: travel * 0.21, z: 1.6 + travel, yaw: -0.32 + turn * 3.68 };
  };
  const turnStart = 2.73;
  const turnEnd = 4.22;
  const chasePath = (time: number) => {
    const corner = smooth(turnStart, turnEnd, time);
    const phase = Math.max(0, Math.min(1, (time - turnStart) / (turnEnd - turnStart)));
    const sideSpeed = 2.55 * 6 * phase * (1 - phase) / (turnEnd - turnStart);
    return { x: 2.55 * corner, z: 0.84 + time * 3.84, yaw: Math.PI + Math.atan2(sideSpeed, 3.84) };
  };
  const thresholdPath = (time: number) => ({
    x: 0, z: 5.45 - 1.35 * smooth(2.73, 5.2, time), yaw: 0,
  });
  const gait = platform
    ? createCinematicGait(rig, platformPath, cinematicFootfalls["transit-platform"], 3.25, 0.135, 0.28)
    : chase
      ? createCinematicGait(rig, chasePath, cinematicFootfalls["rail-pursuit"], -1.15, 0.13, 0.33)
      : threshold
        ? createCinematicGait(rig, thresholdPath, cinematicFootfalls["echo-threshold"], 2.2, 0.22, 0.15)
        : surrender
          ? createCinematicGait(rig, () => ({ x: 0, z: 1.35, yaw: 0 }), [], 0, 0, 0)
          : undefined;
  const rackLights = isolation ? material(rackSignal, true) : undefined;
  const rackGlow = rackLights?.emissiveColor.clone();
  const swingArms = (phase: number, amount: number) => {
    rig.leftArm.rotation.x = -Math.cos(phase) * amount;
    rig.rightArm.rotation.x = Math.cos(phase) * amount;
  };
  return (t: number) => {
    rig.resetIdle();
    rig.root.position.set(0, 0, 1.35);
    rig.root.rotation.set(0, 0, 0);
    if (!alcove && !isolation) rig.animateIdle(t);
    let power = 1;
    if (platform) {
      const { x, z, yaw } = platformPath(t);
      const glance = smooth(1.72, 2.24, t) * (1 - smooth(3.45, 4.06, t));
      const brace = smooth(3.14, 3.65, t) * (1 - smooth(3.85, 4.2, t));
      const run = smooth(3.86, 4.35, t);
      const phase = (t - 4.02) * Math.PI / 0.34;
      rig.root.position.set(x, -brace * 0.19 - run * (0.155 + Math.cos(phase * 2) * 0.03), z);
      rig.root.rotation.set(-run * 0.22, yaw, brace * 0.12);
      if (rig.head) {
        rig.head.rotation.y = -glance * 0.62 + brace * 0.28;
        rig.head.rotation.x += glance * 0.08;
      }
      swingArms(phase, run * 0.64);
      rig.rightArm.rotation.x += brace * 0.55;
      gait?.(t);
      train.position.set(5.65, 1.14, -28 + t * 10.6);
      passingLight?.position.set(4.2, 1.88, train.position.z + 7);
      if (passingLight) passingLight.intensity = 3.4;
      if (t < 2.4) {
        const drift = smooth(0, 2.4, t);
        view(-2.8 + drift * 0.46, 1.38, -6.1, 1.05, 1.44, 1.6, 0.72);
      } else if (t < 4.05) {
        view(-1.06, 2.72, -0.75, 0.34, 2.53, 1.54, 0.57);
      } else {
        view(
          -2.0, 1.63, -2.47,
          0.45 + x * 0.72, 1.58, 2.25 + (z - 1.6) * 0.67,
          0.75,
        );
      }
    } else if (chase) {
      const { x, z, yaw } = chasePath(t);
      const phase = (t - 0.17) * Math.PI / 0.334;
      const turn = smooth(turnStart, turnEnd, t);
      const bank = smooth(2.45, 3.32, t) * (1 - smooth(3.62, 4.33, t));
      rig.root.position.set(x, -0.172 - Math.cos(phase * 2) * 0.047 - bank * 0.043, z);
      rig.root.rotation.set(
        -0.23 + bank * 0.08,
        yaw + Math.sin(phase) * 0.048,
        bank * 0.26 + Math.cos(phase) * 0.044,
      );
      swingArms(phase, 0.64);
      rig.leftArm.rotation.z -= bank * 0.29;
      if (rig.head) {
        const lookBack = smooth(0.71, 1.18, t) * (1 - smooth(1.57, 2.12, t));
        rig.head.rotation.y = -lookBack * 0.98 + bank * 0.19;
        rig.head.rotation.x = 0.15;
      }
      gait?.(t);
      train.position.set(2.98, 6.66, -32 + t * 10);
      passingLight?.position.set(0.92, 4.85, train.position.z + 9);
      if (passingLight) passingLight.intensity = 2.35;
      key.intensity = 1.7;
      key.position.z = z - 2;
      if (t < 1.45) {
        view(-2.04, 0.78, z - 5.4, 0.48, 1.45, z + 0.75, 0.7);
      } else if (t < 2.85) {
        view(
          -3.84, 1.76, z + 1.42,
          rig.root.position.x + 0.44, 1.59, z + 0.52,
          0.84,
        );
      } else {
        view(
          -2.27 + turn * 0.86,
          2.28,
          8.0 + (t - 2.85) * 0.55,
          1.05 + rig.root.position.x * 0.45,
          1.58,
          z + 0.5,
          0.68,
        );
      }
    } else if (alcove) {
      const transfer = smooth(1.0, 2.55, t);
      const slump = smooth(2.28, 2.67, t);
      rig.root.position.set(-2.08, 0.49 - slump * 0.05, 0.4);
      rig.root.rotation.set(1.48 + slump * 0.065, 0.83, 0);
      if (rig.head) rig.head.rotation.z = -slump * 0.24;
      rig.leftArm.rotation.z = -slump * 0.17;
      power = 0.52 * (1 - transfer);
      terminal?.(
        transfer === 1 ? "TRANSFER COMPLETE" : "UPLINK ACTIVE",
        transfer === 1 ? "GATEWAY 01 / RECEIPT" : "SENDING…",
        transfer === 1 ? cyan : amber,
      );
      if (t < 2.8) {
        view(-2.1, 1.89, -4.6, -0.32, 0.8, 0.99, 0.7);
      } else {
        const look = smooth(2.8, 6, t);
        view(1.83 - look * 0.18, 1.99, -1.76, 1.07, 1.62, 1.48, 0.57);
      }
    } else if (gateway) {
      const focus = smooth(0.18, 0.63, t);
      const brace = smooth(0.55, 1.18, t);
      const seal = smooth(0.76, 1.64, t);
      const recoil = smooth(1.5, 1.69, t) * (1 - smooth(1.69, 1.96, t));
      rig.root.position.set(0, 0.13, 2.85);
      rig.root.rotation.y = -brace * 0.17;
      if (rig.head) rig.head.rotation.y = 0.34 * (1 - focus) + brace * 0.17;
      rig.leftArm.rotation.x = -seal * 0.92 + recoil * 0.1;
      rig.leftArm.rotation.z = seal * 0.48 - recoil * 0.08;
      view(2.55 - smooth(0, 4.9, t) * 1.65, 1.52, -6.1, 0, 1.67, 2.02);
    } else if (threshold) {
      const opening = smooth(0.88, 2.55, t);
      doors.forEach((door, index) => {
        door.position.set((index * 2 - 1) * (1.57 + opening * 2.98), 0, 0.25);
      });
      const approach = smooth(2.73, 5.2, t);
      const { z } = thresholdPath(t);
      const walk = smooth(2.68, 3.26, t) * (1 - smooth(4.77, 5.47, t));
      const phase = (t - 3.25) * Math.PI / 0.66;
      rig.root.position.set(0, -walk * (0.049 + Math.cos(2 * phase) * 0.021), z);
      rig.root.rotation.set(-walk * 0.09, walk * Math.sin(phase) * 0.045, walk * Math.cos(phase) * 0.045);
      swingArms(phase, walk * 0.29);
      if (rig.head) rig.head.rotation.x = 0.12 * smooth(5.05, 5.96, t);
      gait?.(t);
      if (t < 5.5) {
        view(
          -0.46, 1.83, -5.36 + approach * 3.05,
          0, 1.58, rig.root.position.z,
          0.66,
        );
      } else {
        view(-1.46, 2.52, 0.2, 0.25, 2.37, rig.root.position.z, 0.58);
      }
      power = 0.22 + smooth(1.95, 2.9, t) * 0.78;
    } else if (surrender) {
      const lowerArms = smooth(0.36, 1.48, t);
      const release = smooth(0.74, 1.9, t);
      const listenBack = smooth(2.35, 3.17, t);
      rig.root.position.y = -release * 0.11 + listenBack * 0.047;
      rig.root.rotation.x = -release * 0.12 + listenBack * 0.06;
      if (rig.head) {
        rig.head.rotation.x = -smooth(1.15, 1.98, t) * 0.31 + listenBack * 0.24;
        rig.head.rotation.y = listenBack * 0.17;
      }
      rig.leftArm.rotation.x = -0.49 * (1 - lowerArms);
      rig.rightArm.rotation.x = -0.65 * (1 - smooth(0.58, 1.68, t));
      rig.leftArm.rotation.z -= 0.26 * (1 - lowerArms);
      rig.rightArm.rotation.z += 0.24 * (1 - lowerArms);
      gait?.(t);
      const listen = smooth(2.2, 4.9, t);
      view(
        -2.72 + listen * 0.46, 2.24, -4.34 + listen * 0.44,
        0.3, 2.19, 1.35,
        0.59,
      );
    } else {
      const shutdown = smooth(3.55, 4.65, t);
      rig.root.position.set(-1.15, 0.43, 0.45);
      rig.root.rotation.set(1.51, 0.83, 0);
      power = 0.36 * (1 - shutdown);
      key.intensity = 3 - shutdown * 2.65;
      fill.intensity = 0.32 - shutdown * 0.24;
      rim.intensity = 2.7 - shutdown * 2.28;
      if (rackLights && rackGlow) {
        const voltage = 1 - smooth(4.27, 4.54, t);
        rackLights.emissiveColor.copyFrom(rackGlow).scaleInPlace(voltage);
      }
      view(2.18 + smooth(0, 6.1, t) * 1.42, 2.33, -3.55, -0.79, 0.64, 1.18, 0.63);
    }
    actorShadow.position.x = rig.root.position.x;
    actorShadow.position.z = rig.root.position.z;
    visor.diffuseColor.copyFrom(visorColor).scaleInPlace(0.25 + power * 0.75);
    visor.emissiveColor.copyFrom(visorColor).scaleInPlace(power * 0.85);
  };
}
