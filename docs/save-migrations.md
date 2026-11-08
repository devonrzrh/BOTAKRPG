# Journal compatibility

Save format 2 adds required evidence cases to all three clue branches. Both local
IndexedDB restoration and JSON import run `parseSave`, using the versioned steps
in `src/game/saveMigrations.ts` before validating the current schema and content.
The normal autosave persists the upgraded journal.

Version 1 journals keep completed encounters, claimed rewards, XP, HP, focus,
mastery, code, Blockly, notes, bookmarks, reading positions, and preferences.
A newly required puzzle is inherited only when a later encounter in that branch
was already completed. Its case reward is marked claimed without granting XP or
inventing mastery. Evidence still ahead of the detective remains required.
Original completed pre-curriculum finales retain their existing compatibility.

For every future breaking change: bump the save version, add a sequential migration,
keep older steps, and test a legacy fixture through import and local storage.
Verify idempotence, pending objectives, preserved data, and reward-once behavior.
Unknown future versions or corrupt saves are rejected; never replace them with a
new journal. Keep content IDs stable or explicitly migrate their references.
