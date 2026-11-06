# Clue branches

```entity
type: quest
kind: branch
id: routing-trace
title: Routing trace
description: Follow the packet route to recover a routing table.
lesson: graph-search
objectives: [maze-chamber]
xp: 20
rewards: [focus-tea]
```

```entity
type: quest
kind: branch
id: access-records
title: Access records
description: Get past the sentinel and retrieve the gateway log.
lesson: stacks-queues
objectives: [guardian-battle]
xp: 20
rewards: [healing-draught]
```

```entity
type: quest
kind: branch
id: signal-identification
title: Signal identification
description: Train a classifier to identify ECHO-7’s outgoing signal.
lesson: perceptron-basics
objectives: [perceptron-exhibit]
xp: 20
rewards: [focus-tea]
```

```entity
type: activity
id: echo-battle
title: ECHO-7
template: battle
lesson: perceptron-basics
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
type: quest
kind: finale
id: confront-echo
title: Confront ECHO-7
description: Combine the three clues to reach the robot in the abandoned subnet.
prerequisites: [routing-trace, access-records, signal-identification]
objectives: [echo-battle]
xp: 100
rewards: [healing-draught]
```
