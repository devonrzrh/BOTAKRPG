# Combat flow

Multiple-choice turns take two clicks: choose a skill, then choose the answer to attack. Ordering and multiple-answer questions keep a confirmation step. Correct answers advance automatically after the attack; **Manual turns** pauses for every explanation. **Review** keeps the previous answer accessible. Wrong answers always pause with their explanation and correct answer. Questions remain untimed.

## Tactics

Enemies use individually authored deterministic patterns composed of these actions:

| Intent | Resolution |
| --- | --- |
| Strike | Base attack minus defense and active reductions; minimum 1 damage. |
| Heavy Strike | Base attack × 1.7, rounded up, then reductions. |
| Opening | No attack; the player recovers 3 focus. |

The intent shows the actual incoming damage after current defenses. Guard spends a turn without a question, restores up to 4 focus, and reduces the next hit by approximately 70%, with the same 1-damage minimum. It preserves skill shields. Poison resolves before the enemy can act. Effects tick on each enemy turn, including openings.

HP and focus reset before each encounter. There are no consumables or equipment. Available skills show damage, focus cost and effect, including boss defenses. Number keys choose a skill or submit a multiple-choice answer; Enter confirms a multiple-answer or ordering response. Ordering keys follow displayed positions; # badges show the selected sequence. Short encounter banks use their chapter and prerequisite questions, without pulling in future chapters. Bookmark chapter saves the relevant library entry for later review.

## Presentation

The enemy HP remains centered above the enemy. Intent sits beside it, the quiz stays in the middle, and player resources and commands stay at the bottom. Correct hits, misses and enemy actions briefly clear the quiz. Recovery uses a quiet message rather than an attack lunge. Reduced motion skips those animations. The battle camera cannot accidentally orbit.

Victory retains its XP and level summary. It does not auto-advance into another encounter. Quest rewards and practice XP rules are unchanged. Stale rendered callbacks are rejected so repeated clicks cannot resolve the same turn twice.

## Combat depth

Each final boss has a distinct counter:

| Boss | Mechanic | Counter |
| --- | --- | --- |
| Route Warden | Firewall halves unboosted hits | Spend Boost or attack a Broken stance; Guard banks Boost |
| Archive Keeper | Checksum armor halves hits | Guard to expose its next attack window |
| Signal Mimic | Adapts to the last successful skill | Switch skills, or Guard to clear adaptation |
| ECHO-7 | Stronger pattern below half HP | Follow the displayed intent and use recovery openings |

ECHO's phase shift preserves the response already telegraphed for that turn.
All counters work with Probe and Guard; unlocked skills provide alternatives.
Completed final encounters remain replayable without repeating XP rewards.

All 36 authored encounters have weakness, stance, ACT, and attack-pattern profiles. [Combat mechanics](combat-mechanics.md) documents Boost, Limit release, stand-down requirements, and optional heavy-attack dodging. Chapter question pools and first-completion rewards remain in force.

## Sound and timing

Attack cues last 650ms (200ms with reduced motion). HP changes and floating
damage land at projectile/strike contact. Synthesized combat cues have a
separate mute control from the situational music volume in Settings. Audio
starts after user interaction; both sound preferences and turn pacing persist
in the journal. Reduced motion keeps attacks static and suppresses hit flashes.
Victory and defeat fade back to the ambient score; a retry restarts the battle track.

## Attack presentation

Resolved actions emit sequenced visual cues before level-up rewards can change HP. Babylon animates the robot's body and shoulder pivots, with a projectile arriving before recoil, a contact ring and sparks. Enemy strikes wind up and lunge; heavy strikes have stronger movement. Blocks show a foreground shield, misses whiff without a hit reaction, and defeated robots fall and hold their pose until the encounter resets. Skill effects use distinct colors.

The quiz clears for the 650ms action animation. Damage numbers appear at contact; incoming hits add a short red edge pulse. Recovery does not lunge, and poison finishes cannot invent an enemy attack. Reduced motion uses a 200ms static glow/number cue without particles, translation or flashes. A fixed pool of nine effect meshes is reused and disposed with the scene. Replays clear cues and restore the rig.
