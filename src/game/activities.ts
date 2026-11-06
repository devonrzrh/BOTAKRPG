import { createMaze, mazeCommand } from "./maze";
import { createBattle } from "./combat";
import { initialNetwork } from "./perceptron";
// Markdown selects these trusted implementations; authored content never executes JS.
export const activityTemplates = {
  maze: { create: createMaze, command: mazeCommand },
  battle: { create: createBattle },
  perceptron: { create: initialNetwork },
} as const;
