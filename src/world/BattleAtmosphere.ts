import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Quaternion } from "@babylonjs/core/Maths/math.vector";
import type { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { EncounterRank } from "../game/enemyIdentity";
import { attachAmbientParticles } from "./AmbientParticles";

const currents = {
  // Color, horizontal travel, vertical travel, fleck width/height, cycles per second.
  "route-warden": ["#ffab61", 0.45, 3.1, 0.35, 1.8, 0.36],
  "archive-keeper": ["#d4b4ff", 0.65, -1.7, 1, 1.35, 0.14],
  "signal-mimic": ["#79ffda", 3.15, 0.18, 2.9, 0.42, 0.32],
  "dispatch-quartermaster": ["#f9cf7a", 1.7, 0.42, 1.8, 0.7, 0.23],
  "simulation-warden": ["#ffc183", 0.18, -3.2, 0.45, 2.7, 0.26],
  "checkpoint-echo": ["#f18f9d", 0.95, 0.62, 1.45, 0.65, 0.16],
  "echo-7": ["#ff7d89", -2.15, 2.05, 0.9, 1.75, 0.24],
} as const;

export function attachBattleAtmosphere(
  root: TransformNode,
  enemyId: string,
  rank: EncounterRank,
  accent: Color3,
  reducedMotion: () => boolean,
) {
  const [color, travelX, travelY, width, height, speed] = currents[
    enemyId as keyof typeof currents
  ] ?? [null, 0.76, 1.8, 1, 1, 0.22];
  const count = { regular: 48, miniboss: 72, boss: 112, final: 156 }[rank];
  return attachAmbientParticles(
    root.getScene(),
    "arena background particles",
    color ? Color3.FromHexString(color).scale(0.76) : accent.scale(0.66),
    count,
    reducedMotion,
    (i, time, position, scale, rotation) => {
      const side = i % 2 === 0 ? -1 : 1;
      const phase = (i * 0.618034 + time * speed * (0.72 + (i % 7) * 0.09)) % 1;
      const x = 2.08 + ((i * 0.17337) % 1) * 2.75;
      const y = 2.75 + (((i * 0.3849) % 1) - 0.5) * 3.5;
      position.set(
        side * (x + (phase - 0.5) * travelX),
        y + (phase - 0.5) * travelY,
        3.45 + (i % 4) * 0.38,
      );
      const size = (0.028 + (i % 9) * 0.006) * Math.sin(phase * Math.PI);
      scale.set(width * size, height * size, size * 0.52);
      Quaternion.FromEulerAnglesToRef(
        0.22,
        i * 1.13,
        side * travelX * 0.22,
        rotation,
      );
    },
    root,
  );
}
