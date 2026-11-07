# B.O.T.A.K. Lab · Test Bank V1.0

- **Team:** B.O.T.A.K. (Nicky Wijaya Suhendra, Devon Reinhart, Darren Tan Siswanto, Neil Edric, Novan Ertanto Vijaya, Glen Randy Erlanda)
- **Module:** Algorithms, Data Structures & Connectionist AI
- **Version:** Test Bank V1.0 · Stage 2 · November 2026 · companion to Study Guide V1.0
- **Contents:** Part A: 40 true/false · Part B: 42 multiple choice · Part C: 13 open-ended · Answer key (after Part C)

> **Botak-Bot says: how to use this Test Bank**
>
> Topic coverage follows the Study Guide V1.0: algorithms (M1–M4), data structures (M5–M7) and connectionist AI (M8–M12). Each question is labelled with the Study Guide mission it tests (M1 = Mission 1, and so on). Answer all questions first, then check the answer key. Every answer is explained, so read the explanation even when you were right.
>
> Several questions reuse examples from the guide's labs (the six score cards, the maze, the A–F tree, the weighted S–G graph, the coin-change problem, the book stack, the binary search tree, the friendship network and the corridor robot). Everything you need is in the question; no internet access is required.

| Mission | Topic | T/F | MC | Open |
| --- | --- | --- | --- | --- |
| M1 | What is an algorithm? | 1–3 | 1–2 | — |
| M2 | Sorting (bubble, selection, insertion) | 4–10 | 3–6 | 1–2 |
| M3 | Searching and Big-O | 11–13 | 7–10 | 1, 3 |
| M4 | BFS, DFS and greedy algorithms | 14–17 | 11–15 | 4–5 |
| M5 | Arrays and linked lists | 18–19 | 16–18 | 6 |
| M6 | Stacks, queues, recursion | 20–23 | 19–23 | 4 |
| M7 | Trees and graphs | 24–27 | 24–27 | 7 |
| M8 | Neurons and learning | 28–30 | 28–30 | 8 |
| M9 | Activations and applications | 31–32 | 31–33 | 9 |
| M10 | Forecasting | 33–35 | 34–36 | 10 |
| M11 | Online learning and recommenders | 36–37 | 37–39 | 11 |
| M12 | Reinforcement learning and training | 38–40 | 40–42 | 12–13 |

---

## Part A · True or false

Write **T** (true) or **F** (false) for each statement. If false, say what would make it true.

| No. | Statement | Mission | T / F |
| --- | --- | --- | --- |
| A1 | An algorithm must finish after a finite number of steps. | M1 |   |
| A2 | An algorithm and a program are exactly the same thing. | M1 |   |
| A3 | Pseudocode must follow the exact syntax of one programming language. | M1 |   |
| A4 | After the first pass of bubble sort (ascending order), the largest value is in the last position. | M2 |   |
| A5 | Bubble sort with an early-exit check needs only one pass on a list that is already sorted. | M2 |   |
| A6 | In the worst case, bubble sort's running time grows as O(n log n). | M2 |   |
| A7 | After the first pass of selection sort (ascending order), the smallest value is in the first position. | M2 |   |
| A8 | Selection sort makes fewer comparisons on an already-sorted list than on a list in reverse order. | M2 |   |
| A9 | Insertion sort on an already-sorted list of n items makes only n − 1 comparisons. | M2 |   |
| A10 | Insertion sort keeps a sorted part at the start of the list and inserts each next item into its correct place in that part. | M2 |   |
| A11 | Binary search works correctly on any list, whether it is sorted or not. | M3 |   |
| A12 | An O(1) operation takes about the same time no matter how many items there are. | M3 |   |
| A13 | If an algorithm is O(n²), doubling the input size roughly doubles the work. | M3 |   |
| A14 | BFS explores every cell one step away from the start before it explores any cell two steps away. | M4 |   |
| A15 | DFS always finds the route with the fewest steps. | M4 |   |
| A16 | Dijkstra's algorithm is an example of a greedy algorithm. | M4 |   |
| A17 | A greedy algorithm always finds the best possible solution. | M4 |   |
| A18 | Reading the item at index 2 of an array takes O(1) time. | M5 |   |
| A19 | In a singly linked list, you can jump directly to the 50th node without visiting the earlier nodes. | M5 |   |
| A20 | A stack follows the first in, first out (FIFO) rule. | M6 |   |
| A21 | BFS uses a queue to decide which location to explore next. | M6 |   |
| A22 | A recursive function can work correctly without a base case, as long as the input is small. | M6 |   |
| A23 | A deque (double-ended queue) allows items to be added and removed at both ends. | M6 |   |
| A24 | In a binary search tree, every value in a node's left subtree is smaller than that node's value. | M7 |   |
| A25 | In an undirected graph, an edge can only be followed in one direction. | M7 |   |
| A26 | Inserting the keys 1, 3, 8, 10 into an empty binary search tree in that order produces a balanced tree. | M7 |   |
| A27 | In a binary search tree, the successor of a key is the next larger key in sorted order. | M7 |   |
| A28 | In an artificial neuron, the bias is multiplied by one of the inputs before it is added. | M8 |   |
| A29 | A single neuron that draws one straight line can learn XOR. | M8 |   |
| A30 | A dense layer with 3 inputs and 4 neurons has 16 parameters. | M8 |   |
| A31 | Stacking many layers without non-linear activation functions still gives a network that can only learn linear (straight-line) relationships. | M9 |   |
| A32 | A defect detector that is 98% accurate on bottles of which 2% are defective must be good at finding defects. | M9 |   |
| A33 | Before testing a forecasting model, the time series should be shuffled randomly and then split into training and test sets. | M10 |   |
| A34 | Actual demand should be at or below a well-calibrated P90 forecast about 90% of the time. | M10 |   |
| A35 | A positive forecast bias means the forecasts are, on average, too low. | M10 |   |
| A36 | In online learning, the model is updated after each new example arrives. | M11 |   |
| A37 | Collaborative filtering needs a description of each item's content, such as its genre, to make recommendations. | M11 |   |
| A38 | In reinforcement learning, the agent is told the correct action for each state. | M12 |   |
| A39 | With a discount factor of γ = 0, the agent cares only about the immediate reward. | M12 |   |
| A40 | A training loss far lower than the validation loss is a sign of overfitting. | M12 |   |

