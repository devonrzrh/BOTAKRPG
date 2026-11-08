import type { Activity, Content, Quest } from "../content/schema";
import { claimQuest, completeActivity, evidence, type Save } from "./state";

export function rewardPuzzle(
  save: Save,
  activity: Activity,
  content: Content,
  assisted: boolean,
): Save {
  if (activity.template !== "puzzle") return save;
  let next = completeActivity(save, activity.id);
  if (!assisted)
    next = evidence(next, activity.lesson, `puzzle-${activity.id}`);
  for (const quest of content.entities.filter(
    (entity): entity is Quest =>
      entity.type === "quest" &&
      entity.kind === "case" &&
      entity.objectives.includes(activity.id),
  ))
    next = claimQuest(next, quest, content);
  return next;
}
