/** Fit both covers inside the reading viewport without cropping a page. */
export function bookReadingScale(aspect: number, fov: number, distance = 2.76) {
  const height = 2 * distance * Math.tan(fov / 2);
  return Math.min(height / 3.34, (height * aspect) / 5.96) * 0.99;
}

export function bookPose(progress: number, readingScale = 0.46) {
  const clamp = (n: number) => Math.max(0, Math.min(1, n));
  const smooth = (n: number) => {
    n = clamp(n);
    return n * n * n * (n * (n * 6 - 15) + 10);
  };
  // Pull the closed volume clear of the shelf first. The cover only starts to
  // turn once the book is away from the other spines, then settles open.
  const travel = smooth(progress / 0.48),
    opening = smooth((progress - 0.5) / 0.5);
  return {
    travel,
    opening,
    // A small lift makes the book leave the shelf rather than slide through it.
    lift: Math.sin(travel * Math.PI) * 0.14,
    scale: BOOK_SHELF_SCALE + (readingScale - BOOK_SHELF_SCALE) * travel,
    coverYaw: -Math.PI * (1 - opening),
  };
}
export const BOOK_OPEN_MS = 900;
export const BOOK_CLOSE_MS = 780;
export const BOOK_READER_FADE_MS = 180;
export const BOOK_SHELF_SCALE = 1.1 / 3.34;
