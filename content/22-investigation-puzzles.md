# Evidence and emergency power

```entity
type: activity
id: puzzle-courier-alibi
title: The backdated dispatch
template: puzzle
lesson: source-ds-10
brief: "The depot report claims a message came through the relay before it closed. Cite two independent records that together prove the relay could not have accepted that message."
hint: "Compare when the relay stopped accepting messages with when this message first arrived. A badge swipe only places someone at a door."
solution: "Cite the controller log and the ingest receipt. The relay rejected all messages after sealing at 02:20, and the report's message first arrived at 02:31."
puzzle:
  kind: deduction
  values: [1, 2, 3, 4, 5]
  target: [2, 4]
  budget: 3
  labels:
    - "Badge reader: the courier entered the depot at 02:09."
    - "Controller log: the relay sealed at 02:20 and accepted no further messages."
    - "Shift roster: the dispatcher was on duty until 03:00."
    - "Ingest receipt: the message first arrived at 02:31."
    - "Gate inspection: the depot clock was synchronized at 01:50."
clue:
  title: Proof of a backdated dispatch
  text: The report's live-relay claim conflicts with the controller log and the original ingest receipt.
```

```entity
type: quest
id: case-courier-alibi
title: The backdated dispatch
description: Cross-check independent records to challenge a forged dispatch report.
objectives: [puzzle-courier-alibi]
xp: 25
rewards: []
kind: case
lesson: source-ds-10
```

```entity
type: activity
id: puzzle-emergency-load
title: Nine units until dawn
template: puzzle
lesson: source-alg-08
brief: "A battery can restore emergency call stations after the depot outage. Each station takes its listed charge or stays offline. Restore service to at least 14 callers with at most 9 charge. Each station serves a different group."
hint: "The biggest station serves 10 callers but leaves only 1 charge. Compare combinations of smaller stations."
solution: "Clinic and Market use 3 + 6 charge for 5 + 9 callers. Stairwell, Clinic and Platform also work: 2 + 3 + 4 charge for 3 + 5 + 6 callers."
puzzle:
  kind: allocation
  values: [1, 2, 3, 4, 5]
  target: [14]
  capacity: 9
  budget: 3
  labels: [Stairwell, Clinic, Platform, Market, Terminal]
  loads:
    - {cost: 2, coverage: 3}
    - {cost: 3, coverage: 5}
    - {cost: 4, coverage: 6}
    - {cost: 6, coverage: 9}
    - {cost: 8, coverage: 10}
clue:
  title: Restored call archive
  text: A recovered emergency call confirms the courier had already left when the dispatcher filed the false report.
```

```entity
type: quest
id: case-emergency-load
title: Nine units until dawn
description: Restore emergency calls within the depot battery's charge limit.
objectives: [puzzle-emergency-load]
xp: 25
rewards: []
kind: case
lesson: source-alg-08
```
