```entity
type: story
id: five-records
title: Five Records
trigger: { activity: evidence-chain, when: before }
frames:
  - time: "Detective’s office / Evidence board"
    shot: evidence-board
    alt: "Five recovered documents are pinned to a board under a desk lamp."
    dialogue:
      - speaker: Dispatch
        text: "Five records. Does that give you a location?"
        holdMs: 2600
      - speaker: Detective
        text: "A location, yes. I still have to prove the route."
        holdMs: 3000
```

```entity
type: story
id: last-window
title: The Last Window
trigger: { activity: echo-battle, when: before }
frames:
  - time: "Abandoned subnet / Reconnect window"
    shot: echo-threshold
    alt: "A bulkhead opens onto a dark server aisle. ECHO-7 stands at the far end."
    dialogue:
      - speaker: Containment
        text: "The host is up. You have the channel."
        holdMs: 2600
      - speaker: ECHO-7
        text: "You found the chassis. Why keep looking?"
        holdMs: 2900
      - speaker: Detective
        text: "I wanted to know why you left it."
        holdMs: 2600
```
