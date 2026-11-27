# Battle field checks

```question
id: battle-alg-00-trace
title: Field check
lesson: source-alg-00
format: choice
prompt: "total starts at 1. After two iterations of total += 3, what is total?"
options: ["4","6","7","9"]
answer: [2]
explanation: "The two iterations add 6 to the starting value of 1."
```

```question
id: battle-alg-00-loop
title: Field check
lesson: source-alg-00
format: ordering
prompt: "Trace one iteration of a for loop."
options: ["Take the next value","Assign it to the loop variable","Run the loop body"]
answer: [0,1,2]
explanation: "Each value is assigned before the body runs."
```

```question
id: battle-alg-00-range
title: Field check
lesson: source-alg-00
format: multiple
prompt: "Which values does for n in range(2, 6, 2) visit?"
options: ["2","3","4","6"]
answer: [0,2]
explanation: "Start at 2, step by 2, and stop before 6."
```

```question
id: battle-alg-00-state
title: Field check
lesson: source-alg-00
format: choice
prompt: "x starts at 2. Run x += 4, then x *= 2. What is x?"
options: ["8","12","16","10"]
answer: [1]
explanation: "Adding 4 makes 6, then doubling makes 12."
```

```question
id: battle-alg-00-branches
title: Field check
lesson: source-alg-00
format: multiple
prompt: "A door opens only if both badge and PIN are valid. Which cases leave it closed?"
options: ["Valid badge and PIN","Valid badge only","Valid PIN only","Neither is valid"]
answer: [1,2,3]
explanation: "Any failed check keeps the door closed."
```

```question
id: battle-alg-01-method
title: Field check
lesson: source-alg-01
format: multiple
prompt: "Which changes can preserve a search algorithm's steps?"
options: ["Rename its variables","Translate the same steps to another language","Replace scanning with binary search","Reformat a printed description"]
answer: [0,1,3]
explanation: "Names, notation, and language can change while the method stays the same."
```

```question
id: battle-alg-02-insert
title: Field check
lesson: source-alg-02
format: ordering
prompt: "Insert 4 into the sorted prefix [2, 5, 7] using insertion sort."
options: ["Shift 7 right","Shift 5 right","Write 4 in the gap"]
answer: [0,1,2]
explanation: "Work backward over larger values before filling the gap."
```

```question
id: battle-alg-03-bisect
title: Field check
lesson: source-alg-03
format: multiple
prompt: "Binary search checks 8 in [2, 5, 8, 11, 15] while looking for 11. Which values are eliminated?"
options: ["2","11","8","5"]
answer: [0,2,3]
explanation: "The target is larger than 8, so only values to its right can match."
```

```question
id: battle-alg-04-unwind
title: Field check
lesson: source-alg-04
format: ordering
prompt: "Trace count(2) when count(0) is 0 and count(n) returns 1 + count(n−1)."
options: ["Call count(1)","Call count(0)","Return 1 from count(1)","Return 2 from count(2)"]
answer: [0,1,2,3]
explanation: "Each waiting call adds 1 after the base case returns."
```

```question
id: battle-alg-05-growth
title: Field check
lesson: source-alg-05
format: multiple
prompt: "Which workloads quadruple when n doubles?"
options: ["Visit each cell of an n × n grid","Read an array of n values","Compare each of n reports against each of n records","Read the first report"]
answer: [0,2]
explanation: "Doubling both dimensions yields four times the work."
```

```question
id: battle-alg-06-queue
title: Field check
lesson: source-alg-06
format: ordering
prompt: "BFS starts at A. A discovers B then C, and B discovers D. Order the visits."
options: ["A","B","C","D"]
answer: [0,1,2,3]
explanation: "C enters the queue before D, so C is visited first."
```

```question
id: battle-alg-07-change
title: Field check
lesson: source-alg-07
format: multiple
prompt: "Make 8 with coins of value 1, 4 and 6. Greedy always takes the largest coin that fits. Which statements are true?"
options: ["Greedy takes 6 first","Two coins of value 4 use fewer coins","Greedy takes 4 first","Greedy finishes with a total of two coins"]
answer: [0,1]
explanation: "Greedy picks 6, then two 1s. Two 4s reach the same amount using fewer coins."
```

```question
id: battle-alg-08-reuse
title: Field check
lesson: source-alg-08
format: ordering
prompt: "Memoized Fibonacci needs F(3) for the first time, then needs it again. Order the events."
options: ["Compute F(3)","Store F(3)","Read the stored F(3)"]
answer: [0,1,2]
explanation: "The second call can reuse a result after the first stores it."
```

