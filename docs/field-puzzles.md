# Field puzzles

Open **Case → Field puzzles**, or use **Field puzzle** on a relevant chapter
node. Chapter study screens also link to their puzzle. These optional cases
preserve the existing storyline and boss requirements.

| Case | Chapter | Interaction |
| --- | --- | --- |
| Corrupted return buffer | Stack | Push/pop to reconstruct a target permutation |
| Stalled packet relay | Queue | Rotate/dispatch the FIFO front |
| Scrambled transit log | Basic Sorting Algorithms | Swap adjacent timestamps into ascending order |
| Relay blackout | Graph Searching | Traverse weighted edges within a signal budget |

Every first completion files a clue and grants 25 XP. Replays grant no extra XP.
An unaided solution records puzzle mastery evidence separately from quiz answers.
Hints and complete walkthroughs are optional. Reset starts a fresh attempt.

Commands and hint use are saved in IndexedDB and included in journal export.
Reading the linked chapter returns to the same puzzle when the book closes.
Imported runs are replayed and validated before replacing the current save.

## Authoring

`content/15-field-puzzles.md` configures the registered `puzzle` activity template.
Each activity requires `lesson`, `brief`, `hint`, `solution`, and `puzzle`:

```yaml
puzzle:
  kind: stack # stack | queue | sorting | routing
  values: [1, 2, 3, 4]
  target: [2, 1, 4, 3]
  budget: 8
```

For routing, `values` lists node IDs, `target` is `[start, goal]`, and `edges`
contains undirected `{from, to, cost}` entries. Its budget measures total cost;
other puzzle budgets measure actions. Content validation rejects impossible
targets, insufficient budgets, unknown nodes, and duplicate graph connections.

A `kind: case` quest connects its puzzle objective to the one-time XP reward.
The TypeScript model implements operations; Markdown never executes code.
