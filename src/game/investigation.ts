import type { Content, Quest } from "../content/schema";
import type { Save } from "./state";
export const questComplete = (save: Save, quest: Quest) =>
  quest.objectives.every((id) => save.completed.includes(id));
export const nextObjective = (save: Save, quest: Quest) =>
  quest.objectives.find((id) => !save.completed.includes(id)) ??
  quest.objectives[quest.objectives.length - 1];
export function activityUnlocked(save: Save, id: string, content: Content) {
  if (
    !save.story.caseAccepted ||
    !content.entities.some((e) => e.type === "activity" && e.id === id)
  )
    return false;
  const quest = content.entities.find(
    (e): e is Quest =>
      e.type === "quest" &&
      (e.kind === "branch" || e.kind === "finale") &&
      e.objectives.includes(id),
  );
  return (
    !quest ||
    (questUnlocked(save, quest, content) &&
      quest.objectives
        .slice(0, quest.objectives.indexOf(id))
        .every((previous) => save.completed.includes(previous)))
  );
}
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
