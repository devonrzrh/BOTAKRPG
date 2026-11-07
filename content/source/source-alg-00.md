---
type: lesson
id: source-alg-00
title: Introduction to Python Programming
topic: algorithms
summary: Chapter 1 · Introduction to Python Programming
prerequisites: []
source: Source/Content/Markdown/Algorithm/00 introduction to python programming.md
---

# Introduction to Python Programming

> **Purpose:** Learn enough Python syntax to read and understand the code examples in the algorithms modules. This module assumes no prior Python experience.

## Learning Objectives

By the end of this module, you should be able to:
- Create and update variables using basic Python data types.
- Read simple statements, conditions, and indented code blocks.
- Compare values using relational (comparison) operators and combine conditions with logical operators.
- Use `for` and `while` loops to repeat tasks.
- Define and call functions, and understand `return`.
- Work with lists, dictionaries, and sets.
- Recognize basic imports and diagnose common programming errors.

---

## 1. Variables and Basic Data Types

A **variable** is a name that refers to a value. You can think of it as a label attached to information your program uses.

```python
age = 18
name = "Alex"
height = 1.75
is_student = True

print(name)  # Alex
print(age)   # 18
```

In Python, you do not need to declare the variable's type beforehand. Python determines it based on the assigned value.

| Data type | Meaning | Example |
|---|---|---|
| `int` | Whole number | `10`, `-3` |
| `float` | Decimal number | `3.14` |
| `str` | Text (string) | `"Hello"` |
| `bool` | Boolean value | `True`, `False` |
| `list` | Ordered, changeable collection | `[4, 2, 7]` |

A variable can be updated:

```python
score = 10
score = score + 5
print(score)  # 15
```

**Note:** The `=` symbol means *assignment* (store a value), not mathematical equality.

![The name score refers to 10 before reassignment and 15 after adding 5.](/materials/Assets/Algorithms/Static/python-assignment.svg)

### Basic arithmetic

| Operator | Meaning | Example | Result |
|---|---|---|---|
| `+` | Add | `7 + 2` | `9` |
| `-` | Subtract | `7 - 2` | `5` |
| `*` | Multiply | `7 * 2` | `14` |
| `/` | Divide | `7 / 2` | `3.5` |
| `//` | Floor division | `7 // 2` | `3` |
| `%` | Remainder | `7 % 2` | `1` |
| `**` | Exponent | `2 ** 3` | `8` |

The remainder operator `%` is useful for checking if a number is even:

```python
number = 8
print(number % 2 == 0)  # True
```

---

## 2. Statements and Conditional Statements

A **statement** tells Python to perform an action. Assignment, printing, and making decisions are all examples.

```python
x = 10          # Assignment statement
print(x)        # Print statement
```

A **conditional statement** makes a decision based on whether a condition is true or false:

```python
temperature = 30

if temperature > 30:
    print("It's hot!")
elif temperature == 30:
    print("It's warm!")
else:
    print("It's cool!")
```

Python tests the branches from top to bottom, executes the first matching branch, and skips the others. `else` runs only if no previous condition matches.

**Indentation matters:** The four spaces before `print()` tell Python that the statement belongs to that branch. Unlike some languages, Python uses indentation to group code.

![The comparison 30 > 30 is false; 30 == 30 is true, so only the warm branch runs.](/materials/Assets/Algorithms/Static/python-conditional.svg)

---

## 3. Relational (Comparison) Operators

**Relational operators** compare values and produce `True` or `False`.

| Operator | Meaning | Example | Result |
|---|---|---|---|
| `==` | Equal to | `5 == 5` | `True` |
| `!=` | Not equal to | `5 != 3` | `True` |
| `>` | Greater than | `8 > 4` | `True` |
| `<` | Less than | `3 < 7` | `True` |
| `>=` | Greater than or equal to | `5 >= 5` | `True` |
| `<=` | Less than or equal to | `4 <= 6` | `True` |

Remember:
- `x = 5` **assigns** the value `5` to `x`.
- `x == 5` **checks** whether `x` equals `5`.

---

## 4. Logical Operators

Logical operators allow you to combine or reverse conditions.

