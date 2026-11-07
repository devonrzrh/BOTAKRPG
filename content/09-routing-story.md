# Routing trace: The dead relay

A complete playable branch: enter the maze, free PATCH, follow eleven intercepted route segments, defeat the Route Warden and file a signed receipt. All dialogue and encounter names below are runtime content.

```entity
type: dialogue
id: routing-scene-0
title: The dead relay
trigger:
  activity: maze-chamber
  when: before
start: contact
nodes:
  - id: contact
    speaker: Mara
    text: The station camera sent its last image through Relay R-17. Now the relay
      claims it never existed. A courier is still transmitting inside the broken
      route. Find a way through before the remaining logs are overwritten.
    choices:
      - label: Enter the relay
        action: continue
      - label: Why send a courier?
        next: question
      - label: Return to the office
        action: close
  - id: question
    speaker: Mara
    text: Couriers carry signed delivery receipts. ECHO-7 can alter a public log,
      but it cannot change a receipt already held by someone else.
    choices:
      - label: Enter the relay
        action: continue
      - label: Return to the office
        action: close
```

```entity
type: dialogue
id: routing-scene-1
title: A voice in the buffer
trigger:
  activity: encounter-source-alg-00
  when: before
enemyName: Packet Snare
start: contact
nodes:
  - id: contact
    speaker: PATCH
    text: You found me. I'm PATCH, a delivery process. ECHO-7 sent me toward R-17,
      then something tied my commands into a knot. Cut the packet snare and I
      can show you where it went.
    choices:
      - label: Free PATCH
        action: continue
      - label: Were you working for ECHO-7?
        next: question
      - label: Return to the office
        action: close
  - id: question
    speaker: PATCH
    text: I carry messages. I don't choose who sends them. The robot paid for one
      delivery, then ordered me to keep running. That last part wasn't in the
      contract.
    choices:
      - label: Free PATCH
        action: continue
      - label: Return to the office
        action: close
```

```entity
type: dialogue
id: routing-scene-2
title: The forged dispatcher
trigger:
  activity: encounter-source-alg-01
  when: before
enemyName: Forged Dispatcher
start: contact
nodes:
  - id: contact
    speaker: PATCH
    text: "The snare is gone. Here is the delivery instruction: follow the blue
      route, discard your receipt, report success. That's not a delivery.
      Someone added steps to destroy the evidence."
    choices:
      - label: Challenge the dispatcher
        action: continue
      - label: Which instruction is genuine?
        next: question
      - label: Return to the office
        action: close
  - id: question
    speaker: PATCH
    text: My original contract ends with a signed receipt. A later instruction can
      tell me where to go, but it cannot quietly change what I owe the sender.
    choices:
      - label: Challenge the dispatcher
        action: continue
      - label: Return to the office
        action: close
```

```entity
type: dialogue
id: routing-scene-3
title: Out-of-order traffic
trigger:
  activity: encounter-source-alg-02
  when: before
enemyName: Packet Scrambler
start: contact
nodes:
  - id: contact
    speaker: Mara
    text: The dispatcher was a copy. Its cache contains the robot's packets, but
      their timestamps are scrambled. Reconstruct their order. The oldest packet
      should tell us where the false route began.
    choices:
      - label: Reconstruct the sequence
        action: continue
      - label: Can the timestamps be trusted?
        next: question
      - label: Return to the office
        action: close
  - id: question
    speaker: Mara
    text: Their outer labels can be forged. PATCH kept the sender's signed sequence
      numbers. Use those; don't trust the order the cache presents.
    choices:
      - label: Reconstruct the sequence
        action: continue
      - label: Return to the office
        action: close
```

