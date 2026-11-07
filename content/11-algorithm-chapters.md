# Algorithms: chapter quests

```entity
type: quest
kind: chapter
id: chapter-source-alg-00
title: Introduction to Python Programming
branch: routing-trace
lesson: source-alg-00
objectives: [encounter-source-alg-00]
prerequisites: []
xp: 0
rewards: []
description: Trace variables, conditions and loops in a short Python program.
learning:
  goal: Predict how a loop changes a variable.
  concept: >-
    Assignment stores a value under a name; a later assignment replaces it.
    A for loop visits each item in its sequence, and an indented if block runs
    only when its condition is true. Trace the variable after each iteration
    rather than trying to guess the final result.
  example: |-
    ```python
    total = 0
    for x in [2, 5, 1]:
        if x > 2:
            total += x
    ```

    Start with `total = 0`. For each `x` in `[2, 5, 1]`, add `x` only if `x > 2`.

    | x | Condition | total afterward |
    | --- | --- | --- |
    | 2 | false | 0 |
    | 5 | true | 5 |
    | 1 | false | 5 |

    The result is **5**. Only the iteration with `x = 5` changes `total`.
  practice:
    prompt: >-
      Start total at 0. Visit [3, 1, 4], adding x only when x >= 3. What is total afterward?
    options: ['8', '7', '4', '3']
    answer: 1
    explanation: >-
      3 passes the condition and makes total 3. 1 is skipped. 4 passes and makes total 7. The comparison includes values equal to 3.
```

```entity
type: quest
kind: chapter
id: chapter-source-alg-01
title: Introduction to Algorithms
branch: routing-trace
lesson: source-alg-01
objectives: [encounter-source-alg-01]
prerequisites: [chapter-source-alg-00]
xp: 0
rewards: []
description: Follow precise steps from an input to a definite output.
learning:
  goal: Trace a finite algorithm and identify its output.
  concept: >-
    An algorithm specifies precise steps for solving a problem, independently
    of the programming language used to implement it. It may accept inputs,
    changes a working state and produces an output. Its steps must be
    unambiguous and finish after a finite amount of work.
  example: |-
    Find the largest value in `[4, 9, 2]`:

    1. Store the first value: `largest = 4`.
    2. Compare 9 with 4; replace `largest` with 9.
    3. Compare 2 with 9; keep 9.
    4. No values remain, so return **9**.

    The algorithm examines each value once. The stopping rule makes it finite.
  practice:
    prompt: >-
      Use the same maximum-finding steps on [8, 3, 11, 6]. What value is stored after comparing 3 and 11, before examining 6?
    options: ['3', '8', '6', '11']
    answer: 3
    explanation: >-
      Start at 8. Comparing 3 leaves 8 unchanged; comparing 11 replaces it with 11. Each step retains the largest value examined so far.
```

```entity
type: quest
kind: chapter
id: chapter-source-alg-02
title: Basic Sorting Algorithms
branch: routing-trace
lesson: source-alg-02
objectives: [encounter-source-alg-02]
prerequisites: [chapter-source-alg-01]
xp: 0
rewards: []
description: Trace how comparisons and movements build a sorted sequence.
learning:
  goal: Identify what moves during a sorting step.
  concept: >-
    Bubble sort compares adjacent values and swaps those in the wrong order;
    an ascending pass carries the largest remaining value to the end.
    Selection sort finds the smallest remaining value and swaps it into place.
    Insertion sort maintains a sorted prefix, shifting larger values right
    before placing the next value into the resulting gap.
  example: |-
    One ascending bubble-sort pass on `[7, 2, 5]`:

    - Compare 7 and 2: swap to get `[2, 7, 5]`.
    - Compare 7 and 5: swap to get `[2, 5, 7]`.

    After **two comparisons and two swaps**, 7 is in its final position. A pass is
    a sequence of comparisons, not just the first swap.
  practice:
    prompt: >-
      Insertion sort has the sorted prefix [2, 6, 9] and must insert 4. How many existing values shift right?
    options: ['2', '1', '3', '0']
    answer: 0
    explanation: >-
      9 and 6 are larger than 4, so both shift one place right. 2 stays in place. Inserting 4 into the gap produces [2, 4, 6, 9].
```