---

## Part B · Multiple choice

Choose **one** answer unless the question says **Select all that apply**.

**B1.** Which of the following is **not** a required property of an algorithm? *[M1]*

- **A)** It produces an output.
- **B)** Its steps are precise and unambiguous.
- **C)** It is written in Python.
- **D)** It finishes after a finite number of steps.

**B2.** In a flowchart, which shape is used for a yes/no decision such as "Is score > highest?" *[M1]*

- **A)** Oval
- **B)** Rectangle
- **C)** Diamond
- **D)** Parallelogram

**B3.** Bubble sort (ascending) is applied to [5, 1, 4]. What is the list after the **first** pass? *[M2]*

- **A)** [1, 5, 4]
- **B)** [1, 4, 5]
- **C)** [5, 4, 1]
- **D)** [4, 1, 5]

**B4.** How many comparisons does bubble sort **with early exit** make on the already-sorted list [29, 40, 72, 85, 91, 100]? *[M2]*

- **A)** 0
- **B)** 5
- **C)** 15
- **D)** 36

**B5.** Selection sort (ascending) is applied to [4, 3, 1, 2]. What is the list after the **first** pass? *[M2]*

- **A)** [1, 3, 4, 2]
- **B)** [3, 1, 2, 4]
- **C)** [1, 2, 3, 4]
- **D)** [1, 4, 3, 2]

**B6.** Insertion sort is working on [40, 72, 85, 29]. The first three cards are already in order. How many comparisons does it make to insert 29? *[M2]*

- **A)** 1
- **B)** 3
- **C)** 4
- **D)** 6

**B7.** Binary search looks for 14 in [2, 4, 6, 8, 10, 12, 14, 16], always checking the lower middle when there is an even number of items. Which values does it check, in order? *[M3]*

- **A)** 2, 4, 6, 8, 10, 12, 14
- **B)** 10, 14
- **C)** 8, 14
- **D)** 8, 12, 14

**B8.** A sorted list has 1,024 items. How many times can binary search halve the range before only one item is left? *[M3]*

- **A)** 10
- **B)** 32
- **C)** 512
- **D)** 1,024

**B9.** Which growth rate means the **most** work for very large n? *[M3]*

- **A)** O(1)
- **B)** O(log n)
- **C)** O(n)
- **D)** O(n²)

**B10.** Which operation takes O(n) time in the worst case? *[M3]*

- **A)** Reading an array item by its index
- **B)** Linear search in an unsorted list
- **C)** Pushing onto a stack
- **D)** Dequeuing the front item of a queue

**B11.** During BFS on the B.O.T.A.K. maze, what does the number written in each cell mean? *[M4]*

- **A)** The order in which DFS visited it
- **B)** The number of walls next to it
- **C)** Its row number
- **D)** Its number of steps from S along a shortest route

**B12.** A tree has root A; A's children are B and C; B's children are D and E; C's child is F. Visiting left neighbours first, which is a **BFS** order from A? *[M4]*

- **A)** A, B, D, E, C, F
- **B)** A, B, C, D, E, F
- **C)** A, C, F, B, E, D
- **D)** D, E, B, F, C, A

**B13.** Using the same tree and visiting left neighbours first, which is a **DFS** order from A? *[M4]*

- **A)** A, B, C, D, E, F
- **B)** A, C, B, F, E, D
- **C)** F, E, D, C, B, A
- **D)** A, B, D, E, C, F

**B14.** Dijkstra's algorithm runs on a graph with edges S–A (1), A–G (8), S–B (2), B–C (2) and C–G (2). What is the cheapest cost from S to G? *[M4]*

- **A)** 9
- **B)** 4
- **C)** 6
- **D)** 5

**B15.** Coins come in 1, 3 and 4. Botak-Bot gives 6 in change using the greedy rule "take the biggest coin that still fits". How many coins does it use, and is that the fewest possible? *[M4]*

- **A)** 2 coins; yes, it is the fewest
- **B)** 3 coins; no, 2 coins is possible
- **C)** 3 coins; yes, it is the fewest
- **D)** 4 coins; no, 3 coins is possible

**B16.** A program reads items by their position very often and almost never inserts items in the middle. Which structure fits best? *[M5]*

- **A)** Array
- **B)** Singly linked list
- **C)** Stack
- **D)** Queue

**B17.** Which statement about a singly linked list is correct? *[M5]*

- **A)** Each node stores a value and a link to the next node.
- **B)** Its nodes must be stored next to each other in memory.
- **C)** Reaching the k-th node takes O(1) time.
- **D)** It cannot grow after it is created.

**B18.** The array [72, 85, 91] has room for one more item. What is the array after inserting 80 at index 1? *[M5]*

- **A)** [80, 72, 85, 91]
- **B)** [72, 85, 80, 91]
- **C)** [72, 80, 91, 85]
- **D)** [72, 80, 85, 91]

**B19.** Start with an empty stack. Do: push A, push B, pop, push C, push D, pop. Which item is on top now? *[M6]*

- **A)** A
- **B)** B
- **C)** C
- **D)** D

**B20.** Start with an empty queue. Do: enqueue Ana, enqueue Ben, enqueue Cai, dequeue, enqueue Dee, dequeue. Who is at the front now? *[M6]*

- **A)** Ana
- **B)** Ben
- **C)** Cai
- **D)** Dee

**B21.** **Select all that apply.** Which are typical uses of a stack? *[M6]*

- **A)** Undo history in an editor
- **B)** Checking that brackets match
- **C)** Serving print jobs in the order they arrive
- **D)** Keeping track of function calls

**B22.** factorial(n) returns 1 when n == 1, and otherwise returns n × factorial(n − 1). When factorial(3) runs, which call **finishes (returns) first**? *[M6]*

