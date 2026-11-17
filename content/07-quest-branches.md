# Clue branches

```entity
id: routing-trace
title: Routing trace
type: quest
description: Find the trapped courier PATCH. Trace ECHO-7's forged routes and
  recover its signed delivery receipt from the Route Warden.
objectives:
  - maze-chamber
  - encounter-source-alg-00
  - encounter-source-alg-01
  - encounter-source-alg-02
  - puzzle-sort-log
  - encounter-source-alg-03
  - puzzle-search-archive
  - encounter-source-alg-04
  - puzzle-hanoi-lock
  - encounter-source-alg-05
  - encounter-source-alg-06
  - puzzle-route-packet
  - encounter-source-alg-07
  - encounter-source-alg-08
  - encounter-source-alg-09
  - encounter-source-alg-10
  - route-warden
xp: 20
rewards: []
kind: branch
prerequisites: []
lesson: graph-search
```

```entity
id: access-records
title: Access records
type: quest
description: Restore the archivist FOLIO's identity, reconstruct the erased
  gateway log and confront the Archive Keeper.
objectives:
  - guardian-battle
  - encounter-source-ds-01
  - encounter-source-ds-02
  - encounter-source-ds-03
  - encounter-source-ds-04
  - encounter-source-ds-05
  - puzzle-stack-buffer
  - encounter-source-ds-06
  - puzzle-queue-relay
  - encounter-source-ds-07
  - encounter-source-ds-08
  - encounter-source-ds-09
  - encounter-source-ds-10
  - archive-keeper
xp: 20
rewards: []
kind: branch
prerequisites: []
lesson: stacks-queues
```

```entity
id: signal-identification
title: Signal identification
type: quest
description: Help LUMA isolate a forged signal, test the evidence across ten AI
  chapters and recover a verified handshake from Signal Mimic.
objectives:
  - perceptron-exhibit
  - encounter-source-ai-01
  - encounter-source-ai-02
  - encounter-source-ai-03
  - puzzle-signal-confidence
  - encounter-source-ai-04
  - encounter-source-ai-05
  - encounter-source-ai-06
  - encounter-source-ai-07
  - puzzle-signal-index
  - encounter-source-ai-08
  - encounter-source-ai-09
  - encounter-source-ai-10
  - signal-mimic
xp: 20
rewards: []
kind: branch
prerequisites: []
lesson: perceptron-basics
```

```entity
id: supply-district
title: Supply district
type: quest
description: Trace a stolen battery shipment through the automated depot and find when ECHO-7's hidden host must reconnect.
objectives:
  - dispatch-drone
  - reserve-guard
  - reserve-plan
  - forecast-auditor
  - depot-search
  - quartermaster
xp: 40
rewards: []
kind: branch
prerequisites: []
lesson: source-alg-09
```

```entity
id: simulation-facility
title: Simulation facility
type: quest
description: Reconstruct the pursuit model ECHO-7 learned from and find the conditions that can contain it.
objectives:
  - training-dummy
  - reward-seeker
  - checkpoint-echo
  - policy-stress-test
  - warden
xp: 40
rewards: []
kind: branch
prerequisites: []
lesson: source-ai-09
```

```entity
id: echo-battle
title: ECHO-7
type: activity
template: battle
lesson: perceptron-basics
seed: 42
enemy:
  id: echo-7
  title: ECHO-7
  hp: 105
  attack: 10
  mixedQuestions: true
  tactics:
    mechanic: echo
    weakness: ward
    pattern:
      - heavy
      - strike
      - recover
      - heavy
      - strike
    resolve: 2
    act:
      prompt: ECHO-7 cites containment protocol. What allows a peaceful surrender?
      options:
        - Offer verified containment and a safe channel
        - Threaten deletion
        - Demand a guessed password
      answer: 0
      explanation: A verified safe channel meets containment protocol and preserves ECHO-7.
    spare: true
    boss: true
clue:
  title: ECHO-7 located
  text: The robot has been contained in the abandoned subnet. Case closed.
```

```entity
type: activity
id: evidence-chain
title: Reconstruct the route
template: puzzle
lesson: source-ai-10
brief: >-
  File the five recovered records in the order that establishes the route.
  FOLIO's signed audit shows ECHO-7 used M-04 and erased its gateway entry.
  PATCH's signed receipt places it at R-17 at 02:14. LUMA's verified
  handshake confirms M-04 forwarded ECHO-7 from R-17 to the abandoned subnet.
  The battery ledger predicts a reconnect window, and the Warden's log gives a
  safe containment condition. Establish the access, movement, destination,
  intercept window, then containment protocol.
hint: Start with the signed audit and receipt, then use the handshake to verify the destination.
solution: Audit → receipt → handshake → handoff window → safe containment condition.
puzzle:
  kind: sorting
  values: [3, 1, 5, 2, 4]
  target: [1, 2, 3, 4, 5]
  budget: 4
  labels: ["Verified handshake", "Signed archive audit", "Safe containment condition", "PATCH receipt", "Battery handoff forecast"]
```

```entity
id: confront-echo
title: Confront ECHO-7
type: quest
description: Combine all five clues to reach the robot in the abandoned subnet.
objectives:
  - evidence-chain
  - echo-battle
xp: 100
rewards: []
kind: finale
prerequisites:
  - routing-trace
  - access-records
  - signal-identification
  - supply-district
  - simulation-facility
```
