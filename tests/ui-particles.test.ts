import { describe, expect, it } from "vitest";
import {
  advanceParticles,
  createBurst,
  MAX_PARTICLE_LIFETIME,
  MAX_UI_PARTICLES,
  particleOpacity,
  type UiParticle,
  type UiParticleKind,
} from "../src/game/uiParticles";

describe("UI particle recipes", () => {
  it("creates repeatable, restrained bursts for each semantic event", () => {
    const kinds: UiParticleKind[] = ["success", "clue", "levelUp", "train"];
    for (const kind of kinds) {
      const burst = createBurst(kind, { x: 30, y: 40 }, 100, 4);
      expect(burst).toEqual(createBurst(kind, { x: 30, y: 40 }, 100, 4));
      expect(burst.length).toBeGreaterThan(0);
      expect(burst.length).toBeLessThanOrEqual(20);
      expect(
        burst.every((particle) => particle.x === 30 && particle.y === 40),
      ).toBe(true);
      expect(
        burst.every((particle) => particle.lifetime <= MAX_PARTICLE_LIFETIME),
      ).toBe(true);
      expect(
        burst.every((particle) => ["teal", "gold"].includes(particle.color)),
      ).toBe(true);
    }
  });

  it("advances with bounded drift, expires old particles, and caps the live pool", () => {
    const burst = createBurst("success", { x: 0, y: 0 }, 0, 2);
    const moved = advanceParticles(burst, 100, 0.1);
    expect(moved[0]!.x).not.toBe(0);
    expect(moved[0]!.y).not.toBe(0);
    expect(advanceParticles(burst, 800, 0.016)).toHaveLength(0);

    const crowded = Array.from({ length: MAX_UI_PARTICLES + 17 }, (_, i) => ({
      ...burst[i % burst.length]!,
      bornAt: i,
    })) as UiParticle[];
    expect(advanceParticles(crowded, 20, 0)).toHaveLength(MAX_UI_PARTICLES);
  });

  it("fades particles to zero by their expiry", () => {
    const particle = createBurst("clue", { x: 0, y: 0 }, 100, 1)[0]!;
    expect(particleOpacity(particle, 100)).toBeGreaterThan(0);
    expect(particleOpacity(particle, 100 + particle.lifetime)).toBe(0);
  });
});
