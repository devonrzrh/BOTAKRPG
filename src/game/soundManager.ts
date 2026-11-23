import uiClick from "../../sounds/sfx/kenney_ui-audio/Audio/click1.ogg?url";
import uiSwitch from "../../sounds/sfx/kenney_ui-audio/Audio/switch1.ogg?url";
import interfaceOpen from "../../sounds/sfx/kenney_interface-sounds/Audio/open_001.ogg?url";
import interfaceClose from "../../sounds/sfx/kenney_interface-sounds/Audio/close_001.ogg?url";
import interfaceConfirm from "../../sounds/sfx/kenney_interface-sounds/Audio/confirmation_001.ogg?url";
import interfaceError from "../../sounds/sfx/kenney_interface-sounds/Audio/error_001.ogg?url";
import rpgBookFlip from "../../sounds/sfx/kenney_rpg-audio/Audio/bookFlip1.ogg?url";
import rpgBookOpen from "../../sounds/sfx/kenney_rpg-audio/Audio/bookOpen.ogg?url";
import rpgBookClose from "../../sounds/sfx/kenney_rpg-audio/Audio/bookClose.ogg?url";
import rpgFootstep from "../../sounds/sfx/kenney_rpg-audio/Audio/footstep01.ogg?url";
import rpgFootstepRun from "../../sounds/sfx/kenney_rpg-audio/Audio/footstep04.ogg?url";
import rpgMetalClick from "../../sounds/sfx/kenney_rpg-audio/Audio/metalClick.ogg?url";
import digitalLowDown from "../../sounds/sfx/kenney_digital-audio_2/Audio/lowDown.ogg?url";
import digitalHighDown from "../../sounds/sfx/kenney_digital-audio_2/Audio/highDown.ogg?url";
import digitalTone from "../../sounds/sfx/kenney_digital-audio_2/Audio/tone1.ogg?url";
import digitalTwoTone from "../../sounds/sfx/kenney_digital-audio_2/Audio/twoTone1.ogg?url";
import digitalPhaseJump from "../../sounds/sfx/kenney_digital-audio_2/Audio/phaseJump1.ogg?url";
import digitalZap from "../../sounds/sfx/kenney_digital-audio_2/Audio/zapThreeToneUp.ogg?url";
import digitalPhaser from "../../sounds/sfx/kenney_digital-audio_2/Audio/phaserUp1.ogg?url";
import digitalPhaserDown from "../../sounds/sfx/kenney_digital-audio_2/Audio/phaserDown1.ogg?url";
import impactGlass from "../../sounds/sfx/kenney_impact-sounds/Audio/impactGlass_medium_000.ogg?url";
import impactGlassHeavy from "../../sounds/sfx/kenney_impact-sounds/Audio/impactGlass_heavy_000.ogg?url";
import impactMetal from "../../sounds/sfx/kenney_impact-sounds/Audio/impactMetal_medium_000.ogg?url";
import impactPunch from "../../sounds/sfx/kenney_impact-sounds/Audio/impactPunch_medium_001.ogg?url";
import impactPunchHeavy from "../../sounds/sfx/kenney_impact-sounds/Audio/impactPunch_heavy_000.ogg?url";
import explosion from "../../sounds/sfx/kenney_sci-fi-sounds/Audio/explosionCrunch_000.ogg?url";
import forceField from "../../sounds/sfx/kenney_sci-fi-sounds/Audio/forceField_000.ogg?url";
import laserRetro from "../../sounds/sfx/kenney_sci-fi-sounds/Audio/laserRetro_000.ogg?url";
import laserSmall from "../../sounds/sfx/kenney_sci-fi-sounds/Audio/laserSmall_000.ogg?url";
import cameraSwoosh from "../../sounds/sfx/swoosh.mp3?url";
import cinematicTrain from "../../sounds/sfx/cinematic-train-pass.ogg?url";