```question
id: battle-alg-09-risk
title: Field check
lesson: source-alg-09
format: multiple
prompt: "Which options have an expected cost of 4 credits?"
options: ["Half the time 0, half the time 8","Always 4","Half the time 4, half the time 8","A quarter of the time 0, otherwise 8"]
answer: [0,1]
explanation: "A half chance each of 0 and 8 averages to 4. Paying 4 every time also averages to 4."
```

```question
id: battle-alg-10-policy
title: Field check
lesson: source-alg-10
format: multiple
prompt: "Which facts matter when a cheap move can shut tomorrow's route?"
options: ["Today's move cost","The next available routes","The costs of those routes","The color of the route labels"]
answer: [0,1,2]
explanation: "Sequential decisions depend on immediate cost and the future states each action enables."
```

```question
id: battle-ds-01-lookup
title: Field check
lesson: source-ds-01
format: multiple
prompt: "Which tasks need fast lookup by a unique key?"
options: ["Find a student by ID","Find a book by ISBN","Read every audit event in order","Take the newest item from a stack"]
answer: [0,1]
explanation: "Student IDs and ISBNs identify a particular record."
```

```question
id: battle-ds-01-index
title: Field check
lesson: source-ds-01
format: ordering
prompt: "Use an index to fetch a record by ID."
options: ["Read the requested ID","Look up that ID in the index","Fetch the matching record"]
answer: [0,1,2]
explanation: "The index translates an identifier into a record location."
```

```question
id: battle-ds-01-cost
title: Field check
lesson: source-ds-01
format: choice
prompt: "An unsorted list has 500 names. Without an index, how many entries might a missing-name search inspect?"
options: ["1","250","499","500"]
answer: [3]
explanation: "A scan may need to check every entry."
```

```question
id: battle-ds-01-values
title: Field check
lesson: source-ds-01
format: multiple
prompt: "Which requirements affect how records should be organized?"
options: ["Fetch a record by ID","Preserve insertion order","Print in a larger font","Remove the most recent entry"]
answer: [0,1,3]
explanation: "Lookup, ordering, and removal change the collection operations."
```

```question
id: battle-ds-01-directory
title: Field check
lesson: source-ds-01
format: choice
prompt: "An office retrieves records by badge ID. Which representation supports this directly?"
options: ["A queue of badges","A table keyed by badge ID","A printout by arrival time","A stack of badge scans"]
answer: [1]
explanation: "A keyed table supports direct lookup by ID."
```

```question
id: battle-ds-02-links
title: Field check
lesson: source-ds-02
format: ordering
prompt: "Start at A in A → B → C. Follow the links and read each element."
options: ["Read A","Read B","Read C"]
answer: [0,1,2]
explanation: "Each link leads to the next element."
```

```question
id: battle-ds-02-linear
title: Field check
lesson: source-ds-02
format: multiple
prompt: "Which collections arrange elements in a single sequence?"
options: ["Array","Queue","Folder tree","Linked list"]
answer: [0,1,3]
explanation: "Arrays, queues, and linked lists are linear. A folder tree branches."
```

```question
id: battle-ds-02-array-read
title: Field check
lesson: source-ds-02
format: choice
prompt: "In [12, 20, 34], what is the value at index 1 when indexing starts at 0?"
options: ["12","34","20","1"]
answer: [2]
explanation: "Index 0 identifies 12, so index 1 identifies 20."
```

```question
id: battle-ds-03-front
title: Field check
lesson: source-ds-03
format: ordering
prompt: "Insert X at index 0 of a packed array [A, B, C] with one free slot."
options: ["Move C into the free slot","Move B one slot right","Move A one slot right","Write X at index 0"]
answer: [0,1,2,3]
explanation: "Moving rightmost entries first preserves values that still need to move."
```

```question
id: battle-ds-04-chain
title: Field check
lesson: source-ds-04
format: ordering
prompt: "Insert X between A and B while keeping B reachable throughout."
options: ["Start with A pointing to B","Set X's next to B","Set A's next to X"]
answer: [0,1,2]
explanation: "Link X to B before replacing A's link."
```

```question
id: battle-ds-05-undo
title: Field check
lesson: source-ds-05
format: ordering
prompt: "Push A, B, and C onto a stack in that order, then empty it. Order the pops."
options: ["C","B","A"]
answer: [0,1,2]
explanation: "A stack removes the most recently pushed item first."
```

