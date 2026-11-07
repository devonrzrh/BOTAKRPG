# Chapter 5: Time Complexity Analysis

Take a look at all of our examples so far:
* Bubble sort
* Selection sort
* Insertion sort
* Linear search
* Binary search

Let **n** mean the number of items in the input list. Time complexity describes how the number of operations grows as input size increases. It does not directly measure seconds: hardware, implementation, and input values also affect elapsed time.

Take this example:
| Number of items | Linear search: maximum items checked | Binary search: maximum middle items checked | Bubble sort shown above: maximum neighboring comparisons |
| --- | --- | --- | --- |
| 10 | 10 | 4 | 45 |
| 100 | 100 | 7 | 4,950 |
| 1,000 | 1,000 | 10 | 499,500 |

These are **worst-case operation counts**, not elapsed times. A binary-search “check” means one middle item inspected, even though the code may use more than one comparison on that item.

- Linear search can inspect all `n` items.
- For `n >= 1`, binary search inspects at most `floor(log2(n)) + 1` middle items. An empty list needs no inspections.
- Bubble sort's worst case makes `(n - 1) + (n - 2) + ... + 1 = n(n - 1)/2` neighboring-value comparisons.

In the usual model, indexing, comparing fixed-size values, and updating an index each cost constant time. If an operation compares long strings or manipulates large integers, its own cost may also need analysis.
## Contents

- [1. Best, Worst, and Average Cases](#1-best-worst-and-average-cases)
- [2. Space Matters Too](#2-space-matters-too)
- [3. Check Your Understanding](#3-check-your-understanding)
- [References](#references)
## 1. Best, Worst, and Average Cases

For linear search, the best case finds the target first (`O(1)`); the worst case finds it last or not at all (`O(n)`). An average-case claim needs an input distribution. For example, if a present target is equally likely to occupy any position, the average is `(n + 1)/2` inspections, still `O(n)`.

Big O gives an upper growth bound; it does not inherently mean “worst case.” A tight bound can also be written with **Theta**, such as `Θ(n)` for the worst-case linear-search inspection count. Constants and lower-order terms are omitted when describing growth.

## 2. Space Matters Too

**Auxiliary space** is extra memory beyond the input. The iterative binary search shown in the previous lesson uses `O(1)` auxiliary space because it stores only a few indices. Recursive factorial uses `O(n)` call-stack space. Faster time does not automatically mean lower memory use.

## 3. Check Your Understanding

If the input size doubles, approximately how does worst-case work change for linear search and bubble sort when `n` is large?

**Answer:** Linear search uses about twice the work; bubble sort uses about four times the comparisons. Binary search adds about one middle-item inspection.

### 3.1 Remember, Time complexity is concerned  with how the amount of work grows as input gets larger.

For the growth labels used to describe these costs, see [Big O Notation](03%20binary%20search%20linear%20search%20and%20big%20o%20notation.md#big-o-notation).


## References

- MIT OpenCourseWare, 6.006 Introduction to Algorithms, Fall 2011, “Python Cost Model” and Lecture 3: primitive-operation costs and asymptotic analysis.
