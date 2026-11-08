import type { SfxName } from "./sfx";

export function dialogueVoice(speaker: string): SfxName {
  if (/\b(echo|mimic|warden|keeper)\b/i.test(speaker)) return "speechEcho";
  if (/\bluma\b/i.test(speaker)) return "speechSoft";
  if (/\b(patch|folio)\b/i.test(speaker)) return "speechRobot";
  return "speechHuman";
}

/** One blip for fresh spoken text; never chatter through pauses or catch-up frames. */
export function shouldBlip(
  characters: string[],
  before: number,
  after: number,
) {
  return (
    after > before &&
    after - before <= 6 &&
    characters
      .slice(before, after)
      .some((character) => /[\p{L}\p{N}]/u.test(character))
  );
}