```entity
type: quest
kind: chapter
id: chapter-source-alg-03
title: Binary Search, Linear Search, and Big O Notation
branch: routing-trace
lesson: source-alg-03
objectives: [encounter-source-alg-03]
prerequisites: [chapter-source-alg-02]
xp: 0
rewards: []
description: Trace the candidates retained by linear and binary search.
learning:
  goal: Choose the remaining search range after a comparison.
  concept: >-
    Linear search checks values one at a time and works on unsorted data.
    Binary search requires sorted data: comparing with the midpoint tells it
    which half cannot contain the target. With inclusive index bounds, use
    `mid = (left + right) // 2`; update a bound past mid after an unequal
    comparison. Worst-case work grows as O(n) for linear search and O(log n)
    for binary search.
  example: |-
    Search for 10 in `[2, 4, 6, 8, 10]`, using the lower midpoint:

    | Bounds | Value checked | Next action |
    | --- | --- | --- |
    | 0..4 | 6 at index 2 | Keep indexes 3..4 |
    | 3..4 | 8 at index 3 | Keep index 4 |
    | 4..4 | 10 at index 4 | Found |

    The checked values are **6, 8, 10**. Discarded ranges cannot contain 10
    because the array is sorted.
  practice:
    prompt: >-
      Binary search looks for 18 in [3, 6, 9, 12, 15, 18, 21], using the lower midpoint. Which values does it check?
    options: ['3, 6, 9, 12, 15, 18', '12, 15, 18', '12, 18', '9, 18']
    answer: 2
    explanation: >-
      The first midpoint is index 3, containing 12. Since 18 is larger, retain indexes 4..6. Their midpoint is index 5, containing 18, so the search finishes after two checks.
```

```entity
type: quest
kind: chapter
id: chapter-source-alg-04
title: Recursion and Call Stack
branch: routing-trace
lesson: source-alg-04
objectives: [encounter-source-alg-04]
prerequisites: [chapter-source-alg-03]
xp: 0
rewards: []
description: Follow recursive calls down to a base case and back through their returns.
learning:
  goal: Trace pending work on the call stack.
  concept: >-
    A recursive function solves a smaller instance by calling itself.
    A reachable base case stops further calls, and each recursive step must
    make progress toward it. Each waiting call keeps its own local state on
    the call stack; the most recent call returns first, allowing earlier calls
    to finish their pending work.
  example: |-
    Define `sum_down(0) = 0` and `sum_down(n) = n + sum_down(n - 1)` for positive integers.

    Calling `sum_down(3)` creates calls for 3, 2, 1, then 0. The returns unwind:

    - `sum_down(0)` returns 0.
    - `sum_down(1)` returns `1 + 0 = 1`.
    - `sum_down(2)` returns `2 + 1 = 3`.
    - `sum_down(3)` returns `3 + 3 = 6`.

    The answer is **6**; the call for 3 cannot finish before the smaller calls return.
  practice:
    prompt: >-
      Using the same definition, sum_down(4) waits for sum_down(3). Once that smaller call returns 6, what does the waiting call return?
    options: ['6', '10', '4', '24']
    answer: 1
    explanation: >-
      The waiting call still has the pending addition 4 + sum_down(3). Substituting the returned value gives 4 + 6 = 10. This is a sum, not factorial multiplication.
```

```entity
type: quest
kind: chapter
id: chapter-source-alg-05
title: Time Complexity Analysis
branch: routing-trace
lesson: source-alg-05
objectives: [encounter-source-alg-05]
prerequisites: [chapter-source-alg-04]
xp: 0
rewards: []
description: Count repeated work and compare how it grows with the input size.
learning:
  goal: Distinguish fixed repetition from input-dependent repetition.
  concept: >-
    Time complexity describes how an operation count grows with input size n,
    rather than predicting an exact number of seconds. Sequential work adds;
    nested repetition multiplies the relevant iteration counts. Constant
    factors do not change a Big O growth class, but a second loop whose length
    also grows with n can change the class.
  example: |-
    A scanner visits each of n records and checks exactly three fields per record.

    With 5 records it performs `5 × 3 = 15` field checks. With 10 records it
    performs `10 × 3 = 30` checks. The count is **3n**, so the growth is **O(n)**.
    A nested loop is not automatically quadratic: the inner bound here is fixed.
  practice:
    prompt: >-
      A different scanner compares every one of n records with all n records, making exactly n × n comparisons. What happens to that count when n doubles?
    options: ['It stays unchanged', 'It doubles', 'It grows by exactly 2 comparisons', 'It quadruples']
    answer: 3
    explanation: >-
      Replacing n with 2n gives (2n) × (2n) = 4n². Both loop lengths double, so their product is four times as large.
