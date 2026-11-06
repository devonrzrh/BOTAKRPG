import type { Content, Quest, Lesson, Skill, Item } from "../content/schema";
import { finaleAvailable, questComplete } from "./investigation";
import { stats, type Save } from "./state";
import type { HomeWall } from "../world/Office";

export type OfficeAction = {
  kind:
    | "open"
    | "lesson"
    | "claim"
    | "equip"
    | "learn"
    | "bookmark"
    | "page"
    | "search"
    | "topic"
    | "note"
    | "save-note"
    | "cancel-note"
    | "close-book";
  // Book interaction is kept separate from travelling to the shelf.
  id: string;
};
export interface SurfaceButton {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  label: string;
  action: OfficeAction;
  disabled?: boolean;
}
export interface SurfaceText {
  x: number;
  y: number;
  text: string;
  size?: number;
  maxWidth?: number;
  color?: string;
  bold?: boolean;
}
export interface SurfaceModel {
  books?: { id: string; title: string; topic: string }[];
  bookOpen?: boolean;
  selectedLesson?: string;
  id: HomeWall;
  title: string;
  theme: "cork" | "paper" | "terminal";
  texts: SurfaceText[];
  buttons: SurfaceButton[];
}
export interface OfficeUiInput {
  bookOpen?: boolean;
  save: Save;
  content: Content;
  lessonId: string;
  page: number;
  search: string;
  topic: string;
  noteEditing: string | null;
  noteDraft: string;
}
export const SURFACE_WIDTH = 1024,
  SURFACE_HEIGHT = 576;
