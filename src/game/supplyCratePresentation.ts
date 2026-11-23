export const crateOpeningMs = 820;

export function crateLidAngle(progress: number, reseal: boolean) {
  const ease = (t: number) => t * t * (3 - 2 * t);
  const opening = Math.min(1, Math.max(0, (progress - 0.24) / 0.76));
  const travel =
    reseal && progress < 0.24
      ? 1 - ease(Math.max(0, progress) / 0.24)
      : ease(opening);
  return travel * 1.7;
}
