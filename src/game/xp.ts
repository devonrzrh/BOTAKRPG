export function xpProgress(xp: number) {
  const total = Math.max(0, Math.floor(xp));
  const level = Math.min(100, 1 + Math.floor(total / 100));
  return {
    level,
    current: level === 100 ? 100 : total % 100,
    needed: level === 100 ? 0 : 100 - (total % 100),
    maxed: level === 100,
  };
}