export function hitControl(buttons: SurfaceButton[], x: number, y: number) {
  return buttons.find(
    (b) =>
      !b.disabled && x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h,
  );
}
export function plainLesson(body: string) {
  let code = false;
  return body
    .split("\n")
    .map((line, index) => {
      if (/^\s*```/.test(line)) {
        code = !code;
        return "";
      }
      if (code) return line;
      if (index === 0 && /^#\s/.test(line)) return "";
      return line
        .replace(/^#{1,6}\s+/, "")
        .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
        .replace(/\*\*([^*\n]+)\*\*/g, "$1")
        .replace(/`/g, "");
    })
    .join("\n");
}
// Fixed-width wrapping makes page lengths deterministic for the typewriter face.
export function wrapLines(text: string, columns = 62): string[] {
  return text.split("\n").flatMap((line) => {
    if (!line) return [""];
    const result: string[] = [];
    let rest = line;
    while (rest.length > columns) {
      let at = rest.lastIndexOf(" ", columns);
      if (at < columns / 3) at = columns;
      result.push(rest.slice(0, at));
      rest = rest.slice(at).trimStart();
    }
    result.push(rest);
    return result;
  });
}
export function createOfficeUi(input: OfficeUiInput): SurfaceModel[] {
  const { save, content } = input;
  const lessons = content.entities.filter(
    (e): e is Lesson => e.type === "lesson",
  );
  const branches = content.entities.filter(
    (e): e is Quest => e.type === "quest" && e.kind === "branch",
  );
  const main = content.entities.find(
    (e): e is Quest => e.type === "quest" && e.kind === "case",
  )!;
  const finale = content.entities.find(
    (e): e is Quest => e.type === "quest" && e.kind === "finale",
  )!;
  const completed = branches.filter((q) => questComplete(save, q)).length;
  const closed = questComplete(save, finale);
  const panel = (
    id: HomeWall,
    title: string,
    theme: SurfaceModel["theme"],
  ): SurfaceModel => ({ id, title, theme, texts: [], buttons: [] });
  const text = (
    m: SurfaceModel,
    x: number,
    y: number,
    value: string,
    size = 20,
    maxWidth = 950,
  ) => m.texts.push({ x, y, text: value, size, maxWidth });
  const button = (
    m: SurfaceModel,
    id: string,
    x: number,
    y: number,
    w: number,
    h: number,
    label: string,
    kind: OfficeAction["kind"],
    target: string,
    disabled = false,
  ) =>
    m.buttons.push({
      id,
      x,
      y,
      w,
      h,
      label,
      action: { kind, id: target },
      disabled,
    });
  const investigation = panel("investigation", "CASE 007 / ECHO-7", "cork");
  text(investigation, 48, 100, "ECHO-7", 34);
  text(
    investigation,
    48,
    150,
    "ROGUE UNIT / " + (closed ? "CONTAINED" : "MISSING"),
    18,
  );
  text(investigation, 48, 195, "Last seen:\ntransit terminal", 20, 280);
  text(
    investigation,
    48,
    285,
    `${completed} / ${branches.length} clues recovered`,
    20,
  );
  text(
    investigation,
    48,
    335,
    closed
      ? "CASE CLOSED"
      : save.story.caseAccepted
        ? "INVESTIGATION ACTIVE"
        : "CASE UNASSIGNED",
    17,
  );
  button(
    investigation,
    "briefing",
    48,
    402,
    300,
    58,
    "Case briefing",
    "open",
    "briefing",
  );
  button(
    investigation,
    "quests",
    408,
    105,
    550,
    74,
    "Quest board",
    "open",
    "quest",
  );
  button(
    investigation,
    "books",
    408,
    207,
    550,
    74,
    "Bookshelf / materials",
    "open",
    "library",
  );
  button(
    investigation,
    "inventory",
    408,
    309,
    550,
    74,
    "Inventory desk",
    "open",
    "inventory",
  );
  button(
    investigation,
    "online",
    408,
    411,
    550,
    74,
    closed
      ? "Replay ECHO-7"
      : finaleAvailable(save, content)
        ? "Confront ECHO-7"
        : "Go online",
    "open",
    finaleAvailable(save, content) ? "echo" : "network",
  );

  const library = panel("bookshelf", "REFERENCE LIBRARY", "paper");
  button(
    library,
    "search",
    24,
    75,
    245,
    44,
    `Search: ${input.search || "all lessons"}`,
    "search",
    "",
  );
  const topics = ["all", "algorithms", "structures", "ai"];
  button(
    library,
    "topic",
    24,
    127,
    245,
    40,
    `Topic: ${input.topic}`,
    "topic",
    topics[(topics.indexOf(input.topic) + 1) % topics.length],
  );
  const visible = lessons.filter(
    (l) =>
      (input.topic === "all" || l.topic === input.topic) &&
      `${l.title} ${l.summary} ${l.body}`
        .toLowerCase()
        .includes(input.search.toLowerCase()),
  );
  visible
    .slice(0, 5)
    .forEach((lesson, index) =>
      button(
        library,
        `lesson-${lesson.id}`,
        24,
        187 + index * 58,
        245,
        50,
        lesson.title,
        "lesson",
        lesson.id,
      ),
    );
  if (!visible.length) text(library, 30, 205, "No matching lessons.", 16, 225);
  const lesson = lessons.find((l) => l.id === input.lessonId) ?? lessons[0];
  if (input.noteEditing) {
    text(library, 303, 82, "NOTES / " + lesson.title, 21, 685);
    wrapLines(input.noteDraft || "Type your notes…", 62)
      .slice(-17)
      .forEach((line, index) =>
        text(
          library,
          303,
          130 + index * 20,
          line +
            (index ===
            Math.min(
              wrapLines(input.noteDraft || "Type your notes…", 62).length - 1,
              16,
            )
              ? " │"
              : ""),
          17,
          685,
        ),
      );
    button(
      library,
      "save-note",
      303,
      468,
      325,
      40,
      "Save note",
      "save-note",
      lesson.id,
    );
    button(
      library,
      "cancel-note",
      644,
      468,
      325,
      40,
      "Cancel",
      "cancel-note",
      lesson.id,
    );
  } else {
    const lines = wrapLines(plainLesson(lesson.body), 65);
    const linesPerPage = lesson.prerequisites.length ? 16 : 17;
    const pages = Math.max(1, Math.ceil(lines.length / linesPerPage));
    const page = Math.max(0, Math.min(input.page, pages - 1));
    text(library, 303, 82, lesson.title, 23, 685);
    if (lesson.prerequisites.length) {
      const prerequisite = lessons.find(
        (l) => l.id === lesson.prerequisites[0],
      )!;
      button(
        library,
        "prerequisite",
        303,
        112,
        667,
        28,
        `Builds on: ${prerequisite.title}`,
        "lesson",
        prerequisite.id,
      );
    }
    lines
      .slice(page * linesPerPage, (page + 1) * linesPerPage)
      .forEach((line, index) =>
        text(
          library,
          303,
          (lesson.prerequisites.length ? 150 : 130) + index * 19,
          line,
          17,
          685,
        ),
      );
    button(
      library,
      "previous-page",
      303,
      462,
      145,
      42,
      "Previous",
      "page",
      String(page - 1),
      page === 0,
    );
    text(library, 478, 470, `${page + 1} / ${pages}`, 17, 90);
    button(
      library,
      "next-page",
      570,
      462,
      145,
      42,
      "Next",
      "page",
      String(page + 1),
      page === pages - 1,
    );
    button(
      library,
      "bookmark",
      730,
      462,
      110,
      42,
      save.bookmarks.includes(lesson.id) ? "Saved" : "Bookmark",
      "bookmark",
      lesson.id,
    );
    button(library, "notes", 850, 462, 120, 42, "Notes", "note", lesson.id);
  }

  const quests = panel(
    "quests",
    "QUEST BOARD / " + (closed ? "CASE CLOSED" : "CASE 007"),
    "cork",
  );
  if (!save.story.caseAccepted)
    button(
      quests,
      "accept-case",
      720,
      14,
      275,
      38,
      "Accept case",
      "open",
      "briefing",
    );
  branches.forEach((branch, index) => {
    const x = 28 + index * 330,
      done = questComplete(save, branch);
    text(
      quests,
      x + 12,
      85,
      `BRANCH ${index + 1} / ${done ? "CLUE FOUND" : "OPEN"}`,
      16,
      295,
    );
    text(quests, x + 12, 122, branch.title, 21, 295);
    const activity = content.entities.find(
      (e) => e.type === "activity" && e.id === branch.objectives[0],
    );
    const description =
      done && activity?.type === "activity" && activity.clue
        ? activity.clue.text
        : branch.description;
    wrapLines(description, 27)
      .slice(0, 4)
      .forEach((line, n) => text(quests, x + 12, 169 + n * 23, line, 17, 295));
    const destination = (
      {
        "maze-chamber": "maze",
        "guardian-battle": "battle",
        "perceptron-exhibit": "garden",
      } as Record<string, string>
    )[branch.objectives[0]];
    button(
      quests,
      `branch-${branch.id}`,
      x,
      278,
      310,
      44,
      done ? "Replay activity" : "Pursue lead",
      "open",
      destination,
      !save.story.caseAccepted,
    );
    button(
      quests,
      `material-${branch.id}`,
      x,
      332,
      310,
      44,
      "Materials / tutorial",
      "lesson",
      branch.lesson!,
    );
    button(
      quests,
      `claim-${branch.id}`,
      x,
      386,
      310,
      44,
      save.claimed.includes(branch.id)
        ? "Reward claimed"
        : `Claim ${branch.xp} XP + item`,
      "claim",
      branch.id,
      !done || save.claimed.includes(branch.id),
    );
  });
  button(
    quests,
    "claim-case",
    28,
    449,
    380,
    45,
    save.claimed.includes(main.id)
      ? "Clue reward claimed"
      : `Claim ${main.xp} XP + equipment`,
    "claim",
    main.id,
    !questComplete(save, main) || save.claimed.includes(main.id),
  );
  button(
    quests,
    "finale",
    428,
    449,
    360,
    45,
    closed ? "Replay ECHO-7" : `Confront ECHO-7 (${completed}/3)`,
    "open",
    "echo",
    !finaleAvailable(save, content),
  );
  button(
    quests,
    "finale-reward",
    806,
    449,
    190,
    45,
    save.claimed.includes(finale.id) ? "Case closed" : "Case reward",
    "claim",
    finale.id,
    !closed || save.claimed.includes(finale.id),
  );

  const inventory = panel("desk", "FIELD EQUIPMENT", "paper");
  const character = stats(save, content);
  text(
    inventory,
    30,
    82,
    `${save.character.name} / LEVEL ${save.character.level}`,
    24,
  );
  text(
    inventory,
    30,
    124,
    `HP ${save.character.hp}/${character.maxHp}  FOCUS ${save.character.focus}/${character.maxFocus}`,
    25,
  );
  text(
    inventory,
    30,
    163,
    `ATK ${character.attack}  DEF ${character.defense}`,
    25,
    430,
  );
  const items = content.entities.filter((e): e is Item => e.type === "item");
  items.forEach((item, index) => {
    text(
      inventory,
      30,
      220 + index * 85,
      `${item.title} ×${save.inventory[item.id] ?? 0}`,
      26,
      420,
    );
    if (item.kind === "equipment")
      button(
        inventory,
        `equip-${item.id}`,
        30,
        255 + index * 85,
        420,
        44,
        save.character.equipment === item.id
          ? "Unequip module"
          : "Equip module",
        "equip",
        item.id,
        !save.inventory[item.id],
      );
    else
      text(
        inventory,
        30,
        255 + index * 85,
        `+${item.amount} ${item.kind === "healing" ? "HP" : "focus"} / in battle`,
        24,
        420,
      );
  });
  content.entities
    .filter((e): e is Skill => e.type === "skill")
    .forEach((skill, index) => {
      const learned = save.character.skills.includes(skill.id),
        locked =
          save.character.level < skill.level ||
          Boolean(
            skill.parent && !save.character.skills.includes(skill.parent),
          );
      button(
        inventory,
        `learn-${skill.id}`,
        515,
        185 + index * 75,
        480,
        54,
        `${skill.title} / ${learned ? "learned" : `level ${skill.level}`}`,
        "learn",
        skill.id,
        learned || locked,
      );
    });
  library.books = lessons.map((l) => ({
    id: l.id,
    title: l.title,
    topic: l.topic,
  }));
  library.bookOpen = input.bookOpen;
  library.selectedLesson = lesson.id;
  if (input.bookOpen === false) {
    library.title = "REFERENCE BOOKSHELF";
    library.texts = [{ x: 30, y: 85, text: "Select a volume to open it." }];
    library.buttons = library.buttons.filter(
      (b) =>
        b.id.startsWith("lesson-") || b.id === "search" || b.id === "topic",
    );
  }
  if (input.bookOpen === true) {
    library.title = lesson.title;
    library.texts = [];
    library.buttons = [];
    text(
      library,
      35,
      78,
      input.noteEditing ? "Personal notes" : lesson.topic.toUpperCase(),
      20,
      445,
    );
    const prerequisites = lesson.prerequisites
      .map((id) => lessons.find((l) => l.id === id)?.title ?? id)
      .join(", ");
    const lines = wrapLines(
      input.noteEditing
        ? input.noteDraft + " │"
        : (prerequisites ? `Read first: ${prerequisites}\n\n` : "") +
            plainLesson(lesson.body),
      34,
    );
    const pages = Math.max(1, Math.ceil(lines.length / 28)),
      page = Math.max(0, Math.min(input.page, pages - 1));
    lines
      .slice(page * 28, (page + 1) * 28)
      .forEach((line, i) =>
        text(library, i < 14 ? 35 : 548, 125 + (i % 14) * 23, line, 20, 440),
      );
    if (input.noteEditing) {
      button(
        library,
        "save-note",
        35,
        476,
        410,
        40,
        "Save notes / Ctrl+Enter",
        "save-note",
        lesson.id,
      );
      button(
        library,
        "cancel-note",
        548,
        476,
        410,
        40,
        "Cancel notes",
        "cancel-note",
        lesson.id,
      );
    } else {
      button(
        library,
        "previous-page",
        35,
        476,
        170,
        40,
        "Previous",
        "page",
        String(page - 1),
        page === 0,
      );
      text(library, 245, 484, String(page * 2 + 1), 17, 80);
      text(library, 725, 484, String(page * 2 + 2), 17, 80);
      button(
        library,
        "next-page",
        805,
        476,
        170,
        40,
        "Next",
        "page",
        String(page + 1),
        page === pages - 1,
      );
      button(
        library,
        "bookmark",
        35,
        530,
        200,
        32,
        save.bookmarks.includes(lesson.id) ? "Bookmarked" : "Bookmark",
        "bookmark",
        lesson.id,
      );
      button(
        library,
        "notes",
        795,
        530,
        180,
        32,
        "Write notes",
        "note",
        lesson.id,
      );
    }
    button(
      library,
      "close-book",
      795,
      20,
      180,
      34,
      "Close book",
      "close-book",
      "",
    );
  }
  return [investigation, library, quests, inventory];
}
