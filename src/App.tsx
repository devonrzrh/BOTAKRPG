import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  BookOpen,
  Compass,
  Swords,
  Sprout,
  Backpack,
  Settings,
  X,
  ArrowUp,
  ArrowRight,
  ArrowDown,
  ArrowLeft,
  Play,
  Pause,
  Square,
  SkipForward,
  RotateCcw,
  ChevronRight,
  Check,
  Bookmark,
  Search,
  Download,
  Upload,
  Sparkles,
  ArrowUpRight,
  ScrollText,
  Heart,
  Zap,
  Shield,
  GraduationCap,
  Monitor,
  ScanLine,
  FolderSearch,
} from "lucide-react";
import DOMPurify from "dompurify";
import { marked } from "marked";
import rawContent from "./generated/content.json";
import {
  validateContent,
  type Lesson,
  type Question,
  type Quest,
  type Skill,
  type Item,
  type Story,
  type Dialogue as DialogueContent,
} from "./content/schema";
import { Cutscene } from "./ui/Cutscene";
import { Dialogue } from "./ui/Dialogue";
import { MenuBar } from "./ui/MenuBar";
import { HomeBoard } from "./ui/HomeBoard";
import type { HomeWall } from "./world/Office";
import { atGoal, move, shortestPath, type Maze } from "./game/maze";
import {
  addXp,
  claimQuest,
  completeActivity,
  evidence,
  initialSave,
  parseSave,
  recordAnswer,
  stats,
  unlockSkill,
  type Save,
} from "./game/state";
import {
  answerBattle,
  enemyTurn,
  selectSkill,
  useItem,
  type Battle,
} from "./game/combat";
import { activityTemplates } from "./game/activities";
import type { Direction, SceneId } from "./game/contracts";
import { PythonRunner, type RunPhase } from "./runtime/python";
import { loadSave, storeSave } from "./storage";
import type { WorldMetrics } from "./world/World";
const World = lazy(() =>
  import("./world/World").then((module) => ({ default: module.World })),
);
const CodeEditor = lazy(() => import("./ui/CodeEditor"));
const Blocks = lazy(() => import("./ui/Blocks"));
const Garden = lazy(() =>
  import("./ui/Garden").then((module) => ({ default: module.Garden })),
);
const content = validateContent(rawContent);
const createMaze = activityTemplates.maze.create;
const mazeCommand = activityTemplates.maze.command;
const createBattle = activityTemplates.battle.create;
const initialSeed = content.entities.find(
  (e) => e.type === "activity" && e.template === "maze",
);
const defaultSave = () => ({
  ...initialSave(),
  seed: initialSeed?.type === "activity" ? initialSeed.seed : 42,
});
const lessons = content.entities.filter(
  (e): e is Lesson => e.type === "lesson",
);
const questions = content.entities.filter(
  (e): e is Question => e.type === "question",
);
const skills = content.entities.filter((e): e is Skill => e.type === "skill");
const items = content.entities.filter((e): e is Item => e.type === "item");
const quest = content.entities.find((e): e is Quest => e.type === "quest")!;
const story = content.entities.find(
  (e): e is Story => e.id === "rogue-signal" && e.type === "story",
)!;
const dialogueContent = content.entities.filter(
  (e): e is DialogueContent => e.type === "dialogue",
);
const topicNames = {
  algorithms: "Algorithms",
  structures: "Data structures",
  ai: "Connectionist AI",
};
type Panel =
  | "library"
  | "maze"
  | "battle"
  | "garden"
  | "inventory"
  | "journal"
  | "settings"
  | null;
