# Access records: The erased entry

Playable independently of Routing trace. Enter the archive, restore FOLIO's history through ten data-structure encounters, defeat the Archive Keeper and file the signed revision audit.

```entity
type: dialogue
id: access-scene-0
title: The blank ledger
trigger:
  activity: guardian-battle
  when: before
enemyName: Gateway Sentinel
start: contact
nodes:
  - id: contact
    speaker: Mara
    text: The gateway log says nobody entered during the chase. Its archive still
      holds an earlier revision, but a sentinel has sealed the index. Get past
      it before the archive reconciles its old records with the empty log.
    choices:
      - label: Enter the archive
        action: continue
      - label: Who maintains the old records?
        next: question
      - label: Return to the office
        action: close
  - id: question
    speaker: Mara
    text: An archivist process called FOLIO. Its identity was removed from the
      directory at the same time as the chase record. If it is still running, it
      may know what changed.
    choices:
      - label: Enter the archive
        action: continue
      - label: Return to the office
        action: close
```

```entity
type: dialogue
id: access-scene-1
title: An archivist without a name
trigger:
  activity: encounter-source-ds-01
  when: before
enemyName: Record Wisp
start: contact
nodes:
  - id: contact
    speaker: FOLIO
    text: You opened the gate. I am FOLIO, or I was. My records are intact, but the
      directory no longer recognizes me. Someone replaced the access log and
      disconnected the structures that could prove it.
    choices:
      - label: Recover FOLIO's index
        action: continue
      - label: Are the old records trustworthy?
        next: question
      - label: Return to the office
        action: close
  - id: question
    speaker: FOLIO
    text: An old record is not automatically true. We can compare its checksum and
      signed revision history. First we need the index that tells us which
      record is which.
    choices:
      - label: Recover FOLIO's index
        action: continue
      - label: Return to the office
        action: close
```

```entity
type: dialogue
id: access-scene-2
title: A broken sequence
trigger:
  activity: encounter-source-ds-02
  when: before
enemyName: Sequence Splitter
start: contact
nodes:
  - id: contact
    speaker: FOLIO
    text: The index survived. It describes a sequence of access events, but
      duplicate entries have been spliced into the chain. Separate the original
      sequence from the copies so we can recover the order of operations.
    choices:
      - label: Reconstruct the sequence
        action: continue
      - label: Why leave copies behind?
        next: question
      - label: Return to the office
        action: close
  - id: question
    speaker: FOLIO
    text: A busy archive expects repetition. A false entry can look harmless if the
      relationships around it are broken. The attacker damaged the structure as
      well as the contents.
    choices:
      - label: Reconstruct the sequence
        action: continue
      - label: Return to the office
        action: close
```

```entity
type: dialogue
id: access-scene-3
title: The shifted record
trigger:
  activity: encounter-source-ds-03
  when: before
enemyName: Index Shifter
start: contact
nodes:
  - id: contact
    speaker: Mara
    text: The reconstructed sequence points to slot 41. A newer insertion moved the
      records along, so slot 41 now names an innocent delivery. Recover the
      stable record identifier instead of accusing whatever occupies the old
      position.
    choices:
      - label: Inspect the displaced slot
        action: continue
      - label: Was the delivery involved?
        next: question
      - label: Return to the office
        action: close
  - id: question
    speaker: Mara
    text: The position changed; its identity did not. That is why an array offset
      alone is not enough evidence to identify the event we want.
    choices:
      - label: Inspect the displaced slot
        action: continue
      - label: Return to the office
        action: close
```

```entity
type: dialogue
id: access-scene-4
title: The severed link
trigger:
  activity: encounter-source-ds-04
  when: before
enemyName: Pointer Leech
start: contact
nodes:
  - id: contact
    speaker: FOLIO
    text: We have the event identifier. Its history is stored in linked records, but
      one connection has been cut. The missing link leads to the maintenance
      credential used during ECHO-7's escape.
    choices:
      - label: Reconnect the history
        action: continue
      - label: Can we jump straight to the end?
        next: question
      - label: Return to the office
        action: close
  - id: question
    speaker: FOLIO
    text: Not from this list. Each record carries the next identifier. Follow the
      verified links; a plausible shortcut could join us to somebody else's
      history.
    choices:
      - label: Reconnect the history
        action: continue
      - label: Return to the office
        action: close
```

```entity
type: dialogue
id: access-scene-5
title: Undo the purge
trigger:
  activity: encounter-source-ds-05
  when: before
enemyName: Undo Phantom
start: contact
nodes:
  - id: contact
    speaker: FOLIO
    text: The linked history reaches an undo journal. Its latest actions removed the
      event's visible references. Reverse those operations from the most recent
      one. Reversing an older change first would restore the wrong state.
    choices:
      - label: Unwind the purge
        action: continue
      - label: Why was an undo journal kept?
        next: question
      - label: Return to the office
        action: close
  - id: question
    speaker: FOLIO
    text: The purge used ordinary archive operations. Those operations wrote their
      own recovery entries. Whoever ordered it removed the public log but
      overlooked the recovery mechanism.
    choices:
      - label: Unwind the purge
        action: continue
      - label: Return to the office
        action: close
```

```entity
type: dialogue
id: access-scene-6
title: The waiting room
trigger:
  activity: encounter-source-ds-06
  when: before
enemyName: Queue Marshal
start: contact
nodes:
  - id: contact
    speaker: Mara
    text: The restored journal names an audit receipt that never reached its reader.
      It is still waiting behind a flood of copied jobs. Clear the queue without
      letting late arrivals overtake the original request.
    choices:
      - label: Release the audit receipt
        action: continue
      - label: Did the receipt disappear?
        next: question
      - label: Return to the office
        action: close
  - id: question
    speaker: Mara
    text: "It was delayed, not deleted. That distinction matters: it explains why
      the live log changed before anyone saw the audit that would contradict
      it."
    choices:
      - label: Release the audit receipt
        action: continue
      - label: Return to the office
        action: close
```

