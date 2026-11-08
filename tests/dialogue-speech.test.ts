import { describe, expect, it } from "vitest";
import { dialogueVoice, shouldBlip } from "../src/game/dialogueSpeech";
import { typewriterTimeline } from "../src/game/typewriter";

describe("dialogue speech blips", () => {
  it("gives speakers distinct voice tones", () => {
    expect(dialogueVoice("Dispatch")).toBe("speechHuman");
    expect(dialogueVoice("Vale")).toBe("speechHuman");
    expect(dialogueVoice("PATCH")).toBe("speechRobot");
    expect(dialogueVoice("FOLIO")).toBe("speechRobot");
    expect(dialogueVoice("LUMA")).toBe("speechSoft");
    expect(dialogueVoice("ECHO-7")).toBe("speechEcho");
    expect(dialogueVoice("Mimic")).toBe("speechEcho");
  });

  it("sounds newly revealed letters and digits, leaving punctuation pauses silent", () => {
    const { characters } = typewriterTimeline("Hi, 7.\né 👩‍💻");
    expect(shouldBlip(characters, 0, 1)).toBe(true);
    expect(shouldBlip(characters, 1, 2)).toBe(true);
    expect(shouldBlip(characters, 2, 4)).toBe(false);
    expect(shouldBlip(characters, 4, 5)).toBe(true);
    expect(shouldBlip(characters, 5, 7)).toBe(false);
    expect(shouldBlip(characters, 7, 8)).toBe(true);
    expect(shouldBlip(characters, 8, 10)).toBe(false);
  });

  it("avoids duplicate frames, rewinds and bursts after stalls or instant reveal", () => {
    const { characters } = typewriterTimeline(
      "A long line of dialogue that was skipped.",
    );
    expect(shouldBlip(characters, 1, 1)).toBe(false);
    expect(shouldBlip(characters, 5, 2)).toBe(false);
    expect(shouldBlip(characters, 0, characters.length)).toBe(false);
    expect(shouldBlip(characters, 0, 6)).toBe(true);
  });
});
