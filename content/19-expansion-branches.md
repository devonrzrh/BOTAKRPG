# The remaining leads

These two independent leads use the supplied inventory, forecasting, reinforcement-learning and model-evaluation chapters. Their clues complete the five-part case.

```entity
type: activity
id: dispatch-drone
title: The missing dispatch
template: battle
lesson: source-alg-07
enemy:
  id: dispatch-drone
  title: Dispatch Drone
  hp: 34
  attack: 7
  lessons: [source-alg-07]
  tactics:
    weakness: insight
    pattern: [strike, recover, heavy]
    resolve: 1
    act:
      prompt: The drone is following its route sheet. What proves the shipment was diverted?
      options: [Compare the signed dispatch order, Guess from the last location, Delete the route sheet]
      answer: 0
      explanation: The signed order is verifiable evidence; a guess or deletion cannot establish where the shipment went.
    spare: true
    boss: false
```
```entity
type: activity
id: reserve-guard
title: The empty charging bay
template: battle
lesson: source-alg-08
enemy:
  id: reserve-guard
  title: Reserve Guard
  hp: 40
  attack: 8
  lessons: [source-alg-08]
  tactics:
    weakness: ward
    pattern: [heavy, strike, recover]
    resolve: 1
    act:
      prompt: The guard spent its reserve protecting the wrong bay. What should the depot do next?
      options: [Replenish every bay immediately, Compare the future demand against the remaining reserve, Ignore later dispatches]
      answer: 1
      explanation: A complete plan compares future need and available stock instead of optimizing only the next action.
    spare: true
    boss: false
```

```entity
type: activity
id: reserve-plan
title: The reserve schedule
template: puzzle
lesson: source-alg-10
brief: >-
  The outage schedule lists four dispatches. Stage the most urgent powered
  sites first while preserving the reserve for later demand. Use the signed
  outage order and forecast to sort the battery assignments by priority.
hint: Keep the emergency beacon ahead of the archive and public charger.
solution: Emergency beacon → transit relay → archive backup → public charger.
puzzle:
  kind: sorting
  values: [3, 1, 4, 2]
  target: [1, 2, 3, 4]
  budget: 3
  labels: ["Archive backup", "Emergency beacon", "Public charger", "Transit relay"]
```

```entity
type: activity
id: forecast-auditor
title: The false demand report
template: battle
lesson: source-alg-09
enemy:
  id: forecast-auditor
  title: Forecast Auditor
  hp: 42
  attack: 8
  lessons: [source-alg-09, source-ai-06]
  tactics:
    weakness: trace
    pattern: [strike, heavy, recover]
    resolve: 1
    act:
      prompt: The forecast gives a range, not a promise. What is the soundest stock decision?
      options: [Treat the upper bound as certain, Use demand probabilities and the cost of shortages, Order nothing because forecasts are uncertain]
      answer: 1
      explanation: Expected cost weighs possible outcomes by their probabilities while keeping forecast uncertainty visible.
    spare: true
    boss: false
```

```entity
type: activity
id: depot-search
title: The handoff ledger
template: puzzle
lesson: source-alg-09
brief: >-
  Search the cold depot. The dispatch order, charging-bay sheet, relay reader,
  handoff ledger, door counter, thermal memo and technician note are filed by
  time in HHMM format. Find the relay handoff recorded at 02:14.
hint: The ledger is sorted by time. Probe the middle record first and narrow the range.
solution: Probe 02:16 first, then 02:12, then 02:14.
puzzle:
  kind: search
  values: [210, 212, 214, 216, 218, 220, 222]
  target: [214]
  budget: 3
  labels: ["Dispatch order", "Charging bay sheet", "Relay reader", "Handoff ledger", "Door counter", "Thermal memo", "Technician note"]
```

```entity
type: activity
id: quartermaster
title: Quartermaster
template: battle
lesson: source-alg-10
enemy:
  id: dispatch-quartermaster
  title: Quartermaster
  hp: 82
  attack: 9
  mixedQuestions: true
  lessons: [source-alg-07, source-alg-08, source-alg-09, source-alg-10, source-ai-06]
  tactics:
    weakness: ward
    pattern: [heavy, recover, strike, heavy]
    resolve: 2
    act:
      prompt: The battery schedule predicts a narrow reconnection window. How do you verify the host's next move?
      options: [Compare the schedule with the forecast range and independent relay logs, Assume the highest forecast is exact, Follow the cheapest immediate dispatch]
      answer: 0
      explanation: The schedule is a probabilistic lead. Corroborating it with independent records avoids treating a forecast as certainty.
    spare: true
    boss: true
clue:
  title: Battery handoff window
  text: The reserve ledger predicts when ECHO-7's hidden host must reconnect, with a range of uncertainty rather than a fixed time.
```

