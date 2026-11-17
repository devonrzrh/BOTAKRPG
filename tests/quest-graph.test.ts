import { expect, it } from "vitest";
import {
  createQuestGraph,
  centerGraph,
  zoomGraph,
  panGraph,
} from "../src/game/questGraph";
import { initialSave, completeActivity } from "../src/game/state";
import {
  activityUnlocked,
  finaleAvailable,
  questComplete,
} from "../src/game/investigation";
import { validateContent, type Quest } from "../src/content/schema";
import raw from "../src/generated/content.json";
const content = validateContent(raw);

it("keeps the overview compact and hides locked clues without unlocking the boss", () => {
  const save = initialSave(),
    graph = createQuestGraph(save, content);
  expect(graph.selected).toBe("case");
  expect(graph.nodes.find((n) => n.id === "routing-trace")?.status).toBe(
    "locked",
  );
  expect(graph.nodes.some((n) => n.kind === "clue")).toBe(false);
  expect(graph.nodes).toHaveLength(7);
  expect(graph.nodes.every((n) => n.x >= 100 && n.x <= 540)).toBe(true);
  expect(graph.nodes.every((n) => n.y >= 44 && n.y <= 401)).toBe(true);
  expect(graph.nodes.find((n) => n.id === "finale")?.title).toBe("Hidden host");
  for (const [from, to] of graph.edges) {
    expect(graph.nodes.some((n) => n.id === from)).toBe(true);
    expect(graph.nodes.some((n) => n.id === to)).toBe(true);
  }
});
it("shows recovered clue names on branches and unlocks the finale from completion", () => {
  let save = initialSave();
  save.story.caseAccepted = true;
  expect(
    createQuestGraph(save, content).nodes.find((n) => n.id === "routing-trace")
      ?.status,
  ).toBe("available");
  const routing = content.entities.find((e) => e.id === "routing-trace");
  if (routing?.type === "quest")
    for (const id of routing.objectives) save = completeActivity(save, id);
  let graph = createQuestGraph(save, content);
  const routingEvidence = content.entities.find(
    (e) =>
      e.type === "activity" &&
      e.id === (routing?.type === "quest" ? routing.objectives.at(-1) : ""),
  );
  const evidenceTitle =
    routingEvidence?.type === "activity"
      ? routingEvidence.clue?.title ?? "Evidence"
      : "Evidence";
  expect(
    graph.nodes.find((n) => n.id === "routing-trace")?.description,
  ).toContain(evidenceTitle);
  expect(graph.nodes.find((n) => n.id === "routing-trace")?.actions).toContain(
    "claim-routing-trace",
  );
  expect(graph.nodes.find((n) => n.id === "finale")?.status).toBe("locked");
  for (const branch of content.entities.filter(
    (e) => e.type === "quest" && e.kind === "branch",
  ))
    if (branch.type === "quest")
      for (const id of branch.objectives) save = completeActivity(save, id);
  graph = createQuestGraph(save, content, "finale");
  expect(graph.selected).toBe("finale");
  expect(graph.nodes.find((n) => n.id === "finale")?.status).toBe("available");
  expect(save.claimed).toEqual([]);
});
it("adds playable Supply and Simulation leads to the five-clue finale gate", () => {
  let save = initialSave();
  save.story.caseAccepted = true;
  const branches = content.entities.filter(
    (e): e is Quest => e.type === "quest" && e.kind === "branch",
  );
  expect(branches.map((branch) => branch.id)).toContain("supply-district");
  expect(branches.map((branch) => branch.id)).toContain("simulation-facility");
  expect(branches).toHaveLength(5);
  expect(finaleAvailable(save, content)).toBe(false);

  for (const id of ["supply-district", "simulation-facility"]) {
    const branch = branches.find((quest) => quest.id === id)!;
    const graph = createQuestGraph(save, content, branch.objectives[1]);
    expect(graph.branch).toBe(id);
    expect(graph.nodes.map((node) => node.id)).toContain(branch.objectives[1]);
    for (const activity of branch.objectives) {
      expect(activityUnlocked(save, activity, content)).toBe(true);
      save = completeActivity(save, activity);
    }
    expect(questComplete(save, branch)).toBe(true);
    const clue = content.entities.find(
      (entity) =>
        entity.type === "activity" && entity.id === branch.objectives.at(-1),
    );
    expect(clue?.type === "activity" && clue.clue?.title).toBeTruthy();
    expect(finaleAvailable(save, content)).toBe(false);
  }

  for (const branch of branches) {
    if (branch.id === "supply-district" || branch.id === "simulation-facility")
      continue;
    for (const activity of branch.objectives)
      save = completeActivity(save, activity);
  }
  expect(finaleAvailable(save, content)).toBe(true);
});
it("keeps the point under the cursor fixed while zooming and bounds navigation", () => {
  const view = { x: -120, y: 32, zoom: 1 },
    point = { x: 220, y: 170 };
  const next = zoomGraph(view, 1.5, point);
  expect((point.x - next.x) / next.zoom).toBeCloseTo(
    (point.x - view.x) / view.zoom,
  );
  expect((point.y - next.y) / next.zoom).toBeCloseTo(
    (point.y - view.y) / view.zoom,
  );
  expect(zoomGraph(view, 100).zoom).toBe(2.2);
  expect(zoomGraph(view, 0.01).zoom).toBe(1);
  expect(panGraph(view, 1e6, -1e6)).toEqual({ x: 1000, y: -1800, zoom: 1 });
  const node = createQuestGraph(initialSave(), content).nodes[0],
    center = centerGraph(node, 1.4);
  expect(node.x * center.zoom + center.x).toBe(325);
  expect(node.y * center.zoom + center.y).toBe(222);
});
