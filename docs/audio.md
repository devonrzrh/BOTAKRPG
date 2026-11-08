# Audio

Settings has independent **Music volume** and **Sound effects volume** sliders.
Setting effects to zero silences interface, activity, and combat effects. The
battle speaker button additionally mutes attack cues without changing music or
the master effects preference. Both volumes survive journal export/import.
**Preview sound effects** plays an evidence chime at the selected volume.

| Action | Cue |
| --- | --- |
| Menu selection / room turn | Soft click / short digital sweep |
| Book opening / closing | Paper rustle and low cover movement |
| Page turn | Short paper flick |
| Maze / network movement | Quiet synthetic footstep; blocked movement has a low tap |
| Blockly editing / puzzle operations | Packet clicks |
| Puzzle completion / invalid operation | Success pair / short error cue |
| Signal labeling, training, testing | Operation and result cues |
| Dialogue advance | Quiet communication tick; no continuous character noise |
| Recovered maze clue / desk ledger | Evidence chime |
| Level gained | Delayed rising arpeggio |
| Combat | Skill hits, shields, heavy strikes, breaks, finishers and victory |

Effects are original procedural Web Audio sounds; they add no downloads or
external asset dependencies. Audio contexts unlock on an explicit pointer or
keyboard gesture. Unsupported audio fails silently. Short cooldowns and voice
limits prevent input spam, and zero volume or disposal cancels live effects.
Loading a save or restoring puzzle commands does not replay success cues.

`src/game/sfx.ts` owns the general sound palette; `src/ui/GameSound.tsx` routes
interface events through one shared context. Combat keeps its contact timing in
`src/game/combatAudio.ts` and uses the same master effects volume. The existing
situational score remains in `src/game/music.ts`.
