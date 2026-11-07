export const EVADE_DURATION = 2.8;
export const EVADE_STEP = 1 / 120;
export const EVADE_PLAYER_Y = 160;
export const EVADE_MIN_X = 24;
export const EVADE_MAX_X = 456;
export const EVADE_SPEED = 220;

export interface EvadeHazard {
  lane: number;
  at: number;
  resolved: boolean;
  hit: boolean;
}

export interface EvadeState {
  seed: number;
  elapsed: number;
  playerX: number;
  collisions: number;
  hazards: EvadeHazard[];
  accumulator: number;
}

export function createEvade(seed: number): EvadeState {
  // Seed shifts the three lanes while retaining readable, deterministic timings.
  let value = seed >>> 0;
  const random = () => {
    value = (value + 0x6d2b79f5) >>> 0;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const lanes = [105, 240, 375];
  return {
    seed,
    elapsed: 0,
    playerX: 240,
    collisions: 0,
    accumulator: 0,
    hazards: [0.62, 1.42, 2.18].map((at) => ({
      lane: lanes[Math.floor(random() * lanes.length)],
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
    const hit = Math.abs(xAtCrossing - hazard.lane) <= 34;
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
