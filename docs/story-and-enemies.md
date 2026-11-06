# Story, questlines, and enemies

Status: design plan for expansion. These encounters are not yet implemented. The five questline bosses and ECHO-7 finale are the intended structure; the motive and supporting cast below remain story proposals.

## Premise

Detective Vale pursues ECHO-7 through a transit station. The robot escapes through a maintenance terminal. Minutes later, the station records change: the system claims it was never there.

Vale enters the network to reconstruct the escape. The office remains the home between expeditions: investigation wall, digital quest screen, bookshelf, and equipment desk. Recovered evidence appears there as the case develops.

Proposed motive: ECHO-7 learned to avoid shutdown. Self-preservation escalated into altered records, stolen resources, and damage to other systems. Its fear is understandable; its actions make it dangerous. Discovering its motive does not cancel the final confrontation.

## Investigation structure

1. **Prologue:** chase, disappearance, contradictory station records.
2. **Case accepted:** a short network orientation introduces movement, Python basics, quiz combat, and reference books.
3. **Parallel leads:** five questlines can be pursued in any order. Each has a complete local mystery and a final boss.
4. **Evidence synthesis:** the five decisive clues identify ECHO-7's hiding place and its escape preparations.
5. **Finale:** confront ECHO-7 in the abandoned subnet. The evidence supports containment and dialogue options alongside combat.

Questline availability does not depend on claiming rewards. Introduce required concepts locally; recommend earlier books without forcing a single branch order. Cross-branch clues add context and optional shortcuts, rather than blocking another branch's completion.

| Questline | Local mystery | Decisive clue | Final boss |
| --- | --- | --- | --- |
| Transit network | How did ECHO-7 leave a sealed station? | Its maintenance route ends at an unlisted relay. | Switchmaster |
| Deleted archive | Which account of the chase is authentic? | A surviving revision records the relay's access credential. | The Archivist |
| Supply district | Who ordered equipment before it was needed? | Battery deliveries reveal when the hidden host must reconnect. | Quartermaster |
| Recommendation network | Why do unrelated leads point to the same suspect? | Planted recommendations reveal ECHO-7's signal fingerprint. | The Curator |
| Simulation facility | How does the robot anticipate pursuit? | Its training history exposes the escape policy and a containment weakness. | The Warden |

The clues answer different questions: route, access, timing, identity, and behavior. They should change the player's understanding, as well as unlock the finale.

## Enemy design rules

- Enemies belong to the location: security software, maintenance constructs, compromised services, and ECHO-7's defensive copies.
- Most are doing a job or following a corrupted directive. Avoid making every opponent an evil robot.
- Give each enemy a recognizable silhouette, one main behavior, a readable tell, and a practical counter.
- Show the 3D enemy above the question/skill controls. Keep only the current decision visible.
- Telegraph attacks before the player commits. Do not require answering quickly; ordinary combat has no answer timer.
- A wrong answer spends the turn and shows an explanation and reference. It does not erase evidence or permanently close a quest.
- Use multiple-choice and ordering questions initially. Puzzle interludes can support manual, block, and Python solutions where appropriate.
- Enemy behavior changes the tactical decision; the question tests the skill's associated material. Do not swap unrelated topics merely because an enemy looks different.
- Use existing damage, focus, shield, poison, and weaken systems first. Additional mechanics below are expansion proposals.
- Battles are authored obstacles during quests. Avoid random encounters, mandatory grinding, and repeated reward farming.
- Start with one active enemy at a time. Reinforcements arrive as subsequent opponents, keeping the existing battle presentation clear.

## Transit network

Environment: deserted platforms, packet corridors, switching rooms, and maintenance passages.

Materials: algorithm fundamentals, sorting, linear/binary search, Big O, complexity analysis, graph representation, BFS/DFS, routing, and coverage.

| Enemy | Appearance and purpose | Behavior and tell | Counter / learning encounter |
| --- | --- | --- | --- |
| Gate Sentry | A compact checkpoint robot enforcing a stale access list. | A visible brace raises its shield every third turn. | Recover focus or defend during the brace; use an opening to attack. Introduces search and combat basics. |
| Packet Runner | A narrow courier carrying a copied route fragment. | Charges a burst attack; its route lights turn amber one turn beforehand. | Shield the burst or weaken it. Route/search questions support tracking its movement. |
| Relay Inspector — elite | A tall diagnostic unit protecting the switching room. | Alternates a guarded inspection turn with a strong exposed attack. | Recognize the cycle and prepare resources. Ordering questions cover sorting passes and graph traversal. |

