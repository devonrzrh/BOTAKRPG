export interface TurnBlur {
  x: number;
  y: number;
  pixels: number;
}
/** A fixed shutter interval keeps the effect independent of display frame rate. */
export function turnBlur(
  yawDelta: number,
  pitchDelta: number,
  dt: number,
  width: number,
  height: number,
  fov: number,
  enabled: boolean,
): TurnBlur {
  const clear = { x: 0, y: 0, pixels: 0 };
  if (
    !enabled ||
    !Number.isFinite(yawDelta + pitchDelta + dt + width + height + fov) ||
    dt <= 0 ||
    dt > 0.1 ||
    width <= 0 ||
    height <= 0 ||
    fov <= 0
  )
    return clear;
  const horizontalFov = 2 * Math.atan((Math.tan(fov / 2) * width) / height);
  const shutter = 1 / 90;
  let x = ((-yawDelta / dt) * shutter) / horizontalFov,
    y = ((pitchDelta / dt) * shutter) / fov;
  const length = Math.hypot(x * width, y * height);
  // No residual softness, and no long streaks when a frame is delayed.
  if (length < 1.25) return clear;
  const cap = Math.min(40, Math.min(width, height) * 0.065),
    scale = Math.min(1, cap / length);
  x *= scale;
  y *= scale;
  return { x, y, pixels: length * scale };
}
