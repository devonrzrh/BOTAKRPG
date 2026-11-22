// Allow a 30 FPS cap and reject isolated stalls with the window median.
const SLOW_FRAME_MS = 35;

export function graphicsCheckResult(windowMedians: readonly number[]) {
  if (windowMedians.length < 3) return undefined;
  return windowMedians.filter((ms) => ms > SLOW_FRAME_MS).length >= 2
    ? "reduced"
    : "kept";
}
