import { describe, expect, it } from "vitest";
import raw from "../src/generated/content.json";
import { validateContent } from "../src/content/schema";
import {
  finishIntake,
  initialSave,
  markTutorialSeen,
  needsIntake,
  parseSave,
  renamePlayer,
  resetTutorials,
  setTipsEnabled,
} from "../src/game/state";
import {
  detectiveAddress,
  personalizeText,
  playerInitials,
  speakerLabel,
} from "../src/game/player";
import {
  TUTORIAL_IDS,
  manualSections,
  tutorialById,
  tutorials,
} from "../src/game/tutorials";
const content = validateContent(raw);

describe("intake and detective name", () => {
  it("asks a fresh journal for a name and not a played one", () => {
    const save = initialSave();
    expect(needsIntake(save)).toBe(true);
    save.story.prologueSeen = true;
    expect(needsIntake(save)).toBe(false);
  });
  it("files the chosen name once", () => {
    const save = finishIntake(initialSave(), "  Rhea   Vance ");
    expect(save.character.name).toBe("Rhea Vance");
    expect(save.onboarding.intakeComplete).toBe(true);
    expect(needsIntake(save)).toBe(false);
    expect(parseSave(save, content).character.name).toBe("Rhea Vance");
  });
  it("rejects blank and overlong names without changing the journal", () => {
    const save = initialSave();
    expect(() => finishIntake(save, "   ")).toThrow(/Enter a detective name/);
    expect(() => renamePlayer(save, "x".repeat(41))).toThrow(/under 40/);
    expect(save.character.name).toBe("Vale");
    expect(save.onboarding.intakeComplete).toBe(false);
  });
  it("renames later without resetting onboarding", () => {
    const save = finishIntake(initialSave(), "Rhea");
    const renamed = renamePlayer(save, "Kestrel");
    expect(renamed.character.name).toBe("Kestrel");
    expect(renamed.onboarding).toEqual(save.onboarding);
  });
  it("formats addresses, initials and authored tokens", () => {
    expect(detectiveAddress("Vale")).toBe("Detective Vale");
    expect(detectiveAddress("Detective Vale")).toBe("Detective Vale");
    expect(playerInitials("Detective Rhea Vance")).toBe("RV");
    expect(playerInitials("")).toBe("?");
    expect(personalizeText("{name}, the log is open.", "Rhea")).toBe(
      "Detective Rhea, the log is open.",
    );
    expect(speakerLabel("Vale", "Rhea")).toBe("Rhea");
    expect(speakerLabel("Vale", "Rhea Kestrel")).toBe("Kestrel");
    expect(speakerLabel("Dispatch", "Rhea")).toBe("Dispatch");
    expect(speakerLabel("Vale")).toBe("Vale");
  });
});

describe("field tips", () => {
  it("marks a tip once and can reset them", () => {
    let save = initialSave();
    save = markTutorialSeen(save, "room");
    save = markTutorialSeen(save, "room");
    expect(save.onboarding.seenTips).toEqual(["room"]);
    save = markTutorialSeen(save, "maze");
    expect(save.onboarding.seenTips).toEqual(["room", "maze"]);
    expect(parseSave(save, content).onboarding.seenTips).toEqual([
      "room",
      "maze",
    ]);
    expect(resetTutorials(save).onboarding).toEqual({
      intakeComplete: false,
      tipsEnabled: true,
      seenTips: [],
    });
    expect(setTipsEnabled(save, false).onboarding.tipsEnabled).toBe(false);
  });
  it("rejects unknown tip identifiers", () => {
    const save = initialSave();
    expect(() =>
      parseSave(
        {
          ...save,
          onboarding: { ...save.onboarding, seenTips: ["missing-tip"] },
        },
        content,
      ),
    ).toThrow();
  });
  it("defines every tip and manual section", () => {
    expect(tutorials.map((tutorial) => tutorial.id)).toEqual([...TUTORIAL_IDS]);
    for (const id of TUTORIAL_IDS) {
      const tutorial = tutorialById(id);
      expect(tutorial.steps.length).toBeGreaterThan(0);
      for (const step of tutorial.steps) {
        expect(step.title.trim()).not.toBe("");
        expect(step.body.trim()).not.toBe("");
      }
    }
    expect(manualSections.length).toBeGreaterThan(4);
    expect(manualSections.every((section) => section.lines.length > 0)).toBe(
      true,
    );
  });
  it("loads saves written before onboarding existed", () => {
    const { onboarding: _onboarding, ...legacy } = initialSave();
    legacy.story.prologueSeen = true;
    const restored = parseSave(legacy, content);
    expect(restored.onboarding).toEqual({
      intakeComplete: false,
      tipsEnabled: true,
      seenTips: [],
    });
    expect(needsIntake(restored)).toBe(false);
  });
});
