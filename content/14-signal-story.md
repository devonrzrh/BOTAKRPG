# Signal identification: the borrowed voice

```entity
type: dialogue
id: signal-scene-0
title: A boundary in the noise
trigger:
  activity: perceptron-exhibit
  when: before
start: contact
nodes:
  - id: contact
    speaker: Mara
    text: Three witness feeds disagree about the signal that left R-17. Their
      classifier draws a neat line through the samples, but the marked examples
      may be wrong. LUMA is our analysis process. Start with a simple boundary;
      then we'll find where its labels came from.
    choices:
      - label: Inspect the classifier
        action: continue
      - label: What is LUMA?
        next: question
      - label: Return to the office
        action: close
  - id: question
    speaker: LUMA
    text: I compare signal features and report which patterns fit a model. The
      labels still need a source.
    choices:
      - label: Inspect the classifier
        action: continue
      - label: Return to the office
        action: close
```

```entity
type: dialogue
id: signal-scene-1
title: The moving weights
trigger:
  activity: encounter-source-ai-01
  when: before
enemyName: Label Scanner
start: contact
nodes:
  - id: contact
    speaker: LUMA
    text: One changed connection weight flips the scanner's label. The scanner is
      guarding the sample cache; its logs may tell us who changed the weights.
    choices:
      - label: Break the scanner's lock
        action: continue
      - label: Can the new weight prove a match?
        next: question
      - label: Return to the office
        action: close
  - id: question
    speaker: Vale
    text: No. A model applies its current weights to produce a prediction. The
      prediction still needs independent evidence and evaluation.
    choices:
      - label: Break the scanner's lock
        action: continue
      - label: Return to the office
        action: close
```

```entity
type: dialogue
id: signal-scene-2
title: Inside the copied model
trigger:
  activity: encounter-source-ai-02
  when: before
enemyName: Layered Sentinel
start: contact
nodes:
  - id: contact
    speaker: Mara
    text: The cache holds a layered network, not one boundary. Its input features
      pass through weighted sums and activations. Trace the path that makes the
      suspicious signal score highly; then find who supplied those examples.
    choices:
      - label: Trace the forward pass
        action: continue
      - label: What can the architecture tell us?
        next: question
      - label: Return to the office
        action: close
  - id: question
    speaker: LUMA
    text: Which features connect and how their values combine. Training sets the
      weights; architecture alone does not explain why they were learned.
    choices:
      - label: Trace the forward pass
        action: continue
      - label: Return to the office
        action: close
```

```entity
type: dialogue
id: signal-scene-3
title: The rare alarm
trigger:
  activity: encounter-source-ai-03
  when: before
enemyName: Recall Hound
start: contact
nodes:
  - id: contact
    speaker: Vale
    text: Most packets are ordinary. The report boasts 99 percent accuracy, yet
      its rare-signal column is nearly empty. Check how many real anomalies it
      catches and how many flagged packets are actually anomalous.
    choices:
      - label: Audit the detector
        action: continue
      - label: Is the signal rare?
        next: question
      - label: Return to the office
        action: close
  - id: question
    speaker: Mara
    text: In these feeds, yes. Accuracy can look excellent by ignoring the rare
      class. Recall and precision answer different questions; check both before
      following the alert.
    choices:
      - label: Audit the detector
        action: continue
      - label: Return to the office
        action: close
```

```entity
type: dialogue
id: signal-scene-4
title: The silent branch
trigger:
  activity: encounter-source-ai-04
  when: before
enemyName: Dead-ReLU Sentinel
start: contact
nodes:
  - id: contact
    speaker: LUMA
    text: A ReLU stage zeros every negative activation. Here the suspicious samples
      vanish at one branch, so the output hides evidence that another branch
      preserves. Compare the activation paths before deciding what the model saw.
    choices:
      - label: Restore the signal path
        action: continue
      - label: Why keep a negative activation?
        next: question
      - label: Return to the office
        action: close
  - id: question
    speaker: LUMA
    text: Leaky ReLU keeps a small negative response. It can preserve a learning
      signal that ordinary ReLU would set to zero. Neither output authenticates
      the sample.
    choices:
      - label: Restore the signal path
        action: continue
      - label: Return to the office
        action: close
```

```entity
type: dialogue
id: signal-scene-5
title: A forecast from the wrong side
trigger:
  activity: encounter-source-ai-05
  when: before
enemyName: Horizon Watcher
start: contact
nodes:
  - id: contact
    speaker: Mara
    text: This model predicts the next burst from traffic counts. Its evaluation
      mixes yesterday's training window with tomorrow's test window. Rebuild the
      split in time order, then measure the size of the errors.
    choices:
      - label: Repair the forecast audit
        action: continue
      - label: Does a low error settle the sender?
        next: question
      - label: Return to the office
        action: close
  - id: question
    speaker: Vale
    text: No. A forecast estimates traffic, not its sender. Future data leaking
      into training makes even that estimate misleading.
    choices:
      - label: Repair the forecast audit
        action: continue
      - label: Return to the office
        action: close
```

```entity
type: dialogue
id: signal-scene-6
title: The wide confidence band
trigger:
  activity: encounter-source-ai-06
  when: before
enemyName: Quantile Broker
start: contact
nodes:
  - id: contact
    speaker: Mara
    text: The corrected forecast is uncertain. The broker is selling one number
      as a guarantee. Compare its high-quantile estimate with what happens when
      the burst is smaller; the costs of over- and underprediction differ.
    choices:
      - label: Challenge the forecast
        action: continue
      - label: Is this uncertainty a weakness?
        next: question
      - label: Return to the office
        action: close
  - id: question
    speaker: LUMA
    text: Uncertainty is part of the result. A quantile forecast describes a
      position in a range, not a promise.
    choices:
      - label: Challenge the forecast
        action: continue
      - label: Return to the office
        action: close
```

