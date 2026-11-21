import { GRAPH_AREA, GRAPH_NODE, type QuestGraph } from "../game/questGraph";
import type { SurfaceButton } from "../game/officeUi";
import {
  measureSurfaceText,
  surfaceColumn,
  type SurfaceZone,
} from "./SurfaceLayout";

export function drawQuestGraph(
  c: CanvasRenderingContext2D | null,
  graph: QuestGraph,
  buttons: SurfaceButton[],
  focused: string | null,
) {
  const zones: SurfaceZone[] = [];
  if (!c) return zones;
  const foreground = "#dceeed";
  const text = (
    value: string,
    x: number,
    y: number,
    size: number,
    width: number,
    color = foreground,
  ) => measureSurfaceText(c, value, width, size).draw(x, y, color);
  const button = (
    column: ReturnType<typeof surfaceColumn>,
    b: SurfaceButton,
  ) => {
    column.button(
      b,
      b.label.replace("Materials / tutorial", "Reference book"),
      20,
      b.disabled ? "#91a6ae" : "#e8f5f2",
      (rect) => {
        c.fillStyle = b.disabled
          ? "#13272f"
          : focused === b.id
            ? "#2d5967"
            : "#193e4a";
        c.fillRect(rect.x, rect.y, rect.w, rect.h);
        c.strokeStyle = focused === b.id ? "#f0c986" : "#4e7580";
        c.lineWidth = focused === b.id ? 3 : 1;
        c.strokeRect(rect.x, rect.y, rect.w, rect.h);
      },
      8,
    );
  };
  c.fillStyle = "#09171f";
  c.fillRect(0, 0, 1024, 576);
  // Quiet instrument-panel grain and frame, kept behind the graph controls.
  c.strokeStyle = "rgba(104, 166, 174, 0.12)";
  c.lineWidth = 1;
  c.strokeRect(8.5, 8.5, 1007, 559);
  text(graph.title ?? "Quest map", 24, 27, 28, 562);
  for (const b of buttons.filter((b) => b.id.startsWith("graph-")))
    button(surfaceColumn(c, b.x, b.y, b.w, zones), b);
  c.save();
  c.beginPath();
  c.rect(GRAPH_AREA.x, GRAPH_AREA.y, GRAPH_AREA.w, GRAPH_AREA.h);
  c.clip();
  c.fillStyle = "#0c1c25";
  c.fillRect(GRAPH_AREA.x, GRAPH_AREA.y, GRAPH_AREA.w, GRAPH_AREA.h);
  c.strokeStyle = "rgba(117, 174, 181, 0.09)";
  c.lineWidth = 1;
  const gridStep = 32;
  for (
    let x = GRAPH_AREA.x + 0.5;
    x < GRAPH_AREA.x + GRAPH_AREA.w;
    x += gridStep
  ) {
    c.beginPath();
    c.moveTo(x, GRAPH_AREA.y);
    c.lineTo(x, GRAPH_AREA.y + GRAPH_AREA.h);
    c.stroke();
  }
  for (
    let y = GRAPH_AREA.y + 0.5;
    y < GRAPH_AREA.y + GRAPH_AREA.h;
    y += gridStep
  ) {
    c.beginPath();
    c.moveTo(GRAPH_AREA.x, y);
    c.lineTo(GRAPH_AREA.x + GRAPH_AREA.w, y);
    c.stroke();
  }
  c.translate(GRAPH_AREA.x + graph.view.x, GRAPH_AREA.y + graph.view.y);
  c.scale(graph.view.zoom, graph.view.zoom);
  const { halfWidth, halfHeight } = GRAPH_NODE;
  for (const [from, to] of graph.edges) {
    const a = graph.nodes.find((n) => n.id === from)!,
      b = graph.nodes.find((n) => n.id === to)!;
    const side = Math.sign(b.x - a.x) * halfWidth;
    const vertical = side ? 0 : Math.sign(b.y - a.y) * halfHeight;
    const start = { x: a.x + side, y: a.y + vertical };
    const end = { x: b.x - side, y: b.y - vertical };
    const midX = (start.x + end.x) / 2;
    c.strokeStyle = b.status === "locked" ? "#3b535d" : "#5ba99e";
    c.lineWidth = 2;
    c.setLineDash(b.status === "locked" ? [7, 7] : []);
    c.beginPath();
    c.moveTo(start.x, start.y);
    c.bezierCurveTo(midX, start.y, midX, end.y, end.x, end.y);
    c.stroke();
    c.setLineDash([]);
    // Small endpoint sockets make each dependency read as a live trace.
    for (const { x, y } of [start, end]) {
      c.beginPath();
      c.arc(x, y, 4, 0, Math.PI * 2);
      c.fillStyle = b.status === "locked" ? "#172932" : "#10252c";
      c.fill();
      c.strokeStyle = b.status === "locked" ? "#536871" : "#78c6b5";
      c.lineWidth = 2;
      c.stroke();
    }
  }
  for (const n of graph.nodes) {
    const nodeLeft = n.x - halfWidth;
    const nodeTop = n.y - halfHeight;
    const nodeWidth = halfWidth * 2;
    const nodeHeight = halfHeight * 2;
    const selected = n.id === graph.selected || focused === `node-${n.id}`;
    c.fillStyle = selected ? "#1d3d49" : "#10252f";
    c.shadowColor = selected
      ? "rgba(101, 203, 190, 0.24)"
      : "rgba(0, 0, 0, 0.28)";
    c.shadowBlur = selected ? 13 : 7;
    c.fillRect(nodeLeft, nodeTop, nodeWidth, nodeHeight);
    c.shadowBlur = 0;
    c.shadowColor = "transparent";
    c.fillStyle = selected ? "#315966" : "#1a3641";
    c.fillRect(nodeLeft, nodeTop, nodeWidth, 5);
    c.strokeStyle = selected
      ? "#e5bd79"
      : n.status === "completed"
        ? "#76d4bc"
        : n.status === "locked"
          ? "#52636d"
          : "#9ddce1";
    c.lineWidth = selected ? 3 : 2;
    c.strokeRect(nodeLeft, nodeTop, nodeWidth, nodeHeight);
    c.strokeStyle = selected ? "rgba(229,189,121,.34)" : "rgba(139,183,187,.2)";
    c.lineWidth = 1;
    c.strokeRect(n.x - 94.5, n.y - 38.5, 189, 77);
    const markerColor =
      n.status === "completed"
        ? "#76d4bc"
        : n.status === "locked"
          ? "#76858b"
          : "#e0bd7c";
    c.beginPath();
    c.arc(n.x + 82, n.y + 30, 5, 0, Math.PI * 2);
    c.fillStyle = markerColor;
    c.fill();
    c.strokeStyle = "#09171f";
    c.lineWidth = 2;
    c.stroke();
    text(n.title, n.x - 88, n.y - 30, 20, 176);
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
    const x = GRAPH_AREA.x + graph.view.x + nodeLeft * graph.view.zoom,
      y = GRAPH_AREA.y + graph.view.y + nodeTop * graph.view.zoom;
    const left = Math.max(x, GRAPH_AREA.x),
      top = Math.max(y, GRAPH_AREA.y),
      right = Math.min(
        x + nodeWidth * graph.view.zoom,
        GRAPH_AREA.x + GRAPH_AREA.w,
      ),
      bottom = Math.min(
        y + nodeHeight * graph.view.zoom,
        GRAPH_AREA.y + GRAPH_AREA.h,
      );
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
  c.fillStyle = "#0d2029";
  c.fillRect(688, GRAPH_AREA.y, 318, GRAPH_AREA.h);
  c.strokeStyle = "#496b74";
  c.lineWidth = 1;
  c.strokeRect(688.5, GRAPH_AREA.y + 0.5, 317, GRAPH_AREA.h - 1);
  const n = graph.nodes.find((n) => n.id === graph.selected)!;
  const brief = surfaceColumn(c, 710, 100, 276, zones);
  const title = brief.text(n.title, 26, foreground, 24);
  c.fillStyle = "#36555d";
  c.fillRect(title.x, title.y + title.h + 12, title.w, 1);
  brief.text(n.status, 20, "#83d5c1", 10);
  brief.text(n.description, 20, foreground, 14);
  for (const id of n.actions) {
    const action = buttons.find((b) => b.id === id);
    if (action) button(brief, action);
  }
  return zones;
}
