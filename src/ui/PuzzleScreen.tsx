import { lazy, Suspense, useEffect, useRef, useState } from "react";
import {
  BookOpen,
  ArrowLeftRight,
  RotateCcw,
  Lightbulb,
  ArrowRight,
  Check,
  Play,
  Pause,
  Square,
  SkipForward,
} from "lucide-react";
import type { Activity } from "../content/schema";
import {
  createPuzzle,
  puzzleCommand,
  puzzleProgramCall,
  puzzlePrograms,
  puzzleSolved,
  type PuzzleCommand,
  type PuzzleState,
} from "../game/puzzles";
import { PythonRunner, type RunPhase } from "../runtime/python";
import "./PuzzleScreen.css";
import { useGameSound } from "./GameSound";
import { useGameParticles } from "./GameParticles";
const CodeEditor = lazy(() => import("./CodeEditor"));
const Blocks = lazy(() => import("./Blocks"));

export function PuzzleScreen(p: {
  activity: Activity;
  completed: boolean;
  run?: { commands: PuzzleCommand[]; assisted: boolean };
  programState?: { code: string; blocks?: unknown | null };
  onRun: (run: { commands: PuzzleCommand[]; assisted: boolean }) => void;
  onProgramChange: (program: { code: string; blocks: unknown | null }) => void;
  onComplete: (assisted: boolean) => void;
  onContinue: () => void;
  onLesson: () => void;
}) {
  const sound = useGameSound();
  const particles = useGameParticles();
  const board = useRef<HTMLElement>(null);
  const config = p.activity.puzzle;
  const [state, setState] = useState<PuzzleState>(() => {
    const initial = config
      ? createPuzzle(config)
      : createPuzzle({ kind: "stack", values: [2], target: [2], budget: 3 });
    return (p.run?.commands ?? [])
      .slice(0, 1000)
      .reduce((current, command) => puzzleCommand(current, command), initial);
  });
  const [programCode, setProgramCode] = useState(
    () => p.programState?.code ?? (config?.program ? puzzlePrograms[config.program].starter : ""),
  );
  const [programBlocks, setProgramBlocks] = useState<unknown | null>(
    () => p.programState?.blocks ?? null,
  );
  const [generated, setGenerated] = useState("");
  const [mode, setMode] = useState<"manual" | "blocks" | "python">("manual");
  const [phase, setPhase] = useState<RunPhase>("idle");
  const [line, setLine] = useState(0);
  const [output, setOutput] = useState<string[]>([]);
  const runner = useRef<PythonRunner | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;
  const applyRef = useRef<(command: PuzzleCommand) => void>(() => undefined);
  const saveProgram = (next: { code: string; blocks: unknown | null }) => {
    setProgramCode(next.code);
    setProgramBlocks(next.blocks);
    p.onProgramChange(next);
  };
  const [hintLevel, setHintLevel] = useState(p.run?.assisted ? 1 : 0);
  const [selectedPeg, setSelectedPeg] = useState<number | null>(null);
  const assisted = useRef(p.run?.assisted ?? false);
  const commands = useRef<PuzzleCommand[]>(
    (p.run?.commands ?? []).slice(0, 1000),
  );
  const completeSent = useRef(false);
  const [rewardEarned, setRewardEarned] = useState(false);
  const act = (command: PuzzleCommand) => {
    const current = stateRef.current;
    const next = puzzleCommand(current, command);
    if (!puzzleSolved(current)) {
      if (next.moves === current.moves) sound("error");
      else if (puzzleSolved(next)) sound("success");
      else sound(command.type === "move" ? "move" : "puzzleAction");
      if (next.moves !== current.moves) {
        const rect = board.current?.getBoundingClientRect();
        particles(
          puzzleSolved(next) ? "success" : "train",
          rect
            ? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
            : undefined,
        );
      }
    }
    if (next.moves !== current.moves && commands.current.length < 1000) {
      commands.current = [...commands.current, command];
      p.onRun({ commands: commands.current, assisted: assisted.current });
    }
    stateRef.current = next;
    setState(next);
    return next;
  };
  applyRef.current = act;
  useEffect(() => {
    if (!config?.program) return;
    const instance = new PythonRunner(
      async ({ method, args }) => {
        const result = puzzleProgramCall(
          stateRef.current,
          config.program!,
          method,
          args,
        );
        if (result.command) applyRef.current(result.command);
        return result.value;
      },
      (event) => {
        if (event.phase) setPhase(event.phase);
        if (event.line !== undefined) setLine(event.line);
        if (event.message)
          setOutput((previous) => [...previous.slice(-39), event.message!]);
        if (event.done) setLine(0);
      },
    );
    runner.current = instance;
    return () => {
      instance.dispose();
      if (runner.current === instance) runner.current = null;
    };
  }, [config?.program]);
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
  const label = (value: number) =>
    config.labels?.[config.values.indexOf(value)] ?? String(value);
  const reset = () => {
    runner.current?.stop();
    sound("open");
    commands.current = [];
    assisted.current = false;
    p.onRun({ commands: [], assisted: false });
    const initial = createPuzzle(config);
    stateRef.current = initial;
    setState(initial);
    setHintLevel(0);
    setSelectedPeg(null);
    completeSent.current = false;
    setRewardEarned(false);
  };
  const solved = puzzleSolved(state);
  const routeCoordinates: Record<number, { x: number; y: number }> = {
    1: { x: 65, y: 160 },
    2: { x: 220, y: 65 },
    3: { x: 220, y: 255 },
    4: { x: 400, y: 65 },
    5: { x: 420, y: 255 },
    6: { x: 550, y: 160 },
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
  const puzzleProgram = config.program
    ? puzzlePrograms[config.program]
    : undefined;
  const busy = phase === "loading" || phase === "running" || phase === "paused";
  const runProgram = () => {
    if (!config.program) return;
    const code = mode === "blocks" ? generated : programCode;
    setOutput([]);
    void runner.current?.run(code, puzzleProgram!.api);
  };
  const chooseMode = (next: "manual" | "blocks" | "python") => {
    if (busy) runner.current?.stop();
    setMode(next);
  };
  return (
    <div className="puzzle-backdrop" data-sfx-silent>
      <section className="detective-puzzle" aria-label={p.activity.title}>
        <main className="puzzle-main">
          <p className="puzzle-brief">
            {p.activity.brief ||
              "A damaged trace remains in the system. Reconstruct its sequence to recover the evidence."}
          </p>
          {puzzleProgram && config.program && (
            <section className="puzzle-program" aria-label="Puzzle programming">
              <div className="puzzle-program-modes" role="group" aria-label="Solve mode">
                {(["manual", "blocks", "python"] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={mode === option}
                    onClick={() => chooseMode(option)}
                  >
                    {option === "manual" ? "Manual" : option === "blocks" ? "Blockly" : "Python"}
                  </button>
                ))}
              </div>
              {mode !== "manual" && (
                <div className="puzzle-program-workbench">
                  <div className="puzzle-program-editor">
                    <Suspense fallback={<p>Opening the programming desk…</p>}>
                      {mode === "blocks" ? (
                        <Blocks
                          program={config.program}
                          initial={programBlocks}
                          onChange={(blocks) => {
                            setProgramBlocks(blocks);
                            p.onProgramChange({ code: programCode, blocks });
                          }}
                          onCode={setGenerated}
                        />
                      ) : (
                        <CodeEditor
                          value={programCode}
                          onChange={(code) => {
                            setProgramCode(code);
                            p.onProgramChange({ code, blocks: programBlocks });
                          }}
                          line={line}
                          onRun={runProgram}
                        />
                      )}
                    </Suspense>
                  </div>
                  <div className="puzzle-program-controls">
                    <button
                      className="puzzle-primary"
                      disabled={busy || solved || !(mode === "blocks" ? generated : programCode).trim()}
                      onClick={runProgram}
                    >
                      <Play size={16} /> Run
                    </button>
                    <button
                      disabled={phase !== "running" && phase !== "paused"}
                      onClick={() => phase === "paused" ? runner.current?.resume() : runner.current?.pause()}
                    >
                      <Pause size={16} /> {phase === "paused" ? "Resume" : "Pause"}
                    </button>
                    <button
                      disabled={phase !== "paused"}
                      onClick={() => runner.current?.step()}
                    >
                      <SkipForward size={16} /> Step
                    </button>
                    <button
                      disabled={!busy}
                      onClick={() => runner.current?.stop()}
                    >
                      <Square size={14} /> Stop
                    </button>
                    <span className={`puzzle-runner-status puzzle-runner-${phase}`} role="status">{phase}</span>
                  </div>
                  {output.length > 0 && (
                    <pre className="puzzle-program-output" aria-live="polite">{output.slice(-5).join("\n")}</pre>
                  )}
                  <details className="puzzle-api-reference">
                    <summary>Available puzzle API</summary>
                    <p>{puzzleProgram.reference}</p>
                    {mode === "blocks" && generated && (
                      <>
                        <pre>{generated}</pre>
                        <button
                          type="button"
                          onClick={() => {
                            setProgramCode(generated);
                            p.onProgramChange({ code: generated, blocks: programBlocks });
                            chooseMode("python");
                          }}
                        >
                          Open generated code in Python
                        </button>
                      </>
                    )}
                  </details>
                </div>
              )}
            </section>
          )}
          <section
            ref={board}
            className={`puzzle-board puzzle-${config.kind}`}
            aria-label={`${config.kind} puzzle`}
          >
            {config.kind === "search" && (
              <>
                <p className="board-instruction">
                  Locate record <b>{config.target[0]}</b>. Archive slots are
                  ordered from lowest to highest. Each probe reveals one record.
                </p>
                <div className="search-slots">
                  {config.values.map((value, i) => {
                    const revealed = state.probes.includes(i);
                    const excluded = i < state.low || i > state.high;
                    return (
                      <button
                        key={i}
                        className={`search-slot ${excluded ? "search-excluded" : ""} ${revealed && value === config.target[0] ? "tile-done" : ""}`}
                        aria-label={`Probe slot ${i + 1}${revealed ? `, record ${value}` : ""}${excluded ? ", excluded" : ""}`}
                        disabled={
                          mode !== "manual" || solved || excluded || state.moves >= config.budget
                        }
                        onClick={() => act({ type: "probe", index: i })}
                      >
                        <span>{config.labels?.[i] ?? `Slot ${i + 1}`}</span>
                        <b>{revealed ? value : "?"}</b>
                      </button>
                    );
                  })}
                </div>
                <p className="board-instruction" role="status">
                  {solved
                    ? "Record recovered"
                    : `Remaining range: slots ${state.low + 1}–${state.high + 1}`}
                </p>
              </>
            )}
            {config.kind === "hanoi" && (
              <>
                <p className="board-instruction">
                  Move every disc to peg 3. Only top discs move; larger discs
                  cannot rest on smaller ones. Select a source peg, then a
                  destination.
                </p>
                <div className="transfer-pegs">
                  {state.pegs.map((peg, i) => (
                    <button
                      key={i}
                      className="transfer-peg"
                      aria-label={`Peg ${i + 1}: ${peg.length ? peg.join(", ") + ", bottom to top" : "empty"}${selectedPeg === i ? ", selected" : ""}`}
                      aria-pressed={selectedPeg === i}
                      disabled={mode !== "manual" || solved || state.moves >= config.budget}
                      onClick={() => {
                        if (selectedPeg === null) {
                          if (peg.length) {
                            setSelectedPeg(i);
                            sound("click");
                          }
                        } else if (selectedPeg === i) setSelectedPeg(null);
                        else {
                          act({ type: "transfer", from: selectedPeg, to: i });
                          setSelectedPeg(null);
                        }
                      }}
                    >
                      <span>
                        Peg {i + 1}
                        {i === 2 ? " · target" : ""}
                      </span>
                      <span className="transfer-tower" aria-hidden="true">
                        {[...peg].reverse().map((disc) => (
                          <span
                            className="transfer-disc"
                            key={disc}
                            style={{
                              width: `${35 + (60 * disc) / config.values[0]}%`,
                            }}
                          >
                            {disc}
                          </span>
                        ))}
                        {!peg.length && (
                          <span className="puzzle-empty">empty</span>
                        )}
                      </span>
                    </button>
                  ))}
                </div>
                <p className="board-instruction" role="status">
                  {solved
                    ? "Transfer complete"
                    : selectedPeg === null
                      ? "Select a source peg"
                      : `Peg ${selectedPeg + 1} selected · choose destination, or select again to cancel`}
                </p>
              </>
            )}
            {config.kind === "stack" && (
              <>
                <div className="puzzle-lane">
                  <h2>Incoming trace</h2>
                  <div className="puzzle-tiles">
                    {state.input.map((v, i) => (
                      <span className="puzzle-tile" key={`${i}-${v}`}>
                        {label(v)}
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
                          {label(v)}
                        </span>
                      ))
                    ) : (
                      <span className="stack-empty">empty</span>
                    )}
                    <strong>BASE</strong>
                  </div>
                  <div className="stack-controls">
                    <button
                      disabled={mode !== "manual" || !state.input.length || solved}
                      onClick={() => act({ type: "push" })}
                    >
                      Push next
                    </button>
                    <button
                      disabled={mode !== "manual" || !state.buffer.length || solved}
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
                        {label(v)}
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
                      <span>{label(v)}</span>
                    </div>
                  ))}
                  {!state.input.length && (
                    <span className="puzzle-empty">Queue empty</span>
                  )}
                </div>
                <div className="stack-controls">
                  <button
                    disabled={mode !== "manual" || state.input.length < 2 || solved}
                    onClick={() => act({ type: "rotate" })}
                  >
                    Rotate front to back
                  </button>
                  <button
                    disabled={mode !== "manual" || !state.input.length || solved}
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
                        {label(v)}
                      </span>
                    ))}
                  </div>
                </div>
              </>
            )}
            {config.kind === "sorting" && (
              <>
                <p className="board-instruction">
                  Swap neighboring entries until they match the target order.
                </p>
                <div className="sort-row">
                  {state.input.map((v, i) => (
                    <div className="sort-unit" key={`${i}-${v}`}>
                      <span
                        className={`sort-tile ${v === config.target[i] ? "tile-done" : ""}`}
                      >
                        {label(v)}
                      </span>
                      {i < state.input.length - 1 && (
                        <button
                          aria-label={`Swap positions ${i + 1} and ${i + 2}`}
                          disabled={mode !== "manual" || solved || state.moves >= config.budget}
                          onClick={() => act({ type: "swap", index: i })}
                        >
                          <ArrowLeftRight size={18} aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <p className="sort-target">
                  TARGET <b>{config.target.map(label).join(" · ")}</b>
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
                          </g>
                        );
                      })}
                    </g>
                  </svg>
                  <div className="route-nodes">
                    {routePositions.map(({ node, x, y }) => (
                      <button
                        key={node}
                        className={`${node === config.target[0] ? "route-start" : ""} ${node === config.target[1] ? "route-goal" : ""} ${state.route.includes(node) ? "route-visited" : ""} ${node === currentNode ? "route-current" : ""}`}
                        style={{ left: `${x / 6}%`, top: `${y / 3.2}%` }}
                        aria-label={`${label(node)}${node === currentNode ? ", current location" : ""}`}
                        disabled={
                          mode !== "manual" || solved || !neighbors.some((neighbor) => neighbor.node === node)
                        }
                        onClick={() =>
                          node !== currentNode && act({ type: "move", node })
                        }
                      >
                        {label(node)}
                      </button>
                    ))}
                  </div>
                  <svg
                    className="route-labels"
                    viewBox="0 0 600 320"
                    aria-hidden="true"
                  >
                    {config.edges.map((e, i) => {
                      const a = routePositions.find((n) => n.node === e.from)!;
                      const b = routePositions.find((n) => n.node === e.to)!;
                      const x = (a.x + b.x) / 2;
                      const y = (a.y + b.y) / 2 - 7;
                      return (
                        <g key={i}>
                          <rect
                            x={x - 16}
                            y={y - 12}
                            width="32"
                            height="24"
                            rx="6"
                          />
                          <text x={x} y={y + 6}>
                            {e.cost}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
                <div className="route-status">
                  <span>
                    Current node <b>{label(currentNode)}</b>
                  </span>
                </div>
                <div className="route-neighbors">
                  {neighbors.map(({ node, cost }) => (
                    <button
                      key={node}
                      disabled={mode !== "manual" || solved || state.cost + cost > config.budget}
                      onClick={() => act({ type: "move", node })}
                    >
                      Move to {label(node)} · cost {cost}
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
                  <Check size={18} /> Evidence recovered · Case filed
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
