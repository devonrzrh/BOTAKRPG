import { useEffect, useRef, useState } from "react";
import {
  BookOpen,
  RotateCcw,
  Lightbulb,
  ArrowRight,
  Check,
} from "lucide-react";
import type { Activity } from "../content/schema";
import {
  createPuzzle,
  puzzleCommand,
  puzzleSolved,
  type PuzzleCommand,
  type PuzzleState,
} from "../game/puzzles";
import "./PuzzleScreen.css";
import { useGameSound } from "./GameSound";

export function PuzzleScreen(p: {
  activity: Activity;
  completed: boolean;
  run?: { commands: PuzzleCommand[]; assisted: boolean };
  onRun: (run: { commands: PuzzleCommand[]; assisted: boolean }) => void;
  onComplete: (assisted: boolean) => void;
  onContinue: () => void;
  onLesson: () => void;
}) {
  const sound = useGameSound();
  const config = p.activity.puzzle;
  const [state, setState] = useState<PuzzleState>(() => {
    const initial = config
      ? createPuzzle(config)
      : createPuzzle({ kind: "stack", values: [2], target: [2], budget: 3 });
    return (p.run?.commands ?? [])
      .slice(0, 1000)
      .reduce((current, command) => puzzleCommand(current, command), initial);
  });
  const [hintLevel, setHintLevel] = useState(p.run?.assisted ? 1 : 0);
  const assisted = useRef(p.run?.assisted ?? false);
  const commands = useRef<PuzzleCommand[]>(
    (p.run?.commands ?? []).slice(0, 1000),
  );
  const completeSent = useRef(false);
  const [rewardEarned, setRewardEarned] = useState(false);
  useEffect(() => {
    if (puzzleSolved(state) && !completeSent.current) {
      completeSent.current = true;
      if (!p.completed) setRewardEarned(true);
      p.onComplete(assisted.current);
    }
  }, [state, p.completed, p.onComplete]);

  if (!config)
    return (
      <div className="puzzle-backdrop" data-sfx-silent>
        <section className="detective-puzzle">
          <p role="alert">Puzzle data is missing.</p>
          <button onClick={p.onContinue}>Continue</button>
        </section>
      </div>
    );
  const act = (command: PuzzleCommand) => {
    const next = puzzleCommand(state, command);
    if (!puzzleSolved(state)) {
      if (next.moves === state.moves) sound("error");
      else if (puzzleSolved(next)) sound("success");
      else sound(command.type === "move" ? "move" : "puzzleAction");
    }
    if (next.moves !== state.moves && commands.current.length < 1000) {
      commands.current = [...commands.current, command];
      p.onRun({ commands: commands.current, assisted: assisted.current });
    }
    setState(next);
  };
  const reset = () => {
    sound("open");
    commands.current = [];
    assisted.current = false;
    p.onRun({ commands: [], assisted: false });
    setState(createPuzzle(config));
    setHintLevel(0);
    completeSent.current = false;
    setRewardEarned(false);
  };
  const solved = puzzleSolved(state);
  const routeCoordinates: Record<number, { x: number; y: number }> = {
    1: { x: 65, y: 160 },
    2: { x: 220, y: 65 },
    3: { x: 220, y: 255 },
    4: { x: 375, y: 160 },
    5: { x: 530, y: 255 },
    6: { x: 530, y: 65 },
  };
  const routePositions = config.values.map((node, i) => ({
    node,
    ...(routeCoordinates[node] ?? {
      x: 72 + (i % 4) * 150,
      y: 72 + Math.floor(i / 4) * 150,
    }),
  }));
  const currentNode = state.route[state.route.length - 1];
  const neighbors =
    config.kind === "routing"
      ? config.edges
          .filter((e) => e.from === currentNode || e.to === currentNode)
          .map((e) => ({
            node: e.from === currentNode ? e.to : e.from,
            cost: e.cost,
          }))
      : [];
  return (
    <div className="puzzle-backdrop" data-sfx-silent>
      <section className="detective-puzzle" aria-label={p.activity.title}>
        <main className="puzzle-main">
          <p className="puzzle-brief">
            {p.activity.brief ||
              "A damaged trace remains in the system. Reconstruct its sequence to recover the evidence."}
          </p>
          <section
            className={`puzzle-board puzzle-${config.kind}`}
            aria-label={`${config.kind} puzzle`}
          >
            {config.kind === "stack" && (
              <>
                <div className="puzzle-lane">
                  <h2>Incoming trace</h2>
                  <div className="puzzle-tiles">
                    {state.input.map((v, i) => (
                      <span className="puzzle-tile" key={`${i}-${v}`}>
                        {v}
                      </span>
                    ))}
                    {!state.input.length && (
                      <span className="puzzle-empty">No values remain</span>
                    )}
                  </div>
                </div>
                <div className="stack-work">
                  <div className="stack-column">
                    <strong>TOP</strong>
                    {state.buffer.length ? (
                      [...state.buffer].reverse().map((v, i) => (
                        <span className="puzzle-tile" key={`${i}-${v}`}>
                          {v}
                        </span>
                      ))
                    ) : (
                      <span className="stack-empty">empty</span>
                    )}
                    <strong>BASE</strong>
                  </div>
                  <div className="stack-controls">
                    <button
                      disabled={!state.input.length || solved}
                      onClick={() => act({ type: "push" })}
                    >
                      Push next
                    </button>
                    <button
                      disabled={!state.buffer.length || solved}
                      onClick={() => act({ type: "pop" })}
                    >
                      Pop top
                    </button>
                  </div>
                </div>
                <div className="puzzle-lane">
                  <h2>Target sequence</h2>
                  <div className="puzzle-tiles">
                    {config.target.map((v, i) => (
                      <span
                        className={`puzzle-tile ${state.output[i] !== undefined ? "tile-done" : i === state.output.length ? "tile-next" : ""}`}
                        key={i}
                      >
                        {v}
                      </span>
                    ))}
                  </div>
                </div>
              </>
            )}
            {config.kind === "queue" && (
              <>
                <div className="queue-labels">
                  <span>FRONT</span>
                  <span>BACK</span>
                </div>
                <div className="queue-slots">
                  {state.input.map((v, i) => (
                    <div
                      className={`queue-slot ${i === 0 ? "queue-front" : ""}`}
                      key={`${i}-${v}`}
                    >
                      <span>{v}</span>
                    </div>
                  ))}
                  {!state.input.length && (
                    <span className="puzzle-empty">Queue empty</span>
                  )}
                </div>
                <div className="stack-controls">
                  <button
                    disabled={state.input.length < 2 || solved}
                    onClick={() => act({ type: "rotate" })}
                  >
                    Rotate front to back
                  </button>
                  <button
                    disabled={!state.input.length || solved}
                    onClick={() => act({ type: "dispatch" })}
                  >
                    Dispatch front
                  </button>
                </div>
                <div className="puzzle-lane">
                  <h2>Required delivery</h2>
                  <div className="puzzle-tiles">
                    {config.target.map((v, i) => (
                      <span
                        className={`puzzle-tile ${state.output[i] !== undefined ? "tile-done" : i === state.output.length ? "tile-next" : ""}`}
                        key={i}
                      >
                        {v}
                      </span>
                    ))}
                  </div>
                </div>
              </>
            )}
            {config.kind === "sorting" && (
              <>
                <p className="board-instruction">
                  Swap neighboring values until the evidence is in ascending
                  order.
                </p>
                <div className="sort-row">
                  {state.input.map((v, i) => (
                    <div className="sort-unit" key={`${i}-${v}`}>
                      <span
                        className={`sort-tile ${v === config.target[i] ? "tile-done" : ""}`}
                      >
                        {v}
                      </span>
                      {i < state.input.length - 1 && (
                        <button
                          aria-label={`Swap positions ${i + 1} and ${i + 2}`}
                          disabled={solved || state.moves >= config.budget}
                          onClick={() => act({ type: "swap", index: i })}
                        >
                          ↔
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <p className="sort-target">
                  TARGET <b>{config.target.join(" · ")}</b>
                </p>
              </>
            )}
            {config.kind === "routing" && (
              <>
                <div className="route-canvas">
                  <svg
                    viewBox="0 0 600 320"
                    role="img"
                    aria-label="Network diagram"
                  >
                    <g>
                      {config.edges.map((e, i) => {
                        const a = routePositions.find(
                          (n) => n.node === e.from,
                        )!;
                        const b = routePositions.find((n) => n.node === e.to)!;
                        return (
                          <g key={i}>
                            <line
                              className={
                                state.route.some(
                                  (node, index) =>
                                    index > 0 &&
                                    ((state.route[index - 1] === e.from &&
                                      node === e.to) ||
                                      (state.route[index - 1] === e.to &&
                                        node === e.from)),
                                )
                                  ? "route-edge-used"
                                  : "route-edge"
                              }
                              x1={a.x}
                              y1={a.y}
                              x2={b.x}
                              y2={b.y}
                            />
                            <text x={(a.x + b.x) / 2} y={(a.y + b.y) / 2 - 7}>
                              {e.cost}
                            </text>
                          </g>
                        );
                      })}
                    </g>
                  </svg>
                  <div className="route-nodes">
                    {routePositions.map(({ node, x, y }) => (
                      <button
                        key={node}
                        className={`${node === config.target[0] ? "route-start" : ""} ${node === config.target[1] ? "route-goal" : ""} ${state.route.includes(node) ? "route-visited" : ""}`}
                        style={{ left: `${x / 6}%`, top: `${y / 3.2}%` }}
                        aria-label={`Node ${node}${node === currentNode ? ", current location" : ""}`}
                        onClick={() =>
                          node !== currentNode && act({ type: "move", node })
                        }
                      >
                        {node}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="route-status">
                  <span>
                    Current node <b>{currentNode}</b>
                  </span>
                  <span>
                    Route cost{" "}
                    <b>
                      {state.cost} / {config.budget}
                    </b>
                  </span>
                </div>
                <div className="route-neighbors">
                  {neighbors.map(({ node, cost }) => (
                    <button
                      key={node}
                      disabled={solved || state.cost + cost > config.budget}
                      onClick={() => act({ type: "move", node })}
                    >
                      Move to {node} · cost {cost}
                    </button>
                  ))}
                </div>
              </>
            )}
          </section>
          <div className="puzzle-meta">
            <span>
              {config.kind === "routing" ? "Route cost" : "Actions"}{" "}
              <b>
                {config.kind === "routing"
                  ? `${state.cost} / ${config.budget}`
                  : `${state.moves} / ${config.budget}`}
              </b>
            </span>
            {p.completed && !rewardEarned && (
              <span className="puzzle-replay">
                <Check size={16} /> Case already filed · practice earns no
                additional XP
              </span>
            )}
          </div>
          {hintLevel > 0 && (
            <aside className="puzzle-hint">
              <strong>
                {hintLevel > 1 && p.activity.solution
                  ? "Solution"
                  : "Field hint"}
              </strong>
              <p>
                {hintLevel > 1 && p.activity.solution
                  ? p.activity.solution
                  : p.activity.hint ||
                    "Study the required order, then choose the operation that moves the next value into place."}
              </p>
            </aside>
          )}
        </main>
        <footer className="puzzle-actions">
          <button className="puzzle-utility" onClick={reset}>
            <RotateCcw size={18} /> {solved ? "Practice again" : "Reset"}
          </button>
          <button
            className="puzzle-utility"
            onClick={() => {
              assisted.current = true;
              p.onRun({ commands: commands.current, assisted: true });
              setHintLevel((level) =>
                level === 0 ? 1 : level === 1 && p.activity.solution ? 2 : 1,
              );
            }}
          >
            <Lightbulb size={18} /> {hintLevel ? "Another hint" : "Hint"}
          </button>
          <button className="puzzle-utility" onClick={p.onLesson}>
            <BookOpen size={18} /> Read chapter
          </button>
          {!solved && state.message !== "Puzzle ready." && (
            <span className="puzzle-status" role="status">
              {state.message}
            </span>
          )}
          <span className="puzzle-footer-spacer" />
          {solved ? (
            !rewardEarned ? (
              <button className="puzzle-primary" onClick={p.onContinue}>
                Continue <ArrowRight size={18} />
              </button>
            ) : (
              <div className="puzzle-win">
                <span>
                  <Check size={18} /> Evidence recovered · 25 XP
                </span>
                <button className="puzzle-primary" onClick={p.onContinue}>
                  Continue <ArrowRight size={18} />
                </button>
              </div>
            )
          ) : null}
        </footer>
      </section>
    </div>
  );
}