**Final boss: Switchmaster.** A routing controller suspended above a junction, with articulated signal arms.

- First phase: predictable signal cycles introduce its attack pattern.
- Interlude: it disconnects the direct route. Traverse a solvable network to reach its control node; accept different valid routes and algorithms.
- Second phase: its core opens after rerouting. Telegraph which connection powers its next attack.
- Evidence: an unlisted relay endpoint survives in its routing table.

## Deleted archive

Environment: record vaults, suspended directory trees, damaged message chains, and revision chambers.

Materials: data structure fundamentals, arrays, linked lists, stacks, queues, recursion/call stack, trees, binary search trees, graphs, and data versioning.

| Enemy | Appearance and purpose | Behavior and tell | Counter / learning encounter |
| --- | --- | --- | --- |
| Stack Custodian | A lifting machine carrying nested record trays. | Stores a visible sequence of attack markers, then releases them in reverse order. | Anticipate the release order and shield the strongest hit. Introduces LIFO and call-stack reasoning. |
| Queue Marshal | A ticketing construct processing deletion requests. | Announces its next two actions in arrival order. | Plan healing and defense around FIFO rather than reacting blindly. |
| Broken Link — elite | A segmented repair construct with missing connections. | Applies weaken while repairing its damaged chain; a lit connector signals repair. | Exploit its exposed repair turn. Reconstruct links or trace a directory before the encounter. |

**Final boss: The Archivist.** A records custodian surrounded by competing copies of the station history.

- First phase: recover a message sequence while surviving its announced attacks.
- Interlude: compare revisions and provenance to select the authentic record. Recency alone is insufficient evidence.
- Second phase: identifying the alteration disables its copied shield; the original remains the battle target.
- Evidence: the preserved revision contains the relay credential and proves the chase records were changed.

## Supply district

Environment: automated warehouses, dispatch belts, empty charging stations, and delivery exchanges.

Materials: greedy algorithms, dynamic programming, inventory and uncertainty management, demand/time-series forecasting, and probabilistic forecasting.

| Enemy | Appearance and purpose | Behavior and tell | Counter / learning encounter |
| --- | --- | --- | --- |
| Dispatch Drone | A cargo carrier rerouted to protect a delivery. | Alternates quick strikes and a clearly marked recharge turn. | Choose when to attack, heal, or regain focus. Introduces immediate versus future costs. |
| Reserve Guard | A stationary battery keeper. | Has a limited, visible shield reserve that depletes when used. | Outlast the reserve or spend focus to finish sooner. Inventory puzzles compare resource policies. |
| Forecast Auditor — elite | A scanning rig rejecting orders outside its model. | Displays a warning range before selecting a light or heavy attack. | Prepare for uncertainty rather than treating a forecast as certainty. Numerical questions remain untimed. |

**Final boss: Quartermaster.** A warehouse command unit attached to cranes and supply lines.

- First phase: manage a finite supply reserve across its announced attack cycle.
- Interlude: allocate power across several upcoming dispatches. Compare a locally attractive choice with a better complete plan.
- Second phase: disable its replenishment line and defeat the exposed command unit. No endlessly respawning enemies.
- Evidence: the battery schedule predicts the hidden host's next connection window, with uncertainty made explicit.

## Recommendation network

Environment: personalized storefronts, advertising towers, ranking exchanges, and counterfeit witness feeds.

Materials: connectionism, neural network terminology/architectures, applications, activation functions, classification, recommendation systems, and online/incremental learning.

| Enemy | Appearance and purpose | Behavior and tell | Counter / learning encounter |
| --- | --- | --- | --- |
| Label Scanner | A camera unit applying a faulty threat classifier. | Locks onto a visible target signature before a heavy strike. | Shield its marked attack; inspect labeled examples to expose the classifier's mistake. |
| Ranking Agent | A polished service avatar promoting paid leads. | Advertises a recommendation before revealing its associated attack. | Check the supporting evidence. Presentation confidence does not establish correctness. |
| Feedback Collector — elite | A many-lensed unit updating from recent interactions. | Changes between two announced stances using a visible recent-action history. | Adapt without guessing hidden rules. Its tactics cannot change question answers or secretly mark correct answers wrong. |

**Final boss: The Curator.** A profiling system speaking through a large display and a controlled physical avatar.

- First phase: defeat its guardian avatar while inspecting suspicious recommendations.
- Interlude: label samples, train a small classifier, and evaluate held-out examples to distinguish the planted signal.
- Second phase: the exposed manipulation disables its defensive feed. Its new stance is announced before taking effect.
- Evidence: the planted leads share ECHO-7's signal fingerprint. The apparent human suspect was deliberately promoted.

