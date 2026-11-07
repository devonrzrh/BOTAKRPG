# NULL / TRACE

A local-first learning RPG built with TypeScript, React, Babylon.js, Blockly, and a browser-local Pyodide worker. Detective Vale pursues ECHO-7, a rogue robot that escapes into the network. The home is a first-person room. Its investigation wall, bookshelf, quest board, and clue ledger are connected by quick camera turns. The top menu bar stays visible during gameplay, cutscenes, and dialogue. The first chapter includes an algorithm maze, quiz battle, and perceptron lab.

## Run

### Requirements

- **Node.js 22 or newer** (includes npm). Check with `node --version` and `npm --version`.
- A modern browser with **WebGPU** or **WebGL2**. The app tries WebGPU first and falls back to WebGL2.
- No Python installation is required for normal play: Python runs in the browser through Pyodide.
- Optional: **Poppler** (`pdftotext` on `PATH`) only if you want to re-import the untracked `Source/` material with `npm run source:import`.

### Install and start

```sh
npm install
npm run dev
```

Open the URL Vite prints, normally `http://127.0.0.1:5173/`. If that port is busy, Vite prints the next free port.

On Windows you can also double-click `run-dev.bat`, which checks for Node and installed dependencies before starting Vite.

### Other commands

```sh
npm test        # model, content, save and worker tests
npm run check   # TypeScript only, no build
npm run build   # validate content, copy Python runtime, type-check, build dist/
npm run preview # serve dist/ with the required COOP/COEP headers
```

`npm run dev` and `npm run build` regenerate `src/generated/content.json` and copy the installed Pyodide files into `public/pyodide/` automatically. `dist/` is build output; do not edit it by hand.

### Dependencies

Runtime packages:

| Package               | Used for                                       |
| --------------------- | ---------------------------------------------- |
| `react`, `react-dom`  | UI and screens                                 |
| `@babylonjs/core`     | 3D office, maze, encounters and combat effects |
| `zod`                 | Save and content validation                    |
| `marked`, `dompurify` | Lesson Markdown rendering and sanitising       |
| `@codemirror/*`       | Python editor                                  |
| `blockly`             | Visual block editor                            |
| `pyodide`             | Browser Python runtime                         |
| `yaml`                | Markdown/YAML content import                   |
| `lucide-react`        | Interface icons                                |

Development-only packages: `vite`, `@vitejs/plugin-react`, `typescript`, `vitest`, `tsx`, `prettier`, `fake-indexeddb`, `@types/*`.

### Python and hosting headers

Browser Python needs cross-origin isolation. `npm run dev` and `npm run preview` set the headers automatically. For a static host, keep `public/_headers` (copied into `dist/`) or return these headers:

