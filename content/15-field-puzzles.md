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

```entity
type: activity
id: puzzle-stack-nested
title: Nested recall frames
template: puzzle
lesson: source-ds-05
brief: FOLIO found six recall frames buried inside one long-running call. Release the requested addresses while keeping the oldest frame at the base until the end. Pushing every frame first will bury the next address.
hint: Leave 11 at the base. Push through 33, release 33 and 22, then release 44 before accepting 55 and 66.
solution: Push 11, 22 and 33. Pop 33 and 22. Push 44 and pop it. Push 55 and 66, then pop 66, 55 and 11. Twelve operations recover every frame.
puzzle:
  kind: stack
  values: [11, 22, 33, 44, 55, 66]
  target: [33, 22, 44, 66, 55, 11]
  budget: 12
clue:
  title: Oldest recall frame
  text: The frame held at the base records a maintenance call made before ECHO-7's escape.
```

```entity
type: activity
id: puzzle-queue-interleave
title: Interleaved dispatch orders
template: puzzle
lesson: source-ds-06
brief: PATCH recovered a signed dispatch order split across three packet batches. One initial rotation cannot restore it. Rotate between deliveries and spend no more than eleven operations.
hint: Dispatching removes the front packet permanently. After sending 30, rotate 40 and 50 away to reach 10. Recalculate the front after every delivery.
solution: Rotate twice and dispatch 30. Rotate twice and dispatch 10. Rotate twice and dispatch 50. Finally dispatch 20 and 40. Six rotations and five deliveries use eleven operations.
puzzle:
  kind: queue
  values: [10, 20, 30, 40, 50]
  target: [30, 10, 50, 20, 40]
  budget: 11
clue:
  title: Split dispatch signature
  text: The three batches share one signature. ECHO-7 used the same dispatcher across multiple relays.
```

```entity
type: activity
id: puzzle-sort-duplicates
title: Duplicate clock stamps
template: puzzle
lesson: source-alg-02
brief: Two relays reused clock stamps in the surveillance log. Recover ascending order without discarding duplicate values. Only neighboring stamps can be swapped.
hint: Equal stamps are already in the correct relative order. Move 1 left, then move the final 2 left past larger stamps. Each useful adjacent swap removes one inversion.
solution: Swap positions 1–2, 3–4, 2–3, 1–2, 4–5, 3–4, 5–6, 4–5 and 3–4. The result is 1, 2, 2, 3, 4, 4 in nine swaps. Positions count from one.
puzzle:
  kind: sorting
  values: [4, 2, 4, 1, 3, 2]
  target: [1, 2, 2, 3, 4, 4]
  budget: 9
clue:
  title: Reused clock stamp
  text: Duplicate timestamps came from two separate relays. Their matching clock offset identifies a shared maintenance source.
```

```entity
type: activity
id: puzzle-route-detour
title: Cheap first hop
template: puzzle
lesson: source-alg-06
brief: A damaged relay has only six units of signal. Relay 4 looks close to the exit, but its outgoing connection is costly. Reach relay 6 by planning the whole route.
hint: Choosing the cheapest first edge alone is not enough. Relay 3 can reach relay 2 for one unit, bypassing the expensive direct connection from relay 1.
solution: Travel 1 → 3 → 2 → 5 → 6. Costs are 1 + 1 + 2 + 2 = 6. The route through relay 4 cannot reach the exit within budget.
puzzle:
  kind: routing
  values: [1, 2, 3, 4, 5, 6]
  target: [1, 6]
  budget: 6
  edges:
    - {from: 1, to: 2, cost: 4}
    - {from: 1, to: 3, cost: 1}
    - {from: 1, to: 4, cost: 1}
    - {from: 3, to: 2, cost: 1}
    - {from: 2, to: 5, cost: 2}
    - {from: 5, to: 6, cost: 2}
    - {from: 4, to: 6, cost: 8}
    - {from: 3, to: 5, cost: 5}
clue:
  title: Costly decoy relay
  text: Relay 4 advertises a cheap entry while charging too much to leave. Its routing table was altered to strand incoming traces.
```

```entity
type: quest
id: case-stack-nested
title: Unwind the nested recall
description: Hold an old stack frame while releasing newer calls in order.
objectives: [puzzle-stack-nested]
xp: 25
rewards: []
kind: case
lesson: source-ds-05
```

```entity
type: quest
id: case-queue-interleave
title: Reassemble split dispatches
description: Rotate between deliveries to restore an interleaved queue order.
objectives: [puzzle-queue-interleave]
xp: 25
rewards: []
kind: case
lesson: source-ds-06
```

```entity
type: quest
id: case-sort-duplicates
title: Separate the clock stamps
description: Sort a surveillance log containing repeated timestamps.
objectives: [puzzle-sort-duplicates]
xp: 25
rewards: []
kind: case
lesson: source-alg-02
```

```entity
type: quest
id: case-route-detour
title: Bypass the decoy relay
description: Compare total route costs to avoid a tempting first hop.
objectives: [puzzle-route-detour]
xp: 25
rewards: []
kind: case
lesson: source-alg-06
```