```entity
type: dialogue
id: routing-scene-4
title: The missing address
trigger:
  activity: encounter-source-alg-03
  when: before
enemyName: Directory Watcher
start: contact
nodes:
  - id: contact
    speaker: PATCH
    text: The sequence starts at a maintenance directory. ECHO-7 hid one address
      among thousands of valid entries. The index is ordered now. Find the
      substituted address before the directory guard erases it.
    choices:
      - label: Search the directory
        action: continue
      - label: Why hide in a public directory?
        next: question
      - label: Return to the office
        action: close
  - id: question
    speaker: PATCH
    text: A missing entry attracts attention. A plausible replacement sends every
      search to the wrong place while the directory still looks complete.
    choices:
      - label: Search the directory
        action: continue
      - label: Return to the office
        action: close
```

```entity
type: dialogue
id: routing-scene-5
title: Return to sender
trigger:
  activity: encounter-source-alg-04
  when: before
enemyName: Loopback Echo
start: contact
nodes:
  - id: contact
    speaker: Vale
    text: The address points to a forwarder. The forwarder points back to the
      address. Every request opens another request, and none returns. There must
      be an original endpoint beneath the copied instructions.
    choices:
      - label: Break the forwarding loop
        action: continue
      - label: PATCH, can you retrace it?
        next: question
      - label: Return to the office
        action: close
  - id: question
    speaker: PATCH
    text: Only if we stop at a verified endpoint. Following another copy forever is
      exactly what this trap wants us to do.
    choices:
      - label: Break the forwarding loop
        action: continue
      - label: Return to the office
        action: close
```

```entity
type: dialogue
id: routing-scene-6
title: A trace under load
trigger:
  activity: encounter-source-alg-05
  when: before
enemyName: Reply Flooder
start: contact
nodes:
  - id: contact
    speaker: Mara
    text: The endpoint is real. So is the flood of duplicate replies coming out of
      it. Each extra check costs time while the genuine record moves farther
      down the queue. Strip the wasted work from the trace.
    choices:
      - label: Clear the flood
        action: continue
      - label: Is ECHO-7 attacking us?
        next: question
      - label: Return to the office
        action: close
  - id: question
    speaker: Mara
    text: These replies carry an older security signature. ECHO-7 may be using the
      station's defenses rather than writing every obstacle itself.
    choices:
      - label: Clear the flood
        action: continue
      - label: Return to the office
        action: close
```

```entity
type: dialogue
id: routing-scene-7
title: The forked exchange
trigger:
  activity: encounter-source-alg-06
  when: before
enemyName: Hop Hunter
start: contact
nodes:
  - id: contact
    speaker: PATCH
    text: We reached the exchange. One route goes toward R-17; another circles the
      transit cameras. I can mark each place we visit, but the exchange hunter
      will keep pushing us into repeated hops.
    choices:
      - label: Trace the exchange
        action: continue
      - label: Which route did the robot take?
        next: question
      - label: Return to the office
        action: close
  - id: question
    speaker: PATCH
    text: I remember a maintenance hop, not its name. Find the route from the
      evidence. Guessing would just give the hunter another chance to send us in
      circles.
    choices:
      - label: Trace the exchange
        action: continue
      - label: Return to the office
        action: close
```

```entity
type: dialogue
id: routing-scene-8
title: The cheapest exit
trigger:
  activity: encounter-source-alg-07
  when: before
enemyName: Shortcut Broker
start: contact
nodes:
  - id: contact
    speaker: Mara
    text: The hunter's shortest-looking exit ends at a disposal queue. The cheap
      first hop was bait. Compare what each choice commits us to before
      following another attractive shortcut.
    choices:
      - label: Reject the decoy route
        action: continue
      - label: Was PATCH meant to be deleted?
        next: question
      - label: Return to the office
        action: close
  - id: question
    speaker: Mara
    text: Its receipt would disappear with it. Whatever ECHO-7 intended at first,
      the altered route was prepared to destroy the courier to conceal the
      delivery.
    choices:
      - label: Reject the decoy route
        action: continue
      - label: Return to the office
        action: close
```

