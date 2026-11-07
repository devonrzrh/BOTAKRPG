# Combat flow

The first revamp targets repeated inputs and unreadable consequences. A normal correct turn now takes three clicks: choose a visible skill, select an answer, confirm. Correct-answer feedback resolves the enemy response automatically; Pause to review keeps the explanation open. Wrong answers pause with their explanation before the player continues. Questions remain untimed.

## Tactics

Enemies share a deterministic three-turn pattern for this foundation:

| Intent | Resolution |
| --- | --- |
| Strike | Base attack minus defense and active reductions; minimum 1 damage. |
| Heavy Strike | Base attack × 1.7, rounded up, then reductions. |
| Opening | No attack; the player recovers 3 focus. |

The intent shows the actual incoming damage after current defenses. Guard spends a turn without a question, restores up to 4 focus, and reduces the next hit by approximately 70%, with the same 1-damage minimum. It preserves skill shields. Poison resolves before the enemy can act. Effects tick on each enemy turn, including openings.

Items spend a turn and cannot be used when their matching resource is full. Available skills show damage, focus cost and effect. Number keys choose a skill or answer; Enter confirms an answer. In ordering questions, number keys follow the displayed positions and the separate # badges show the selected sequence.

## Presentation

The enemy HP remains centered above the enemy. Intent sits beside it, the quiz stays in the middle, and player resources and commands stay at the bottom. Correct hits, misses and enemy actions briefly clear the quiz. Recovery uses a quiet message rather than an attack lunge. Reduced motion skips those animations. The battle camera cannot accidentally orbit.

Victory retains its XP and level summary. It does not auto-advance into another encounter. Quest rewards and practice XP rules are unchanged. Stale rendered callbacks are rejected so repeated clicks cannot resolve the same turn twice.

## Further design work

Individual enemy patterns, boss phase changes, sound, and distinct attack animations can build on these intent and action interfaces. Enemies currently share the pattern above; their chapter question pools and existing combat effects remain distinct content.
