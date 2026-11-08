import { z } from "zod";

const edgeSchema = z.object({
  from: z.number().int(),
  to: z.number().int(),
  cost: z.number().finite().positive(),
});

const base = {
  values: z.array(z.number().int()).min(1).max(32),
  target: z.array(z.number().int()).min(1).max(32),
  budget: z.number().finite().positive().max(1000),
  edges: z.array(edgeSchema).max(128).optional(),
};

const rawPuzzleConfigSchema = z.discriminatedUnion("kind", [
  z.object({ ...base, kind: z.literal("stack") }),
  z.object({ ...base, kind: z.literal("queue") }),
  z.object({ ...base, kind: z.literal("sorting") }),
  z.object({
    ...base,
    kind: z.literal("routing"),
    edges: z.array(edgeSchema).min(1).max(128),
  }),
]);

function sameMultiset(a: number[], b: number[]) {
  return (
    a.length === b.length &&
    [...a]
      .sort((x, y) => x - y)
      .every((value, i) => value === [...b].sort((x, y) => x - y)[i])
  );
}

function shortestRoute(
  values: number[],
  edges: z.infer<typeof edgeSchema>[],
  start: number,
  goal: number,
) {
  const distances = new Map<number, number>([[start, 0]]);
  const pending = new Set(values);
  while (pending.size) {
    let current: number | undefined;
    for (const node of pending)
      if (
        current === undefined ||
        (distances.get(node) ?? Infinity) < (distances.get(current) ?? Infinity)
      )
        current = node;
    if (current === undefined || !distances.has(current)) break;
    pending.delete(current);
    if (current === goal) return distances.get(current)!;
    for (const edge of edges) {
      const next =
        edge.from === current
          ? edge.to
          : edge.to === current
            ? edge.from
            : undefined;
      if (next === undefined || !pending.has(next)) continue;
      const cost = distances.get(current)! + edge.cost;
      if (cost < (distances.get(next) ?? Infinity)) distances.set(next, cost);
    }
  }
  return Infinity;
}

function stackCanProduce(values: number[], target: number[]) {
  const stack: number[] = [];
  let input = 0;
  for (const expected of target) {
    while (stack.at(-1) !== expected && input < values.length)
      stack.push(values[input++]);
    if (stack.pop() !== expected) return false;
  }
  return input === values.length && stack.length === 0;
}

function queueMinimumMoves(values: number[], target: number[]) {
  const queue = [...values];
  let moves = 0;
  for (const expected of target) {
    let rotations = 0;
    while (queue[0] !== expected && rotations < queue.length) {
      queue.push(queue.shift()!);
      rotations++;
      moves++;
    }
    if (queue[0] !== expected) return Infinity;
    queue.shift();
    moves++;
  }
  return moves;
}