| Operator | Meaning | Example | Result |
|---|---|---|---|
| `and` | Both conditions must be true | `True and False` | `False` |
| `or` | At least one condition must be true | `True or False` | `True` |
| `not` | Reverses a Boolean value | `not True` | `False` |

```python
age = 20
has_ticket = True

if age >= 18 and has_ticket:
    print("Entry allowed")
else:
    print("Entry denied")
```

In this example, the program permits entry only if **both** conditions are true.

![A 20-year-old with a ticket satisfies both entry conditions; True and True permits entry.](/materials/Assets/Algorithms/Static/python-logical-entry.svg)

---

## 5. Loops

**Loops** repeat instructions so you do not need to write the same code multiple times.

### 5.1 `for` loops

A `for` loop visits values in an iterable (such as a range or list), one at a time.

```python
for i in range(5):
    print(i)
```

Output:

```text
0
1
2
3
4
```

`range(5)` produces the integers from `0` through `4` (the end is excluded).

![The iteration pointer moves through 0, 1, 2, 3, and 4; each value joins the output.](/materials/Assets/Algorithms/Animated/python-for-range.svg)

[Static version for print](/materials/Assets/Algorithms/Static/python-for-range.svg)

You can also loop directly over a list:

```python
numbers = [8, 3, 5]

for number in numbers:
    print(number)
```

This is a common pattern in **linear search** and **sorting**.

### 5.2 `while` loops

A `while` loop keeps repeating **as long as its condition remains true**.

```python
count = 0

while count < 5:
    print(count)
    count += 1
```

`count += 1` is shorthand for `count = count + 1`. Without a change that eventually makes the condition false, a loop may run indefinitely.

![The loop prints counts 0 through 4; when count reaches 5, count < 5 is false and it stops.](/materials/Assets/Algorithms/Static/python-while-trace.svg)

### 5.3 `break` and `continue`

- `break` exits the nearest loop immediately.
- `continue` skips the rest of the current iteration and moves to the next one.

```python
for number in [2, 4, 7, 8]:
    if number == 7:
        break
    print(number)
# Prints 2 and 4
```

**Algorithm connection:** Binary search commonly uses a `while` loop to repeatedly narrow its search interval.

---

## 6. Functions and Return Values

A **function** is a reusable block of code. You define it using `def`, pass information in through **parameters**, and optionally send a result back using `return`.

```python
def add(a, b):
    return a + b

result = add(3, 5)
print(result)  # 8
```

Here, `a` and `b` are parameters; `3` and `5` are arguments. `return` sends `8` back to the place where the function was called. It is different from `print()`, which only displays something.

![Values 3 and 5 enter parameters a and b; the returned value 8 moves to result in the caller.](/materials/Assets/Algorithms/Animated/python-function-return.svg)

[Static version for print](/materials/Assets/Algorithms/Static/python-function-return.svg)

Functions are especially important for understanding **recursion**: a recursive function calls itself on a smaller version of the problem.

```python
def countdown(n):
    if n == 0:       # Base case: stop
        return
    print(n)
    countdown(n - 1) # Recursive call

countdown(3)
# Prints 3, 2, 1
```

---

## 7. Lists, Dictionaries, and Sets

These collections are useful throughout algorithms.

### 7.1 Lists

A **list** stores an ordered sequence of values. Its elements are indexed starting at `0`.

```python
numbers = [8, 3, 5, 1]

print(numbers[0])  # 8
numbers[1] = 10
numbers.append(7)
print(numbers)     # [8, 10, 5, 1, 7]
print(len(numbers)) # 5
```

Lists are commonly used for **sorting**, **searching**, and storing dynamic programming results.

![The value at index 1 becomes 10, then 7 moves into new index 4; the list becomes [8, 10, 5, 1, 7].](../../../Assets/Algorithms/Animated/python-list-update.svg)

[Static version for print](/materials/Assets/Algorithms/Static/python-list-update.svg)

### 7.2 Dictionaries

A **dictionary** stores **key–value pairs**.

```python
distances = {"A": 0, "B": 4, "C": 7}

print(distances["B"])  # 4
distances["C"] = 5
```

Dictionaries are often used to store distances or parent nodes in **graph algorithms**.

### 7.3 Sets

A **set** stores unique values and supports fast membership checks on average.

