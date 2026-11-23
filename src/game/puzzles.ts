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
  program: z.enum(["adjacent-sort", "binary-search", "weighted-route"]).optional(),
  edges: z.array(edgeSchema).max(128).optional(),
  labels: z.array(z.string().min(1)).max(32).optional(),
};

const rawPuzzleConfigSchema = z.discriminatedUnion("kind", [
  z.object({ ...base, kind: z.literal("stack") }),
  z.object({ ...base, kind: z.literal("queue") }),
  z.object({ ...base, kind: z.literal("sorting") }),
  z.object({ ...base, kind: z.literal("search") }),
  z.object({ ...base, kind: z.literal("hanoi") }),
  z.object({ ...base, kind: z.literal("deduction"), labels: z.array(z.string().min(1)).min(3).max(8) }),
  z.object({
    ...base,
    kind: z.literal("allocation"),
    values: z.array(z.number().int()).min(2).max(10),
    labels: z.array(z.string().min(1)).min(2).max(10),
    loads: z.array(z.object({
      cost: z.number().int().positive().max(100),
      coverage: z.number().int().positive().max(100),
    })).min(2).max(10),
    capacity: z.number().int().positive().max(100),
  }),
  z.object({
    ...base,
    kind: z.literal("routing"),
    edges: z.array(edgeSchema).min(1).max(128),
  }),
]);

type AllocationConfig = Extract<z.infer<typeof rawPuzzleConfigSchema>, { kind: "allocation" }>;

export function allocationTotals(config: AllocationConfig, selection: number[]) {
  return selection.reduce(
    ({ cost, coverage }, value) => {
      const load = config.loads[config.values.indexOf(value)];
      return { cost: cost + load.cost, coverage: coverage + load.coverage };
    },
    { cost: 0, coverage: 0 },
  );
}

export function findAllocation(config: AllocationConfig): number[] | undefined {
  function choose(index: number, cost: number, coverage: number): number[] | undefined {
    if (cost > config.capacity) return undefined;
    if (coverage >= config.target[0]) return [];
    if (index >= config.values.length) return undefined;
    const value = config.values[index];
    const load = config.loads[index];
    const included = choose(index + 1, cost + load.cost, coverage + load.coverage);
    return included ? [value, ...included] : choose(index + 1, cost, coverage);
  }
  return choose(0, 0, 0);
}

function sameMultiset(a: number[], b: number[]) {
  return (
    a.length === b.length &&
    [...a]
      .sort((x, y) => x - y)
      .every((value, i) => value === [...b].sort((x, y) => x - y)[i])
  );
}

