# Combat mechanics

Quizzes remain untimed. Choose a skill, answer, then resolve the enemy's telegraphed response. Defend and ACT spend a turn without a quiz. Only correct, unaided quiz answers provide answer mastery evidence. Health and focus reset on encounter entry; no inventory, consumables, or equipment are required. Collected clues live in the office desk ledger.

The bottom battle console groups health, focus, the incoming move, available skills,
questions and feedback in one place. Commands remain labelled and visible. Enemy
health stays above the enemy. Damage rattles the enemy or the player's HP panel
at contact; damaging hits and enemy defeat shake the arena. A full YOU DIED view
offers recovered retry or return to the office without losing evidence. Saved
and operating-system reduced-motion preferences suppress shakes and use assisted
dodging. Music and effects retain separate volume controls.

Enemies embody network threats: packet sniffers, tracking cookies, spam decoys,
firewalls, cache vaults, phishing mimics, and ECHO's fragmented network worm.

## Weakness and stance

Each authored enemy has a skill weakness. A correct matching attack reveals it and adds one stance hit. At the configured threshold, the enemy breaks: its next response is skipped and the player's next correct attack deals ×1.5 damage. That attack consumes the opening without immediately building another break.

## Skills and defense

Probe is a free direct attack. Firewall costs focus, deals damage, and grants a shield for two enemy turns. Trace injection deals damage and applies poison for three enemy turns. Firewall replaces the former Throttle skill: version 3 journals merge any acquired Throttle into Firewall and deduplicate the skill list. Other progress, rewards, code, notes, and settings survive both local load and JSON import.

Defend restores up to 4 focus, reduces the next hit by about 70%, and adds 15 Momentum. It preserves active skill shields and provides boss-counter openings. Heavy intent also offers Dodge within Defend.

## Momentum

One meter, capped at 100, resets each encounter. Correct answers add 25 Momentum, plus 10 for hitting a weakness. Taking damage adds 10; Defend adds 15; successful ACT adds 20.

Commit 25, 50, or 75 Momentum to add 25%, 50%, or 75% damage to the next skill. At 100, the finisher selects a free, triple-power Probe using the encounter's question pool and spends the whole meter. Committed Momentum is spent even on a wrong answer. There are no separate Combo, Boost, or Limit resources.

## Analyze, ACT and stand-down

Analyze groups enemy inspection, ACT, and stand-down. ACT offers an enemy-specific dialogue choice. A correct read reveals its weakness and adds 20 Momentum; either choice spends the turn. After a successful read, enemies supporting surrender can stand down when below 65% HP with one correct attack. Bosses require three correct attacks and at most 35% HP. Stand-down counts as encounter completion; existing first-completion reward checks prevent farming XP.

## Evade

Heavy attacks offer an optional 2.8-second Dodge through Defend. Crossfire, diagonal sweeps, pincer gaps, heavy pulses and broken rhythm change geometry and timing across enemies, turns and attempts. Each of three waves gives at least 550 ms of visual warning; amber strikes are dangerous and teal openings are safe. Move with A/D, arrow keys, or held movement buttons. Zero through three collisions reduce the incoming hit by 80%, 60%, 30%, or 0%. The regular Defend action remains available instead. Reduced motion provides an assisted dodge without animation. Quiz answers never have a timer.

## Content

Enemy `tactics` lives in Markdown activity blocks: `weakness`, `pattern`, `resolve`, `act` (prompt, options, answer index, explanation), `spare`, and `boss`. Builds validate skill references, pattern values, and ACT answer bounds. Executable rules live in `src/game/combat.ts`; the dodge simulation lives in `src/game/evade.ts`.

Design references: [Persona weakness openings](https://persona.atlus.com/p5r/sp/?lang=uk), [Final Fantasy VII Rebirth Limit](https://www.square-enix.com/ffvii/en-us/games/rebirth/battle/), [Undertale nonlethal encounters and bullet patterns](https://undertale.com/about/), and [Octopath Traveler](https://www.square-enix-games.com/en_US/games/octopath-traveler). These systems adapt those ideas to individual learning encounters.
