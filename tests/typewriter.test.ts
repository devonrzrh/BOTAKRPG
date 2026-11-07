import { expect, it } from "vitest";
import { typewriterTimeline, revealedCharacters } from "../src/game/typewriter";
it("reveals ordered graphemes with punctuation pauses and finishes exactly at the deadline", () => {
  const { characters, times } = typewriterTimeline("Hi, Vale.");
  expect(characters.join("")).toBe("Hi, Vale.");
  expect(revealedCharacters(times, 0)).toBe(0);
  expect(revealedCharacters(times, times[0])).toBe(1);
  expect(times[3] - times[2]).toBe(70);
  expect(revealedCharacters(times, times.at(-1)! - 1)).toBe(
    characters.length - 1,
  );
  expect(revealedCharacters(times, times.at(-1)!)).toBe(characters.length);
  expect(revealedCharacters(times, Infinity)).toBe(characters.length);
});
it("keeps emoji, combining characters and line breaks intact", () => {
  const { characters, times } = typewriterTimeline("é e\u0301 👩‍💻\nGo");
  expect(characters).toEqual(["é", " ", "e\u0301", " ", "👩‍💻", "\n", "G", "o"]);
  expect(times[6] - times[5]).toBe(100);
  expect(revealedCharacters([], 200)).toBe(0);
});
