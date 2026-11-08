# Onboarding, names, and field tips

A new journal opens on the case intake. Two steps set the player up before the prologue:

1. **Sign the file.** Enter a detective name (1–40 characters). The live badge shows the initials; suggested handles fill the field. The name is stored in `character.name`, so it appears in the top bar, sidebar, character panel, ledger, and dialogue.
2. **Orient the office.** The four walls are described in fiction: investigation wall, bookshelf, quest board, clue ledger.

**Open the case** starts the existing pursuit prologue. Skip and replay still work. Existing saves never see the intake again, because `needsIntake` requires both an unfinished intake and an unseen prologue. The name can be changed later from **Character → Change name**; validation rejects blank or over-long names without touching the journal.

## Personalisation

- `src/game/player.ts` normalises names, builds initials, and resolves the `{name}` token in dialogue and cutscenes to `Detective <name>` without doubling an existing title.
- The authored speaker `Vale` in branch dialogue is the player character. The dialogue header shows the player's surname instead, and the portrait still treats it as the local detective.
- Case briefing line uses `{name}` in `content/05-case-dialogue.md`.

## Field tips

Seven contextual tips cover the office, quest board, reading, labyrinth, encounters, perceptron lab, and clue ledger. Each tip has one to three steps and appears once, when its activity first opens. Tips are stored in `onboarding.seenTips`; `onboarding.tipsEnabled` turns automatic tips off.

Tips are non-blocking: no scrim, the top bar and world remain visible, Escape closes a tip, and `←` / `→` move between steps. Opening another panel closes the current tip and marks it seen. **Turn off tips** disables the rest.

## Field manual

**Game → How to play**, the `?` button in the top bar, or **Settings → Open field manual** opens the manual. It contains controls, the investigation loop, reading, encounters, the labyrinth, the perceptron lab, progression, and every field tip with a **Show tip** replay button. **Show every tip again** clears `seenTips`.

## Save shape

```json
"onboarding": {
  "intakeComplete": true,
  "tipsEnabled": true,
  "seenTips": ["room", "quests"]
}
```

The block defaults when missing, so saves written before onboarding still load. Unknown tip identifiers are rejected by the save schema.

## Block editor

Blocks stays enabled. Selecting it opens a wide workspace with 18px block text at 115% zoom. Zoom controls stop at 100% to preserve readability; Center blocks and Reset zoom recover a lost canvas. Show maze docks the editor beside the world; Expand editor restores its width. Run docks it automatically. Resizing recenters the blocks without shrinking them or changing the program.

Generated Python, output, and hints open only when requested. Blockly icons and sounds are copied from the installed package during `npm run runtime`, so the editor does not fetch them from a demo server. Saved blocks and handwritten Python remain separately editable.
