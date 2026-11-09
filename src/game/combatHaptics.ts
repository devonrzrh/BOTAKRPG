import type { BattleCue } from "./combatPresentation";

/** Brief contact feedback. Unsupported or denied hardware stays silent. */
export function createCombatHaptics() {
  let lastSequence = -1;
  let vibrating = false;
  const cancel = () => {
    if (!vibrating) return;
    vibrating = false;
    try {
      navigator.vibrate(0);
    } catch {
      // Hardware access can be revoked while a pulse is playing.
    }
  };
  return {
    cancel,
    impact(cue: BattleCue, reducedMotion: boolean) {
      if (cue.sequence <= lastSequence) return;
      lastSequence = cue.sequence;
      cancel();
      if (
        reducedMotion ||
        typeof navigator === "undefined" ||
        typeof navigator.vibrate !== "function" ||
        (typeof document !== "undefined" && document.hidden) ||
        navigator.userActivation?.hasBeenActive === false
      )
        return;
      const strike = cue.kind === "player" || cue.kind === "poison";
      if (cue.kind !== "enemy" && !strike) return;
      if (cue.amount <= 0 && !(cue.kind === "enemy" && cue.blocked)) return;
      const pattern =
        cue.kind === "enemy" && cue.blocked
          ? 12
          : cue.defeated
            ? [45, 40, 65]
            : cue.special === "limit" || cue.heavy
              ? 80
              : cue.kind === "enemy"
                ? 45
                : 20;
      try {
        vibrating = navigator.vibrate(pattern);
      } catch {
        // Vibration is optional; never interrupt a turn when a browser rejects it.
      }
    },
  };
}
