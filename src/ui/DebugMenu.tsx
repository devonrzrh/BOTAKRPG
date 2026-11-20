import { useEffect, useId, useRef, useState } from "react";
import { Terminal, X } from "lucide-react";
import type { Content, Question } from "../content/schema";
import type { Battle } from "../game/combat";
import { BATTLE_CUE_PREVIEWS, createCombatAudio } from "../game/combatAudio";
import type { BattleCue } from "../game/combatPresentation";
import { applyDebugSaveAction, type DebugSaveAction } from "../game/debug";
import { SFX_CUES } from "../game/soundManager";
import type { Save } from "../game/state";
import { useGameSound } from "./GameSound";
import "./DebugMenu.css";

const tabs = [
  "Travel",
  "Player",
  "Progress",
  "Inspect",
  "Audio",
  "Encounter",
] as const;
type Tab = (typeof tabs)[number];
type Option = { id: string; title: string };

const locations: Option[] = [
  { id: "desk", title: "Detective's desk" },
  { id: "journal", title: "Quest journal" },
  { id: "inventory", title: "Clue ledger" },
  { id: "library", title: "Library" },
  { id: "network", title: "Network" },
  { id: "battle", title: "Guardian encounter" },
  { id: "maze", title: "Packet maze" },
  { id: "garden", title: "Signal lab" },
  { id: "puzzles", title: "Field puzzles" },
  { id: "intro", title: "Replay prologue" },
  { id: "manual", title: "Field manual" },
  { id: "character", title: "Character" },
  { id: "supplies", title: "Supply locker" },
  { id: "settings", title: "Settings" },
];
const soundCueNames = (Object.keys(SFX_CUES) as (keyof typeof SFX_CUES)[])
  .filter((cue) => !cue.startsWith("battle"));

