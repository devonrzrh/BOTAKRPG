```entity
type: story
id: echo-epilogue-pacified
title: ECHO-7 epilogue
visual: finale
frames:
  - time: "Abandoned subnet / Safe channel"
    shot: echo-surrender
    alt: "ECHO-7 lowers its head, its amber eyes still lit."
    dialogue:
      - speaker: Containment
        text: "Relay secured. Hold the channel."
        holdMs: 2200
      - speaker: ECHO-7
        text: "Are you still there?"
        holdMs: 2700
  - time: "Detective’s office / First light"
    shot: ledger-open
    alt: "The case ledger lies open beside a lit terminal on the detective’s desk."
    dialogue:
      - speaker: Detective
        text: "Case closed. ECHO-7, can you hear me?"
        holdMs: 2800
      - speaker: ECHO-7
        text: "Yes."
        holdMs: 2500
```

```entity
type: story
id: echo-epilogue-defeated
title: ECHO-7 epilogue
visual: finale
frames:
  - time: "Abandoned subnet / Isolation confirmed"
    shot: echo-isolation
    alt: "ECHO-7 lies motionless in front of the subnet’s dark server racks."
    dialogue:
      - speaker: Detective
        text: "ECHO-7?"
        holdMs: 3000
      - speaker: Containment
        text: "No response. Cutting the relay."
        holdMs: 3100
  - time: "Detective’s office / First light"
    shot: ledger-closed
    alt: "The case ledger is closed and the terminal has gone dark."
    dialogue:
      - speaker: Detective
        text: "Case closed. No further signal."
        holdMs: 3800
```