```question
id: battle-ds-06-service
title: Field check
lesson: source-ds-06
format: ordering
prompt: "Tickets 17, 20, and 14 arrive in that order. Arrange them for FIFO service."
options: ["17","20","14"]
answer: [0,1,2]
explanation: "FIFO uses arrival order, even when the ticket numbers are out of sequence."
```

```question
id: battle-ds-07-branch
title: Field check
lesson: source-ds-07
format: multiple
prompt: "Which records naturally describe a hierarchy with branches?"
options: ["Folder and subfolder relationships","A train's departure queue","An organization's reporting lines","The pages of a booklet"]
answer: [0,2]
explanation: "Folders and reporting lines can both have several children under one parent."
```

```question
id: battle-ds-08-inorder
title: Field check
lesson: source-ds-08
format: ordering
prompt: "A search tree has root 6, left child 4, and right child 9. Order an inorder visit."
options: ["4","6","9"]
answer: [0,1,2]
explanation: "Inorder visits left, root, then right."
```

```question
id: battle-ds-09-neighbors
title: Field check
lesson: source-ds-09
format: multiple
prompt: "A map has directed edges A→B, A→D, and D→C. Which vertices are in A's adjacency list?"
options: ["B","C","D","A"]
answer: [0,2]
explanation: "A's list contains the destinations of its own outbound edges."
```

```question
id: battle-ds-10-revision
title: Field check
lesson: source-ds-10
format: ordering
prompt: "The trusted checksum is already on screen. Verify the revision against it."
options: ["Read the bytes of the revision","Compute a checksum from those bytes","Compare the computed and expected checksums"]
answer: [0,1,2]
explanation: "The comparison uses a checksum computed from the current revision's contents."
```

```question
id: battle-ai-01-learning
title: Field check
lesson: source-ai-01
format: ordering
prompt: "Train a connectionist model once on a labeled example."
options: ["Predict from the input","Compare the prediction with the label","Adjust the weights"]
answer: [0,1,2]
explanation: "The prediction error informs the update."
```

```question
id: battle-ai-01-parameters
title: Field check
lesson: source-ai-01
format: multiple
prompt: "Which records can distinguish a model before and after training?"
options: ["The model's learned weights","Predictions on the same held-out inputs","The computer's case color","The number of chairs in the lab"]
answer: [0,1]
explanation: "Training may change the weights and the outputs produced by them."
```

```question
id: battle-ai-01-predictions
title: Field check
lesson: source-ai-01
format: choice
prompt: "A trained model sees a new input while its weights stay fixed. What is this step called?"
options: ["Labeling","Training","Inference","Shuffling"]
answer: [2]
explanation: "Inference uses the learned weights to make a prediction."
```

```question
id: battle-ai-01-labels
title: Field check
lesson: source-ai-01
format: multiple
prompt: "Which records pair an example with a target for supervised learning?"
options: ["Photo and animal species","Message and spam label","Photo without a label","Unlabeled sensor readings"]
answer: [0,1]
explanation: "The target says what the model should predict."
```

```question
id: battle-ai-01-testing
title: Field check
lesson: source-ai-01
format: choice
prompt: "A classifier gets every training example right. Which check best tests whether the pattern generalizes?"
options: ["Rerun it on the same examples","Count how many weights changed","Evaluate it on unseen examples","Use more copies of the same data"]
answer: [2]
explanation: "Unseen data tests whether performance carries beyond training."
```

```question
id: battle-ai-02-neuron
title: Field check
lesson: source-ai-02
format: ordering
prompt: "Order the steps for computing one neuron's output."
options: ["Multiply each input by its weight","Sum the products and add the bias","Apply the activation function"]
answer: [0,1,2]
explanation: "Activation receives the weighted sum plus bias."
```

```question
id: battle-ai-03-data
title: Field check
lesson: source-ai-03
format: multiple
prompt: "An image model must recognize day and night scenes. Which steps test or improve that coverage?"
options: ["Train with examples of both","Test with held-out examples of both","Test only daytime scenes","Duplicate one night photo across the test set"]
answer: [0,1]
explanation: "Both conditions need representative training examples and independent evaluation."
```

```question
id: battle-ai-04-relu
title: Field check
lesson: source-ai-04
format: multiple
prompt: "ReLU outputs max(0, x). Which inputs yield exactly 0?"
options: ["−4","2","0","7"]
answer: [0,2]
explanation: "Negative values are clipped to zero, and zero stays zero."
```

```question
id: battle-ai-05-forecast
title: Field check
lesson: source-ai-05
format: ordering
prompt: "Set up a chronological forecasting experiment."
options: ["Train on the earliest time block","Tune on a later validation block","Evaluate once on the newest test block"]
answer: [0,1,2]
explanation: "Keeping later data separate mirrors prediction into the future and limits leakage."
```

