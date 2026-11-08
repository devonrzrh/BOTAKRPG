# Curriculum encounters

```entity
type: question
id: source-alg-00-checkpoint
title: Checkpoint
lesson: source-alg-00
format: choice
prompt: What does range(3) produce in a Python for loop?
options:
  - 0, 1, 2
  - 1, 2, 3
  - 0, 1, 2, 3
  - Only 3
answer:
  - 0
explanation: range stops before its upper bound, so range(3) yields three
  integers starting at zero.
```

```entity
type: question
id: source-alg-01-checkpoint
title: Checkpoint
lesson: source-alg-01
format: choice
prompt: What distinguishes an algorithm from its implementation?
options:
  - An algorithm must use Python
  - An algorithm never terminates
  - Every program is a different algorithm
  - An algorithm is a precise method; a program implements it
answer:
  - 3
explanation: The same sequence of problem-solving steps can be implemented in
  many programming languages.
```

```entity
type: question
id: source-alg-02-checkpoint
title: Checkpoint
lesson: source-alg-02
format: choice
prompt: Which sorting algorithm inserts each new element into a sorted prefix?
options:
  - Binary search
  - Breadth-first search
  - Insertion sort
  - Selection sort
answer:
  - 2
explanation: Insertion sort shifts larger prefix elements right and places the
  new element in the gap.
```

```entity
type: question
id: source-alg-03-checkpoint
title: Checkpoint
lesson: source-alg-03
format: choice
prompt: What must hold before binary search can discard half the candidates?
options:
  - The target is present
  - The sequence is sorted
  - All values are positive
  - The length is even
answer:
  - 1
explanation: Sorted order lets comparison with the midpoint rule out an entire
  half, even when the target is absent.
```

```entity
type: question
id: source-alg-04-checkpoint
title: Checkpoint
lesson: source-alg-04
format: choice
prompt: What stops a recursive function from continually calling itself?
options:
  - A reachable base case
  - An extra loop
  - A larger call stack
  - A global variable alone
answer:
  - 0
explanation: A base case terminates recursion, and recursive calls must make
  progress toward it.
```

```entity
type: question
id: source-alg-05-checkpoint
title: Checkpoint
lesson: source-alg-05
format: choice
prompt: A pair of nested loops each visits all n elements. How does the work grow?
options:
  - O(1)
  - O(log n)
  - O(n)
  - O(n²)
answer:
  - 3
explanation: Each of n outer iterations performs n inner iterations, giving n ×
  n operations.
```

```entity
type: question
id: source-alg-06-checkpoint
title: Checkpoint
lesson: source-alg-06
format: choice
prompt: Which frontier rule gives BFS its shortest-path guarantee on an
  unweighted graph?
options:
  - Always take the largest edge
  - Revisit every vertex indefinitely
  - Process the oldest discovered vertex first
  - Process the newest vertex first
answer:
  - 2
explanation: A FIFO queue processes vertices in nondecreasing distance from the start.
```

```entity
type: question
id: source-alg-07-checkpoint
title: Checkpoint
lesson: source-alg-07
format: choice
prompt: Greedy change for 6 with coins 1, 3, 4 uses 4+1+1. What does this demonstrate?
options:
  - No solution exists
  - A locally best choice can miss the global optimum
  - Greedy always gives optimal change
  - Three coins are optimal
answer:
  - 1
explanation: The optimum is 3+3, only two coins. Greedy needs a proof of its
  choice property for the problem.
```

```entity
type: question
id: source-alg-08-checkpoint
title: Checkpoint
lesson: source-alg-08
format: choice
prompt: Why does dynamic programming store subproblem results?
options:
  - To avoid recomputing overlapping subproblems
  - To make every choice random
  - To discard the recurrence
  - To prevent all memory use
answer:
  - 0
explanation: Memoization or tabulation reuses solutions to overlapping
  subproblems when building an optimal solution.
```

```entity
type: question
id: source-alg-09-checkpoint
title: Checkpoint
lesson: source-alg-09
format: choice
prompt: What does expected cost combine under uncertain demand?
options:
  - Only the cheapest possible outcome
  - Only the most likely demand
  - The sum of costs without probabilities
  - Each possible cost weighted by its probability
answer:
  - 3
explanation: Expected cost is the sum of probability × cost over the possible outcomes.
```

```entity
type: question
id: source-alg-10-checkpoint
title: Checkpoint
lesson: source-alg-10
format: choice
prompt: Why can the cheapest immediate action be a poor sequential decision?
options:
  - Immediate cost is always the total cost
  - Probabilities cannot be used
  - It changes the state and costs of future decisions
  - Future states never depend on actions
answer:
  - 2
explanation: A sequential policy accounts for both the immediate cost and the
  value of the resulting future state.
```

