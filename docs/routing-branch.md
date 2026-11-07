# Routing trace: The dead relay

Implemented story branch. Start from **Home → Quest board → Routing trace → Pursue lead** after taking the case. Existing saves resume the next unfinished stage. The other two branches remain independent.

## Story and playable sequence

Mara finds a camera record sent to a supposedly nonexistent relay. Vale enters the maze and locates PATCH, a courier carrying a signed receipt from ECHO-7. A forged delivery instruction has trapped the courier and marked it for disposal.

| Stage | Play | Story result |
| --- | --- | --- |
| The dead relay | Reach the maze exit manually, with blocks or with Python | Locate PATCH; **Follow the routing trace** continues |
| A voice in the buffer | Packet Snare; Python checkpoint | Free the courier |
| The forged dispatcher | Forged Dispatcher; algorithm instructions | Detect the instruction to destroy PATCH's receipt |
| Out-of-order traffic | Packet Scrambler; sorting | Reconstruct the signed packet sequence |
| The missing address | Directory Watcher; searching | Find the substituted maintenance address |
| Return to sender | Loopback Echo; recursion | Escape a forwarding loop |
| A trace under load | Reply Flooder; complexity | Separate the real endpoint from duplicate work |
| The forked exchange | Hop Hunter; graph search | Follow the maintenance route |
| The cheapest exit | Shortcut Broker; greedy choices | Reject a disposal route disguised as a shortcut |
| A crossing in pieces | Fragment Collector; dynamic programming | Reconstruct the crossing from repeated subroutes |
| The reserve cache | Cache Custodian; inventory and uncertainty | Discover preparations for a temporary blackout |
| The last window | Window Keeper; sequential decisions | Reach the quarantine gate |
| The quarantine gate | Route Warden; mixed algorithm chapters | Defeat the defense enforcing ECHO-7's forged order |
| The signed route | Dialogue and evidence filing | Save PATCH, recover the R-17/02:14 receipt and close this lead |

The story describes what each encounter resolves; the eleven chapter obstacles use the existing quiz-combat rules rather than claiming eleven new puzzle implementations. The maze retains its three control modes. Named enemies use the placeholder robot archetype; the Warden uses the boss lighting. Optional dialogue questions explain the evidence and ECHO-7's possible motives. They change conversation paths, not combat statistics or the ending.

## Completion and recovery

Victory offers **Follow the lead** to open the next scene. The Warden offers **Recover evidence**, followed by an ending conversation and **File the routing evidence**. Filing claims the existing branch reward once and returns to the office quest screen. Defeating the Warden also reveals the receipt on the quest graph. ECHO-7 remains locked until the other clue branches are complete.

Dialogue acknowledgments, completed encounters, mastery and rewards persist in the journal. Leaving before confirming a scene does not mark it read. Returning to the branch resumes the unfinished encounter; confirmed introductions do not repeat on retry. A pending ending can be recovered from **Pursue lead** after a reload. Defeat offers a healed retry or a return to the network, preserving evidence. Replays cannot award first-clear XP or supplies twice.

## Authoring and QA

Runtime dialogue is Markdown in `content/09-routing-story.md`. `scripts/write-routing-story.ts` regenerates that file explicitly. Ordinary content refreshes preserve it. A dialogue's optional `trigger` binds it to an activity and `before`/`after`; `enemyName` supplies its narrative encounter name. `continue` acknowledges the scene; `close` leaves it pending. The compiler validates trigger references and rejects duplicate bindings. Saves validate acknowledged dialogue IDs.

`tests/routing-story.test.ts` plays the entire model sequence from a fresh character, including actual maze traversal, all battles, mastery, leveling, ending, reloads and reward deduplication. It also checks defeat/retry and invalid story references. `scripts/create-routing-fixtures.ts` creates disposable checkpoints under ignored `test-results/` for additional QA; it does not modify browser saves.
