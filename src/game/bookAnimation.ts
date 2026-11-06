export function bookPose(progress: number) {
  const clamp = (n: number) => Math.max(0, Math.min(1, n));
  const smooth = (n: number) => {
    n = clamp(n);
    return n * n * (3 - 2 * n);
  };
  // Clear the shelf first. Negative rotation swings the front cover toward
  // the reader rather than through the page block behind it.
  const travel = smooth(progress / 0.45),
    opening = smooth((progress - 0.45) / 0.55);
  return {
    travel,
    opening,
    scale: 0.3 + 0.48 * travel,
    coverYaw: -Math.PI * (1 - opening),
  };
}
