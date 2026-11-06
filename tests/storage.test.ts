import "fake-indexeddb/auto";
import { it, expect } from "vitest";
import { loadSave, storeSave } from "../src/storage";
import { initialSave } from "../src/game/state";
it("persists the complete journal in IndexedDB", async () => {
  const save = initialSave();
  save.notes["graph-search"] = "Remember the queue";
  await storeSave(save);
  expect(await loadSave()).toEqual(save);
});
