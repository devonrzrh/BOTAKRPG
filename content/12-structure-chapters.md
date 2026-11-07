# Data structures: chapter quests

```entity
type: quest
kind: chapter
id: chapter-source-ds-01
title: Introduction to Data Structures
branch: access-records
lesson: source-ds-01
objectives: [encounter-source-ds-01]
prerequisites: []
xp: 0
rewards: []
description: Choose a structure from the operations the archive needs.
learning:
  goal: Match storage and access rules to the operation being performed.
  concept: A data structure organizes both values and their relationships. Its access rules determine which operations are convenient and how their cost grows. Choose it from the work the program must do, rather than from the data's names.
  example: |
    FOLIO must read the fourth entry in `[14, 21, 35, 48]` repeatedly.

    - An array reads index `3` directly and obtains `48`.
    - A singly linked list follows the first three links to reach the fourth node.

    Array indexing is `O(1)`; reaching an arbitrary list position is `O(n)`. This comparison concerns positional access, not every possible operation.
  practice:
    prompt: The archive must reverse its most recent edit before older edits. Which access rule fits this requirement?
    options: [A stack that removes the most recent edit first, A FIFO queue that removes the oldest edit first, A graph that removes an arbitrary adjacent edit, A sorted array that always removes the smallest edit ID]
    answer: 0
    explanation: Undo needs last-in, first-out access. A stack exposes the newest edit first; arrival order, adjacency and numeric ID do not describe the required reversal order.
```

```entity
type: quest
kind: chapter
id: chapter-source-ds-02
title: Linear Data Structures
branch: access-records
lesson: source-ds-02
objectives: [encounter-source-ds-02]
prerequisites: [chapter-source-ds-01]
xp: 0
rewards: []
description: Recover a logical sequence without assuming adjacent memory locations.
learning:
  goal: Distinguish sequential relationships from physical storage order.
  concept: A linear structure arranges its elements in one logical sequence. Arrays can keep entries in adjacent storage, while linked-list nodes follow links between separate locations. A circular implementation can still have a logical first item and a defined traversal order.
  example: |
    The head points to record `A` at address `90`. Its link points to `B` at address `12`, and B's link points to `C` at address `65`.

    Following the links visits `A → B → C`, even though the address numbers are not increasing. The relationships define the sequence; the physical addresses do not.
  practice:
    prompt: A non-circular sequence starts at C. C links to A, A links to B, and B links to nothing. What is the traversal order from the head?
    options: [A → B → C, B → A → C, C → A → B, C → B → A]
    answer: 2
    explanation: Start at the stated head C, follow its link to A, then follow A's link to B. Alphabetical order and physical placement do not change these links.
```

```entity
type: quest
kind: chapter
id: chapter-source-ds-03
title: Arrays
branch: access-records
lesson: source-ds-03
objectives: [encounter-source-ds-03]
prerequisites: [chapter-source-ds-02]
xp: 0
rewards: []
description: Trace array positions when an insertion or deletion shifts records.
learning:
  goal: Update an array while preserving the order of its remaining entries.
  concept: An array identifies each entry by an index, usually starting at zero. Reading or replacing an entry by index takes constant time in the array model. Inserting or deleting in the middle generally shifts later entries; an index is a position, not a permanent record identity.
  example: |
    Insert `22` at zero-based index `2` in `[12, 18, 27, 31]`, assuming room for another entry.

    Move `31` right, then move `27` right, and place `22` in the gap. The result is `[12, 18, 22, 27, 31]`.

    Moving from the end avoids overwriting a value before it has been copied.
  practice:
    prompt: Delete the entry at zero-based index 1 from [5, 9, 14, 20], preserving the other entries' order. What remains?
    options: ['[9, 14, 20]', '[5, 9, 20]', '[5, 14, 20]', '[5, 20, 14]']
    answer: 2
    explanation: Index 1 contains 9. Removing it shifts 14 and 20 one position left, leaving [5, 14, 20]. Deletion does not sort or reverse the surviving entries.
```

