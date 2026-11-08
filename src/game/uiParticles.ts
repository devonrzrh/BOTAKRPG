export type UiParticleKind = "success" | "clue" | "levelUp" | "train";

export type UiParticle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: "teal" | "gold";
  bornAt: number;
  lifetime: number;
  square: boolean;
};

export type ParticleOrigin = { x: number; y: number };

const recipes: Record<UiParticleKind, { count: number; lifetime: number }> = {
  success: { count: 12, lifetime: 620 },
  clue: { count: 14, lifetime: 700 },
  levelUp: { count: 20, lifetime: 780 },
  train: { count: 9, lifetime: 560 },
};

export const MAX_UI_PARTICLES = 80;
export const MAX_PARTICLE_LIFETIME = 800;

/** Stable recipe generation keeps the engine deterministic and easy to test. */
export function createBurst(
  kind: UiParticleKind,
  origin: ParticleOrigin,
  now: number,
  seed = 1,
): UiParticle[] {
  const recipe = recipes[kind];
  return Array.from({ length: recipe.count }, (_, index) => {
    const value = Math.sin((seed + index * 17) * 78.233) * 43758.5453;
    const random = value - Math.floor(value);
    const angle = random * Math.PI * 2;
    const speed = 32 + ((index * 13 + seed * 7) % 50);
    return {
      x: origin.x,
      y: origin.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 24,
      size: 2 + ((index + seed) % 3),
      color: (index + seed) % 4 === 0 ? "gold" : "teal",
      bornAt: now,
      lifetime: Math.min(MAX_PARTICLE_LIFETIME, recipe.lifetime),
      square: (index + seed) % 3 === 0,
    };
  });
}

/** Advances particles with a bounded, frame-rate independent drift. */
export function advanceParticles(
  particles: readonly UiParticle[],
  now: number,
  deltaSeconds: number,
): UiParticle[] {
  const dt = Math.max(0, Math.min(deltaSeconds, 0.05));
  return particles
    .filter((particle) => now - particle.bornAt < particle.lifetime)
    .slice(-MAX_UI_PARTICLES)
    .map((particle) => ({
      ...particle,
      x: particle.x + particle.vx * dt,
      y: particle.y + particle.vy * dt,
      vy: particle.vy + 46 * dt,
    }));
}

export function particleOpacity(particle: UiParticle, now: number): number {
  const progress = Math.max(
    0,
    Math.min(1, (now - particle.bornAt) / particle.lifetime),
  );
  return (1 - progress) * Math.min(1, progress * 7 + 0.15);
}
