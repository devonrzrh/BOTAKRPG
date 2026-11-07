import { GRAPH_AREA, type QuestGraph } from "../game/questGraph";
import type { SurfaceButton } from "../game/officeUi";

export function drawQuestGraph(
  c: CanvasRenderingContext2D | null,
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
  if (!c) return zones;
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
    const lines: string[] = [];
    for (const paragraph of value.split("\n")) {
      let line = "";
      for (const word of paragraph.split(/\s+/)) {
        const candidate = line ? `${line} ${word}` : word;
        if (line && c.measureText(candidate).width > width) {
          lines.push(line);
          line = word;
        } else line = candidate;
      }
      lines.push(line);
    }
    lines.forEach((line, i) => c.fillText(line, x, y + i * size * 1.25));
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
  c.fillStyle = "#09171f";
  c.fillRect(0, 0, 1024, 576);
  // Quiet instrument-panel grain and frame, kept behind the graph controls.
  c.strokeStyle = "rgba(104, 166, 174, 0.12)";
  c.lineWidth = 1;
  c.strokeRect(8.5, 8.5, 1007, 559);
  text(graph.title ?? "Quest map", 24, 27, 28, graph.title ? 220 : 340);
  for (const b of buttons.filter((b) => b.id.startsWith("graph-"))) button(b);
  c.save();
  c.beginPath();
  c.rect(GRAPH_AREA.x, GRAPH_AREA.y, GRAPH_AREA.w, GRAPH_AREA.h);
  c.clip();
  c.fillStyle = "#0c1c25";
  c.fillRect(GRAPH_AREA.x, GRAPH_AREA.y, GRAPH_AREA.w, GRAPH_AREA.h);
  c.save();
  c.beginPath();
  c.rect(GRAPH_AREA.x, GRAPH_AREA.y, GRAPH_AREA.w, GRAPH_AREA.h);
  c.clip();
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
  c.restore();
  c.translate(GRAPH_AREA.x + graph.view.x, GRAPH_AREA.y + graph.view.y);
  c.scale(graph.view.zoom, graph.view.zoom);
  for (const [from, to] of graph.edges) {
    const a = graph.nodes.find((n) => n.id === from)!,
      b = graph.nodes.find((n) => n.id === to)!;
    c.strokeStyle = b.status === "locked" ? "#3b535d" : "#5ba99e";
    c.lineWidth = 2;
    c.setLineDash(b.status === "locked" ? [7, 7] : []);
    c.beginPath();
    c.moveTo(a.x + 100, a.y);
    c.bezierCurveTo((a.x + b.x) / 2, a.y, (a.x + b.x) / 2, b.y, b.x - 100, b.y);
    c.stroke();
    c.setLineDash([]);
    // Small endpoint sockets make each dependency read as a live trace.
    for (const [sx, sy] of [
      [a.x + 100, a.y],
      [b.x - 100, b.y],
    ]) {
      c.beginPath();
      c.arc(sx, sy, 4, 0, Math.PI * 2);
      c.fillStyle = b.status === "locked" ? "#172932" : "#10252c";
      c.fill();
      c.strokeStyle = b.status === "locked" ? "#536871" : "#78c6b5";
      c.lineWidth = 2;
      c.stroke();
    }
  }
  for (const n of graph.nodes) {
    const selected = n.id === graph.selected || focused === `node-${n.id}`;
    c.fillStyle = selected ? "#1d3d49" : "#10252f";
    c.shadowColor = selected
      ? "rgba(101, 203, 190, 0.24)"
      : "rgba(0, 0, 0, 0.28)";
    c.shadowBlur = selected ? 13 : 7;
    c.fillRect(n.x - 100, n.y - 44, 200, 88);
    c.shadowBlur = 0;
    c.shadowColor = "transparent";
    c.fillStyle = selected ? "#315966" : "#1a3641";
    c.fillRect(n.x - 100, n.y - 44, 200, 5);
    c.strokeStyle = selected
      ? "#e5bd79"
      : n.status === "completed"
        ? "#76d4bc"
        : n.status === "locked"
          ? "#52636d"
          : "#9ddce1";
    c.lineWidth = selected ? 3 : 2;
    c.strokeRect(n.x - 100, n.y - 44, 200, 88);
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
    c.arc(n.x + 82, n.y - 26, 5, 0, Math.PI * 2);
    c.fillStyle = markerColor;
    c.fill();
    c.strokeStyle = "#09171f";
    c.lineWidth = 2;
    c.stroke();
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
  c.fillStyle = "#0d2029";
  c.fillRect(688, 80, 318, 445);
  c.strokeStyle = "#496b74";
  c.lineWidth = 1;
  c.strokeRect(688.5, 80.5, 317, 444);
  c.fillStyle = "#203c45";
  c.fillRect(689, 81, 4, 443);
  const n = graph.nodes.find((n) => n.id === graph.selected)!;
  text(n.title, 710, 100, 26, 275);
  c.fillStyle = "#36555d";
  c.fillRect(710, 151, 274, 1);
  c.fillStyle = "#8ea7a9";
  c.fillRect(710, 172, 4, 15);
  text(n.status, 710, 175, 20, 275, "#83d5c1");
  text(n.description, 710, 210, 20, 275);
  n.actions
    .map((id) => buttons.find((b) => b.id === id))
    .filter((b): b is SurfaceButton => !!b)
    .forEach((b, i) => button(b, 710, 350 + i * 54, 276, 46));
  text("Drag to pan · Scroll to zoom", 24, 545, 18, 650, "#a9c6cc");
  return zones;
}
