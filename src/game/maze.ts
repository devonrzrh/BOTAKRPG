import type { Cell, Direction } from "./contracts";
export const directions: Record<Direction, Cell> = {
  north: [0, -1],
  east: [1, 0],
  south: [0, 1],
  west: [-1, 0],
};
export interface Maze {
  seed: number;
  size: number;
  grid: number[][];
  start: Cell;
  goal: Cell;
  position: Cell;
  steps: number;
  commands: number;
}
export function random(seed: number) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function createMaze(seed = 42, size = 11): Maze {
  if (size < 5 || size > 31 || size % 2 === 0)
    throw new Error("Maze size must be odd, between 5 and 31");
  const rng = random(seed),
    grid = Array.from({ length: size }, () => Array<number>(size).fill(1));
  const stack: Cell[] = [[1, 1]];
  grid[1][1] = 0;
  while (stack.length) {
    const [x, y] = stack[stack.length - 1];
    const options = Object.values(directions)
      .map(([dx, dy]) => [x + dx * 2, y + dy * 2] as Cell)
      .filter(
        ([nx, ny]) =>
          nx > 0 &&
          ny > 0 &&
          nx < size - 1 &&
          ny < size - 1 &&
          grid[ny][nx] === 1,
      );
    if (!options.length) {
      stack.pop();
      continue;
    }
    const [nx, ny] = options[Math.floor(rng() * options.length)];
    grid[(ny + y) / 2][(nx + x) / 2] = 0;
    grid[ny][nx] = 0;
    stack.push([nx, ny]);
  }
  // Open a few additional passages so different algorithms can choose different routes.
  for (let i = 0; i < size; i++) {
    const x = 1 + Math.floor(rng() * (size - 2)),
      y = 1 + Math.floor(rng() * (size - 2));
    if (x % 2 !== y % 2 && grid[y][x] === 1) grid[y][x] = 0;
  }
  return {
    seed,
    size,
    grid,
    start: [1, 1],
    goal: [size - 2, size - 2],
    position: [1, 1],
    steps: 0,
    commands: 0,
  };
}
export function neighbors(maze: Maze, cell: Cell): [Direction, Cell][] {
  return (Object.entries(directions) as [Direction, Cell][])
    .map(
      ([d, [dx, dy]]) => [d, [cell[0] + dx, cell[1] + dy]] as [Direction, Cell],
    )
    .filter(([, [x, y]]) => maze.grid[y]?.[x] === 0);
}
export const atGoal = (maze: Maze) =>
  maze.position[0] === maze.goal[0] && maze.position[1] === maze.goal[1];
export function move(maze: Maze, direction: Direction): Maze {
  const destination = neighbors(maze, maze.position).find(
    ([d]) => d === direction,
  );
  return {
    ...maze,
    commands: maze.commands + 1,
    position: destination?.[1] ?? maze.position,
    steps: maze.steps + (destination ? 1 : 0),
  };
}
export function shortestPath(maze: Maze, from = maze.start): Direction[] {
  const queue: [Cell, Direction[]][] = [[from, []]],
    seen = new Set([from.join(",")]);
  for (let index = 0; index < queue.length; index++) {
    const [cell, path] = queue[index];
    if (cell.join(",") === maze.goal.join(",")) return path;
    for (const [d, next] of neighbors(maze, cell))
      if (!seen.has(next.join(","))) {
        seen.add(next.join(","));
        queue.push([next, [...path, d]]);
      }
  }
  throw new Error("Maze has no route");
}
export function mazeCommand(
  maze: Maze,
  method: string,
  args: unknown[],
): { maze: Maze; value: unknown } {
  if (maze.commands >= 2000)
    throw new Error(
      "Command budget exceeded (2,000). Reset and try a more efficient approach.",
    );
  const next = { ...maze, commands: maze.commands + 1 };
  if (method === "position") return { maze: next, value: [...maze.position] };
  if (method === "goal") return { maze: next, value: [...maze.goal] };
  if (method === "at_goal") return { maze: next, value: atGoal(maze) };
  if (method === "neighbors") {
    const cell = args[0];
    if (
      !Array.isArray(cell) ||
      cell.length !== 2 ||
      !cell.every(Number.isInteger) ||
      maze.grid[cell[1]]?.[cell[0]] !== 0
    )
      throw new Error("neighbors expects a walkable [x, y] cell");
    return { maze: next, value: neighbors(maze, cell as Cell) };
  }
  if (method === "move" || method === "can_move") {
    if (typeof args[0] !== "string" || !Object.hasOwn(directions, args[0]))
      throw new Error("Use north, east, south, or west");
    if (method === "can_move")
      return {
        maze: next,
        value: neighbors(maze, maze.position).some(([d]) => d === args[0]),
      };
    const updated = move(maze, args[0] as Direction);
    return { maze: updated, value: updated.steps > maze.steps };
  }
  throw new Error(`Unknown maze command '${method}'`);
}
export const STARTER_CODE = `# Explore with Python. Read the field guide for BFS.\n# API: position(), goal(), neighbors(cell), move(direction),\n#     can_move(direction), at_goal()\n\nprint("Start:", position(), "Goal:", goal())\nfor direction, cell in neighbors(position()):\n    print(direction, cell)\n`;
