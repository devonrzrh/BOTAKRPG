import { expect, it } from "vitest";
import {
  createQuestGraph,
  centerGraph,
  zoomGraph,
  panGraph,
} from "../src/game/questGraph";
import { initialSave, completeActivity } from "../src/game/state";
import { validateContent } from "../src/content/schema";
import raw from "../src/generated/content.json";
const content = validateContent(raw);

it("keeps locked nodes inspectable without revealing evidence or unlocking the boss", () => {
  const save = initialSave(),
    graph = createQuestGraph(save, content);
  expect(graph.selected).toBe("case");
  expect(graph.nodes.find((n) => n.id === "routing-trace")?.status).toBe(
    "locked",
  );
  expect(graph.nodes.find((n) => n.id === "clue-routing-trace")?.title).toBe(
    "Unrecovered clue",
  );
  expect(graph.nodes.find((n) => n.id === "finale")?.title).toBe("Hidden host");
  for (const [from, to] of graph.edges) {
    expect(graph.nodes.some((n) => n.id === from)).toBe(true);
    expect(graph.nodes.some((n) => n.id === to)).toBe(true);
  }
});
it("reveals clues and unlocks the finale from completion rather than reward claims", () => {
  let save = initialSave();
  save.story.caseAccepted = true;
  expect(
    createQuestGraph(save, content).nodes.find((n) => n.id === "routing-trace")
      ?.status,
  ).toBe("available");
  save = completeActivity(save, "maze-chamber");
  let graph = createQuestGraph(save, content);
  expect(
    graph.nodes.find((n) => n.id === "clue-routing-trace")?.description,
  ).toContain("maintenance");
  expect(graph.nodes.find((n) => n.id === "finale")?.status).toBe("locked");
  for (const id of ["guardian-battle", "perceptron-exhibit"])
    save = completeActivity(save, id);
  graph = createQuestGraph(save, content, "finale");
  expect(graph.selected).toBe("finale");
  expect(graph.nodes.find((n) => n.id === "finale")?.status).toBe("available");
  expect(save.claimed).toEqual([]);
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