```entity
type: quest
kind: chapter
id: chapter-source-ds-04
title: Linked Lists
branch: access-records
lesson: source-ds-04
objectives: [encounter-source-ds-04]
prerequisites: [chapter-source-ds-03]
xp: 0
rewards: []
description: Change links without losing the rest of a record chain.
learning:
  goal: Insert and unlink nodes by preserving the required next-node references.
  concept: A singly linked-list node stores a value and a link to the next node. Traversal follows links from the head, so finding an arbitrary position can take linear time. Once the relevant predecessor is known, inserting or unlinking a node changes a small number of links.
  example: |
    Start with `M → R → None`. Insert a new node `Q` after M.

    1. Set `Q.next = M.next`, so Q points to R.
    2. Set `M.next = Q`.

    The chain becomes `M → Q → R → None`. Saving the old next link first keeps R reachable.
  practice:
    prompt: The chain is A → B → C → None. You already hold A's node and want to unlink B while keeping C reachable. Which link assignment is needed?
    options: [Set A.next to C, Set A.next to None, Set C.next to A, Set B.next to A]
    answer: 0
    explanation: Making A point directly to C skips B while preserving the remaining chain. Clearing A's link would also lose access to C from the head; the other assignments create incorrect links.
```

```entity
type: quest
kind: chapter
id: chapter-source-ds-05
title: Stacks
branch: access-records
lesson: source-ds-05
objectives: [encounter-source-ds-05]
prerequisites: [chapter-source-ds-04]
xp: 0
rewards: []
description: Follow the top of a stack while reversing archive operations.
learning:
  goal: Distinguish push, pop and peek in a last-in, first-out trace.
  concept: A stack adds and removes entries at the same end, called the top. Push adds an entry; pop removes and returns it; peek reads it without removal. Undo and nested function calls use this last-in, first-out order.
  example: |
    Write stacks from bottom to top, with the top at the right.

    `[] → push(A) → [A] → push(B) → [A, B] → pop() → [A] → push(C) → [A, C]`.

    The pop returned B. Peeking now returns C and leaves `[A, C]` unchanged.
  practice:
    prompt: An empty stack receives push(edit1), push(edit2), pop(), push(edit3), pop(). Which edit is now on top?
    options: [edit2, edit3, The stack is empty, edit1]
    answer: 3
    explanation: The first pop removes edit2. After edit3 is pushed, the second pop removes edit3. edit1 was never removed, so it is the remaining top entry.
```

```entity
type: quest
kind: chapter
id: chapter-source-ds-06
title: Queues
branch: access-records
lesson: source-ds-06
objectives: [encounter-source-ds-06]
prerequisites: [chapter-source-ds-05]
xp: 0
rewards: []
description: Preserve arrival order while processing waiting audit jobs.
learning:
  goal: Trace enqueue and dequeue under the FIFO rule.
  concept: A FIFO queue adds new entries at the rear and removes entries from the front. Peek reads the front without removing it. A priority queue follows a different removal rule, so a FIFO audit queue must not silently reorder jobs by urgency or identifier.
  example: |
    Write the front at the left. Enqueue R1, then R2: `[R1, R2]`.

    Dequeue returns R1 and leaves `[R2]`. Enqueue R3 produces `[R2, R3]`, so R2 remains next even if R3 is more urgent.
  practice:
    prompt: A FIFO queue receives enqueue(D), enqueue(E), dequeue(), enqueue(F), enqueue(G), dequeue(). Who is now at the front?
    options: [D, E, F, G]
    answer: 2
    explanation: The first dequeue removes D. After F and G arrive, the queue is [E, F, G]. The second dequeue removes E, leaving F at the front of [F, G].
```

```entity
type: quest
kind: chapter
id: chapter-source-ds-07
title: Nonlinear Data Structures
branch: access-records
lesson: source-ds-07
objectives: [encounter-source-ds-07]
prerequisites: [chapter-source-ds-06]
xp: 0
rewards: []
description: Keep branching and network relationships instead of flattening them away.
learning:
  goal: Choose a hierarchy or network representation from the relationships present.
  concept: A nonlinear structure represents relationships beyond a single sequence. A tree models a hierarchy, with one root-to-node path in a rooted tree. A graph can represent more general connections, including cycles and multiple routes between vertices.
  example: |
    Gateway contains Archive and Relay; Relay contains Cache.

    This folder hierarchy is a tree. The path to Cache is `Gateway → Relay → Cache`. A flat list of the four names would not say which folder contains Cache.
  practice:
    prompt: 'Relays P, Q and R connect in a ring: P–Q, Q–R and R–P. Which representation preserves these three connections without pretending they form a folder hierarchy?'
    options: [A FIFO queue, A graph with three vertices and three edges, A stack with P on top, A rooted tree containing all three ring edges]
    answer: 1
    explanation: The three connections form a cycle, which a graph can represent directly. A tree cannot retain that cycle, and a stack or queue records a sequence rather than these connections.
```

