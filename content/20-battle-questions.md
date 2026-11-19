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
prompt: "Which pairs make 6 using coins from {1, 2, 3, 4}? Coins may repeat."
options: ["4 + 2","3 + 3","4 + 1","2 + 2"]
answer: [0,1]
explanation: "Both 4 + 2 and 3 + 3 satisfy the sum and coin limit."
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
explanation: "The first option averages to 4, and the second always costs 4."
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
prompt: "Which observations could justify investigating data drift?"
options: ["Recent inputs differ systematically from training inputs","Error rises across recent batches","The dashboard layout changed","The server case was replaced"]
answer: [0,1]
explanation: "Input changes or a sustained performance drop can signal drift worth investigating."
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
