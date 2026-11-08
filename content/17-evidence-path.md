# Evidence between encounters

These cases are required stops on the clue branches.

```entity
type: activity
id: puzzle-signal-confidence
title: Confidence audit
template: puzzle
lesson: source-ai-03
brief: "LUMA recovered four classifier confidence scores. Sort them from lowest to highest to audit the flagged messages before trusting the model's labels."
hint: "Use adjacent swaps. Move 80 to the end, then place 40 before 60. Confidence is a model score, not proof of identity."
solution: "Swap positions 1–2, 2–3, 3–4, then 2–3. The scores become 20, 40, 60, 80."
puzzle:
  kind: sorting
  values: [80, 20, 60, 40]
  target: [20, 40, 60, 80]
  budget: 4
clue:
  title: Confidence audit evidence
  text: The highest-scoring message still carries a forged sender. A confident prediction is not authentication.
```

```entity
type: quest
id: case-signal-confidence
title: Confidence audit
description: "LUMA recovered four classifier confidence scores. Sort them from lowest to highest to audit the flagged messages before trusting the model's labels."
objectives: [puzzle-signal-confidence]
xp: 25
rewards: []
kind: case
lesson: source-ai-03
```

```entity
type: activity
id: puzzle-signal-index
title: Drift checkpoint
template: puzzle
lesson: source-ai-07
brief: "The incremental learner stores checkpoints in order. Find checkpoint 21 before the window closes so LUMA can compare the model before and after the signal drift."
hint: "Probe the middle checkpoint slot. A value above 21 rules out that slot and every higher slot."
solution: "Probe slots 4, 2 and 3. Checkpoint 34 is too high, 12 is too low, and 21 is the stored comparison point."
puzzle:
  kind: search
  values: [6, 12, 21, 34, 55, 72, 89]
  target: [21]
  budget: 3
clue:
  title: Drift checkpoint evidence
  text: The checkpoint reveals gradual model drift rather than a verified change of sender.
```

```entity
type: quest
id: case-signal-index
title: Drift checkpoint
description: "The incremental learner stores checkpoints in order. Find checkpoint 21 before the window closes so LUMA can compare the model before and after the signal drift."
objectives: [puzzle-signal-index]
xp: 25
rewards: []
kind: case
lesson: source-ai-07
```

```entity
type: dialogue
id: lead-puzzle-sort-log
title: Sort the log
trigger:
  activity: puzzle-sort-log
  when: before
start: brief
nodes:
  - id: brief
    speaker: PATCH
    text: "The intercept is clear, but the transit timestamps are scrambled. Put the log in order before we can trace the next hop."
    choices:
      - label: Sort the log
        action: continue
      - label: Return later
        action: close
```

```entity
type: dialogue
id: lead-puzzle-search-archive
title: Search the archive
trigger:
  activity: puzzle-search-archive
  when: before
start: brief
nodes:
  - id: brief
    speaker: PATCH
    text: "The route passes through a sealed archive. Its records are ordered; find the right index without wasting our remaining probes."
    choices:
      - label: Search the archive
        action: continue
      - label: Return later
        action: close
```

```entity
type: dialogue
id: lead-puzzle-hanoi-lock
title: Open the lock
trigger:
  activity: puzzle-hanoi-lock
  when: before
start: brief
nodes:
  - id: brief
    speaker: PATCH
    text: "A transfer lock blocks the courier channel. Shift its discs to the final peg and the next relay will answer."
    choices:
      - label: Open the lock
        action: continue
      - label: Return later
        action: close
```

```entity
type: dialogue
id: lead-puzzle-route-packet
title: Route the trace
trigger:
  activity: puzzle-route-packet
  when: before
start: brief
nodes:
  - id: brief
    speaker: PATCH
    text: "The Warden's patrol left a blackout behind. We have limited signal: choose a route by total cost, not by how short it looks."
    choices:
      - label: Route the trace
        action: continue
      - label: Return later
        action: close
```

```entity
type: dialogue
id: lead-puzzle-stack-buffer
title: Restore the buffer
trigger:
  activity: puzzle-stack-buffer
  when: before
start: brief
nodes:
  - id: brief
    speaker: FOLIO
    text: "Those return addresses were erased in pairs. Rebuild the stack and release the calls in the required order before we question the next witness."
    choices:
      - label: Restore the buffer
        action: continue
      - label: Return later
        action: close
```

```entity
type: dialogue
id: lead-puzzle-queue-relay
title: Clear the relay
trigger:
  activity: puzzle-queue-relay
  when: before
start: brief
nodes:
  - id: brief
    speaker: FOLIO
    text: "The gateway still holds a signed packet batch. Rotate and dispatch the queue to recover its original delivery order."
    choices:
      - label: Clear the relay
        action: continue
      - label: Return later
        action: close
```

```entity
type: dialogue
id: lead-puzzle-signal-confidence
title: Audit the scores
trigger:
  activity: puzzle-signal-confidence
  when: before
start: brief
nodes:
  - id: brief
    speaker: LUMA
    text: "Before another classifier check, audit these scores. We need to know what the model ranks highly without confusing confidence with identity."
    choices:
      - label: Audit the scores
        action: continue
      - label: Return later
        action: close
```

```entity
type: dialogue
id: lead-puzzle-signal-index
title: Find the checkpoint
trigger:
  activity: puzzle-signal-index
  when: before
start: brief
nodes:
  - id: brief
    speaker: LUMA
    text: "The signal shifted while the model kept learning. Find the earlier checkpoint so we can separate drift from a new sender."
    choices:
      - label: Find the checkpoint
        action: continue
      - label: Return later
        action: close
```
