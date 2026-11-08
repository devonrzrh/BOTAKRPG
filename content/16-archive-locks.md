# Archive locks

Optional cases for ordered search and recursive transfers.

```entity
type: activity
id: puzzle-search-archive
title: Sealed archive index
template: puzzle
lesson: source-alg-03
brief: "FOLIO found a sealed, sorted archive. Each probe reveals one record. Locate record 43 before the archive closes after three probes."
hint: "Probe the middle slot. If its record is lower than 43, every slot to its left is also too low."
solution: "Probe slot 4: record 22 is too low. Probe slot 6: record 43 is the match. Two probes recover the index."
puzzle:
  kind: search
  values: [4, 9, 15, 22, 31, 43, 58]
  target: [43]
  budget: 3
clue:
  title: Sealed archive index evidence
  text: Archive record 43 ties the abandoned chassis to a maintenance credential.
```

```entity
type: quest
id: case-search-archive
title: Sealed archive index
description: FOLIO found a sealed, sorted archive. Each probe reveals one record. Locate record 43 before the archive closes after three probes.
objectives: [puzzle-search-archive]
xp: 25
rewards: []
kind: case
lesson: source-alg-03
```

```entity
type: activity
id: puzzle-search-cold-storage
title: Cold storage needle
template: puzzle
lesson: source-alg-03
brief: "A cold-storage index holds fifteen sorted records. Recover record 14 in four probes. Every comparison can rule out an entire section."
hint: "Start at slot 8, then halve the lower remaining range. Slots count from one; records are hidden until probed."
solution: "Probe slots 8, 4, 2 and 3. Their records are 49, 19, 8 and 14. The last probe recovers the record."
puzzle:
  kind: search
  values: [3, 8, 14, 19, 25, 32, 40, 49, 59, 70, 82, 95, 109, 124, 140]
  target: [14]
  budget: 4
clue:
  title: Cold storage needle evidence
  text: The cold-storage record predates the forged dispatcher certificate.
```

```entity
type: quest
id: case-search-cold-storage
title: Cold storage needle
description: A cold-storage index holds fifteen sorted records. Recover record 14 in four probes. Every comparison can rule out an entire section.
objectives: [puzzle-search-cold-storage]
xp: 25
rewards: []
kind: case
lesson: source-alg-03
```

```entity
type: activity
id: puzzle-hanoi-lock
title: Three-disc transfer lock
template: puzzle
lesson: source-alg-04
brief: "PATCH found a physical transfer lock. Move the full disc stack from peg 1 to peg 3 in seven moves. Peg 2 can hold discs while you clear a path."
hint: "First move the top two discs to peg 2, using peg 3 as temporary storage. Then the largest disc can reach peg 3."
solution: "Move pegs 1→3, 1→2, 3→2, 1→3, 2→1, 2→3, 1→3. Each move transfers only the top disc."
puzzle:
  kind: hanoi
  values: [3, 2, 1]
  target: [3, 2, 1]
  budget: 7
clue:
  title: Three-disc transfer lock evidence
  text: The lock opens a service vault carrying ECHO-7's deleted route fragment.
```

```entity
type: quest
id: case-hanoi-lock
title: Three-disc transfer lock
description: PATCH found a physical transfer lock. Move the full disc stack from peg 1 to peg 3 in seven moves. Peg 2 can hold discs while you clear a path.
objectives: [puzzle-hanoi-lock]
xp: 25
rewards: []
kind: case
lesson: source-alg-04
```

```entity
type: activity
id: puzzle-hanoi-vault
title: Nested vault transfer
template: puzzle
lesson: source-alg-04
brief: "A second vault adds a fourth disc. Transfer the stack from peg 1 to peg 3 in fifteen moves. The smaller transfer lock is now one step inside a larger plan."
hint: "Move the top three discs to peg 2 first. Move disc 4 to peg 3, then transfer the three-disc stack from peg 2 to peg 3."
solution: "Move pegs 1→2, 1→3, 2→3, 1→2, 3→1, 3→2, 1→2, 1→3, 2→3, 2→1, 3→1, 2→3, 1→2, 1→3, 2→3."
puzzle:
  kind: hanoi
  values: [4, 3, 2, 1]
  target: [4, 3, 2, 1]
  budget: 15
clue:
  title: Nested vault transfer evidence
  text: Inside the nested vault, a checksum identifies a second copy of the rogue signal.
```

```entity
type: quest
id: case-hanoi-vault
title: Nested vault transfer
description: A second vault adds a fourth disc. Transfer the stack from peg 1 to peg 3 in fifteen moves. The smaller transfer lock is now one step inside a larger plan.
objectives: [puzzle-hanoi-vault]
xp: 25
rewards: []
kind: case
lesson: source-alg-04
```
