export const EVADE_DURATION = 2.8;
export const EVADE_STEP = 1 / 120;
export const EVADE_PLAYER_Y = 160;
export const EVADE_MIN_X = 24;
export const EVADE_MAX_X = 456;
export const EVADE_SPEED = 220;

export interface EvadeHazard {
  kind: "lane" | "gap";
  lane: number;
  startLane: number;
  width: number;
  at: number;
  resolved: boolean;
  hit: boolean;
}

export interface EvadeState {
  seed: number;
  pattern: string;
  elapsed: number;
  playerX: number;
  collisions: number;
  hazards: EvadeHazard[];
  accumulator: number;
}

export function evadeSeed(
  enemyId: string,
  turn: number,
  attempt: number,
): number {
  let hash = (attempt ^ Math.imul(turn + 1, 0x9e3779b1)) >>> 0;
  for (const char of enemyId)
    hash = Math.imul(hash ^ char.charCodeAt(0), 16777619) >>> 0;
  return hash;
}

/** Moving projectiles keep their eventual crossing clearly marked by the guide. */
export function hazardLane(hazard: EvadeHazard, elapsed: number): number {
  const progress = Math.max(
    0,
    Math.min(1, (elapsed - (hazard.at - 0.55)) / 0.55),
  );
  return hazard.startLane + (hazard.lane - hazard.startLane) * progress;
}

export function createEvade(seed: number): EvadeState {
  // Three damage waves keep combat's 0..3 hit result stable. Families change
  // geometry as well as lanes; every wave has at least 550 ms of telegraph.
  let value = seed >>> 0;
  const random = () => {
    value = (value + 0x6d2b79f5) >>> 0;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const family = (seed >>> 0) % 5;
  const mirror = random() > 0.5;
  const flip = (x: number) => (mirror ? 480 - x : x);
  const patterns = [
    "Crossfire",
    "Diagonal sweep",
    "Pincer gates",
    "Heavy pulses",
    "Broken rhythm",
  ];
  const times = family === 4 ? [0.78, 1.38, 2.35] : [0.72, 1.46, 2.2];
  const lanes =
    family === 0
      ? [135, 345, 135]
      : family === 1
        ? [135, 240, 345]
        : family === 2
          ? [135, 345, 240]
          : family === 3
            ? [240, 135, 345]
            : [345, 135, 240];
  const offset = Math.round(random() * 34) - 17;
  return {
    seed,
    pattern: patterns[family],
    elapsed: 0,
    playerX: 240,
    collisions: 0,
    accumulator: 0,
    hazards: times.map((at, i) => ({
      kind: family === 2 ? "gap" : "lane",
      lane: flip(lanes[i] + offset),
      startLane:
        family === 1 ? flip(lanes[i] + offset - 95) : flip(lanes[i] + offset),
      width: family === 2 ? 65 : family === 3 ? 54 : 34,
      at,
      resolved: false,
      hit: false,
    })),
  };
}

function advance(
  state: EvadeState,
  dt: number,
  direction: -1 | 0 | 1,
): EvadeState {
  const start = state.elapsed;
  const end =
    start + dt >= EVADE_DURATION - 1e-9
      ? EVADE_DURATION
      : Math.min(EVADE_DURATION, start + dt);
  const nextX = Math.max(
    EVADE_MIN_X,
    Math.min(
      EVADE_MAX_X,
      state.playerX + direction * EVADE_SPEED * (end - start),
    ),
  );
  let collisions = state.collisions;
  const hazards = state.hazards.map((hazard) => {
    if (hazard.resolved || hazard.at < start - 1e-9 || hazard.at > end + 1e-9)
      return hazard;
    const ratio =
      end === start
        ? 0
        : Math.max(0, Math.min(1, (hazard.at - start) / (end - start)));
    const xAtCrossing = state.playerX + (nextX - state.playerX) * ratio;
    const distance = Math.abs(xAtCrossing - hazard.lane);
    const hit =
      hazard.kind === "gap"
        ? distance > hazard.width
        : distance <= hazard.width;
    if (hit) collisions++;
    return { ...hazard, resolved: true, hit };
  });
  return { ...state, elapsed: end, playerX: nextX, collisions, hazards };
}

export function stepEvade(
  state: EvadeState,
  dt: number,
  direction: -1 | 0 | 1,
): EvadeState {
  if (!Number.isFinite(dt) || dt <= 0 || state.elapsed >= EVADE_DURATION)
    return state;
  let remaining = Math.min(dt, EVADE_DURATION - state.elapsed);
  let next = state;
  // Fixed quanta make movement and swept hazard checks independent of render cadence.
  while (remaining > 1e-9) {
    const quantum = Math.min(EVADE_STEP, remaining);
    next = advance(next, quantum, direction);
    remaining -= quantum;
  }
  return next;
}

export function evadeComplete(state: EvadeState): boolean {
  return state.elapsed >= EVADE_DURATION;
}
