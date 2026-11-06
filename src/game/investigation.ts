import type { Content, Quest } from "../content/schema";
import type { Save } from "./state";
export const questComplete = (save: Save, quest: Quest) =>
  quest.objectives.every((id) => save.completed.includes(id));
export function questUnlocked(
  save: Save,
  quest: Quest,
  content: Content,
): boolean {
  return quest.prerequisites.every((id) => {
    const prerequisite = content.entities.find(
      (e): e is Quest => e.type === "quest" && e.id === id,
    );
    return Boolean(
      prerequisite &&
      questComplete(save, prerequisite) &&
      questUnlocked(save, prerequisite, content),
    );
  });
}
export function finaleAvailable(save: Save, content: Content) {
  const finale = content.entities.find(
    (e): e is Quest => e.type === "quest" && e.kind === "finale",
  );
  return Boolean(
    save.story.caseAccepted && finale && questUnlocked(save, finale, content),
  );
}