```question
id: battle-ai-06-drift
title: Field check
lesson: source-ai-06
format: multiple
prompt: "Demand stays at or below the model's P90 forecast on 72 of 100 comparable days. Which statements about this sample are true?"
options: ["Observed coverage falls below 90%","Demand exceeds the forecast on 28 days","Average demand exceeds the forecast by 28 units","Every forecast is too low"]
answer: [0,1]
explanation: "The forecasts cover 72% of outcomes in this sample. Demand exceeds the forecast on the other 28 days, but these counts do not measure the size of the errors."
```

```question
id: battle-ai-07-online
title: Field check
lesson: source-ai-07
format: ordering
prompt: "For each labeled event, measure performance before learning from it."
options: ["Predict the label","Score the prediction against the actual label","Update the model using the labeled event"]
answer: [0,1,2]
explanation: "Scoring first measures performance before the model sees that label."
```

```question
id: battle-ai-08-cold
title: Field check
lesson: source-ai-08
format: multiple
prompt: "A new item has no interaction history. Which signals can still support a recommendation?"
options: ["Its known category","Its description","Its nonexistent click history","A user's stated preferences"]
answer: [0,1,3]
explanation: "Content and preferences are available before the item has recorded clicks."
```

```question
id: battle-ai-09-explore
title: Field check
lesson: source-ai-09
format: multiple
prompt: "An agent exploits its current best action 90% of the time and otherwise samples randomly. Which outcomes are possible?"
options: ["Explore and choose the current best","Explore and try a lower-rated action","Stop exploring after the first reward","Exploit and choose the current best"]
answer: [0,1,3]
explanation: "Exploration can draw any action. Exploitation chooses the current best."
```

```question
id: battle-ai-10-validation
title: Field check
lesson: source-ai-10
format: multiple
prompt: "Which changes can address overfitting to the training set?"
options: ["Stop when validation performance peaks","Use stronger regularization","Add representative training data","Tune repeatedly on the final test set"]
answer: [0,1,2]
explanation: "Early stopping, regularization, and better training data can improve generalization."
```

```question
id: battle-alg-04-stalled
title: Field check
lesson: source-alg-04
format: choice
prompt: "probe(n) stops at n = 0. For positive n it calls probe(n + 1). What happens starting at 3?"
options: ["It reaches 0 in three calls","It returns 3 immediately","It moves away from the base case","It repeats the same argument"]
answer: [2]
explanation: "Each call increases n, so the sequence never reaches 0."
```

```question
id: battle-alg-04-pending
title: Field check
lesson: source-alg-04
format: multiple
prompt: "sum_down(0) returns 0. For n > 0, sum_down(n) returns n + sum_down(n − 1). While evaluating sum_down(2), which additions are pending when the call for n = 0 begins?"
options: ["The call with n = 2 adding 2","The call with n = 1 adding 1","The base case adding 0","The call with n = 2 adding 1"]
answer: [0,1]
explanation: "The two non-base calls each keep their own pending addition until the next call returns."
```

```question
id: battle-alg-04-depth
title: Field check
lesson: source-alg-04
format: choice
prompt: "count(7) repeatedly calls count(n - 2) and stops when n ≤ 1. At the deepest point, how many calls are on the stack, including count(7)?"
options: ["3","4","6","7"]
answer: [1]
explanation: "The active calls have arguments 7, 5, 3 and 1, including the base case."
```

```question
id: battle-alg-05-fixed-inner
title: Field check
lesson: source-alg-05
format: choice
prompt: "A scanner checks exactly five fields for each of n reports. How many field checks does it make?"
options: ["5","n + 5","5n","n²"]
answer: [2]
explanation: "Each of the n reports causes five checks, so the count is 5n."
```

```question
id: battle-alg-05-sequential
title: Field check
lesson: source-alg-05
format: multiple
prompt: "Which plans perform exactly 2n checks for every positive n?"
options: ["Scan all n records twice","Run two checks on each of n records","Check all n records once and check the first record again","For each of n records, check all n records"]
answer: [0,1]
explanation: "Two full scans and two checks per record both total 2n."
```

```question
id: battle-alg-05-pairs
title: Field check
lesson: source-alg-05
format: choice
prompt: "A report compares every unique unordered pair of 8 different records once. How many comparisons does it make?"
options: ["8","16","28","64"]
answer: [2]
explanation: "Each record pairs with every later one: 7 + 6 + 5 + 4 + 3 + 2 + 1 = 28."
```