export const puzzleConfigSchema = rawPuzzleConfigSchema.superRefine(
  (config, ctx) => {
    if (config.kind !== "routing" && !Number.isInteger(config.budget))
      ctx.addIssue({
        code: "custom",
        path: ["budget"],
        message: "Action budget must be a positive integer.",
      });
    if (config.kind === "routing") {
      const nodes = new Set(config.values);
      if (nodes.size !== config.values.length)
        ctx.addIssue({
          code: "custom",
          path: ["values"],
          message: "Routing node IDs must be unique.",
        });
      if (config.target.length !== 2 || config.target[0] === config.target[1])
        ctx.addIssue({
          code: "custom",
          path: ["target"],
          message: "Routing target must contain distinct start and goal nodes.",
        });
      const [start, goal] = config.target;
      if (config.target.some((node) => !nodes.has(node)))
        ctx.addIssue({
          code: "custom",
          path: ["target"],
          message: "Start and goal must be listed nodes.",
        });
      for (const [i, edge] of config.edges.entries()) {
        if (
          !nodes.has(edge.from) ||
          !nodes.has(edge.to) ||
          edge.from === edge.to
        )
          ctx.addIssue({
            code: "custom",
            path: ["edges", i],
            message: "Edges must connect distinct listed nodes.",
          });
        if (
          config.edges
            .slice(0, i)
            .some(
              (prior) =>
                (prior.from === edge.from && prior.to === edge.to) ||
                (prior.from === edge.to && prior.to === edge.from),
            )
        ) {
          ctx.addIssue({
            code: "custom",
            path: ["edges", i],
            message: "Duplicate undirected edges are not allowed.",
          });
        }
      }
      if (
        nodes.has(start) &&
        nodes.has(goal) &&
        shortestRoute(config.values, config.edges, start, goal) > config.budget
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["budget"],
          message: "Goal is unreachable within the route budget.",
        });
      }
      return;
    }
    if (!sameMultiset(config.values, config.target))
      ctx.addIssue({
        code: "custom",
        path: ["target"],
        message: "Target must contain the same values as the puzzle.",
      });
    if (config.kind === "stack") {
      if (config.budget < config.values.length * 2)
        ctx.addIssue({
          code: "custom",
          path: ["budget"],
          message:
            "Stack budget must allow at least one push and pop per value.",
        });
      if (
        sameMultiset(config.values, config.target) &&
        !stackCanProduce(config.values, config.target)
      )
        ctx.addIssue({
          code: "custom",
          path: ["target"],
          message: "Target order cannot be produced by this stack.",
        });
    }
    if (config.kind === "queue") {
      const minimum = sameMultiset(config.values, config.target)
        ? queueMinimumMoves(config.values, config.target)
        : Infinity;
      if (minimum > config.budget)
        ctx.addIssue({
          code: "custom",
          path: ["budget"],
          message: "Queue order cannot be reached within the move budget.",
        });
    }
    if (config.kind === "sorting") {
      const sorted = [...config.values].sort((a, b) => a - b);
      if (config.target.some((v, i) => v !== sorted[i]))
        ctx.addIssue({
          code: "custom",
          path: ["target"],
          message: "Sorting target must be ascending.",
        });
      let inversions = 0;
      for (let i = 0; i < config.values.length; i++)
        for (let j = i + 1; j < config.values.length; j++)
          if (config.values[i] > config.values[j]) inversions++;
      if (config.budget < inversions)
        ctx.addIssue({
          code: "custom",
          path: ["budget"],
          message: "Swap budget is below the minimum needed to sort.",
        });
    }
  },
);

export type PuzzleConfig = z.infer<typeof puzzleConfigSchema>;
export type PuzzleState = {
  config: PuzzleConfig;
  moves: number;
  message: string;
  solved: boolean;
  input: number[];
  buffer: number[];
  output: number[];
  route: number[];
  cost: number;
};

export type PuzzleCommand =
  | { type: "push" }
  | { type: "pop" }
  | { type: "rotate" }
  | { type: "dispatch" }
  | { type: "swap"; index: number }
  | { type: "move"; node: number };

export function createPuzzle(config: PuzzleConfig): PuzzleState {
  const parsed = puzzleConfigSchema.parse(config);
  const route = parsed.kind === "routing" ? [parsed.target[0]] : [];
  const sorted =
    parsed.kind === "sorting" &&
    parsed.values.every((value, i) => value === parsed.target[i]);
  return {
    config: parsed,
    moves: 0,
    message: sorted ? "Evidence already sorted." : "Puzzle ready.",
    solved: sorted,
    input: [...parsed.values],
    buffer: [],
    output: [],
    route,
    cost: 0,
  };
}

const unchanged = (state: PuzzleState, message: string): PuzzleState => ({
  ...state,
  message,
});

export function puzzleSolved(state: PuzzleState) {
  return state.solved;
}