export const SFX_CUES = {
  click: { label: "Menu click", source: uiClick, cooldown: 90 },
  hover: { label: "Button hover", source: uiSwitch, cooldown: 70 },
  open: { label: "Open", source: interfaceOpen, cooldown: 110 },
  close: { label: "Close", source: interfaceClose, cooldown: 110 },
  page: { label: "Page turn", source: rpgBookFlip, cooldown: 120 },
  bookOpen: { label: "Book open", source: rpgBookOpen, cooldown: 180 },
  bookClose: { label: "Book close", source: rpgBookClose, cooldown: 180 },
  move: { label: "Movement", source: rpgFootstep, cooldown: 100 },
  blocked: { label: "Blocked movement", source: rpgMetalClick, cooldown: 120 },
  puzzleAction: { label: "Puzzle action", source: uiSwitch, cooldown: 80 },
  success: { label: "Success", source: interfaceConfirm, cooldown: 180 },
  error: { label: "Error", source: interfaceError, cooldown: 130 },
  clue: { label: "Clue", source: digitalTwoTone, cooldown: 260 },
  levelUp: { label: "Level up", source: digitalPhaseJump, cooldown: 320 },
  dialogue: { label: "Dialogue", source: digitalTone, cooldown: 240 },
  speechHuman: { label: "Human speech", source: digitalTwoTone, cooldown: 120 },
  speechRobot: { label: "Robot speech", source: digitalTone, cooldown: 120 },
  speechEcho: { label: "ECHO speech", source: digitalLowDown, cooldown: 120 },
  speechSoft: { label: "Soft speech", source: digitalHighDown, cooldown: 120 },
  connect: { label: "Connect", source: digitalZap, cooldown: 250 },
  pursuit: { label: "Pursuit", source: rpgFootstepRun, cooldown: 120 },
  train: { label: "Train", source: digitalPhaseJump, cooldown: 180 },
  cinematicTrain: {
    label: "Passing railcar",
    source: cinematicTrain,
    cooldown: 180,
  },
  scan: { label: "Scan", source: digitalPhaser, cooldown: 180 },
  hazard: { label: "Hazard warning", source: digitalHighDown, cooldown: 180 },
  dodge: { label: "Dodge", source: digitalPhaseJump, cooldown: 180 },
  hit: { label: "Impact", source: impactPunch, cooldown: 180 },
  battleStrike: { label: "Strike", source: impactMetal, cooldown: 0 },
  battleInsight: { label: "Insight", source: laserSmall, cooldown: 0 },
  battleWard: { label: "Ward", source: forceField, cooldown: 0 },
  battleTrace: { label: "Trace", source: laserRetro, cooldown: 0 },
  battlePoison: { label: "Poison", source: digitalLowDown, cooldown: 0 },
  battleEnemy: { label: "Enemy hit", source: impactPunch, cooldown: 0 },
  battleHeavy: { label: "Heavy enemy hit", source: impactPunchHeavy, cooldown: 0 },
  battleBlock: { label: "Blocked hit", source: rpgMetalClick, cooldown: 0 },
  battleMiss: { label: "Miss", source: digitalPhaserDown, cooldown: 0 },
  battleWeakness: { label: "Weakness hit", source: impactGlass, cooldown: 0 },
  battleBreak: { label: "Stance break", source: impactGlassHeavy, cooldown: 0 },
  battleFinisher: { label: "Finisher", source: explosion, cooldown: 0 },
  cameraMove: {
    label: "Camera turn swoosh",
    source: cameraSwoosh,
    cooldown: 420,
  },
} as const;
export type SfxName = keyof typeof SFX_CUES;
export const SFX_GAINS: Partial<Record<SfxName, number>> = {
  click: 0.55,
  hover: 0.12,
  page: 0.5,
  clue: 0.7,
  levelUp: 0.7,
  dialogue: 0.22,
  speechHuman: 0.12,
  speechRobot: 0.12,
  speechEcho: 0.12,
  speechSoft: 0.12,
  cinematicTrain: 0.72,
  pursuit: 0.48,
  battleStrike: 0.65,
  battleInsight: 0.55,
  battleWard: 0.55,
  battleTrace: 0.55,
  battlePoison: 0.45,
  battleEnemy: 0.75,
  battleHeavy: 0.95,
  battleBlock: 0.6,
  battleMiss: 0.4,
  battleWeakness: 0.7,
  battleBreak: 0.75,
  battleFinisher: 0.85,
  cameraMove: 0.2,
};

type Voice = { audio: HTMLAudioElement; gain: number };
const MAX_VOICES = 12;

/** Bundled clips unlock on a user gesture and share one effects volume. */
export function createSoundManager() {
  let volume = 0.65;
  let unlocked = false;
  let disposed = false;
  const voices = new Set<Voice>();
  const lastPlayed = new Map<SfxName, number>();

  const stop = (voice: Voice) => {
    if (!voices.delete(voice)) return;
    voice.audio.pause();
    voice.audio.removeAttribute("src");
    voice.audio.load();
  };
  const cancelAll = () => {
    for (const voice of [...voices]) stop(voice);
  };

  const unlock = () => {
    if (!disposed) unlocked = true;
  };
  const play = (name: SfxName) => {
    if (disposed || !unlocked || volume === 0 || typeof Audio === "undefined")
      return;
    const now =
      typeof performance !== "undefined" ? performance.now() : Date.now();
    if (now - (lastPlayed.get(name) ?? -Infinity) < SFX_CUES[name].cooldown)
      return;
    lastPlayed.set(name, now);
    if (voices.size >= MAX_VOICES) stop(voices.values().next().value!);

    try {
      const voice = {
        audio: new Audio(SFX_CUES[name].source),
        gain: (SFX_GAINS[name] ?? 1) * (0.97 + Math.random() * 0.06),
      };
      voice.audio.preload = "auto";
      voice.audio.playbackRate = 0.98 + Math.random() * 0.04;
      voice.audio.volume = Math.min(1, volume * voice.gain);
      voices.add(voice);
      const release = () => stop(voice);
      voice.audio.addEventListener("ended", release, { once: true });
      voice.audio.addEventListener("error", release, { once: true });
      try {
        void voice.audio.play().catch(release);
      } catch {
        release();
      }
      return release;
    } catch {
      /* Audio may be unavailable or blocked. */
    }
  };
  const setVolume = (next: number) => {
    volume = Number.isFinite(next) ? Math.max(0, Math.min(1, next)) : 0;
    voices.forEach((voice) => {
      voice.audio.volume = Math.min(1, volume * voice.gain);
    });
    if (volume === 0) cancelAll();
  };
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    cancelAll();
  };
  return { unlock, play, setVolume, dispose };
}