```text
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

Without them the app explains that Python is unavailable and the manual activities still work.

### Troubleshooting

- **`npm` not found**: install Node.js 22+ and reopen the terminal.
- **Blank page**: check the browser console; force WebGL2 in Settings if WebGPU is unsupported.
- **Python unavailable**: the page is not cross-origin isolated, or `public/pyodide/` is missing. Run `npm run runtime` and serve with the headers above.
- **Save looks stale**: progress is in IndexedDB for that origin. Export from Settings before clearing site data or changing ports.
- **Port already in use**: stop the other dev server, or open the alternate URL Vite prints.

## Source curriculum

Quests now follow the material chapters. Choose a subject on the quest screen, then **Chapter quests**. Each chapter introduces a concept, shows a worked example, offers guided practice with explanations, and leads into its encounter check. The full chapter stays available through **Read chapter**. See [chapter learning flow](docs/chapter-learning.md).

All 31 supplied chapters are available through **Bookshelf → open a volume → Contents**. Choose a large paged **Book** or continuous **Fullscreen** view. Tools provides text sizes, bookmarks, and personal notes; Contents searches the full text and jumps to sections. Click diagrams to enlarge and zoom them. See [reading controls](docs/reading.md). The module guide includes supplied review records and supporting indexes. The test-bank book includes all 95 questions and explanations; its 13 written exercises are self-assessed.

Each of the three clue branches now continues through its subject's chapters and ends at a boss: Route Warden, Archive Keeper or Signal Mimic. The existing maze, sentinel and perceptron activities introduce those branches. **Pursue lead** opens the next unfinished activity; **Materials** opens its chapter. All three branch bosses must be completed to unlock ECHO-7. Chapter encounters grant first-clear XP; replaying cannot claim them twice.

`content/source/` is the committed, playable Markdown edition. `public/materials/` preserves every supplied file unchanged, and `content/source-manifest.json` records checksums and chapter IDs. Normal builds work without the untracked `Source/` folder or PDF tools. To refresh from an updated `Source/`, install Poppler (`pdftotext` on PATH), then run `npm run source:import`. See [coverage and editorial changes](docs/source-coverage.md).

## Onboarding and field tips

A new journal starts with a two-step intake: sign the case with a detective name, then orient the office. The name appears in the top bar, ledger, and dialogue, and can be changed from the character panel. Seven first-visit field tips cover the office, quest board, reading, labyrinth, encounters, perceptron lab, and clue ledger. Replay them or read every control in **Game → How to play**. See [onboarding](docs/onboarding.md).

## Orientation activities

**Playable story branches:** choose a lead on the quest board. **Routing trace** follows PATCH through the maze and eleven algorithm encounters to the Route Warden. **Access records** restores FOLIO's erased archive through the sentinel, ten data-structure encounters and the Archive Keeper. Each has dialogue choices, a conclusion and its own evidence reward. Victory continues directly to the next lead. See the [routing walkthrough](docs/routing-branch.md) and [archive walkthrough](docs/access-branch.md).

1. Complete or skip the short pursuit prologue. Take the case in the briefing. Select **Home → Bookshelf** or the pinned bookshelf note. Read “Finding a way through.” Bookmarks and margin notes save locally.
2. Enter **Packet labyrinth**. Reach the amber exit manually, with visual blocks, or using Python. The graph-search lesson contains working BFS code; DFS and other valid routes also work. Run resets the maze while retaining your program. Reset retains code and blocks. New seed creates another layout. Completing a maze unlocks an optional 90-second trial.
3. Meet the **Sentinel A-03**. Choose a skill, answer, then continue to the enemy turn. Guard restores focus and reduces the next hit. Mistakes have explanations. Health and focus reset when entering each encounter.
4. Open the **Perceptron lab**. Add class 0 points such as (-0.8, -0.8), (-0.5, 0) and class 1 points such as (0.8, 0.8), (0.5, 0). Train for 20 epochs at 0.2, then test held-out points. Reach 83% after at least 10 epochs to record the objective. Held-out locations cannot enter training.
5. Open **Home → Quest board**. Claim the three-objective quest reward. File recovered evidence at **Home → Clue ledger**. Learn level-2 skills through the top-bar character menu.

WASD / arrows move; E interacts nearby; drag to orbit; Escape closes the current panel. Destination buttons are keyboard-accessible alternatives. Ctrl+Enter runs Python in its editor. Python execution disables manual maze movement. Blockly generates Python; copying to the handwritten editor is intentionally one-way.

## Project layout

- `content/`: Markdown curriculum and game configuration. See [authoring guide](docs/content-authoring.md).
- `src/game/`: renderer-independent maze, combat, progression, and perceptron models; shared contracts and activity registry.
- `src/world/`: scene construction, interaction, movement, and WebGPU/WebGL2 selection.
- `src/ui/`: lazy-loaded code editor, Blockly workspace, and perceptron experiment.
- `src/runtime/` and `public/python-worker.js`: bounded shared-memory Python execution, adapted from the supplied reference architecture.
- `src/storage.ts`: transactional IndexedDB persistence; versioned imports validate before writing.
- `References/PythonWeb/`: unchanged reference project.

## Rendering and performance

Automatic mode attempts WebGPU, then falls back to WebGL2 if unsupported or initialization fails. Settings can force WebGL2 or prefer WebGPU. The live counter reports rolling frame intervals, including CPU and scheduling work, rather than isolated GPU timings. Capture 10-second measurements in Settings; switch backends and repeat under comparable conditions. You can run Python during capture. Reduced motion removes actor interpolation and CSS transitions.

## Hosting

Deploy `dist/` to an HTTPS static host. The host must return these headers on documents and worker resources:

```text
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

`public/_headers` supplies a compatible static-host configuration; other hosts need their equivalent. `file://` and generic servers without these headers cannot execute Python. The UI explains this and retains manual activities. Pyodide files are copied from the exact installed package during predev/build and are fetched from the same origin. No Python CDN or runtime package download is needed for the supplied activities.

