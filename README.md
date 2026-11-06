# NULL / TRACE

A local-first learning RPG built with TypeScript, React, Babylon.js, Blockly, and a browser-local Pyodide worker. Detective Vale pursues ECHO-7, a rogue robot that escapes into the network. The home is a first-person room. Its investigation wall, bookshelf, quest board, and inventory desk are connected by quick camera turns. The top menu bar stays visible during gameplay, cutscenes, and dialogue. The first chapter includes an algorithm maze, quiz battle, and perceptron lab.

## Run

Requires Node.js 22 or newer.

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. `npm run build` validates Markdown, copies the installed Python runtime, type-checks, and builds `dist/`. `npm run preview` serves that build with the required runtime headers. `npm test` checks pure models, content validation, save persistence, and worker lifecycle.

## Playable chapter

1. Complete or skip the short pursuit prologue. Take the case in the briefing. Select **Home → Bookshelf** or the pinned bookshelf note. Read “Finding a way through.” Bookmarks and margin notes save locally.
2. Enter **Packet labyrinth**. Reach the amber exit manually, with visual blocks, or using Python. The graph-search lesson contains working BFS code; DFS and other valid routes also work. Run resets the maze while retaining your program. Reset retains code and blocks. New seed creates another layout. Completing a maze unlocks an optional 90-second trial.
3. Meet the **Sentinel A-03**. Choose a skill, answer, then continue to the enemy turn. Items spend a turn without a question. Mistakes have explanations. Battles are entered as accepted-case encounters. Rest in the network hub to replenish health and focus.
4. Open the **Perceptron lab**. Add class 0 points such as (-0.8, -0.8), (-0.5, 0) and class 1 points such as (0.8, 0.8), (0.5, 0). Train for 20 epochs at 0.2, then test held-out points. Reach 83% after at least 10 epochs to record the objective. Held-out locations cannot enter training.
5. Open **Home → Quest board**. Claim the three-objective quest reward. Open equipment, equip the trace amplifier, and learn the level-2 skills.

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

Saves contain character stats, inventory, completion and reward claims, mastery evidence, notes, bookmarks, code, blocks, seed, trial record, and preferences. Use **Settings → Export journal** before clearing browser storage. Invalid imports leave the existing save untouched. Corrupt stored data is not automatically overwritten; a recovery download and explicit replacement control are available. Encounter state and training points are session-local experiments; progression persists.

This slice is single-player, desktop-first, and uses placeholder art. It has no accounts, cloud synchronization, telemetry, LLM generation, or multiplayer. Python is for trusted self-study code: a worker keeps execution off the UI thread, but is not a security boundary against deliberately hostile Python/JS interop. Content cannot define arbitrary executable templates.

The prologue is a short interactive chase. Three parallel clue quests can be pursued in any order. Each links its materials, activity, clue, and reward. Recovering all three clues unlocks ECHO-7 in the abandoned subnet. The final battle draws questions from all three material topics and closes the case on victory. Branch and finale rewards can each be claimed once.

The room camera follows the cursor slightly. Switching walls adds directional blur driven by camera velocity; Settings → Reduce movement animation disables camera movement and transition blur. Dialogues use validated node graphs in Markdown, and cutscenes support configurable frames and pursuit steps. The first network connection plays once per save.

Text uses local regular-weight UI fonts and typewriter headings. No web-font download is required.

## World-space home interface

The investigation board uses pinned photographs, reports, a route map, and red string. Quests appear on a wall-mounted digital screen with a dark bezel, luminous text, and clickable controls. Select a labeled book to pull it clear of the shelf and open its hinged cover toward you; closing reverses the sequence. Equipment and skills are printed in a ledger lying on a real desk. The desk camera looks down over the tabletop. Hover outlines mark clickable props, with matching keyboard focus feedback.

Controls render into Babylon DynamicTextures. Pointer releases ray-pick mesh UV coordinates with normal geometry occlusion. Tab focuses the corresponding control on the mesh; Enter activates it. Books support search, topic filters, prerequisites, pagination, bookmarks, and notes. Ctrl+Enter saves notes; Escape cancels editing. Renderer failures restore readable HTML controls. The top menu bar remains visible.

Opened books expand into a full-screen reading view below the menu bar. The spread fits the viewport without cropping; a dark backdrop hides the room. Camera parallax and room-edge turns stay off while reading. Close book returns the volume to the shelf.

Left/right screen edges turn after 90 ms of cursor entry. Click, A/D, and arrow keys also turn. Hover advances once per entry; leave the edge before another turn. Typing does not trigger keyboard turns.

Turn blur uses a short, bounded shutter and GLSL/WGSL post-processing. It detaches once the camera settles, stays off during small cursor movements, and is disabled by reduced motion.

Activity screens favor the game world and large text. The maze opens a programming dock only when Blocks or Python is selected. Layout controls and hints live under Tools & hints. Battle choices and questions sit below the 3D opponent; consumables expand from Items. The signal activity keeps labeling, Train, and Test visible, with network settings and coordinate entry expandable. Project design and delivery rules live in [AGENTS.md](AGENTS.md).