```

```entity
type: quest
kind: chapter
id: chapter-source-alg-06
title: 'Graph Searching: BFS, DFS & Routing and Coverage'
branch: routing-trace
lesson: source-alg-06
objectives: [encounter-source-alg-06]
prerequisites: [chapter-source-alg-05]
xp: 0
rewards: []
description: Trace a graph frontier and distinguish reaching a target from covering vertices.
learning:
  goal: Predict how a BFS queue changes as vertices are processed.
  concept: >-
    A graph represents locations as vertices and direct connections as edges.
    BFS uses a FIFO queue to process vertices in distance layers, finding a
    fewest-edge route when edges have equal cost. DFS follows a branch deeply
    using a stack or recursion and need not find a shortest route. Mark visited
    vertices to avoid repeated work; reaching one target is different from
    visiting every required location.
  example: |-
    An undirected graph has edges `S-A`, `A-C`, `C-D`, `D-G`, `S-B`, and `B-G`.

    BFS from S discovers A and B at distance 1, then C and G at distance 2.
    It can return **S → B → G**, using two edges. DFS choosing A before B can
    first reach G through **S → A → C → D → G**, using four edges.

    Finding G does not mean all vertices have been visited.
  practice:
    prompt: >-
      A directed graph has A→B, A→C and B→D. BFS marks vertices when enqueuing them. After processing A the queue is [B, C]. What is the queue immediately after processing B?
    options: ['[C, D]', '[D, C]', '[B, C, D]', '[D]']
    answer: 0
    explanation: >-
      Processing B removes it from the front, leaving C. Its unseen neighbor D is marked and added at the back. FIFO order therefore gives [C, D], not [D, C].
```

```entity
type: quest
kind: chapter
id: chapter-source-alg-07
title: Greedy Algorithm and Optimization
branch: routing-trace
lesson: source-alg-07
objectives: [encounter-source-alg-07]
prerequisites: [chapter-source-alg-06]
xp: 0
rewards: []
description: Compare a locally attractive move with total route cost.
learning:
  goal: Apply Dijkstra's choice of the smallest tentative total distance.
  concept: >-
    A greedy algorithm commits to a locally preferred choice, which needs a
    problem-specific justification to guarantee a global optimum. Dijkstra's
    algorithm, for nonnegative edge costs, settles the unsettled vertex with
    the smallest tentative total distance from the start, not simply the
    cheapest outgoing edge. A* also considers an estimate of the remaining
    cost; its shortest-path guarantees depend on suitable heuristic and
    search conditions.
  example: |-
    Routes have edges `S-A: 2`, `A-G: 7`, `S-B: 5`, and `B-G: 1`.

    Taking the cheapest first edge leads to A, but `S → A → G` costs **9**.
    Dijkstra settles A at cost 2 and tentatively records G at 9. It then settles
    B at cost 5 and improves G to `5 + 1 = 6`.

    The cheapest complete route is **S → B → G**, with total cost **6**.
  practice:
    prompt: >-
      Dijkstra has three unsettled vertices with tentative distances from S: A=4, B=2 and G=7. Which vertex must it settle next?
    options: ['G, because it is the target', 'A, because it is first alphabetically', 'All three at once', 'B, because 2 is the smallest tentative total']
    answer: 3
    explanation: >-
      Dijkstra selects the smallest unsettled total distance, which is B at 2. It does not stop merely because the target has been discovered; that tentative target distance may still improve.