export function shortestPuzzleRoute(
  values: number[],
  edges: z.infer<typeof edgeSchema>[],
  start: number,
  goal: number,
) {
  const distances = new Map<number, number>([[start, 0]]);
  const previous = new Map<number, number>();
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
    if (current === goal) {
      const path: number[] = [];
      for (let node = goal; node !== start; node = previous.get(node)!)
        path.push(node);
      return { cost: distances.get(goal)!, path: path.reverse() };
    }
    for (const edge of edges) {
      const next =
        edge.from === current
          ? edge.to
          : edge.to === current
            ? edge.from
            : undefined;
      if (next === undefined || !pending.has(next)) continue;
      const cost = distances.get(current)! + edge.cost;
      if (cost < (distances.get(next) ?? Infinity)) {
        distances.set(next, cost);
        previous.set(next, current);
      }
    }
  }
  return { cost: Infinity, path: [] };
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
    const expectedProgram = config.kind === "sorting"
      ? "adjacent-sort"
      : config.kind === "search"
        ? "binary-search"
        : config.kind === "routing"
          ? "weighted-route"
          : undefined;
    if (config.program && config.program !== expectedProgram)
      ctx.addIssue({
        code: "custom",
        path: ["program"],
        message: "This coding API does not match the puzzle type.",
      });
    if (
      config.labels &&
      (config.labels.length !== config.values.length ||
        new Set(config.values).size !== config.values.length)
    )
      ctx.addIssue({
        code: "custom",
        path: ["labels"],
        message: "Labels need one unique value for each puzzle value.",
      });
    if (config.kind !== "routing" && !Number.isInteger(config.budget))
      ctx.addIssue({
        code: "custom",
        path: ["budget"],
        message: "Action budget must be a positive integer.",
      });
    if (config.kind === "deduction") {
      if (
        config.target.length < 2 ||
        config.target.length >= config.values.length ||
        new Set(config.target).size !== config.target.length ||
        config.target.some((id) => !config.values.includes(id))
      )
        ctx.addIssue({
          code: "custom",
          path: ["target"],
          message: "Cite at least two distinct listed records and leave a distractor.",
        });
      return;
    }
    if (config.kind === "allocation") {
      if (
        config.loads.length !== config.values.length ||
        config.target.length !== 1 ||
        config.target[0] < 1 ||
        !findAllocation(config)
      )
        ctx.addIssue({
          code: "custom",
          path: ["target"],
          message: "Supply one reachable coverage goal and one load per request.",
        });
      return;
    }
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
        shortestPuzzleRoute(config.values, config.edges, start, goal).cost >
          config.budget
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["budget"],
          message: "Goal is unreachable within the route budget.",
        });
      }
      return;
    }
    if (config.kind === "search") {
      if (config.values.some((v, i) => i > 0 && v <= config.values[i - 1]))
        ctx.addIssue({
          code: "custom",
          path: ["values"],
          message: "Search values must be strictly ascending.",
        });
      if (
        config.target.length !== 1 ||
        !config.values.includes(config.target[0])
      )
        ctx.addIssue({
          code: "custom",
          path: ["target"],
          message: "Search target must be one listed value.",
        });
      // Ensure the intended midpoint strategy can finish within the budget.
      let low = 0,
        high = config.values.length - 1,
        probes = 0;
      while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        probes++;
        if (config.values[mid] === config.target[0]) break;
        if (config.values[mid] < config.target[0]) low = mid + 1;
        else high = mid - 1;
      }
      if (config.budget < probes)
        ctx.addIssue({
          code: "custom",
          path: ["budget"],
          message: "Search budget must allow the midpoint strategy.",
        });
      return;
    }
    if (config.kind === "hanoi") {
      if (
        config.values.length > 5 ||
        config.values.some(
          (v, i) => v <= 0 || (i > 0 && v >= config.values[i - 1]),
        )
      )
        ctx.addIssue({
          code: "custom",
          path: ["values"],
          message:
            "Transfer lock needs up to five positive discs, largest first.",
        });
      if (
        config.values.length !== config.target.length ||
        config.values.some((v, i) => v !== config.target[i])
      )
        ctx.addIssue({
          code: "custom",
          path: ["target"],
          message: "Transfer target must preserve disc order.",
        });
      if (config.budget < 2 ** config.values.length - 1)
        ctx.addIssue({
          code: "custom",
          path: ["budget"],
          message: "Transfer budget is below the minimum required.",
        });
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
export const puzzlePrograms = {
  "adjacent-sort": {
    api: ["priorities", "swap"],
    starter: "values = priorities()\n# Compare adjacent values and swap any pair that is out of order.\n",
    reference: "priorities() returns the current numbers. swap(position) exchanges that position with the next; positions start at 1.",
  },
  "binary-search": {
    api: ["slot_count", "probe"],
    starter: "low = 1\nhigh = slot_count()\n# Probe the middle slot and narrow the range from the result.\n",
    reference: "slot_count() returns the number of records. probe(slot) compares a one-based slot to the target: -1 means search lower, 1 means search higher, and 0 means found.",
  },
  "weighted-route": {
    api: ["current_node", "neighbors", "connection_cost", "move_to", "route_cost", "is_safe"],
    starter: "# Follow connected nodes until the safe subnet is reached.\n# Use neighbors() and route_cost() to guide your choices.\n",
    reference: "current_node() returns your node ID. neighbors() lists directly connected node IDs. connection_cost(node) returns that link's cost, or -1 if disconnected. move_to(node) traverses a link. route_cost() returns spent budget; is_safe() is true at the goal.",
  },
} as const;
export type PuzzleProgramId = keyof typeof puzzlePrograms;

export function puzzleProgramCall(
  state: PuzzleState,
  program: PuzzleProgramId,
  method: string,
  args: unknown[],
): { command?: PuzzleCommand; value: unknown } {
  if (state.config.program !== program)
    throw new Error("This program API is not available for the current puzzle.");
  const numberArg = () => {
    if (args.length !== 1 || typeof args[0] !== "number" || !Number.isFinite(args[0]))
      throw new Error(`${method} expects one finite number.`);
    return args[0];
  };
  const act = (command: PuzzleCommand) => {
    const next = puzzleCommand(state, command);
    if (next.moves === state.moves) throw new Error(next.message);
    return { command, value: null };
  };
  if (program === "adjacent-sort" && method === "priorities") {
    if (args.length) throw new Error("priorities expects no arguments.");
    return { value: [...state.input] };
  }
  if (program === "adjacent-sort" && method === "swap")
    return act({ type: "swap", index: numberArg() - 1 });
  if (program === "binary-search" && method === "slot_count") {
    if (args.length) throw new Error("slot_count expects no arguments.");
    return { value: state.config.values.length };
  }
  if (program === "binary-search" && method === "probe") {
    const slot = numberArg();
    if (!Number.isInteger(slot)) throw new Error("probe expects a whole-number slot.");
    const index = slot - 1;
    const next = puzzleCommand(state, { type: "probe", index });
    if (next.moves === state.moves) throw new Error(next.message);
    return {
      command: { type: "probe", index },
      value: Math.sign(state.config.target[0] - state.config.values[index]),
    };
  }
  if (program === "weighted-route" && method === "current_node") {
    if (args.length) throw new Error("current_node expects no arguments.");
    return { value: state.route.at(-1) };
  }
  if (program === "weighted-route" && method === "neighbors") {
    if (args.length) throw new Error("neighbors expects no arguments.");
    const current = state.route.at(-1);
    return {
      value: state.config.kind === "routing"
        ? state.config.edges
            .filter((edge) => edge.from === current || edge.to === current)
            .map((edge) => edge.from === current ? edge.to : edge.from)
        : [],
    };
  }
  if (program === "weighted-route" && method === "connection_cost") {
    const node = numberArg();
    const current = state.route.at(-1);
    return {
      value: state.config.kind === "routing"
        ? state.config.edges.find((edge) =>
            (edge.from === current && edge.to === node) ||
            (edge.to === current && edge.from === node),
          )?.cost ?? -1
        : -1,
    };
  }
  if (program === "weighted-route" && method === "move_to")
    return act({ type: "move", node: numberArg() });
  if (program === "weighted-route" && method === "route_cost") {
    if (args.length) throw new Error("route_cost expects no arguments.");
    return { value: state.cost };
  }
  if (program === "weighted-route" && method === "is_safe") {
    if (args.length) throw new Error("is_safe expects no arguments.");
    return { value: state.route.at(-1) === state.config.target[1] };
  }
  throw new Error(`${method} is not available in this puzzle program.`);
}

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
  low: number;
  high: number;
  probes: number[];
  pegs: number[][];
};

