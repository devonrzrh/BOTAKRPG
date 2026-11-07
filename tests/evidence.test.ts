import { expect, it } from "vitest";
import raw from "../src/generated/content.json";
import { validateContent } from "../src/content/schema";
import { completeActivity, initialSave, parseSave } from "../src/game/state";
import { recoveredClues } from "../src/game/evidence";
import { createOfficeUi } from "../src/game/officeUi";

const content = validateContent(raw);
it("files only recovered evidence and keeps it through save round trips", () => {
  const initial = initialSave();
  expect(recoveredClues(initial, content)).toEqual([]);
  const save = completeActivity(
    completeActivity(initial, "maze-chamber"),
    "guardian-battle",
  );
  const clues = recoveredClues(
    parseSave(JSON.parse(JSON.stringify(save)), content),
    content,
  );
  expect(clues.map((c) => c.id)).toEqual(["maze-chamber", "guardian-battle"]);
  expect(
    recoveredClues(completeActivity(save, "maze-chamber"), content),
  ).toEqual(clues);
  expect(
    clues.every((c) =>
      content.entities.some((e) => e.type === "lesson" && e.id === c.lesson),
    ),
  ).toBe(true);
});
it("paginates the desk ledger with clue references and no equipment or skill controls", () => {
  const save = initialSave();
  save.completed = content.entities.flatMap((e) =>
    e.type === "activity" && e.clue && e.id !== "echo-battle" ? [e.id] : [],
  );
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
  const ledger = createOfficeUi(input).find((m) => m.id === "desk")!;
  expect(ledger.title).toBe("CLUE LEDGER");
  expect(ledger.buttons.filter((b) => b.action.kind === "lesson")).toHaveLength(
    2,
  );
  expect(ledger.buttons.some((b) => /equip|learn/.test(b.id))).toBe(false);
  expect(ledger.buttons.find((b) => b.id === "clues-prev")?.disabled).toBe(
    true,
  );
  const last = createOfficeUi({ ...input, page: 999 }).find(
    (m) => m.id === "desk",
  )!;
  expect(last.buttons.find((b) => b.id === "clues-next")?.disabled).toBe(true);
  expect(last.texts.some((t) => t.text.includes("ECHO-7 contained"))).toBe(
    false,
  );
});