- **A)** factorial(3)
- **B)** factorial(2)
- **C)** factorial(1)
- **D)** They all finish at the same time

**B23.** Which describes an **input-restricted** deque? *[M6]*

- **A)** Items are added at one end only, but can be removed from both ends.
- **B)** Items can be added at both ends, but are removed from one end only.
- **C)** Items are removed in order of priority.
- **D)** Items can only be added when the deque is empty.

**B24.** In a friendship network, Nicky is linked to Darren and Neil, Neil is linked to Glen, and Darren is linked to Glen. Using BFS from Nicky, how many edges are on the shortest route to Glen? *[M7]*

- **A)** 1
- **B)** 3
- **C)** 2
- **D)** 4

**B25.** A binary search tree has root 8, left child 3 (whose left child is 1) and right child 10. Where is 5 inserted? *[M7]*

- **A)** Right child of 3
- **B)** Left child of 1
- **C)** Left child of 10
- **D)** It becomes the new root

**B26.** A BST has root 8 with children 3 and 10; 3 has left child 1 and right child 6, and 6 has right child 7. If 3 is deleted using its successor, which key takes its place? *[M7]*

- **A)** 1
- **B)** 6
- **C)** 7
- **D)** 8

**B27.** In the adjacency matrix of the friendship network (Nicky–Darren, Nicky–Neil, Darren–Glen, Neil–Glen), what is in the cell for row Nicky, column Glen? *[M7]*

- **A)** 1
- **B)** 2
- **C)** 0
- **D)** Darren, Neil

**B28.** A ReLU neuron has inputs [1, 3], weights [0.5, −0.5] and bias 0.2. What is its output? *[M8]*

- **A)** 0
- **B)** −0.8
- **C)** 0.8
- **D)** 2.2

**B29.** How many parameters (weights and biases) does a dense layer with 4 inputs and 2 neurons have? *[M8]*

- **A)** 8
- **B)** 6
- **C)** 12
- **D)** 10

**B30.** A weight is 0.5, its gradient is 2 and the learning rate is 0.1. What is the weight after one gradient-descent step? *[M8]*

- **A)** 0.7
- **B)** 0.3
- **C)** 0.48
- **D)** 0.2

**B31.** A network must decide which of 10 digits (0–9) is in an image. Which output activation fits best? *[M9]*

- **A)** Sigmoid
- **B)** Softmax
- **C)** Linear (no activation)
- **D)** Softplus

**B32.** Why is ReLU usually preferred to sigmoid in the hidden layers of a deep network? *[M9]*

- **A)** ReLU always outputs values between 0 and 1.
- **B)** ReLU makes the network linear, which is easier to train.
- **C)** ReLU's slope is 1 for positive inputs, so the learning signal shrinks less across many layers.
- **D)** ReLU never outputs 0.

**B33.** **Select all that apply.** Which situations suit a neural network well? *[M9]*

- **A)** Recognising objects in thousands of labelled photos
- **B)** Converting speech to text
- **C)** Adding up a short list of prices exactly
- **D)** Predicting from 10 rows of data when every decision must be fully explained

**B34.** Actual sales are [10, 20, 30] and the forecasts are [12, 18, 33]. What is the mean absolute error (MAE)? *[M10]*

- **A)** 1
- **B)** 7
- **C)** 2.33
- **D)** 0.33

**B35.** Running out of a cake loses 4 in profit, and each leftover cake wastes 1. Using the newsvendor rule, which quantile of the demand forecast should the shop stock to? *[M10]*

- **A)** P80
- **B)** P20
- **C)** P50
- **D)** P100

**B36.** A P90 (τ = 0.9) forecast is 110 and the actual value is 100. What is the pinball loss? *[M10]*

- **A)** 9
- **B)** 10
- **C)** 0
- **D)** 1

**B37.** The mean of 5 values is 6. A sixth value, 12, arrives. What is the new mean, updated without storing the old values? *[M11]*

- **A)** 9
- **B)** 7
- **C)** 6.5
- **D)** 12

**B38.** A recommender shows 5 films. 2 of them are relevant to the user, who has 4 relevant films in total. What are Precision@5 and Recall@5? *[M11]*

- **A)** 0.5 and 0.4
- **B)** 0.4 and 0.4
- **C)** 0.5 and 0.5
- **D)** 0.4 and 0.5

**B39.** Two users rate three films: A = [3, 4, 0] and B = [4, 3, 0]. What is their cosine similarity? *[M11]*

- **A)** 0.96
- **B)** 1
- **C)** 0.5
- **D)** 0

**B40.** Q-learning: Q(s, a) = 0.5, α = 0.2, γ = 0.9, reward r = 1, and the best Q-value in the next state is 1. What is the new Q(s, a)? *[M12]*

- **A)** 1.9
- **B)** 0.38
- **C)** 1.4
- **D)** 0.78

**B41.** An agent uses the ε-greedy rule with ε = 0.1. What does it do? *[M12]*

- **A)** It always takes the action with the highest Q-value.
- **B)** It takes a random action about 90% of the time.
- **C)** It stops training when its reward falls below 0.1.
- **D)** It takes a random action about 10% of the time and the best-known action otherwise.

**B42.** After training, the training loss and the validation loss are both high and close together. What is the most likely diagnosis? *[M12]*

- **A)** Underfitting
- **B)** Overfitting
- **C)** A perfect fit
- **D)** The test set was used for tuning

---

## Part C · Open-ended

Answer in full sentences. Aim for **at least 100 words** per question, or equivalent working (tables, diagrams, calculations). Show your reasoning: the explanation earns more credit than the final answer alone.

**C1.** Bubble sort with early exit is run on two lists: [72, 85, 40, 29, 100, 91] and [29, 40, 72, 85, 91, 100]. Trace both runs (passes, comparisons and swaps). Use your results to explain the difference between bubble sort's best case and worst case, and why it is usually described as O(n²). *[M2, M3]*