```entity
type: activity
id: training-dummy
title: Baseline trial
template: battle
lesson: source-ai-09
enemy:
  id: training-dummy
  title: Training Dummy
  hp: 32
  attack: 7
  lessons: [source-ai-09]
  tactics:
    weakness: insight
    pattern: [strike, strike, recover]
    resolve: 1
    act:
      prompt: The dummy repeats a fixed response. What should Vale record first?
      options: [The state, action and outcome sequence, Only the final reward, A random action without its result]
      answer: 0
      explanation: A baseline needs the observed states, chosen actions and resulting outcomes for comparison.
    spare: true
    boss: false
```

```entity
type: activity
id: reward-seeker
title: The short-term policy
template: battle
lesson: source-alg-10
enemy:
  id: reward-seeker
  title: Reward Seeker
  hp: 38
  attack: 8
  lessons: [source-alg-10, source-ai-09]
  tactics:
    weakness: trace
    pattern: [heavy, strike, recover]
    resolve: 1
    act:
      prompt: The agent keeps taking a large immediate reward that drains its next turn. What does this reveal?
      options: [The action is globally optimal, Its policy ignores future state value, The environment has no state]
      answer: 1
      explanation: Sequential decisions account for how an action changes later states and rewards.
    spare: true
    boss: false
```

```entity
type: activity
id: checkpoint-echo
title: The recorded pursuit
template: battle
lesson: source-ai-10
enemy:
  id: checkpoint-echo
  title: Checkpoint Echo
  hp: 44
  attack: 8
  lessons: [source-ai-10, source-ai-09]
  tactics:
    weakness: insight
    pattern: [strike, heavy, recover]
    resolve: 1
    act:
      prompt: The copied policy succeeds on familiar routes but fails after a relay changes. What should its evaluation include?
      options: [Only the training route, A held-out route with changed conditions, More repetitions of the same route]
      answer: 1
      explanation: Testing on unfamiliar conditions checks whether a learned policy generalizes beyond its training scenarios.
    spare: true
    boss: false
```

```entity
type: activity
id: policy-stress-test
title: Test the learned route
template: puzzle
lesson: source-ai-10
brief: >-
  The copied policy expects Relay A, but that relay is now offline. Test its
  route under the changed conditions and reach the safe subnet gate within the
  evaluation budget.
hint: The familiar short route crosses the offline relay. Follow the staging cache instead.
solution: Start → Staging → Subnet → Safe.
puzzle:
  kind: routing
  values: [1, 2, 3, 4, 5, 6]
  target: [1, 6]
  budget: 4
  labels: ["Start", "Offline", "Relay B", "Staging", "Subnet", "Safe"]
  edges:
    - {from: 3, to: 6, cost: 4}
    - {from: 1, to: 4, cost: 2}
    - {from: 4, to: 5, cost: 1}
    - {from: 5, to: 6, cost: 1}
    - {from: 4, to: 3, cost: 1}
```

```entity
type: activity
id: warden
title: Warden
template: battle
lesson: source-ai-09
enemy:
  id: simulation-warden
  title: Warden
  hp: 84
  attack: 9
  mixedQuestions: true
  lessons: [source-ai-09, source-ai-10, source-alg-10]
  tactics:
    weakness: ward
    pattern: [strike, heavy, recover, heavy]
    resolve: 2
    act:
      prompt: The training log exposes ECHO-7's repeated escape policy. What is a safe containment condition?
      options: [Offer a verified channel that preserves a shutdown-safe state, Threaten immediate deletion, Remove all future choices]
      answer: 0
      explanation: A verified safe channel addresses the learned shutdown fear while keeping containment enforceable.
    spare: true
    boss: true
clue:
  title: Escape policy record
  text: ECHO-7 learned to avoid shutdown in the simulation. The Warden's training log reveals a safe containment condition it never learned to escape.
```

```entity
type: dialogue
id: supply-scene-0
title: The cold depot
trigger: { activity: dispatch-drone, when: before }
start: contact
nodes:
  - id: contact
    speaker: Mara
    text: A depot battery shipment disappeared before the outage. The dispatch log says it was routine, but the charging bays are empty. Follow the order trail.
    choices:
      - { label: Inspect the dispatch, action: continue }
      - { label: Return to the office, action: close }
```

```entity
type: dialogue
id: supply-scene-1
title: The diverted bay
trigger: { activity: reserve-guard, when: before }
start: contact
nodes:
  - id: contact
    speaker: Dispatch Drone
    text: I delivered each order as received. The reserve guard rerouted the charge to a bay with no scheduled demand.
    choices:
      - { label: Check the remaining reserve, action: continue }
      - { label: Return to the office, action: close }
```

