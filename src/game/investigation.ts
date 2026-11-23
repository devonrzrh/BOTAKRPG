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
    save.story.caseAccepted &&
    finale &&
    ((save.story.legacyFinale && save.completed.includes("echo-battle")) ||
      questUnlocked(save, finale, content)),
  );
}

export type InvestigationProgress = { percent: number; stage: string };

export function investigationProgress(
  save: Save,
  content: Content,
): InvestigationProgress {
  const quests = content.entities.filter((entity) => entity.type === "quest");
  const finale = quests.find((quest) => quest.kind === "finale");
  const cleared = new Set(save.completed);
  if (
    finale &&
    (questComplete(save, finale) ||
      (save.story.legacyFinale && cleared.has("echo-battle")))
  ) {
    return { percent: 100, stage: "Case closed" };
  }

  const objectives = new Set<string>();
  const visited = new Set<string>();
  const addRequired = (quest: Quest) => {
    if (visited.has(quest.id)) return;
    visited.add(quest.id);
    quest.objectives.forEach((id) => objectives.add(id));
    for (const id of quest.prerequisites) {
      const prerequisite = quests.find((candidate) => candidate.id === id);
      if (prerequisite) addRequired(prerequisite);
    }
  };
  if (finale) addRequired(finale);

  const opening = [
    save.story.prologueSeen,
    save.story.caseAccepted,
    save.story.networkIntroSeen,
  ];
  const done =
    opening.filter(Boolean).length +
    [...objectives].filter((id) => cleared.has(id)).length;
  const percent = Math.min(
    99,
    Math.floor((done / (opening.length + objectives.size)) * 100),
  );
  const stage = !save.story.caseAccepted
    ? "Awaiting briefing"
    : finale && finaleAvailable(save, content)
      ? cleared.has("evidence-chain")
        ? "Confront ECHO-7"
        : "Reconstruct evidence"
      : save.story.networkIntroSeen
        ? "Following leads"
        : "Connect to gateway";
  return { percent, stage };
}