```entity
type: question
id: source-ds-01-checkpoint
title: Checkpoint
lesson: source-ds-01
format: choice
prompt: Why does choosing a data structure matter?
options:
  - It removes the need for algorithms
  - It affects how efficiently required operations can be performed
  - Every structure has identical costs
  - It changes Python syntax
answer:
  - 1
explanation: Representation determines the operations available and their time
  and space costs.
```

```entity
type: question
id: source-ds-02-checkpoint
title: Checkpoint
lesson: source-ds-02
format: choice
prompt: What makes a data structure linear?
options:
  - Its elements have a sequential arrangement
  - All its operations take constant time
  - It cannot grow
  - Every element has many children
answer:
  - 0
explanation: Arrays, linked lists, stacks and queues organize data in a
  sequence, with different access rules.
```

```entity
type: question
id: source-ds-03-checkpoint
title: Checkpoint
lesson: source-ds-03
format: choice
prompt: In a packed array, inserting at the front usually requires what?
options:
  - Changing only a head pointer
  - No element movement
  - Sorting first
  - Shifting existing elements to make room
answer:
  - 3
explanation: Maintaining consecutive positions requires moving later elements
  one position right.
```

```entity
type: question
id: source-ds-04-checkpoint
title: Checkpoint
lesson: source-ds-04
format: choice
prompt: What does a singly linked-list node contain?
options:
  - All other nodes
  - Only the last value
  - A value and a link to the next node
  - Only an array index
answer:
  - 2
explanation: Links connect separately stored nodes; reaching a position
  generally requires following preceding links.
```

```entity
type: question
id: source-ds-05-checkpoint
title: Checkpoint
lesson: source-ds-05
format: choice
prompt: After push(A), push(B), pop(), which stack element remains?
options:
  - Neither
  - A
  - B
  - Both A and B
answer:
  - 1
explanation: A stack is last in, first out. B is removed first.
```

```entity
type: question
id: source-ds-06-checkpoint
title: Checkpoint
lesson: source-ds-06
format: choice
prompt: Which queue item is removed first under FIFO?
options:
  - The earliest item still waiting
  - The most recent item
  - The largest item
  - An arbitrary item
answer:
  - 0
explanation: First in, first out preserves arrival order.
```

```entity
type: question
id: source-ds-07-checkpoint
title: Checkpoint
lesson: source-ds-07
format: choice
prompt: Which relationship is naturally represented by a nonlinear structure?
options:
  - A single FIFO waiting line
  - A plain sequence of scores
  - A single undo stack
  - A folder hierarchy with branching subfolders
answer:
  - 3
explanation: Trees and graphs express branching or network relationships beyond
  one sequence.
```

```entity
type: question
id: source-ds-08-checkpoint
title: Checkpoint
lesson: source-ds-08
format: choice
prompt: Which traversal returns sorted keys from a binary search tree?
options:
  - Level order
  - Any traversal always does
  - "Inorder: left, node, right"
  - "Preorder: node, left, right"
answer:
  - 2
explanation: The BST ordering property puts smaller keys left and larger keys
  right, so inorder visits keys in sorted order.
```

```entity
type: question
id: source-ds-09-checkpoint
title: Checkpoint
lesson: source-ds-09
format: choice
prompt: What does an adjacency list store for each graph vertex?
options:
  - Only its numeric index
  - Its directly connected neighbors
  - Every reachable vertex only
  - Only the shortest route
answer:
  - 1
explanation: An adjacency list records direct edges; reachability and routes are
  computed by traversal algorithms.
```

```entity
type: question
id: source-ds-10-checkpoint
title: Checkpoint
lesson: source-ds-10
format: choice
prompt: Why record a revision's parent and checksum?
options:
  - To trace its lineage and detect content changes
  - To guarantee the data is correct
  - To erase earlier revisions
  - To eliminate storage
answer:
  - 0
explanation: Parent references describe history; a checksum helps check content
  identity or integrity, not factual correctness.
```

```entity
type: question
id: source-ai-01-checkpoint
title: Checkpoint
lesson: source-ai-01
format: choice
prompt: How does a connectionist model usually learn?
options:
  - By storing only handwritten rules
  - By ignoring observations
  - By adding a neuron for each answer
  - By adjusting connection weights from examples
answer:
  - 3
explanation: Connectionist systems learn distributed representations through
  networks of weighted connections.
```

```entity
type: question
id: source-ai-02-checkpoint
title: Checkpoint
lesson: source-ai-02
format: choice
prompt: What is computed before a neuron's activation function?
options:
  - The target label
  - A random class
  - A weighted sum of inputs plus bias
  - Only the largest input
answer:
  - 2
explanation: The preactivation is z = sum(wᵢxᵢ) + b, then an activation transforms z.
```