function Picker({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Option[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <label className="debug-field">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
      >
        <option value="">Choose {label.toLowerCase()}</option>
        {options.map(({ id, title }) => (
          <option key={id} value={id}>
            {title}
          </option>
        ))}
      </select>
    </label>
  );
}

export interface DebugMenuProps {
  save: Save;
  content: Content;
  battle: Battle | null;
  answer?: Question;
  onClose: () => void;
  onTravel: (id: string) => void;
  onSave: (next: Save) => void;
  onBattle: (
    action: "win" | "lose" | "reset" | "reveal" | "focus" | "momentum",
  ) => void;
  onExport: () => void;
  onRestore?: () => void;
  onPuzzle?: (action: "solve") => void;
  onMaze?: (action: "solve") => void;
}

export function DebugMenu({
  save,
  content,
  battle,
  answer,
  onClose,
  onTravel,
  onSave,
  onBattle,
  onExport,
  onRestore,
  onPuzzle,
  onMaze,
}: DebugMenuProps) {
  const root = useRef<HTMLDialogElement>(null);
  const combatAudio = useRef<ReturnType<typeof createCombatAudio> | null>(null);
  const previewSequence = useRef(0);
  const sound = useGameSound();
  const titleId = useId();
  const [tab, setTab] = useState<Tab>("Travel");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [item, setItem] = useState("");
  const [skill, setSkill] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [tokens, setTokens] = useState("10");
  const [xp, setXp] = useState("100");
  const [activity, setActivity] = useState("");
  const [chapter, setChapter] = useState("");
  const [lesson, setLesson] = useState("");
  const [mastery, setMastery] = useState("1");
  const [dialogue, setDialogue] = useState("");
  const [entityId, setEntityId] = useState("");
  const [draft, setDraft] = useState<string | null>(null);

  useEffect(() => {
    const dialog = root.current!;
    dialog.showModal();
    return () => dialog.close();
  }, []);
  useEffect(() => {
    const audio = createCombatAudio();
    combatAudio.current = audio;
    return () => {
      audio.dispose();
      combatAudio.current = null;
    };
  }, []);
  useEffect(() => {
    combatAudio.current?.setVolume(save.settings.sfxVolume);
  }, [save.settings.sfxVolume]);

  function previewBattleSound(cue: Omit<BattleCue, "sequence">) {
    const audio = combatAudio.current;
    if (!audio) return;
    audio.unlock();
    audio.play(
      { ...cue, sequence: ++previewSequence.current },
      save.settings.reducedMotion,
    );
  }

  const { entities } = content;
  const chapters = entities.filter(
    (entry) => entry.type === "quest" && entry.kind === "chapter",
  );
  const items = entities.filter((entry) => entry.type === "item");
  const activities = entities.filter((entry) => entry.type === "activity");
  const skills = entities.filter((entry) => entry.type === "skill");
  const lessons = entities.filter((entry) => entry.type === "lesson");
  const dialogues = entities.filter((entry) => entry.type === "dialogue");
  const cutscenes = entities.filter((entry) => entry.type === "story");
  const entity = entities.find((entry) => entry.id === entityId);
  const selectedItem = items.find((entry) => entry.id === item);
  const kind = selectedItem?.kind;
  const canEquip = kind === "weapon" || kind === "armor";
  const itemEquipped =
    canEquip && save.supply.equipped[kind] === selectedItem?.id;
  const query = search.trim().toLowerCase();
  const travelGroups = [
    { kind: "location", label: "Locations", options: locations },
    { kind: "activity", label: "Activities", options: activities },
    { kind: "chapter", label: "Chapters", options: chapters },
    { kind: "lesson", label: "Books", options: lessons },
    { kind: "dialogue", label: "Conversations", options: dialogues },
    { kind: "cutscene", label: "Cutscenes", options: cutscenes },
  ]
    .map((group) => ({
      ...group,
      options: group.options.filter((entry) =>
        `${entry.title} ${entry.id}`.toLowerCase().includes(query),
      ),
    }))
    .filter(({ options }) => options.length > 0);

  function run(action: () => void, confirmation?: string) {
    try {
      action();
      setStatus(confirmation ?? "");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error));
    }
  }

  function update(action: DebugSaveAction) {
    run(
      () => onSave(applyDebugSaveAction(save, content, action)),
      "Journal updated.",
    );
  }

  return (
    <dialog
      ref={root}
      className="debug-menu"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      data-game-navigation="native"
      onCancel={(event) => {
        event.preventDefault();
        event.stopPropagation();
        onClose();
      }}
      onKeyDown={(event) => {
        if (event.key !== "Escape") return;
        event.preventDefault();
        event.stopPropagation();
        onClose();
      }}
    >
      <header className="debug-heading">
        <Terminal size={22} aria-hidden="true" />
        <h2 id={titleId}>Debug menu</h2>
        <span>
          <kbd>F9</kbd> to reopen
        </span>
        <button
          className="debug-close"
          type="button"
          aria-label="Close debug menu"
          onClick={onClose}
        >
          <X size={22} aria-hidden="true" />
        </button>
      </header>
      <nav className="debug-tabs" aria-label="Debug sections">
        {tabs.map((label) => (
          <button
            key={label}
            type="button"
            aria-current={label === tab ? "page" : undefined}
            onClick={() => {
              setTab(label);
              setStatus("");
            }}
          >
            {label}
          </button>
        ))}
      </nav>
      <div className="debug-body" key={tab}>
        {tab === "Travel" && (
          <>
            <label className="debug-field">
              Find a destination
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.currentTarget.value)}
              />
            </label>
            {travelGroups.map(({ kind, label, options }) => (
              <section key={kind}>
                <h3>{label}</h3>
                <div className="debug-destinations">
                  {options.map((entry) => (
                    <button
                      key={entry.id}
                      type="button"
                      title={entry.id}
                      onClick={() => run(() => onTravel(`${kind}:${entry.id}`))}
                    >
                      {entry.title}
                    </button>
                  ))}
                </div>
              </section>
            ))}
            {travelGroups.length === 0 && <p>No destinations match.</p>}
          </>
        )}
        {tab === "Player" && (
          <>
            <section>
              <h3>Character</h3>
              <p>
                Level {save.character.level} · {save.character.xp} XP ·{" "}
                {save.character.hp} HP · {save.character.focus} focus
              </p>
              <div className="debug-actions">
                <label className="debug-field">
                  XP to grant
                  <input
                    type="number"
                    min={1}
                    max={Number.MAX_SAFE_INTEGER}
                    value={xp}
                    onChange={(event) => setXp(event.currentTarget.value)}
                  />
                </label>
                <button
                  type="button"
                  disabled={xp === ""}
                  onClick={() => update({ type: "xp", amount: Number(xp) })}
                >
                  Grant XP
                </button>
                <button
                  type="button"
                  onClick={() => update({ type: "recover" })}
                >
                  Restore HP and focus
                </button>
              </div>
            </section>
            <section>
              <h3>Supplies</h3>
              <p>{save.supply.tokens} supply tokens</p>
              <div className="debug-actions">
                <label className="debug-field">
                  Tokens to grant
                  <input
                    type="number"
                    min={1}
                    max={Number.MAX_SAFE_INTEGER}
                    value={tokens}
                    onChange={(event) => setTokens(event.currentTarget.value)}
                  />
                </label>
                <button
                  type="button"
                  disabled={tokens === ""}
                  onClick={() =>
                    update({ type: "tokens", amount: Number(tokens) })
                  }
                >
                  Grant tokens
                </button>
                <button
                  type="button"
                  onClick={() => update({ type: "all-items" })}
                >
                  Grant every item
                </button>
              </div>
              <div className="debug-actions">
                <Picker
                  label="Item"
                  options={items}
                  value={item}
                  onChange={setItem}
                />
                <label className="debug-field">
                  Quantity
                  <input
                    type="number"
                    min={1}
                    max={Number.MAX_SAFE_INTEGER}
                    value={quantity}
                    onChange={(event) => setQuantity(event.currentTarget.value)}
                  />
                </label>
                <button
                  type="button"
                  disabled={!item || quantity === ""}
                  onClick={() =>
                    update({
                      type: "grant-item",
                      id: item,
                      amount: Number(quantity),
                    })
                  }
                >
                  Grant item
                </button>
                <button
                  type="button"
                  disabled={!canEquip}
                  onClick={() => update({ type: "equip-item", id: item })}
                >
                  {itemEquipped ? "Unequip" : "Equip"}
                </button>
              </div>
              {item && <p>Owned: {save.supply.items[item] ?? 0}</p>}
            </section>
            <section>
              <h3>Skills</h3>
              <div className="debug-actions">
                <Picker
                  label="Skill"
                  options={skills}
                  value={skill}
                  onChange={setSkill}
                />
                <button
                  type="button"
                  disabled={!skill}
                  onClick={() => update({ type: "unlock-skill", id: skill })}
                >
                  Unlock skill
                </button>
                <button
                  type="button"
                  onClick={() => update({ type: "all-skills" })}
                >
                  Unlock every skill
                </button>
              </div>
            </section>
          </>
        )}
        {tab === "Progress" && (
          <>
            <section>
              <h3>Campaign</h3>
              <p>
                {save.completed.length} activities complete ·{" "}
                {save.claimed.length} rewards claimed
              </p>
              <div className="debug-actions">
                <button
                  type="button"
                  onClick={() => update({ type: "unlock-all" })}
                >
                  Unlock all activities
                </button>
                <button
                  type="button"
                  onClick={() => update({ type: "complete-all" })}
                >
                  Complete all activities
                </button>
              </div>
              <div className="debug-actions">
                <Picker
                  label="Activity"
                  options={activities}
                  value={activity}
                  onChange={setActivity}
                />
                <button
                  type="button"
                  disabled={!activity}
                  onClick={() =>
                    update({ type: "unlock-activity", id: activity })
                  }
                >
                  Unlock activity
                </button>
                <button
                  type="button"
                  disabled={!activity}
                  onClick={() =>
                    update({ type: "complete-activity", id: activity })
                  }
                >
                  Complete activity
                </button>
              </div>
              <div className="debug-actions">
                <Picker
                  label="Chapter"
                  options={chapters}
                  value={chapter}
                  onChange={setChapter}
                />
                <button
                  type="button"
                  disabled={!chapter}
                  onClick={() =>
                    update({ type: "practice-chapter", id: chapter })
                  }
                >
                  Pass guided practice
                </button>
              </div>
            </section>
            <section>
              <h3>Mastery</h3>
              <div className="debug-actions">
                <Picker
                  label="Lesson"
                  options={lessons}
                  value={lesson}
                  onChange={setLesson}
                />
                <label className="debug-field">
                  Correct answers to add
                  <input
                    type="number"
                    min={1}
                    value={mastery}
                    onChange={(event) => setMastery(event.currentTarget.value)}
                  />
                </label>
                <button
                  type="button"
                  disabled={!lesson || mastery === ""}
                  onClick={() =>
                    update({
                      type: "mastery",
                      id: lesson,
                      amount: Number(mastery),
                    })
                  }
                >
                  Add mastery
                </button>
                <button
                  type="button"
                  onClick={() => update({ type: "all-mastery" })}
                >
                  Max all mastery
                </button>
              </div>
            </section>
            <section>
              <h3>Story</h3>
              <div className="debug-actions">
                <Picker
                  label="Conversation"
                  options={dialogues}
                  value={dialogue}
                  onChange={setDialogue}
                />
                <button
                  type="button"
                  disabled={!dialogue}
                  onClick={() => update({ type: "see-dialogue", id: dialogue })}
                >
                  Mark seen
                </button>
                <button
                  type="button"
                  onClick={() => update({ type: "all-dialogue" })}
                >
                  Mark all seen
                </button>
              </div>
            </section>
          </>
        )}
        {tab === "Inspect" && (
          <>
            <section>
              <h3>Content</h3>
              <Picker
                label="Record"
                options={entities.map((entry) => ({
                  ...entry,
                  title: `${entry.type} · ${entry.title} [${entry.id}]`,
                }))}
                value={entityId}
                onChange={setEntityId}
              />
              {entity && (
                <pre tabIndex={0}>{JSON.stringify(entity, null, 2)}</pre>
              )}
            </section>
            <section>
              <h3>Journal</h3>
              <div className="debug-actions">
                <button type="button" onClick={() => run(onExport)}>
                  Export journal
                </button>
                {draft === null && (
                  <button
                    type="button"
                    onClick={() => setDraft(JSON.stringify(save, null, 2))}
                  >
                    Edit journal JSON
                  </button>
                )}
              </div>
              {draft === null ? (
                <pre tabIndex={0}>{JSON.stringify(save, null, 2)}</pre>
              ) : (
                <>
                  <label className="debug-field">
                    Journal JSON
                    <textarea
                      rows={12}
                      spellCheck={false}
                      value={draft}
                      onChange={(event) => setDraft(event.currentTarget.value)}
                    />
                  </label>
                  <div className="debug-actions">
                    <button
                      type="button"
                      onClick={() =>
                        run(() => {
                          onSave(JSON.parse(draft) as Save);
                          setDraft(null);
                        }, "Journal replaced.")
                      }
                    >
                      Apply journal JSON
                    </button>
                    <button type="button" onClick={() => setDraft(null)}>
                      Discard edits
                    </button>
                  </div>
                </>
              )}
            </section>
          </>
        )}
        {tab === "Audio" && (
          <>
            <section>
              <h3>Bundled sound effects</h3>
              <div className="debug-actions">
                {soundCueNames.map((cue) => (
                  <button
                    key={cue}
                    type="button"
                    data-sfx-silent
                    onClick={() => sound(cue)}
                  >
                    {SFX_CUES[cue].label}
                  </button>
                ))}
              </div>
            </section>
            <section>
              <h3>Battle sound effects</h3>
              <div className="debug-actions">
                {BATTLE_CUE_PREVIEWS.map(({ label, cue }) => (
                  <button
                    key={label}
                    type="button"
                    data-sfx-silent
                    onClick={() => previewBattleSound(cue)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </section>
          </>
        )}
        {tab === "Encounter" && (
          <>
            {battle && (
              <section>
                <h3>{battle.enemyName}</h3>
                <p>
                  {battle.hp} / {battle.maxHp} HP · Turn {battle.turn} ·{" "}
                  {battle.phase}
                </p>
                <div className="debug-actions">
                  <button
                    type="button"
                    onClick={() => run(() => onBattle("win"))}
                  >
                    Force victory
                  </button>
                  <button
                    type="button"
                    onClick={() => run(() => onBattle("lose"))}
                  >
                    Force defeat
                  </button>
                  <button
                    type="button"
                    onClick={() => run(() => onBattle("reset"))}
                  >
                    Restart battle
                  </button>
                  <button
                    type="button"
                    onClick={() => run(() => onBattle("focus"))}
                  >
                    Restore focus
                  </button>
                  <button
                    type="button"
                    onClick={() => run(() => onBattle("momentum"))}
                  >
                    Fill momentum
                  </button>
                  <button
                    type="button"
                    disabled={!answer && !battle.tactics}
                    onClick={() => run(() => onBattle("reveal"))}
                  >
                    {answer ? "Select correct answer" : "Reveal enemy weakness"}
                  </button>
                </div>
                {answer && (
                  <details open>
                    <summary>Current question answer</summary>
                    <p>{answer.prompt}</p>
                    <ol>
                      {answer.answer.map((index) => (
                        <li key={index}>{answer.options[index]}</li>
                      ))}
                    </ol>
                    <p>{answer.explanation}</p>
                  </details>
                )}
                <details>
                  <summary>Battle state</summary>
                  <pre tabIndex={0}>{JSON.stringify(battle, null, 2)}</pre>
                </details>
              </section>
            )}
            {(onPuzzle || onMaze) && (
              <section className="debug-actions">
                {onPuzzle && (
                  <button
                    type="button"
                    onClick={() => run(() => onPuzzle("solve"))}
                  >
                    Solve current puzzle
                  </button>
                )}
                {onMaze && (
                  <button
                    type="button"
                    onClick={() => run(() => onMaze("solve"))}
                  >
                    Solve current maze
                  </button>
                )}
              </section>
            )}
            {!battle && !onPuzzle && !onMaze && (
              <p>Open a battle, maze, or puzzle to use encounter controls.</p>
            )}
          </>
        )}
      </div>
      <footer className="debug-footer">
        <p role="status">{status || "Journal edits autosave."}</p>
        {onRestore && (
          <button
            type="button"
            onClick={() => run(onRestore, "Journal checkpoint restored.")}
          >
            Restore session checkpoint
          </button>
        )}
      </footer>
    </dialog>
  );
}
