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
import { SceneTransition } from "./ui/SceneTransition";
import { LoadingScreen } from "./ui/LoadingScreen";
import { useGameSound, useGameSoundVolume } from "./ui/GameSound";
import {
  useGameParticles,
  useGameParticlesReducedMotion,
} from "./ui/GameParticles";
import { PuzzleScreen } from "./ui/PuzzleScreen";
import { SupplyLocker } from "./ui/SupplyLocker";
import { rewardPuzzle } from "./game/puzzleProgress";
import { drawSupply, equipGear } from "./game/gacha";
import "./ui/PuzzleCases.css";
import rawContent from "./generated/content.json";
import {
  validateContent,
  type Lesson,
  type Activity,
  type Item,
  type Question,
  type Quest,
  type Skill,
  type Story,
  type Dialogue as DialogueContent,
} from "./content/schema";
import { BattleScreen } from "./ui/BattleScreen";
import { battleCue, type BattleCue, type QuizOrigin } from "./game/combatPresentation";
import { XpMeter } from "./ui/XpMeter";
import detectiveAvatar from "./assets/detective-avatar.svg?url";
import { GameNotice } from "./ui/GameNotice";
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
import { ViewportWarning } from "./ui/ViewportWarning";
import { DebugMenu } from "./ui/DebugMenu";
import { solvePuzzleForDebug } from "./game/debugPuzzle";
import { chooseMusic, createMusic } from "./game/music";
import { encounterRank } from "./game/enemyIdentity";
import { HomeBoard } from "./ui/HomeBoard";
import { WorldUiControls } from "./ui/WorldUiControls";
import { RoomTurns } from "./ui/RoomTurns";
import { createOfficeUi, type OfficeAction } from "./game/officeUi";
import {
  centerGraph,
  zoomGraph,
  graphShowsNode,
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
  itemTurn,
  selectMomentum,
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
  attempt = 0,
  playerLevel = 1,
) => {
  const guardian = content.entities.find(
    (e) => e.type === "activity" && e.id === "guardian-battle",
  );
  return activityTemplates.battle.create(
    enemy ?? (guardian?.type === "activity" ? guardian.enemy : undefined),
    attempt,
    playerLevel,
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
const branches = content.entities.filter(
  (e): e is Quest => e.type === "quest" && e.kind === "branch",
);
const echoActivity = content.entities.find(
  (e): e is Activity => e.type === "activity" && e.id === "echo-battle",
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
const debugSequence = [
  "ArrowUp",
  "ArrowDown",
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
];
const topicNames = {
  algorithms: "Algorithms",
  structures: "Data structures",
  ai: "Connectionist AI",
};
const supplyItems = content.entities.filter(
  (entity): entity is Item => entity.type === "item",
);
type Panel =
  | "puzzles"
  | "library"
  | "maze"
  | "battle"
  | "garden"
  | "inventory"
  | "supplies"
  | "character"
  | "journal"
  | "settings"
  | "manual"
  | null;
const officeDestinations = new Map<string, HomeWall>([
  ["desk", "investigation"],
  ["library", "bookshelf"],
  ["quest", "quests"],
  ["journal", "quests"],
  ["inventory", "desk"],
  ["supplies", "desk"],
]);
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
  "dispatch-quartermaster",
  "simulation-warden",
];
export default function App() {
  const sound = useGameSound();
  const particles = useGameParticles();
  const configureParticleMotion = useGameParticlesReducedMotion();
  const configureSfxVolume = useGameSoundVolume();
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
    [saveStatus, setSaveStatus] = useState("");
  const [realm, setRealm] = useState<"desk" | "hub">("desk");
  const [prologueReplay, setPrologueReplay] = useState(false);
  const [officeFallback, setOfficeFallback] = useState(false);
  const [officePage, setOfficePage] = useState(0);
  const [bookOpen, setBookOpen] = useState(false);
  const [bookClosing, setBookClosing] = useState(false);
  const [bookReady, setBookReady] = useState(false);
  useEffect(() => {
    if (!bookOpen) {
      setBookClosing(false);
      setBookReady(false);
    }
  }, [bookOpen]);
  const [questSelection, setQuestSelection] = useState<string>();
  const [questView, setQuestView] = useState<GraphView>();
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
    [settingsFromBattle, setSettingsFromBattle] = useState(false),
    [pendingBattleExit, setPendingBattleExit] = useState<
      | { kind: "open"; id: string; debugTravel: boolean }
      | { kind: "close" }
      | { kind: "import"; file: File }
      | null
    >(null),
    [toast, setToast] = useState(""),
    [metrics, setMetrics] = useState<WorldMetrics | null>(null);
  const [debugOpen, setDebugOpen] = useState(false);
  const debugCheckpoint = useRef<Save | null>(null);
  const [debugBattleRun, setDebugBattleRun] = useState(0);
  const battleAttempts = useRef(new Map<string, number>());
  const startBattle = useCallback(
    (enemy?: Parameters<typeof createBattle>[0]) => {
      const id = enemy?.id ?? "sentinel";
      const attempt = battleAttempts.current.get(id) ?? 0;
      battleAttempts.current.set(id, attempt + 1);
      return createBattle(enemy, attempt, saveRef.current.character.level);
    },
    [],
  );
  const [debugPuzzleRun, setDebugPuzzleRun] = useState(0);
  const [blocksExpanded, setBlocksExpanded] = useState(true);
  const [maze, setMaze] = useState<Maze>(() => createMaze(defaultSave().seed)),
    mazeRef = useRef(maze),
    mazeScreenStep = useRef<((direction: Direction) => void) | null>(null),
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
  const battleExitFocus = useRef<HTMLElement | null>(null);
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
  useEffect(
    () => configureParticleMotion(save.settings.reducedMotion),
    [configureParticleMotion, save.settings.reducedMotion],
  );
  useEffect(
    () => configureSfxVolume(save.settings.sfxVolume),
    [configureSfxVolume, save.settings.sfxVolume],
  );
  const previousLevel = useRef<number | null>(null);
  useEffect(() => {
    if (!booted) return;
    const gainedLevel =
      previousLevel.current !== null &&
      save.character.level > previousLevel.current;
    previousLevel.current = save.character.level;
    if (!gainedLevel) return;
    const timer = setTimeout(() => {
      sound("levelUp");
      particles("levelUp");
    }, 450);
    return () => clearTimeout(timer);
  }, [booted, save.character.level, sound, particles]);
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
  const [noticeSequence, setNoticeSequence] = useState(0);
  const notify = (message: string) => {
    setToast(message);
    setNoticeSequence((value) => value + 1);
  };
  const claimWithFeedback = (quest: Quest) => {
    const next = claimQuest(saveRef.current, quest, content);
    if (next === saveRef.current) return;
    updateSave(() => next);
    sound("clue");
    particles("clue");
  };
  const completedMaze = useRef(false);
  const finishMaze = useCallback(
    (model: Maze, control: string) => {
      if (!atGoal(model) || completedMaze.current) return;
      completedMaze.current = true;
      const timed = trialRef.current,
        seconds = timed ? (performance.now() - trialStart.current) / 1000 : 0;
      if (timed && seconds > 90) return;
      sound("clue");
      const firstClear = !saveRef.current.completed.includes("maze-chamber");
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
        `${timed ? `Trial complete in ${seconds.toFixed(1)} seconds.` : "Maze complete."}${firstClear ? " +1 Supply Token" : ""}`,
      );
    },
    [updateSave, sound],
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
            setSaveStatus(
              typeof raw === "object" &&
                "version" in raw &&
                raw.version !== loaded.version
                ? "Journal upgraded"
                : "Journal restored",
            );
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
  const persistSave = useCallback(() => {
    void storeSave(saveRef.current)
      .then(() => setSaveStatus("All progress saved locally"))
      .catch(() => {
        setSaveStatus("Save failed. Export your progress to keep it.");
      });
  }, []);
  const updateReading = (
    edit: (reading: Save["reading"]) => Save["reading"],
    persist = true,
  ) => {
    const previous = saveRef.current.reading;
    const reading = edit(previous);
    if (reading === previous) return;
    updateSave((s) => ({ ...s, reading }));
    if (persist && booted && storageReady) persistSave();
  };
  useEffect(() => {
    if (!booted || !storageReady) return;
    const timeout = setTimeout(persistSave, 450);
    return () => clearTimeout(timeout);
  }, [save, booted, storageReady, persistSave]);
  useEffect(() => {
    if (!booted || !storageReady) return;
    const onVisibility = () => {
      if (document.hidden) persistSave();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", persistSave);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", persistSave);
    };
  }, [booted, storageReady, persistSave]);
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
        if (command.method === "move")
          sound(result.maze.steps > mazeRef.current.steps ? "move" : "blocked");
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
  }, [finishMaze, updateMaze, sound]);
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
  const suppressNavigationSfx = useCallback(
    (id: string) => {
      if (id === "inventory") return true;
      if (officeFallback || realm !== "desk") return false;
      const { caseAccepted, networkIntroSeen } = saveRef.current.story;
      const wall =
        id === "network" && caseAccepted && networkIntroSeen
          ? "quests"
          : officeDestinations.get(id);
      return wall !== undefined && wall !== homeWall;
    },
    [homeWall, officeFallback, realm],
  );
  const open = useCallback(
    (id: string, debugTravel = false, confirmedExit = false) => {
      const activeBattle =
        (panel === "battle" || settingsFromBattle) &&
        battleRef.current.phase !== "won" &&
        battleRef.current.phase !== "lost";
      if (activeBattle && id !== "settings" && id !== "exit" && !confirmedExit) {
        battleExitFocus.current = document.activeElement as HTMLElement | null;
        setPendingBattleExit({ kind: "open", id, debugTravel });
        return;
      }
      if (id === "settings" && panel === "battle") setSettingsFromBattle(true);
      else if (id !== "settings") setSettingsFromBattle(false);
      if (id !== "settings" || battleRef.current.phase !== "won")
        setCombatEvent(null);
      setReturnPuzzleId(null);
      if (tutorialRef.current) closeTutorial();
      if (id === "exit") return;
      if (!suppressNavigationSfx(id)) sound("open");
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
        !debugTravel &&
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
        !debugTravel &&
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
        if (!debugTravel && !saveRef.current.story.caseAccepted) {
          setDialogueId("case-briefing");
          return;
        }
        if (!debugTravel && !saveRef.current.story.networkIntroSeen) {
          setPendingActivity(id);
          setCutsceneId("first-connection");
          return;
        }
        if (
          !debugTravel &&
          puzzle &&
          !saveRef.current.completed.includes(id) &&
          !activityUnlocked(saveRef.current, id, content)
        ) {
          notify("Follow the preceding lead on the quest board first.");
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
        if (!debugTravel && !activityUnlocked(saveRef.current, id, content)) {
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
          startBattle(
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
        !debugTravel &&
        id === "echo" &&
        !saveRef.current.completed.includes("echo-battle") &&
        !activityUnlocked(saveRef.current, "echo-battle", content)
      ) {
        setToast(
          finaleAvailable(saveRef.current, content)
            ? "Reconstruct the evidence before entering the subnet."
            : "Recover all five clues first.",
        );
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
        if (debugTravel) {
          setRealm("hub");
          setScene("hub");
          setPanel(null);
          return;
        }
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
      const wall = officeDestinations.get(id);
      if (wall) {
        if (id === "supplies") setBookOpen(false);
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
        !debugTravel &&
        ["battle", "maze", "garden", "echo"].includes(id) &&
        !saveRef.current.story.caseAccepted
      ) {
        setDialogueId("case-briefing");
        return;
      }
      if (
        !debugTravel &&
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
          startBattle(
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
          const enemy = startBattle();
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
    [realm, officeFallback, sound, panel, settingsFromBattle, suppressNavigationSfx, startBattle],
  );
  const close = useCallback((confirmedExit = false) => {
    if (settingsFromBattle && !confirmedExit) {
      sound("close");
      setSettingsFromBattle(false);
      setPanel("battle");
      return;
    }
    if (
      !confirmedExit &&
      panel === "battle" &&
      battleRef.current.phase !== "won" &&
      battleRef.current.phase !== "lost"
    ) {
      battleExitFocus.current = document.activeElement as HTMLElement | null;
      setPendingBattleExit({ kind: "close" });
      return;
    }
    if (panel || realm !== "desk") sound("close");
    generation.current++;
    runner.current?.reset();
    setLine(0);
    setSettingsFromBattle(false);
    setPanel(null);
    setRealm("desk");
    setScene("desk");
    if (realm !== "desk") setHomeWall("quests");
    setTrial(false);
    trialRef.current = false;
  }, [panel, settingsFromBattle, realm, sound]);
  const cancelBattleExit = () => {
    setPendingBattleExit(null);
    requestAnimationFrame(() => battleExitFocus.current?.focus());
  };
  const confirmBattleExit = () => {
    const pending = pendingBattleExit;
    setPendingBattleExit(null);
    setSettingsFromBattle(false);
    if (pending?.kind === "open") open(pending.id, pending.debugTravel, true);
    else if (pending?.kind === "close") close(true);
    else if (pending?.kind === "import") void importSave(pending.file, true);
  };
  const debugAtHome =
    booted &&
    realm === "desk" &&
    !intakeOpen &&
    !bookOpen &&
    save.story.prologueSeen &&
    !dialogueId &&
    !cutsceneId &&
    !chapterId &&
    !prologueReplay &&
    !tutorialId;
  useEffect(() => {
    let position = 0;
    let lastKeyAt = 0;
    const listen = (event: KeyboardEvent) => {
      if (event.repeat || event.ctrlKey || event.altKey || event.metaKey) return;
      if (event.key === "F9" && debugCheckpoint.current) {
        event.preventDefault();
        event.stopImmediatePropagation();
        setDebugOpen((open) => !open);
        return;
      }
      if (debugOpen || !debugAtHome) return;
      if (
        event.target instanceof Element &&
        event.target.closest("input, textarea, select, [contenteditable=true]")
      )
        return;
      const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
      const now = performance.now();
      if (now - lastKeyAt > 3000) position = 0;
      lastKeyAt = now;
      position =
        key === debugSequence[position]
          ? position + 1
          : Number(key === debugSequence[0]);
      // The matching left/right keys would otherwise turn the office camera.
      if (position >= 5) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
      if (position !== debugSequence.length) return;
      position = 0;
      debugCheckpoint.current ??= structuredClone(saveRef.current);
      setDebugOpen(true);
    };
    window.addEventListener("keydown", listen, true);
    return () => window.removeEventListener("keydown", listen, true);
  }, [debugAtHome, debugOpen]);
  useEffect(() => {
    const escape = (event: KeyboardEvent) => {
      if (
        event.defaultPrevented ||
        event.key !== "Escape" ||
        event.target?.toString().includes("SVG") ||
        (event.target instanceof Element &&
          event.target.closest('[role="dialog"],[role="alertdialog"],.book-reader,.menu-bar,.evade'))
      )
        return;
      event.preventDefault();
      if (tutorialRef.current) {
        closeTutorial();
        return;
      }
      close();
    };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, [close]);
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
      sound(next.steps > mazeRef.current.steps ? "move" : "blocked");
      updateMaze(next);
      finishMaze(next, "manual");
    },
    [finishMaze, updateMaze, sound],
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
  const selectReadingLesson = (id: string) => {
    setLessonId(id);
    const lesson = lessons.find((item) => item.id === id);
    if (!lesson) return;
    updateReading((reading) => {
      const lastChapterByTopic = reading.lastChapterByTopic;
      if (lastChapterByTopic?.[lesson.topic] === id) return reading;
      return {
        ...reading,
        lastChapterByTopic: { ...lastChapterByTopic, [lesson.topic]: id },
      };
    });
  };
  const openLesson = (id: string) => {
    if (tutorialRef.current) closeTutorial();
    selectReadingLesson(id);
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
  const epilogueId =
    battleActivityId === "echo-battle" &&
    battle.phase === "won" &&
    save.finaleOutcome
      ? `echo-epilogue-${save.finaleOutcome}`
      : null;
  const activeStory = cutsceneId
    ? content.entities.find(
        (e): e is Story => e.type === "story" && e.id === cutsceneId,
      )!
    : story;
  const cinematicActive =
    booted &&
    !intakeOpen &&
    (!save.story.prologueSeen || prologueReplay || Boolean(cutsceneId));
  const applyBattle = (
    nextBattle: Battle,
    nextSave: Save,
    cause?: "guard" | "item" | "act" | "evade",
    beforeResponse: Save = saveRef.current,
    quizOrigin?: QuizOrigin,
  ) => {
    const cue = battleCue(
      battleRef.current,
      nextBattle,
      beforeResponse,
      nextSave,
      content,
      ++combatSequence.current,
      cause,
    );
    if (cue) setCombatEvent(cue.kind === "player" && quizOrigin ? { ...cue, quizOrigin } : cue);
    if (
      nextBattle.phase === "won" &&
      (nextBattle.enemyId !== echoActivity.enemy?.id || finaleAvailable(nextSave, content))
    ) {
      const activity =
        content.entities.find(
          (e) => e.type === "activity" && e.enemy?.id === nextBattle.enemyId,
        )?.id ?? "guardian-battle";
      const first = !nextSave.completed.includes(activity);
      nextSave = completeActivity(nextSave, activity);
      if (activity === "echo-battle")
        nextSave = {
          ...nextSave,
          finaleOutcome:
            nextBattle.resolution === "pacified" ? "pacified" : "defeated",
        };
      if (first)
        nextSave = addXp(nextSave, activity === "echo-battle" ? 60 : 20);
    }
    battleRef.current = nextBattle;
    setBattle(nextBattle);
    updateSave(() => nextSave);
  };
  const submitAnswer = (chosenAnswer?: number[], elapsedMs = 0, quizOrigin?: QuizOrigin) => {
    if (battleRef.current !== battle || battle.phase !== "question") return;
    try {
      const result = answerBattle(
        battle,
        saveRef.current,
        content,
        chosenAnswer ?? answer,
        elapsedMs,
      );
      const q = questions.find((q) => q.id === battle.question)!;
      const next = recordAnswer(
        result.save,
        q.lesson,
        q.id,
        result.correct,
        battle.assisted,
      );
      applyBattle(result.battle, next, undefined, undefined, quizOrigin);
      setBattleNotice(
        !result.correct ? "Incorrect · turn spent"
          : result.battle.hp === battle.hp ? "Correct · time expired, no damage"
          : "Correct",
      );
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
  const debugTravelTo = (target: string) => {
    const [type, id] = target.split(":", 2);
    setDebugOpen(false);
    stop();
    setBookOpen(false);
    setChapterId(null);
    setDialogueId(null);
    setCutsceneId(null);
    setPendingActivity(null);
    setPrologueReplay(false);
    setTutorialId(null);
    if (type === "lesson") openLesson(id);
    else if (type === "dialogue" || type === "story") {
      if (dialogueContent.some((entry) => entry.id === id)) setDialogueId(id);
      else if (id === story.id) setPrologueReplay(true);
      else setCutsceneId(id);
    } else if (type === "cutscene") {
      if (id === story.id) setPrologueReplay(true);
      else setCutsceneId(id);
    } else {
      const destination = type === "activity" ? activityDestination(id) : id;
      if (destination === "maze") {
        setMode("manual");
        resetMaze(saveRef.current.seed, false);
      }
      setDebugBattleRun((run) => run + 1);
      open(destination, true);
    }
  };
  const replaceDebugSave = (next: Save) => {
    const validated = parseSave(next, content);
    if (validated.seed !== saveRef.current.seed)
      resetMaze(validated.seed, false);
    updateSave(() => validated);
  };
  const debugBattleAction = (
    action: "win" | "lose" | "reset" | "reveal" | "focus" | "momentum",
  ) => {
    if (panel !== "battle") return;
    const current = battleRef.current;
    if (action === "reset") {
      debugTravelTo(`activity:${battleActivityId}`);
      return;
    }
    if (action === "reveal") {
      const question = questions.find((item) => item.id === current.question);
      if (current.phase === "question" && question) {
        setAnswer(question.answer);
      } else if (current.tactics) {
        const next = { ...current, weaknessKnown: true };
        battleRef.current = next;
        setBattle(next);
      }
      return;
    }
    if (action === "focus") {
      updateSave((save) => ({
        ...save,
        character: { ...save.character, focus: stats(save).maxFocus },
      }));
      return;
    }
    if (current.phase === "won" || current.phase === "lost") return;
    if (action === "momentum") {
      const next = { ...current, momentum: 100 };
      battleRef.current = next;
      setBattle(next);
      return;
    }
    setCombatEvent(null);
    if (action === "win") {
      applyBattle(
        { ...current, phase: "won", hp: 0, resolution: "defeated", question: null },
        saveRef.current,
      );
    } else {
      applyBattle(
        { ...current, phase: "lost", question: null },
        { ...saveRef.current, character: { ...saveRef.current.character, hp: 0 } },
      );
    }
    setDebugOpen(false);
  };
  const solveDebugMaze = () => {
    stop();
    const model = mazeRef.current;
    const solved = shortestPath(model, model.position).reduce(move, model);
    trialRef.current = false;
    setTrial(false);
    setTrialExpired(false);
    updateMaze(solved);
    finishMaze(solved, "manual");
    setDebugOpen(false);
  };
  const solveDebugPuzzle = () => {
    if (!currentPuzzle?.puzzle) return;
    const commands = solvePuzzleForDebug(currentPuzzle.puzzle);
    updateSave((save) => ({
      ...save,
      puzzleRuns: {
        ...save.puzzleRuns,
        [currentPuzzle.id]: { commands, assisted: true },
      },
    }));
    setDebugPuzzleRun((run) => run + 1);
    setDebugOpen(false);
  };
  const importSave = async (file: File, confirmedExit = false) => {
    try {
      if (file.size > 1500000) throw new Error("Save file is too large");
      const importedInput = JSON.parse(await file.text());
      const parsed = parseSave(importedInput, content);
      if (settingsFromBattle && !confirmedExit) {
        battleExitFocus.current = document.activeElement as HTMLElement | null;
        setPendingBattleExit({ kind: "import", file });
        return;
      }
      await storeSave(parsed);
      stop();
      setSettingsFromBattle(false);
      previousLevel.current = parsed.character.level;
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
      notify(
        importedInput.version !== parsed.version
          ? "Journal upgraded and saved."
          : "Journal imported and saved.",
      );
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
  const finishGraphicsCheck = (result: "kept" | "reduced") => {
    if (saveRef.current.settings.graphicsCheck !== "pending") return;
    updateSave((s) => ({
      ...s,
      settings: {
        ...s.settings,
        graphicsCheck: result,
        ...(result === "reduced" ? { shadows: false, postEffects: false } : {}),
      },
    }));
    if (result === "reduced")
      notify(
        "Frame rate was low, so shadows and post-processing were turned off. You can turn either back on in Settings & saves.",
      );
  };
  const setGraphicsOption = (
    option: "shadows" | "postEffects",
    enabled: boolean,
  ) =>
    updateSave((s) => ({
      ...s,
      settings: { ...s.settings, [option]: enabled, graphicsCheck: "manual" },
    }));
  const officeUi = useMemo(
    () =>
      createOfficeUi({
        save,
        content,
        lessonId,
        page: officePage,
        bookOpen:
          bookOpen && !bookClosing && homeWall === "bookshelf" && !homeMoving,
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
      bookClosing,
      homeWall,
      homeMoving,
      questSelection,
      questView,
    ],
  );
  const useWorldUi = realm === "desk" && !officeFallback;
  const showBookReader =
    bookOpen &&
    homeWall === "bookshelf" &&
    !homeMoving &&
    (officeFallback
      ? panel === "library"
      : useWorldUi && (bookReady || bookClosing));
  const bossBattle = FINAL_BOSS_IDS.includes(battle.enemyId),
    battleView = panel === "battle" || settingsFromBattle;
  const battleRank = encounterRank(battle.enemyId, battle.tactics?.boss ?? bossBattle);
  const showBattleScreen = panel === "battle" || (settingsFromBattle && battle.phase === "won");
  const musicMix = useMemo(
    () =>
      chooseMusic({
        intake: intakeOpen,
        panel: battleView ? "battle" : panel,
        reading: bookOpen && homeWall === "bookshelf",
        boss: bossBattle,
        battleWon: battleView && battle.phase === "won",
        battleLost: battleView && battle.phase === "lost",
        dialogue: cinematicActive || Boolean(dialogueId || chapterId),
      }),
    [
      intakeOpen,
      panel,
      battleView,
      bookOpen,
      homeWall,
      bossBattle,
      battle.phase,
      dialogueId,
      cinematicActive,
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
    if (
      action.kind === "graph-select" ||
      (action.kind === "graph-view" && !action.view)
    )
      sound("click");
    if (action.kind === "graph-select") {
      setQuestSelection(id);
      const graph = officeUi.find((m) => m.id === "quests")!.graph!;
      const node = graph.nodes.find((n) => n.id === id);
      if (!node) {
        setQuestView(undefined);
      } else if (!graphShowsNode(node, graph.view)) {
        setQuestView(centerGraph(node, graph.view.zoom));
      } else {
        setQuestView(graph.view);
      }
    }
    if (action.kind === "graph-view") {
      const graph = officeUi.find((m) => m.id === "quests")!.graph!;
      if (action.view) setQuestView(action.view);
      else if (id === "overview") {
        if (graph.branch) setQuestSelection(graph.branch);
        setQuestView(undefined);
      } else if (id === "center")
        setQuestView(
          centerGraph(
            graph.nodes.find((n) => n.id === graph.selected)!,
            graph.view.zoom,
          ),
        );
      else setQuestView(zoomGraph(graph.view, id === "zoom-in" ? 1.2 : 1 / 1.2));
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
    if (action.kind === "page") {
      const page = Math.max(0, Number(id));
      if (homeWall === "desk" && page !== officePage) sound("page");
      setOfficePage(page);
    }
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
      if (q) claimWithFeedback(q);
    }
    if (action.kind === "learn") {
      const skill = skills.find((s) => s.id === id);
      if (skill) updateSave((s) => unlockSkill(s, skill));
    }
  };
  const nextSkill = skills.find((skill) => skill.level > save.character.level);
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
        >
          <ViewportWarning mobileOnly />
        </Onboarding>
      )}
      <header className="topbar" inert={intakeOpen}>
        <a
          className="brand"
          href="#"
          data-sfx-silent={suppressNavigationSfx("desk") || undefined}
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
        <div className="topbar-progress">
          <button
            className="avatar"
            aria-label="Open character"
            data-sfx-silent
            onClick={() => open("character")}
          >
            <img src={detectiveAvatar} alt="" />
          </button>
          <XpMeter
            key={booted ? "ready" : "loading"}
            compact
            xp={save.character.xp}
            reducedMotion={save.settings.reducedMotion}
          />
        </div>
        <div className="chapter">
          <span className="chapter-dot" />
          CASE 007 <span className="top-divider">/</span> ECHO-7
        </div>
        <div className="top-actions">
          {booted && (
            <span className="save-status">
              <span />
              {saveStatus === "All progress saved locally"
                ? "Journal saved"
                : saveStatus}
            </span>
          )}
          <button
            className="icon-button"
            aria-label="Open field manual"
            data-sfx-silent
            title="How to play"
            onClick={() => open("manual")}
          >
            <CircleHelp size={19} />
          </button>
          <button
            className="icon-button"
            aria-label="Open settings"
            data-sfx-silent
            onClick={() => open("settings")}
          >
            <Settings size={19} />
          </button>
        </div>
      </header>
      {booted && !intakeOpen && <ViewportWarning />}
      {!booted && <LoadingScreen journal />}
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
      <SceneTransition
        battleEntry={panel === "battle"}
        sceneKey={
          battleView
            ? `battle:${battle.enemyId}`
            : realm === "desk"
              ? "home"
            : panel === "maze"
              ? "maze"
              : panel === "garden"
                ? "garden"
                : panel === "puzzles"
                  ? `puzzle:${puzzleId ?? "index"}`
                  : `${scene}:${panel ?? "world"}`
        }
        reducedMotion={save.settings.reducedMotion}
        className="world-shell"
        data-encounter-rank={battleView ? battleRank : undefined}
        inert={!booted || intakeOpen}
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
        <Suspense fallback={<LoadingScreen />}>
          <World
            scene={scene}
            officeUi={officeUi}
            officeFocused={officeFocused}
            onOfficeAction={handleOfficeAction}
            onBookReady={setBookReady}
            onRenderFailure={() => setOfficeFallback(true)}
            onRendererReady={() => setOfficeFallback(false)}
            homeWall={homeWall}
            homeLookLocked={
              intakeOpen ||
              debugOpen ||
              bookOpen ||
              panel === "settings" ||
              panel === "supplies" ||
              panel === "character" ||
              !save.story.prologueSeen ||
              prologueReplay ||
              Boolean(chapterId) ||
              Boolean(dialogueId) ||
              Boolean(cutsceneId)
            }
            encounter={battleView}
            combatCue={showBattleScreen ? combatEvent : null}
            encounterRank={battleRank}
            enemyId={battle.enemyId}
            maze={maze}
            renderer={save.settings.renderer}
            shadows={save.settings.shadows}
            postEffects={save.settings.postEffects}
            fsr={save.settings.fsr}
            onGraphicsCheck={
              booted &&
              save.settings.graphicsCheck === "pending" &&
              save.story.prologueSeen &&
              !intakeOpen &&
              !prologueReplay &&
              !homeMoving &&
              !bookOpen &&
              !dialogueId &&
              !cutsceneId &&
              !tutorialId &&
              (!panel || panel === "maze" || panel === "battle")
                ? finishGraphicsCheck
                : undefined
            }
            reducedMotion={save.settings.reducedMotion}
            cinematicActive={cinematicActive}
            locked={
              intakeOpen ||
              debugOpen ||
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
            mazeScreenStep={mazeScreenStep}
            onMetrics={onMetrics}
          />
        </Suspense>
        {realm === "desk" && officeFallback && !panel && !homeMoving && (
          <HomeBoard
            onSelect={open}
            accepted={save.story.caseAccepted}
            finaleReady={finaleAvailable(save, content)}
            caseClosed={save.completed.includes("echo-battle")}
            progress={
              officeUi.find((model) => model.id === "investigation")!
                .investigationProgress!
            }
            total={branches.length}
            completed={branches
              .filter((branch) => branch.objectives.every((id) => save.completed.includes(id)))
              .map((branch) => branch.id)}
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
            panel === "supplies" ||
            panel === "character" ||
            panel === "manual") &&
          !(realm === "desk" && homeMoving) && (
            <section
              className={`activity-panel ${realm === "desk" ? `home-panel home-${homeWall}` : ""} ${panel === "maze" ? "maze-panel" : ""} ${panel === "battle" ? "battle-panel" : ""}`}
              aria-label={`${panel} activity`}
              inert={panel === "library" && bookOpen}
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
                          supplies: "Supply Locker",
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
                    onClick={() => close()}
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
                          onClick={() => openLesson(lesson.id)}
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
                          <button key={id} onClick={() => openLesson(id)}>
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
                            ["north", ArrowUp, "up"],
                            ["west", ArrowLeft, "left"],
                            ["south", ArrowDown, "down"],
                            ["east", ArrowRight, "right"],
                          ] as const
                        ).map(([d, Icon, label]) => (
                          <button
                            key={d}
                            disabled={trialExpired}
                            aria-label={`Move ${label}`}
                            onClick={() =>
                              (mazeScreenStep.current ?? manualMove)(d)
                            }
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
              {showBattleScreen && (
                <BattleScreen
                  key={`${battle.enemyId}:${battle.questionOffset}:${debugBattleRun}`}
                  covered={settingsFromBattle}
                  paused={debugOpen || settingsFromBattle}
                  previewVictory={
                    battle.enemyId === echoActivity.enemy?.id &&
                    !save.completed.includes("echo-battle") &&
                    !finaleAvailable(save, content)
                  }
                  battle={battle}
                  cue={combatEvent}
                  save={save}
                  content={content}
                  question={currentQuestion}
                  answer={answer}
                  notice={battleNotice}
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
                  onItem={(item) => {
                    if (battleRef.current !== battle) return;
                    const current = saveRef.current;
                    const result = itemTurn(battle, current, content, item);
                    if (!result) return;
                    const resource = item.kind === "healing" ? "hp" : "focus";
                    const restored =
                      result.used.character[resource] - current.character[resource];
                    applyBattle(result.battle, result.save, "item", result.used);
                    notify(
                      `${item.title} restored ${restored} ${resource === "hp" ? "HP" : "Focus"}.`,
                    );
                  }}
                  onMomentum={(amount) => {
                    if (battleRef.current !== battle) return;
                    try {
                      const next = selectMomentum(battle, amount);
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
                  onRetreat={() => close()}
                  onEpilogue={
                    epilogueId ? () => setCutsceneId(epilogueId) : undefined
                  }
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
                      key={`${currentPuzzle.id}:${debugPuzzleRun}`}
                      activity={currentPuzzle}
                      run={save.puzzleRuns[currentPuzzle.id]}
                      programState={save.puzzlePrograms[currentPuzzle.id]}
                      onRun={(run) =>
                        updateSave((s) => ({
                          ...s,
                          puzzleRuns: {
                            ...s.puzzleRuns,
                            [currentPuzzle.id]: run,
                          },
                        }))
                      }
                      onProgramChange={(program) =>
                        updateSave((s) => ({
                          ...s,
                          puzzlePrograms: {
                            ...s.puzzlePrograms,
                            [currentPuzzle.id]: program,
                          },
                        }))
                      }
                      completed={save.completed.includes(currentPuzzle.id)}
                      onComplete={(assisted) => {
                        const current = saveRef.current;
                        const next = rewardPuzzle(
                          current, currentPuzzle, content, assisted,
                        );
                        updateSave(() => next);
                        if (next.supply.tokens > current.supply.tokens)
                          notify("Puzzle cleared. +1 Supply Token");
                      }}
                      onContinue={() =>
                        storyBranch(content, currentPuzzle.id)
                          ? continueBranch(currentPuzzle.id)
                          : open("puzzles")
                      }
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
                        disabled={
                          !save.completed.includes(activity.id) &&
                          !activityUnlocked(save, activity.id, content)
                        }
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
                            : !activityUnlocked(save, activity.id, content)
                              ? "Locked · follow the preceding lead"
                              : storyBranch(content, activity.id)
                                ? "Case lead · 25 XP"
                                : "Practice case · 25 XP"}
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
                      const firstClear = !saveRef.current.completed.includes("perceptron-exhibit");
                      updateSave((s) =>
                        evidence(
                          completeActivity(s, "perceptron-exhibit"),
                          "perceptron-basics",
                          "held-out-boundary",
                        ),
                      );
                      notify(
                        firstClear ? "Calibration complete. +1 Supply Token" : "Calibration complete.",
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
                    onClaim={claimWithFeedback}
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
                      claimWithFeedback(quest);
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
                    onStart={(id) => open(id)}
                    onClaim={claimWithFeedback}
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
              {panel === "supplies" && (
                <SupplyLocker
                  save={save}
                  content={content}
                  onDraw={() => {
                    const result = drawSupply(saveRef.current, content);
                    if (!result.item) return;
                    updateSave(() => result.save);
                    return result.item;
                  }}
                  onEquip={(id) => {
                    const item = supplyItems.find((entry) => entry.id === id);
                    if (item) updateSave((current) => equipGear(current, item));
                  }}
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
                      {nextSkill && (
                        <p>Level {nextSkill.level} unlocks {nextSkill.title}</p>
                      )}
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
                  <h3>Battle</h3>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={!save.settings.combatMuted}
                      onChange={(e) =>
                        updateSave((s) => ({
                          ...s,
                          settings: {
                            ...s.settings,
                            combatMuted: !e.target.checked,
                          },
                        }))
                      }
                    />
                    Battle sound
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={save.settings.battleAutoAdvance}
                      onChange={(e) =>
                        updateSave((s) => ({
                          ...s,
                          settings: {
                            ...s.settings,
                            battleAutoAdvance: e.target.checked,
                          },
                        }))
                      }
                    />
                    Automatically advance battle turns
                  </label>
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
                    Set it to 0 to silence music.
                  </p>
                  <label>
                    Sound effects volume{" "}
                    <output>
                      {Math.round(save.settings.sfxVolume * 100)}%
                    </output>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={Math.round(save.settings.sfxVolume * 100)}
                      aria-label="Sound effects volume"
                      aria-valuetext={`${Math.round(save.settings.sfxVolume * 100)} percent`}
                      onChange={(e) =>
                        updateSave((s) => ({
                          ...s,
                          settings: {
                            ...s.settings,
                            sfxVolume: Number(e.target.value) / 100,
                          },
                        }))
                      }
                    />
                  </label>
                  <button
                    data-sfx-silent
                    disabled={save.settings.sfxVolume === 0}
                    onClick={() => sound("clue")}
                  >
                    Preview sound effects
                  </button>
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
                      checked={save.settings.shadows}
                      onChange={(e) =>
                        setGraphicsOption("shadows", e.target.checked)
                      }
                    />{" "}
                    Cast shadows in the office and battles
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={save.settings.postEffects}
                      onChange={(e) =>
                        setGraphicsOption("postEffects", e.target.checked)
                      }
                    />{" "}
                    Post-processing effects
                  </label>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={save.settings.fsr}
                      onChange={(e) =>
                        updateSave((s) => ({
                          ...s,
                          settings: { ...s.settings, fsr: e.target.checked },
                        }))
                      }
                    />{" "}
                    AMD FSR 1 upscaling in the network and battles
                  </label>
                  {save.settings.graphicsCheck === "reduced" && (
                    <p className="muted">
                      Shadows and post-processing were turned off after the
                      first performance check.
                    </p>
                  )}
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
                  <h3>Credits</h3>
                  <p>
                    Created for the Computer Science and AI class at Beijing Institute of Technology
                    <br />
                    Created with love by team B.O.T.A.K
                    <br />
                    Development lead by Devon
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
        {realm === "desk" && officeFallback && !bookOpen && (
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
        {showBookReader && (
          <BookReader
            lessons={lessons}
            lesson={currentLesson}
            reducedMotion={save.settings.reducedMotion}
            bookmarked={save.bookmarks.includes(lessonId)}
            note={save.notes[lessonId] ?? ""}
            reading={save.reading}
            onPreferences={(mode, fontSize) =>
              updateReading((reading) => ({ ...reading, mode, fontSize }))
            }
            onPosition={(id, position) =>
              updateReading(
                (reading) => {
                  const current = reading.positions[id];
                  if (
                    current?.block === position.block &&
                    current?.offset === position.offset
                  )
                    return reading;
                  return {
                    ...reading,
                    positions: { ...reading.positions, [id]: position },
                  };
                },
                saveRef.current.reading.mode === "book",
              )
            }
            onSelect={selectReadingLesson}
            onClosing={() => setBookClosing(true)}
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
          panel !== "supplies" &&
          panel !== "character" &&
          panel !== "manual" && (
            <RoomTurns
              wall={homeWall}
              disabled={
                debugOpen ||
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
          panel !== "supplies" &&
          panel !== "character" &&
          panel !== "manual" && (
            <WorldUiControls
              model={officeUi.find((m) => m.id === homeWall)!}
              blocked={
                debugOpen ||
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
              silentNavigation={suppressNavigationSfx}
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
      </SceneTransition>
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
            disabled={battleView}
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
      {cinematicActive && (
        <Cutscene
          key={cutsceneId ?? "intro"}
          savedName={save.character.name}
          story={activeStory}
          renderer={save.settings.renderer}
          reducedMotion={save.settings.reducedMotion}
          onFinish={() => {
            if (activeStory.visual === "finale") {
              setCutsceneId(null);
              open("journal");
            } else if (cutsceneId) {
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
                    if (owner) claimWithFeedback(owner);
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
      {debugOpen && (
        <DebugMenu
          save={save}
          content={content}
          battle={panel === "battle" ? battle : null}
          answer={
            panel === "battle" && battle.phase === "question" ? currentQuestion : undefined
          }
          onClose={() => setDebugOpen(false)}
          onTravel={debugTravelTo}
          onSave={replaceDebugSave}
          onBattle={debugBattleAction}
          onExport={exportSave}
          onMaze={panel === "maze" ? solveDebugMaze : undefined}
          onPuzzle={panel === "puzzles" && currentPuzzle?.puzzle ? solveDebugPuzzle : undefined}
          onRestore={() => {
            if (!debugCheckpoint.current) return;
            replaceDebugSave(debugCheckpoint.current);
            resetMaze(debugCheckpoint.current.seed, false);
            setCombatEvent(null);
            setDialogueId(null);
            setChapterId(null);
            setCutsceneId(null);
            setPendingActivity(null);
            setPrologueReplay(false);
            setTutorialId(null);
            setBookOpen(false);
            setDebugOpen(false);
            close();
            notify("Debug checkpoint restored.");
          }}
        />
      )}
      {pendingBattleExit && (
        <div
          className="battle-abandon-backdrop"
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              cancelBattleExit();
            } else if (event.key === "Tab") {
              const buttons = event.currentTarget.querySelectorAll<HTMLButtonElement>("button:not(:disabled)");
              const first = buttons[0], last = buttons[buttons.length - 1];
              if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
              } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
              }
            }
          }}
        >
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="battle-abandon-title"
            aria-describedby="battle-abandon-copy"
            className="battle-abandon-dialog"
          >
            <h2 id="battle-abandon-title">
              {pendingBattleExit.kind === "import" ? "Leave battle to import?" : "Leave this battle?"}
            </h2>
            <p id="battle-abandon-copy">
              {pendingBattleExit.kind === "import"
                ? "Importing a journal replaces this save and ends the encounter."
                : "Leaving ends the encounter. Your investigation progress and recovered evidence are safe."}
            </p>
            <div>
              <button autoFocus onClick={cancelBattleExit}>Stay in battle</button>
              <button className="primary" onClick={confirmBattleExit}>
                {pendingBattleExit.kind === "import" ? "Import journal" : "Leave battle"}
              </button>
            </div>
          </section>
        </div>
      )}
      {toast && !(panel === "battle" && battle.phase === "lost") && (
        <GameNotice
          key={`${noticeSequence}:${toast}`}
          message={toast}
          onDismiss={() => setToast("")}
        />
      )}
    </div>
  );
}
