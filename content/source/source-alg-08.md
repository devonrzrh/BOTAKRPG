---
type: lesson
id: source-alg-08
title: Dynamic Programming (DP)
topic: algorithms
summary: Chapter 9 · Dynamic Programming (DP)
prerequisites:
  - source-alg-07
source: Source/Content/Markdown/1_Algorithm/08 dynamic programming.md
---

# Chapter 8: Dynamic Programming (DP)
Dynamic programming is an algorithm design technique.
## Contents

- [1. What Is Dynamic Programming?](#1-what-is-dynamic-programming)
- [2. Example: Fibonacci Numbers](#2-example-fibonacci-numbers)
- [3. Memoization (Top-Down)](#3-memoization-top-down)
- [4. Tabulation (Bottom-Up)](#4-tabulation-bottom-up)
- [5. Check Your Understanding](#5-check-your-understanding)
- [References](#references)
## 1. What Is Dynamic Programming?

**Dynamic programming** solves a problem by breaking it into **smaller subproblems**, **saving the answers**, and **reusing those answers** instead of solving the same subproblem repeatedly.

Intuitively: *"If I already figured out the answer to this smaller problem, why calculate it all over again?"*

This connects directly to [Recursion and Call Stack](#lesson=source-alg-04).

DP is especially useful when **subproblems overlap**, so their answers would otherwise be recomputed. For optimization problems it also needs **optimal substructure**: an optimal overall solution can be assembled from optimal solutions to the relevant smaller states. Merely writing a recursive function does not make it dynamic programming.

## 2. Example: Fibonacci Numbers

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

## 3. Memoization (Top-Down)

**Memoization** is recursion **plus a memory/cache**. The first time we compute a subproblem, we store the answer. The next time we need it, we look it up.

```python
def fibonacci_memo(n, memo=None):
    if not isinstance(n, int):
        raise TypeError("n must be an integer")
    if n < 0:
        raise ValueError("n must be non-negative")
    if n <= 1:
        return n

    if memo is None:
        memo = {}

    # Only compute a result if we have not saved it yet.
    if n not in memo:
        memo[n] = (
            fibonacci_memo(n - 1, memo)
            + fibonacci_memo(n - 2, memo)
        )

    return memo[n]


print(fibonacci_memo(6))  # 8
```

## 4. Tabulation (Bottom-Up)

**Tabulation** starts with the smallest answers and builds up to the one we need, usually with a **loop** rather than recursion.

```python
def fibonacci_table(n):
    if not isinstance(n, int):
        raise TypeError("n must be an integer")
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

Both versions print `8` for `n = 6`. They also handle `0` and `1`, and reject negative or non-integer inputs. The memoized function accepts an optional dictionary for reusing correctly computed Fibonacci values; even an initially empty dictionary works because the base cases are checked separately.

Both versions perform **`O(n)` arithmetic steps**, whereas straightforward recursive Fibonacci takes exponential time by repeating calculations. Both versions here store up to **`O(n)` values**; the memoized version also uses `O(n)` call-stack space. These bounds treat integer arithmetic as constant time; Python's Fibonacci integers grow with `n`, so their storage and arithmetic bit costs also grow. For large `n`, prefer iteration to avoid Python's recursion-depth limit. If only the final Fibonacci number is needed, tabulation can keep just the previous two values rather than the entire table.

- **Dijkstra is generally classified as a greedy algorithm:** It repeatedly selects the unprocessed node with the smallest tentative distance.
- **Dynamic programming is a different design technique:** It solves and reuses answers to subproblems rather than repeatedly solving them from scratch.

They can both work with intermediate costs, but **they do not work in exactly the same way**.

## 5. Check Your Understanding

Why does memoization help with `fib(5)`? What do the two implementations return for `n = 0` and `n = 1`?

**Answer:** Calls such as `fib(3)` and `fib(2)` repeat; saving their results avoids computing them again. Both implementations return `0` and `1`, respectively.


## References

- MIT OpenCourseWare, 6.006 Introduction to Algorithms, Fall 2011, Lecture 19: Fibonacci, memoization, and bottom-up dynamic programming.
