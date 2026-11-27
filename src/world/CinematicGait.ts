import { Matrix, Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { buildEnemyModel } from "./EnemyModel";

type Rig = ReturnType<typeof buildEnemyModel>;
type Path = (time: number) => { x: number; z: number; yaw: number };

export function smooth(start: number, end: number, t: number) {
  const x = Math.max(0, Math.min(1, (t - start) / (end - start)));
  return x * x * (3 - 2 * x);
}

export function createCinematicGait(
  rig: Rig,
  path: Path,
  footfalls: readonly number[],
  start: number,
  lead: number,
  lift: number,
) {
  const scale = rig.root.scaling.y;
  const inverseRoot = Matrix.Identity();
  const bend = new Vector3();
  const target = new Vector3();
  const knee = new Vector3();
  const lower = new Vector3();
  const inverse = new Quaternion();
  const orientation = new Quaternion();
  const bootRotation = new Quaternion();
  const legs = rig.legs!.map(({ thigh, shin, foot }, index) => {
    const upperLength = shin.position.length();
    const lowerLength = foot.position.length();
    const upperRest = shin.position.normalizeToNew();
    const lowerRest = foot.position.normalizeToNew();
    const place = (time: number, ahead: number) => {
      const { x, z, yaw } = path(time + ahead);
      const side = thigh.position.x * scale;
      const depth = (thigh.position.z + shin.position.z + foot.position.z) * scale;
      return {
        x: x + side * Math.cos(yaw) + depth * Math.sin(yaw),
        z: z - side * Math.sin(yaw) + depth * Math.cos(yaw),
        y: foot.position.y * scale + shin.position.y * scale + thigh.position.y * scale,
        yaw,
      };
    };
    const rest = { at: start, ...place(start, 0) };
    const steps = [
      rest,
      ...footfalls.filter((_, step) => step % 2 === index).map((ms) => ({
        at: ms / 1000,
        ...place(ms / 1000, lead),
      })),
    ];
    thigh.rotationQuaternion = Quaternion.Identity();
    shin.rotationQuaternion = Quaternion.Identity();
    foot.rotationQuaternion = Quaternion.Identity();
    return { thigh, shin, foot, upperLength, lowerLength, upperRest, lowerRest, steps };
  });

  return (time: number) => {
    rig.root.computeWorldMatrix(true).invertToRef(inverseRoot);
    const { x, y, z } = rig.root.rotation;
    Quaternion.FromEulerAnglesToRef(x, y, z, orientation);
    for (const { thigh, shin, foot, upperLength, lowerLength, upperRest, lowerRest, steps } of legs) {
      const index = steps.findIndex(({ at }) => at > time);
      const to = steps[index] ?? steps.at(-1)!;
      const from = steps[index - 1] ?? to;
      const airborne = from === to ? 0 : smooth(from.at + (to.at - from.at) * 0.43, to.at, time);
      const clearance = 4 * airborne * (1 - airborne) * lift;
      target.set(
        from.x + (to.x - from.x) * airborne,
        from.y + clearance,
        from.z + (to.z - from.z) * airborne,
      );
      Vector3.TransformCoordinatesToRef(target, inverseRoot, target);
      target.subtractInPlace(thigh.position);

      // Solve the knee in the plane pointing forward from the current hip.
      const distance = Math.min(target.length(), upperLength + lowerLength - 0.001);
      target.normalize();
      const along = (upperLength ** 2 - lowerLength ** 2 + distance ** 2) / (2 * distance);
      const height = Math.sqrt(Math.max(0, upperLength ** 2 - along ** 2));
      bend.set(0, 0, -1).addInPlaceFromFloats(
        target.x * target.z, target.y * target.z, target.z ** 2,
      ).normalize();
      knee.copyFrom(target).scaleInPlace(along).addInPlace(bend.scaleInPlace(height));
      lower.copyFrom(target).scaleInPlace(distance).subtractInPlace(knee).normalize();
      Quaternion.FromUnitVectorsToRef(upperRest, knee.normalize(), thigh.rotationQuaternion!);
      thigh.rotationQuaternion!.conjugateToRef(inverse);
      lower.rotateByQuaternionToRef(inverse, lower);
      Quaternion.FromUnitVectorsToRef(lowerRest, lower, shin.rotationQuaternion!);

      // Match the boot to the ground during support and pitch it through swing.
      Quaternion.FromEulerAnglesToRef(
        clearance * Math.cos(Math.PI * airborne), from.yaw + (to.yaw - from.yaw) * airborne, 0,
        bootRotation,
      );
      orientation.multiplyToRef(thigh.rotationQuaternion!, inverse);
      inverse.multiplyInPlace(shin.rotationQuaternion!).conjugateInPlace()
        .multiplyToRef(bootRotation, foot.rotationQuaternion!);
    }
  };
}