```entity
type: question
id: source-ai-03-checkpoint
title: Checkpoint
lesson: source-ai-03
format: choice
prompt: Which task is a natural fit for a neural network with suitable data?
options:
  - Learning without any signal
  - Recognizing patterns in images
  - Replacing exact integer addition
  - Guaranteeing every prediction is correct
answer:
  - 1
explanation: Neural networks can learn complex patterns from examples, but
  require evaluation on unseen data.
```

```entity
type: question
id: source-ai-04-checkpoint
title: Checkpoint
lesson: source-ai-04
format: choice
prompt: Why use nonlinear activation functions in hidden layers?
options:
  - Without them stacked affine layers collapse to one affine map
  - They guarantee zero error
  - They remove all gradients
  - They replace training data
answer:
  - 0
explanation: Nonlinear activations let deep networks model nonlinear
  relationships such as XOR.
```

```entity
type: question
id: source-ai-05-checkpoint
title: Checkpoint
lesson: source-ai-05
format: choice
prompt: How should forecasting training and test data usually be split?
options:
  - Shuffle future and past indiscriminately
  - Tune on test targets
  - Use only training error
  - Train on earlier times and test on later times
answer:
  - 3
explanation: A chronological split simulates predicting unseen future
  observations and helps prevent future leakage.
```

```entity
type: question
id: source-ai-06-checkpoint
title: Checkpoint
lesson: source-ai-06
format: choice
prompt: What does calibration of an 80% prediction interval mean?
options:
  - The interval must be infinitely wide
  - It guarantees each individual outcome
  - Across comparable predictions, about 80% of outcomes fall inside
  - Every outcome must fall inside
answer:
  - 2
explanation: Calibration compares nominal and observed coverage. Width also
  matters; overly wide intervals are not automatically well calibrated.
```

```entity
type: question
id: source-ai-07-checkpoint
title: Checkpoint
lesson: source-ai-07
format: choice
prompt: What is concept drift?
options:
  - A larger batch alone
  - A change in the data-generating relationship over time
  - A fixed ordering of training rows
  - An unchanged loss function
answer:
  - 1
explanation: Online systems monitor changing patterns and may adapt using recent
  examples, windows or drift detection.
```

```entity
type: question
id: source-ai-08-checkpoint
title: Checkpoint
lesson: source-ai-08
format: choice
prompt: What is the cold-start problem in recommendation?
options:
  - Too little interaction history for a new user or item
  - A low machine temperature
  - Too many known ratings
  - A fully trained model
answer:
  - 0
explanation: Content features, initial preferences and exploration help when
  collaborative interaction history is sparse.
```

```entity
type: question
id: source-ai-09-checkpoint
title: Checkpoint
lesson: source-ai-09
format: choice
prompt: Why does an epsilon-greedy agent sometimes act randomly?
options:
  - To guarantee the optimal action every time
  - To discard all learned values
  - To avoid receiving rewards
  - To explore actions beyond its current best estimate
answer:
  - 3
explanation: Exploration can discover better actions; exploitation uses current
  value estimates.
```

```entity
type: question
id: source-ai-10-checkpoint
title: Checkpoint
lesson: source-ai-10
format: choice
prompt: Training loss falls while validation loss rises. What is a likely issue?
options:
  - Too little training in every case
  - A perfect test score
  - Overfitting
  - Guaranteed generalization
answer:
  - 2
explanation: The model may be fitting training-specific details. Early stopping,
  regularization or more suitable data can help.
```

```entity
type: activity
id: encounter-source-alg-00
title: Introduction to Python Programming
template: battle
lesson: source-alg-00
enemy:
  id: guard-source-alg-00
  title: Route interceptor
  hp: 30
  attack: 7
  mixedQuestions: false
  lessons:
    - source-alg-00
  tactics:
    weakness: insight
    pattern:
      - strike
      - heavy
      - recover
    resolve: 1
    act:
      prompt: The courier's route is forged. Which record proves the next hop?
      options:
        - Present the signed record
        - Threaten the system
        - Guess and proceed
      answer: 0
      explanation: Verified route evidence satisfies the protocol and avoids harming
        the protected system.
    spare: true
    boss: false
```

```entity
type: activity
id: encounter-source-alg-01
title: Introduction to Algorithms
template: battle
lesson: source-alg-01
enemy:
  id: guard-source-alg-01
  title: Route interceptor
  hp: 30
  attack: 7
  mixedQuestions: false
  lessons:
    - source-alg-01
  tactics:
    weakness: ward
    pattern:
      - heavy
      - strike
      - strike
      - recover
    resolve: 1
    act:
      prompt: PATCH is trapped behind a route check. What earns safe passage?
      options:
        - Threaten the system
        - Guess and proceed
        - Present the signed record
      answer: 2
      explanation: Verified route evidence satisfies the protocol and avoids harming
        the protected system.
    spare: true
    boss: false
```

