import type { Content, Dialogue, Quest } from "../content/schema";
import type { Save } from "./state";
export const storyBranch = (content: Content, activity: string) =>
  content.entities.find(
    (e): e is Quest =>
      e.type === "quest" &&
      e.kind === "branch" &&
      e.objectives.includes(activity),
  );

export function activityStory(
  content: Content,
  activity: string,
  when: "before" | "after",
) {
  return content.entities.find(
    (e): e is Dialogue =>
      e.type === "dialogue" &&
      e.trigger?.activity === activity &&
      e.trigger.when === when,
  );
}
export function pendingStory(
  save: Save,
  content: Content,
  activity: string,
  when: "before" | "after",
) {
  const story = activityStory(content, activity, when);
  return story &&
    !save.story.seenDialogues.includes(story.id) &&
    (when !== "after" || save.completed.includes(activity))
    ? story
    : undefined;
}
export function acknowledgeStory(save: Save, dialogue: Dialogue): Save {
  return save.story.seenDialogues.includes(dialogue.id)
    ? save
    : {
        ...save,
        story: {
          ...save.story,
          seenDialogues: [...save.story.seenDialogues, dialogue.id],
        },
      };
}