```

```entity
type: quest
kind: chapter
id: chapter-source-alg-08
title: Dynamic Programming (DP)
branch: routing-trace
lesson: source-alg-08
objectives: [encounter-source-alg-08]
prerequisites: [chapter-source-alg-07]
xp: 0
rewards: []
description: Build and reuse solutions to overlapping subproblems.
learning:
  goal: Compute a new table entry from already solved smaller entries.
  concept: >-
    Dynamic programming stores subproblem answers so overlapping work is not
    repeated. Memoization fills a cache when recursive calls request answers;
    tabulation builds a table in a dependency order. Define the state,
    recurrence and base cases before filling either structure. For optimization
    problems, the recurrence must correctly combine optimal smaller solutions.
  example: |-
    Fibonacci has base cases `F(0)=0`, `F(1)=1` and recurrence
    `F(n)=F(n-1)+F(n-2)`.

    | n | 0 | 1 | 2 | 3 | 4 | 5 |
    | --- | --- | --- | --- | --- | --- | --- |
    | F(n) | 0 | 1 | 1 | 2 | 3 | 5 |

    To extend the table, calculate `F(6)=5+3=8`. Each entry is calculated once,
    using answers already stored rather than rebuilding their recursive call trees.
  practice:
    prompt: >-
      The Fibonacci cache already contains F(5)=5 and F(6)=8. What value should be stored for F(7)?
    options: ['40', '8', '13', '7']
    answer: 2
    explanation: >-
      The recurrence combines the two preceding answers: F(7)=F(6)+F(5)=8+5=13. Retrieving the cached values avoids recomputing the subproblems that produced 8 and 5.
```

```entity
type: quest
kind: chapter
id: chapter-source-alg-09
title: Inventory and Uncertainty Management
branch: routing-trace
lesson: source-alg-09
objectives: [encounter-source-alg-09]
prerequisites: [chapter-source-alg-08]
xp: 0
rewards: []
description: Compare stocking decisions across possible demand outcomes.
learning:
  goal: Calculate an expected cost from probabilities and consequences.
  concept: >-
    Inventory decisions balance the cost of leftovers against the cost of
    unmet demand. When demand is uncertain, calculate each possible outcome's
    cost, multiply it by that outcome's probability and add the weighted costs.
    Expected cost is an average under the stated assumptions, not a promise
    about tomorrow. If stock carries into later days, decisions can be linked
    through a state such as day and remaining stock.
  example: |-
    Demand is 1 unit with probability 0.25 or 3 units with probability 0.75.
    Each leftover unit costs 1; each unmet unit costs 4.

    - Stock 2: demand 1 costs 1; demand 3 costs 4. Expected cost is
      `0.25 × 1 + 0.75 × 4 = 3.25`.
    - Stock 3: demand 1 costs 2; demand 3 costs 0. Expected cost is
      `0.25 × 2 + 0.75 × 0 = 0.5`.

    Of these two choices, **stock 3** has the lower expected cost.
  practice:
    prompt: >-
      Demand is 2 or 4 units, each with probability 0.5. You stock 3. A leftover unit costs 2 and an unmet unit costs 6. What is the expected cost?
    options: ['4', '8', '3', '6']
    answer: 0
    explanation: >-
      Demand 2 leaves one unit, costing 2. Demand 4 leaves one unmet unit, costing 6. Weight both outcomes: 0.5×2 + 0.5×6 = 4. Adding the unweighted costs would incorrectly give 8.
```

```entity
type: quest
kind: chapter
id: chapter-source-alg-10
title: Sequential Decisions Over Time
branch: routing-trace
lesson: source-alg-10
objectives: [encounter-source-alg-10]
prerequisites: [chapter-source-alg-09]
xp: 0
rewards: []
description: Choose actions using their immediate and future consequences.
learning:
  goal: Compare whole plans under a limited resource budget.
  concept: >-
    A sequential decision changes the state that later decisions inherit.
    With limited passes, a useful state is the day and number of passes left.
    Compare each action's immediate reward plus the best reward obtainable
    afterward; the largest reward today need not give the largest total.
    If later outcomes are uncertain, account for their probabilities when
    evaluating future value.
  example: |-
    You have one pass and two days, worth 3 and 8 points respectively.

    - Use the pass today: gain 3, then have no pass tomorrow. Total **3**.
    - Skip today: retain the pass and use it tomorrow. Total **8**.

    Skipping is better because it preserves a more valuable future option.
    Once no days remain, the remaining future reward is 0: that is the base case.
  practice:
    prompt: >-
      You have two passes for three days worth [4, 9, 5] points. A pass can be used at most once per day. What is the maximum total reward?
    options: ['13', '9', '18', '14']
    answer: 3
    explanation: >-
      Skip the first day, then use the two passes for 9 and 5 points: 14. Taking the first two days gives only 13. Taking all three days would require three passes, so 18 is infeasible.
```
