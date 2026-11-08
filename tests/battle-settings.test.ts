import { expect, it } from "vitest";
import raw from "../src/generated/content.json";
import { validateContent } from "../src/content/schema";
import { initialSave, parseSave } from "../src/game/state";

const content = validateContent(raw);
it("restores legacy journals with independent music, combat sound and turn defaults", () => {
  const save = initialSave();
  const legacy = {
    ...save,
    settings: { renderer: "auto", reducedMotion: false },
  };
  expect(parseSave(legacy, content).settings).toMatchObject({
    musicVolume: 0.55,
    sfxVolume: 0.65,
    combatMuted: false,
    battleAutoAdvance: true,
  });
});
it("preserves independent audio and pacing preferences through export and import", () => {
  const save = initialSave();
  save.settings = {
    ...save.settings,
    musicVolume: 0.2,
    sfxVolume: 0,
    combatMuted: true,
    battleAutoAdvance: false,
  };
  expect(parseSave(JSON.parse(JSON.stringify(save)), content).settings).toEqual(
    save.settings,
  );
  expect(() =>
    parseSave(
      { ...save, settings: { ...save.settings, combatMuted: "yes" } },
      content,
    ),
  ).toThrow();
  expect(save.settings.musicVolume).toBe(0.2);
  expect(() =>
    parseSave(
      { ...save, settings: { ...save.settings, sfxVolume: 1.1 } },
      content,
    ),
  ).toThrow();
});
