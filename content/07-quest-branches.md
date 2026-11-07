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
  - encounter-source-alg-03
  - encounter-source-alg-04
  - encounter-source-alg-05
  - encounter-source-alg-06
  - encounter-source-alg-07
  - encounter-source-alg-08
  - encounter-source-alg-09
  - encounter-source-alg-10
  - route-warden
xp: 20
rewards:
  - focus-tea
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
  - encounter-source-ds-06
  - encounter-source-ds-07
  - encounter-source-ds-08
  - encounter-source-ds-09
  - encounter-source-ds-10
  - archive-keeper
xp: 20
rewards:
  - healing-draught
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
  - encounter-source-ai-04
  - encounter-source-ai-05
  - encounter-source-ai-06
  - encounter-source-ai-07
  - encounter-source-ai-08
  - encounter-source-ai-09
  - encounter-source-ai-10
  - signal-mimic
xp: 20
rewards:
  - focus-tea
kind: branch
prerequisites: []
lesson: perceptron-basics
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
clue:
  title: ECHO-7 located
  text: The robot has been contained in the abandoned subnet. Case closed.
```

```entity
id: confront-echo
title: Confront ECHO-7
type: quest
description: Combine the three clues to reach the robot in the abandoned subnet.
objectives:
  - echo-battle
xp: 100
rewards:
  - healing-draught
kind: finale
prerequisites:
  - routing-trace
  - access-records
  - signal-identification
```
