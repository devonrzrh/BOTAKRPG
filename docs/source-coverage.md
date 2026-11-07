# Source curriculum coverage

The imported snapshot contains **405 original files** (39 Markdown, 364 SVG, one PNG, one PDF; 4,127,594 bytes). Every file is copied unchanged into `public/materials/`, with SHA-256 checksums in `content/source-manifest.json`. `Source/` and `References/PythonWeb` are not modified or staged.

## Playable coverage

| Volume | Chapters | Encounter sequence | Branch boss |
| --- | --- | --- | --- |
| Algorithms | 11: Python, algorithms, sorting, searching/Big-O, recursion, complexity, graph search/routing, greedy optimization, dynamic programming, inventory/uncertainty, sequential decisions | Maze, then `encounter-source-alg-00` through `encounter-source-alg-10` | Route Warden |
| Data structures | 10: introduction, linear structures, arrays, linked lists, stacks, queues, nonlinear structures, trees, graphs, versioning | Sentinel, then `encounter-source-ds-01` through `encounter-source-ds-10` | Archive Keeper |
| Connectionist AI | 10: introduction, neural architectures, applications, activations, time series, probabilistic forecasts, online learning, recommendations, reinforcement learning, training/optimization | Perceptron lab, then `encounter-source-ai-01` through `encounter-source-ai-10` | Signal Mimic |

All chapter prose, examples, diagrams and practice exercises remain in their books. Prerequisites recommend a reading sequence without locking books. The quest screen shows each branch's progress and next activity, followed by its clue. Branches can be pursued in any order; their bosses gate the final ECHO-7 encounter. These three implemented curriculum branches coexist with the separate five-questline expansion proposal in `story-and-enemies.md`.

There are **119 playable questions**: six existing questions, 31 chapter checkpoints, and 82 imported objective questions (40 true/false and 42 multiple choice, including two select-all questions). All reference a lesson for review and mastery. Chapter checkpoints cover topics missing from the PDF. The test-bank book contains all 95 questions, including the 13 open-ended prompts and model answers in disclosure sections. Written responses use personal notes and are self-assessed; no automatic free-text grading is claimed. The original illustrated PDF is also linked.

The module guide retains the supplied outline and four peer review records. The video, slide and Markdown test-bank indexes are placeholders in the source, not missing imported media; their original files remain linked. README artwork and all diagrams are included in the archive. SVGs retain their authored dark/light styles, with the book requesting light colors for readable contrast. Reduced motion uses still editions under `public/materials-still/`.

## Editorial changes in the game edition

Original downloads remain unchanged. The playable edition corrects the sorting table's random-order count to nine comparisons/four swaps, fixes binary-search midpoint parentheses and floor division, removes the stale planned-versioning statement, corrects the infinite-width calibration example and clarifies PPO objective clipping. Reading notes explain Python lists versus typed arrays, input signs and weights, ReLU's derivative convention, inventory positions versus order quantities, and PyTorch setup/validation averaging. These address concrete review issues; this is not a claim that every source passage has undergone a fresh academic review.

PDF extraction retains Unicode mathematics. A question using “the same tree” repeats its tree definition so it works outside PDF order. Explicit handling preserves B12's vertex labels and the option boundaries for B37–B39. The complete extracted bank and explanations are committed as Markdown for review, rather than regenerated during every build.

General Python examples are reading material; the maze worker exposes its existing bounded maze API. Examples requiring PyTorch, external datasets or additional libraries require a suitable external Python environment. No new arbitrary-code execution path was added.

## Saves and refresh

Chapter IDs and bank IDs are stable. Existing bookmarks, notes, mastery and rewards keep their IDs. New saves mark `curriculumVersion: 2` and require the expanded branches before ECHO-7. Older completed-case saves retain their closure if all three original orientation activities were completed; no chapter completions are fabricated. Old claims are never awarded again. Imports still validate before replacing the existing save.

Run `npm run source:import` to refresh from the supplied files. Poppler's `pdftotext` is needed only for this explicit import. It rebuilds the book snapshot, archive, still diagrams, manifest and authored encounters. `npm run content` recursively validates Markdown and references; ordinary development/builds need only the committed snapshot.
