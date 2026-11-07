# Case 007 · ECHO-7

```entity
type: activity
id: maze-chamber
title: Packet labyrinth
template: maze
lesson: graph-search
seed: 42
clue:
  title: Routing table
  text: ECHO-7 used the gateway’s maintenance route.
```

```entity
type: activity
id: guardian-battle
title: Sentinel A-03
template: battle
lesson: stacks-queues
enemy:
  id: sentinel-a-03
  title: Sentinel A-03
  hp: 76
  attack: 10
  mixedQuestions: false
  lessons: [stacks-queues]
  tactics:
    weakness: insight
    pattern: [strike, heavy, recover, strike]
    resolve: 1
    act:
      prompt: Sentinel A-03 requests authorization. What proves the access path?
      options: [Present the signed access log, Threaten the sentinel, Guess a port]
      answer: 0
      explanation: A signed access log verifies the route without harming the sentinel.
    spare: true
    boss: false
clue:
  title: Access log
  text: The sentinel recorded ECHO-7 leaving through an unlisted port.
```

```entity
type: activity
id: perceptron-exhibit
title: Perceptron lab
template: perceptron
lesson: perceptron-basics
```

```entity
type: quest
id: first-principles
title: Trace ECHO-7
description: Pursue three clue branches in any order. Combine their evidence to locate ECHO-7.
objectives: [maze-chamber, guardian-battle, perceptron-exhibit]
xp: 120
rewards: []
```

```entity
type: effect
id: shield
title: Shield
description: Reduce incoming damage for two enemy turns.
duration: 2
magnitude: 5
```

```entity
type: effect
id: poison
title: Poison
description: Deal damage at the start of three enemy turns.
duration: 3
magnitude: 4
```

```entity
type: effect
id: weaken
title: Weaken
description: Reduce the next two enemy attacks.
duration: 2
magnitude: 3
```

```entity
type: skill
id: insight
title: Probe
description: Deal direct damage.
cost: 0
power: 5
level: 1
lesson: stacks-queues
```

```entity
type: skill
id: ward
title: Firewall
description: Deal damage and gain a shield for two enemy turns.
cost: 3
power: 3
level: 1
parent: insight
effect: shield
lesson: graph-search
```

```entity
type: skill
id: trace
title: Trace injection
description: Deal damage over three turns.
cost: 4
power: 4
level: 2
parent: insight
effect: poison
lesson: perceptron-basics
```

```entity
type: skill
id: simplify
title: Throttle
description: Reduce damage from two attacks.
cost: 3
power: 4
level: 2
parent: ward
effect: weaken
lesson: stacks-queues
```
