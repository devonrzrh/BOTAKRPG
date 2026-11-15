import type { Content, Entity, Item } from "../content/schema";
import { introduceChapter, practiceChapter } from "./chapterQuest";
import { equipGear } from "./gacha";
import { acknowledgeStory } from "./questStory";
import {
  addXp,
  completeActivity,
  recordAnswer,
  recoverResources,
  type Save,
} from "./state";

export type DebugSaveAction =
  | {
      type:
        | "recover"
        | "all-items"
        | "all-skills"
        | "unlock-all"
        | "complete-all"
        | "all-mastery"
        | "all-dialogue";
    }
  | { type: "tokens" | "xp"; amount: number }
  | { type: "grant-item" | "mastery"; id: string; amount: number }
  | {
      type:
        | "equip-item"
        | "unlock-skill"
        | "unlock-activity"
        | "complete-activity"
        | "practice-chapter"
        | "see-dialogue";
      id: string;
    };

function findEntity<T extends Entity["type"]>(
  content: Content,
  id: string,
  type: T,
) {
  const entity = content.entities.find(
    (entry): entry is Extract<Entity, { type: T }> =>
      entry.id === id && entry.type === type,
  );
  if (!entity) throw new Error(`Unknown ${type}: ${id}`);
  return entity;
}

function quantity(amount: number) {
  if (!Number.isSafeInteger(amount) || amount < 1)
    throw new Error("Enter a positive whole number.");
  return amount;
}

function grantItem(save: Save, item: Item, amount: number): Save {
  const count =
    item.kind === "weapon" || item.kind === "armor"
      ? 1
      : Math.min(
          Number.MAX_SAFE_INTEGER,
          (save.supply.items[item.id] ?? 0) + amount,
        );
  return {
    ...save,
    supply: {
      ...save.supply,
      items: { ...save.supply.items, [item.id]: count },
    },
  };
}

function openStory(save: Save): Save {
  return {
    ...save,
    story: {
      ...save.story,
      prologueSeen: true,
      briefingSeen: true,
      caseAccepted: true,
      networkIntroSeen: true,
    },
  };
}

function activityPrerequisites(content: Content, id: string): string[] {
  const quest = content.entities.find(
    (entry) =>
      entry.type === "quest" &&
      (entry.kind === "branch" || entry.kind === "finale") &&
      entry.objectives.includes(id),
  );
  if (quest?.type !== "quest") return [];
  const required = new Set(
    quest.objectives.slice(0, quest.objectives.indexOf(id)),
  );
  const visited = new Set<string>();
  const visit = (questId: string) => {
    if (visited.has(questId)) return;
    visited.add(questId);
    const prerequisite = findEntity(content, questId, "quest");
    prerequisite.objectives.forEach((activityId) => required.add(activityId));
    prerequisite.prerequisites.forEach(visit);
  };
  quest.prerequisites.forEach(visit);
  return [...required];
}

export function applyDebugSaveAction(
  save: Save,
  content: Content,
  action: DebugSaveAction,
): Save {
  let next = save;
  switch (action.type) {
    case "recover":
      next = recoverResources(save);
      break;
    case "xp":
      next = addXp(
        save,
        Math.min(
          quantity(action.amount),
          Math.max(0, Number.MAX_SAFE_INTEGER - save.character.xp),
        ),
      );
      break;
    case "tokens":
      next = {
        ...save,
        supply: {
          ...save.supply,
          tokens: Math.min(
            Number.MAX_SAFE_INTEGER,
            save.supply.tokens + quantity(action.amount),
          ),
        },
      };
      break;
    case "grant-item":
      next = grantItem(
        save,
        findEntity(content, action.id, "item"),
        quantity(action.amount),
      );
      break;
    case "equip-item": {
      const item = findEntity(content, action.id, "item");
      if (item.kind !== "weapon" && item.kind !== "armor")
        throw new Error("Choose a weapon or armor.");
      next = equipGear(grantItem(save, item, 1), item);
      break;
    }
    case "all-items":
      for (const item of content.entities)
        if (item.type === "item") next = grantItem(next, item, 10);
      break;
    case "unlock-skill":
    case "all-skills": {
      const ids =
        action.type === "unlock-skill"
          ? [findEntity(content, action.id, "skill").id]
          : content.entities
              .filter((entry) => entry.type === "skill")
              .map((entry) => entry.id);
      next = {
        ...save,
        character: {
          ...save.character,
          skills: [...new Set([...save.character.skills, ...ids])],
        },
      };
      break;
    }
    case "mastery":
    case "all-mastery": {
      const limit =
        action.type === "mastery" ? quantity(action.amount) : Infinity;
      if (action.type === "mastery") findEntity(content, action.id, "lesson");
      let added = 0;
      for (const question of content.entities) {
        if (added === limit) break;
        if (
          question.type !== "question" ||
          (action.type === "mastery" && question.lesson !== action.id) ||
          next.mastery[question.lesson]?.answered.includes(question.id)
        )
          continue;
        next = recordAnswer(next, question.lesson, question.id, true, false);
        added++;
      }
      break;
    }
    case "unlock-activity":
    case "complete-activity": {
      const activity = findEntity(content, action.id, "activity");
      const completed = activityPrerequisites(content, activity.id);
      if (action.type === "complete-activity") completed.push(activity.id);
      next = completed.reduce(completeActivity, openStory(save));
      break;
    }
    case "complete-all":
    case "unlock-all": {
      const activities = content.entities.filter(
        (entry) => entry.type === "activity",
      );
      const ids =
        action.type === "complete-all"
          ? activities.map((activity) => activity.id)
          : activities.flatMap((activity) =>
              activityPrerequisites(content, activity.id),
            );
      next = ids.reduce(completeActivity, openStory(save));
      break;
    }
    case "practice-chapter": {
      const chapter = findEntity(content, action.id, "quest");
      if (chapter.kind !== "chapter" || !chapter.learning)
        throw new Error("Choose a chapter with guided practice.");
      if (!save.chapterProgress[chapter.id]?.practiced)
        next = practiceChapter(
          introduceChapter(save, chapter),
          chapter,
          chapter.learning.practice.answer,
        ).save;
      break;
    }
    case "see-dialogue":
      next = acknowledgeStory(save, findEntity(content, action.id, "dialogue"));
      break;
    case "all-dialogue":
      for (const dialogue of content.entities)
        if (dialogue.type === "dialogue")
          next = acknowledgeStory(next, dialogue);
      break;
  }
  return next;
}
