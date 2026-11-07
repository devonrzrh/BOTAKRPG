import type { Content } from "../content/schema";
import type { Save } from "./state";

/** Evidence follows saved activity completion; it cannot be spent or equipped. */
export function recoveredClues(
  save: Pick<Save, "completed">,
  content: Content,
) {
  return content.entities.flatMap((entity) =>
    entity.type === "activity" &&
    entity.clue &&
    save.completed.includes(entity.id)
      ? [
          {
            id: entity.id,
            title: entity.clue.title,
            text: entity.clue.text,
            lesson: entity.lesson,
            source: entity.title,
          },
        ]
      : [],
  );
}