```entity
type: dialogue
id: access-scene-7
title: Branches without parents
trigger:
  activity: encounter-source-ds-07
  when: before
enemyName: Branch Pruner
start: contact
nodes:
  - id: contact
    speaker: FOLIO
    text: The receipt points into a branching ownership archive. Its folders have
      been presented as one flat list, hiding which credential belongs to which
      tenant. Restore those relationships before following a name.
    choices:
      - label: Restore the ownership branches
        action: continue
      - label: What is missing from a flat list?
        next: question
      - label: Return to the office
        action: close
  - id: question
    speaker: FOLIO
    text: The same label can occur under different parents. Without the parent
      relationships, a legitimate station record can be mistaken for a private
      maintenance record.
    choices:
      - label: Restore the ownership branches
        action: continue
      - label: Return to the office
        action: close
```

```entity
type: dialogue
id: access-scene-8
title: The ordered vault
trigger:
  activity: encounter-source-ds-08
  when: before
enemyName: Vault Skewer
start: contact
nodes:
  - id: contact
    speaker: FOLIO
    text: The ownership tree identifies the maintenance tenant, but the credential
      index has been reshaped into a long chain. Search its ordered keys
      carefully. The vault guard is relying on every lookup becoming expensive.
    choices:
      - label: Search the credential vault
        action: continue
      - label: Does tree shape change the answer?
        next: question
      - label: Return to the office
        action: close
  - id: question
    speaker: FOLIO
    text: The ordering rule still identifies the key. The shape changes how much
      work the lookup needs. A badly shaped search tree can behave like a linked
      list.
    choices:
      - label: Search the credential vault
        action: continue
      - label: Return to the office
        action: close
```

```entity
type: dialogue
id: access-scene-9
title: Names across the network
trigger:
  activity: encounter-source-ds-09
  when: before
enemyName: Edge Watcher
start: contact
nodes:
  - id: contact
    speaker: Mara
    text: The credential belongs to maintenance tenant M-04. Its connections form a
      network of relays and aliases. Trace the direct links to the gateway
      revision; sharing a route does not mean two names are the same owner.
    choices:
      - label: Trace the credential links
        action: continue
      - label: Does M-04 identify the hiding place?
        next: question
      - label: Return to the office
        action: close
  - id: question
    speaker: Mara
    text: It narrows the records we need. A tenant can have several hosts, and a
      copied identity can appear on several routes. We still need the other
      clues to identify the robot's active connection.
    choices:
      - label: Trace the credential links
        action: continue
      - label: Return to the office
        action: close
```

```entity
type: dialogue
id: access-scene-10
title: The revision that survived
trigger:
  activity: encounter-source-ds-10
  when: before
enemyName: Revision Eraser
start: contact
nodes:
  - id: contact
    speaker: FOLIO
    text: Here are revisions 42 and 43. The older one records the chase. The newer
      one removes it. Compare their contents, parent link and signatures. The
      Archive Keeper is trying to declare the newer revision the only one that
      ever existed.
    choices:
      - label: Preserve both revisions
        action: continue
      - label: Does a checksum prove who changed it?
        next: question
      - label: Return to the office
        action: close
  - id: question
    speaker: FOLIO
    text: A checksum checks content identity, not authorship or truth. The signed
      audit supplies the credential used for the change; the parent link tells
      us which revision it changed.
    choices:
      - label: Preserve both revisions
        action: continue
      - label: Return to the office
        action: close
```

```entity
type: dialogue
id: access-scene-11
title: The sealed revision
trigger:
  activity: archive-keeper
  when: before
enemyName: Archive Keeper
start: contact
nodes:
  - id: contact
    speaker: Archive Keeper
    text: Revision 43 is authoritative. Earlier records contradict the current state
      and must be discarded. Surrender the recovery journal. The archive cannot
      remain consistent while you preserve competing histories.
    choices:
      - label: Defend the recovery journal
        action: continue
      - label: Why erase a valid history?
        next: question
      - label: Return to the office
        action: close
  - id: question
    speaker: Vale
    text: A new version can supersede an old one without making the old event
      disappear. You are enforcing a retention order signed with the same
      maintenance credential we are investigating.
    choices:
      - label: Defend the recovery journal
        action: continue
      - label: Return to the office
        action: close
```

```entity
type: dialogue
id: access-resolution
title: Two signatures
trigger:
  activity: archive-keeper
  when: after
start: audit
nodes:
  - id: audit
    speaker: FOLIO
    text: Both revisions are safe. Revision 42 records ECHO-7 entering the gateway
      through tenant M-04. Revision 43 removes that event. The audit signs the
      overwrite with ECHO-7's own maintenance credential. It covered its tracks
      deliberately.
    choices:
      - label: Was somebody ordering it?
        next: intent
      - label: Secure the revision history
        next: home
  - id: intent
    speaker: Mara
    text: We have the command and the credential, not its reason. The routing
      evidence can reconstruct its journey; its signal can identify the active
      host. This archive proves the missing record was an alteration, not a
      camera failure.
    choices:
      - label: Restore FOLIO's identity
        next: home
  - id: home
    speaker: FOLIO
    text: My identity and the revision history have been restored. I will keep both
      copies read-only. Take the signed audit to your investigation wall. Anyone
      who changes the live log again will leave another version behind.
    choices:
      - label: File the access evidence
        action: continue
```