**C2.** Selection sort and insertion sort are both run on [72, 85, 40, 29, 100, 91]. Trace both (the list after each pass or step, with comparisons and swaps or shifts). Then a class leaderboard is already sorted and one new score is added at the end: explain which of the two sorts you would use to put it in place, and why. *[M2]*

**C3.** A school database has 1,000,000 student IDs. Explain why binary search needs at most about 20 checks while linear search may need 1,000,000. Then describe one situation in which you would still choose linear search, and justify your choice. *[M3]*

**C4.** BFS stores waiting locations in a queue. Explain how the queue makes BFS explore "in waves" of increasing distance. Then explain what would change if the queue were replaced by a stack, using the A–F tree (A → B, C; B → D, E; C → F) or the B.O.T.A.K. maze as an example. *[M4, M6]*

**C5.** Use the graph with edges S–A (1), A–G (8), S–B (2), B–C (2) and C–G (2). (a) Which route does BFS find from S to G, and what does it cost? (b) Trace Dijkstra's algorithm round by round and give the cheapest route. (c) A "greedy walker" always takes the cheapest edge out of its current vertex: what does it do? (d) Both Dijkstra's algorithm and the walker are greedy. Explain why only one of them is guaranteed to find the cheapest route. *[M4]*

**C6.** A music app has two features: (1) a leaderboard where the app constantly reads "the song at position k"; (2) a playlist editor where users often insert songs in the middle of the current list. Choose a data structure for each feature and justify each choice using the cost of the important operations. Mention one disadvantage of each choice. *[M5]*

**C7.** Start with the binary search tree with root 8, left child 3 (whose left child is 1) and right child 10. Insert 6, then 9, then 14, explaining each decision. Draw the final tree and write its inorder traversal. Then explain why searching a BST is usually faster than checking every value, and what goes wrong if the same seven values are inserted in increasing order. *[M7]*

**C8.** A neuron has no activation: ŷ = w × x + b, with w = 0.5, b = 0 and squared-error loss L = (ŷ − y)². One training example has x = 2 and target y = 3. (a) Do the forward pass and calculate the loss. (b) The gradient for w is 2(ŷ − y) × x. Calculate it and update w with learning rate 0.1. (c) Calculate the new prediction and loss. (d) Explain in your own words what each step of training (forward pass, loss, backward pass, update) does, and why many such steps over many examples are needed. *[M8]*

**C9.** Botak-Bot builds a network with 10 hidden layers that have no activation functions, followed by one sigmoid output neuron. (a) Explain, using algebra or a clear example, why the 10 hidden layers add no extra power: the network can still only draw a straight-line boundary. (b) After adding sigmoid to every hidden layer, the early layers barely learn. Explain why, using sigmoid's maximum slope of 0.25. (c) Suggest two fixes. (d) Choose an output activation for each: a house price; spam or not spam; one of 5 animal species; the standard deviation of a forecast. *[M9]*

**C10.** A bakery sells croissants. Week 1 (Mon–Fri): 30, 25, 28, 27, 40. Week 2: 32, 26, 29, 28, 42. Week 3 (actual): 31, 27, 31, 29, 45. (a) Make a seasonal naive forecast for week 3 and calculate the errors (forecast − actual), MAE, WAPE and bias. (b) Explain why a seasonal naive forecast is a sensible baseline for this data, and why the data must not be shuffled before testing a model. (c) A croissant costs 1 to make and sells for 3. Which quantile of the forecast should the bakery stock to, and why is this above the median? *[M10]*

**C11.** A video app recommends videos to its users. (a) Users A = [3, 4, 0], B = [4, 3, 0] and C = [0, 0, 5] rated three videos. Calculate the cosine similarity of A with B and of A with C, and explain which user's ratings should influence A's recommendations most. (b) A new user joins with no history. Name this problem and describe two ways to handle it. (c) Over a holiday, viewing habits change suddenly and the model's errors rise. Name this effect and explain how online learning and a sliding window of recent data help. (d) Explain one risk of a feedback loop in recommendations. *[M11]*

**C12.** A robot learns in a corridor of cells 0, 1, 2, 3; the goal is cell 3 (reward +1 on arriving, 0 for other moves). Q(s, right) starts at 0 everywhere, and Q at the goal is always 0. Use α = 1 and γ = 0.8, and let the robot always move right from cell 0. (a) Calculate Q(0, right), Q(1, right) and Q(2, right) after each of episodes 1, 2 and 3. (b) Explain why value spreads backwards one cell per episode. (c) Explain why a real agent also needs exploration, for example ε-greedy, and why the reward must be designed carefully. *[M12]*

**C13.** Four students train classifiers and report: (1) training loss 0.02, validation loss 0.45; (2) training and validation loss both stuck at 0.9; (3) the loss becomes NaN after a few steps; (4) a classifier for 10 equally common classes starts with a loss of 9.7. Diagnose each case and suggest a fix. Then explain the different jobs of the training, validation and test sets, and why tuning on the test set is a mistake. *[M12]*

---

## Answer key

### Part A · True or false

