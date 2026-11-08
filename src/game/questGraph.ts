import type { Content, Quest } from "../content/schema";
import type { Save } from "./state";
import type { SurfaceButton } from "./officeUi";
import { finaleAvailable, questComplete, nextObjective } from "./investigation";
import { activityStory } from "./questStory";
import { chapterLabel, chaptersForBranch } from "./chapterQuest";

export interface GraphView {
  x: number;
  y: number;
  zoom: number;
}
export interface QuestNode {
  id: string;
  title: string;
  description: string;
  x: number;
  y: number;
  kind: "case" | "activity" | "clue" | "boss" | "chapter";
  status: "locked" | "available" | "completed";
  actions: string[];
}
export interface QuestGraph {
  branch?: string;
  title?: string;
  nodes: QuestNode[];
  edges: [string, string][];
  selected: string;
  view: GraphView;
}
export const GRAPH_AREA = { x: 18, y: 80, w: 650, h: 445 };
export const centerGraph = (node: QuestNode, zoom = 1): GraphView => ({
  x: 325 - node.x * zoom,
  y: 222 - node.y * zoom,
  zoom,
});
export function zoomGraph(
  view: GraphView,
  factor: number,
  point = { x: 325, y: 222 },
): GraphView {
  const zoom = Math.max(1, Math.min(2.2, view.zoom * factor)),
    ratio = zoom / view.zoom;
  return {
    x: point.x - (point.x - view.x) * ratio,
    y: point.y - (point.y - view.y) * ratio,
    zoom,
  };
}
export function panGraph(view: GraphView, dx: number, dy: number): GraphView {
  return {
    ...view,
    x: Math.max(-2400, Math.min(1000, view.x + dx)),
    y: Math.max(-1800, Math.min(1000, view.y + dy)),
  };
}
export function createQuestGraph(
  save: Save,
  content: Content,
  selected?: string,
  view?: GraphView,
): QuestGraph {
  const branches = content.entities.filter(
    (e): e is Quest => e.type === "quest" && e.kind === "branch",
  );
  const chapter = content.entities.find(
    (e): e is Quest =>
      e.type === "quest" && e.kind === "chapter" && e.id === selected,
  );
  const detail = branches.find(
    (b) =>
      b.id === chapter?.branch ||
      selected === `intro-${b.id}` ||
      selected === `chapter-boss-${b.id}`,
  );
  if (detail) {
    const chapters = chaptersForBranch(content, detail.id),
      first = content.entities.find((e) => e.id === detail.objectives[0]),
      boss = content.entities.find((e) => e.id === detail.objectives.at(-1));
    const nodes: QuestNode[] = [
      {
        id: `intro-${detail.id}`,
        title: "Orientation",
        description: first?.title ?? "Enter the investigation.",
        x: 0,
        y: 0,
        kind: "activity",
        status: save.completed.includes(detail.objectives[0])
          ? "completed"
          : save.story.caseAccepted
            ? "available"
            : "locked",
        actions: [`intro-start-${detail.id}`],
      },
    ];
    for (const c of chapters)
      nodes.push({
        id: c.id,
        title: chapterLabel(c),
        description: questComplete(save, c)
          ? "Chapter checked. Review or practice again."
          : save.chapterProgress[c.id]?.practiced
            ? "Practice complete. Apply it in the encounter."
            : save.chapterProgress[c.id]?.introduced
              ? "Worked example read. Try guided practice."
              : "Study the concept, work an example, then practice.",
        x: 0,
        y: 0,
        kind: "chapter",
        status: questComplete(save, c)
          ? "completed"
          : save.story.caseAccepted &&
              detail.objectives
                .slice(0, detail.objectives.indexOf(c.objectives[0]))
                .every((id) => save.completed.includes(id))
            ? "available"
            : "locked",
        actions: [
          `study-${c.id}`,
          `chapter-book-${c.id}`,
          `chapter-puzzle-${c.id}`,
        ],
      });
    nodes.push({
      id: `chapter-boss-${detail.id}`,
      title: boss?.title ?? "Branch boss",
      description: "Apply the chapters together to recover this clue.",
      x: 0,
      y: 0,
      kind: "boss",
      status: save.completed.includes(detail.objectives.at(-1)!)
        ? "completed"
        : detail.objectives
              .slice(0, -1)
              .every((id) => save.completed.includes(id)) &&
            save.story.caseAccepted
          ? "available"
          : "locked",
      actions: [`boss-start-${detail.id}`, `claim-${detail.id}`],
    });
    nodes.forEach((n, i) => {
      const row = Math.floor(i / 3),
        col = row % 2 ? 2 - (i % 3) : i % 3;
      n.x = 100 + 220 * col;
      n.y = 80 + 150 * row;
    });
    const selection = nodes.some((n) => n.id === selected)
      ? selected!
      : nodes[0].id;
    return {
      branch: detail.id,
      title:
        detail.id === "routing-trace"
          ? "Algorithms"
          : detail.id === "access-records"
            ? "Data structures"
            : "AI chapters",
      nodes,
      edges: nodes.slice(1).map((n, i) => [nodes[i].id, n.id]),
      selected: selection,
      view: view ?? centerGraph(nodes.find((n) => n.id === selection)!),
    };
  }
  const accepted = save.story.caseAccepted;
  const mid = 80 + Math.max(0, branches.length - 1) * 70;
  const nodes: QuestNode[] = [
    {
      id: "case",
      title: "Take the case",
      description:
        "Reconstruct ECHO-7's escape. Follow each lead and recover its evidence.",
      x: 100,
      y: mid,
      kind: "case",
      status: accepted ? "completed" : "available",
      actions: accepted ? ["claim-case"] : ["accept-case"],
    },
  ];
  const edges: [string, string][] = [];
  branches.forEach((branch, i) => {
    const done = questComplete(save, branch);
    const activity = content.entities.find(
      (e) =>
        e.type === "activity" &&
        e.id ===
          (done ? branch.objectives.at(-1) : nextObjective(save, branch)),
    );
    nodes.push({
      id: branch.id,
      title:
        branch.id === "routing-trace"
          ? "Algorithms"
          : branch.id === "access-records"
            ? "Data structures"
            : "Connectionist AI",
      description: `${branch.objectives.filter((id) => save.completed.includes(id)).length}/${branch.objectives.length} complete. ${activity ? (activityStory(content, activity.id, "before")?.title ?? activity.title) : branch.description}`,
      x: 320,
      y: 80 + i * 140,
      kind: "activity",
      status: done ? "completed" : accepted ? "available" : "locked",
      actions: [`chapters-${branch.id}`, `branch-${branch.id}`],
    });
    nodes.push({
      id: `clue-${branch.id}`,
      title:
        done && activity?.type === "activity"
          ? (activity.clue?.title ?? "Evidence recovered")
          : "Unrecovered clue",
      description:
        done && activity?.type === "activity"
          ? (activity.clue?.text ?? "Evidence recovered.")
          : `Complete ${branch.title} to reveal this evidence.`,
      x: 540,
      y: 80 + i * 140,
      kind: "clue",
      status: done ? "completed" : "locked",
      actions: [`claim-${branch.id}`, `material-${branch.id}`],
    });
    edges.push(
      ["case", branch.id],
      [branch.id, `clue-${branch.id}`],
      [`clue-${branch.id}`, "finale"],
    );
  });
  const closed = save.completed.includes("echo-battle"),
    ready = finaleAvailable(save, content);
  const missing = branches
    .filter((b) => !questComplete(save, b))
    .map((b) => b.title);
  nodes.push({
    id: "finale",
    title: ready || closed ? "ECHO-7" : "Hidden host",
    description: closed
      ? "ECHO-7 contained. The case is closed."
      : ready
        ? "The clues identify the abandoned subnet. Confront ECHO-7."
        : `Recover evidence from: ${missing.join(", ")}.`,
    x: 760,
    y: mid,
    kind: "boss",
    status: closed ? "completed" : ready ? "available" : "locked",
    actions: ["finale", "finale-reward", "claim-case"],
  });
  return {
    nodes,
    edges,
    selected: nodes.some((n) => n.id === selected)
      ? selected!
      : accepted
        ? (branches.find((b) => !questComplete(save, b))?.id ??
          branches[0]?.id ??
          "case")
        : "case",
    view: view ?? { x: 0, y: 0, zoom: 1 },
  };
}
export function graphButtons(graph: QuestGraph): SurfaceButton[] {
  return [
    ...graph.nodes.map((node) => ({
      id: `node-${node.id}`,
      x: 0,
      y: 0,
      w: 1,
      h: 1,
      label: `${node.title} / ${node.status}`,
      action: { kind: "graph-select" as const, id: node.id },
    })),
    ...[
      ["overview", "Overview", 250, 130],
      ["zoom-out", "−", 390, 50],
      ["zoom-in", "+", 450, 50],
      ["center", "Center", 510, 140],
    ].map(([id, label, x, w]) => ({
      id: `graph-${id}`,
      x: Number(x),
      y: 18,
      w: Number(w),
      h: 44,
      label: String(label),
      action: { kind: "graph-view" as const, id: String(id) },
    })),
  ];
}
export function visibleGraphButtons(model: {
  buttons: SurfaceButton[];
  graph?: QuestGraph;
}) {
  if (!model.graph) return model.buttons;
  const selected = model.graph.nodes.find(
    (n) => n.id === model.graph!.selected,
  )!;
  return model.buttons.filter(
    (b) =>
      b.id.startsWith("node-") ||
      b.id.startsWith("graph-") ||
      selected.actions.includes(b.id),
  );
}