export function puzzleCommand(
  state: PuzzleState,
  command: PuzzleCommand,
): PuzzleState {
  if (state.solved) return unchanged(state, "Puzzle already solved.");
  if (state.moves >= 1000) return unchanged(state, "Action limit reached. Reset to try again.");
  const { config } = state;
  if (config.kind !== "routing" && state.moves >= config.budget)
    return unchanged(state, "Move budget exhausted. Reset to try again.");
  let next: PuzzleState | undefined;
  if (config.kind === "stack" && command.type === "push") {
    if (!state.input.length) return unchanged(state, "No more values to push.");
    next = {
      ...state,
      input: state.input.slice(1),
      buffer: [...state.buffer, state.input[0]],
      moves: state.moves + 1,
      message: `Pushed ${state.input[0]}.`,
    };
  } else if (config.kind === "stack" && command.type === "pop") {
    const top = state.buffer[state.buffer.length - 1];
    const expected = config.target[state.output.length];
    if (top === undefined) return unchanged(state, "The stack is empty.");
    if (top !== expected)
      return unchanged(state, `Top value is ${top}; target needs ${expected}.`);
    const output = [...state.output, top];
    next = {
      ...state,
      buffer: state.buffer.slice(0, -1),
      output,
      moves: state.moves + 1,
      message: `Released ${top}.`,
    };
    if (output.length === config.target.length)
      next = { ...next, solved: true, message: "Sequence reconstructed." };
  } else if (config.kind === "queue" && command.type === "rotate") {
    if (state.input.length < 2)
      return unchanged(
        state,
        "A queue needs at least two waiting values to rotate.",
      );
    next = {
      ...state,
      input: [...state.input.slice(1), state.input[0]],
      moves: state.moves + 1,
      message: "Moved the front value to the back.",
    };
  } else if (config.kind === "queue" && command.type === "dispatch") {
    const head = state.input[0];
    if (head === undefined) return unchanged(state, "The queue is empty.");
    const expected = config.target[state.output.length];
    if (head !== expected)
      return unchanged(
        state,
        `Queue head is ${head}; target needs ${expected}.`,
      );
    const output = [...state.output, head];
    next = {
      ...state,
      input: state.input.slice(1),
      output,
      moves: state.moves + 1,
      message: `Dispatched ${head}.`,
    };
    if (output.length === config.target.length)
      next = {
        ...next,
        solved: true,
        message: "Queue delivered the sequence.",
      };
  } else if (config.kind === "sorting" && command.type === "swap") {
    const i = command.index;
    if (!Number.isInteger(i) || i < 0 || i >= state.input.length - 1)
      return unchanged(state, "Choose a valid adjacent pair.");
    const input = [...state.input];
    [input[i], input[i + 1]] = [input[i + 1], input[i]];
    const solved = input.every((v, index) => v === config.target[index]);
    next = {
      ...state,
      input,
      moves: state.moves + 1,
      solved,
      message: solved
        ? "Evidence sorted."
        : `Swapped positions ${i + 1} and ${i + 2}.`,
    };
  } else if (config.kind === "routing" && command.type === "move") {
    const from = state.route[state.route.length - 1];
    const edge = config.edges.find(
      (item) =>
        (item.from === from && item.to === command.node) ||
        (item.to === from && item.from === command.node),
    );
    if (!edge) return unchanged(state, "No direct connection to that node.");
    if (state.cost + edge.cost > config.budget)
      return unchanged(state, "That connection exceeds the route budget.");
    const route = [...state.route, command.node];
    const solved = command.node === config.target[1];
    next = {
      ...state,
      route,
      cost: state.cost + edge.cost,
      moves: state.moves + 1,
      solved,
      message: solved
        ? `Reached node ${command.node}.`
        : `Moved to node ${command.node}.`,
    };
  }
  if (!next)
    return unchanged(state, "That action does not apply to this puzzle.");
  if (
    !next.solved &&
    (config.kind === "routing"
      ? next.cost >= config.budget
      : next.moves >= config.budget)
  )
    return {
      ...next,
      message: "Budget exhausted. Reset to try a different approach.",
    };
  return next;
}