| No. | Answer | Explanation |
| --- | --- | --- |
| A1 | **True** | Finiteness is a required property. Instructions that could run forever are not an algorithm. |
| A2 | **False** | An algorithm is the step-by-step method. A program is one implementation of that method in a programming language; one algorithm can be written as many programs. |
| A3 | **False** | Pseudocode is programming-like but has no fixed syntax. It describes the steps without the rules of a particular language. |
| A4 | **True** | Each comparison carries the larger value to the right, so the largest value "bubbles" to the end in pass 1. |
| A5 | **True** | The first pass makes no swaps, so the swapped flag stays false and the algorithm stops (n − 1 comparisons). |
| A6 | **False** | Its worst case is O(n²): up to n − 1 passes, each comparing up to n − 1 pairs. |
| A7 | **True** | Pass 1 scans the whole list for the smallest value and swaps it into the first position. |
| A8 | **False** | Selection sort always scans the whole unsorted part to find the smallest value, so it makes n(n − 1)/2 comparisons whatever the order: 15 for six items, sorted or not. |
| A9 | **True** | Each card after the first is compared once with its left neighbour, which is not bigger, so it stays where it is: n − 1 comparisons, O(n). |
| A10 | **True** | That is how it works: like sorting cards in your hand, each new card moves left past the bigger cards and drops into the gap. |
| A11 | **False** | Binary search needs sorted data. Discarding half the list is only safe because the order tells us which half cannot contain the target. |
| A12 | **True** | O(1) means constant time: the work does not grow with n (e.g. reading an array item by its index). |
| A13 | **False** | (2n)² = 4n², so the work roughly quadruples. It is O(n) algorithms whose work roughly doubles. |
| A14 | **True** | BFS uses a queue, so it explores in order of distance: all of distance 1, then all of distance 2, and so on. |
| A15 | **False** | DFS follows one branch as deep as it can. The first route it finds may be long; BFS is the one that guarantees the fewest steps when every move costs the same. |
| A16 | **True** | Each round it settles the unsettled vertex with the smallest known total cost and never changes that choice. With no negative costs, this greedy choice is always safe. |
| A17 | **False** | Greedy algorithms take the best-looking step each time, which can fail. With coins 1, 3 and 4, greedy change for 6 is 4 + 1 + 1 (3 coins), but 3 + 3 uses only 2. |
| A18 | **True** | Array items are stored side by side, so the computer calculates the position and jumps straight to it. |
| A19 | **False** | Nodes are found by following links from the head, so reaching the 50th node means passing through the 49 before it (O(n)). |
| A20 | **False** | A stack is last in, first out (LIFO): the most recently pushed item is popped first. A queue is FIFO. |
| A21 | **True** | The queue makes earlier-discovered (closer) locations come out first, which gives BFS its level-by-level order. |
| A22 | **False** | Without a base case the function never stops calling itself, whatever the input; the call stack grows until the program fails (in Python, a RecursionError). Every recursive function needs a base case. |
| A23 | **True** | That is what "double-ended" means. Input-restricted and output-restricted deques limit one of the two operations to one end. |
| A24 | **True** | That is the BST rule: left subtree smaller, right subtree larger. It lets a search go left or right at each node. |
| A25 | **False** | Undirected edges work both ways, like a friendship: if Nicky is linked to Neil, Neil is linked to Nicky. Edges with one direction belong to a directed graph. |
| A26 | **False** | Each new key is larger than all the others, so each becomes a right child: the tree is a chain of height 4, and searching it is as slow as a linked list (O(n)). |
| A27 | **True** | If the node has a right subtree, the successor is the smallest key there; otherwise it is the first ancestor reached from a left child. |
| A28 | **False** | Each input is multiplied by its weight; the bias is then added on its own. It shifts the result, like the b in y = mx + b. |
| A29 | **False** | XOR's two 1s are on opposite corners, (0, 1) and (1, 0), and no single straight line separates them from (0, 0) and (1, 1). A hidden layer is needed. |
| A30 | **True** | 3 × 4 = 12 weights plus 4 biases = 16. |
| A31 | **True** | Each layer computes Wx + b, and two such layers combine into one: W₂(W₁x + b₁) + b₂ = (W₂W₁)x + (W₂b₁ + b₂). Any number of them is still one linear function. |
| A32 | **False** | A model that always answers "ok" is 98% accurate on this data and finds no defects at all. For rare events, check recall: the share of real defects that are found. |
| A33 | **False** | Time series must be split by time: train on the past and test on the future. Shuffling lets the model learn from days that come after the test days, so the results look better than real use. |
| A34 | **True** | That is the meaning of the 90% quantile. If demand is below it much less often, the forecast is too low; much more often, too high. |
| A35 | **False** | Bias = average of (forecast − actual). A positive bias means the forecasts are too high on average; a negative bias means too low. |
| A36 | **True** | Online learning updates after every single example and then discards it. Batch learning trains on all the data at once. |
| A37 | **False** | Collaborative filtering uses only the pattern of ratings or clicks across users. Content-based filtering is the method that uses item features. |
| A38 | **False** | The agent only receives rewards, often only at the end. It must discover good actions by trial and error. Being told the correct answer is supervised learning. |
| A39 | **True** | Later rewards are multiplied by γ, γ², …, which are all 0. A γ close to 1 makes the agent far-sighted. |
| A40 | **True** | The model fits the training data much better than new data, so it has memorised details instead of learning the general pattern. |

*Balance check: 20 true, 20 false.*

### Part B · Multiple choice