```python
visited = set()
visited.add("A")
visited.add("B")

print("A" in visited)  # True
```

A `visited` set is commonly used in **BFS** and **DFS** to avoid repeatedly exploring the same node.

![The dictionary key B retrieves 4; an unordered set containing A and B answers that A is present.](/materials/Assets/Algorithms/Static/python-dictionary-set.svg)

---

## 8. Imports and Standard Libraries

An **import** makes code from another module available for you to use. Python's standard library offers many helpful tools.

```python
from collections import deque

queue = deque(["A"])
queue.append("B")
print(queue.popleft())  # A
```

`deque` is useful for **BFS**, where a first-in, first-out queue is needed.

```python
import heapq

costs = [5, 2, 8]
heapq.heapify(costs)
print(heapq.heappop(costs))  # 2
```

`heapq` is often used to implement a **priority queue** in Dijkstra's algorithm and A*.

---

## 9. Basic Debugging and Error Handling

**Debugging** means identifying and fixing problems in a program.

| Error type | Description | Example |
|---|---|---|
| Syntax error | Python cannot understand the way code is written | Missing `:` after `if` |
| Runtime error | An error occurs during execution | `10 / 0` |
| Logical error | The program runs but produces the wrong result | Using `<` instead of `>` |

### Example: Find the logical error

```python
numbers = [3, 7, 2, 9]

for number in numbers:
    if number < 5:
        print("Greater than 5:", number)
```

The label says "Greater than 5," but the condition selects numbers **less than 5**. The fix is:

```python
numbers = [3, 7, 2, 9]

for number in numbers:
    if number > 5:
        print("Greater than 5:", number)
```

Output:

```text
Greater than 5: 7
Greater than 5: 9
```

![The wrong condition selects 3 and 2; the corrected condition selects 7 and 9 as intended.](/materials/Assets/Algorithms/Static/python-debug-comparison.svg)

### Practical debugging habits

1. **Read the error message:** It often identifies the line and the type of error.
2. **Print intermediate values:** Check what variables hold at important stages.
3. **Test simple and edge cases:** Try empty lists, one-element lists, and repeated values where appropriate.
4. **Use breakpoints:** An editor's debugger can pause execution and let you inspect values step by step.
5. **Check your logic:** Code that runs without errors may still produce incorrect results.

---

## 10. Bringing It Together: Linear Search

The following program combines variables, lists, loops, comparisons, conditionals, functions, and return values.

```python
def linear_search(numbers, target):
    for index in range(len(numbers)):
        if numbers[index] == target:
            return index
    return -1

values = [8, 3, 5, 1]
print(linear_search(values, 5))   # 2
print(linear_search(values, 10))  # -1
```

**Walkthrough:**
1. The function receives a list and a target.
2. The loop visits each index in order.
3. `==` checks whether the current element matches the target.
4. If a match is found, `return index` ends the function immediately.
5. If every element has been checked without a match, the function returns `-1`.

This is the foundation for understanding more advanced searching algorithms.

![A comparison pointer checks 8, 3, then 5 and stops at index 2; a search for 10 would return -1.](/materials/Assets/Algorithms/Animated/python-linear-search.svg)

[Static version for print](/materials/Assets/Algorithms/Static/python-linear-search.svg)

## Quick Self-Check

1. What is the difference between `=` and `==`?
2. Why does `range(5)` end at `4`, not `5`?
3. When would you use a `while` loop instead of a `for` loop?
4. What is the difference between `return` and `print()`?
5. Why might a graph-search algorithm use a `visited` set?
6. If a program runs but prints the wrong numbers, what category of error is that?

## Suggested Further Reading

- [Python Official Tutorial](https://docs.python.org/3/tutorial/)
- [Python Tutorial: Control Flow Tools](https://docs.python.org/3/tutorial/controlflow.html)
- [Python Tutorial: Data Structures](https://docs.python.org/3/tutorial/datastructures.html)
- [Python Documentation: `collections.deque`](https://docs.python.org/3/library/collections.html#collections.deque)
- [Python Documentation: `heapq`](https://docs.python.org/3/library/heapq.html)

**Next module:** [Introduction to Algorithms](#lesson=source-alg-01) — now that you can read the Python code, focus on *what each algorithm is doing* and *why it works*.