```question
id: battle-alg-05-growth-order
title: Field check
lesson: source-alg-05
format: ordering
prompt: "Order these operation counts from slowest-growing to fastest-growing for large n."
options: ["20","2n","n²","n³"]
answer: [0,1,2,3]
explanation: "Constant, linear, quadratic, and cubic counts grow in that order. The factor of 2 does not change the linear class."
```

```question
id: battle-alg-07-settle
title: Field check
lesson: source-alg-07
format: choice
prompt: "Dijkstra's unsettled relays have tentative total distances A = 6, B = 4, C = 9. Which relay does it settle next?"
options: ["A","B","C","Whichever was discovered first"]
answer: [1]
explanation: "Dijkstra settles the unsettled relay with the smallest tentative total distance from the start."
```

```question
id: battle-alg-07-routes
title: Field check
lesson: source-alg-07
format: multiple
prompt: "Two routes leave S: S→A costs 2 then A→G costs 9. S→B costs 5 then B→G costs 1. Which statements are true?"
options: ["The cheapest first edge goes to A","The cheapest complete route goes through B","The route through A costs 6","Both complete routes have equal cost"]
answer: [0,1]
explanation: "The first edge to A is cheaper, but the route through B costs 6 versus 11 through A."
```

```question
id: battle-alg-07-relax
title: Field check
lesson: source-alg-07
format: ordering
prompt: "Trace Dijkstra settling A at distance 3 and examining an edge A→B of cost 2. B's current tentative distance is 8."
options: ["Settle A at distance 3","Compute the candidate distance 3 + 2","Compare the candidate with 8","Replace B's tentative distance with 5"]
answer: [0,1,2,3]
explanation: "The new route reaches B at total cost 5, so it improves on the previous cost of 8."
```

```question
id: battle-alg-07-negative
title: Field check
lesson: source-alg-07
format: choice
prompt: "Which edge cost invalidates Dijkstra's usual guarantee of a shortest path?"
options: ["0","2","10","−2"]
answer: [3]
explanation: "A negative edge can later improve a distance the algorithm already settled."
```

```question
id: battle-alg-08-dependencies
title: Field check
lesson: source-alg-08
format: multiple
prompt: "F(0)=0, F(1)=1, and F(n)=F(n−1)+F(n−2). Which two entries directly determine F(6)?"
options: ["F(3)","F(4)","F(5)","F(7)"]
answer: [1,2]
explanation: "The recurrence for F(6) reads F(5) and F(4)."
```

```question
id: battle-alg-08-tabulate
title: Field check
lesson: source-alg-08
format: ordering
prompt: "A table uses T(0)=2 and T(n)=T(n−1)+n. Order the work needed to fill through T(3)."
options: ["Enter T(0)","Calculate T(1)","Calculate T(2)","Calculate T(3)"]
answer: [0,1,2,3]
explanation: "Every entry after the base case uses the immediately preceding entry."
```

```question
id: battle-alg-08-routes
title: Field check
lesson: source-alg-08
format: choice
prompt: "A counter sums the ways to reach a square from the left or above. There are 3 ways to its left neighbor and 5 to its upper neighbor. How many ways reach the square?"
options: ["2","5","8","15"]
answer: [2]
explanation: "The possible last moves are distinct, so add the counts from the two neighbors."
```

```question
id: battle-alg-08-cache
title: Field check
lesson: source-alg-08
format: multiple
prompt: "A route lookup is called twice with the same state. Which steps allow memoization to avoid doing the work twice?"
options: ["Check the cache before recomputing","Store the first computed result under that state","Clear the cache after each result","Always use the same cache key for different states"]
answer: [0,1]
explanation: "Store results by state and look up the matching state before doing the work again."
```

```question
id: battle-alg-09-shortage
title: Field check
lesson: source-alg-09
format: choice
prompt: "You stock 3 units and demand is 5. Each unmet unit costs 4 credits. What is the shortage cost?"
options: ["2","4","8","20"]
answer: [2]
explanation: "Demand exceeds stock by two units, so the shortage costs 2 × 4 credits."
```

```question
id: battle-alg-09-leftovers
title: Field check
lesson: source-alg-09
format: multiple
prompt: "You stock 4 units. Leftovers cost 2 credits each and unmet units cost 3 each. Which outcomes cost exactly 6 credits?"
options: ["Demand is 1","Demand is 2","Demand is 5","Demand is 6"]
answer: [0,3]
explanation: "Demand of 1 leaves three leftovers. Demand of 6 leaves two units unmet. Both cost 6."
```

