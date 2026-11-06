# Project guidelines

## Communication and delivery

- Work efficiently; keep updates and final replies brief.
- Implement requests, verify behavior, then commit completed changes to Git.
- Stage only task-owned changes. Preserve user files and `References/PythonWeb`.
- Run `npm test` and `npm run build` for gameplay/rendering changes. Verify visual changes in the browser.

## Game direction

- Detective RPG inspired by I, Robot. ECHO-7 escaped into the internet; recover clues across parallel quests to unlock the final encounter.
- Treat this as a game. Learning happens through exploration, books, puzzles, and combat.
- No marketing taglines, filler copy, dashboard clutter, or constant instructional panels.
- Keep the top menu bar visible. Show only controls needed for the current action; put extra tools behind explicit controls.

## Interface and room

- Home interfaces belong to physical 3D props: pinned evidence and string, real books, a wall-mounted digital quest screen, and a desk ledger.
- The quest screen uses a draggable, zoomable node graph built from active content. Selection shows a brief and relevant actions; locked clues stay unrevealed. Keep Overview, Center, and keyboard navigation available.
- Clickable world objects and controls need clear hover outlines and matching keyboard focus feedback.
- Books must pull clear of the shelf before opening toward the reader; close before returning. Respect reduced motion.
- Open library books fill a distraction-free reading view below the top bar. Hide room turn controls and stop cursor camera movement while reading.
- Desk camera should look down enough to show the tabletop clearly.
- Moving the cursor to a screen edge turns quickly. Prevent repeated turns until the cursor leaves the edge. Keep click and keyboard alternatives.
- Use regular-weight readable text or a typewriter font. Primary screen text: at least 18px; secondary controls: at least 16px. Check actual projected text size in the 3D view; texture font size alone is insufficient.
- Never shrink text to fit. Reduce copy, paginate, or reorganize instead.
- Battle: visible 3D enemy above, clear choices/questions below. Keep HP, focus, effects, and current turn readable.
- Maze: world first, compact controls; open code tools only when selected. AI activity: classify, train, test; advanced settings can be expanded.

## Foundations

- Babylon.js rendering: prefer working WebGPU, fall back to WebGL2; retain renderer override.
- Separate gameplay models from rendering. Markdown is the validated content source; executable activities use registered TypeScript templates.
- Preserve manual/Blockly/Python parity, bounded worker execution, cancellation, and stale-message rejection.
- Preserve progression, rewards claimed once, local IndexedDB saves, and validated JSON import/export.
- Keep keyboard navigation and readable renderer-failure fallbacks.
