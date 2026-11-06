# Markdown content contract · version 1

Run `npm run content` after editing `content/*.md`. Production builds run this automatically; the development server must be restarted or this command rerun after content edits. The generated `src/generated/content.json` is runtime data, not the authoring source.

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

Use `format: ordering` with `answer` containing every option index exactly once in the correct order. Choice questions require exactly one correct index. Indices are zero-based. Quote numeric option text (`'0'`), because YAML otherwise parses it as a number. Every question requires an explanation and an existing lesson reference.

## Other entities

Use fenced blocks with language `entity`. Each requires `type`, `id`, and `title`, followed by the fields below. See `content/04-academy.md` for complete examples. The Zod schemas in `src/content/schema.ts` are the executable contract.

Story files use frontmatter with `type: story`, `id`, `title`, and exactly three `frames`. Each frame has `time`, `heading`, and `body`. See `content/00-prologue.md`. The prologue uses these frames for the pursuit and saves completion separately from quest rewards. Existing saves without story progress start with the prologue unseen.

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