export type PuzzleCommand =
  | { type: "push" }
  | { type: "pop" }
  | { type: "rotate" }
  | { type: "dispatch" }
  | { type: "swap"; index: number }
  | { type: "move"; node: number }
  | { type: "submit"; selection: number[] }
  | { type: "probe"; index: number }
  | { type: "transfer"; from: number; to: number };

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
    low: 0,
    high: parsed.values.length - 1,
    probes: [],
    pegs: [[...parsed.values], [], []],
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
  if (state.moves >= 1000)
    return unchanged(state, "Action limit reached. Reset to try again.");
  const { config } = state;
  if (config.kind !== "routing" && state.moves >= config.budget)
    return unchanged(state, "Move budget exhausted. Reset to try again.");
  let next: PuzzleState | undefined;
  if (
    (config.kind === "deduction" || config.kind === "allocation") &&
    command.type === "submit"
  ) {
    const { selection } = command;
    if (
      !selection.length ||
      new Set(selection).size !== selection.length ||
      selection.some((value) => !config.values.includes(value))
    )
      return unchanged(state, "Choose distinct entries from the board.");
    if (config.kind === "deduction") {
      if (selection.length !== config.target.length)
        return unchanged(state, `Cite exactly ${config.target.length} records.`);
      const solved = config.target.every((value) => selection.includes(value));
      next = {
        ...state,
        output: selection,
        moves: state.moves + 1,
        solved,
        message: solved
          ? "The cited records prove the report was forged."
          : "Those records do not establish the contradiction.",
      };
    } else {
      const { cost, coverage } = allocationTotals(config, selection);
      const solved = cost <= config.capacity && coverage >= config.target[0];
      next = {
        ...state,
        output: selection,
        moves: state.moves + 1,
        solved,
        message: solved
          ? "Power plan approved."
          : `The plan uses ${cost} charge and serves ${coverage} callers. Check both limits.`,
      };
    }
  } else if (config.kind === "search" && command.type === "probe") {
    const i = command.index;
    if (!Number.isInteger(i) || i < state.low || i > state.high)
      return unchanged(state, "Choose a slot inside the remaining range.");
    const value = config.values[i],
      target = config.target[0];
    const solved = value === target;
    next = {
      ...state,
      moves: state.moves + 1,
      probes: [...state.probes, i],
      solved,
      low: value < target ? i + 1 : state.low,
      high: value > target ? i - 1 : state.high,
      message: solved
        ? `Record ${value} located in slot ${i + 1}.`
        : `Slot ${i + 1} holds ${value}; search ${value < target ? "higher" : "lower"} slots.`,
    };
  } else if (config.kind === "hanoi" && command.type === "transfer") {
    const { from, to } = command;
    if (
      ![from, to].every(
        (peg) => Number.isInteger(peg) && peg >= 0 && peg <= 2,
      ) ||
      from === to
    )
      return unchanged(state, "Choose two different pegs.");
    const disc = state.pegs[from].at(-1),
      destination = state.pegs[to].at(-1);
    if (disc === undefined) return unchanged(state, "That peg is empty.");
    if (destination !== undefined && disc > destination)
      return unchanged(state, "A larger disc cannot rest on a smaller disc.");
    const pegs = state.pegs.map((peg) => [...peg]);
    pegs[from].pop();
    pegs[to].push(disc);
    const solved = pegs[2].length === config.values.length;
    next = {
      ...state,
      pegs,
      moves: state.moves + 1,
      solved,
      message: solved
        ? "Transfer lock released."
        : `Moved disc ${disc} from peg ${from + 1} to ${to + 1}.`,
    };
  } else if (config.kind === "stack" && command.type === "push") {
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
