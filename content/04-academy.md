# Case 007 · ECHO-7

```entity
type: activity
id: maze-chamber
title: Packet labyrinth
template: maze
lesson: graph-search
seed: 42
```

```entity
type: activity
id: guardian-battle
title: Sentinel A-03
template: battle
lesson: stacks-queues
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
description: Recover ECHO-7’s address by completing these three objectives.
objectives: [maze-chamber, guardian-battle, perceptron-exhibit]
xp: 120
rewards: [scholar-charm, healing-draught]
```

```entity
type: item
id: healing-draught
title: Integrity patch
description: Restore 24 HP. Using it in battle takes a turn.
kind: healing
amount: 24
```

```entity
type: item
id: focus-tea
title: Bandwidth cell
description: Restore 8 focus. Using it in battle takes a turn.
kind: focus
amount: 8
```

```entity
type: item
id: scholar-charm
title: Trace amplifier
description: A recovered signal module. Equip for +3 attack.
kind: equipment
amount: 3
```

```entity
type: effect
id: shield
title: Shield
description: Reduce damage from the next two enemy attacks.
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
description: Deal damage and shield against two attacks.
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
