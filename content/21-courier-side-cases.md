# The night courier

Optional field cases follow a courier whose dispatch records were altered during
ECHO-7's escape.

```entity
type: activity
id: puzzle-courier-contacts
title: Scrambled witness list
template: puzzle
lesson: source-alg-02
brief: PATCH recovered a witness list with the interview priorities out of order. Put priority 1 first and priority 5 last. You can only swap neighboring entries, and you have five swaps.
hint: Move the Station clerk up to the first slot, then move the Night porter past the two higher-numbered entries.
solution: "Swap neighboring positions 1–2, 3–4, 2–3, 4–5, then 3–4. Positions count from one."
puzzle:
  kind: sorting
  program: adjacent-sort
  values: [4, 1, 5, 2, 3]
  target: [1, 2, 3, 4, 5]
  labels: [4 Gate tech, 1 Station clerk, 5 Dispatcher, 2 Night porter, 3 Bike courier]
  budget: 5
clue:
  title: Clerk's signed statement
  text: The station clerk saw the night courier leave the package at a service hatch. The dispatcher claimed it never left the depot.
```

```entity
type: quest
id: case-courier-contacts
title: Scrambled witness list
description: Restore the interview priorities from PATCH's recovered list.
objectives: [puzzle-courier-contacts]
xp: 25
rewards: []
kind: case
lesson: source-alg-02
```

```entity
type: activity
id: puzzle-courier-receipt
title: The missing receipt
template: puzzle
lesson: source-alg-03
brief: FOLIO has eleven receipts indexed by number. Find receipt 97 in four probes before the archive connection closes. Each probe reveals one receipt and narrows the remaining range.
hint: Start at slot 6. If its receipt number is below 97, continue in the upper half.
solution: "Probe slots 6, 9, 10 and 11. Their receipt numbers are 46, 74, 89 and 97."
puzzle:
  kind: search
  program: binary-search
  values: [11, 18, 24, 31, 38, 46, 53, 61, 74, 89, 97]
  target: [97]
  budget: 4
clue:
  title: Service hatch receipt
  text: Receipt 97 records a manual handoff at the hatch. The depot log lists the package as undelivered at the same time.
```

```entity
type: quest
id: case-courier-receipt
title: The missing receipt
description: Locate receipt 97 in FOLIO's ordered index.
objectives: [puzzle-courier-receipt]
xp: 25
rewards: []
kind: case
lesson: source-alg-03
```

```entity
type: activity
id: puzzle-courier-handoff
title: Off the dispatch map
template: puzzle
lesson: source-alg-06
brief: Reconstruct the night courier's path from the depot to the service hatch within eight units of charge. The dispatcher logged an express route, but its final hop costs more than the courier had left.
hint: Check the footbridge route. From the service lift, heading straight to the hatch costs less than detouring through the courtyard.
solution: "Take Depot → Footbridge → Service lift → Hatch. The three hops cost 2 + 3 + 3 = 8."
puzzle:
  kind: routing
  program: weighted-route
  values: [1, 2, 3, 4, 5, 6]
  labels: [Depot, Express gate, Footbridge, Courtyard, Service lift, Hatch]
  target: [1, 6]
  budget: 8
  edges:
    - {from: 1, to: 2, cost: 1}
    - {from: 2, to: 4, cost: 8}
    - {from: 1, to: 3, cost: 2}
    - {from: 3, to: 5, cost: 3}
    - {from: 4, to: 5, cost: 2}
    - {from: 5, to: 6, cost: 3}
    - {from: 4, to: 6, cost: 9}
clue:
  title: Courier's actual route
  text: The service lift logged the courier's badge. The express route on the dispatch sheet was entered after the handoff.
```

```entity
type: quest
id: case-courier-handoff
title: Off the dispatch map
description: Work backward from the courier's charge budget to verify the route.
objectives: [puzzle-courier-handoff]
xp: 25
rewards: []
kind: case
lesson: source-alg-06
```