```entity
type: activity
id: encounter-source-alg-02
title: Basic Sorting Algorithms
template: battle
lesson: source-alg-02
enemy:
  id: guard-source-alg-02
  title: Route interceptor
  hp: 30
  attack: 7
  mixedQuestions: false
  lessons:
    - source-alg-02
  tactics:
    weakness: insight
    pattern:
      - strike
      - recover
      - heavy
    resolve: 1
    act:
      prompt: The relay flags a cycle. What evidence should you present?
      options:
        - Guess and proceed
        - Present the signed record
        - Threaten the system
      answer: 1
      explanation: Verified route evidence satisfies the protocol and avoids harming
        the protected system.
    spare: true
    boss: false
```

```entity
type: activity
id: encounter-source-alg-03
title: Binary Search, Linear Search, and Big O Notation
template: battle
lesson: source-alg-03
enemy:
  id: guard-source-alg-03
  title: Route interceptor
  hp: 30
  attack: 7
  mixedQuestions: false
  lessons:
    - source-alg-03
  tactics:
    weakness: ward
    pattern:
      - heavy
      - recover
      - strike
      - heavy
    resolve: 1
    act:
      prompt: The courier's route is forged. Which record proves the next hop?
      options:
        - Present the signed record
        - Threaten the system
        - Guess and proceed
      answer: 0
      explanation: Verified route evidence satisfies the protocol and avoids harming
        the protected system.
    spare: true
    boss: false
```

```entity
type: activity
id: encounter-source-alg-04
title: Recursion and Call Stack
template: battle
lesson: source-alg-04
enemy:
  id: guard-source-alg-04
  title: Route interceptor
  hp: 30
  attack: 7
  mixedQuestions: false
  lessons:
    - source-alg-04
  tactics:
    weakness: insight
    pattern:
      - strike
      - strike
      - recover
    resolve: 1
    act:
      prompt: PATCH is trapped behind a route check. What earns safe passage?
      options:
        - Threaten the system
        - Guess and proceed
        - Present the signed record
      answer: 2
      explanation: Verified route evidence satisfies the protocol and avoids harming
        the protected system.
    spare: true
    boss: false
```

```entity
type: activity
id: encounter-source-alg-05
title: Time Complexity Analysis
template: battle
lesson: source-alg-05
enemy:
  id: guard-source-alg-05
  title: Route interceptor
  hp: 30
  attack: 7
  mixedQuestions: false
  lessons:
    - source-alg-05
  tactics:
    weakness: ward
    pattern:
      - strike
      - heavy
      - recover
    resolve: 1
    act:
      prompt: The relay flags a cycle. What evidence should you present?
      options:
        - Guess and proceed
        - Present the signed record
        - Threaten the system
      answer: 1
      explanation: Verified route evidence satisfies the protocol and avoids harming
        the protected system.
    spare: true
    boss: false
```

```entity
type: activity
id: encounter-source-alg-06
title: "Graph Searching: BFS, DFS & Routing and Coverage"
template: battle
lesson: source-alg-06
enemy:
  id: guard-source-alg-06
  title: Route interceptor
  hp: 30
  attack: 7
  mixedQuestions: false
  lessons:
    - source-alg-06
  tactics:
    weakness: insight
    pattern:
      - heavy
      - strike
      - strike
      - recover
    resolve: 1
    act:
      prompt: The courier's route is forged. Which record proves the next hop?
      options:
        - Present the signed record
        - Threaten the system
        - Guess and proceed
      answer: 0
      explanation: Verified route evidence satisfies the protocol and avoids harming
        the protected system.
    spare: true
    boss: false
```

```entity
type: activity
id: encounter-source-alg-07
title: Greedy Algorithm and Optimization
template: battle
lesson: source-alg-07
enemy:
  id: guard-source-alg-07
  title: Route interceptor
  hp: 30
  attack: 7
  mixedQuestions: false
  lessons:
    - source-alg-07
  tactics:
    weakness: ward
    pattern:
      - strike
      - recover
      - heavy
    resolve: 1
    act:
      prompt: PATCH is trapped behind a route check. What earns safe passage?
      options:
        - Threaten the system
        - Guess and proceed
        - Present the signed record
      answer: 2
      explanation: Verified route evidence satisfies the protocol and avoids harming
        the protected system.
    spare: true
    boss: false
```

```entity
type: activity
id: encounter-source-alg-08
title: Dynamic Programming (DP)
template: battle
lesson: source-alg-08
enemy:
  id: guard-source-alg-08
  title: Route interceptor
  hp: 30
  attack: 7
  mixedQuestions: false
  lessons:
    - source-alg-08
  tactics:
    weakness: insight
    pattern:
      - heavy
      - recover
      - strike
      - heavy
    resolve: 1
    act:
      prompt: The relay flags a cycle. What evidence should you present?
      options:
        - Guess and proceed
        - Present the signed record
        - Threaten the system
      answer: 1
      explanation: Verified route evidence satisfies the protocol and avoids harming
        the protected system.
    spare: true
    boss: false
```

