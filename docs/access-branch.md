# Access records: The erased entry

Start from **Home → Quest board → Access records → Pursue lead**. This branch can be played before Routing trace. It introduces FOLIO, an archivist whose identity was removed alongside ECHO-7's gateway entry.

| Stage | Encounter | Evidence recovered |
| --- | --- | --- |
| The blank ledger | Gateway Sentinel | Access to the archive |
| An archivist without a name | Record Wisp | FOLIO's record index |
| A broken sequence | Sequence Splitter | Original event order |
| The shifted record | Index Shifter | Stable event identifier rather than its current array position |
| The severed link | Pointer Leech | Credential history through linked records |
| Undo the purge | Undo Phantom | Reversed deletion operations from the recovery stack |
| The waiting room | Queue Marshal | An audit receipt delayed behind copied jobs |
| Branches without parents | Branch Pruner | Credential ownership relationships |
| The ordered vault | Vault Skewer | Maintenance tenant's indexed credential |
| Names across the network | Edge Watcher | Links between tenant M-04 and the gateway |
| The revision that survived | Revision Eraser | Versions 42 and 43, their parent link and signed audit |
| The sealed revision | Archive Keeper | Preserved history instead of a forced overwrite |
| Two signatures | Ending dialogue | FOLIO restored; proof ECHO-7 erased its own entry |

The ten chapter encounters use quiz combat tied to the corresponding data-structure books. They are named story encounters using the placeholder robot archetype, not ten new puzzle templates. The opening sentinel uses the structures introduction question pool. Optional conversation paths explain the evidence; they do not change combat stats. The boss uses the mixed structures pool and boss presentation.

Victory offers **Follow the lead**. The boss offers **Recover evidence**, then **File the access evidence** records the ending and claims only this branch's reward. The routing reward is never touched. Story acknowledgments and activity completions survive reloads; an unfinished ending is shown as **Read conclusion** on the quest screen. Healed retries preserve the evidence already earned. The final ECHO-7 encounter still requires all three branches.

Runtime story content is `content/10-access-story.md`. Regenerate explicitly with `npx tsx scripts/write-access-story.ts`, then `npm run content`. Routine Source imports retain this story file. `tests/access-story.test.ts` plays this branch independently from a fresh character, uses healing consumables, validates save restoration and verifies branch-local, nonrepeatable rewards.
