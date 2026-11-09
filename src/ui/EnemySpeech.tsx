import { useEffect, useRef, useState } from "react";
import type { Battle } from "../game/combat";
import type { BattleCue } from "../game/combatPresentation";
import { enemyDialogue, enemySpeechEvent } from "../game/enemyDialogue";
import "./EnemySpeech.css";

export function EnemySpeech({
  battle,
  cue,
  hidden,
  reducedMotion,
}: {
  battle: Battle;
  cue: BattleCue | null;
  hidden: boolean;
  reducedMotion: boolean;
}) {
  const [speech, setSpeech] = useState({
    text: enemyDialogue(battle.enemyId, "intro"),
    serial: 0,
  });
  const handledCue = useRef<number | null>(null);
  const terminalSpoken = useRef(false);
  const lowHealthSpoken = useRef(false);
  const idleSpoken = useRef(false);
  useEffect(() => {
    const terminal = battle.phase === "won" || battle.phase === "lost";
    if (terminalSpoken.current) return;
    const freshCue = cue && handledCue.current !== cue.sequence;
    if (!terminal && !freshCue) return;
    if (cue) handledCue.current = cue.sequence;
    const event = enemySpeechEvent(
      battle,
      freshCue ? cue : null,
      lowHealthSpoken.current,
    );
    if (!event) return;
    if (terminal) terminalSpoken.current = true;
    if (event === "lowHealth") lowHealthSpoken.current = true;
    setSpeech((previous) => ({
      text: enemyDialogue(battle.enemyId, event, battle.turn),
      serial: previous.serial + 1,
    }));
  }, [battle, cue]);
  useEffect(() => {
    if (!speech.text) return;
    const timer = window.setTimeout(
      () => setSpeech((previous) => ({ ...previous, text: "" })),
      4800,
    );
    return () => window.clearTimeout(timer);
  }, [speech.serial, speech.text]);
  useEffect(() => {
    // One quiet aside per encounter; never chatter over a question or dodge.
    if (hidden || battle.phase !== "choose" || idleSpoken.current) return;
    const timer = window.setTimeout(() => {
      idleSpoken.current = true;
      setSpeech((previous) => ({
        text: enemyDialogue(battle.enemyId, "idle"),
        serial: previous.serial + 1,
      }));
    }, 18000);
    return () => window.clearTimeout(timer);
  }, [battle.phase, hidden, speech.serial]);
  return (
    <div
      className={`enemy-speech ${reducedMotion ? "speech-reduced-motion" : ""}`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      {!hidden && speech.text && (
        <p key={speech.serial} className="enemy-speech-bubble">
          <span className="enemy-speech-speaker">
            {battle.enemyName} says:{" "}
          </span>
          {speech.text}
        </p>
      )}
    </div>
  );
}
