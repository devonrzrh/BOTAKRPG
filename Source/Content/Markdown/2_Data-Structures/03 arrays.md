# Chapter 3: Arrays

An array stores elements in an ordered sequence. The arrays described here hold values of one data type.

![Three scores, 72, 85, and 91, at indexes 0, 1, and 2.](../../../Assets/Data%20Structures/Static/array.svg)
## Contents

- [1. Characteristics](#1-characteristics)
- [2. Types](#2-types)
- [3. Operations](#3-operations)
- [4. Example: finding a score](#4-example-finding-a-score)
- [Try it](#try-it)
- [5. Application](#5-application)
- [6. Python example](#6-python-example)
- [References](#references)

## Try it

A list stores the numbers 4, 7, and 9 in that order. Use a linear search to find 7. How many values do you check? What changes if the target is 9?

**Expected answer:** Finding 7 takes two checks: 4, then 7. Finding 9 takes three checks: 4, 7, then 9. The search stops as soon as it finds the target.

**Insertion check.** The array `[72, 85, 91]` has room for one more item. What happens if you insert `80` at index `1`?

**Expected answer.** Shift `91` and then `85` one position to the right. Put `80` in the open slot to get `[72, 80, 85, 91]`.


## 1. Characteristics

- Elements are identified by an index, a number that marks a position in the sequence. In many languages, indexes start at `0`.
- Array elements are commonly stored in adjacent memory locations, meaning one after another in memory.
- An element can be accessed directly by its index. This is constant time, written `O(1)`: the access takes about the same time as the array grows.
- An array can have a fixed capacity.

## 2. Types

### 2.1 One-dimensional arrays (1D)

A one-dimensional array is a single sequence of elements.

Example: daily temperatures for one week.

![Seven daily temperatures stored in a one-dimensional array.](../../../Assets/Data%20Structures/Animated/temperature-array.svg)

![A single row with three numbered positions.](../../../Assets/Data%20Structures/Static/array-1d.svg)

### 2.2 Two-dimensional arrays (2D)

A two-dimensional array arranges elements in rows and columns. In some languages it is represented as an array of arrays.

Example: a grid of pixels in an image.

![Pixels arranged in rows and columns.](../../../Assets/Data%20Structures/Animated/pixel-grid.svg)

![A grid with two labeled rows and three labeled columns.](../../../Assets/Data%20Structures/Static/array-2d.svg)

### 2.3 Multidimensional arrays

An array can have more than two dimensions. A three-dimensional array, for example, can represent a set of 2D grids.

![Two layers, each containing a two-by-two grid.](../../../Assets/Data%20Structures/Static/array-3d.svg)

## 3. Operations

- **Access:** Use an index to get an element. For example, in an array containing 72, 85, and 91, the item at index 1 is 85 when indexing starts at zero.

  ![Access reads 85 directly from index 1.](../../../Assets/Data%20Structures/Animated/array-access.svg)

- **Update:** Replace the value at an index, such as changing the second score to 88.

  ![Update replaces 85 with 88 at index 1.](../../../Assets/Data%20Structures/Animated/array-update.svg)

- **Linear search:** Check items one at a time. You may need to check all `n` items, which takes `O(n)` time.

  ![Linear search checks 72, then 85, then 91.](../../../Assets/Data%20Structures/Animated/array-search.svg)

- **Binary search:** Check the middle item of a sorted range. If it does not match, keep the half that could contain the target and repeat. Halving the range at each step takes `O(log n)` time.

  ![Binary search compares 91 with the middle value 85, then finds 91 in the right half.](../../../Assets/Data%20Structures/Animated/array-binary-search.svg)

- **Insertion:** Add an element at a position. Elements after that position may need to shift right.

  ![Insertion shifts items right to make room at index 1.](../../../Assets/Data%20Structures/Animated/array-insert.svg)

- **Deletion:** Remove an element. Later elements may need to shift left to fill the gap.

  ![Deletion removes 85 and shifts 91 left to fill the gap.](../../../Assets/Data%20Structures/Animated/array-delete.svg)

Arrays are useful when the number of items is known or when items need frequent index-based access. They are less convenient when many insertions and deletions happen in the middle.

## 4. Example: finding a score

An array stores the scores 72, 85, and 91 in that order. To find 91 with a linear search, first compare 72, then 85, then 91. The third comparison finds the score. If there are `n` scores and the target is last or absent, the search may check all `n` items, so its time grows as `O(n)`.

## 5. Application

Nicky keeps three quiz scores in the order he took the quizzes. To find his second score, he reads index `1` because indexing starts at zero. The app can jump straight to `85` without checking the first score.

![Look up a score by position.](../../../Assets/Data%20Structures/Animated/application-scores.svg)

## 6. Python example

A Python list models an array with one spare slot, marked by `None`. The `-1` step in `range` makes the loop move from right to left, so each score is copied before its slot is overwritten.

```python
scores = [72, 85, 91, None]
print(scores[1])
# Open a slot at index 1 without overwriting any scores.
position = 1
for index in range(len(scores) - 1, position, -1):
    scores[index] = scores[index - 1]
scores[position] = 80
print(scores)
```

Expected output

```text
85
[72, 80, 85, 91]
```


## References

- GeeksforGeeks, [Introduction to Linear Data Structures](https://www.geeksforgeeks.org/dsa/introduction-to-linear-data-structures/)