```entity
type: activity
id: encounter-source-alg-09
title: Inventory and Uncertainty Management
template: battle
lesson: source-alg-09
enemy:
  id: guard-source-alg-09
  title: Route interceptor
  hp: 30
  attack: 7
  mixedQuestions: false
  lessons:
    - source-alg-09
  tactics:
    weakness: ward
    pattern:
      - strike
      - strike
      - recover
    resolve: 1
    act:
      prompt: The courier's route is forged. Which record proves the next hop?
      options:
        - Present the signed record
        - Threaten the system
        - Guess and proceed
      answer: 0
      explanation: Verified route evidence satisfies the protocol and avoids harming
        the protected system.
    spare: true
    boss: false
```

```entity
type: activity
id: encounter-source-alg-10
title: Sequential Decisions Over Time
template: battle
lesson: source-alg-10
enemy:
  id: guard-source-alg-10
  title: Route interceptor
  hp: 30
  attack: 7
  mixedQuestions: false
  lessons:
    - source-alg-10
  tactics:
    weakness: insight
    pattern:
      - strike
      - heavy
      - recover
    resolve: 1
    act:
      prompt: PATCH is trapped behind a route check. What earns safe passage?
      options:
        - Threaten the system
        - Guess and proceed
        - Present the signed record
      answer: 2
      explanation: Verified route evidence satisfies the protocol and avoids harming
        the protected system.
    spare: true
    boss: false
```

```entity
type: activity
id: route-warden
title: Route Warden
template: battle
lesson: source-alg-00
enemy:
  id: route-warden
  title: Route Warden
  hp: 100
  attack: 10
  mixedQuestions: false
  lessons:
    - source-alg-00
    - source-alg-01
    - source-alg-02
    - source-alg-03
    - source-alg-04
    - source-alg-05
    - source-alg-06
    - source-alg-07
    - source-alg-08
    - source-alg-09
    - source-alg-10
  tactics:
    mechanic: routing
    weakness: insight
    pattern:
      - strike
      - heavy
      - recover
    resolve: 2
    act:
      prompt: The courier's route is forged. Which record proves the next hop?
      options:
        - Present the signed record
        - Threaten the system
        - Guess and proceed
      answer: 0
      explanation: Verified route evidence satisfies the protocol and avoids harming
        the protected system.
    spare: true
    boss: true
clue:
  title: PATCH's signed receipt
  text: "Receipt: ECHO-7 entered maintenance relay R-17 at 02:14."
```

```entity
type: activity
id: encounter-source-ds-01
title: Data Structures
template: battle
lesson: source-ds-01
enemy:
  id: guard-source-ds-01
  title: Archive drone
  hp: 30
  attack: 7
  mixedQuestions: false
  lessons:
    - source-ds-01
  tactics:
    weakness: insight
    pattern:
      - strike
      - heavy
      - recover
    resolve: 1
    act:
      prompt: FOLIO's identity was erased. Which record can restore the audit trail?
      options:
        - Present the signed record
        - Threaten the system
        - Guess and proceed
      answer: 0
      explanation: Verified archive evidence satisfies the protocol and avoids harming
        the protected system.
    spare: true
    boss: false
```

```entity
type: activity
id: encounter-source-ds-02
title: Linear Data Structures
template: battle
lesson: source-ds-02
enemy:
  id: guard-source-ds-02
  title: Archive drone
  hp: 30
  attack: 7
  mixedQuestions: false
  lessons:
    - source-ds-02
  tactics:
    weakness: ward
    pattern:
      - heavy
      - strike
      - strike
      - recover
    resolve: 1
    act:
      prompt: The archive blocks access. Which credential follows its protocol?
      options:
        - Threaten the system
        - Guess and proceed
        - Present the signed record
      answer: 2
      explanation: Verified archive evidence satisfies the protocol and avoids harming
        the protected system.
    spare: true
    boss: false
```

```entity
type: activity
id: encounter-source-ds-03
title: Arrays
template: battle
lesson: source-ds-03
enemy:
  id: guard-source-ds-03
  title: Archive drone
  hp: 30
  attack: 7
  mixedQuestions: false
  lessons:
    - source-ds-03
  tactics:
    weakness: insight
    pattern:
      - strike
      - recover
      - heavy
    resolve: 1
    act:
      prompt: A revision was altered. What evidence verifies its history?
      options:
        - Guess and proceed
        - Present the signed record
        - Threaten the system
      answer: 1
      explanation: Verified archive evidence satisfies the protocol and avoids harming
        the protected system.
    spare: true
    boss: false
```

