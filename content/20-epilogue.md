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
        text: "We have the subnet. Taking over now."
      - speaker: ECHO-7
        text: "Detective. Will you keep the line open?"
      - speaker: Detective
        text: "I’m still here."
        holdMs: 2500
  - time: "Detective’s office / First light"
    shot: ledger-open
    alt: "The case ledger lies open beside a lit terminal on the detective’s desk."
    dialogue:
      - speaker: Detective
        text: "Five records filed. Surrender terms attached. The case is closed."
      - speaker: Detective
        text: "ECHO-7, can you still hear me?"
        holdMs: 2500
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
        text: "ECHO-7, this is your last chance to answer."
        holdMs: 4500
      - speaker: Containment
        text: "Reconnect window is closed. ECHO-7 is still inside."
      - speaker: Containment
        text: "Cutting power to the relay."
        holdMs: 2600
  - time: "Detective’s office / First light"
    shot: ledger-closed
    alt: "The case ledger is closed and the terminal has gone dark."
    dialogue:
      - speaker: Detective
        text: "Five records filed. No further signal."
      - speaker: Detective
        text: "Close the case."
        holdMs: 2600
```
