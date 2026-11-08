import { Color3 } from "@babylonjs/core/Maths/math.color";
import type { Scene } from "@babylonjs/core/scene";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import type { Mesh } from "@babylonjs/core/Meshes/mesh";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { combatCueDuration, type BattleCue } from "../game/combatPresentation";

type EffectRig = {
  root: TransformNode;
  leftArm: TransformNode;
  rightArm: TransformNode;
  materials: StandardMaterial[];
};
type CueState = { cue: BattleCue | null; reducedMotion: boolean };
type Flash = { mesh: Mesh; material: StandardMaterial };

/** Small pooled combat accents animated from the cue stream. */
export function attachBattleEffects(
  scene: Scene,
  rig: EffectRig,
  read: () => CueState,
): () => void {
  const colors = {
    cyan: new Color3(0.12, 0.88, 1),
    blue: new Color3(0.2, 0.45, 1),
    green: new Color3(0.25, 1, 0.45),
    amber: new Color3(1, 0.62, 0.12),
    red: new Color3(1, 0.12, 0.16),
    white: new Color3(0.8, 0.96, 1),
  };
  const makeFlash = (
    name: string,
    color: Color3,
    shape: "sphere" | "ring" | "shield" | "beam",
  ): Flash => {
    const mesh =
      shape === "ring"
        ? MeshBuilder.CreateTorus(
            name,
            { diameter: 0.8, thickness: 0.045, tessellation: 20 },
            scene,
          )
        : shape === "shield"
          ? MeshBuilder.CreateSphere(name, { diameter: 1, segments: 8 }, scene)
          : shape === "beam"
            ? MeshBuilder.CreateBox(
                name,
                { width: 0.06, height: 0.06, depth: 1 },
                scene,
              )
            : MeshBuilder.CreateSphere(
                name,
                { diameter: 0.12, segments: 6 },
                scene,
              );
    const material = new StandardMaterial(`${name} material`, scene);
    material.emissiveColor = color.clone();
    material.diffuseColor = color.scale(0.35);
    material.alpha = 0.9;
    mesh.material = material;
    mesh.isVisible = false;
    return { mesh, material };
  };
  const projectile = makeFlash("battle projectile", colors.white, "sphere");
  const beam = makeFlash("insight beam", colors.cyan, "beam");
  const shield = makeFlash("guard flare", colors.cyan, "shield");
  shield.mesh.scaling.set(1.25, 1.25, 0.15);
  const ring = makeFlash("impact ring", colors.white, "ring");
  ring.mesh.scaling.setAll(1.15);
  ring.mesh.rotation.x = Math.PI / 2;
  const sparks = Array.from({ length: 5 }, (_, i) =>
    makeFlash(`impact spark ${i}`, colors.white, "sphere"),
  );
  const pooled = [projectile, beam, shield, ring, ...sparks];
  const original = {
    rootPosition: rig.root.position.clone(),
    rootRotation: rig.root.rotation.clone(),
    rootScaling: rig.root.scaling.clone(),
    left: rig.leftArm.rotation.clone(),
    right: rig.rightArm.rotation.clone(),
    emissives: rig.materials.map((m) => m.emissiveColor.clone()),
  };
  const startTime = performance.now();
  let activeSequence = -1;
  let started = startTime;
  let activeCue: BattleCue | null = null;
  let reduced = false;
  const hide = () =>
    pooled.forEach(({ mesh }) => {
      mesh.isVisible = false;
    });
  const restore = () => {
    rig.root.position.copyFrom(original.rootPosition);
    rig.root.rotation.copyFrom(original.rootRotation);
    rig.root.scaling.copyFrom(original.rootScaling);
    rig.leftArm.rotation.copyFrom(original.left);
    rig.rightArm.rotation.copyFrom(original.right);
    rig.materials.forEach((m, i) =>
      m.emissiveColor.copyFrom(original.emissives[i]),
    );
  };
  const observer = scene.onBeforeRenderObservable.add(() => {
    const state = read();
    if (
      (state.cue?.sequence ?? -1) !== activeSequence ||
      state.reducedMotion !== reduced
    ) {
      activeSequence = state.cue?.sequence ?? -1;
      activeCue = state.cue;
      reduced = state.reducedMotion;
      started = performance.now();
      hide();
      restore();
      if (activeCue) begin(activeCue);
    }
    if (!activeCue) return;
    const duration = combatCueDuration(reduced);
    const t = Math.min(1, (performance.now() - started) / duration);
    animate(activeCue, t);
    if (t >= 1) hide();
    if (
      t >= 1 &&
      !(
        activeCue.defeated &&
        !reduced &&
        (activeCue.kind === "player" || activeCue.kind === "poison")
      )
    ) {
      activeCue = null;
      hide();
      restore();
    }
  });

  function begin(cue: BattleCue): void {
    if (reduced) return;
    const color =
      cue.special === "limit" ? colors.amber : cue.special === "break" ? colors.red : cue.kind === "poison"
        ? colors.green
        : cue.skill === "insight"
          ? colors.cyan
          : cue.skill === "ward"
            ? colors.blue
            : cue.skill === "trace"
              ? colors.green
              : cue.skill === "weaken"
                ? colors.amber
                : colors.white;
    if (cue.kind === "player" || cue.kind === "poison") {
      projectile.material.emissiveColor.copyFrom(color);
      projectile.mesh.isVisible = true;
      projectile.mesh.position.set(5, 0.8, -3);
      if (cue.skill === "insight") {
        beam.material.emissiveColor.copyFrom(color);
        beam.mesh.isVisible = true;
        beam.mesh.position.set(5, 1.2, 0.2);
      }
    } else if (cue.kind === "enemy" && cue.blocked) {
      shield.mesh.isVisible = true;
      shield.mesh.position.set(5, 1.35, 0.1);
    } else if (cue.kind === "miss") {
      projectile.mesh.isVisible = true;
      projectile.mesh.position.set(5, 0.8, -3);
    }
    if ((cue.kind === "player" || cue.kind === "poison") && cue.amount > 0) {
      ring.material.emissiveColor.copyFrom(color);
      sparks.forEach((s) => s.material.emissiveColor.copyFrom(color));
    }
  }
  function animate(cue: BattleCue, t: number): void {
    const pulse = Math.sin(Math.PI * t);
    if (reduced) {
      if (cue.kind === "miss" || cue.kind === "recover") return;
      rig.materials.forEach((m, i) =>
        m.emissiveColor
          .copyFrom(original.emissives[i])
          .addInPlace(colors.cyan.scale(0.35)),
      );
      return;
    }
    const strike = cue.kind === "player" || cue.kind === "poison";
    if (cue.kind === "enemy") {
      const wind = t < 0.32 ? t / 0.32 : t < 0.55 ? 1 : 1 - (t - 0.55) / 0.45;
      rig.leftArm.rotation.x =
        original.left.x - wind * (cue.heavy ? 1.1 : 0.68);
      rig.root.position.z =
        original.rootPosition.z - wind * (cue.heavy ? 0.48 : 0.25);
      rig.root.rotation.x = original.rootRotation.x + wind * 0.12;
    } else if (strike) {
      const contact = 0.32;
      if (t <= contact) {
        const flight = t / contact;
        projectile.mesh.isVisible = true;
        projectile.mesh.position.set(5, 0.8 + flight * 0.8, -3 + flight * 6.5);
        projectile.mesh.scaling.setAll((0.8 + flight * 0.55) * (cue.special === "limit" ? 2 : 1));
      } else projectile.mesh.isVisible = false;
      if (cue.skill === "insight") {
        beam.mesh.isVisible = t <= contact;
        beam.mesh.position.set(5, 1.2, 0.25);
        beam.mesh.scaling.z = 1 + Math.min(1, t / contact) * 5.5;
        beam.mesh.scaling.x = beam.mesh.scaling.y = cue.special === "limit" ? 3 : 1;
      }
      const impact =
        t >= contact
          ? Math.sin(Math.min(1, (t - contact) / 0.48) * Math.PI)
          : 0;
      if (cue.amount > 0) {
        ring.mesh.isVisible = impact > 0;
        ring.mesh.position.set(5, 1.6, 3.5);
        ring.mesh.scaling.setAll((0.55 + (t - contact) * 2.5) * (cue.special === "limit" ? 1.8 : 1));
        ring.material.alpha = 0.95 * impact;
        sparks.forEach((s, i) => {
          s.mesh.isVisible = t >= contact && t < contact + 0.45;
          s.mesh.position.set(
            5 + Math.cos(i * 1.57) * impact * 0.65,
            1.6 + Math.sin(i * 1.57) * impact * 0.55,
            3.5,
          );
          s.mesh.scaling.setAll(0.4 + impact * 1.05);
        });
      }
      const recoil =
        t > contact ? Math.sin(Math.min(1, (t - contact) / 0.2) * Math.PI) : 0;
      rig.root.rotation.y = original.rootRotation.y + recoil * 0.09;
      rig.root.position.x = original.rootPosition.x + recoil * 0.1;
      if (cue.defeated && t > 0.55) {
        const fall = Math.min(1, (t - 0.55) / 0.45);
        rig.root.rotation.x = original.rootRotation.x + fall * 0.95;
        rig.root.position.y = original.rootPosition.y - fall * 0.55;
      }
    }
    if (cue.kind === "miss") {
      projectile.mesh.position.set(
        5 + Math.sin(t * Math.PI * 2) * 0.8,
        0.8 + t,
        -3 + t * 5.4,
      );
      projectile.mesh.scaling.setAll(0.5);
    }
    if (cue.kind === "enemy" && !cue.blocked && t > 0.62) {
      const hit =
        Math.sin(Math.min(1, (t - 0.62) / 0.18) * Math.PI) *
        (cue.heavy ? 0.34 : 0.2);
      rig.root.position.x = original.rootPosition.x + hit;
    }
    if (cue.kind === "enemy" && cue.blocked)
      shield.mesh.scaling.set(1.1 + pulse * 0.35, 1.1 + pulse * 0.35, 0.12);
    const flash =
      cue.kind === "miss" || cue.kind === "recover" ? 0 : pulse * 0.2;
    rig.materials.forEach((m, i) =>
      m.emissiveColor
        .copyFrom(original.emissives[i])
        .addInPlace(
          (cue.kind === "poison"
            ? colors.green
            : cue.kind === "enemy" && !cue.blocked
              ? colors.red
              : colors.cyan
          ).scale(flash),
        ),
    );
  }

  return () => {
    scene.onBeforeRenderObservable.remove(observer);
    hide();
    restore();
    pooled.forEach(({ mesh, material }) => {
      mesh.dispose();
      material.dispose();
    });
  };
}
