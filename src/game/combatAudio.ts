import { combatContactMs, type BattleCue } from "./combatPresentation";
import { createSoundManager, type SfxName } from "./soundManager";

const previewCueBase = {
  skill: null,
  amount: 1,
  heavy: false,
  blocked: false,
  defeated: false,
} as const;
export const BATTLE_CUE_PREVIEWS: {
  label: string;
  cue: Omit<BattleCue, "sequence">;
}[] = [
  {
    label: "Player hit",
    cue: { ...previewCueBase, kind: "player", skill: "strike" },
  },
  {
    label: "Insight hit",
    cue: { ...previewCueBase, kind: "player", skill: "insight" },
  },
  {
    label: "Ward hit",
    cue: { ...previewCueBase, kind: "player", skill: "ward" },
  },
  {
    label: "Trace hit",
    cue: { ...previewCueBase, kind: "player", skill: "trace" },
  },
  { label: "Poison hit", cue: { ...previewCueBase, kind: "poison" } },
  { label: "Enemy hit", cue: { ...previewCueBase, kind: "enemy" } },
  {
    label: "Heavy enemy hit",
    cue: { ...previewCueBase, kind: "enemy", heavy: true },
  },
  {
    label: "Blocked hit",
    cue: { ...previewCueBase, kind: "enemy", blocked: true },
  },
  { label: "Miss", cue: { ...previewCueBase, kind: "miss" } },
  {
    label: "Weakness hit",
    cue: { ...previewCueBase, kind: "player", special: "weakness" },
  },
  {
    label: "Stance break",
    cue: { ...previewCueBase, kind: "player", special: "break" },
  },
  {
    label: "Finisher",
    cue: { ...previewCueBase, kind: "player", special: "finisher" },
  },
];

function battleSound(cue: BattleCue): SfxName | null {
  if (cue.kind === "recover" && cue.special === "pacify") return null;
  if (cue.kind === "miss") return "battleMiss";
  if (cue.kind === "enemy")
    return cue.blocked
      ? "battleBlock"
      : cue.heavy ? "battleHeavy" : "battleEnemy";
  if (cue.special === "break") return "battleBreak";
  if (cue.special === "weakness") return "battleWeakness";
  if (cue.kind === "poison") return "battlePoison";
  if (cue.kind !== "player") return "battleMiss";
  if (cue.special === "finisher") return "battleFinisher";
  switch (cue.skill) {
    case "insight":
      return "battleInsight";
    case "ward":
      return "battleWard";
    case "trace":
      return "battleTrace";
    default:
      return "battleStrike";
  }
}

/** Play bundled effects at the combat animation's contact point. */
export function createCombatAudio() {
  const sounds = createSoundManager();
  const timers = new Set<ReturnType<typeof setTimeout>>();
  let lastSequence = -1;
  let volume = 1;
  let muted = false;
  let unlocked = false;
  let disposed = false;
  sounds.setVolume(volume);

  const cancelPending = () => {
    timers.forEach(clearTimeout);
    timers.clear();
  };

  const updateVolume = () => {
    const level = muted ? 0 : volume;
    if (level === 0) cancelPending();
    sounds.setVolume(level);
  };

  return {
    unlock() {
      unlocked = true;
      sounds.unlock();
    },
    play(cue: BattleCue, reducedMotion = false) {
      if (
        disposed || !unlocked || muted || volume === 0 || cue.sequence <= lastSequence
      )
        return;
      lastSequence = cue.sequence;
      const sound = battleSound(cue);
      if (!sound) return;
      const delay = combatContactMs(cue, reducedMotion);
      const timer = setTimeout(() => {
        timers.delete(timer);
        sounds.play(sound);
      }, delay);
      timers.add(timer);
    },
    setMuted(value: boolean) {
      muted = value;
      updateVolume();
    },
    setVolume(value: number) {
      volume = Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
      updateVolume();
    },
    dispose() {
      disposed = true;
      cancelPending();
      sounds.dispose();
    },
  };
}