```question
id: battle-alg-09-compare-stock
title: Field check
lesson: source-alg-09
format: choice
prompt: "One unit of demand is as likely as three. Leftovers cost 1 credit each and shortages cost 5 each. Which of stocking 1, 2 or 3 units has the lowest expected cost?"
options: ["Stock 1","Stock 2","Stock 3","All three tie"]
answer: [2]
explanation: "The expected costs for stocking 1, 2, and 3 are 5, 3, and 1 credit respectively."
```

```question
id: battle-alg-09-weight-outcomes
title: Field check
lesson: source-alg-09
format: ordering
prompt: "Order the steps for finding expected inventory cost for a fixed stock level."
options: ["Calculate the cost for each demand outcome","Multiply each outcome cost by its probability","Add the weighted costs"]
answer: [0,1,2]
explanation: "Weight every possible outcome by its probability and sum the contributions."
```

```question
id: battle-alg-10-passes
title: Field check
lesson: source-alg-10
format: choice
prompt: "You have two passes and can earn 4, 9 and 6 points on days 1, 2 and 3. Each day allows at most one pass. Which days maximize total points?"
options: ["Days 1 and 2","Days 1 and 3","Days 2 and 3","Day 2 only"]
answer: [2]
explanation: "Saving both passes for the two highest rewards earns 9 + 6 = 15 points."
```

```question
id: battle-alg-10-update-state
title: Field check
lesson: source-alg-10
format: ordering
prompt: "Use one pass today, starting with two passes. Order the steps that determine tomorrow's options."
options: ["Read today's remaining pass count","Spend one pass on today's action","Carry one pass into tomorrow","Check which actions one pass allows"]
answer: [0,1,2,3]
explanation: "Today's action changes the remaining pass count used by tomorrow's decision."
```

```question
id: battle-alg-10-risky-reward
title: Field check
lesson: source-alg-10
format: choice
prompt: "Spend your only pass now for 5 points or save it for tomorrow, when it pays 12 points half the time and zero otherwise. Which choice maximizes expected points?"
options: ["Spend today for 5","Save it for an expected 6","Save it for an expected 12","Either choice gives 5"]
answer: [1]
explanation: "Saving yields 0.5 × 12 + 0.5 × 0 = 6 expected points."
```

```question
id: battle-alg-10-plan-value
title: Field check
lesson: source-alg-10
format: multiple
prompt: "A repair earns 6 points today and makes a 3-point task available tomorrow. A reroute earns 2 today and opens an 8-point task tomorrow. Which comparisons are correct?"
options: ["Repair pays more today","Reroute pays more across both days","Repair totals 11 points","Both plans total 9 points"]
answer: [0,1]
explanation: "Repair totals 6 + 3 = 9, while reroute totals 2 + 8 = 10."
```

```question
id: battle-ds-02-physical-order
title: Field check
lesson: source-ds-02
format: multiple
prompt: "A list's head is C, with links C→A→B. Moving a record can change its address. Which changes preserve the list's logical order?"
options: ["Move B and update A's link to its new address","Move C and update the head to its new address","Change the head to A","Change C's next link from A to B"]
answer: [0,1]
explanation: "The head still selects C and the links still lead from C to A to B when their stored addresses are updated."
```

```question
id: battle-ds-02-ring
title: Field check
lesson: source-ds-02
format: choice
prompt: "A ring's links are A→B→C→A. If B is the head, what are the first three records in a traversal?"
options: ["A, B, C","B, A, C","B, C, A","C, A, B"]
answer: [2]
explanation: "Start at B regardless of how the ring is drawn. Following its links reaches C and then A."
```

```question
id: battle-ds-04-remove-head
title: Field check
lesson: source-ds-04
format: choice
prompt: "The list starts at A and follows A→B→C. What single update removes A from the list while keeping B and C reachable?"
options: ["Set the head to B","Set the head to C","Set B's next link to A","Clear A's next link"]
answer: [0]
explanation: "B becomes the first reachable node and retains its link to C."
```

```question
id: battle-ds-04-append
title: Field check
lesson: source-ds-04
format: multiple
prompt: "An empty list has both head and tail set to None. You append a new node X whose next link is None. Which references must now point to X?"
options: ["The head","The tail","X's next link","The head of a different list"]
answer: [0,1]
explanation: "The only node is both first and last. Its next link stays None."
```

```question
id: battle-ds-04-middle-remove
title: Field check
lesson: source-ds-04
format: ordering
prompt: "Unlink B from A→B→C and clear its next link. Put the steps in order so C stays reachable from A throughout."
options: ["Read C from B's next link","Set A's next link to C","Clear B's next link"]
answer: [0,1,2]
explanation: "Read B's successor and connect A to it before clearing B's link."
```

