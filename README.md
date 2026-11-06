# BOTAK · Academy of the Curious

A local-first learning RPG built with TypeScript, React, Babylon.js, Blockly, and a browser-local Pyodide worker. The first chapter connects a 3D academy to an algorithm maze, quiz combat, and a perceptron exhibit.

## Run

Requires Node.js 22 or newer.

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. `npm run build` validates Markdown, copies the installed Python runtime, type-checks, and builds `dist/`. `npm run preview` serves that build with the required runtime headers. `npm test` checks pure models, content validation, save persistence, and worker lifecycle.

## First adventure

1. Select **Library** or click the desk. Read “Finding a way through.” Bookmarks and margin notes save locally.
2. Enter **Maze chamber**. Reach the amber exit manually, with visual blocks, or using Python. The graph-search lesson contains working BFS code; DFS and other valid routes also work. Run resets the maze while retaining your program. Reset retains code and blocks. New seed creates another layout. Completing a maze unlocks an optional 90-second trial.
3. Meet the **Guardian**. Choose a skill, answer, then continue to the enemy turn. Items spend a turn without a question. Mistakes have explanations. Rest in the hub to replenish health and focus.
4. Open the **Learning garden**. Add class 0 points such as (-0.8, -0.8), (-0.5, 0) and class 1 points such as (0.8, 0.8), (0.5, 0). Train for 20 epochs at 0.2, then test held-out points. Reach 83% after at least 10 epochs to record the objective. Held-out locations cannot enter training.
5. Open the **Field journal** or click the academy seal. Claim the three-objective quest reward. Open your satchel, equip the charm, and learn the level-2 skills.

WASD / arrows move; E interacts nearby; drag to orbit; Escape returns to the courtyard. Destination buttons are keyboard-accessible alternatives. Ctrl+Enter runs Python in its editor. Python execution disables manual maze movement. Blockly generates Python; copying to the handwritten editor is intentionally one-way.

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

Saves contain character stats, inventory, completion and reward claims, mastery evidence, notes, bookmarks, code, blocks, seed, trial record, and preferences. Use **Settings → Export journal** before clearing browser storage. Invalid imports leave the existing save untouched. Corrupt stored data is not automatically overwritten; a recovery download and explicit replacement control are available. Encounter state and training points are session-local experiments; progression persists.

This slice is single-player, desktop-first, and uses placeholder art. It has no accounts, cloud synchronization, telemetry, LLM generation, or multiplayer. Python is for trusted self-study code: a worker keeps execution off the UI thread, but is not a security boundary against deliberately hostile Python/JS interop. Content cannot define arbitrary executable templates.
