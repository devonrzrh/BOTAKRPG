# Markdown content contract · version 1

Run `npm run content` after editing Markdown anywhere under `content/`. Production builds run this automatically; the development server must be restarted or this command rerun after content edits. The generated `src/generated/content.json` is runtime data, not the authoring source. Imported chapters are in `content/source/`; refreshing them with `npm run source:import` replaces that snapshot from `Source/`. Put hand-authored checkpoints in `scripts/create-curriculum.ts` or edit `content/08-curriculum.md` if no refresh is planned.

## Lessons

Each lesson begins with YAML frontmatter. The Markdown body supports headings, tables, links, and fenced code. Rendered HTML is sanitized with DOMPurify before display.

```yaml
---
type: lesson
id: graph-search
title: Finding a way through
topic: algorithms
summary: Explore a graph with BFS and DFS.
prerequisites: []
---
```

Topics: `algorithms`, `structures`, `ai`. IDs start with a lowercase letter and contain lowercase letters, numbers, or hyphens. IDs are permanent references, including in existing saves. Prerequisites express a learning recommendation; lessons stay readable.

## Questions

Place a fenced block with language `question` in a lesson file. These blocks compile into question data and are removed from the rendered lesson.

```yaml
id: bfs-shortest
title: The shortest way
lesson: graph-search
format: choice
prompt: Which traversal finds a shortest path in an unweighted graph?
options: [BFS, DFS, Random search]
answer: [0]
explanation: BFS explores vertices in nondecreasing distance from the start.
```

Use `format: ordering` with `answer` containing every option index exactly once in the correct order. Choice questions require exactly one correct index. `format: multiple` accepts an exact set of correct indices, independent of selection order, with no extra selections. Indices are zero-based. Quote numeric option text (`'0'`), because YAML otherwise parses it as a number. Every question requires an explanation and an existing lesson reference. Questions imported from the PDF use permanent `bank-aN` and `bank-bN` IDs. Open-ended Part C is self-study in the test-bank book, not automatically graded combat.

Battle enemies may set `lessons: [lesson-id, ...]` to select encounter-specific questions independently of the chosen skill. Pools rotate across those lessons. Without this field, legacy skill-linked or mixed questions retain their behavior. Branch objectives are ordered: the quest board opens the next unfinished objective. Chapter encounter entry checks all earlier objectives before starting. The final objective of each branch supplies its revealed clue.

## Other entities

Use fenced blocks with language `entity`. Each requires `type`, `id`, and `title`, followed by the fields below. See `content/04-academy.md` for complete examples. The Zod schemas in `src/content/schema.ts` are the executable contract.

Story files use frontmatter with `type: story`, `id`, `title`, optional `visual: chase | network`, and one to twenty `frames`. Each frame has `time`, `heading`, and `body`. Optional `steps` sets the number of advance inputs before the next frame (default 1). See `content/00-prologue.md`. The prologue uses these frames for the pursuit and saves completion separately from quest rewards. Existing saves without story progress start with the prologue unseen.

| Type       | Fields                                                                                                               |
| ---------- | -------------------------------------------------------------------------------------------------------------------- |
| `activity` | `template`: maze / battle / perceptron; `lesson`; optional integer `seed` (default 42)                               |
| `quest`    | `description`; nonempty `objectives` activity IDs; positive integer `xp`; `rewards` item IDs                         |
| `item`     | `description`; `kind`: healing / focus / equipment; positive integer `amount`                                        |
| `skill`    | `description`; nonnegative `cost`, `power`; positive integer `level`; `lesson`; optional `parent` skill and `effect` |
| `effect`   | `description`; positive integer `duration`; positive `magnitude`                                                     |

Registered templates live in `src/game/activities.ts`. Adding a new template requires a TypeScript implementation and extending the template schema; Markdown alone cannot execute code. The first slice expects the sample encounter and item IDs; new curriculum records can be added freely, while replacing the chapter requires updating its host composition.

Effects currently supported by combat are `shield`, `poison`, and `weaken`. Shield reduces incoming damage; weaken reduces enemy attack; poison ticks before enemy attacks. Duration counts enemy turns. Applying the same effect refreshes it, rather than stacking. A poison knockout prevents that enemy's attack. Player item use takes one enemy turn. Correct skill answers spend focus and deal attack plus skill power; incorrect answers spend focus and the turn. Incoming damage is at least 1 after defense and effects.

Quest rewards can be claimed once after all objectives. Character levels increase every 100 total XP; leveling restores health/focus. Mastery counts unique unaided correct question IDs separately from XP, and practical proofs are deduplicated. Assisted answers never add mastery credit.

## Validation and future LLM conversion

The compiler rejects malformed fields, duplicate IDs, unresolved references, invalid answer indices, and lesson/skill prerequisite cycles. Ask the future conversion model to preserve this contract, quote option text, cite concepts in explanations, and produce reviewable Markdown. Review question accuracy before adding generated material. Run the compiler and tests before shipping.

## Dialogues and clues

A `type: dialogue` record has `id`, `title`, `start`, and `nodes`. Each node has a unique `id`, a `speaker`, `text`, and `choices`. Each choice has a `label` and exactly one of `next` (an existing node ID) or `action` (`accept-case` or `close`). See `content/05-case-dialogue.md`. Missing targets and ambiguous choices fail validation. Dialogue loops are allowed.

Activities may supply `clue: { title, text }`. Completed quest objectives expose those clues on the quest board. Clues derive from saved completion IDs; no separate duplicate reward can be claimed. Briefing, quest acceptance, and connection cutscene flags persist with story progress.

## Quest branches and finale

Quest `kind` is `case` (default), `branch`, or `finale`. Each branch may link a `lesson`. Quest `prerequisites` reference other quests; the compiler rejects missing references and cycles. A prerequisite is satisfied when its objectives are complete; reward claiming is optional for unlocks. See `content/07-quest-branches.md`.

Battle activities may configure an `enemy` with `id`, `title`, positive integer `hp` and `attack`, and `mixedQuestions` (default false). Mixed encounters select from the full question bank; ordinary encounters select by skill lesson. The finale uses this shared battle implementation.
