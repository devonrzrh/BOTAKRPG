import type { Content, Quest, Lesson } from "../content/schema";
import { finaleAvailable, questComplete, nextObjective } from "./investigation";
import type { Save } from "./state";
import { recoveredClues } from "./evidence";
import { pendingStory } from "./questStory";
import { chaptersForBranch } from "./chapterQuest";
import type { HomeWall } from "../world/Office";
import {
  createQuestGraph,
  graphButtons,
  type QuestGraph,
  type GraphView,
} from "./questGraph";

export type OfficeAction = {
  kind:
    | "open"
    | "lesson"
    | "claim"
    | "learn"
    | "bookmark"
    | "page"
    | "search"
    | "topic"
    | "note"
    | "save-note"
    | "cancel-note"
    | "close-book"
    | "graph-select"
    | "graph-view";
  // Book interaction is kept separate from travelling to the shelf.
  id: string;
  view?: GraphView;
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
  graph?: QuestGraph;
  books?: { id: string; title: string; topic: string }[];
  bookOpen?: boolean;
  selectedLesson?: string;
  selectedTopic?: string;
  id: HomeWall;
  title: string;
  theme: "cork" | "paper" | "terminal";
  texts: SurfaceText[];
  buttons: SurfaceButton[];
}
export interface OfficeUiInput {
  questSelection?: string;
  questView?: GraphView;
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
    "Clue ledger",
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
    .slice(0, input.search ? 5 : 3)
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
      (e) => e.type === "activity" && e.id === nextObjective(save, branch),
    );
    const description =
      done && activity?.type === "activity" && activity.clue
        ? activity.clue.text
        : branch.description;
    wrapLines(description, 27)
      .slice(0, 4)
      .forEach((line, n) => text(quests, x + 12, 169 + n * 23, line, 17, 295));
    const destination =
      (
        {
          "maze-chamber": "maze",
          "guardian-battle": "battle",
          "perceptron-exhibit": "garden",
        } as Record<string, string>
      )[nextObjective(save, branch)] ?? nextObjective(save, branch);
    const chapters = chaptersForBranch(content, branch.id),
      current = chapters.find((c) => !questComplete(save, c)) ?? chapters[0];
    if (current)
      button(
        quests,
        `chapters-${branch.id}`,
        x,
        224,
        310,
        44,
        "Chapter quests",
        "graph-select",
        current.id,
      );
    button(
      quests,
      `intro-start-${branch.id}`,
      x,
      278,
      310,
      44,
      "Begin orientation",
      "open",
      (
        {
          "maze-chamber": "maze",
          "guardian-battle": "battle",
          "perceptron-exhibit": "garden",
        } as Record<string, string>
      )[branch.objectives[0]] ?? branch.objectives[0],
      !save.story.caseAccepted,
    );
    const last = branch.objectives.at(-1)!;
    button(
      quests,
      `boss-start-${branch.id}`,
      x,
      278,
      310,
      44,
      pendingStory(save, content, last, "after")
        ? "Read conclusion"
        : "Enter boss encounter",
      "open",
      last,
      !save.story.caseAccepted ||
        !branch.objectives
          .slice(0, -1)
          .every((id) => save.completed.includes(id)),
    );
    button(
      quests,
      `branch-${branch.id}`,
      x,
      278,
      310,
      44,
      done
        ? pendingStory(save, content, branch.objectives.at(-1)!, "after")
          ? "Read conclusion"
          : "Replay activity"
        : "Pursue lead",
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
      activity?.type === "activity" ? activity.lesson : branch.lesson!,
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
        : `Claim ${branch.xp} XP`,
      "claim",
      branch.id,
      !done || save.claimed.includes(branch.id),
    );
  });
  for (const chapter of content.entities.filter(
    (e): e is Quest => e.type === "quest" && e.kind === "chapter",
  )) {
    button(
      quests,
      `study-${chapter.id}`,
      28,
      278,
      310,
      44,
      "Study chapter",
      "open",
      chapter.id,
    );
    button(
      quests,
      `chapter-book-${chapter.id}`,
      28,
      332,
      310,
      44,
      "Reference book",
      "lesson",
      chapter.lesson!,
    );
  }
  button(
    quests,
    "claim-case",
    28,
    449,
    380,
    45,
    save.claimed.includes(main.id)
      ? "Clue reward claimed"
      : `Claim ${main.xp} XP`,
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

  const inventory = panel("desk", "CLUE LEDGER", "paper");
  const clues = recoveredClues(save, content);
  const cluePages = Math.max(1, Math.ceil(clues.length / 2));
  const cluePage = Math.min(input.page, cluePages - 1);
  text(inventory, 30, 85, String(clues.length) + " recovered clues", 26);
  if (!clues.length)
    text(
      inventory,
      30,
      150,
      "No evidence filed yet. Follow a lead on the quest board.",
      26,
      900,
    );
  clues.slice(cluePage * 2, cluePage * 2 + 2).forEach((clue, index) => {
    const x = index === 0 ? 30 : 550;
    text(inventory, x, 140, clue.title, 30, 430);
    wrapLines(clue.text, 23).forEach((line, i) =>
      text(inventory, x, 245 + i * 38, line, 30, 430),
    );
    button(
      inventory,
      "clue-reference-" + clue.id,
      x,
      425,
      430,
      48,
      "Open reference",
      "lesson",
      clue.lesson,
    );
  });
  text(inventory, 415, 525, String(cluePage + 1) + " / " + cluePages, 25, 180);
  button(
    inventory,
    "clues-prev",
    30,
    496,
    270,
    48,
    "Previous clues",
    "page",
    String(cluePage - 1),
    cluePage === 0,
  );
  button(
    inventory,
    "clues-next",
    720,
    496,
    275,
    48,
    "Next clues",
    "page",
    String(cluePage + 1),
    cluePage >= cluePages - 1,
  );
  library.books = lessons.slice(0, 3).map((l) => ({
    id: l.id,
    title: l.title,
    topic: l.topic,
  }));
  library.bookOpen = input.bookOpen;
  library.selectedLesson = lesson.id;
  library.selectedTopic = lesson.topic;
  if (input.bookOpen === false) {
    library.title = "REFERENCE BOOKSHELF";
    library.texts = [{ x: 30, y: 85, text: "Select a volume to open it." }];
    library.buttons = library.buttons.filter(
      (b) => b.id === "search" || b.id === "topic",
    );
    // Physical volumes remain subject indexes, including when search finds a chapter.
    lessons.slice(0, 3).forEach((volume, index) => {
      const match = visible.find((l) => l.topic === volume.topic);
      if (match)
        button(
          library,
          `lesson-${volume.id}`,
          24,
          187 + index * 58,
          245,
          50,
          match.title,
          "lesson",
          match.id,
        );
    });
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
  quests.graph = createQuestGraph(
    save,
    content,
    input.questSelection,
    input.questView,
  );
  quests.buttons.push(...graphButtons(quests.graph));
  return [investigation, library, quests, inventory];
}