```entity
type: quest
kind: chapter
id: chapter-source-ds-08
title: Trees
branch: access-records
lesson: source-ds-08
objectives: [encounter-source-ds-08]
prerequisites: [chapter-source-ds-07]
xp: 0
rewards: []
description: Follow binary-search-tree ordering through an entire subtree.
learning:
  goal: Find an insertion position that preserves every ancestor's BST ordering rule.
  concept: A binary search tree places smaller keys in a node's left subtree and larger keys in its right subtree. The rule applies to all descendants, not only immediate children. Searching follows comparisons from the root, while a balanced shape keeps the number of visited nodes small.
  example: |
    A BST has root `12`, left child `5` and right child `18`; node 5 has right child `9`.

    To insert `7`, compare with 12 and go left, compare with 5 and go right, then compare with 9 and go left. The empty link becomes `9.left = 7`.

    The placement satisfies `5 < 7 < 9 < 12`.
  practice:
    prompt: A BST has root 20, left child 8 and right child 30. Node 8 has right child 15. Keys are unique. Where does inserting 12 place it?
    options: [Right child of 30, Left child of 8, Right child of 20, Left child of 15]
    answer: 3
    explanation: 12 is less than 20, greater than 8 and less than 15. The search path therefore goes left, right, left, placing 12 at the empty left link of 15.
```

```entity
type: quest
kind: chapter
id: chapter-source-ds-09
title: Graphs
branch: access-records
lesson: source-ds-09
objectives: [encounter-source-ds-09]
prerequisites: [chapter-source-ds-08]
xp: 0
rewards: []
description: Separate a direct edge from reachability through several relays.
learning:
  goal: Read adjacency information and count the edges in a route.
  concept: A graph stores vertices and the edges between them. An adjacency list names direct neighbors, not every vertex that can eventually be reached. Directed edges can be followed only in their stated direction; traversal needs a visited set to avoid repeatedly processing cycles.
  example: |
    Directed edges are `A → B`, `A → C` and `C → D`.

    A's adjacency list is `[B, C]`. D is reachable from A by `A → C → D`, a route of two edges, but D is not a direct neighbor of A. No stated edge lets D return to A.
  practice:
    prompt: A directed graph has adjacency lists P:[Q,R], Q:[S], R:[], S:[]. How many edges are on a shortest route from P to S?
    options: ['1', '2', '3', 'S is unreachable']
    answer: 1
    explanation: The route P → Q → S uses two edges. P has no direct edge to S, and the branch through R ends without reaching S.
```

```entity
type: quest
kind: chapter
id: chapter-source-ds-10
title: Data Versioning
branch: access-records
lesson: source-ds-10
objectives: [encounter-source-ds-10]
prerequisites: [chapter-source-ds-09]
xp: 0
rewards: []
description: Explain what changed rather than treating a checksum as the whole history.
learning:
  goal: Distinguish a content revision, a format conversion and a copied file.
  concept: A revision identifies a changed dataset instance, and provenance records where it came from and why it changed. The same records can be represented in different formats or copied to another location. A checksum detects byte differences; it does not by itself establish authorship, truth or the meaning of a change.
  example: |
    Revision r1 stores marks `[60, 80]`, with mean `70`. A checked correction changes 80 to 90, so r2 stores `[60, 90]`, has parent r1 and has mean `75`.

    Keeping both revisions explains why two reports disagree. Exporting r2 as CSV and JSON creates two representations of the same corrected records, not another mark correction.
  practice:
    prompt: The same checked records are exported as CSV and JSON. Their checksums differ. What does that fact alone establish?
    options: [One file must contain false records, A new student mark must have been added, The byte sequences differ but the represented records may still be equivalent, The files must have different authors]
    answer: 2
    explanation: Different formats normally use different bytes and therefore different checksums. To establish a content change or authorship, inspect the records and provenance rather than inferring them from the checksum alone.
```
