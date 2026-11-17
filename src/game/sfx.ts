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
import digitalPowerUp from "../../sounds/sfx/kenney_digital-audio_2/Audio/powerUp1.ogg?url";
import digitalPhaseJump from "../../sounds/sfx/kenney_digital-audio_2/Audio/phaseJump1.ogg?url";
import digitalZap from "../../sounds/sfx/kenney_digital-audio_2/Audio/zapThreeToneUp.ogg?url";
import digitalPhaser from "../../sounds/sfx/kenney_digital-audio_2/Audio/phaserUp1.ogg?url";
import impactPunch from "../../sounds/sfx/kenney_impact-sounds/Audio/impactPunch_medium_001.ogg?url";
import type { EvadeState } from "./evade";

export type SfxName =
  | "click"
  | "open"
  | "close"
  | "page"
  | "bookOpen"
  | "bookClose"
  | "move"
  | "blocked"
  | "puzzleAction"
  | "success"
  | "error"
  | "clue"
  | "levelUp"
  | "dialogue"
  | "speechHuman"
  | "speechRobot"
  | "speechEcho"
  | "speechSoft"
  | "connect"
  | "pursuit"
  | "train"
  | "scan"
  | "hazard"
  | "dodge"
  | "hit";

type Voice = HTMLAudioElement;

/** Use crossings rather than elapsed-time windows so each lane sounds once. */
export function evadeSoundCues(
  before: EvadeState,
  after: EvadeState,
): SfxName[] {
  return after.hazards.flatMap((hazard, index): SfxName[] => {
    const previous = before.hazards[index];
    if (hazard.resolved && !previous.resolved)
      return [hazard.hit ? "hit" : "dodge"];
    if (
      !hazard.resolved &&
      before.elapsed < hazard.at - 0.3 &&
      after.elapsed >= hazard.at - 0.3
    )
      return ["hazard"];
    return [];
  });
}

const MAX_VOICES = 12;
const COOLDOWNS: Record<SfxName, number> = {
  click: 45,
  open: 110,
  close: 110,
  page: 120,
  bookOpen: 180,
  bookClose: 180,
  move: 100,
  blocked: 120,
  puzzleAction: 80,
  success: 180,
  error: 130,
  clue: 220,
  levelUp: 300,
  dialogue: 90,
  speechHuman: 48,
  speechRobot: 48,
  speechEcho: 55,
  speechSoft: 55,
  connect: 250,
  pursuit: 120,
  train: 180,
  scan: 180,
  hazard: 180,
  dodge: 180,
  hit: 180,
};

const SOURCES: Record<SfxName, string> = {
  click: uiClick,
  open: interfaceOpen,
  close: interfaceClose,
  page: rpgBookFlip,
  bookOpen: rpgBookOpen,
  bookClose: rpgBookClose,
  move: rpgFootstep,
  blocked: rpgMetalClick,
  puzzleAction: uiSwitch,
  success: interfaceConfirm,
  error: interfaceError,
  clue: digitalPowerUp,
  levelUp: digitalPowerUp,
  dialogue: digitalTone,
  speechHuman: digitalTwoTone,
  speechRobot: digitalTone,
  speechEcho: digitalLowDown,
  speechSoft: digitalHighDown,
  connect: digitalZap,
  pursuit: rpgFootstepRun,
  train: digitalPhaseJump,
  scan: digitalPhaser,
  hazard: digitalHighDown,
  dodge: digitalPhaseJump,
  hit: impactPunch,
};

/** Bundled clips unlock on a user gesture and share one effects volume. */
export function createSfx() {
  let volume = 0.65;
  let unlocked = false;
  let disposed = false;
  const voices = new Set<Voice>();
  const lastPlayed = new Map<SfxName, number>();

  const stop = (voice: Voice) => {
    if (!voices.delete(voice)) return;
    voice.pause();
    voice.removeAttribute("src");
    voice.load();
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
    if (now - (lastPlayed.get(name) ?? -Infinity) < COOLDOWNS[name]) return;
    lastPlayed.set(name, now);
    if (voices.size >= MAX_VOICES) stop(voices.values().next().value!);

    try {
      const voice = new Audio(SOURCES[name]);
      voice.preload = "auto";
      voice.volume = volume;
      voices.add(voice);
      const release = () => stop(voice);
      voice.addEventListener("ended", release, { once: true });
      voice.addEventListener("error", release, { once: true });
      try {
        void voice.play().catch(release);
      } catch {
        release();
      }
    } catch {
      /* Audio may be unavailable or blocked. */
    }
  };
  const setVolume = (next: number) => {
    volume = Number.isFinite(next) ? Math.max(0, Math.min(1, next)) : 0;
    voices.forEach((voice) => {
      voice.volume = volume;
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
