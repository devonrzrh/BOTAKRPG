# Project guidelines

## Communication and delivery

- Keep updates and replies brief and direct. Skip filler and repeated summaries. Preserve accuracy and important warnings. Show relevant code and test results. Explain non-obvious decisions.
- Implement, verify, and commit. Stage only task-owned changes. Preserve user files and `References/PythonWeb`.
- Run `npm test` and `npm run build` for gameplay/rendering changes. Check visual changes in the browser. Test proportionally, run required checks once after edits settle, and repeat only after a fix or to resolve a specific uncertainty.
- For 3D browser checks, use hardware acceleration and one short session at a time. Close the test browser and confirm its processes exited. Report any GPU verification gap. Never force SwiftShader.

## Game direction

- Build a detective RPG inspired by I, Robot. ECHO-7 escaped into the internet. Recover clues across parallel quests to unlock the final encounter.
- Prioritize game design and aesthetics. Teach through exploration, books, puzzles, and combat.
- Omit marketing taglines, filler copy, dashboard clutter, and persistent instructional panels.
- Keep the top menu visible. Show controls for the current action and put extra tools behind explicit controls.

## Interface and room

- Use physical 3D props for home interfaces: pinned evidence with string, real books, a wall-mounted digital quest screen, and a desk ledger.
- Build the draggable, zoomable quest graph from active content. Selection shows a brief and relevant actions. Hide locked clues. Keep Overview, Center, and keyboard navigation available.
- Give clickable objects and controls clear hover outlines and matching keyboard focus feedback.
- Pull books clear of the shelf before opening toward the reader. Close before returning. Respect reduced motion.
- Open library books in a distraction-free view filling the space below the top bar. Hide room turn controls and stop cursor-driven camera movement.
- Angle the desk camera down to show the tabletop. Turn quickly at screen edges, once per entry. Keep click and keyboard alternatives.
- Use readable regular-weight or typewriter text. Verify projected 3D text sizes: primary text ≥18px, secondary controls ≥16px. Cut copy, paginate, or reorganize to fit. Never shrink text to fit.
- Battle layout: visible 3D enemy with HP centered above it, quiz centered, player HP/focus bottom-left, Skills / Items / Inspect / Retreat bottom-right. Clear the quiz briefly during attacks. Respect reduced motion.
- Keep level, XP progress, and XP to next level in the office and activity top bar. Omit a duplicate battle XP box. Keep the larger victory XP reward and level-up summary. Practice victories must never imply repeat XP rewards.
- Maze: world first, compact controls, code tools on selection. AI activity: classify, train, test, and expandable advanced settings.

## Foundations

- Babylon.js: prefer working WebGPU, fall back to WebGL2, and keep the renderer override.
- Separate gameplay models from rendering. Use validated Markdown as the content source and registered TypeScript templates for executable activities.
- Preserve manual/Blockly/Python parity, bounded workers, cancellation, and stale-message rejection.
- Preserve progression, one-time rewards, local IndexedDB saves, and validated JSON import/export.
- Breaking save or progression changes require a versioned journal migration for local load and JSON import. Preserve progress, code, notes, settings, and claimed rewards. Add legacy fixtures and idempotence tests. Never reset compatible old journals.
- Keep keyboard navigation and readable renderer-failure fallbacks.

## Subagent delegation

- Delegate only when parallel work materially improves speed, quality, or coverage and outweighs coordination. Work solo on small or sequential tasks.
- Bound each assignment to independent research, exploration, debugging hypotheses, testing, or review. Avoid overlapping file edits.
- Prefer GPT 6 Luna when sufficient. Main agent owns integration, final verification, and reporting.

## Conserve Token Usage

Use tokens efficiently.
