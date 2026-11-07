# Chapter 2: Linear Data Structures
## Contents

- [1. What are linear data structures?](#1-what-are-linear-data-structures)
- [2. Characteristics](#2-characteristics)
- [3. Examples of Linear Data Structures](#3-examples-of-linear-data-structures)
- [References](#references)
## 1. What are linear data structures?

A linear data structure stores items in a sequence. **Traversal** means visiting the items in a data structure. In a linear structure, you can visit them in sequence.

A simple example is a queue of people waiting to buy tickets. Each person has someone in front and behind, except for the people at the two ends.

![Nicky is at the front of the ticket line, Darren is in the middle, and Neil is at the rear.](../../../Assets/Data%20Structures/Animated/ticket-queue.svg)

## 2. Characteristics

Elements are arranged sequentially.
- A nonempty sequence has a logical first and last element. A circular implementation can link the last element back to the first.
- A traversal can follow the sequence from its logical first element to its last.
- The way elements are stored in memory depends on the type of structure. Array elements are commonly stored next to each other, while linked-list nodes can be in different locations.
- Some structures have a fixed capacity, others can grow or shrink as elements are added or removed.
- The time needed to access, search, insert, or delete an element depends on the structure and the operation.

![Items in a linear sequence.](../../../Assets/Data%20Structures/Static/linear-order.svg)

## 3. Examples of Linear Data Structures

- [Arrays](03%20arrays.md)

  ![Array scores at numbered positions.](../../../Assets/Data%20Structures/Static/array.svg)

- [Linked Lists](04%20linked%20lists.md)

  ![Nodes connected by links.](../../../Assets/Data%20Structures/Static/list-singly.svg)

- [Stacks](05%20stacks.md)

  ![A stack with B on top of A.](../../../Assets/Data%20Structures/Static/stack.svg)

- [Queues](06%20queues.md)

  ![A queue with Nicky at the front and Darren at the rear.](../../../Assets/Data%20Structures/Static/queue.svg)


## References

- GeeksforGeeks, [Introduction to Linear Data Structures](https://www.geeksforgeeks.org/dsa/introduction-to-linear-data-structures/)