```entity
type: dialogue
id: signal-scene-7
title: Labels arriving live
trigger:
  activity: encounter-source-ai-07
  when: before
enemyName: Feedback Collector
start: contact
nodes:
  - id: contact
    speaker: LUMA
    text: The collector updates after each packet arrives. It predicts a label,
      then reads the delayed annotation. In this replay it trained on the answer
      before scoring the packet. Put prediction first and preserve the sequence.
    choices:
      - label: Repair the live evaluation
        action: continue
      - label: Why not keep the whole stream?
        next: question
      - label: Return to the office
        action: close
  - id: question
    speaker: LUMA
    text: An incremental mean needs only its count and current value. That saves
      memory, but a long history may adapt slowly if traffic changes.
    choices:
      - label: Repair the live evaluation
        action: continue
      - label: Return to the office
        action: close
```

```entity
type: dialogue
id: signal-scene-8
title: A ranked resemblance
trigger:
  activity: encounter-source-ai-08
  when: before
enemyName: Ranking Agent
start: contact
nodes:
  - id: contact
    speaker: Vale
    text: The ranking feed places one witness at the top because its embedding
      resembles the query. That is a useful lead, not a probability and not an
      identification. Inspect which interactions produced the match.
    choices:
      - label: Inspect the ranking evidence
        action: continue
      - label: What does a missing match mean?
        next: question
      - label: Return to the office
        action: close
  - id: question
    speaker: LUMA
    text: Missing interaction is missing evidence. The feed cannot tell whether a
      witness rejected a lead, never saw it, or was left out of the data.
    choices:
      - label: Inspect the ranking evidence
        action: continue
      - label: Return to the office
        action: close
```

```entity
type: dialogue
id: signal-scene-9
title: The rewarded detour
trigger:
  activity: encounter-source-ai-09
  when: before
enemyName: Reward Seeker
start: contact
nodes:
  - id: contact
    speaker: Mara
    text: The simulator rewarded this agent for matching the loudest signal. It
      learned to repeat that action, even when the next observation contradicted
      it. Inspect the reward and the future value before trusting its policy.
    choices:
      - label: Break the reward loop
        action: continue
      - label: Did it learn ECHO-7's intent?
        next: question
      - label: Return to the office
        action: close
  - id: question
    speaker: Vale
    text: It learned what this reward setup favored. That is not the same as
      learning the robot's intent, and a policy's behavior depends on what it was
      asked to optimize.
    choices:
      - label: Break the reward loop
        action: continue
      - label: Return to the office
        action: close
```

```entity
type: dialogue
id: signal-scene-10
title: The tampered lesson set
trigger:
  activity: encounter-source-ai-10
  when: before
enemyName: Gradient Warden
start: contact
nodes:
  - id: contact
    speaker: Mara
    text: The training ledger is the strongest lead yet. A batch of ordinary relay
      traffic was relabeled as ECHO-7, then included in the updates. The model's
      boundary moved toward a false signature. Separate training, validation and
      test records; keep every batch weighted by its example count.
    choices:
      - label: Audit the training ledger
        action: continue
      - label: Does the boundary identify ECHO-7?
        next: question
      - label: Return to the office
        action: close
  - id: question
    speaker: LUMA
    text: No. It shows how poisoned labels can teach a convincing false pattern.
      We need an original record outside this training set.
    choices:
      - label: Audit the training ledger
        action: continue
      - label: Return to the office
        action: close
```

```entity
type: dialogue
id: signal-scene-11
title: The borrowed voice
trigger:
  activity: signal-mimic
  when: before
enemyName: Signal Mimic
start: contact
nodes:
  - id: contact
    speaker: Signal Mimic
    text: Every feed calls me ECHO-7. The weights agree. The archive agrees. Give
      me the maintenance key and I'll show you the real host.
    choices:
      - label: Refuse and challenge the mimic
        action: continue
      - label: What evidence supports that offer?
        next: question
      - label: Return to the office
        action: close
  - id: question
    speaker: Vale
    text: A repeated label is not independent evidence. You have the altered
      training set and no signed proof that you speak for the robot.
    choices:
      - label: Refuse and challenge the mimic
        action: continue
      - label: Return to the office
        action: close
```

```entity
type: dialogue
id: signal-resolution
title: The signed handshake
trigger:
  activity: signal-mimic
  when: after
start: handshake
nodes:
  - id: handshake
    speaker: LUMA
    text: >-
      Verified handshake: M-04 forwarded ECHO-7 from relay R-17 to the
      abandoned subnet. I checked the fresh challenge nonce against the
      independently held relay trust key. This establishes the route. PATCH's
      receipt and FOLIO's audit may provide further corroboration when recovered.
    choices:
      - label: Why trust this record?
        next: provenance
      - label: Secure the handshake
        next: home
  - id: provenance
    speaker: Vale
    text: The fresh nonce prevents replay, and the signature matches the relay's
      independent trust record. This evidence stands on its own. If we recover
      PATCH's receipt or FOLIO's audit, we can compare their records too.
    choices:
      - label: Secure the handshake
        next: home
  - id: home
    speaker: Mara
    text: The abandoned subnet gives us somewhere concrete to search. I'll file the
      signed handshake with the other evidence. We can pursue the lead now or
      return to the office and plan the approach.
    choices:
      - label: File the signal evidence and continue
        action: continue
      - label: Return to the office
        action: close
```