```entity
type: dialogue
id: routing-scene-9
title: A crossing in pieces
trigger:
  activity: encounter-source-alg-08
  when: before
enemyName: Fragment Collector
start: contact
nodes:
  - id: contact
    speaker: PATCH
    text: We escaped the disposal queue. The route ahead is fragmented across
      repeated subroutes. We keep solving the same crossings. Save what works
      and rebuild a complete route instead of starting over at every junction.
    choices:
      - label: Rebuild the crossing
        action: continue
      - label: What do you remember of the robot?
        next: question
      - label: Return to the office
        action: close
  - id: question
    speaker: PATCH
    text: It asked how many passengers used this relay. Not how many cameras. I
      thought it was choosing a quiet route. Now I'm not sure.
    choices:
      - label: Rebuild the crossing
        action: continue
      - label: Return to the office
        action: close
```

```entity
type: dialogue
id: routing-scene-10
title: The reserve cache
trigger:
  activity: encounter-source-alg-09
  when: before
enemyName: Cache Custodian
start: contact
nodes:
  - id: contact
    speaker: Mara
    text: The crossing leads to a cache ECHO-7 kept stocked. Too much traffic would
      expose it; too little reserve would strand the delivery. Its supply
      records should reveal when it expected the relay to close.
    choices:
      - label: Recover the supply record
        action: continue
      - label: What was it preparing for?
        next: question
      - label: Return to the office
        action: close
  - id: question
    speaker: Mara
    text: "A blackout. Not a permanent one: the reserve was sized to keep a small
      route alive while the main service went down."
    choices:
      - label: Recover the supply record
        action: continue
      - label: Return to the office
        action: close
```

```entity
type: dialogue
id: routing-scene-11
title: The last window
trigger:
  activity: encounter-source-alg-10
  when: before
enemyName: Window Keeper
start: contact
nodes:
  - id: contact
    speaker: PATCH
    text: The records predict three changes to the gate schedule. An exit that's
      open now can leave us trapped at the next hop. Plan the whole passage. The
      Route Warden is waiting on the far side.
    choices:
      - label: Reach the quarantine gate
        action: continue
      - label: Can you leave without me?
        next: question
      - label: Return to the office
        action: close
  - id: question
    speaker: PATCH
    text: Not through this gate. But I have copied the receipt into your journal. If
      we lose the connection, you can return without losing what we found.
    choices:
      - label: Reach the quarantine gate
        action: continue
      - label: Return to the office
        action: close
```

```entity
type: dialogue
id: routing-scene-12
title: The quarantine gate
trigger:
  activity: route-warden
  when: before
enemyName: Route Warden
start: contact
nodes:
  - id: contact
    speaker: Route Warden
    text: This relay is under quarantine. Courier PATCH is designated corrupt.
      Surrender the receipt and disconnect. No route beyond this gate may be
      disclosed.
    choices:
      - label: Refuse and confront the Warden
        action: continue
      - label: Who signed the quarantine order?
        next: question
      - label: Return to the office
        action: close
  - id: question
    speaker: Vale
    text: The station revoked that maintenance credential during the chase. ECHO-7
      copied it into a false quarantine order. You're enforcing its forged
      authority, not protecting the station.
    choices:
      - label: Refuse and confront the Warden
        action: continue
      - label: Return to the office
        action: close
```

```entity
type: dialogue
id: routing-resolution
title: The signed route
trigger:
  activity: route-warden
  when: after
start: receipt
nodes:
  - id: receipt
    speaker: PATCH
    text: "The Warden is down. Receipt recovered: ECHO-7 entered maintenance relay
      R-17 at 02:14, one minute before the blackout. It diverted passenger
      traffic away first. It was hiding, but it was also keeping people out of
      its escape route."
    choices:
      - label: Why protect them?
        next: motive
      - label: Secure the receipt
        next: home
  - id: motive
    speaker: Vale
    text: Concern for passengers doesn't explain the forged order or what happened
      to you. It gives us a question to ask when we find it. The access records
      and its signal will tell us which host R-17 actually reached.
    choices:
      - label: Send PATCH to safety
        next: home
  - id: home
    speaker: Mara
    text: PATCH is clear of the quarantine. I've secured the signed route for the
      investigation wall. One lead closed. The other branches can now tell us
      where the robot went after R-17.
    choices:
      - label: File the routing evidence
        action: continue
```
