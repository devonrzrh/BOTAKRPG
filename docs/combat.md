# Combat flow

The first revamp targets repeated inputs and unreadable consequences. A normal correct turn now takes three clicks: choose a visible skill, select an answer, confirm. Correct-answer feedback resolves the enemy response automatically; Pause to review keeps the explanation open. Wrong answers pause with their explanation before the player continues. Questions remain untimed.

## Tactics

Enemies use individually authored deterministic patterns composed of these actions:

| Intent | Resolution |
| --- | --- |
| Strike | Base attack minus defense and active reductions; minimum 1 damage. |
| Heavy Strike | Base attack × 1.7, rounded up, then reductions. |
| Opening | No attack; the player recovers 3 focus. |

The intent shows the actual incoming damage after current defenses. Guard spends a turn without a question, restores up to 4 focus, and reduces the next hit by approximately 70%, with the same 1-damage minimum. It preserves skill shields. Poison resolves before the enemy can act. Effects tick on each enemy turn, including openings.

HP and focus reset before each encounter. There are no consumables or equipment. Available skills show damage, focus cost and effect. Number keys choose a skill or answer; Enter confirms an answer. In ordering questions, number keys follow the displayed positions and the separate # badges show the selected sequence.

## Presentation

The enemy HP remains centered above the enemy. Intent sits beside it, the quiz stays in the middle, and player resources and commands stay at the bottom. Correct hits, misses and enemy actions briefly clear the quiz. Recovery uses a quiet message rather than an attack lunge. Reduced motion skips those animations. The battle camera cannot accidentally orbit.

Victory retains its XP and level summary. It does not auto-advance into another encounter. Quest rewards and practice XP rules are unchanged. Stale rendered callbacks are rejected so repeated clicks cannot resolve the same turn twice.

## Combat depth

All 36 authored encounters have weakness, stance, ACT, and attack-pattern profiles. [Combat mechanics](combat-mechanics.md) documents Boost, Limit release, stand-down requirements, and optional heavy-attack dodging. Chapter question pools and first-completion rewards remain in force. Boss phase changes and sound remain future work.

## Attack presentation

Resolved actions emit sequenced visual cues before level-up rewards can change HP. Babylon animates the robot's body and shoulder pivots, with a projectile arriving before recoil, a contact ring and sparks. Enemy strikes wind up and lunge; heavy strikes have stronger movement. Blocks show a foreground shield, misses whiff without a hit reaction, and defeated robots fall and hold their pose until the encounter resets. Skill effects use distinct colors.

The quiz clears for the 900ms action animation. Damage numbers appear around contact; incoming hits add a short red edge pulse. Recovery does not lunge, and poison finishes cannot invent an enemy attack. Reduced motion uses a 200ms static glow/number cue without particles, translation or flashes. A fixed pool of nine effect meshes is reused and disposed with the scene. Replays clear cues and restore the rig.
