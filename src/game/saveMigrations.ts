import type { Content, Quest } from "../content/schema";
import type { Save } from "./state";

export const CURRENT_SAVE_VERSION = 2;

/** Each breaking release adds one step; future formats must never be downgraded. */
export function migrateSaveInput(input: unknown): {
  input: unknown;
  fromVersion: number;
} {
  if (!input || typeof input !== "object" || Array.isArray(input))
    return { input, fromVersion: CURRENT_SAVE_VERSION };
  let data = input as Record<string, unknown>;
  const fromVersion = typeof data.version === "number" ? data.version : 0;
  if (
    !Number.isInteger(fromVersion) ||
    fromVersion < 1 ||
    fromVersion > CURRENT_SAVE_VERSION
  )
    throw new Error(
      "Unsupported journal version. Keep the original file for a compatible release.",
    );
  const steps: Record<
    number,
    (value: Record<string, unknown>) => Record<string, unknown>
  > = {
    1: (value) => ({ ...value, version: 2 }),
  };
  for (let version = fromVersion; version < CURRENT_SAVE_VERSION; version++) {
    const upgrade = steps[version];
    if (!upgrade)
      throw new Error(`Missing journal migration from version ${version}.`);
    data = upgrade(data);
  }
  return { input: data, fromVersion };
}

/** Only grandfather evidence gates already passed in the battle-only campaign. */
export function upgradeCampaignProgress(
  save: Save,
  content: Content,
  fromVersion: number,
): Save {
  if (fromVersion >= 2) return save;
  const completed = new Set(save.completed);
  const claimed = new Set(save.claimed);
  for (const branch of content.entities.filter(
    (e): e is Quest => e.type === "quest" && e.kind === "branch",
  )) {
    branch.objectives.forEach((id, index) => {
      const activity = content.entities.find((e) => e.id === id);
      if (
        activity?.type !== "activity" ||
        activity.template !== "puzzle" ||
        completed.has(id)
      )
        return;
      if (
        !branch.objectives
          .slice(index + 1)
          .some(
            (later) =>
              save.completed.includes(later) &&
              content.entities.some(
                (e) =>
                  e.id === later &&
                  e.type === "activity" &&
                  e.template !== "puzzle",
              ),
          )
      )
        return;
      completed.add(id);
      // The legacy encounter already paid its reward; inherited gates pay nothing twice.
      for (const quest of content.entities)
        if (
          quest.type === "quest" &&
          quest.kind === "case" &&
          quest.objectives.includes(id)
        )
          claimed.add(quest.id);
    });
  }
  return { ...save, completed: [...completed], claimed: [...claimed] };
}
