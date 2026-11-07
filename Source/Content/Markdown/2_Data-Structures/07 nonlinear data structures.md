# Chapter 7: Nonlinear Data Structures
## Contents

- [1. What are nonlinear data structures?](#1-what-are-nonlinear-data-structures)
- [2. Characteristics](#2-characteristics)
- [3. Examples of Nonlinear Data Structures](#3-examples-of-nonlinear-data-structures)
- [4. Linear and nonlinear structures](#4-linear-and-nonlinear-structures)
- [Try it](#try-it)
- [References](#references)

## Try it

![Friendship graph with Nicky, Darren, Neil, and Glen.](../../../Assets/Data%20Structures/Static/friendship-graph.svg)

Which people can be reached directly from Nicky? Which person can be reached by following two edges from Nicky?

**Expected answer.** Darren and Neil can be reached directly. Glen can be reached in two steps through either Darren or Neil.
## 1. What are nonlinear data structures?

A nonlinear data structure does not arrange its elements in one sequence. Its elements connect in a hierarchy or a network. Some common examples are trees and graphs. They are useful when data has relationships that are difficult to represent as a simple linear sequence.

## 2. Characteristics

- Elements are connected through relationships rather than placed in one sequence.
- The structure can have multiple levels or branches.
- Traversal follows the structure's connections to visit elements.
- Trees represent hierarchical relationships, graphs represent networked relationships.
- How elements are connected affects how searching and traversal work.

## 3. Examples of Nonlinear Data Structures

- [Trees](08%20trees.md)

  ![A tree with root 8.](../../../Assets/Data%20Structures/Static/bst-shape.svg)
- [Graphs](09%20graphs.md)

  ![The friendship graph.](../../../Assets/Data%20Structures/Static/friendship-graph.svg)

## 4. Linear and nonlinear structures

| Linear structure | Nonlinear structure |
| --- | --- |
| Elements are arranged sequentially. | Elements connect hierarchically or as a network. |
| Positions in the sequence determine the order. | Trees can branch into levels. Graphs can connect vertices in a network. |
| Examples: arrays, linked lists, stacks, queues. | Examples: trees and graphs. |
| Traversal follows the sequence. | Traversal follows connections and depends on the structure. |


## References

- CompilerSutra, [Non-Linear Data Structures](https://www.compilersutra.com/docs/DSA/non-Linear-DSA/)
- GeeksforGeeks, [Difference between Linear and Non-linear Data Structures](https://www.geeksforgeeks.org/dsa/difference-between-linear-and-non-linear-data-structures/)
- Jessica Su, Stanford CS 161, [Lecture 8: Binary Search Trees](https://web.stanford.edu/class/archive/cs/cs161/cs161.1168/lecture8.pdf), sections 1 and 2 (ordered keys and balanced search trees).
