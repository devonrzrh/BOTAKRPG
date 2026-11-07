# Combat mechanics

Quizzes remain untimed. Choose a skill, answer, then resolve the enemy's telegraphed response. Guard, ACT, and Evade spend a turn without a quiz. Only correct, unaided quiz answers provide answer mastery evidence. Health and focus reset on encounter entry; no inventory, consumables, or equipment are required. Collected clues live in the office desk ledger.

## Weakness and stance

Each authored enemy has a skill weakness. A correct matching attack reveals it and adds one stance hit. At the configured threshold, the enemy breaks: its next response is skipped and the player's next correct attack deals ×1.5 damage. That attack consumes the opening without immediately building another break.

## Boost and Limit

Guard and correct answers bank one Boost, capped at three. Cycle the Boost button to choose how many to spend on the next skill; each adds 25% damage. Committed Boost is spent even on a wrong answer.

Correct answers add 20 Limit, plus 10 for hitting a weakness. Taking damage adds 10. At 100, Limit release selects a free, triple-power Probe using the encounter's question pool. A wrong answer still spends the Limit. Both resources reset each encounter.

## ACT and stand-down

ACT offers an enemy-specific dialogue choice. A correct read reveals its weakness and adds 20 Limit; either choice spends the turn. After a successful read, enemies supporting surrender can stand down when below 65% HP with one correct attack. Bosses require three correct attacks and at most 35% HP. Stand-down counts as encounter completion; existing first-completion reward checks prevent farming XP.

## Evade

Heavy attacks offer an optional 2.8-second lane dodge. Move with A/D, arrow keys, or held movement buttons. Zero through three collisions reduce the incoming hit by 80%, 60%, 30%, or 0%. Guard remains available instead. Reduced motion provides an assisted dodge without animation. Quiz answers never have a timer.

## Content

Enemy `tactics` lives in Markdown activity blocks: `weakness`, `pattern`, `resolve`, `act` (prompt, options, answer index, explanation), `spare`, and `boss`. Builds validate skill references, pattern values, and ACT answer bounds. Executable rules live in `src/game/combat.ts`; the dodge simulation lives in `src/game/evade.ts`.

Design references: [Persona weakness openings](https://persona.atlus.com/p5r/sp/?lang=uk), [Final Fantasy VII Rebirth Limit](https://www.square-enix.com/ffvii/en-us/games/rebirth/battle/), [Undertale nonlethal encounters and bullet patterns](https://undertale.com/about/), and [Octopath Traveler](https://www.square-enix-games.com/en_US/games/octopath-traveler). These systems adapt those ideas to individual learning encounters.