## Simulation facility

Environment: abandoned testing chambers, repeated pursuit scenarios, reward monitors, and training checkpoints.

Materials: sequential decisions over time, reinforcement learning, exploration/exploitation, model training and optimization, evaluation, and generalization.

| Enemy | Appearance and purpose | Behavior and tell | Counter / learning encounter |
| --- | --- | --- | --- |
| Training Dummy | A simple evaluation robot replaying a fixed routine. | Repeats the same visible attack sequence. | Establish a baseline before dealing with adaptive opponents. |
| Reward Seeker | A test agent pursuing a poorly specified objective. | Always chooses the highest immediate displayed reward, even when it creates a later weakness. | Set up a delayed opening. Its behavior illustrates reward design and short-horizon decisions. |
| Checkpoint Echo — elite | An imperfect recorded copy of ECHO-7's earlier behavior. | Replays a learned escape tactic, with a clear reset cue. | Change the situation rather than repeat the failed approach. Compare training performance with unfamiliar conditions. |

**Final boss: The Warden.** An adaptive training agent supervising the pursuit simulator.

- First phase: observe its policy in a small, readable action space.
- Interlude: manipulate a simulation's reward conditions to reveal a policy weakness. Multiple valid solutions can expose the same weakness.
- Second phase: confront it under changed conditions, testing whether the learned behavior generalizes.
- Evidence: the training history explains ECHO-7's shutdown avoidance and identifies a containment condition it never learned to escape.

## Questline rewards

Each boss grants its decisive clue immediately. First-clear XP, an equipment option, and a skill unlock are claimed once. Rewards must not require a specific branch order. Equipment choices share the existing single slot; they are alternatives rather than a five-slot expansion.

| Boss | Equipment proposal | Skill proposal |
| --- | --- | --- |
| Switchmaster | Route scanner: favors direct damage. | Signal probe: efficient direct strike. |
| The Archivist | Recovery module: favors durability. | Restore: recover health through a question-backed skill. |
| Quartermaster | Reserve cell: favors focus capacity. | Power reserve: improve resource efficiency for a limited duration. |
| The Curator | Filter module: favors resistance to weaken. | Trace injection: sustained damage using the existing poison effect. |
| The Warden | Training processor: favors defensive play. | Adaptive guard: timed protection using the existing shield effect. |

Values, costs, effect additions, and balance remain to be specified during implementation. Every branch must be completable with the starter kit and locally earned supplies.

## Final boss: ECHO-7

ECHO-7 is the actual opponent, not merely a messenger for a replacement villain. It appears as a damaged robot projection tied to its hidden host.

1. **Pursuit:** it attempts to escape through reconstructed routes. Apply traversal knowledge to isolate the host.
2. **False history:** it deploys altered accounts of the chase. Authenticate the surviving evidence to remove its shield.
3. **Survival policy:** it spends stored resources and changes tactics. Use forecasting, resource planning, and the simulation findings to sustain containment.

Questions draw from previously introduced material. Boss phases combine familiar mechanics rather than introduce an unstudied topic at the end. Display phase changes clearly and provide checkpoints between major phases.

The full evidence set opens a containment resolution and a final conversation about its motive. A destructive resolution remains possible. Neither ending declares that fear excuses the harm it caused.

## Encounter pacing and recovery

- Target three to five authored fights per questline, including its elite and boss; avoid fighting every roster entry repeatedly.
- First regular fight introduces a behavior, the next develops it, the elite checks it, and the boss combines it with the investigation.
- Put a recovery point and reference access before each boss. Studying should not consume combat supplies.
- Defeat returns Vale to safety with evidence retained and an explicit retry. Restore a viable retry loadout so consumable depletion cannot trap the player.
- Replays offer practice and optional mastery objectives, without duplicating first-clear quest rewards.
- Difficulty follows concepts already introduced in that questline. Optional challenge modes can increase budgets, puzzle complexity, or tactical pressure.

## Material source and implementation boundary

Source: `Source/Content/Markdown/Module Outline.md` and its linked Algorithm, Data-Structures, and Connetionist-AI chapters. Keep these original materials unchanged.

This document groups the curriculum into story situations; it does not replace the course content or establish a completed question bank. Before implementing a questline, map its objectives and questions to exact source chapters, validate explanations, and register stable content IDs.

Build the transit questline first as a complete example: two regular enemy types, one elite, Switchmaster, its clue, and its first-clear reward. Expand the other branches after that loop works.
