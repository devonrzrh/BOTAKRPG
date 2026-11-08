# Field puzzles

Optional investigations apply the corresponding Source chapters. They do not
replace completed chapter checks or change the final encounter prerequisites.

```entity
type: activity
id: puzzle-stack-buffer
title: Corrupted return buffer
template: puzzle
lesson: source-ds-05
brief: FOLIO recovered four return addresses. Push incoming addresses onto the stack, then pop them into the required delivery order. Only the top address can leave.
hint: To deliver 2 before 1, push both addresses before popping. The last address pushed is the first one popped.
solution: Push 1, push 2, pop 2, pop 1. Then push 3, push 4, pop 4, pop 3. Eight operations restore the buffer.
puzzle:
  kind: stack
  values: [1, 2, 3, 4]
  target: [2, 1, 4, 3]
  budget: 8
clue:
  title: Return address fragment
  text: ECHO-7 erased its call history in pairs. The restored return buffer identifies the archive relay.
```

```entity
type: activity
id: puzzle-queue-relay
title: Stalled packet relay
template: puzzle
lesson: source-ds-06
brief: PATCH found a relay whose oldest packets are blocking the signed batch. Rotate the front packet to the back, or dispatch the front packet when it matches the required order.
hint: A queue removes from the front and adds at the back. Rotate until packet 93 reaches the front; preserve the order of the other packets.
solution: Rotate 41 to the back, then rotate 17. Dispatch 93, 26, 41 and 17 in order. This uses six operations.
puzzle:
  kind: queue
  values: [41, 17, 93, 26]
  target: [93, 26, 41, 17]
  budget: 8
clue:
  title: Signed packet batch
  text: The relay confirms that ECHO-7 sent its decoy packets before its own handshake.
```

```entity
type: activity
id: puzzle-sort-log
title: Scrambled transit log
template: puzzle
lesson: source-alg-02
brief: The transit log arrived out of order. Swap neighboring timestamps until the log runs from earliest to latest. Each swap costs one operation.
hint: Compare neighboring values. Swapping a larger value to the right removes an inversion. Repeated passes move large timestamps toward the end.
solution: Swap positions 1–2, 3–4, 4–5, 2–3, 3–4, 2–3 and 1–2. The result is 1, 2, 4, 7, 9 in seven swaps. Positions count from one.
puzzle:
  kind: sorting
  values: [7, 2, 9, 4, 1]
  target: [1, 2, 4, 7, 9]
  budget: 10
clue:
  title: Ordered transit log
  text: The corrected timestamps place ECHO-7 at the maintenance relay before the forged chase report.
```

```entity
type: activity
id: puzzle-route-packet
title: Relay blackout
template: puzzle
lesson: source-alg-06
brief: PATCH has eight units of signal left. Deliver the trace from relay 1 to relay 6. Every connection costs the number shown; a short-looking route can cost more.
hint: Compare total route cost rather than the number of hops. Relay 3 reaches relay 4 cheaply. Plan the complete route before spending signal.
solution: Travel 1 → 3 → 4 → 5 → 6. The connection costs are 2 + 1 + 2 + 2 = 7. One unit of signal remains.
puzzle:
  kind: routing
  values: [1, 2, 3, 4, 5, 6]
  target: [1, 6]
  budget: 8
  edges:
    - {from: 1, to: 2, cost: 4}
    - {from: 1, to: 3, cost: 2}
    - {from: 2, to: 4, cost: 2}
    - {from: 3, to: 4, cost: 1}
    - {from: 3, to: 5, cost: 6}
    - {from: 4, to: 5, cost: 2}
    - {from: 4, to: 6, cost: 6}
    - {from: 5, to: 6, cost: 2}
clue:
  title: Blackout route
  text: A low-cost route bypasses the forged dispatcher and reaches ECHO-7's abandoned relay.
```

```entity
type: quest
id: case-stack-buffer
title: Restore the return buffer
description: Recover FOLIO's erased return addresses using a stack.
objectives: [puzzle-stack-buffer]
xp: 25
rewards: []
kind: case
lesson: source-ds-05
```

```entity
type: quest
id: case-queue-relay
title: Clear the packet relay
description: Restore delivery order using FIFO queue operations.
objectives: [puzzle-queue-relay]
xp: 25
rewards: []
kind: case
lesson: source-ds-06
```

```entity
type: quest
id: case-sort-log
title: Reconstruct the transit log
description: Sort the timestamps to recover the order of events.
objectives: [puzzle-sort-log]
xp: 25
rewards: []
kind: case
lesson: source-alg-02
```

```entity
type: quest
id: case-route-packet
title: Cross the relay blackout
description: Route the trace through a weighted graph before signal runs out.
objectives: [puzzle-route-packet]
xp: 25
rewards: []
kind: case
lesson: source-alg-06
```
