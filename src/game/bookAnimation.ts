/** Fit both covers inside the reading viewport without cropping a page. */
export function bookReadingScale(aspect: number, fov: number, distance = 2.76) {
  const height = 2 * distance * Math.tan(fov / 2);
  return Math.min(height / 3.34, (height * aspect) / 5.96) * 0.99;
}

export function bookPose(progress: number, readingScale = 0.78) {
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
    scale: 0.3 + (readingScale - 0.3) * travel,
    coverYaw: -Math.PI * (1 - opening),
  };
}
