// Disposable QA journals, isolated from the browser's existing progress.
import { mkdir, writeFile } from "node:fs/promises";
import raw from "../src/generated/content.json";
import { validateContent, type Quest } from "../src/content/schema";
import { initialSave, completeActivity, addXp } from "../src/game/state";
import { acknowledgeStory, activityStory } from "../src/game/questStory";
import { createMaze, shortestPath } from "../src/game/maze";
const content = validateContent(raw),
  route = content.entities.find(
    (e): e is Quest => e.type === "quest" && e.id === "routing-trace",
  )!;
let save = initialSave();
save.story = {
  ...save.story,
  prologueSeen: true,
  caseAccepted: true,
  briefingSeen: true,
  networkIntroSeen: true,
};
for (const id of route.objectives.slice(0, -1)) {
  save = acknowledgeStory(save, activityStory(content, id, "before")!);
  save = completeActivity(save, id);
  if (id !== "maze-chamber") save = addXp(save, 20);
}
await mkdir("test-results", { recursive: true });
await writeFile(
  "test-results/routing-maze-path.json",
  JSON.stringify(shortestPath(createMaze(42))),
);
await writeFile(
  "test-results/routing-boss-ready.json",
  JSON.stringify(save, null, 2),
);
console.log("Created routing boss checkpoint; no browser saves changed.");