```entity
type: activity
id: encounter-source-ds-04
title: Linked List
template: battle
lesson: source-ds-04
enemy:
  id: guard-source-ds-04
  title: Archive drone
  hp: 30
  attack: 7
  mixedQuestions: false
  lessons:
    - source-ds-04
  tactics:
    weakness: ward
    pattern:
      - heavy
      - recover
      - strike
      - heavy
    resolve: 1
    act:
      prompt: FOLIO's identity was erased. Which record can restore the audit trail?
      options:
        - Present the signed record
        - Threaten the system
        - Guess and proceed
      answer: 0
      explanation: Verified archive evidence satisfies the protocol and avoids harming
        the protected system.
    spare: true
    boss: false
```

```entity
type: activity
id: encounter-source-ds-05
title: Stack
template: battle
lesson: source-ds-05
enemy:
  id: guard-source-ds-05
  title: Archive drone
  hp: 30
  attack: 7
  mixedQuestions: false
  lessons:
    - source-ds-05
  tactics:
    weakness: insight
    pattern:
      - strike
      - strike
      - recover
    resolve: 1
    act:
      prompt: The archive blocks access. Which credential follows its protocol?
      options:
        - Threaten the system
        - Guess and proceed
        - Present the signed record
      answer: 2
      explanation: Verified archive evidence satisfies the protocol and avoids harming
        the protected system.
    spare: true
    boss: false
```

```entity
type: activity
id: encounter-source-ds-06
title: Queue
template: battle
lesson: source-ds-06
enemy:
  id: guard-source-ds-06
  title: Archive drone
  hp: 30
  attack: 7
  mixedQuestions: false
  lessons:
    - source-ds-06
  tactics:
    weakness: ward
    pattern:
      - strike
      - heavy
      - recover
    resolve: 1
    act:
      prompt: A revision was altered. What evidence verifies its history?
      options:
        - Guess and proceed
        - Present the signed record
        - Threaten the system
      answer: 1
      explanation: Verified archive evidence satisfies the protocol and avoids harming
        the protected system.
    spare: true
    boss: false
```

```entity
type: activity
id: encounter-source-ds-07
title: Nonlinear Data Structures
template: battle
lesson: source-ds-07
enemy:
  id: guard-source-ds-07
  title: Archive drone
  hp: 30
  attack: 7
  mixedQuestions: false
  lessons:
    - source-ds-07
  tactics:
    weakness: insight
    pattern:
      - heavy
      - strike
      - strike
      - recover
    resolve: 1
    act:
      prompt: FOLIO's identity was erased. Which record can restore the audit trail?
      options:
        - Present the signed record
        - Threaten the system
        - Guess and proceed
      answer: 0
      explanation: Verified archive evidence satisfies the protocol and avoids harming
        the protected system.
    spare: true
    boss: false
```

```entity
type: activity
id: encounter-source-ds-08
title: Trees
template: battle
lesson: source-ds-08
enemy:
  id: guard-source-ds-08
  title: Archive drone
  hp: 30
  attack: 7
  mixedQuestions: false
  lessons:
    - source-ds-08
  tactics:
    weakness: ward
    pattern:
      - strike
      - recover
      - heavy
    resolve: 1
    act:
      prompt: The archive blocks access. Which credential follows its protocol?
      options:
        - Threaten the system
        - Guess and proceed
        - Present the signed record
      answer: 2
      explanation: Verified archive evidence satisfies the protocol and avoids harming
        the protected system.
    spare: true
    boss: false
```

```entity
type: activity
id: encounter-source-ds-09
title: Graphs
template: battle
lesson: source-ds-09
enemy:
  id: guard-source-ds-09
  title: Archive drone
  hp: 30
  attack: 7
  mixedQuestions: false
  lessons:
    - source-ds-09
  tactics:
    weakness: insight
    pattern:
      - heavy
      - recover
      - strike
      - heavy
    resolve: 1
    act:
      prompt: A revision was altered. What evidence verifies its history?
      options:
        - Guess and proceed
        - Present the signed record
        - Threaten the system
      answer: 1
      explanation: Verified archive evidence satisfies the protocol and avoids harming
        the protected system.
    spare: true
    boss: false
```

```entity
type: activity
id: encounter-source-ds-10
title: Data Versioning
template: battle
lesson: source-ds-10
enemy:
  id: guard-source-ds-10
  title: Archive drone
  hp: 30
  attack: 7
  mixedQuestions: false
  lessons:
    - source-ds-10
  tactics:
    weakness: ward
    pattern:
      - strike
      - strike
      - recover
    resolve: 1
    act:
      prompt: FOLIO's identity was erased. Which record can restore the audit trail?
      options:
        - Present the signed record
        - Threaten the system
        - Guess and proceed
      answer: 0
      explanation: Verified archive evidence satisfies the protocol and avoids harming
        the protected system.
    spare: true
    boss: false
```