```question
id: battle-ds-04-cycle
title: Field check
lesson: source-ds-04
format: choice
prompt: "A singly linked list starts at A and follows A→B→C→None. Someone sets C's next link to B. What happens if traversal keeps following links until None?"
options: ["It stops normally at C","It skips B after visiting A","It loops between B and C","It follows the same order in reverse"]
answer: [2]
explanation: "The traversal now returns from C to B and never sees a None link."
```

```question
id: battle-ds-06-peek
title: Field check
lesson: source-ds-06
format: multiple
prompt: "A FIFO queue contains N, R and T in arrival order. You peek once. Which statements are true immediately afterward?"
options: ["Peek returned N","The next dequeue still returns N","Peek removed N","T moved to the front"]
answer: [0,1]
explanation: "Peek reads the front without changing the queue, so N remains next to be dequeued."
```

```question
id: battle-ds-06-fifo-priority
title: Field check
lesson: source-ds-06
format: choice
prompt: "Audit job A arrives before emergency job B. Which rule serves B next because it is urgent?"
options: ["FIFO removal","Priority-based removal with urgent jobs ranked first","Peeking twice","Adding B at the rear of a FIFO queue"]
answer: [1]
explanation: "A priority queue can serve a newer job first when its priority outranks the waiting job."
```

```question
id: battle-ds-07-shared-parent
title: Field check
lesson: source-ds-07
format: choice
prompt: "A case file must keep two distinct parent-folder links, one to Archive and one to Fieldwork. How can you model both without duplicating the file?"
options: ["Store it as a single node with both parent links in a graph","Put it at the top of a stack","Use a rooted tree where it has just one parent","Put the newer parent in a FIFO queue"]
answer: [0]
explanation: "A general graph can retain links to both parent folders. An ordinary rooted tree allows one parent per non-root node."
```

```question
id: battle-ds-07-tree-paths
title: Field check
lesson: source-ds-07
format: multiple
prompt: "Which statements hold in an ordinary rooted tree?"
options: ["Each non-root node has one parent","The root has a unique path to each node","Each node must have exactly two children","A child can also be an ancestor of its own parent"]
answer: [0,1]
explanation: "A rooted tree has a single parent for each non-root node, which gives one path from the root."
```

```question
id: battle-ds-07-containment
title: Field check
lesson: source-ds-07
format: ordering
prompt: "The Records cabinet contains Case 4. Case 4 contains Evidence, and Evidence contains Tape 9. Order the path from the cabinet to the tape."
options: ["Records","Case 4","Evidence","Tape 9"]
answer: [0,1,2,3]
explanation: "Each step descends one level of containment in the hierarchy."
```

```question
id: battle-ds-07-tree-or-graph
title: Field check
lesson: source-ds-07
format: choice
prompt: "The relay links East–West, West–South, and South–East must all be represented. Why can't these links all be the edges of a tree?"
options: ["The links form a cycle","There are only three relays","A tree cannot branch","The names have no natural order"]
answer: [0]
explanation: "The links return to East without retracing an edge, creating a cycle. A tree has no cycles."
```

```question
id: battle-ds-09-directed-route
title: Field check
lesson: source-ds-09
format: ordering
prompt: "Starting at S, follow the only outgoing edge at each step until G. The graph also contains G→S. Edges on the way are S→R, B→G and R→B. Order the visited vertices up to the first arrival at G."
options: ["S","R","B","G"]
answer: [0,1,2,3]
explanation: "Follow S→R→B→G in the stated direction. The edge out of G is beyond the requested route."
```

```question
id: battle-ds-10-correction
title: Field check
lesson: source-ds-10
format: choice
prompt: "A reviewer changes one incorrect timestamp and exports the corrected records in the same format. What should the journal record?"
options: ["A child revision linked to the original","Only a file-format conversion","An unrelated root revision","A copy with identical records"]
answer: [0]
explanation: "The timestamp correction changes the records, so the new revision should record the original as its parent."
```

```question
id: battle-ds-10-provenance
title: Field check
lesson: source-ds-10
format: multiple
prompt: "Two reports disagree after a timestamp correction. Which journal entries help a reviewer establish the correction's provenance?"
options: ["The corrected revision's parent ID","The reason the reviewer made the correction","The color of the folder icon","The width of the report's columns"]
answer: [0,1]
explanation: "The parent identifies the source revision and the recorded reason explains why the change was made."
```

