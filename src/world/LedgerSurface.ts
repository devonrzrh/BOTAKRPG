import type { SurfaceModel } from "../game/officeUi";
import { surfaceColumn, type SurfaceZone } from "./SurfaceLayout";

export function drawLedgerSurface(
  canvas: CanvasRenderingContext2D,
  model: SurfaceModel,
  focused: string | null,
) {
  const ledger = model.ledger!;
  const zones: SurfaceZone[] = [];
  const ink = "#34332d";
  const button = (column: ReturnType<typeof surfaceColumn>, id: string) => {
    const control = model.buttons.find((b) => b.id === id)!;
    const active = focused === id && !control.disabled;
    column.button(
      control,
      control.label,
      30,
      control.disabled ? "#756b57" : ink,
      (rect) => {
        canvas.fillStyle = active ? "#ddc59c" : "#eee3ca";
        canvas.fillRect(rect.x, rect.y, rect.w, rect.h);
        canvas.strokeStyle = active ? "#9a4f31" : "#667c72";
        canvas.lineWidth = active ? 3 : 1;
        canvas.strokeRect(rect.x, rect.y, rect.w, rect.h);
      },
    );
  };
  for (const [side, x] of [30, 542].entries()) {
    canvas.fillStyle = "#30464a";
    canvas.fillRect(x, 14, 452, 54);
    surfaceColumn(canvas, x + 12, 23, 428, zones).text(
      side === 0 ? "CLUE LEDGER" : "EVIDENCE FILES",
      32,
      "#eee2c6",
    );
    const body = surfaceColumn(canvas, x, 80, 452, zones);
    if (side === 0) body.text(`${ledger.count} recovered clues`, 30, ink, 8);
    else body.space(45.5);
    const clue = ledger.clues[side];
    if (clue) {
      body.text(clue.title, 32, ink, 8);
      body.text(clue.text, 30, ink, 12);
      button(body, "clue-reference-" + clue.id);
    } else if (!side && !ledger.count) {
      body.text(
        "No evidence filed yet. Follow a lead on the quest board.",
        30,
        ink,
      );
    }
  }
  button(surfaceColumn(canvas, 30, 510, 274, zones), "clues-prev");
  surfaceColumn(canvas, 326, 520, 156, zones).text(ledger.pageLabel, 30, ink);
  button(surfaceColumn(canvas, 720, 510, 274, zones), "clues-next");
  return zones;
}