| No. | Answer | Reasoning |
| --- | --- | --- |
| B1 | **C** | An algorithm can be written in any form (steps, pseudocode, flowchart) or any language. A, B and D are required properties: output, definiteness and finiteness. |
| B2 | **C** | Diamond = decision. Oval = start/end, rectangle = process step, parallelogram = input/output. |
| B3 | **B** | 5 > 1, swap → [1, 5, 4]; 5 > 4, swap → [1, 4, 5]. Option A is the list after only the first comparison. |
| B4 | **B** | One pass compares the 5 neighbouring pairs, makes no swaps, and stops. Without the early-exit check it would always make all 5 passes: 5 + 4 + 3 + 2 + 1 = 15 comparisons, even on a sorted list. |
| B5 | **A** | Pass 1 finds the smallest value, 1, and swaps it with the first card, 4: [1, 3, 4, 2]. Option B is one pass of bubble sort, option C is the fully sorted list, and option D shifts the others instead of swapping. |
| B6 | **B** | 29 is compared with 85, 72 and 40. Each is bigger, so each shifts right and 29 reaches the front: 3 comparisons, 3 shifts. |
| B7 | **D** | Middle of 8 items = 8 (14 is larger, keep 10–16); middle = 12 (keep 14–16); middle = 14, found. Option A is linear search. |
| B8 | **A** | 1,024 → 512 → 256 → 128 → 64 → 32 → 16 → 8 → 4 → 2 → 1 is 10 halvings, because 2¹⁰ = 1,024. |
| B9 | **D** | For large n: 1 < log n < n < n². For n = 1,000,000, n² is a trillion. |
| B10 | **B** | Linear search may check all n items. The other three are O(1) operations. |
| B11 | **D** | BFS numbers each cell with its distance from S, wave by wave. That is why G's number (7) is the length of the shortest route. |
| B12 | **B** | BFS goes level by level: A (distance 0), B and C (distance 1), then D, E, F (distance 2). Option A is the DFS order. |
| B13 | **D** | DFS goes as deep as possible first: A → B → D, back to B → E, back to A → C → F. |
| B14 | **C** | Settle S (0) → A = 1, B = 2; settle A → G = 9; settle B → C = 4; settle C → G = min(9, 6) = 6. The route is S → B → C → G. Option A (9) is the fewest-edges route S → A → G that BFS would choose. |
| B15 | **B** | Greedy takes 4, then 1, then 1: 3 coins. But 3 + 3 = 6 uses only 2 coins, so the greedy choice of 4 was not part of the best answer. |
| B16 | **A** | Arrays give O(1) access by index. Linked lists need O(n) to reach a position, and stacks and queues only give access at their ends. |
| B17 | **A** | That is the definition of a node. Nodes can be anywhere in memory (B false), reaching the k-th node takes O(n) (C false), and lists grow easily by adding nodes (D false). |
| B18 | **D** | Index 1 is the second position. 85 and 91 each shift one place right to make room, keeping their order. |
| B19 | **C** | [A] → [A, B] → pop B → [A] → [A, C] → [A, C, D] → pop D → [A, C]. The top is C. |
| B20 | **C** | Ana, Ben, Cai → Ana leaves → Ben, Cai, Dee → Ben leaves → Cai, Dee. Cai is at the front. |
| B21 | **A, B, D** | Undo, bracket matching and function calls all need the most recent item first (LIFO). Print jobs in arrival order need a queue (FIFO). |
| B22 | **C** | factorial(3) waits for factorial(2), which waits for factorial(1). The base case factorial(1) is the last call pushed onto the call stack and the first to return (LIFO); then factorial(2) returns 2, then factorial(3) returns 6. |
| B23 | **A** | Input (adding) is restricted to one end; removing is allowed at both ends. Option B describes an output-restricted deque, and option C a priority queue. |
| B24 | **C** | Distance 1: Darren and Neil. Distance 2: Glen (Nicky → Neil → Glen or Nicky → Darren → Glen). Nicky and Glen are not linked directly, so 1 is wrong. |
| B25 | **A** | 5 < 8, go left to 3; 5 > 3, go right; that spot is empty, so 5 becomes the right child of 3. |
| B26 | **B** | 3 has two children, so it is replaced by its successor, the smallest key in its right subtree: 6. Then 7 moves up into the old place of 6. Inorder afterwards: 1, 6, 7, 8, 10. |
| B27 | **C** | 0, because there is no edge between Nicky and Glen. They are two edges apart, but a matrix cell only records a direct edge. Option D is what an adjacency list stores for Nicky. |
| B28 | **A** | z = 0.5 × 1 − 0.5 × 3 + 0.2 = −0.8. ReLU turns negative values into 0, so the output is 0. Option B forgets the activation. |
| B29 | **D** | 4 × 2 = 8 weights plus 2 biases = 10. Option A forgets the biases. |
| B30 | **B** | new w = w − learning rate × gradient = 0.5 − 0.1 × 2 = 0.3. A positive gradient means increasing w would raise the loss, so w goes down. Option A moves in the wrong direction. |
| B31 | **B** | Softmax turns the 10 scores into probabilities that add up to 1, for choosing one class out of many. Sigmoid suits one yes/no output, linear suits any number, and softplus suits a number that must be above 0. |
| B32 | **C** | Sigmoid's slope is at most 0.25, so multiplying it across many layers makes the gradient vanish. ReLU is not bounded above (A false), is non-linear (B false), and outputs 0 for negative inputs (D false). |
| B33 | **A, B** | Neural networks shine with lots of data and messy inputs such as images and audio. Exact arithmetic needs a simple rule, and a tiny dataset that must be fully explained suits a simpler model. |
| B34 | **C** | The errors (forecast − actual) are +2, −2 and +3; their absolute values add up to 7, and 7 / 3 ≈ 2.33. Option A is the bias (average signed error), and option B is the total before dividing. |
| B35 | **A** | Stock to shortage cost ÷ (shortage cost + leftover cost) = 4 / (4 + 1) = 0.8, the P80. Running out costs four times more than a leftover, so it pays to stock above the median (P50). |
| B36 | **D** | The forecast is too high by 10, so the loss is (1 − 0.9) × 10 = 1. If it had been too low by 10, the loss would be 0.9 × 10 = 9 (option A). |
| B37 | **B** | new mean = old mean + (new value − old mean) / n = 6 + (12 − 6) / 6 = 7. Check: (5 × 6 + 12) / 6 = 42 / 6 = 7. Option A averages only the old mean and the new value. |
| B38 | **D** | Precision@5 = relevant shown / shown = 2 / 5 = 0.4. Recall@5 = relevant shown / all relevant = 2 / 4 = 0.5. Option A swaps them. |
| B39 | **A** | A · B = 12 + 12 + 0 = 24; \|A\| = \|B\| = √25 = 5; 24 / (5 × 5) = 0.96. Their tastes are very similar but not identical, so the answer is close to but below 1. |
| B40 | **D** | target = r + γ × max Q(s′, a′) = 1 + 0.9 × 1 = 1.9. new Q = 0.5 + 0.2 × (1.9 − 0.5) = 0.5 + 0.28 = 0.78. Option A is the target itself, which the update only moves part of the way towards. |
| B41 | **D** | With probability ε = 0.1 it explores (acts randomly); otherwise it exploits the best-known action. Option A would never explore, and option B swaps exploring and exploiting. |
| B42 | **A** | High error on both sets means the model has not learned the pattern: it is underfitting. Try a bigger model, train longer or improve the features. Overfitting shows low training error but high validation error. |

### Part C · Open-ended: expected key points