```question
id: battle-ds-10-same-records
title: Field check
lesson: source-ds-10
format: multiple
prompt: "Which actions can change the saved bytes while preserving the represented records?"
options: ["Export the same records from CSV to JSON","Change the JSON indentation without editing values","Change one recorded timestamp","Remove one case from the dataset"]
answer: [0,1]
explanation: "Format and whitespace affect the byte sequence without changing the record values."
```

```question
id: battle-ds-10-trace-revision
title: Field check
lesson: source-ds-10
format: choice
prompt: "Revision R3 names R2 as its parent. R2 names R1 as its parent. Which revision is R3's immediate predecessor?"
options: ["R1","R2","R3","Every earlier revision"]
answer: [1]
explanation: "R3 directly names R2 as its parent. R1 is an ancestor one step further back."
```

```question
id: battle-ai-03-detector-precision
title: Field check
lesson: source-ai-03
format: choice
prompt: "A detector flags 8 packets, and 6 of those are truly rogue. What is the precision of its flags?"
options: ["25%","60%","75%","80%"]
answer: [2]
explanation: "Precision is true flags divided by all flags, so 6 ÷ 8 = 75%."
```

```question
id: battle-ai-03-missed-signals
title: Field check
lesson: source-ai-03
format: ordering
prompt: "Order the steps for calculating rogue-packet recall from an evaluation set."
options: ["Identify all truly rogue packets from their labels","Count the truly rogue packets the detector flagged","Divide the flagged rogue count by the total rogue count"]
answer: [0,1,2]
explanation: "Recall is the share of actual rogue packets the detector found."
```

```question
id: battle-ai-04-leaky-compare
title: Field check
lesson: source-ai-04
format: ordering
prompt: "Order the outputs from smallest to largest when these activation rules receive −5."
options: ["Leaky ReLU with negative slope 0.2","Leaky ReLU with negative slope 0.1","Ordinary ReLU"]
answer: [0,1,2]
explanation: "The outputs are −1, −0.5 and 0. The larger negative-branch slope gives the more negative output."
```

```question
id: battle-ai-05-signed-errors
title: Field check
lesson: source-ai-05
format: multiple
prompt: "Actual counts are 7 and 12. Their forecasts are 10 and 9. Using forecast minus actual for each error, which results are correct?"
options: ["Signed bias of 0","Mean absolute error of 3","Signed bias of 3","Mean absolute error of 0"]
answer: [0,1]
explanation: "The signed errors +3 and −3 cancel, while both magnitudes are 3."
```

```question
id: battle-ai-06-pinball-under
title: Field check
lesson: source-ai-06
format: choice
prompt: "For a P80 forecast of 40 and actual demand of 50, what is the pinball loss?"
options: ["2","8","10","40"]
answer: [1]
explanation: "The forecast is 10 too low, so the underprediction loss is 0.8 × 10 = 8."
```

```question
id: battle-ai-07-state-summary
title: Field check
lesson: source-ai-07
format: multiple
prompt: "You want to update the exact mean of a growing stream whenever one new reading arrives. Which stored values do you need alongside that reading?"
options: ["The previous number of readings","The previous mean","The previous maximum","The first reading's timestamp"]
answer: [0,1]
explanation: "The previous mean and count reconstruct the previous total. Add the new reading and divide by the new count."
```

```question
id: battle-ai-07-drift-window
title: Field check
lesson: source-ai-07
format: choice
prompt: "A signal's usual value jumps from about 10 to about 30. Which average will typically react fastest if the jump persists?"
options: ["The mean of the latest 5 readings","The mean of the latest 500 readings","The mean of 10,000 earlier readings plus every new reading","The mean computed before the jump and never updated"]
answer: [0]
explanation: "The five-reading window drops the old observations most quickly."
```

```question
id: battle-ai-08-rank-score
title: Field check
lesson: source-ai-08
format: ordering
prompt: "A user vector [2, 1] scores items by dot product. Rank these item vectors from highest score to lowest."
options: ["[3, 1]","[1, 2]","[0, 1]"]
answer: [0,1,2]
explanation: "The dot-product scores are 7, 4 and 1 in descending order."
```

```question
id: battle-ai-10-batch-loss
title: Field check
lesson: source-ai-10
format: ordering
prompt: "Two validation batches have different numbers of examples. Order the steps for computing the overall mean loss from each batch's mean and size."
options: ["Multiply each batch mean by its example count","Add the batch loss totals","Divide by the total number of examples"]
answer: [0,1,2]
explanation: "Weighting each batch mean by its size recovers its total loss before averaging across examples."
```
