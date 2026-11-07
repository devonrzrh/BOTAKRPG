# Time Complexity Analysis

Take a look at all of our examples so far:
* Bubble sort
* Selection sort
* Insertion sort
* Linear search
* Binary search

We've been using small examples, and datasets. now 
let **n** mean the number of items in the array. Time complexity describes how the number of operations on an algorithm grows as input size increases.

Take this example:
| Number of items | Linear search: maximum items checked | Binary search: maximum middle items checked | Bubble sort shown above: maximum neighboring comparisons |
| --- | --- | --- | --- |
| 10 | 10 | 4 | 45 |
| 100 | 100 | 7 | 4,950 |
| 1,000 | 1,000 | 10 | 499,500 |

These are the **worst** case scenarios, and they take particular actions, **not**  runtime. 

#### Remember, Time complexity is concerned  with how the amount of work grows as input gets larger.

For the growth labels used to describe these costs, see [Big O Notation](03%20binary%20search%20linear%20search%20and%20big%20o%20notation.md#big-o-notation).