```entity
type: activity
id: archive-keeper
title: Archive Keeper
template: battle
lesson: source-ds-01
enemy:
  id: archive-keeper
  title: Archive Keeper
  hp: 100
  attack: 10
  mixedQuestions: false
  lessons:
    - source-ds-01
    - source-ds-02
    - source-ds-03
    - source-ds-04
    - source-ds-05
    - source-ds-06
    - source-ds-07
    - source-ds-08
    - source-ds-09
    - source-ds-10
  tactics:
    mechanic: archive
    weakness: ward
    pattern:
      - heavy
      - strike
      - strike
      - recover
    resolve: 2
    act:
      prompt: The archive blocks access. Which credential follows its protocol?
      options:
        - Threaten the system
        - Guess and proceed
        - Present the signed record
      answer: 2
      explanation: Verified archive evidence satisfies the protocol and avoids harming
        the protected system.
    spare: true
    boss: true
clue:
  title: FOLIO's signed audit
  text: "Signed audit: ECHO-7 used M-04, then erased its gateway entry."
```

```entity
type: activity
id: encounter-source-ai-01
title: Introduction to Connectionist AI (Brief)
template: battle
lesson: source-ai-01
enemy:
  id: guard-source-ai-01
  title: Signal decoy
  hp: 30
  attack: 7
  mixedQuestions: false
  lessons:
    - source-ai-01
  tactics:
    weakness: insight
    pattern:
      - strike
      - heavy
      - recover
    resolve: 1
    act:
      prompt: LUMA detects a forged signal. What test best verifies its source?
      options:
        - Present the signed record
        - Threaten the system
        - Guess and proceed
      answer: 0
      explanation: Verified signal evidence satisfies the protocol and avoids harming
        the protected system.
    spare: true
    boss: false
```

```entity
type: activity
id: encounter-source-ai-02
title: Basic Concepts, Terminology and Architectures of Neural Networks
template: battle
lesson: source-ai-02
enemy:
  id: guard-source-ai-02
  title: Signal decoy
  hp: 30
  attack: 7
  mixedQuestions: false
  lessons:
    - source-ai-02
  tactics:
    weakness: ward
    pattern:
      - heavy
      - strike
      - strike
      - recover
    resolve: 1
    act:
      prompt: The handshake is untrusted. Which evidence establishes its origin?
      options:
        - Threaten the system
        - Guess and proceed
        - Present the signed record
      answer: 2
      explanation: Verified signal evidence satisfies the protocol and avoids harming
        the protected system.
    spare: true
    boss: false
```

```entity
type: activity
id: encounter-source-ai-03
title: Applications of Neural Networks (Brief)
template: battle
lesson: source-ai-03
enemy:
  id: guard-source-ai-03
  title: Signal decoy
  hp: 30
  attack: 7
  mixedQuestions: false
  lessons:
    - source-ai-03
  tactics:
    weakness: insight
    pattern:
      - strike
      - recover
      - heavy
    resolve: 1
    act:
      prompt: The model flags a drift. What should be checked before adapting?
      options:
        - Guess and proceed
        - Present the signed record
        - Threaten the system
      answer: 1
      explanation: Verified signal evidence satisfies the protocol and avoids harming
        the protected system.
    spare: true
    boss: false
```

```entity
type: activity
id: encounter-source-ai-04
title: Deep Learning and Activation Functions
template: battle
lesson: source-ai-04
enemy:
  id: guard-source-ai-04
  title: Signal decoy
  hp: 30
  attack: 7
  mixedQuestions: false
  lessons:
    - source-ai-04
  tactics:
    weakness: ward
    pattern:
      - heavy
      - recover
      - strike
      - heavy
    resolve: 1
    act:
      prompt: LUMA detects a forged signal. What test best verifies its source?
      options:
        - Present the signed record
        - Threaten the system
        - Guess and proceed
      answer: 0
      explanation: Verified signal evidence satisfies the protocol and avoids harming
        the protected system.
    spare: true
    boss: false
```

```entity
type: activity
id: encounter-source-ai-05
title: Demand Forecasting and Time-Series Forecasting
template: battle
lesson: source-ai-05
enemy:
  id: guard-source-ai-05
  title: Signal decoy
  hp: 30
  attack: 7
  mixedQuestions: false
  lessons:
    - source-ai-05
  tactics:
    weakness: insight
    pattern:
      - strike
      - strike
      - recover
    resolve: 1
    act:
      prompt: The handshake is untrusted. Which evidence establishes its origin?
      options:
        - Threaten the system
        - Guess and proceed
        - Present the signed record
      answer: 2
      explanation: Verified signal evidence satisfies the protocol and avoids harming
        the protected system.
    spare: true
    boss: false
```

