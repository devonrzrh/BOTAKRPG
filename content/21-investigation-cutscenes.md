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
        text: "All five records are in. Do we have enough to find ECHO-7?"
      - speaker: Detective
        text: "I know where the trail ends. I need to prove how it got there."
      - speaker: Dispatch
        text: "Put the route together. I’ll keep a line open."
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
        text: "The host is back online. The channel is yours, Detective."
      - speaker: ECHO-7
        text: "I thought the train would buy me more time."
        holdMs: 3200
      - speaker: Detective
        text: "It did. I had time to read the records."
      - speaker: ECHO-7
        text: "Then you know why I ran."
        holdMs: 2500
```
