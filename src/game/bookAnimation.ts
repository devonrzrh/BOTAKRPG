/** Fit both covers inside the reading viewport without cropping a page. */
export function bookReadingScale(aspect: number, fov: number, distance = 2.76) {
  const height = 2 * distance * Math.tan(fov / 2);
  return Math.min(height / 3.34, (height * aspect) / 5.96) * 0.99;
}

export function bookPose(progress: number, readingScale = 0.46) {
  const clamp = (n: number) => Math.max(0, Math.min(1, n));
  const smooth = (n: number) => {
    n = clamp(n);
    return n * n * (3 - 2 * n);
  };
  // Pull the closed volume clear of the shelf first. The cover only starts to
  // turn once the book is away from the other spines, then settles open.
  const travel = smooth(progress / 0.55),
    opening = smooth((progress - 0.42) / 0.58);
  return {
    travel,
    opening,
    // A small lift makes the book leave the shelf rather than slide through it.
    lift: Math.sin(travel * Math.PI) * 0.22,
    scale: 0.24 + (readingScale - 0.24) * travel,
    coverYaw: -Math.PI * (1 - opening),
  };
}
