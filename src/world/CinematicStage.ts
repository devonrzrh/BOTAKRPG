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
import { buildEnemyModel } from "./EnemyModel";

const cityShots = ["transit-platform", "rail-pursuit", "abandoned-chassis"];
const networkShots = ["gateway-sentry", "echo-surrender", "echo-isolation"];
const deskShots = ["office-terminal", "ledger-open", "ledger-closed"];
export const cinematicShots = [...cityShots, ...networkShots, ...deskShots];

const cyan = "#77e9ef";
const amber = "#ffbe70";
const steel = "#364a57";
const panel = "#19252f";
const black = "#101820";
const smooth = (start: number, end: number, t: number) => {
  const x = Math.max(0, Math.min(1, (t - start) / (end - start)));
  return x * x * (3 - 2 * x);
};

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
    const glass = CreatePlane(
      "terminal glass",
      { width, height },
      scene,
    );
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
      const resolved = t >= 2.5;
      const closed = shot === "ledger-closed" ? smooth(3.4, 5.2, t) : 0;
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
        view(2.3 - smooth(0, 6, t) * 0.7, 3.02, -3.32, 0.62, 1.27, 0.28);
      }
    };
  }

  const city = cityShots.includes(shot);
  const alcove = shot === "abandoned-chassis";
  const chase = shot === "rail-pursuit";
  const platform = shot === "transit-platform";
  const gateway = shot === "gateway-sentry";
  const surrender = shot === "echo-surrender";
  const signal = gateway || city ? amber : cyan;
  light("cold backlight", 0, 5, 6, "#5acde8", 2.7, 13);
  const key = light(
    "side key",
    -3,
    3.6,
    -4,
    city ? "#ffc286" : "#95d6ff",
    3.0,
    13,
  );
  if (city) scene.fogDensity = 0.052;
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
            signal,
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
    if (chase) setBox("rail deck", -0.4, 5.53, z, 6, 0.35, 2.99, black);
    if (platform) setBox("track ties", 5.65, -0.12, z, 2.9, 0.2, 0.3, steel);
  }
  if (platform)
    for (const x of [4.65, 6.65])
      setBox("platform track", x, 0.01, 8, 0.1, 0.16, 65, steel);
  for (const cohort of scenery.values()) Mesh.MergeMeshes(cohort);

  const train = new TransformNode("passing train", scene);
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
  const runPose = (t: number, weight: number) => {
    const angle = t * 9.4;
    const swing = Math.sin(angle);
    rig.leftArm.rotation.x = -swing * 0.7 * weight;
    rig.rightArm.rotation.x = swing * 0.7 * weight;
    rig.legs?.forEach(({ thigh, shin }, index) => {
      const stride = Math.sin(angle + index * Math.PI);
      thigh.rotation.x = stride * 0.58 * weight;
      shin.rotation.x =
        -Math.pow(Math.max(0, Math.cos(angle + index * Math.PI)), 2) *
        0.9 *
        weight;
    });
  };
  return (t: number) => {
    rig.resetIdle();
    rig.root.position.set(0, 0, 1.35);
    rig.root.rotation.set(0, 0, 0);
    rig.animateIdle(t);
    let power = 1;
    if (platform) {
      const escape = smooth(7.05, 8.8, t);
      rig.root.position.set(
        escape * 2,
        0.07 * Math.sin(t * 2),
        1.6 + escape * 10,
      );
      rig.root.rotation.y = -0.48 + escape * 3.62;
      runPose(t, smooth(7.2, 7.7, t));
      train.position.set(5.65, 1.14, -24 + smooth(3.8, 8.6, t) * 60);
      view(
        -2.7 + smooth(0, 7.1, t) * 1.1,
        2.11,
        -7.2 + smooth(0, 7.1, t) * 1.15,
        0.05,
        1.26,
        1.7,
      );
    } else if (chase) {
      const run = smooth(0, 6.4, t);
      const stride = Math.sin(t * 9);
      const turn = smooth(4.1, 6.1, t);
      const z = -0.6 + t * 2.55;
      rig.root.position.set(
        Math.sin(t * 1.4) * 0.33 + turn * 3.3,
        0.15 + Math.abs(stride) * 0.12,
        z,
      );
      rig.root.rotation.set(
        0.24,
        Math.PI - turn * 1.25,
        Math.sin(t * 9) * 0.12,
      );
      runPose(t, 1);
      if (rig.head)
        rig.head.rotation.y =
          -smooth(1, 1.6, t) * (1 - smooth(2, 2.7, t)) * 0.85;
      train.position.set(3.6, 6.42, z - 16 + run * 54);
      key.position.z = z - 2;
      view(
        -2.1 + turn,
        2.22 + stride * 0.03,
        z - 6.85 - turn * 0.75,
        rig.root.position.x * 0.9,
        1.7,
        z + 0.6,
        0.72,
      );
    } else if (alcove) {
      rig.root.position.set(-2.08, 0.44, 0.4);
      rig.root.rotation.set(1.48, 0.83, 0);
      power = 0.09;
      terminal?.("TRANSFER COMPLETE", "GATEWAY 01 / RECEIPT");
      const look = smooth(1.65, 6.2, t);
      view(
        -2.55 + look * 1.86,
        2.44 - look * 0.54,
        -4.85 + look * 1.1,
        -0.65 + look * 1.85,
        0.94 + look * 0.63,
        1.53,
      );
    } else if (gateway) {
      const seal = smooth(0.42, 1.7, t);
      rig.root.position.set(0, 0.13, 2.85 - seal * 0.88);
      rig.leftArm.rotation.x = -seal * 0.85;
      rig.leftArm.rotation.z = seal * 0.48;
      view(2.55 - smooth(0, 6.8, t) * 1.65, 1.52, -6.1, 0, 1.67, 2.02);
    } else if (surrender) {
      const standDown = smooth(0.45, 4.5, t);
      rig.root.position.y = -standDown * 0.22;
      rig.root.rotation.x = standDown * 0.12;
      if (rig.head) rig.head.rotation.x = standDown * 0.4;
      rig.leftArm.rotation.x = -0.25 * (1 - standDown);
      rig.rightArm.rotation.x = -0.25 * (1 - standDown);
      view(
        -2.25 + smooth(0, 9.3, t) * 1.52,
        2.35,
        -6.4 + smooth(0, 9.3, t) * 1.8,
        0,
        1.84,
        1.35,
      );
    } else {
      const shutdown = smooth(8.15, 9.5, t);
      rig.root.position.set(-1.15, 0.43, 0.45);
      rig.root.rotation.set(1.51, 0.83, 0);
      power = 0.36 * (1 - shutdown);
      key.intensity = 3 - shutdown * 2.65;
      fill.intensity = 0.32 - shutdown * 0.24;
      view(
        2.45 + smooth(0, 10.5, t),
        2.24,
        -4.62 - smooth(0, 10.5, t) * 1.35,
        0.11,
        0.81,
        1.65,
      );
    }
    actorShadow.position.x = rig.root.position.x;
    actorShadow.position.z = rig.root.position.z;
    visor.diffuseColor.copyFrom(visorColor).scaleInPlace(0.25 + power * 0.75);
    visor.emissiveColor.copyFrom(visorColor).scaleInPlace(power * 0.85);
  };
}
