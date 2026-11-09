export const TUTORIAL_IDS = [
  "room",
  "quests",
  "read",
  "maze",
  "battle",
  "lab",
  "ledger",
] as const;
export type TutorialId = (typeof TUTORIAL_IDS)[number];
export interface TipStep {
  title: string;
  body: string;
  keys?: string[];
}
export interface Tutorial {
  id: TutorialId;
  title: string;
  eyebrow: string;
  steps: TipStep[];
}
export const tutorials: Tutorial[] = [
  {
    id: "room",
    title: "Working the room",
    eyebrow: "FIELD TIP 01 · THE OFFICE",
    steps: [
      {
        title: "Turn the room",
        body: "Push the cursor to a screen edge or press the arrow keys to turn quickly. Home switches walls directly. The turn stops when the pointer leaves the edge.",
        keys: ["←", "→"],
      },
      {
        title: "Read the props",
        body: "Pinned evidence, books, and the wall screen are physical objects. Move closer and select them. Hover outlines and keyboard focus mark what responds.",
        keys: ["E"],
      },
      {
        title: "Keep your bearings",
        body: "The top bar stays: level, XP, menus, and settings. Escape closes whatever is open. Select your badge for skills.",
        keys: ["Esc"],
      },
    ],
  },
  {
    id: "quests",
    title: "Reading the caseboard",
    eyebrow: "FIELD TIP 02 · THE QUEST BOARD",
    steps: [
      {
        title: "Select a lead",
        body: "Nodes are clues, branches, and chapter checks. Selecting one shows its brief and the actions that are currently legal. Locked clues stay redacted.",
      },
      {
        title: "Follow the thread",
        body: "Pursue lead opens the next encounter. Materials opens its chapter. Recover all three clues, then the final node unlocks ECHO-7.",
      },
    ],
  },
  {
    id: "read",
    title: "Using the archive",
    eyebrow: "FIELD TIP 03 · THE BOOKSHELF",
    steps: [
      {
        title: "Open a volume",
        body: "Pick a book from the shelf. Book view turns real pages; Fullscreen reads continuously. Contents searches the whole text and jumps to a section.",
      },
      {
        title: "Keep what matters",
        body: "Tools holds text size, bookmarks, and margin notes. Select a diagram to enlarge it. Everything you mark saves in this browser.",
      },
    ],
  },
  {
    id: "maze",
    title: "Tracing the packet",
    eyebrow: "FIELD TIP 04 · THE LABYRINTH",
    steps: [
      {
        title: "Move through the maze",
        body: "WASD or the arrow keys move one cell. Reach the amber exit. The D-pad below the map does the same job with a mouse or keyboard.",
        keys: ["W", "A", "S", "D"],
      },
      {
        title: "Program the route",
        body: "Blocks opens a large editor. Choose a category and drag blocks onto the canvas. Show maze docks the editor; Expand editor gives it the screen again. Run resets the maze and keeps your program.",
        keys: ["Ctrl", "Enter"],
      },
      {
        title: "Compare routes",
        body: "After the first clear, try a fresh seed or the optional 90-second trial. Tools & hints holds the statistics, hints, and the graph-search lesson.",
      },
    ],
  },
  {
    id: "battle",
    title: "Surviving an encounter",
    eyebrow: "FIELD TIP 05 · THE ENCOUNTER",
    steps: [
      {
        title: "Pick an opening",
        body: "The bottom console keeps your health, focus, incoming attack and choices together. Each visible skill shows its cost and effect. Choose one, then answer its question to attack.",
      },
      {
        title: "Answer with evidence",
        body: "Questions are untimed. Hint reveals the explanation and marks the answer as assisted. Defend restores focus, reduces the incoming hit, and adds 15 Momentum. Heavy attacks also offer Dodge.",
      },
      {
        title: "Read the machine",
        body: "Analyze shows enemy details and dialogue choices. A successful read reveals the weakness, adds 20 Momentum, and can open a peaceful stand-down. Retreat keeps your evidence.",
      },
      {
        title: "Use your skills",
        body: "Probe deals direct damage. Firewall deals damage and shields you for two enemy turns. Trace injection adds poison for three turns. Correct weakness hits also build Break, which skips a response and strengthens your next hit.",
      },
      {
        title: "Build Momentum",
        body: "Correct answers add 25 Momentum, plus 10 for a weakness; taking damage adds 10. Spend 25, 50, or 75 for that much extra damage. At 100, use a free triple-power Probe. Committed Momentum is spent even if the answer is wrong.",
      },
    ],
  },
  {
    id: "lab",
    title: "Calibrating the signal",
    eyebrow: "FIELD TIP 06 · THE PERCEPTRON LAB",
    steps: [
      {
        title: "Label the points",
        body: "Place class 0 and class 1 samples on the grid. Held-out locations stay out of training, so you cannot train on the test set.",
      },
      {
        title: "Train, then test",
        body: "Train for 20 epochs at a rate of 0.2, then test. At least 10 epochs and 83% on held-out points records the objective.",
      },
    ],
  },
  {
    id: "ledger",
    title: "Filing evidence",
    eyebrow: "FIELD TIP 07 · THE CLUE LEDGER",
    steps: [
      {
        title: "Recovered clues",
        body: "The ledger gathers what completed encounters proved, grouped by branch. Clues are derived from your journal, so they survive export and import.",
      },
      {
        title: "Measure mastery",
        body: "Each lesson counts unique unaided answers and practical proofs. Replaying a question cannot claim the same evidence twice.",
      },
    ],
  },
];
export const tutorialById = (id: TutorialId) =>
  tutorials.find((tutorial) => tutorial.id === id)!;
