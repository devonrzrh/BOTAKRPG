import { expect, it } from "vitest";
import { validateContent } from "../src/content/schema";
import { createOfficeUi } from "../src/game/officeUi";
import { initialSave } from "../src/game/state";
import raw from "../src/generated/content.json";
import { drawLedgerSurface } from "../src/world/LedgerSurface";
import { drawQuestGraph } from "../src/world/QuestGraphSurface";
import { hitSurfaceZone, surfaceColumn } from "../src/world/SurfaceLayout";

function canvas() {
  return new Proxy(
    {
      font: "20px Consolas",
      measureText(value: string): TextMetrics {
        return {
          width: value.length * parseFloat(this.font) * 0.61,
        } as TextMetrics;
      },
    },
    {
      get(target, key) {
        return key in target ? Reflect.get(target, key) : () => {};
      },
    },
  ) as unknown as CanvasRenderingContext2D;
}

const content = validateContent(raw);
const save = initialSave();
save.story.caseAccepted = true;
save.completed = content.entities
  .filter((e) => e.type === "activity")
  .map((e) => e.id);

const input = {
  save,
  content,
  lessonId: "graph-search",
  page: 0,
  search: "",
  topic: "all",
  noteEditing: null,
  noteDraft: "",
};

it("bases multiline button hit bounds on their measured label", () => {
  const model = createOfficeUi(input).find((m) => m.id === "desk")!;
  const control = model.buttons.find((b) => b.id === "clues-next")!;
  const zones: ReturnType<typeof drawLedgerSurface> = [];
  const column = surfaceColumn(canvas(), 10, 20, 90, zones);
  const body = column.text("first second", 20, "#000", 8);
  const button = column.button(control, "Next clues", 20, "#000", () => {});
  expect(button.y).toBe(body.y + body.h + 8);
  expect(button.h).toBe(70);
  expect(hitSurfaceZone(zones, 12, button.y + 60)).toBe(control);
  expect(hitSurfaceZone(zones, 12, button.y - 1)).toBeUndefined();
});

it("fits every recovered clue and its reference above the ledger footer", () => {
  const pages = Math.ceil(
    content.entities.filter((e) => e.type === "activity" && e.clue).length / 2,
  );
  for (let page = 0; page < pages; page++) {
    const model = createOfficeUi({ ...input, page }).find(
      (m) => m.id === "desk",
    )!;
    const zones = drawLedgerSurface(canvas(), model, null);
    const footer = zones.find((z) => z.control.id === "clues-prev")!;
    for (const zone of zones.filter((z) =>
      z.control.id.startsWith("clue-reference-"),
    )) {
      expect(zone.y + zone.h, zone.control.id).toBeLessThan(footer.y);
      expect(hitSurfaceZone(zones, zone.x + 20, zone.y + 20)).toBe(
        zone.control,
      );
    }
  }
});

it("keeps the handoff brief and its practice action inside the quest panel", () => {
  const model = createOfficeUi({
    ...input,
    questSelection: "depot-search",
  }).find((m) => m.id === "quests")!;
  const zones = drawQuestGraph(canvas(), model.graph!, model.buttons, null);
  const practice = zones.find((z) => z.control.id === "evidence-depot-search")!;
  expect(practice.y).toBeGreaterThan(295);
  expect(practice.y + practice.h).toBeLessThan(510);
});