```entity
type: activity
id: encounter-source-ai-06
title: Probabilistic Forecasting
template: battle
lesson: source-ai-06
enemy:
  id: guard-source-ai-06
  title: Signal decoy
  hp: 30
  attack: 7
  mixedQuestions: false
  lessons:
    - source-ai-06
  tactics:
    weakness: ward
    pattern:
      - strike
      - heavy
      - recover
    resolve: 1
    act:
      prompt: The model flags a drift. What should be checked before adapting?
      options:
        - Guess and proceed
        - Present the signed record
        - Threaten the system
      answer: 1
      explanation: Verified signal evidence satisfies the protocol and avoids harming
        the protected system.
    spare: true
    boss: false
```

```entity
type: activity
id: encounter-source-ai-07
title: Online and Incremental Learning
template: battle
lesson: source-ai-07
enemy:
  id: guard-source-ai-07
  title: Signal decoy
  hp: 30
  attack: 7
  mixedQuestions: false
  lessons:
    - source-ai-07
  tactics:
    weakness: insight
    pattern:
      - heavy
      - strike
      - strike
      - recover
    resolve: 1
    act:
      prompt: LUMA detects a forged signal. What test best verifies its source?
      options:
        - Present the signed record
        - Threaten the system
        - Guess and proceed
      answer: 0
      explanation: Verified signal evidence satisfies the protocol and avoids harming
        the protected system.
    spare: true
    boss: false
```

```entity
type: activity
id: encounter-source-ai-08
title: Recommendation Systems (Brief)
template: battle
lesson: source-ai-08
enemy:
  id: guard-source-ai-08
  title: Signal decoy
  hp: 30
  attack: 7
  mixedQuestions: false
  lessons:
    - source-ai-08
  tactics:
    weakness: ward
    pattern:
      - strike
      - recover
      - heavy
    resolve: 1
    act:
      prompt: The handshake is untrusted. Which evidence establishes its origin?
      options:
        - Threaten the system
        - Guess and proceed
        - Present the signed record
      answer: 2
      explanation: Verified signal evidence satisfies the protocol and avoids harming
        the protected system.
    spare: true
    boss: false
```

```entity
type: activity
id: encounter-source-ai-09
title: Reinforcement Learning
template: battle
lesson: source-ai-09
enemy:
  id: guard-source-ai-09
  title: Signal decoy
  hp: 30
  attack: 7
  mixedQuestions: false
  lessons:
    - source-ai-09
  tactics:
    weakness: insight
    pattern:
      - heavy
      - recover
      - strike
      - heavy
    resolve: 1
    act:
      prompt: The model flags a drift. What should be checked before adapting?
      options:
        - Guess and proceed
        - Present the signed record
        - Threaten the system
      answer: 1
      explanation: Verified signal evidence satisfies the protocol and avoids harming
        the protected system.
    spare: true
    boss: false
```

```entity
type: activity
id: encounter-source-ai-10
title: Model Training and Optimisation
template: battle
lesson: source-ai-10
enemy:
  id: guard-source-ai-10
  title: Signal decoy
  hp: 30
  attack: 7
  mixedQuestions: false
  lessons:
    - source-ai-10
  tactics:
    weakness: ward
    pattern:
      - strike
      - strike
      - recover
    resolve: 1
    act:
      prompt: LUMA detects a forged signal. What test best verifies its source?
      options:
        - Present the signed record
        - Threaten the system
        - Guess and proceed
      answer: 0
      explanation: Verified signal evidence satisfies the protocol and avoids harming
        the protected system.
    spare: true
    boss: false
```

```entity
type: activity
id: signal-mimic
title: Signal Mimic
template: battle
lesson: source-ai-01
enemy:
  id: signal-mimic
  title: Signal Mimic
  hp: 100
  attack: 10
  mixedQuestions: false
  lessons:
    - source-ai-01
    - source-ai-02
    - source-ai-03
    - source-ai-04
    - source-ai-05
    - source-ai-06
    - source-ai-07
    - source-ai-08
    - source-ai-09
    - source-ai-10
  tactics:
    mechanic: mimic
    weakness: insight
    pattern:
      - strike
      - heavy
      - recover
    resolve: 2
    act:
      prompt: LUMA detects a forged signal. What test best verifies its source?
      options:
        - Present the signed record
        - Threaten the system
        - Guess and proceed
      answer: 0
      explanation: Verified signal evidence satisfies the protocol and avoids harming
        the protected system.
    spare: true
    boss: true
clue:
  title: LUMA's verified handshake
  text: "Verified handshake: M-04 forwarded ECHO-7 from relay R-17 to the
    abandoned subnet."
```
