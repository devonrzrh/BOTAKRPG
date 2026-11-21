import type { SurfaceButton } from "../game/officeUi";

export interface SurfaceRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface SurfaceZone extends SurfaceRect {
  control: SurfaceButton;
}

export function hitSurfaceZone(zones: SurfaceZone[], x: number, y: number) {
  return zones.find(
    (z) =>
      !z.control.disabled &&
      x >= z.x &&
      x <= z.x + z.w &&
      y >= z.y &&
      y <= z.y + z.h,
  )?.control;
}

export function measureSurfaceText(
  canvas: CanvasRenderingContext2D,
  value: string,
  width: number,
  size: number,
  lineHeight = 1.25,
  aspect = 1,
) {
  const font = `${size}px Consolas, monospace`;
  canvas.font = font;
  const lines = value.split("\n").flatMap((paragraph) => {
    const wrapped: string[] = [];
    let line = "";
    for (const word of paragraph.trim().split(/\s+/)) {
      const candidate = line ? `${line} ${word}` : word;
      if (canvas.measureText(candidate).width <= width) {
        line = candidate;
        continue;
      }
      if (line) wrapped.push(line);
      line = "";
      for (const character of word) {
        if (line && canvas.measureText(line + character).width > width) {
          wrapped.push(line);
          line = "";
        }
        line += character;
      }
    }
    return [...wrapped, line];
  });
  const advance = size * lineHeight;
  return {
    height: lines.length * advance * aspect,
    draw(x: number, y: number, color: string) {
      canvas.save();
      canvas.font = font;
      canvas.textBaseline = "top";
      canvas.fillStyle = color;
      canvas.translate(x, y);
      canvas.scale(1, aspect);
      lines.forEach((line, index) => canvas.fillText(line, 0, index * advance));
      canvas.restore();
    },
  };
}

/** Stack measured content in logical texture units. Use the returned zones for picking. */
export function surfaceColumn(
  canvas: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  zones: SurfaceZone[],
) {
  const place = (height: number, gap: number) => {
    const rect = { x, y, w: width, h: height };
    y += height + gap;
    return rect;
  };
  return {
    space: (height: number) => {
      y += height;
    },
    text(value: string, size: number, color: string, gap = 0) {
      const measured = measureSurfaceText(canvas, value, width, size);
      const rect = place(measured.height, gap);
      measured.draw(rect.x, rect.y, color);
      return rect;
    },
    button(
      control: SurfaceButton,
      label: string,
      size: number,
      color: string,
      frame: (rect: SurfaceRect) => void,
      gap = 0,
    ) {
      const labelText = measureSurfaceText(canvas, label, width - 20, size);
      const rect = place(labelText.height + 20, gap);
      frame(rect);
      labelText.draw(rect.x + 10, rect.y + 10, color);
      zones.push({ ...rect, control });
      return rect;
    },
  };
}