const destinations = [
  {
    id: "library" as const,
    name: "Library",
    icon: BookOpen,
  },
  {
    id: "maze" as const,
    name: "Packet labyrinth",
    icon: Compass,
  },
  {
    id: "battle" as const,
    name: "Sentinel A-03",
    icon: Swords,
  },
  {
    id: "garden" as const,
    name: "Perceptron lab",
    icon: Sprout,
  },
];
export default function App() {
  const [save, setSave] = useState<Save>(defaultSave),
    saveRef = useRef(save),
    [booted, setBooted] = useState(false),
    [storageReady, setStorageReady] = useState(true),
    [saveStatus, setSaveStatus] = useState("Loading journal…");
  const [realm, setRealm] = useState<"desk" | "hub">("desk");
  const [prologueReplay, setPrologueReplay] = useState(false);
  const [homeWall, setHomeWall] = useState<HomeWall>("investigation");
  const [homeMoving, setHomeMoving] = useState(false);
  const [dialogueId, setDialogueId] = useState<string | null>(null);
  const [cutsceneId, setCutsceneId] = useState<string | null>(null);
  const [pendingActivity, setPendingActivity] = useState<string | null>(null);
  useEffect(() => {
    setHomeMoving(true);
    const timer = setTimeout(
      () => setHomeMoving(false),
      save.settings.reducedMotion ? 0 : 420,
    );
    return () => clearTimeout(timer);
  }, [homeWall, save.settings.reducedMotion]);
  useEffect(() => {
    if (
      booted &&
      save.story.prologueSeen &&
      !save.story.briefingSeen &&
      !prologueReplay &&
      !cutsceneId
    )
      setDialogueId("case-briefing");
  }, [
    booted,
    save.story.prologueSeen,
    save.story.briefingSeen,
    prologueReplay,
    cutsceneId,
  ]);
  const [scene, setScene] = useState<SceneId>("desk"),
    [panel, setPanel] = useState<Panel>(null),
    [toast, setToast] = useState(""),
    [metrics, setMetrics] = useState<WorldMetrics | null>(null);
  const [maze, setMaze] = useState<Maze>(() => createMaze(defaultSave().seed)),
    mazeRef = useRef(maze),
    [mazeSession, setMazeSession] = useState(0),
    [mode, setMode] = useState<"manual" | "blocks" | "python">("manual"),
    [generated, setGenerated] = useState(""),
    [line, setLine] = useState(0),
    [phase, setPhase] = useState<RunPhase>("idle"),
    [output, setOutput] = useState<string[]>([]),
    [hint, setHint] = useState(0),
    [trial, setTrial] = useState(false),
    [elapsed, setElapsed] = useState(0),
    trialStart = useRef(0),
    [trialExpired, setTrialExpired] = useState(false);
  const runner = useRef<PythonRunner | null>(null),
    generation = useRef(0),
    runMode = useRef("manual"),
    trialRef = useRef(false);
  const [battle, setBattle] = useState<Battle>(createBattle),
    [answer, setAnswer] = useState<number[]>([]),
    [battleNotice, setBattleNotice] = useState("");
  const [lessonId, setLessonId] = useState(lessons[0].id),
    [search, setSearch] = useState(""),
    [topic, setTopic] = useState("all");
  const [benchmark, setBenchmark] = useState<WorldMetrics[]>([]),
    [benchmarkState, setBenchmarkState] = useState(""),
    benchUntil = useRef(0),
    benchSamples = useRef<WorldMetrics[]>([]);
  const updateSave = useCallback((fn: (previous: Save) => Save) => {
    const next = fn(saveRef.current);
    saveRef.current = next;
    setSave(next);
  }, []);
  const updateMaze = useCallback((next: Maze) => {
    mazeRef.current = next;
    setMaze(next);
  }, []);
  const notify = (message: string) => setToast(message);
  const completedMaze = useRef(false);
  const finishMaze = useCallback(
    (model: Maze, control: string) => {
      if (!atGoal(model) || completedMaze.current) return;
      completedMaze.current = true;
      const timed = trialRef.current,
        seconds = timed ? (performance.now() - trialStart.current) / 1000 : 0;
      if (timed && seconds > 90) return;
      updateSave((previous) => {
        let next = completeActivity(previous, "maze-chamber");
        if (control !== "manual")
          next = evidence(
            next,
            "graph-search",
            `programmed-seed-${model.seed}`,
          );
        if (
          control !== "manual" &&
          model.steps <= shortestPath(model).length &&
          model.commands < 500
        )
          next = evidence(next, "graph-search", "efficient-route");
        if (timed)
          next = {
            ...next,
            trialBest: Math.min(next.trialBest ?? Infinity, seconds),
          };
        return next;
      });
      if (timed) setElapsed(seconds);
      setToast(
        timed
          ? `Trial complete in ${seconds.toFixed(1)} seconds.`
          : "Maze complete.",
      );
    },
    [updateSave],
  );
  useEffect(() => {
    let active = true;
    void loadSave()
      .then((raw) => {
        if (!active) return;
        if (raw) {
          try {
            const loaded = parseSave(raw, content);
            saveRef.current = loaded;
            setSave(loaded);
            updateMaze(createMaze(loaded.seed));
            setSaveStatus("Journal restored");
          } catch {
            setStorageReady(false);
            setSaveStatus(
              "Saved journal is invalid. Export it below before replacing it.",
            );
          }
        } else setSaveStatus("Local journal ready");
      })
      .catch(() => {
        if (active) {
          setStorageReady(false);
          setSaveStatus(
            "Browser storage unavailable. Use export to keep progress.",
          );
        }
      })
      .finally(() => {
        if (active) setBooted(true);
      });
    return () => {
      active = false;
    };
  }, [updateMaze]);
  useEffect(() => {
    if (!booted || !storageReady) return;
    const timeout = setTimeout(() => {
      void storeSave(save)
        .then(() => setSaveStatus("All progress saved locally"))
        .catch(() => {
          setSaveStatus("Save failed. Export your progress to keep it.");
        });
    }, 450);
    return () => clearTimeout(timeout);
  }, [save, booted, storageReady]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 6500);
    return () => clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    runner.current = new PythonRunner(
      async (command) => {
        const current = generation.current;
        await new Promise((resolve) =>
          setTimeout(resolve, command.method === "move" ? 110 : 8),
        );
        if (
          current !== generation.current ||
          !runner.current ||
          !["running", "paused"].includes(runner.current.phase)
        )
          throw new Error("Run cancelled");
        const result = mazeCommand(
          mazeRef.current,
          command.method,
          command.args,
        );
        updateMaze(result.maze);
        finishMaze(result.maze, runMode.current);
        return result.value;
      },
      (event) => {
        if (event.phase) setPhase(event.phase);
        if (event.line !== undefined) setLine(event.line);
        if (event.message)
          setOutput((previous) => [...previous.slice(-79), event.message!]);
        if (event.done) setLine(0);
      },
    );
    return () => runner.current?.dispose();
  }, [finishMaze, updateMaze]);
  useEffect(() => {
    if (!trial || completedMaze.current) return;
    const timer = setInterval(() => {
      if (completedMaze.current) {
        clearInterval(timer);
        return;
      }
      const seconds = (performance.now() - trialStart.current) / 1000;
      setElapsed(seconds);
      if (seconds >= 90) {
        setTrialExpired(true);
        generation.current++;
        runner.current?.reset();
        notify("Time’s up. Retry this seed or return to untimed exploration.");
        clearInterval(timer);
      }
    }, 250);
    return () => clearInterval(timer);
  }, [trial, mazeSession]);
  const busy = phase === "loading" || phase === "running" || phase === "paused";
  const stop = () => {
    generation.current++;
    runner.current?.reset();
    setLine(0);
  };
  const resetMaze = (seed = mazeRef.current.seed, timed = trialRef.current) => {
    stop();
    completedMaze.current = false;
    setMazeSession((n) => n + 1);
    setTrialExpired(false);
    setHint(0);
    setElapsed(0);
    setTrial(timed);
    trialRef.current = timed;
    trialStart.current = performance.now();
    updateMaze(createMaze(seed));
    setOutput([]);
  };
  const open = useCallback(
    (id: string) => {
      if (id === "exit") return;
      generation.current++;
      runner.current?.reset();
      setLine(0);
      if (id === "briefing") {
        setDialogueId("case-briefing");
        return;
      }
      if (id === "intro") {
        setPrologueReplay(true);
        return;
      }
      if (id === "network") {
        if (!saveRef.current.story.caseAccepted) {
          setDialogueId("case-briefing");
          return;
        }
        if (!saveRef.current.story.networkIntroSeen) {
          setCutsceneId("first-connection");
          return;
        }
        setRealm("hub");
        setScene("hub");
        setPanel(null);
        setTrial(false);
        trialRef.current = false;
        return;
      }
      if (["desk", "library", "quest", "journal", "inventory"].includes(id)) {
        const wall: HomeWall =
          id === "library"
            ? "bookshelf"
            : id === "quest" || id === "journal"
              ? "quests"
              : id === "inventory"
                ? "desk"
                : "investigation";
        setHomeWall(wall);
        setRealm("desk");
        setScene("desk");
        setPanel(
          id === "desk" ? null : id === "quest" ? "journal" : (id as Panel),
        );
        setTrial(false);
        trialRef.current = false;
        return;
      }
      if (
        ["battle", "maze", "garden"].includes(id) &&
        !saveRef.current.story.caseAccepted
      ) {
        setDialogueId("case-briefing");
        return;
      }
      if (
        ["battle", "maze", "garden"].includes(id) &&
        !saveRef.current.story.networkIntroSeen
      ) {
        setPendingActivity(id);
        setCutsceneId("first-connection");
        return;
      }
      if (id === "maze") {
        setRealm("hub");
        setScene("maze");
        setPanel("maze");
      } else {
        if (id === "battle" || id === "garden") setRealm("hub");
        setScene(id === "battle" || id === "garden" ? "hub" : realm);
        setPanel(id as Panel);
        if (id === "battle") {
          setBattle(createBattle());
          setAnswer([]);
          setBattleNotice("");
        }
      }
      if (id !== "maze") {
        setTrial(false);
        trialRef.current = false;
      }
    },
    [realm],
  );
  const close = () => {
    stop();
    setPanel(null);
    setScene(realm);
    if (realm === "desk") setHomeWall("investigation");
    setTrial(false);
    trialRef.current = false;
  };
  useEffect(() => {
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !event.target?.toString().includes("SVG"))
        close();
    };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, [realm]);
  const manualMove = useCallback(
    (direction: Direction) => {
      if (
        runner.current &&
        ["running", "paused", "loading"].includes(runner.current.phase)
      )
        return;
      if (trialRef.current && performance.now() - trialStart.current > 90000)
        return;
      const next = move(mazeRef.current, direction);
      updateMaze(next);
      finishMaze(next, "manual");
    },
    [finishMaze, updateMaze],
  );
  const run = () => {
    if (busy || trialExpired) return;
    generation.current++;
    completedMaze.current = false;
    updateMaze(createMaze(mazeRef.current.seed));
    setOutput([]);
    setLine(0);
    runMode.current = mode;
    void runner.current?.run(
      mode === "blocks" ? generated : saveRef.current.code,
    );
  };
  const openLesson = (id: string) => {
    setLessonId(id);
    open("library");
  };
  const applyBattle = (nextBattle: Battle, nextSave: Save) => {
    if (nextBattle.phase === "won") {
      const first = !nextSave.completed.includes("guardian-battle");
      nextSave = completeActivity(nextSave, "guardian-battle");
      if (first) nextSave = addXp(nextSave, 20);
    }
    setBattle(nextBattle);
    updateSave(() => nextSave);
  };
  const submitAnswer = () => {
    try {
      const result = answerBattle(battle, saveRef.current, content, answer);
      const q = questions.find((q) => q.id === battle.question)!;
      const next = recordAnswer(
        result.save,
        q.lesson,
        q.id,
        result.correct,
        battle.assisted,
      );
      applyBattle(result.battle, next);
      setBattleNotice(result.correct ? "Correct" : "Incorrect · turn spent");
    } catch (e) {
      notify(String(e));
    }
  };
  const exportSave = () => {
    const blob = new Blob([JSON.stringify(saveRef.current, null, 2)], {
        type: "application/json",
      }),
      url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = "botak-journal.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const importSave = async (file: File) => {
    try {
      if (file.size > 1500000) throw new Error("Save file is too large");
      const parsed = parseSave(JSON.parse(await file.text()), content);
      await storeSave(parsed);
      stop();
      updateSave(() => parsed);
      updateMaze(createMaze(parsed.seed));
      setStorageReady(true);
      setPanel("settings");
      setRealm("desk");
      setScene("desk");
      setTrial(false);
      trialRef.current = false;
      notify("Journal imported and saved.");
    } catch (e) {
      notify(`Import rejected. Existing progress is unchanged. ${String(e)}`);
    }
  };
  const onMetrics = useCallback((value: WorldMetrics) => {
    setMetrics(value);
    if (benchUntil.current) {
      benchSamples.current.push(value);
      if (performance.now() >= benchUntil.current) {
        const list = benchSamples.current;
        const frames = list
          .flatMap((sample) => sample.frameTimes)
          .sort((a, b) => a - b);
        const average =
          frames.reduce((sum, frame) => sum + frame, 0) / frames.length;
        const result = {
          ...value,
          fps: Math.round(1000 / average),
          frameMs: Math.round(average * 10) / 10,
          p95:
            Math.round((frames[Math.floor(frames.length * 0.95)] ?? 0) * 10) /
            10,
          samples: frames.length,
          frameTimes: [],
        };
        setBenchmark((old) => [...old, result]);
        setBenchmarkState(
          "Measurement complete. Select the other renderer to compare.",
        );
        benchUntil.current = 0;
      }
    }
  }, []);
  const characterStats = stats(save, content),
    currentLesson = lessons.find((l) => l.id === lessonId)!,
    currentQuestion = questions.find((q) => q.id === battle.question);
  const done = quest.objectives.filter((id) =>
    save.completed.includes(id),
  ).length;
  return (
    <div
      className={`app ${realm === "desk" ? "home-view" : "network-view"} ${homeMoving && realm === "desk" ? "home-panning" : ""} ${save.settings.reducedMotion ? "reduced-motion" : ""}`}
    >
      <header className="topbar">
        <a
          className="brand"
          href="#"
          onClick={(event) => {
            event.preventDefault();
            open("desk");
          }}
        >
          <span className="brand-mark">
            <ScanLine size={25} />
          </span>
          <span>NULL / TRACE</span>
        </a>
        <MenuBar onSelect={open} />
        <div className="chapter">
          <span className="chapter-dot" />
          CASE 007 <span className="top-divider">/</span> ECHO-7
        </div>
        <div className="top-actions">
          <span className="save-status">
            <span />
            {saveStatus === "All progress saved locally"
              ? "Journal saved"
              : saveStatus}
          </span>
          <button
            className="icon-button"
            aria-label="Open settings"
            onClick={() => open("settings")}
          >
            <Settings size={19} />
          </button>
          <button
            className="avatar"
            aria-label="Open character"
            onClick={() => open("inventory")}
          >
            V
          </button>
        </div>
      </header>
      {!booted && (
        <div className="boot-screen" role="status">
          Loading journal…
        </div>
      )}
      <aside className="rail" aria-label="Investigation navigation">
        <button
          className={!panel ? "active" : ""}
          title="Detective's desk"
          aria-label="Detective's desk"
          onClick={() => open("desk")}
        >
          <Compass />
        </button>
        <div className="rail-divider" />
        <button
          aria-label="Enter the network"
          title="Enter the network"
          onClick={() => open("network")}
        >
          <Monitor size={21} />
        </button>
        {destinations
          .filter((d) => d.id !== "battle")
          .map((d) => (
            <button
              key={d.id}
              className={panel === d.id ? "active" : ""}
              title={d.name}
              aria-label={`Open ${d.name}`}
              onClick={() => open(d.id)}
            >
              <d.icon size={21} />
            </button>
          ))}
        <div className="rail-spacer" />
        <button
          aria-label="Open inventory and skills"
          className={panel === "inventory" ? "active" : ""}
          onClick={() => open("inventory")}
        >
          <Backpack size={21} />
        </button>
        <button
          aria-label="Open quest journal"
          className={panel === "journal" ? "active" : ""}
          onClick={() => open("journal")}
        >
          <ScrollText size={21} />
        </button>
      </aside>
      <main
        className="world-shell"
        onPointerMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          const factor = save.settings.reducedMotion || homeMoving ? 0 : 1;
          e.currentTarget.style.setProperty(
            "--look-x",
            String(((e.clientX - r.left) / r.width - 0.5) * factor),
          );
          e.currentTarget.style.setProperty(
            "--look-y",
            String(((e.clientY - r.top) / r.height - 0.5) * factor),
          );
        }}
        onPointerLeave={(e) => {
          e.currentTarget.style.setProperty("--look-x", "0");
          e.currentTarget.style.setProperty("--look-y", "0");
        }}
      >
        <Suspense
          fallback={<div className="world-notice">Establishing the scene…</div>}
        >
          <World
            scene={scene}
            homeWall={homeWall}
            homeLookLocked={
              !save.story.prologueSeen ||
              prologueReplay ||
              Boolean(dialogueId) ||
              Boolean(cutsceneId)
            }
            encounter={panel === "battle"}
            maze={maze}
            renderer={save.settings.renderer}
            reducedMotion={save.settings.reducedMotion}
            locked={
              (panel !== null && panel !== "maze") ||
              busy ||
              (scene === "maze" && mode !== "manual") ||
              trialExpired ||
              !save.story.prologueSeen ||
              prologueReplay ||
              Boolean(dialogueId) ||
              Boolean(cutsceneId)
            }
            onInteract={open}
            onMove={manualMove}
            onMetrics={onMetrics}
          />
        </Suspense>
        {realm === "desk" && !panel && !homeMoving && (
          <HomeBoard
            onSelect={open}
            accepted={save.story.caseAccepted}
            completed={save.completed.filter((id) =>
              quest.objectives.includes(id),
            )}
          />
        )}
        {homeMoving && realm === "desk" && (
          <span className="pan-status" role="status">
            Turning…
          </span>
        )}
        {!panel && realm !== "desk" && (
          <>
            <div className="scene-heading">
              <h1>Network gateway</h1>
            </div>
            <div className="world-caption">
              <span className="live-dot" /> ONLINE / THE TRANSIT NETWORK{" "}
              <span>01 / THE GATEWAY</span>
            </div>
          </>
        )}
        {panel && !(realm === "desk" && homeMoving) && (
          <section
            className={`activity-panel ${realm === "desk" ? `home-panel home-${homeWall}` : ""} ${panel === "maze" ? "maze-panel" : ""} ${panel === "battle" ? "battle-panel" : ""}`}
            aria-label={`${panel} activity`}
          >
            <header className="panel-header">
              <div>
                <h2>
                  {
                    {
                      library: "Library",
                      maze: "Packet labyrinth",
                      battle: "Sentinel A-03",
                      garden: "Perceptron lab",
                      inventory: "Equipment & skills",
                      journal: "Quest board",
                      settings: "Settings",
                    }[panel]
                  }
                </h2>
              </div>
              <button
                className="icon-button"
                aria-label={
                  realm === "desk" ? "Return to desk" : "Return to network"
                }
                onClick={close}
              >
                <X size={21} />
              </button>
            </header>
            {panel === "library" && (
              <div className="library-layout">
                <nav className="library-nav" aria-label="Library lessons">
                  <label className="search">
                    <Search size={17} />
                    <input
                      placeholder="Search the archive…"
                      aria-label="Search lessons"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </label>
                  <select
                    aria-label="Filter by topic"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                  >
                    <option value="all">All disciplines</option>
                    {Object.entries(topicNames).map(([key, name]) => (
                      <option key={key} value={key}>
                        {name}
                      </option>
                    ))}
                  </select>
                  {lessons
                    .filter(
                      (l) =>
                        (topic === "all" || l.topic === topic) &&
                        `${l.title} ${l.summary} ${l.body}`
                          .toLowerCase()
                          .includes(search.toLowerCase()),
                    )
                    .map((lesson, index) => (
                      <button
                        key={lesson.id}
                        className={`lesson-link ${lessonId === lesson.id ? "selected" : ""}`}
                        onClick={() => setLessonId(lesson.id)}
                      >
                        <span>
                          0{index + 1} · {topicNames[lesson.topic]}
                        </span>
                        <strong>{lesson.title}</strong>
                        <small>{lesson.summary}</small>
                        {save.bookmarks.includes(lesson.id) && (
                          <Bookmark size={13} />
                        )}
                      </button>
                    ))}
                </nav>
                <article className="lesson-body">
                  <div className="lesson-top">
                    <span className="pill">
                      {topicNames[currentLesson.topic]}
                    </span>
                    <button
                      className="text-button"
                      onClick={() =>
                        updateSave((s) => ({
                          ...s,
                          bookmarks: s.bookmarks.includes(lessonId)
                            ? s.bookmarks.filter((id) => id !== lessonId)
                            : [...s.bookmarks, lessonId],
                        }))
                      }
                    >
                      <Bookmark
                        size={15}
                        fill={
                          save.bookmarks.includes(lessonId)
                            ? "currentColor"
                            : "none"
                        }
                      />
                      {save.bookmarks.includes(lessonId)
                        ? "Bookmarked"
                        : "Bookmark"}
                    </button>
                  </div>
                  {currentLesson.prerequisites.length > 0 && (
                    <p className="prerequisite">
                      Builds on{" "}
                      {currentLesson.prerequisites.map((id) => (
                        <button key={id} onClick={() => setLessonId(id)}>
                          {lessons.find((l) => l.id === id)?.title}
                        </button>
                      ))}
                    </p>
                  )}
                  <div
                    className="markdown"
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(
                        marked.parse(currentLesson.body, {
                          async: false,
                        }) as string,
                      ),
                    }}
                  />
                  <label className="notes-label">
                    NOTES
                    <textarea
                      placeholder="Add a note…"
                      value={save.notes[lessonId] ?? ""}
                      onChange={(e) =>
                        updateSave((s) => ({
                          ...s,
                          notes: { ...s.notes, [lessonId]: e.target.value },
                        }))
                      }
                    />
                  </label>
                  <button
                    className="primary"
                    onClick={() =>
                      open(
                        currentLesson.topic === "ai"
                          ? "garden"
                          : currentLesson.topic === "structures"
                            ? "battle"
                            : "maze",
                      )
                    }
                  >
                    Open activity <ArrowUpRight size={16} />
                  </button>
                </article>
              </div>
            )}
            {panel === "maze" && (
              <div className="maze-content">
                <div className="maze-summary">
                  <span className="pill">SEED {maze.seed}</span>
                  <span>
                    {maze.steps} steps · {maze.commands} commands
                  </span>
                  {trial && (
                    <strong className={trialExpired ? "danger" : ""}>
                      {Math.max(0, 90 - elapsed).toFixed(1)}s
                    </strong>
                  )}
                  {atGoal(maze) && (
                    <span className="success">
                      <Check size={15} /> Exit reached
                    </span>
                  )}
                </div>
                <div className="segmented">
                  <button
                    className={mode === "manual" ? "selected" : ""}
                    disabled={busy}
                    onClick={() => setMode("manual")}
                  >
                    Explore manually
                  </button>
                  <button
                    className={mode === "blocks" ? "selected" : ""}
                    disabled={busy}
                    onClick={() => setMode("blocks")}
                  >
                    Visual blocks
                  </button>
                  <button
                    className={mode === "python" ? "selected" : ""}
                    disabled={busy}
                    onClick={() => setMode("python")}
                  >
                    Python
                  </button>
                </div>
                {mode === "manual" ? (
                  <>
                    <div
                      className="maze-map"
                      role="img"
                      aria-label={`Maze map. Player at ${maze.position.join(",")}, exit at ${maze.goal.join(",")}.`}
                      style={{
                        gridTemplateColumns: `repeat(${maze.size},1fr)`,
                      }}
                    >
                      {maze.grid.flatMap((row, y) =>
                        row.map((wall, x) => (
                          <span
                            key={`${x}-${y}`}
                            className={`${wall ? "wall" : "path"} ${maze.position[0] === x && maze.position[1] === y ? "player" : ""} ${maze.goal[0] === x && maze.goal[1] === y ? "exit" : ""}`}
                          >
                            {maze.position[0] === x && maze.position[1] === y
                              ? "●"
                              : maze.goal[0] === x && maze.goal[1] === y
                                ? "◇"
                                : ""}
                          </span>
                        )),
                      )}
                    </div>
                    <p className="muted small">
                      Find the amber seal. WASD / arrows or the controls below.
                    </p>
                    <div className="dpad">
                      {(
                        [
                          ["north", ArrowUp],
                          ["west", ArrowLeft],
                          ["south", ArrowDown],
                          ["east", ArrowRight],
                        ] as const
                      ).map(([d, Icon]) => (
                        <button
                          key={d}
                          disabled={trialExpired}
                          aria-label={`Move ${d}`}
                          onClick={() => manualMove(d)}
                        >
                          <Icon size={18} />
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="program-workspace">
                      <Suspense fallback={<p>Opening the programming desk…</p>}>
                        {mode === "blocks" ? (
                          <Blocks
                            initial={save.blocks}
                            onChange={(blocks) =>
                              updateSave((s) => ({ ...s, blocks }))
                            }
                            onCode={setGenerated}
                          />
                        ) : (
                          <CodeEditor
                            value={save.code}
                            onChange={(code) =>
                              updateSave((s) => ({ ...s, code }))
                            }
                            line={line}
                            onRun={run}
                          />
                        )}
                      </Suspense>
                    </div>
                    {mode === "blocks" && (
                      <details className="generated-code">
                        <summary>Inspect generated Python</summary>
                        <pre>
                          {generated || "# Add blocks to make a program."}
                        </pre>
                        <button
                          onClick={() => {
                            updateSave((s) => ({ ...s, code: generated }));
                            setMode("python");
                          }}
                        >
                          Copy to Python editor
                        </button>
                      </details>
                    )}
                    <div className="run-controls">
                      <button
                        className="primary"
                        disabled={busy || trialExpired}
                        onClick={run}
                      >
                        <Play size={15} />
                        Run
                      </button>
                      <button
                        disabled={phase !== "running" && phase !== "paused"}
                        onClick={() =>
                          phase === "paused"
                            ? runner.current?.resume()
                            : runner.current?.pause()
                        }
                      >
                        <Pause size={15} />
                        {phase === "paused" ? "Resume" : "Pause"}
                      </button>
                      <button
                        disabled={phase !== "paused"}
                        onClick={() => runner.current?.step()}
                        title="Execute one Python line"
                      >
                        <SkipForward size={15} />
                        Step
                      </button>
                      <button
                        disabled={!busy}
                        onClick={() => {
                          generation.current++;
                          runner.current?.stop();
                        }}
                      >
                        <Square size={13} />
                        Stop
                      </button>
                      <span className="runner-status">
                        {phase}
                        {line > 0 ? ` · line ${line}` : ""}
                      </span>
                    </div>
                    <pre
                      className="terminal"
                      aria-label="Python output"
                      aria-live="polite"
                    >
                      {output.join("\n") ||
                        "Your observations will appear here. Ctrl+Enter to run."}
                    </pre>
                  </>
                )}
                <div className="maze-footer">
                  <button disabled={busy} onClick={() => resetMaze()}>
                    <RotateCcw size={14} />
                    Reset maze
                  </button>
                  <button
                    disabled={busy}
                    onClick={() => {
                      const seed = (maze.seed + 7919) % 2147483647;
                      updateSave((s) => ({ ...s, seed }));
                      resetMaze(seed);
                    }}
                  >
                    New seed
                  </button>
                  <button
                    className="text-button"
                    onClick={() => setHint((n) => Math.min(3, n + 1))}
                  >
                    Hint
                  </button>
                </div>
                {hint > 0 && (
                  <p className="hint">
                    {
                      [
                        "",
                        "Start by looking at your neighbors. Keep track of cells you have already visited.",
                        "BFS uses a queue. Store each cell together with the route that reached it.",
                        "The graph-search library entry includes a complete BFS example. Run it, trace it, then try adapting it to a stack.",
                      ][hint]
                    }
                  </p>
                )}
                <button
                  className="text-button"
                  onClick={() => openLesson("graph-search")}
                >
                  Graph-search lesson ↗
                </button>
                {save.completed.includes("maze-chamber") && (
                  <button
                    className="trial-button"
                    onClick={() =>
                      resetMaze((maze.seed + 31) % 2147483647, !trial)
                    }
                  >
                    {trial
                      ? "Return to untimed exploration"
                      : "Try a fresh 90-second trial"}
                    {save.trialBest !== null &&
                      ` · best ${save.trialBest.toFixed(1)}s`}
                  </button>
                )}
              </div>
            )}
            {panel === "battle" && (
              <div className="combat-layout">
                <div className="enemy-card">
                  <span className="pill">GATEWAY SECURITY · LV. 1</span>
                  <div className="guardian-portrait">
                    <div className="guardian-head">
                      <i />
                    </div>
                    <div className="guardian-body" />
                    <span>✦</span>
                  </div>
                  <div className="bar enemy">
                    <i
                      style={{ width: `${(battle.hp / battle.maxHp) * 100}%` }}
                    />
                  </div>
                  <small>
                    {battle.hp} / {battle.maxHp} HP
                  </small>
                  <div className="effect-list">
                    {battle.effects.map((effect) => (
                      <span className="pill" key={effect.id}>
                        {effect.id} · {effect.remaining}
                      </span>
                    ))}
                  </div>
                  <div className="combat-log" aria-live="polite">
                    {battle.log.slice(-5).map((message, i) => (
                      <p key={`${battle.turn}-${i}`}>{message}</p>
                    ))}
                  </div>
                </div>
                <div className="combat-actions">
                  <div className="section-eyebrow">
                    TURN {battle.turn} · YOUR MOVE
                  </div>
                  {battle.phase === "choose" && (
                    <>
                      <h2>Choose a skill</h2>
                      <div className="skill-list">
                        {skills
                          .filter((skill) =>
                            save.character.skills.includes(skill.id),
                          )
                          .map((skill) => (
                            <button
                              key={skill.id}
                              disabled={
                                save.character.focus < skill.cost ||
                                save.character.hp === 0
                              }
                              onClick={() => {
                                try {
                                  setBattle(
                                    selectSkill(
                                      battle,
                                      saveRef.current,
                                      skill,
                                      questions,
                                    ),
                                  );
                                  setAnswer([]);
                                  setBattleNotice("");
                                } catch (e) {
                                  notify(String(e));
                                }
                              }}
                            >
                              <span className="skill-icon">
                                {skill.effect === "shield" ? (
                                  <Shield size={20} />
                                ) : (
                                  <Sparkles size={20} />
                                )}
                              </span>
                              <span>
                                <strong>{skill.title}</strong>
                                <small>{skill.description}</small>
                              </span>
                              <b>{skill.cost} FP</b>
                            </button>
                          ))}
                      </div>
                      <h4>ITEMS · USES ONE TURN</h4>
                      <div className="consumables">
                        {items
                          .filter((item) => item.kind !== "equipment")
                          .map((item) => (
                            <button
                              key={item.id}
                              disabled={!save.inventory[item.id]}
                              onClick={() => {
                                try {
                                  const result = useItem(
                                    battle,
                                    saveRef.current,
                                    item,
                                    content,
                                  );
                                  applyBattle(result.battle, result.save);
                                } catch (e) {
                                  notify(String(e));
                                }
                              }}
                            >
                              {item.title}{" "}
                              <span>×{save.inventory[item.id] ?? 0}</span>
                            </button>
                          ))}
                      </div>
                      {save.character.hp === 0 && (
                        <button className="primary" onClick={close}>
                          Return & recover
                        </button>
                      )}
                    </>
                  )}
                  {battle.phase === "question" && currentQuestion && (
                    <>
                      <span className="pill">
                        {
                          topicNames[
                            lessons.find(
                              (l) => l.id === currentQuestion.lesson,
                            )!.topic
                          ]
                        }
                      </span>
                      <h2>{currentQuestion.prompt}</h2>
                      <p className="muted">
                        {currentQuestion.format === "ordering"
                          ? "Select each step in the correct order."
                          : "Choose one answer."}
                      </p>
                      <div className="answer-options">
                        {currentQuestion.options
                          .map((text, index) => ({ text, index }))
                          .sort((a, b) =>
                            currentQuestion.format === "ordering"
                              ? ((a.index + 2) %
                                  currentQuestion.options.length) -
                                ((b.index + 2) % currentQuestion.options.length)
                              : a.index - b.index,
                          )
                          .map(({ text, index }) => (
                            <button
                              key={index}
                              className={
                                answer.includes(index) ? "selected" : ""
                              }
                              onClick={() =>
                                setAnswer(
                                  currentQuestion.format === "choice"
                                    ? [index]
                                    : answer.includes(index)
                                      ? answer.filter((x) => x !== index)
                                      : [...answer, index],
                                )
                              }
                            >
                              <span>
                                {currentQuestion.format === "ordering"
                                  ? answer.includes(index)
                                    ? answer.indexOf(index) + 1
                                    : "·"
                                  : String.fromCharCode(65 + index)}
                              </span>
                              {text}
                            </button>
                          ))}
                      </div>
                      <button
                        className="primary"
                        disabled={
                          currentQuestion.format === "choice"
                            ? answer.length !== 1
                            : answer.length !== currentQuestion.options.length
                        }
                        onClick={submitAnswer}
                      >
                        Submit <ArrowRight size={16} />
                      </button>
                      <button
                        className="text-button"
                        onClick={() => {
                          setBattle((b) => ({ ...b, assisted: true }));
                          setBattleNotice(currentQuestion.explanation);
                        }}
                      >
                        Hint · no mastery credit
                      </button>
                      {battleNotice && (
                        <p className="feedback">{battleNotice}</p>
                      )}
                    </>
                  )}
                  {battle.phase === "feedback" && (
                    <>
                      <span className="result-mark">
                        <Sparkles />
                      </span>
                      <h2>{battleNotice}</h2>
                      <p className="feedback">{currentQuestion?.explanation}</p>
                      <button
                        className="text-button"
                        onClick={() => {
                          setLessonId(currentQuestion!.lesson);
                          notify("Lesson saved for review after battle.");
                        }}
                      >
                        Review lesson later
                      </button>
                      <button
                        className="primary"
                        onClick={() => {
                          const result = enemyTurn(
                            battle,
                            saveRef.current,
                            content,
                          );
                          applyBattle(result.battle, result.save);
                          setAnswer([]);
                        }}
                      >
                        Enemy turn <ArrowRight size={16} />
                      </button>
                    </>
                  )}
                  {battle.phase === "won" && (
                    <div className="result-screen">
                      <span className="result-mark">
                        <Check size={30} />
                      </span>
                      <h2>Sentinel defeated</h2>
                      <p>ECHO-7’s route fragment recovered.</p>
                      <button
                        className="primary"
                        onClick={() => open("journal")}
                      >
                        Caseboard
                      </button>
                      <button onClick={close}>Return to network</button>
                    </div>
                  )}
                  {battle.phase === "lost" && (
                    <div className="result-screen">
                      <h2>Connection lost</h2>
                      <p>Progress saved. Recover before retrying.</p>
                      <button
                        className="primary"
                        onClick={() => {
                          updateSave((s) => ({
                            ...s,
                            character: {
                              ...s.character,
                              hp: stats(s).maxHp,
                              focus: stats(s).maxFocus,
                            },
                          }));
                          close();
                          notify("Health and focus restored.");
                        }}
                      >
                        Return & recover
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
            {panel === "garden" && (
              <Suspense fallback={<p>Opening the exhibit…</p>}>
                <Garden
                  onComplete={() => {
                    updateSave((s) =>
                      evidence(
                        completeActivity(s, "perceptron-exhibit"),
                        "perceptron-basics",
                        "held-out-boundary",
                      ),
                    );
                    notify("Perceptron objective complete.");
                  }}
                  onLesson={() => openLesson("perceptron-basics")}
                />
              </Suspense>
            )}
            {panel === "journal" && (
              <div className="journal-content">
                <span className="pill">CASE 007 · ACTIVE INVESTIGATION</span>
                <div className="case-summary">
                  <div className="suspect-file">
                    <ScanLine size={34} />
                    <strong>ECHO-7</strong>
                    <small>MISSING</small>
                  </div>
                  <div>
                    <h3>Suspect: ECHO-7</h3>
                    <p>
                      Escaped through a maintenance terminal. Trace its network
                      route.
                    </p>
                    <button
                      className="text-button"
                      onClick={() => setPrologueReplay(true)}
                    >
                      Replay prologue ↗
                    </button>
                  </div>
                </div>
                <h2>{quest.title}</h2>
                {!save.story.caseAccepted && (
                  <button
                    className="primary"
                    onClick={() => setDialogueId("case-briefing")}
                  >
                    Accept case
                  </button>
                )}
                <p>{quest.description}</p>
                <div className="quest-objectives">
                  {quest.objectives.map((id) => (
                    <button
                      key={id}
                      disabled={!save.story.caseAccepted}
                      onClick={() =>
                        open(
                          id === "maze-chamber"
                            ? "maze"
                            : id === "guardian-battle"
                              ? "battle"
                              : "garden",
                        )
                      }
                    >
                      <span
                        className={`objective-check ${save.completed.includes(id) ? "done" : ""}`}
                      >
                        {save.completed.includes(id) ? <Check size={15} /> : ""}
                      </span>
                      <span>
                        <strong>
                          {content.entities.find((e) => e.id === id)?.title}
                        </strong>
                        <small>
                          {save.completed.includes(id)
                            ? "Complete"
                            : "Incomplete"}
                        </small>
                      </span>
                      <ArrowUpRight size={17} />
                    </button>
                  ))}
                </div>
                <div className="quest-reward">
                  <Sparkles />
                  <span>
                    <strong>{quest.xp} XP · Trace amplifier</strong>
                    <small>Level 2 unlocks more skills.</small>
                  </span>
                </div>
                <button
                  className="primary"
                  disabled={done !== 3 || save.claimed.includes(quest.id)}
                  onClick={() => {
                    updateSave((s) => claimQuest(s, quest));
                    notify(
                      "Level 2. Trace amplifier and new skills available.",
                    );
                  }}
                >
                  {save.claimed.includes(quest.id)
                    ? "Reward claimed"
                    : done === 3
                      ? "Claim reward"
                      : `${done} / 3 objectives complete`}
                </button>
                {save.claimed.includes(quest.id) && (
                  <div className="case-next-lead">
                    <h3>Next lead: abandoned subnet</h3>
                    <p>End of the playable chapter.</p>
                  </div>
                )}
                {content.entities.some(
                  (e) =>
                    e.type === "activity" &&
                    e.clue &&
                    save.completed.includes(e.id),
                ) && (
                  <section
                    className="recovered-clues"
                    aria-label="Recovered clues"
                  >
                    <h3>Clues</h3>
                    {content.entities
                      .filter(
                        (e) =>
                          e.type === "activity" &&
                          e.clue &&
                          save.completed.includes(e.id),
                      )
                      .map(
                        (e) =>
                          e.type === "activity" &&
                          e.clue && (
                            <article key={e.id}>
                              <strong>{e.clue.title}</strong>
                              <p>{e.clue.text}</p>
                            </article>
                          ),
                      )}
                  </section>
                )}
                <h3>Topic mastery</h3>
                <div className="knowledge-map">
                  {lessons.map((l) => (
                    <button key={l.id} onClick={() => openLesson(l.id)}>
                      <span className="pill">{topicNames[l.topic]}</span>
                      <strong>{l.title}</strong>
                      <small>
                        {save.mastery[l.id]?.correct ?? 0} unique unaided
                        answers · {save.mastery[l.id]?.evidence.length ?? 0}{" "}
                        practical proofs
                      </small>
                      {l.prerequisites.length > 0 && (
                        <small>
                          Builds on{" "}
                          {l.prerequisites
                            .map(
                              (id) => lessons.find((x) => x.id === id)?.title,
                            )
                            .join(", ")}
                        </small>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {panel === "inventory" && (
              <div className="inventory-content">
                <div className="character-banner">
                  <span className="character-sigil">
                    <GraduationCap size={42} />
                  </span>
                  <div>
                    <span className="section-eyebrow">
                      LEVEL {save.character.level} · NETWORK INVESTIGATOR
                    </span>
                    <h2>{save.character.name}</h2>
                    <p>
                      {save.character.xp} total XP ·{" "}
                      {100 - (save.character.xp % 100)} XP to next level
                    </p>
                  </div>
                </div>
                <div className="stat-grid">
                  <div>
                    <Heart />{" "}
                    <strong>
                      {save.character.hp}/{characterStats.maxHp}
                    </strong>
                    <span>Health</span>
                  </div>
                  <div>
                    <Zap />
                    <strong>
                      {save.character.focus}/{characterStats.maxFocus}
                    </strong>
                    <span>Focus</span>
                  </div>
                  <div>
                    <Swords />
                    <strong>{characterStats.attack}</strong>
                    <span>Attack</span>
                  </div>
                  <div>
                    <Shield />
                    <strong>{characterStats.defense}</strong>
                    <span>Defense</span>
                  </div>
                </div>
                <h3>Field equipment</h3>
                <div className="item-grid">
                  {items.map((item) => (
                    <div className="item-card" key={item.id}>
                      <span className="pill">
                        {item.kind === "equipment"
                          ? "EQUIPMENT"
                          : `× ${save.inventory[item.id] ?? 0}`}
                      </span>
                      <h4>{item.title}</h4>
                      <p>{item.description}</p>
                      {item.kind === "equipment" ? (
                        <button
                          disabled={!save.inventory[item.id]}
                          onClick={() =>
                            updateSave((s) => ({
                              ...s,
                              character: {
                                ...s.character,
                                equipment:
                                  s.character.equipment === item.id
                                    ? null
                                    : item.id,
                              },
                            }))
                          }
                        >
                          {save.character.equipment === item.id
                            ? "Unequip"
                            : save.inventory[item.id]
                              ? "Equip module"
                              : "Earn from the main quest"}
                        </button>
                      ) : (
                        <small>Use during battle</small>
                      )}
                    </div>
                  ))}
                </div>
                <h3>Skills</h3>
                <div className="skill-tree">
                  {skills.map((skill) => (
                    <div className="skill-node" key={skill.id}>
                      <span className="skill-icon">
                        <Sparkles size={20} />
                      </span>
                      <div>
                        <strong>{skill.title}</strong>
                        <p>{skill.description}</p>
                        <small>
                          Level {skill.level}
                          {skill.parent
                            ? ` · requires ${skills.find((s) => s.id === skill.parent)?.title}`
                            : ""}
                        </small>
                      </div>
                      <button
                        disabled={
                          save.character.skills.includes(skill.id) ||
                          save.character.level < skill.level ||
                          (!!skill.parent &&
                            !save.character.skills.includes(skill.parent))
                        }
                        onClick={() => updateSave((s) => unlockSkill(s, skill))}
                      >
                        {save.character.skills.includes(skill.id)
                          ? "Learned"
                          : "Learn skill"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {panel === "settings" && (
              <div className="settings-content">
                <h3>Renderer</h3>
                <label>
                  Rendering backend
                  <select
                    value={save.settings.renderer}
                    onChange={(e) => {
                      stop();
                      setMetrics(null);
                      benchUntil.current = 0;
                      setBenchmarkState("");
                      updateSave((s) => ({
                        ...s,
                        settings: {
                          ...s.settings,
                          renderer: e.target
                            .value as Save["settings"]["renderer"],
                        },
                      }));
                    }}
                  >
                    <option value="auto">Automatic · prefer WebGPU</option>
                    <option value="webgpu">
                      Prefer WebGPU · fall back if unavailable
                    </option>
                    <option value="webgl">Force WebGL2</option>
                  </select>
                </label>
                <p className="muted">
                  Both backends use the same world and rules. Compare on this
                  device; the fastest option depends on your hardware.
                </p>
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={save.settings.reducedMotion}
                    onChange={(e) =>
                      updateSave((s) => ({
                        ...s,
                        settings: {
                          ...s.settings,
                          reducedMotion: e.target.checked,
                        },
                      }))
                    }
                  />{" "}
                  Reduce movement animation
                </label>
                <div className="performance-card">
                  <span className="section-eyebrow">LIVE RENDERING</span>
                  <h3>
                    {metrics?.backend ?? "Initializing"} · {metrics?.fps ?? "—"}{" "}
                    FPS
                  </h3>
                  <p>
                    {metrics?.frameMs ?? "—"} ms average · {metrics?.p95 ?? "—"}{" "}
                    ms p95 frame time
                  </p>
                  <button
                    onClick={() => {
                      benchUntil.current = performance.now() + 10000;
                      benchSamples.current = [];
                      setBenchmarkState(
                        "Measuring for 10 seconds… You can close this panel and run Python during capture.",
                      );
                    }}
                  >
                    Measure this renderer
                  </button>
                  <p role="status">{benchmarkState}</p>
                  {benchmark.map((m, i) => (
                    <p key={i}>
                      {m.backend}: {m.fps} FPS · {m.frameMs} ms avg · {m.p95} ms
                      p95 · {m.samples} frames
                    </p>
                  ))}
                </div>
                <h3>Local saves</h3>
                <p className="muted">
                  Progress lives in this browser. Export a copy before clearing
                  browser data or moving devices.
                </p>
                <div className="save-buttons">
                  <button onClick={exportSave}>
                    <Download size={16} />
                    Export journal
                  </button>
                  <label className="file-button">
                    <Upload size={16} />
                    Import journal
                    <input
                      type="file"
                      accept="application/json,.json"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) void importSave(file);
                        e.target.value = "";
                      }}
                    />
                  </label>
                </div>
                <p className="small" role="status">
                  {saveStatus}
                </p>
                {!storageReady && (
                  <>
                    <button
                      onClick={async () => {
                        const raw = await loadSave().catch(() => null);
                        if (raw) {
                          const url = URL.createObjectURL(
                            new Blob([JSON.stringify(raw)], {
                              type: "application/json",
                            }),
                          );
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = "botak-recovery.json";
                          a.click();
                          setTimeout(() => URL.revokeObjectURL(url), 1000);
                        }
                      }}
                    >
                      Download stored recovery data
                    </button>
                    <button
                      onClick={() => {
                        setStorageReady(true);
                        notify("New progress will replace the stored journal.");
                      }}
                    >
                      Use this new journal for local saves
                    </button>
                  </>
                )}
                <h3>Controls & runtime</h3>
                <p className="muted">
                  WASD / arrows: move · E: interact nearby · Escape: close panel
                  · Ctrl+Enter: run Python. Drag the world to orbit the camera.
                  Use the destination buttons to travel with a keyboard.
                </p>
                <p className="small">
                  Python status:{" "}
                  {crossOriginIsolated
                    ? "cross-origin isolation is ready"
                    : "required hosting headers are missing; Python execution is unavailable"}
                  . Block programs run through the same Python worker.
                </p>
              </div>
            )}
          </section>
        )}
        {!panel && realm !== "desk" && (
          <div className="travel-dock">
            {destinations
              .filter((d) => d.id !== "battle")
              .map((d, index) => (
                <button key={d.id} onClick={() => open(d.id)}>
                  <span className="destination-number">0{index + 1}</span>
                  <d.icon size={23} />
                  <span>
                    <strong>{d.name}</strong>
                  </span>
                  <ArrowUpRight size={16} />
                </button>
              ))}
          </div>
        )}
        {realm === "desk" && (
          <nav className="room-nav" aria-label="Room walls">
            {[
              ["investigation", "Investigation wall", "desk"],
              ["bookshelf", "Bookshelf", "library"],
              ["quests", "Quest board", "quest"],
              ["desk", "Inventory desk", "inventory"],
            ].map(([wall, label, id]) => (
              <button
                key={wall}
                aria-current={homeWall === wall ? "page" : undefined}
                onClick={() => open(id)}
              >
                {label}
              </button>
            ))}
          </nav>
        )}
        <footer className="world-footer">
          {realm === "desk" ? (
            <span>Move cursor to look · Select a wall from Home</span>
          ) : (
            <span>
              <kbd>W A S D</kbd> Move <i /> <kbd>E</kbd> Interact <i /> Drag to
              orbit
            </span>
          )}
          <span className="renderer-badge">
            <span />
            {metrics?.backend ?? "Starting renderer"}
            {metrics && ` · ${metrics.fps} FPS`}
          </span>
        </footer>
      </main>
      <aside className="journey-sidebar">
        <div className="profile-mini">
          <span className="profile-avatar">V</span>
          <div>
            <strong>{save.character.name}</strong>
            <span>LEVEL {save.character.level} · DETECTIVE</span>
          </div>
          <button
            className="icon-button"
            aria-label="View character skills"
            onClick={() => open("inventory")}
          >
            <ArrowUpRight size={18} />
          </button>
        </div>
        <div className="vitals">
          <div>
            <span>
              <Heart size={13} /> Health
            </span>
            <b>
              {save.character.hp}
              <small> / {characterStats.maxHp}</small>
            </b>
          </div>
          <div className="bar">
            <i
              style={{
                width: `${(save.character.hp / characterStats.maxHp) * 100}%`,
              }}
            />
          </div>
          <div>
            <span>
              <Zap size={13} /> Focus
            </span>
            <b>
              {save.character.focus}
              <small> / {characterStats.maxFocus}</small>
            </b>
          </div>
          <div className="bar focus">
            <i
              style={{
                width: `${(save.character.focus / characterStats.maxFocus) * 100}%`,
              }}
            />
          </div>
          <div className="xp-row">
            <span>{save.character.xp % 100} / 100 XP</span>
            <span>Next level {save.character.level + 1}</span>
          </div>
          <div className="bar xp">
            <i style={{ width: `${save.character.xp % 100}%` }} />
          </div>
        </div>
        <div className="sidebar-divider" />
        <div className="sidebar-section-title">
          CASE 007 <ScrollText size={15} />
        </div>
        <div className="active-quest">
          <h3>{quest.title}</h3>
          {quest.objectives.map((id, index) => (
            <button
              className="mini-objective"
              key={id}
              onClick={() => open(destinations[index + 1]?.id ?? "garden")}
            >
              <span className={save.completed.includes(id) ? "checked" : ""}>
                {save.completed.includes(id) ? <Check size={12} /> : index + 1}
              </span>
              {
                [
                  "Trace the packet labyrinth",
                  "Bypass Sentinel A-03",
                  "Reconstruct the signal",
                ][index]
              }
            </button>
          ))}
          <button className="quest-link" onClick={() => open("journal")}>
            Caseboard <ChevronRight size={16} />
          </button>
        </div>
        <div className="sidebar-bottom">
          <button
            className="rest-button"
            disabled={panel === "battle"}
            onClick={() => {
              updateSave((s) => ({
                ...s,
                character: {
                  ...s.character,
                  hp: stats(s).maxHp,
                  focus: stats(s).maxFocus,
                },
              }));
              notify("Health and focus restored.");
            }}
          >
            Restore health & focus
          </button>
        </div>
      </aside>
      {booted && (!save.story.prologueSeen || prologueReplay || cutsceneId) && (
        <Cutscene
          key={cutsceneId ?? "intro"}
          story={
            cutsceneId
              ? content.entities.find(
                  (e): e is Story => e.type === "story" && e.id === cutsceneId,
                )!
              : story
          }
          onFinish={() => {
            if (cutsceneId) {
              updateSave((s) => ({
                ...s,
                story: { ...s.story, networkIntroSeen: true },
              }));
              setCutsceneId(null);
              setRealm("hub");
              setScene("hub");
              setPanel(null);
              if (pendingActivity) {
                const id = pendingActivity;
                setPendingActivity(null);
                open(id);
              }
            } else {
              updateSave((s) => ({
                ...s,
                story: { ...s.story, prologueSeen: true },
              }));
              setPrologueReplay(false);
              setRealm("desk");
              setScene("desk");
              setPanel(null);
              setHomeWall("investigation");
              if (!saveRef.current.story.briefingSeen)
                setDialogueId("case-briefing");
            }
          }}
        />
      )}
      {dialogueId &&
        save.story.prologueSeen &&
        !prologueReplay &&
        !cutsceneId && (
          <Dialogue
            key={dialogueId}
            dialogue={dialogueContent.find((d) => d.id === dialogueId)!}
            onAction={(action) => {
              updateSave((s) => ({
                ...s,
                story: {
                  ...s.story,
                  briefingSeen: true,
                  caseAccepted:
                    s.story.caseAccepted || action === "accept-case",
                },
              }));
              setDialogueId(null);
              if (action === "accept-case") open("quest");
            }}
          />
        )}
      {toast && (
        <div className="toast" role="status">
          <Sparkles size={18} />
          <span>{toast}</span>
          <button
            aria-label="Dismiss notification"
            onClick={() => setToast("")}
          >
            <X size={15} />
          </button>
        </div>
      )}
    </div>
  );
}