## Saves and boundaries

The persistent top bar shows the current level, XP bar, and XP needed for the next level across the office and activities. Victory displays earned XP, animated level progress, stat gains on level-up, and newly available skills. Replays explain that their XP was already earned. Level 100 displays MAX. This presents the existing progression rules without changing rewards or topic mastery.

Saves contain character stats, completion and reward claims, mastery evidence, notes, bookmarks, code, blocks, seed, trial record, and preferences. Use **Settings → Export journal** before clearing browser storage. Invalid imports leave the existing save untouched. Corrupt stored data is not automatically overwritten; a recovery download and explicit replacement control are available. Collected clues are derived from completed activities and survive save/import. Legacy item inventories and equipped modules are discarded on loading; XP, skills, and evidence remain. Encounter state is session-local.

This slice is single-player, desktop-first, and uses placeholder art. It has no accounts, cloud synchronization, telemetry, LLM generation, or multiplayer. Python is for trusted self-study code: a worker keeps execution off the UI thread, but is not a security boundary against deliberately hostile Python/JS interop. Content cannot define arbitrary executable templates.

The prologue is a short interactive chase. Three parallel clue quests can be pursued in any order. Each links its materials, activity, clue, and reward. Recovering all three clues unlocks ECHO-7 in the abandoned subnet. The final battle draws questions from all three material topics and closes the case on victory. Branch and finale rewards can each be claimed once.

The room camera follows the cursor slightly. Switching walls adds directional blur driven by camera velocity; Settings → Reduce movement animation disables camera movement and transition blur. Dialogues use validated node graphs in Markdown, and cutscenes support configurable frames and pursuit steps. The first network connection plays once per save.

Text uses local regular-weight UI fonts and typewriter headings. No web-font download is required.

## World-space home interface

The investigation board uses pinned photographs, reports, a route map, and red string. Quests appear on a wall-mounted digital screen with a dark bezel, luminous text, and clickable controls. Select a labeled book to pull it clear of the shelf and open its hinged cover toward you; closing reverses the sequence. Equipment and skills are printed in a ledger lying on a real desk. The desk camera looks down over the tabletop. Hover outlines mark clickable props, with matching keyboard focus feedback.

Controls render into Babylon DynamicTextures. Pointer releases ray-pick mesh UV coordinates with normal geometry occlusion. Tab focuses the corresponding control on the mesh; Enter activates it. Books support search, topic filters, prerequisites, pagination, bookmarks, and notes. Ctrl+Enter saves notes; Escape cancels editing. Renderer failures restore readable HTML controls. The top menu bar remains visible.

Opened books expand into a full-screen reading view below the menu bar. The spread fits the viewport without cropping; a dark backdrop hides the room. Camera parallax and room-edge turns stay off while reading. Close book returns the volume to the shelf.

The quest screen displays a graph of the current playable investigations, evidence, and ECHO-7 finale. Drag its map to pan and scroll to zoom around the pointer. Select a node for its briefing, activity, book, or reward actions. Overview resets the map; Center finds the selected node. Keyboard users can Tab to nodes, press Enter to inspect them, pan with arrow keys, zoom with plus/minus, and center with Home. Locked evidence is revealed only after its activity is complete. The five expanded story questlines in the design document remain planned content, rather than playable graph entries.

Left/right screen edges turn after 90 ms of cursor entry. Click, A/D, and arrow keys also turn. Hover advances once per entry; leave the edge before another turn. Typing does not trigger keyboard turns.

Turn blur uses a short, bounded shutter and GLSL/WGSL post-processing. It detaches once the camera settles, stays off during small cursor movements, and is disabled by reduced motion.

Activity screens favor the game world and large text. The maze opens a programming dock only when Blocks or Python is selected. Layout controls and hints live under Tools & hints. Combat keeps enemy HP centered above the opponent, the quiz in the middle, player HP/focus bottom-left, and Skills / Items / Inspect / Retreat bottom-right. A skill opens its question; answering clears the panel for a brief attack transition, then shows an explanation and Continue for the enemy response. Items consume a turn without a quiz; Inspect is free, Escape backs out of command submenus, and Retreat returns to the network. Reduced motion removes attack transitions. The signal activity keeps labeling, Train, and Test visible, with network settings and coordinate entry expandable. Project design and delivery rules live in [AGENTS.md](AGENTS.md).