#### C1 [M2, M3]

**Key points a full answer includes:**

- Unsorted list: pass 1 → [72, 40, 29, 85, 91, 100] (5 comparisons, 3 swaps); pass 2 → [40, 29, 72, 85, 91, 100] (4, 2); pass 3 → sorted (3, 1); pass 4 makes no swaps (2, 0) and stops. Total 14 comparisons, 6 swaps.
- Sorted list: 1 pass, 5 comparisons, 0 swaps, then early exit.
- Best case (already sorted) is O(n) because of the early exit. Worst case (reverse order) needs n(n − 1)/2 comparisons, which grows as O(n²); average cases also grow as O(n²).
- Big-O describes growth for large inputs, so bubble sort is usually summarised by its worst/average case, O(n²).

*Marking note:* Accept a correct trace in any clear format (table or list). Award full credit only if the counts are right and the answer links them to best vs worst case.

#### C2 [M2]

**Key points a full answer includes:**

- Selection sort: passes select 29, 40, 72, 85 (already in place, no swap), 91 → [29, 85, 40, 72, 100, 91], [29, 40, 85, 72, 100, 91], [29, 40, 72, 85, 100, 91], unchanged, [29, 40, 72, 85, 91, 100]. 5 + 4 + 3 + 2 + 1 = 15 comparisons, 4 swaps.
- Insertion sort: insert 85 (1 comparison, 0 shifts), 40 (2, 2), 29 (3, 3), 100 (1, 0), 91 (2, 1). Total 9 comparisons, 6 shifts.
- Selection sort always scans the whole unsorted part, so it makes n(n − 1)/2 comparisons on any list. Insertion sort stops moving a card when it meets one that is not bigger: n − 1 comparisons on a sorted list (O(n)), n(n − 1)/2 in reverse order (O(n²)).
- Leaderboard: insertion sort. The old scores are already in order, so each one after the first needs only one comparison, and the new score moves left only past the bigger scores. Selection sort would still scan everything on every pass.

*Marking note:* Accept any clear trace format. Full credit needs correct counts for both sorts and a choice justified by how the starting order affects each sort.

#### C3 [M3]

**Key points a full answer includes:**

- Binary search halves the remaining range at every check; 2²⁰ = 1,048,576 ≥ 1,000,000, so about 20 halvings leave one item. This is O(log n).
- Linear search checks items one by one; if the ID is last or missing it checks all 1,000,000 (O(n)).
- Binary search requires sorted data. Valid reasons to choose linear search: the data is unsorted and will only be searched once (sorting first would cost more than one linear search); the list is very small; items are added constantly in no order.
- Strong answers mention that the speed advantage grows as n grows.

*Marking note:* Any reasonable situation is acceptable if it is justified by sortedness, list size, or how often the list is searched.

#### C4 [M4, M6]

**Key points a full answer includes:**

- Queue = FIFO: locations are explored in the order they were discovered. All distance-1 locations are discovered before any distance-2 locations, so they come out of the queue first; this creates the waves.
- With a stack (LIFO), the most recently discovered location is explored next, so the search dives down one branch before returning. This is depth-first search.
- Tree example: queue gives A, B, C, D, E, F; stack-based DFS (left first) gives A, B, D, E, C, F.
- Consequence: with a stack the first route found to the goal is not guaranteed to be the shortest.

*Marking note:* Accept either example. The answer must link FIFO/LIFO to the visiting order, not just name the structures.

#### C5 [M4]

**Key points a full answer includes:**

- (a) BFS counts edges, not costs: S → A → G has 2 edges (the fewest), cost 1 + 8 = 9.
- (b) Settle S (0): A = 1, B = 2. Settle A (1): G = 9. Settle B (2): C = 4. Settle C (4): G = min(9, 6) = 6. Settle G (6). Cheapest route S → B → C → G, cost 6.
- (c) From S the cheapest edge goes to A (1); from A the only new edge goes to G (8): S → A → G, cost 9.
- (d) The walker judges only the next edge. Dijkstra's algorithm always settles the vertex with the smallest total cost from the start; with no negative costs, no later route can make a settled vertex cheaper, so its greedy choices are safe.
- Strong answers add that a greedy rule must be checked on small examples, e.g. coins 1, 3, 4 for 6, where greedy fails.

*Marking note:* Accept any clear format for the trace (table or list). Full credit needs the correct costs 9 and 6 and a reason in (d) that refers to total cost from the start.

#### C6 [M5]

**Key points a full answer includes:**

- Leaderboard → array: access by index is O(1). Disadvantage: inserting or deleting in the middle requires shifting items, O(n).
- Playlist → linked list (doubly linked is also acceptable): inserting after a known song only changes links, O(1) once the position is known. Disadvantage: reaching position k takes O(n), and each node needs extra memory for its link(s).
- Strong answers note that the best structure depends on which operation is most frequent, and may mention that finding the insertion point in a list can still take O(n).

*Marking note:* Other justified answers are acceptable (e.g. a dynamic array for a short playlist) if the reasoning uses operation costs correctly.

#### C7 [M7]

**Key points a full answer includes:**

- 6: 6 < 8 go left to 3; 6 > 3 go right; empty, so 6 becomes the right child of 3. 9: 9 > 8 go right to 10; 9 < 10 go left; empty, so 9 becomes the left child of 10. 14: 14 > 8, 14 > 10, so 14 becomes the right child of 10.
- Inorder traversal (left, node, right): 1, 3, 6, 8, 9, 10, 14, which is sorted order.
- Each comparison sends the search left or right, so it skips a whole subtree. Searching for 9 visits only 8, 10 and 9 (3 nodes) instead of up to 7 values in a list.
- Inserting 1, 3, 6, 8, 9, 10, 14 in increasing order makes every value a right child, so the tree becomes a chain like a linked list; searching for 14 then visits all 7 nodes (O(n)). Self-balancing trees such as AVL trees prevent this.

*Marking note:* Full credit needs all three insertions placed correctly with reasons, the correct inorder traversal, and the chain problem explained.

