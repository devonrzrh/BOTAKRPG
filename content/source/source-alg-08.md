---
type: lesson
id: source-alg-08
title: Dynamic Programming (DP)
topic: algorithms
summary: Chapter 9 · Dynamic Programming (DP)
prerequisites:
  - source-alg-07
source: Source/Content/Markdown/Algorithm/08 dynamic programming.md
---

# Dynamic Programming (DP)
Dynamic programming is a major algorithm designing technique.

## What Is Dynamic Programming?

**Dynamic programming** solves a problem by breaking it into **smaller subproblems**, **saving the answers**, and **reusing those answers** instead of solving the same subproblem repeatedly.

Intuitively: *"If I already figured out the answer to this smaller problem, why calculate it all over again?"*

This connects directly to [Recursion and Call Stack](#lesson=source-alg-04).

## Example: Fibonacci Numbers

The Fibonacci sequence starts:

```text
0, 1, 1, 2, 3, 5, 8, 13, ...
```

Every new number is the sum of the two preceding numbers:

```text
fib(0) = 0
fib(1) = 1
fib(n) = fib(n - 1) + fib(n - 2)
```

If we solve `fib(5)` using ordinary recursion, we repeatedly solve the same smaller problems:

```text
fib(5)
├── fib(4)
│   ├── fib(3)
│   │   ├── fib(2)
│   │   └── fib(1)
│   └── fib(2)   <-- already calculated above!
└── fib(3)       <-- already calculated above!
```

Here is the issue: **the same calculations happen again and again**.

Dynamic programming avoids that repetition by **remembering previously computed answers**.

## Memoization (Top-Down)

**Memoization** is recursion **plus a memory/cache**. The first time we compute a subproblem, we store the answer. The next time we need it, we look it up.

```python
def fibonacci_memo(n, memo=None):
    if n < 0:
        raise ValueError("n must be non-negative")

    if memo is None:
        memo = {0: 0, 1: 1}  # Base cases.

    # Only compute a result if we have not saved it yet.
    if n not in memo:
        memo[n] = (
            fibonacci_memo(n - 1, memo)
            + fibonacci_memo(n - 2, memo)
        )

    return memo[n]


print(fibonacci_memo(6))  # 8
```

## Tabulation (Bottom-Up)

**Tabulation** starts with the smallest answers and builds up to the one we need, usually with a **loop** rather than recursion.

```python
def fibonacci_table(n):
    if n < 0:
        raise ValueError("n must be non-negative")
    if n <= 1:
        return n

    table = [0, 1]

    for i in range(2, n + 1):
        table.append(table[i - 1] + table[i - 2])

    return table[n]


print(fibonacci_table(6))  # 8
```

Both versions compute `fib(n)` in **`O(n)` time**, whereas the straightforward recursive approach repeats many calculations and takes **exponential time**. Both versions here save up to **`O(n)`** values. The memoized version also uses the recursion call stack.

- **Dijkstra is generally classified as a greedy algorithm:** It repeatedly selects the unprocessed node with the smallest tentative distance.
- **Dynamic programming is a different design technique:** It solves and reuses answers to subproblems rather than repeatedly solving them from scratch.

They can both work with intermediate costs, but **they do not work in exactly the same way**.
