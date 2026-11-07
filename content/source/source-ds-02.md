---
type: lesson
id: source-ds-02
title: Linear Data Structures
topic: structures
summary: Chapter 2 · Linear Data Structures
prerequisites:
  - source-ds-01
source: Source/Content/Markdown/2_Data-Structures/02 linear data structures.md
---

# Chapter 2: Linear Data Structures
## Contents

- [1. What are linear data structures?](#1-what-are-linear-data-structures)
- [2. Characteristics](#2-characteristics)
- [3. Examples of Linear Data Structures](#3-examples-of-linear-data-structures)
- [References](#references)
## 1. What are linear data structures?

A linear data structure stores items in a sequence. **Traversal** means visiting the items in a data structure. In a linear structure, you can visit them in sequence.

A simple example is a queue of people waiting to buy tickets. Each person has someone in front and behind, except for the people at the two ends.

![Nicky is at the front of the ticket line, Darren is in the middle, and Neil is at the rear.](/materials/Assets/Data%20Structures/Animated/ticket-queue.svg)

## 2. Characteristics

Elements are arranged sequentially.
- A nonempty sequence has a logical first and last element. A circular implementation can link the last element back to the first.
- A traversal can follow the sequence from its logical first element to its last.
- The way elements are stored in memory depends on the type of structure. Array elements are commonly stored next to each other, while linked-list nodes can be in different locations.
- Some structures have a fixed capacity, others can grow or shrink as elements are added or removed.
- The time needed to access, search, insert, or delete an element depends on the structure and the operation.

![Items in a linear sequence.](/materials/Assets/Data%20Structures/Static/linear-order.svg)

## 3. Examples of Linear Data Structures

- [Arrays](#lesson=source-ds-03)

  ![Array scores at numbered positions.](/materials/Assets/Data%20Structures/Static/array.svg)

- [Linked Lists](#lesson=source-ds-04)

  ![Nodes connected by links.](/materials/Assets/Data%20Structures/Static/list-singly.svg)

- [Stacks](#lesson=source-ds-05)

  ![A stack with B on top of A.](/materials/Assets/Data%20Structures/Static/stack.svg)

- [Queues](#lesson=source-ds-06)

  ![A queue with Nicky at the front and Darren at the rear.](/materials/Assets/Data%20Structures/Static/queue.svg)


## References

- GeeksforGeeks, [Introduction to Linear Data Structures](https://www.geeksforgeeks.org/dsa/introduction-to-linear-data-structures/)