#### C8 [M8]

**Key points a full answer includes:**

- (a) ŷ = 0.5 × 2 + 0 = 1; L = (1 − 3)² = 4.
- (b) gradient = 2 × (1 − 3) × 2 = −8. new w = 0.5 − 0.1 × (−8) = 1.3. The negative gradient means increasing w lowers the loss.
- (c) ŷ = 1.3 × 2 = 2.6; L = (2.6 − 3)² = 0.16, much lower than 4.
- (d) Forward pass: make a prediction. Loss: measure how wrong it is. Backward pass (backpropagation): find how each weight affects the loss. Update: move each weight a small step against its gradient; the learning rate sets the step size.
- One step improves the prediction for one example; repeating over many examples and epochs finds weights that work for the whole dataset. Too large a learning rate can overshoot.

*Marking note:* Full credit needs the correct numbers (4, −8, 1.3, 2.6, 0.16) and a clear explanation of each step. Accept updating b as well if it is done correctly (gradient −4, b = 0.4).

#### C9 [M9]

**Key points a full answer includes:**

- (a) Each layer computes Wx + b; two layers give W₂(W₁x + b₁) + b₂ = (W₂W₁)x + (W₂b₁ + b₂), which is again one linear function. So ten linear layers equal one; they cannot learn XOR or curved boundaries.
- (b) Backpropagation multiplies the gradient by each layer's activation slope. With sigmoid's slope at most 0.25 (and weights near 1), 10 layers shrink it to about 0.25¹⁰ ≈ 10⁻⁶: the vanishing gradient problem.
- (c) Any two of: ReLU in hidden layers; residual connections; good weight initialisation; normalisation.
- (d) House price: linear. Spam: sigmoid. 5 species: softmax. Standard deviation: softplus (must be above 0).

*Marking note:* Accept a numerical example instead of algebra in (a). Full credit needs both explanations and four correct output activations.

#### C10 [M10]

**Key points a full answer includes:**

- (a) Forecast = week 2: 32, 26, 29, 28, 42. Errors: +1, −1, −2, −1, −3. MAE = 8 / 5 = 1.6. WAPE = 8 / 163 ≈ 4.9%. Bias = −6 / 5 = −1.2 (slightly too low).
- (b) Sales repeat a weekly pattern (Friday highest, Tuesday lowest), which the seasonal naive forecast copies. A new model is only worth using if it beats this simple baseline. The split must follow time (train on the past, test on the future); shuffling leaks future information and makes test scores look too good.
- (c) Shortage cost = 3 − 1 = 2 (lost profit); leftover cost = 1 (waste). Stock to 2 / (2 + 1) = 2 / 3 ≈ 0.67, about the P67. Running out costs twice as much as a leftover, so it pays to stock above the most likely demand.

*Marking note:* Full credit needs correct numbers in (a) (MAE 1.6, WAPE ≈ 4.9%, bias −1.2), a reasoned baseline and splitting explanation, and the quantile 2/3.

#### C11 [M11]

**Key points a full answer includes:**

- (a) A · B = 24, |A| = |B| = 5, cosine = 0.96. A · C = 0, cosine = 0. B's ratings should count most; C has no overlap with A's taste in these videos.
- (b) Cold start. Use content features (category, length), popular videos, a short questionnaire, or show a mix of videos and learn quickly from clicks.
- (c) Concept drift (sudden). Online learning updates after each new example, so the model adapts quickly; training on a sliding window of recent data gives the new behaviour more influence. Watching the error rate shows when drift happens.
- (d) Users only click what they are shown, so the system shows more of the same: a filter bubble. Mixing in some new items (exploration) helps.

*Marking note:* Accept other valid cold-start strategies and drift responses (e.g. weighting recent data, retraining when a detector raises an alarm). Full credit needs both cosine values.

#### C12 [M12]

**Key points a full answer includes:**

- (a) Episode 1: Q(2) = 0 + 1 × (1 − 0) = 1; Q(0) and Q(1) stay 0. Episode 2: Q(1) = 0.8 × 1 = 0.8; Q(2) = 1. Episode 3: Q(0) = 0.8 × 0.8 = 0.64; Q(1) = 0.8; Q(2) = 1.
- (b) Each update looks only one step ahead, using the current Q of the next cell. A cell gains value only after the cell after it has some value, so the reward's value moves back one cell per episode, shrinking by γ each step.
- (c) Here the robot was forced to move right. A real agent does not know which action is good, so it must sometimes try actions at random (explore) to discover rewards; ε-greedy acts randomly with probability ε and otherwise takes the best-known action.
- Reward design: agents exploit loopholes, e.g. a boat-racing agent that circles to collect bonus points instead of finishing the race.

*Marking note:* With α = 1 the new Q equals the target r + γ × Q(next). Full credit needs all nine values in (a) and clear reasoning in (b) and (c).

#### C13 [M12]

**Key points a full answer includes:**

- (1) Overfitting: more data or augmentation, dropout, weight decay or early stopping.
- (2) Underfitting: a bigger model, longer training or better features.
- (3) The learning rate is too high: lower it or clip the gradients.
- (4) A fair guess across 10 classes gives a loss of about ln 10 ≈ 2.30, so 9.7 points to a bug (e.g. labels or the loss set up wrongly). Check the data pipeline first.
- Training set: fits the weights. Validation set: tunes settings and decides when to stop. Test set: one final, honest estimate. Tuning on the test set makes its score too optimistic, because the choices were fitted to it.

*Marking note:* Accept other reasonable fixes for each case. Full credit needs all four diagnoses and the roles of the three sets.

### Review record

The assignment requires another member to attempt and review every question. Record it here.

| Part | Written by | Attempted and checked by | Date | Corrections made |
| --- | --- | --- | --- | --- |
| A (A1–A40) | **[Team]** | **[Team]** | **[Date]** |   |
| B (B1–B42) | **[Team]** | **[Team]** | **[Date]** |   |
| C (C1–C13) | **[Team]** | **[Team]** | **[Date]** |   |
