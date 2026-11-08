import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
} from "react";
import {
  BookOpen,
  Compass,
  Swords,
  Sprout,
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
  Monitor,
  ScanLine,
  FolderSearch,
  CircleHelp,
} from "lucide-react";
import DOMPurify from "dompurify";
import { renderLessonMarkdown } from "./game/markdown";
import { ClueLedger } from "./ui/ClueLedger";
import { BookReader } from "./ui/BookReader";
import { PuzzleScreen } from "./ui/PuzzleScreen";
import { rewardPuzzle } from "./game/puzzleProgress";
import "./ui/PuzzleCases.css";
import rawContent from "./generated/content.json";
import {
  validateContent,
  type Lesson,
  type Activity,
  type Question,
  type Quest,
  type Skill,
  type Story,
  type Dialogue as DialogueContent,
} from "./content/schema";
import { BattleScreen } from "./ui/BattleScreen";
import { battleCue, type BattleCue } from "./game/combatPresentation";
import { XpMeter } from "./ui/XpMeter";
import { LearningQuest } from "./ui/LearningQuest";
import {
  chapterForActivity,
  needsGuidedPractice,
  introduceChapter,
  practiceChapter,
} from "./game/chapterQuest";
import { Cutscene } from "./ui/Cutscene";
import { Dialogue } from "./ui/Dialogue";
import { MenuBar } from "./ui/MenuBar";
import { chooseMusic, createMusic } from "./game/music";
import { HomeBoard } from "./ui/HomeBoard";
import { WorldUiControls } from "./ui/WorldUiControls";
import { RoomTurns } from "./ui/RoomTurns";
import { createOfficeUi, type OfficeAction } from "./game/officeUi";
import {
  centerGraph,
  createQuestGraph,
  zoomGraph,
  GRAPH_AREA,
  type GraphView,
} from "./game/questGraph";
import { QuestBranches, FinaleCard } from "./ui/QuestBranches";
import { finaleAvailable, activityUnlocked } from "./game/investigation";
import { nextObjective } from "./game/investigation";
import {
  activityStory,
  pendingStory,
  acknowledgeStory,
  storyBranch,
} from "./game/questStory";
import type { HomeWall } from "./world/Office";
import { atGoal, move, shortestPath, type Maze } from "./game/maze";
import {
  addXp,
  claimQuest,
  completeActivity,
  evidence,
  finishIntake,
  initialSave,
  markTutorialSeen,
  needsIntake,
  recoverResources,
  parseSave,
  recordAnswer,
  renamePlayer,
  resetTutorials,
  setTipsEnabled,
  stats,
  unlockSkill,
  type Save,
} from "./game/state";
import { PLAYER_NAME_LIMIT, playerInitials } from "./game/player";
import { tutorialById, type TutorialId } from "./game/tutorials";
import { Onboarding } from "./ui/Onboarding";
import { TutorialCard } from "./ui/TutorialCard";
import { FieldManual } from "./ui/FieldManual";
import {
  answerBattle,
  enemyTurn,
  guardTurn,
  selectBoost,
  selectFinisher,
  analyzeBattle,
  canSpare,
  spareBattle,
  evadeTurn,
  selectSkill,
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
const createBattle = (
  enemy?: Parameters<typeof activityTemplates.battle.create>[0],
) => {
  const guardian = content.entities.find(
    (e) => e.type === "activity" && e.id === "guardian-battle",
  );
  return activityTemplates.battle.create(
    enemy ?? (guardian?.type === "activity" ? guardian.enemy : undefined),
  );
};
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
const quest = content.entities.find(
  (e): e is Quest => e.type === "quest" && e.id === "first-principles",
)!;
const echoActivity = content.entities.find(
  (e) => e.type === "activity" && e.id === "echo-battle",
)!;
const activityDestination = (id: string) =>
  ({
    "maze-chamber": "maze",
    "guardian-battle": "battle",
    "perceptron-exhibit": "garden",
    "echo-battle": "echo",
  })[id] ??
  (content.entities.some((e) => e.type === "activity" && e.id === id)
    ? id
    : "quest");
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
  | "puzzles"
  | "library"
  | "maze"
  | "battle"
  | "garden"
  | "inventory"
  | "character"
  | "journal"
  | "settings"
  | "manual"
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
const FINAL_BOSS_IDS = [
  "echo-7",
  "route-warden",
  "archive-keeper",
  "signal-mimic",
];
export default function App() {
  const [puzzleId, setPuzzleId] = useState<string | null>(null);
  const [returnPuzzleId, setReturnPuzzleId] = useState<string | null>(null);
  const puzzleActivities = content.entities.filter(
    (e): e is Activity => e.type === "activity" && e.template === "puzzle",
  );
  const currentPuzzle = puzzleActivities.find((e) => e.id === puzzleId);
  const [save, setSave] = useState<Save>(defaultSave),
    saveRef = useRef(save),
    [booted, setBooted] = useState(false),
    [storageReady, setStorageReady] = useState(true),
    [saveStatus, setSaveStatus] = useState("Loading journal…");
  const [realm, setRealm] = useState<"desk" | "hub">("desk");
  const [prologueReplay, setPrologueReplay] = useState(false);
  const [officeFallback, setOfficeFallback] = useState(false);
  const [officePage, setOfficePage] = useState(0);
  const [bookOpen, setBookOpen] = useState(false);
  const [questSelection, setQuestSelection] = useState<string>();
  const [questView, setQuestView] = useState<GraphView>({
    x: 0,
    y: 0,
    zoom: 1,
  });
  const [officeFocused, setOfficeFocused] = useState<string | null>(null);
  const [noteEditing, setNoteEditing] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [searchEditing, setSearchEditing] = useState(false);
  const [homeWall, setHomeWall] = useState<HomeWall>("investigation");
  const [homeMoving, setHomeMoving] = useState(false);
  const [dialogueId, setDialogueId] = useState<string | null>(null);
  const [chapterId, setChapterId] = useState<string | null>(null);
  const [cutsceneId, setCutsceneId] = useState<string | null>(null);
  const [pendingActivity, setPendingActivity] = useState<string | null>(null);
  const [tutorialId, setTutorialId] = useState<TutorialId | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [renameDraft, setRenameDraft] = useState("");
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
  const [blocksExpanded, setBlocksExpanded] = useState(true);
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
  const battleRef = useRef(battle);
  battleRef.current = battle;
  const [combatEvent, setCombatEvent] = useState<BattleCue | null>(null);
  const combatSequence = useRef(0);
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
  const tutorialRef = useRef<TutorialId | null>(null);
  tutorialRef.current = tutorialId;
  const intakeOpen = booted && needsIntake(save);
  const closeTutorial = () => {
    const current = tutorialRef.current;
    if (current) updateSave((s) => markTutorialSeen(s, current));
    setTutorialId(null);
  };
  const replayTutorial = (id: TutorialId) => {
    setRenaming(false);
    setTutorialId(id);
  };
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
      setCombatEvent(null);
      setReturnPuzzleId(null);
      if (tutorialRef.current) closeTutorial();
      if (id === "exit") return;
      if (id === "library" && !officeFallback) {
        setHomeWall("bookshelf");
        setRealm("desk");
        setScene("desk");
        setPanel(null);
        setBookOpen(false);
        setChapterId(null);
        return;
      }
      const selectedChapter = content.entities.find(
        (e): e is Quest =>
          e.type === "quest" && e.kind === "chapter" && e.id === id,
      );
      if (selectedChapter) {
        generation.current++;
        runner.current?.reset();
        setBookOpen(false);
        setChapterId(id);
        return;
      }
      setChapterId(null);
      const activityId =
        (
          {
            maze: "maze-chamber",
            battle: "guardian-battle",
            garden: "perceptron-exhibit",
            echo: "echo-battle",
          } as Record<string, string>
        )[id] ?? id;
      const chapter = chapterForActivity(content, activityId);
      if (
        chapter &&
        needsGuidedPractice(saveRef.current, chapter) &&
        activityUnlocked(saveRef.current, activityId, content)
      ) {
        generation.current++;
        runner.current?.reset();
        setBookOpen(false);
        setChapterId(chapter.id);
        return;
      }
      if (
        saveRef.current.story.networkIntroSeen &&
        activityUnlocked(saveRef.current, activityId, content)
      ) {
        const beat =
          pendingStory(saveRef.current, content, activityId, "after") ??
          pendingStory(saveRef.current, content, activityId, "before");
        if (beat) {
          setBookOpen(false);
          setDialogueId(beat.id);
          return;
        }
      }
      const encounter = content.entities.find(
        (e) => e.type === "activity" && e.template === "battle" && e.id === id,
      );
      const puzzle = content.entities.find(
        (e) => e.type === "activity" && e.template === "puzzle" && e.id === id,
      );
      if (id === "puzzles" || puzzle) {
        if (!saveRef.current.story.caseAccepted) {
          setDialogueId("case-briefing");
          return;
        }
        if (!saveRef.current.story.networkIntroSeen) {
          setPendingActivity(id);
          setCutsceneId("first-connection");
          return;
        }
        generation.current++;
        runner.current?.reset();
        setBookOpen(false);
        setRealm("hub");
        setScene("hub");
        setPuzzleId(puzzle ? id : null);
        setPanel("puzzles");
        return;
      }
      if (encounter?.type === "activity") {
        if (!activityUnlocked(saveRef.current, id, content)) {
          notify("Follow the preceding lead on the quest board first.");
          return;
        }
        setBookOpen(false);
        setRealm("hub");
        setScene("hub");
        setPanel("battle");
        updateSave(recoverResources);
        const enemy = encounter.enemy;
        setBattle(
          createBattle(
            enemy
              ? {
                  ...enemy,
                  title:
                    activityStory(content, id, "before")?.enemyName ??
                    enemy.title,
                }
              : undefined,
          ),
        );
        setAnswer([]);
        setBattleNotice("");
        return;
      }
      setBookOpen(false);
      setNoteEditing(null);
      setSearchEditing(false);
      setOfficeFocused(null);
      if (
        id === "echo" &&
        !saveRef.current.completed.includes("echo-battle") &&
        !finaleAvailable(saveRef.current, content)
      ) {
        setToast("Recover all three clues first.");
        return;
      }
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
        setRealm("desk");
        setScene("desk");
        setHomeWall("quests");
        setPanel("journal");
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
        ["battle", "maze", "garden", "echo"].includes(id) &&
        !saveRef.current.story.caseAccepted
      ) {
        setDialogueId("case-briefing");
        return;
      }
      if (
        ["battle", "maze", "garden", "echo"].includes(id) &&
        !saveRef.current.story.networkIntroSeen
      ) {
        setPendingActivity(id);
        setCutsceneId("first-connection");
        return;
      }
      if (id === "echo") {
        updateSave(recoverResources);
        setRealm("hub");
        setScene("hub");
        setPanel("battle");
        setBattle(
          createBattle(
            echoActivity.type === "activity" ? echoActivity.enemy : undefined,
          ),
        );
        setAnswer([]);
        setBattleNotice("");
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
          updateSave(recoverResources);
          const enemy = createBattle();
          const activity = content.entities.find(
            (e) => e.type === "activity" && e.id === "guardian-battle",
          );
          setBattle({
            ...enemy,
            lessons:
              activity?.type === "activity" ? [activity.lesson] : undefined,
            enemyName:
              activityStory(content, "guardian-battle", "before")?.enemyName ??
              enemy.enemyName,
          });
          setAnswer([]);
          setBattleNotice("");
        }
      }
      if (id !== "maze") {
        setTrial(false);
        trialRef.current = false;
      }
    },
    [realm, officeFallback],
  );
  const close = () => {
    stop();
    setPanel(null);
    setRealm("desk");
    setScene("desk");
    if (realm !== "desk") setHomeWall("quests");
    setTrial(false);
    trialRef.current = false;
  };
  useEffect(() => {
    const escape = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.target?.toString().includes("SVG"))
        return;
      if (tutorialRef.current) {
        closeTutorial();
        return;
      }
      close();
    };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, [realm]);
  useEffect(() => {
    if (
      !booted ||
      tutorialId ||
      intakeOpen ||
      prologueReplay ||
      !save.onboarding.tipsEnabled ||
      Boolean(chapterId) ||
      Boolean(dialogueId) ||
      Boolean(cutsceneId) ||
      panel === "settings" ||
      panel === "character" ||
      panel === "manual"
    )
      return;
    const next: TutorialId | undefined = bookOpen
      ? undefined
      : panel === "library"
        ? "read"
        : panel === "maze"
          ? "maze"
          : panel === "battle"
            ? "battle"
            : panel === "garden"
              ? "lab"
              : panel === "journal"
                ? "quests"
                : panel === "inventory"
                  ? "ledger"
                  : !panel && realm === "desk" && homeWall === "bookshelf"
                    ? "read"
                    : !panel &&
                        realm === "desk" &&
                        homeWall === "investigation" &&
                        save.story.caseAccepted
                      ? "room"
                      : undefined;
    if (next && !save.onboarding.seenTips.includes(next)) setTutorialId(next);
  }, [
    booted,
    tutorialId,
    intakeOpen,
    prologueReplay,
    save.onboarding.tipsEnabled,
    save.onboarding.seenTips,
    save.story.caseAccepted,
    panel,
    bookOpen,
    realm,
    homeWall,
    chapterId,
    dialogueId,
    cutsceneId,
  ]);
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
    if (mode === "blocks") setBlocksExpanded(false);
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
    if (tutorialRef.current) closeTutorial();
    setLessonId(id);
    setOfficePage(0);
    if (officeFallback) {
      open("library");
      setBookOpen(true);
      return;
    }
    setBookOpen(true);
    setRealm("desk");
    setScene("desk");
    setHomeWall("bookshelf");
    setPanel(null);
    setChapterId(null);
    setTrial(false);
    trialRef.current = false;
  };
  const continueBranch = (activity: string) => {
    stop();
    const branch = storyBranch(content, activity);
    if (!branch) {
      open("journal");
      return;
    }
    const last = branch.objectives.at(-1)!;
    if (saveRef.current.completed.includes(last)) {
      if (pendingStory(saveRef.current, content, last, "after")) open(last);
      else open("journal");
    } else open(activityDestination(nextObjective(saveRef.current, branch)));
  };
  const battleActivityId =
    content.entities.find(
      (e) => e.type === "activity" && e.enemy?.id === battle.enemyId,
    )?.id ?? "guardian-battle";
  const narratedBattle = Boolean(
    activityStory(content, battleActivityId, "before"),
  );
  const applyBattle = (
    nextBattle: Battle,
    nextSave: Save,
    cause?: "guard" | "item" | "act" | "evade",
  ) => {
    const cue = battleCue(
      battleRef.current,
      nextBattle,
      saveRef.current,
      nextSave,
      content,
      ++combatSequence.current,
      cause,
    );
    if (cue) setCombatEvent(cue);
    if (nextBattle.phase === "won") {
      const activity =
        content.entities.find(
          (e) => e.type === "activity" && e.enemy?.id === nextBattle.enemyId,
        )?.id ?? "guardian-battle";
      const first = !nextSave.completed.includes(activity);
      nextSave = completeActivity(nextSave, activity);
      if (first)
        nextSave = addXp(nextSave, activity === "echo-battle" ? 60 : 20);
    }
    battleRef.current = nextBattle;
    setBattle(nextBattle);
    updateSave(() => nextSave);
  };
  const submitAnswer = (chosenAnswer?: number[]) => {
    if (battleRef.current !== battle || battle.phase !== "question") return;
    try {
      const result = answerBattle(
        battle,
        saveRef.current,
        content,
        chosenAnswer ?? answer,
      );
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
      setDialogueId(null);
      setChapterId(null);
      setCutsceneId(null);
      setPendingActivity(null);
      setPrologueReplay(false);
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
  const submitRename = () => {
    try {
      updateSave((s) => renamePlayer(s, renameDraft));
      setRenaming(false);
      notify("Detective name updated.");
    } catch (error) {
      notify(String(error instanceof Error ? error.message : error));
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
  const officeUi = useMemo(
    () =>
      createOfficeUi({
        save,
        content,
        lessonId,
        page: officePage,
        bookOpen,
        questSelection,
        questView,
        search,
        topic,
        noteEditing,
        noteDraft,
      }),
    [
      save,
      lessonId,
      officePage,
      search,
      topic,
      noteEditing,
      noteDraft,
      bookOpen,
      questSelection,
      questView,
    ],
  );
  const useWorldUi = realm === "desk" && !officeFallback;
  const bossBattle = FINAL_BOSS_IDS.includes(battle.enemyId);
  const musicMix = useMemo(
    () =>
      chooseMusic({
        intake: intakeOpen,
        panel,
        reading: bookOpen && homeWall === "bookshelf",
        boss: bossBattle,
        battleResolved:
          panel === "battle" &&
          (battle.phase === "won" || battle.phase === "lost"),
        dialogue: Boolean(dialogueId || cutsceneId || chapterId),
      }),
    [
      intakeOpen,
      panel,
      bookOpen,
      homeWall,
      bossBattle,
      battle.phase,
      dialogueId,
      cutsceneId,
      chapterId,
    ],
  );
  const music = useRef<ReturnType<typeof createMusic> | null>(null);
  useEffect(() => {
    const director = createMusic();
    music.current = director;
    return () => {
      director.dispose();
      music.current = null;
    };
  }, []);
  useEffect(() => {
    music.current?.setReducedMotion(save.settings.reducedMotion);
  }, [save.settings.reducedMotion]);
  useEffect(() => {
    music.current?.setVolume(save.settings.musicVolume);
  }, [save.settings.musicVolume]);
  useEffect(() => {
    music.current?.setTrack(musicMix.track, musicMix.gain);
  }, [musicMix]);
  const setMusicVolume = (percent: number) =>
    updateSave((s) => ({
      ...s,
      settings: {
        ...s.settings,
        musicVolume: Math.max(0, Math.min(1, percent / 100)),
      },
    }));
  const handleOfficeAction = (action: OfficeAction) => {
    const id = action.id;
    if (action.kind === "graph-select") {
      setQuestSelection(id);
      const graph = officeUi.find((m) => m.id === "quests")!.graph!;
      const node = graph.nodes.find((n) => n.id === id);
      if (!node) {
        const next = createQuestGraph(save, content, id);
        const target = next.nodes.find((n) => n.id === id);
        if (target)
          setQuestView(
            target.y <= GRAPH_AREA.h - 44
              ? { x: 0, y: 0, zoom: 1 }
              : centerGraph(target),
          );
      }
      if (
        node &&
        (node.x * questView.zoom + questView.x < 100 ||
          node.x * questView.zoom + questView.x > GRAPH_AREA.w - 100 ||
          node.y * questView.zoom + questView.y < 44 ||
          node.y * questView.zoom + questView.y > GRAPH_AREA.h - 44)
      )
        setQuestView(centerGraph(node, questView.zoom));
    }
    if (action.kind === "graph-view") {
      const graph = officeUi.find((m) => m.id === "quests")!.graph!;
      if (action.view) setQuestView(action.view);
      else if (id === "overview") {
        if (graph.branch) setQuestSelection(graph.branch);
        setQuestView({ x: 0, y: 0, zoom: 1 });
      } else if (id === "center")
        setQuestView(
          centerGraph(
            graph.nodes.find((n) => n.id === graph.selected)!,
            questView.zoom,
          ),
        );
      else setQuestView(zoomGraph(questView, id === "zoom-in" ? 1.2 : 1 / 1.2));
    }
    if (action.kind === "close-book") {
      setBookOpen(false);
      setNoteEditing(null);
      setSearchEditing(false);
    }
    if (action.kind === "open") open(id);
    if (action.kind === "lesson") {
      setOfficePage(0);
      setNoteEditing(null);
      setSearchEditing(false);
      openLesson(id);
    }
    if (action.kind === "page") setOfficePage(Math.max(0, Number(id)));
    if (action.kind === "topic") setTopic(id);
    if (action.kind === "search") setSearchEditing(true);
    if (action.kind === "note") {
      setNoteDraft(saveRef.current.notes[id] ?? "");
      setNoteEditing(id);
      setSearchEditing(false);
    }
    if (action.kind === "save-note" && noteEditing) {
      updateSave((s) => ({
        ...s,
        notes: { ...s.notes, [noteEditing]: noteDraft },
      }));
      setNoteEditing(null);
    }
    if (action.kind === "cancel-note") setNoteEditing(null);
    if (action.kind === "bookmark")
      updateSave((s) => ({
        ...s,
        bookmarks: s.bookmarks.includes(id)
          ? s.bookmarks.filter((x) => x !== id)
          : [...s.bookmarks, id],
      }));
    if (action.kind === "claim") {
      const q = content.entities.find(
        (e): e is Quest => e.type === "quest" && e.id === id,
      );
      if (q) updateSave((s) => claimQuest(s, q, content));
    }
    if (action.kind === "learn") {
      const skill = skills.find((s) => s.id === id);
      if (skill) updateSave((s) => unlockSkill(s, skill));
    }
  };
  const characterStats = stats(save, content),
    currentLesson = lessons.find((l) => l.id === lessonId)!,
    currentQuestion = questions.find((q) => q.id === battle.question);
  const done = quest.objectives.filter((id) =>
    save.completed.includes(id),
  ).length;
  return (
    <div
      className={`app gameplay-${panel ?? "explore"} maze-${mode} ${blocksExpanded ? "blocks-expanded" : "blocks-docked"} ${useWorldUi ? "world-ui-view" : ""} ${realm === "desk" ? "home-view" : "network-view"} ${homeMoving && realm === "desk" ? "home-panning" : ""} ${save.settings.reducedMotion ? "reduced-motion" : ""}`}
    >
      {intakeOpen && (
        <Onboarding
          initialName={save.character.name}
          lessonCount={lessons.length}
          onComplete={(name) => updateSave((s) => finishIntake(s, name))}
        />
      )}
      <header className="topbar" inert={intakeOpen}>
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
        <XpMeter
          key={booted ? "ready" : "loading"}
          compact
          xp={save.character.xp}
          reducedMotion={save.settings.reducedMotion}
        />
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
            aria-label="Open field manual"
            title="How to play"
            onClick={() => open("manual")}
          >
            <CircleHelp size={19} />
          </button>
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
            onClick={() => open("character")}
          >
            {playerInitials(save.character.name)}
          </button>
        </div>
      </header>
      {!booted && (
        <div className="boot-screen" role="status">
          Loading journal…
        </div>
      )}
      <aside
        className="rail"
        aria-label="Investigation navigation"
        inert={intakeOpen}
      >
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
          aria-label="Open clue ledger"
          className={panel === "inventory" ? "active" : ""}
          onClick={() => open("inventory")}
        >
          <FolderSearch size={21} />
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
        inert={intakeOpen}
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
            officeUi={officeUi}
            officeFocused={officeFocused}
            onOfficeAction={handleOfficeAction}
            onRenderFailure={() => setOfficeFallback(true)}
            onRendererReady={() => setOfficeFallback(false)}
            homeWall={homeWall}
            homeLookLocked={
              intakeOpen ||
              panel === "settings" ||
              panel === "character" ||
              !save.story.prologueSeen ||
              prologueReplay ||
              Boolean(chapterId) ||
              Boolean(dialogueId) ||
              Boolean(cutsceneId)
            }
            encounter={panel === "battle"}
            combatCue={panel === "battle" ? combatEvent : null}
            finalBoss={FINAL_BOSS_IDS.includes(battle.enemyId)}
            enemyId={battle.enemyId}
            maze={maze}
            renderer={save.settings.renderer}
            reducedMotion={save.settings.reducedMotion}
            locked={
              intakeOpen ||
              (panel !== null && panel !== "maze") ||
              busy ||
              (scene === "maze" && mode !== "manual") ||
              trialExpired ||
              !save.story.prologueSeen ||
              prologueReplay ||
              Boolean(chapterId) ||
              Boolean(dialogueId) ||
              Boolean(cutsceneId)
            }
            onInteract={open}
            onMove={manualMove}
            onMetrics={onMetrics}
          />
        </Suspense>
        {realm === "desk" && officeFallback && !panel && !homeMoving && (
          <HomeBoard
            onSelect={open}
            accepted={save.story.caseAccepted}
            finaleReady={finaleAvailable(save, content)}
            caseClosed={save.completed.includes("echo-battle")}
            completed={save.completed.filter((id) =>
              quest.objectives.includes(id),
            )}
          />
        )}
        {homeMoving && realm === "desk" && officeFallback && (
          <span className="pan-status" role="status">
            Turning…
          </span>
        )}
        {!panel && realm !== "desk" && (
          <div className="network-return" role="status">
            <span className="section-eyebrow">CASE 007 · NETWORK</span>
            <h2>The trace is still open.</h2>
            <button className="primary" onClick={() => open("quest")}>
              Return to the quest board
            </button>
          </div>
        )}
        {panel &&
          (!useWorldUi ||
            panel === "settings" ||
            panel === "character" ||
            panel === "manual") &&
          !(realm === "desk" && homeMoving) && (
            <section
              className={`activity-panel ${realm === "desk" ? `home-panel home-${homeWall}` : ""} ${panel === "maze" ? "maze-panel" : ""} ${panel === "battle" ? "battle-panel" : ""}`}
              aria-label={`${panel} activity`}
            >
              {panel !== "battle" && (
                <header className="panel-header">
                  <div>
                    <h2>
                      {
                        {
                          library: "Library",
                          maze: "Packet labyrinth",
                          battle: battle.enemyName,
                          garden: "Perceptron lab",
                          puzzles: currentPuzzle?.title ?? "Field puzzles",
                          inventory: "Clue ledger",
                          character: "Detective skills",
                          journal: "Quest board",
                          settings: "Settings",
                          manual: "Field manual",
                        }[panel]
                      }
                    </h2>
                  </div>
                  {panel === "puzzles" && currentPuzzle && (
                    <button
                      className="puzzle-back"
                      onClick={() => setPuzzleId(null)}
                    >
                      ← Field puzzles
                    </button>
                  )}
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
              )}
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
                          renderLessonMarkdown(currentLesson.body),
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
                          currentLesson.source &&
                            currentLesson.id !== "source-guide" &&
                            currentLesson.id !== "source-test-bank"
                            ? `encounter-${currentLesson.id}`
                            : currentLesson.topic === "ai"
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
                    <span>{maze.steps} steps</span>
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
                    {save.completed.includes("maze-chamber") && (
                      <button
                        disabled={busy}
                        onClick={() => continueBranch("maze-chamber")}
                      >
                        Follow the routing trace
                      </button>
                    )}
                  </div>
                  <div className="segmented">
                    <button
                      className={mode === "manual" ? "selected" : ""}
                      disabled={busy}
                      onClick={() => setMode("manual")}
                    >
                      Move
                    </button>
                    <button
                      className={mode === "blocks" ? "selected" : ""}
                      disabled={busy}
                      onClick={() => {
                        setMode("blocks");
                        setBlocksExpanded(true);
                      }}
                    >
                      Blocks
                    </button>
                    <button
                      className={mode === "python" ? "selected" : ""}
                      disabled={busy}
                      onClick={() => setMode("python")}
                    >
                      Python
                    </button>
                    {mode === "blocks" && (
                      <button
                        className="workspace-toggle"
                        aria-pressed={blocksExpanded}
                        onClick={() => setBlocksExpanded((value) => !value)}
                      >
                        {blocksExpanded ? "Show maze" : "Expand editor"}
                      </button>
                    )}
                  </div>
                  {mode === "manual" ? (
                    <>
                      {officeFallback && (
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
                                {maze.position[0] === x &&
                                maze.position[1] === y
                                  ? "●"
                                  : maze.goal[0] === x && maze.goal[1] === y
                                    ? "◇"
                                    : ""}
                              </span>
                            )),
                          )}
                        </div>
                      )}
                      <p className="muted small">
                        WASD / arrows · Reach the amber exit.
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
                        <Suspense
                          fallback={<p>Opening the programming desk…</p>}
                        >
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
                      <details
                        className="program-output"
                        open={mode === "python" ? true : undefined}
                      >
                        <summary>
                          Output{output.length > 0 ? ` (${output.length})` : ""}
                        </summary>
                        <pre
                          className="terminal"
                          aria-label="Python output"
                          aria-live="polite"
                        >
                          {output.join("\n") ||
                            "Your observations will appear here. Ctrl+Enter to run."}
                        </pre>
                      </details>
                    </>
                  )}
                  <details className="activity-tools">
                    <summary>Tools & hints</summary>
                    <p>
                      Layout {maze.seed} · {maze.commands} commands
                    </p>
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
                        New layout
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
                  </details>
                </div>
              )}
              {panel === "battle" && (
                <BattleScreen
                  key={battle.enemyId}
                  battle={battle}
                  cue={combatEvent}
                  save={save}
                  content={content}
                  question={currentQuestion}
                  answer={answer}
                  notice={battleNotice}
                  onToggleSound={() =>
                    updateSave((s) => ({
                      ...s,
                      settings: {
                        ...s.settings,
                        combatMuted: !s.settings.combatMuted,
                      },
                    }))
                  }
                  onToggleAutoAdvance={() =>
                    updateSave((s) => ({
                      ...s,
                      settings: {
                        ...s.settings,
                        battleAutoAdvance: !s.settings.battleAutoAdvance,
                      },
                    }))
                  }
                  onAnswer={setAnswer}
                  onSkill={(skill) => {
                    if (battleRef.current !== battle) return;
                    try {
                      const next = selectSkill(
                        battle,
                        saveRef.current,
                        skill,
                        questions,
                        content,
                      );
                      battleRef.current = next;
                      setBattle(next);
                      setAnswer([]);
                      setBattleNotice("");
                    } catch (e) {
                      notify(String(e));
                    }
                  }}
                  onGuard={() => {
                    if (battleRef.current !== battle) return;
                    try {
                      const result = guardTurn(
                        battle,
                        saveRef.current,
                        content,
                      );
                      applyBattle(result.battle, result.save, "guard");
                    } catch (e) {
                      notify(String(e));
                    }
                  }}
                  onBoost={(amount) => {
                    if (battleRef.current !== battle) return;
                    try {
                      const next = selectBoost(battle, amount);
                      battleRef.current = next;
                      setBattle(next);
                    } catch (e) {
                      notify(String(e));
                    }
                  }}
                  onFinisher={() => {
                    if (battleRef.current !== battle) return;
                    try {
                      const next = selectFinisher(
                        battle,
                        saveRef.current,
                        questions,
                        content,
                      );
                      battleRef.current = next;
                      setBattle(next);
                      setAnswer([]);
                      setBattleNotice("");
                    } catch (e) {
                      notify(String(e));
                    }
                  }}
                  onAct={(choice) => {
                    if (battleRef.current !== battle) return;
                    try {
                      const result = analyzeBattle(
                        battle,
                        saveRef.current,
                        content,
                        choice,
                      );
                      applyBattle(result.battle, result.save, "act");
                      notify(battle.tactics!.act.explanation);
                    } catch (e) {
                      notify(String(e));
                    }
                  }}
                  onSpare={() => {
                    if (battleRef.current !== battle || !canSpare(battle))
                      return;
                    const result = spareBattle(battle, saveRef.current);
                    applyBattle(result.battle, result.save);
                  }}
                  onEvade={(collisions) => {
                    if (battleRef.current !== battle) return;
                    try {
                      const result = evadeTurn(
                        battle,
                        saveRef.current,
                        content,
                        collisions,
                      );
                      applyBattle(result.battle, result.save, "evade");
                    } catch (e) {
                      notify(String(e));
                    }
                  }}
                  onSubmit={submitAnswer}
                  onHint={() => {
                    setBattle((b) => ({ ...b, assisted: true }));
                    setBattleNotice(currentQuestion!.explanation);
                  }}
                  onContinue={() => {
                    if (
                      battleRef.current !== battle ||
                      battle.phase !== "feedback"
                    )
                      return;
                    const result = enemyTurn(battle, saveRef.current, content);
                    applyBattle(result.battle, result.save);
                    setAnswer([]);
                  }}
                  onReview={() => {
                    setLessonId(currentQuestion!.lesson);
                    updateSave((s) => ({
                      ...s,
                      bookmarks: s.bookmarks.includes(currentQuestion!.lesson)
                        ? s.bookmarks
                        : [...s.bookmarks, currentQuestion!.lesson],
                    }));
                    notify("Chapter bookmarked for review.");
                  }}
                  onRetreat={close}
                  victoryActionLabel={
                    narratedBattle
                      ? activityStory(content, battleActivityId, "after")
                        ? "Recover evidence"
                        : "Follow the lead"
                      : undefined
                  }
                  onJournal={
                    narratedBattle
                      ? () => continueBranch(battleActivityId)
                      : () => open("journal")
                  }
                  onRetry={() => {
                    updateSave((s) => ({
                      ...s,
                      character: {
                        ...s.character,
                        hp: stats(s).maxHp,
                        focus: stats(s).maxFocus,
                      },
                    }));
                    open(activityDestination(battleActivityId));
                  }}
                  onRecover={() => {
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
                />
              )}
              {panel === "puzzles" &&
                (currentPuzzle ? (
                  <>
                    <PuzzleScreen
                      key={currentPuzzle.id}
                      activity={currentPuzzle}
                      run={save.puzzleRuns[currentPuzzle.id]}
                      onRun={(run) =>
                        updateSave((s) => ({
                          ...s,
                          puzzleRuns: {
                            ...s.puzzleRuns,
                            [currentPuzzle.id]: run,
                          },
                        }))
                      }
                      completed={save.completed.includes(currentPuzzle.id)}
                      onComplete={(assisted) =>
                        updateSave((s) =>
                          rewardPuzzle(s, currentPuzzle, content, assisted),
                        )
                      }
                      onContinue={() => open("puzzles")}
                      onLesson={() => {
                        openLesson(currentPuzzle.lesson);
                        setReturnPuzzleId(currentPuzzle.id);
                      }}
                    />
                  </>
                ) : (
                  <div
                    className="puzzle-case-list"
                    aria-label="Field puzzle cases"
                  >
                    {puzzleActivities.map((activity) => (
                      <button
                        key={activity.id}
                        onClick={() => open(activity.id)}
                      >
                        <strong>{activity.title}</strong>
                        <span>
                          {
                            lessons.find(
                              (lesson) => lesson.id === activity.lesson,
                            )?.title
                          }
                        </span>
                        <span>
                          {save.completed.includes(activity.id)
                            ? "Solved · practice available"
                            : "25 XP · recover evidence"}
                        </span>
                      </button>
                    ))}
                  </div>
                ))}
              {panel === "garden" && (
                <Suspense fallback={<p>Opening the exhibit…</p>}>
                  <Garden
                    experiment={save.signalExperiment}
                    onExperiment={(signalExperiment) =>
                      updateSave((s) => ({ ...s, signalExperiment }))
                    }
                    completed={save.completed.includes("perceptron-exhibit")}
                    onContinue={() => continueBranch("perceptron-exhibit")}
                    onComplete={() => {
                      updateSave((s) =>
                        evidence(
                          completeActivity(s, "perceptron-exhibit"),
                          "perceptron-basics",
                          "held-out-boundary",
                        ),
                      );
                      notify(
                        "Calibration complete. Continue the signal investigation.",
                      );
                    }}
                    onLesson={() => openLesson("perceptron-basics")}
                  />
                </Suspense>
              )}
              {panel === "journal" && (
                <div className="journal-content">
                  <span className="pill">
                    CASE 007 ·{" "}
                    {save.completed.includes("echo-battle")
                      ? "CLOSED"
                      : "ACTIVE INVESTIGATION"}
                  </span>
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
                  <QuestBranches
                    save={save}
                    content={content}
                    onActivity={(id) => open(activityDestination(id))}
                    onLesson={openLesson}
                    onClaim={(q) =>
                      updateSave((s) => claimQuest(s, q, content))
                    }
                  />
                  <div className="quest-reward">
                    <Sparkles />
                    <span>
                      <strong>{quest.xp} XP</strong>
                      <small>Level 2 unlocks more skills.</small>
                    </span>
                  </div>
                  <button
                    className="primary"
                    disabled={done !== 3 || save.claimed.includes(quest.id)}
                    onClick={() => {
                      updateSave((s) => claimQuest(s, quest, content));
                      notify("Case reward claimed.");
                    }}
                  >
                    {save.claimed.includes(quest.id)
                      ? "Reward claimed"
                      : done === 3
                        ? "Claim reward"
                        : `${done} / 3 objectives complete`}
                  </button>
                  <FinaleCard
                    save={save}
                    content={content}
                    onStart={() => open("echo")}
                    onClaim={(q) =>
                      updateSave((s) => claimQuest(s, q, content))
                    }
                  />
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
                <ClueLedger
                  save={save}
                  content={content}
                  onLesson={openLesson}
                />
              )}
              {panel === "character" && (
                <div className="inventory-content">
                  <div className="character-banner">
                    <span className="character-sigil">
                      <FolderSearch size={42} />
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
                      {!renaming ? (
                        <button
                          className="text-button"
                          onClick={() => {
                            setRenameDraft(save.character.name);
                            setRenaming(true);
                          }}
                        >
                          Change name
                        </button>
                      ) : (
                        <form
                          className="rename-form"
                          onSubmit={(event) => {
                            event.preventDefault();
                            submitRename();
                          }}
                        >
                          <input
                            aria-label="Detective name"
                            value={renameDraft}
                            maxLength={PLAYER_NAME_LIMIT}
                            autoFocus
                            onChange={(event) =>
                              setRenameDraft(event.target.value)
                            }
                          />
                          <button type="submit" className="primary">
                            Save name
                          </button>
                          <button
                            type="button"
                            onClick={() => setRenaming(false)}
                          >
                            Cancel
                          </button>
                        </form>
                      )}
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
                          onClick={() =>
                            updateSave((s) => unlockSkill(s, skill))
                          }
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
                  <h3>Audio</h3>
                  <label>
                    Music volume
                    <output>
                      {Math.round(save.settings.musicVolume * 100)}%
                    </output>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={Math.round(save.settings.musicVolume * 100)}
                      aria-label="Music volume"
                      aria-valuetext={`${Math.round(save.settings.musicVolume * 100)} percent`}
                      onChange={(e) => setMusicVolume(Number(e.target.value))}
                    />
                  </label>
                  <p className="muted">
                    The score changes with the room and quiets under dialogue.
                    Set it to 0 to silence music; battle cues keep their own
                    sound toggle.
                  </p>
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
                      {metrics?.backend ?? "Initializing"} ·{" "}
                      {metrics?.fps ?? "—"} FPS
                    </h3>
                    <p>
                      {metrics?.frameMs ?? "—"} ms average ·{" "}
                      {metrics?.p95 ?? "—"} ms p95 frame time
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
                        {m.backend}: {m.fps} FPS · {m.frameMs} ms avg · {m.p95}{" "}
                        ms p95 · {m.samples} frames
                      </p>
                    ))}
                  </div>
                  <h3>Local saves</h3>
                  <p className="muted">
                    Progress lives in this browser. Export a copy before
                    clearing browser data or moving devices.
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
                          notify(
                            "New progress will replace the stored journal.",
                          );
                        }}
                      >
                        Use this new journal for local saves
                      </button>
                    </>
                  )}
                  <h3>Controls & runtime</h3>
                  <p className="muted">
                    WASD / arrows: move · E: interact nearby · Escape: close
                    panel · Ctrl+Enter: run Python. Drag the world to orbit the
                    camera. Use the destination buttons to travel with a
                    keyboard.
                  </p>
                  <button onClick={() => open("manual")}>
                    <CircleHelp size={16} />
                    Open field manual
                  </button>
                  <p className="small">
                    Python status:{" "}
                    {crossOriginIsolated
                      ? "cross-origin isolation is ready"
                      : "required hosting headers are missing; Python execution is unavailable"}
                    . Block programs run through the same Python worker.
                  </p>
                </div>
              )}
              {panel === "manual" && (
                <FieldManual
                  seenTips={save.onboarding.seenTips}
                  tipsEnabled={save.onboarding.tipsEnabled}
                  onReplayTip={replayTutorial}
                  onToggleTips={(enabled) =>
                    updateSave((s) => setTipsEnabled(s, enabled))
                  }
                  onResetTips={() => {
                    updateSave(resetTutorials);
                    notify("Field tips reset. They will appear again.");
                  }}
                />
              )}
            </section>
          )}
        {realm === "desk" && officeFallback && (
          <nav className="room-nav" aria-label="Room walls">
            {[
              ["investigation", "Investigation wall", "desk"],
              ["bookshelf", "Bookshelf", "library"],
              ["quests", "Quest board", "quest"],
              ["desk", "Clue ledger", "inventory"],
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
        {useWorldUi && bookOpen && homeWall === "bookshelf" && !homeMoving && (
          <BookReader
            lessons={lessons}
            lesson={currentLesson}
            reducedMotion={save.settings.reducedMotion}
            bookmarked={save.bookmarks.includes(lessonId)}
            note={save.notes[lessonId] ?? ""}
            reading={save.reading}
            onPreferences={(mode, fontSize) =>
              updateSave((s) => ({
                ...s,
                reading: { ...s.reading, mode, fontSize },
              }))
            }
            onPosition={(id, position) =>
              updateSave((s) => {
                const current = s.reading.positions[id];
                if (
                  current?.block === position.block &&
                  current?.offset === position.offset
                )
                  return s;
                return {
                  ...s,
                  reading: {
                    ...s.reading,
                    positions: { ...s.reading.positions, [id]: position },
                  },
                };
              })
            }
            onSelect={setLessonId}
            onClose={() => {
              setBookOpen(false);
              setNoteEditing(null);
              if (returnPuzzleId) {
                open(returnPuzzleId);
                setReturnPuzzleId(null);
              }
            }}
            onBookmark={() =>
              updateSave((s) => ({
                ...s,
                bookmarks: s.bookmarks.includes(lessonId)
                  ? s.bookmarks.filter((id) => id !== lessonId)
                  : [...s.bookmarks, lessonId],
              }))
            }
            onNote={(value) =>
              updateSave((s) => ({
                ...s,
                notes: { ...s.notes, [lessonId]: value },
              }))
            }
            onEncounter={() => open(`encounter-${lessonId}`)}
          />
        )}
        {useWorldUi &&
          !bookOpen &&
          panel !== "character" &&
          panel !== "manual" && (
            <RoomTurns
              wall={homeWall}
              disabled={
                intakeOpen ||
                !booted ||
                panel === "settings" ||
                !save.story.prologueSeen ||
                prologueReplay ||
                Boolean(chapterId) ||
                Boolean(dialogueId) ||
                Boolean(cutsceneId)
              }
              allowHover={!noteEditing}
              onTurn={open}
            />
          )}
        {useWorldUi &&
          !bookOpen &&
          panel !== "character" &&
          panel !== "manual" && (
            <WorldUiControls
              model={officeUi.find((m) => m.id === homeWall)!}
              blocked={
                intakeOpen ||
                !booted ||
                panel === "settings" ||
                !save.story.prologueSeen ||
                prologueReplay ||
                Boolean(chapterId) ||
                Boolean(dialogueId) ||
                Boolean(cutsceneId)
              }
              focused={officeFocused}
              onAction={handleOfficeAction}
              onFocus={setOfficeFocused}
              noteEditing={Boolean(noteEditing)}
              noteDraft={noteDraft}
              onNoteDraft={setNoteDraft}
              searchEditing={searchEditing}
              search={search}
              onSearch={setSearch}
            />
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
      <aside className="journey-sidebar" inert={intakeOpen}>
        <div className="profile-mini">
          <span className="profile-avatar">
            {playerInitials(save.character.name)}
          </span>
          <div>
            <strong>{save.character.name}</strong>
            <span>LEVEL {save.character.level} · DETECTIVE</span>
          </div>
          <button
            className="icon-button"
            aria-label="View character skills"
            onClick={() => open("character")}
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
      {booted &&
        !intakeOpen &&
        (!save.story.prologueSeen || prologueReplay || cutsceneId) && (
          <Cutscene
            key={cutsceneId ?? "intro"}
            savedName={save.character.name}
            story={
              cutsceneId
                ? content.entities.find(
                    (e): e is Story =>
                      e.type === "story" && e.id === cutsceneId,
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
                setRealm("desk");
                setScene("desk");
                setHomeWall("quests");
                setPanel("journal");
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
      {chapterId &&
        (() => {
          const chapter = content.entities.find(
            (e): e is Quest =>
              e.type === "quest" && e.kind === "chapter" && e.id === chapterId,
          )!;
          const target = nextObjective(save, chapter);
          return (
            <LearningQuest
              key={chapter.id}
              chapter={chapter}
              progress={save.chapterProgress[chapter.id]}
              unlocked={activityUnlocked(save, target, content)}
              onClose={() => setChapterId(null)}
              onRead={() => openLesson(chapter.lesson!)}
              puzzleTitle={
                puzzleActivities.find(
                  (activity) => activity.lesson === chapter.lesson,
                )?.title
              }
              onPuzzle={
                puzzleActivities.some(
                  (activity) => activity.lesson === chapter.lesson,
                )
                  ? () =>
                      open(
                        puzzleActivities.find(
                          (activity) => activity.lesson === chapter.lesson,
                        )!.id,
                      )
                  : undefined
              }
              onIntroduce={() =>
                updateSave((s) => introduceChapter(s, chapter))
              }
              onAnswer={(answer) => {
                const result = practiceChapter(
                  saveRef.current,
                  chapter,
                  answer,
                );
                updateSave(() => result.save);
                return result.correct;
              }}
              onEncounter={() => open(activityDestination(target))}
            />
          );
        })()}
      {dialogueId &&
        save.story.prologueSeen &&
        !prologueReplay &&
        !cutsceneId && (
          <Dialogue
            key={dialogueId}
            savedName={save.character.name}
            reducedMotion={save.settings.reducedMotion}
            dialogue={dialogueContent.find((d) => d.id === dialogueId)!}
            onAction={(action) => {
              const beat = dialogueContent.find((d) => d.id === dialogueId)!;
              if (beat.trigger) {
                setDialogueId(null);
                if (action === "continue") {
                  updateSave((s) => acknowledgeStory(s, beat));
                  if (beat.trigger.when === "before")
                    open(activityDestination(beat.trigger.activity));
                  else {
                    const owner = storyBranch(content, beat.trigger.activity);
                    if (owner) updateSave((s) => claimQuest(s, owner, content));
                    open("journal");
                    notify(`${owner?.title ?? "Case"} evidence filed.`);
                  }
                } else open("journal");
                return;
              }
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
      {tutorialId && (
        <TutorialCard
          key={tutorialId}
          tutorial={tutorialById(tutorialId)}
          onClose={closeTutorial}
          onSkipAll={() => {
            updateSave((s) => setTipsEnabled(s, false));
            setTutorialId(null);
            notify("Field tips off. Replay them from Game → How to play.");
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
