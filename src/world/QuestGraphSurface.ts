import { GRAPH_AREA, type QuestGraph } from "../game/questGraph";
import { wrapLines, type SurfaceButton } from "../game/officeUi";

export function drawQuestGraph(
  c: CanvasRenderingContext2D,
  graph: QuestGraph,
  buttons: SurfaceButton[],
  focused: string | null,
) {
  const zones: {
    x: number;
    y: number;
    w: number;
    h: number;
    control: SurfaceButton;
  }[] = [];
  const text = (
    value: string,
    x: number,
    y: number,
    size = 22,
    width = 270,
    color = "#dceeed",
  ) => {
    c.font = `${size}px Consolas, monospace`;
    c.textBaseline = "top";
    c.fillStyle = color;
    wrapLines(value, Math.floor(width / (size * 0.61))).forEach((line, i) =>
      c.fillText(line, x, y + i * size * 1.25),
    );
  };
  const button = (b: SurfaceButton, x = b.x, y = b.y, w = b.w, h = b.h) => {
    c.fillStyle = b.disabled
      ? "#13272f"
      : focused === b.id
        ? "#2d5967"
        : "#193e4a";
    c.fillRect(x, y, w, h);
    c.strokeStyle = focused === b.id ? "#f0c986" : "#4e7580";
    c.lineWidth = focused === b.id ? 3 : 1;
    c.strokeRect(x, y, w, h);
    text(
      b.label.replace("Materials / tutorial", "Reference book"),
      x + 10,
      y + 12,
      20,
      w - 20,
      b.disabled ? "#91a6ae" : "#e8f5f2",
    );
    zones.push({ x, y, w, h, control: b });
  };
  c.fillStyle = "#0b1b23";
  c.fillRect(0, 0, 1024, 576);
  text("Quest map", 24, 27, 28, 340);
  for (const b of buttons.filter((b) => b.id.startsWith("graph-"))) button(b);
  c.save();
  c.beginPath();
  c.rect(GRAPH_AREA.x, GRAPH_AREA.y, GRAPH_AREA.w, GRAPH_AREA.h);
  c.clip();
  c.translate(GRAPH_AREA.x + graph.view.x, GRAPH_AREA.y + graph.view.y);
  c.scale(graph.view.zoom, graph.view.zoom);
  for (const [from, to] of graph.edges) {
    const a = graph.nodes.find((n) => n.id === from)!,
      b = graph.nodes.find((n) => n.id === to)!;
    c.strokeStyle = b.status === "locked" ? "#37515c" : "#6dcbb8";
    c.lineWidth = 3;
    c.setLineDash(b.status === "locked" ? [7, 7] : []);
    c.beginPath();
    c.moveTo(a.x + 100, a.y);
    c.bezierCurveTo((a.x + b.x) / 2, a.y, (a.x + b.x) / 2, b.y, b.x - 100, b.y);
    c.stroke();
    c.setLineDash([]);
  }
  for (const n of graph.nodes) {
    const selected = n.id === graph.selected || focused === `node-${n.id}`;
    c.fillStyle = selected ? "#254a58" : "#142d38";
    c.fillRect(n.x - 100, n.y - 44, 200, 88);
    c.strokeStyle = selected
      ? "#f0c986"
      : n.status === "completed"
        ? "#76d4bc"
        : n.status === "locked"
          ? "#52636d"
          : "#9ddce1";
    c.lineWidth = selected ? 3 : 2;
    c.strokeRect(n.x - 100, n.y - 44, 200, 88);
    text(n.title, n.x - 88, n.y - 30, 20, 182);
    text(
      n.kind === "boss"
        ? n.status === "completed"
          ? "Boss ✓"
          : n.status === "locked"
            ? "Boss locked"
            : "Boss ready"
        : n.status === "completed"
          ? "✓ Complete"
          : n.status === "locked"
            ? "Locked"
            : "Available",
      n.x - 88,
      n.y + 22,
      18,
      182,
      "#a9c6cc",
    );
    const x = GRAPH_AREA.x + graph.view.x + (n.x - 100) * graph.view.zoom,
      y = GRAPH_AREA.y + graph.view.y + (n.y - 44) * graph.view.zoom;
    const left = Math.max(x, GRAPH_AREA.x),
      top = Math.max(y, GRAPH_AREA.y),
      right = Math.min(x + 200 * graph.view.zoom, GRAPH_AREA.x + GRAPH_AREA.w),
      bottom = Math.min(y + 88 * graph.view.zoom, GRAPH_AREA.y + GRAPH_AREA.h);
    const control = buttons.find((b) => b.id === `node-${n.id}`)!;
    if (right > left && bottom > top)
      zones.push({
        x: left,
        y: top,
        w: right - left,
        h: bottom - top,
        control,
      });
  }
  c.restore();
  c.fillStyle = "#112730";
  c.fillRect(688, 80, 318, 445);
  const n = graph.nodes.find((n) => n.id === graph.selected)!;
  text(n.title, 710, 100, 26, 275);
  text(n.status, 710, 175, 20, 275, "#83d5c1");
  text(n.description, 710, 210, 20, 275);
  n.actions
    .map((id) => buttons.find((b) => b.id === id))
    .filter((b): b is SurfaceButton => !!b)
    .forEach((b, i) => button(b, 710, 350 + i * 54, 276, 46));
  text("Drag to pan · Scroll to zoom", 24, 545, 18, 650, "#a9c6cc");
  return zones;
}
