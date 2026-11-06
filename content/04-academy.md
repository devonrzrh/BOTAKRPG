# Academy configuration

```entity
type: activity
id: maze-chamber
title: The wandering paths
template: maze
lesson: graph-search
seed: 42
```

```entity
type: activity
id: guardian-battle
title: The archive guardian
template: battle
lesson: stacks-queues
```

```entity
type: activity
id: perceptron-exhibit
title: The learning garden
template: perceptron
lesson: perceptron-basics
```

```entity
type: quest
id: first-principles
title: A curious beginning
description: Find a path, meet the guardian, and teach a machine. Return to the academy seal to claim your reward.
objectives: [maze-chamber, guardian-battle, perceptron-exhibit]
xp: 120
rewards: [scholar-charm, healing-draught]
```

```entity
type: item
id: healing-draught
title: Meadow draught
description: Restore 24 HP. Using it in battle takes a turn.
kind: healing
amount: 24
```

```entity
type: item
id: focus-tea
title: Clarity tea
description: Restore 8 focus. Using it in battle takes a turn.
kind: focus
amount: 8
```

```entity
type: item
id: scholar-charm
title: Scholar’s charm
description: A small reminder to stay curious. Equip for +3 attack.
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
title: Insight
description: Turn an answer into a precise strike.
cost: 0
power: 5
level: 1
lesson: stacks-queues
```

```entity
type: skill
id: ward
title: Invariant ward
description: Strike and protect yourself for two enemy attacks.
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
title: Venom trace
description: Leave a lingering thought. Poison the guardian for three turns.
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
title: Simplify
description: Find the weak point and soften two enemy attacks.
cost: 3
power: 4
level: 2
parent: ward
effect: weaken
lesson: stacks-queues
```
