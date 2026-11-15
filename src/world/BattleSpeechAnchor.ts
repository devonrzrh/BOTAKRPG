import { Matrix, Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";

/** Project the posed rig's bounds into normalized canvas coordinates. */
export function createBattleSpeechAnchor(meshes: readonly AbstractMesh[]) {
  const transform = new Matrix();
  const point = new Vector3();
  const anchor = { x: 0, y: 0 };

  return (viewProjection: Matrix) => {
    let right = -Infinity;
    let top = Infinity;
    let bottom = -Infinity;
    for (const mesh of meshes) {
      if (!mesh.isVisible || !mesh.isEnabled()) continue;
      mesh.getWorldMatrix().multiplyToRef(viewProjection, transform);
      for (const corner of mesh.getBoundingInfo().boundingBox.vectors) {
        Vector3.TransformCoordinatesToRef(corner, transform, point);
        right = Math.max(right, point.x);
        top = Math.min(top, -point.y);
        bottom = Math.max(bottom, -point.y);
      }
    }
    if (!Number.isFinite(right) || !Number.isFinite(top) || !Number.isFinite(bottom))
      return null;
    anchor.x = (right + 1) / 2;
    anchor.y = (top + (bottom - top) * 0.3 + 1) / 2;
    return anchor;
  };
}