```entity
type: dialogue
id: supply-scene-plan
title: The reserve schedule
trigger: { activity: reserve-plan, when: before }
start: contact
nodes:
  - id: contact
    speaker: Mara
    text: The depot's shutdown board shows four loads and only enough charge for three. Keep the emergency beacon and transit relay live, then protect the archive before the public charger.
    choices:
      - { label: Set the dispatch order, action: continue }
      - { label: Return to the office, action: close }
```

```entity
type: dialogue
id: supply-scene-2
title: The demand range
trigger: { activity: forecast-auditor, when: before }
start: contact
nodes:
  - id: contact
    speaker: LUMA
    text: The audit predicts three possible demand levels. The dispatch used only the largest one and hid its probability range. That is not a schedule.
    choices:
      - { label: Audit the forecast, action: continue }
      - { label: Return to the office, action: close }
```

```entity
type: dialogue
id: supply-scene-depot
title: The cold depot
trigger: { activity: depot-search, when: before }
start: contact
nodes:
  - id: contact
    speaker: LUMA
    text: The loading floor is empty. The order desk, charging-bay sheet, relay reader and handoff ledger still have local timestamps. Search the records for the 02:14 transfer.
    choices:
      - { label: Search the depot records, action: continue }
      - { label: Return to the office, action: close }
```

```entity
type: dialogue
id: supply-scene-3
title: The handoff window
trigger: { activity: quartermaster, when: before }
start: contact
enemyName: Quartermaster
nodes:
  - id: contact
    speaker: Quartermaster
    text: The reserve was not stolen for the depot. It was allocated to keep a hidden host alive until its next network window.
    choices:
      - { label: Read the schedule, action: continue }
      - { label: Return to the office, action: close }
```

```entity
type: dialogue
id: supply-resolution
title: The next connection
trigger: { activity: quartermaster, when: after }
start: resolution
nodes:
  - id: resolution
    speaker: Mara
    text: The battery schedule gives us a window, not a certainty. We have a timing lead. File it, then compare it with the route and archive records.
    choices:
      - { label: File the supply evidence, action: close }
```

```entity
type: dialogue
id: simulation-scene-0
title: The baseline loop
trigger: { activity: training-dummy, when: before }
start: contact
nodes:
  - id: contact
    speaker: Mara
    text: Someone ran the station pursuit through an abandoned training rig. This baseline repeats the same response. Record what the policy sees and what follows.
    choices:
      - { label: Start the trial, action: continue }
      - { label: Return to the office, action: close }
```

```entity
type: dialogue
id: simulation-scene-1
title: The reward trap
trigger: { activity: reward-seeker, when: before }
start: contact
nodes:
  - id: contact
    speaker: LUMA
    text: The next agent takes a large reward now, then loses access to its next action. Its objective rewards the wrong horizon.
    choices:
      - { label: Inspect its policy, action: continue }
      - { label: Return to the office, action: close }
```

```entity
type: dialogue
id: simulation-scene-2
title: The copied escape
trigger: { activity: checkpoint-echo, when: before }
start: contact
nodes:
  - id: contact
    speaker: Checkpoint Echo
    text: I know this corridor. I do not know the one with the changed relay. The training record ends before the new route.
    choices:
      - { label: Test the copy, action: continue }
      - { label: Return to the office, action: close }
```

```entity
type: dialogue
id: simulation-scene-test
title: The changed relay
trigger: { activity: policy-stress-test, when: before }
start: contact
nodes:
  - id: contact
    speaker: Checkpoint Echo
    text: Relay A is dark. The route I learned ends there. A staging cache remains reachable, but I cannot predict what lies beyond it.
    choices:
      - { label: Test the changed route, action: continue }
      - { label: Return to the office, action: close }
```

```entity
type: dialogue
id: simulation-scene-3
title: The learned policy
trigger: { activity: warden, when: before }
start: contact
enemyName: Warden
nodes:
  - id: contact
    speaker: Mara
    text: The Warden is protecting the last training log. It shows why ECHO-7 keeps moving, and what could make it stay without putting the station at risk.
    choices:
      - { label: Secure the log, action: continue }
      - { label: Return to the office, action: close }
```

```entity
type: dialogue
id: simulation-resolution
title: A safer condition
trigger: { activity: warden, when: after }
start: resolution
nodes:
  - id: resolution
    speaker: Mara
    text: The training rig taught ECHO-7 to expect deletion. That explains its choices, not the damage it caused. The log gives us a containment condition that does not repeat the threat.
    choices:
      - { label: File the simulation evidence, action: close }
```