export interface ManualSection {
  title: string;
  lines: string[];
  keys?: string[];
}
export const manualSections: ManualSection[] = [
  {
    title: "The room",
    lines: [
      "Move the cursor to a screen edge to turn, or press the arrow keys. Home jumps straight to a wall.",
      "Hover outlines mark props. Select pinned evidence, books, the quest screen, or the ledger. Keyboard focus matches the outline.",
    ],
    keys: ["←", "→", "Esc"],
  },
  {
    title: "The case",
    lines: [
      "Take the briefing, then open the quest board. Each lead links a chapter, an encounter, and a clue.",
      "Recover all three clues to reach ECHO-7. Claim rewards once per quest.",
    ],
  },
  {
    title: "Reading",
    lines: [
      "Bookshelf → volume → Book or Fullscreen. Contents searches all sections.",
      "Tools: text size, bookmarks, notes. Diagrams enlarge when selected.",
    ],
  },
  {
    title: "Encounters",
    lines: [
      "Pick a skill and answer an untimed question. Probe deals direct damage; Firewall adds a two-turn shield; Trace injection poisons for three turns.",
      "Defend restores focus, reduces the next hit, and adds 15 Momentum. Heavy attacks offer an optional Dodge with amber strikes and teal openings.",
      "Analyze shows enemy details and dialogue choices. A successful read reveals the weakness and may enable stand-down. Retreat keeps your evidence.",
      "Momentum caps at 100: correct answers +25, weaknesses +10, successful ACT +20, damage taken +10. Spend 25/50/75 for +25/50/75% damage, or all 100 for a free triple-power Probe. Wrong answers still spend committed Momentum.",
    ],
  },
  {
    title: "The labyrinth",
    lines: [
      "WASD or arrows move. Blocks and Python program the same maze; Run resets it and keeps your program.",
      "Reset keeps your code. New layout changes the seed. The trial is optional and timed.",
    ],
    keys: ["Ctrl", "Enter"],
  },
  {
    title: "The perceptron lab",
    lines: [
      "Add class 0 and class 1 samples, then train and test. Held-out points cannot be trained on.",
      "Reach 83% after at least 10 epochs to record the objective.",
    ],
  },
  {
    title: "Progress",
    lines: [
      "The top bar shows level, XP, and XP to the next level. Skills unlock at their level.",
      "The journal saves locally in this browser. Settings exports or imports it. Export before clearing browser data.",
    ],
  },
];
