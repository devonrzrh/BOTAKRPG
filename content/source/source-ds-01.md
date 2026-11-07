---
type: lesson
id: source-ds-01
title: Data Structures
topic: structures
summary: Chapter 1 · Data Structures
prerequisites: []
source: Source/Content/Markdown/Data-Structures/01 introduction to data structures.md
---

# Data Structures

## Introduction to Data Structures

### Definition of Data Structures

A data structure is a way of organizing and storing data so a program can use it. The choice of structure affects how the program accesses (gets), adds, removes, and changes data.

### Importance of Data Structures in Programming

Programs often need to work with many related pieces of information. A suitable data structure keeps that information organized and makes common operations easier to perform.

For example, a program that stores student scores can use an ordered collection to keep the scores together and find a score by its position.

![The program asks for the second score and reads 85 directly from index 1.](/materials/Assets/Data%20Structures/Animated/importance-score-lookup.svg)

The best choice depends on what the program needs to do most often. A structure that makes one operation quick may need more memory or make another operation slower.

### Classification of Data Structures

Data structures are commonly grouped as **linear** or **nonlinear**:

- **Linear data structures** arrange elements in a sequence. Arrays, linked lists, stacks, and queues are examples.
- **Nonlinear data structures** connect elements as a hierarchy or network. Trees and graphs are examples.

These groups describe how elements relate to one another. Different structures within either group support different operations and use cases.

### Overview of Data Structures

- **Array:** Stores elements in an ordered sequence. Each item has an index, a number identifying its position. Arrays are useful when items need to be accessed by position.

  ![An array stores values at numbered positions.](/materials/Assets/Data%20Structures/Static/array.svg)
- **Linked list:** Stores elements in nodes (items containing data and links to other nodes). It is useful when the program needs to add or remove nodes at known positions.

  ![A linked list connects nodes with links.](/materials/Assets/Data%20Structures/Static/list-singly.svg)
- **Stack:** Adds and removes items at the same end. Last-in, first-out means the item added most recently is removed first.

  ![A stack adds and removes items at the top.](/materials/Assets/Data%20Structures/Static/stack.svg)
- **Queue:** Adds items at one end and removes them from the other. First-in, first-out means the item added earliest is removed first.

  ![A queue adds at the rear and removes from the front.](/materials/Assets/Data%20Structures/Static/queue.svg)
- **Tree:** Connects nodes (items) in a hierarchy, where some nodes are above others.

  ![A tree connects a root to its children.](/materials/Assets/Data%20Structures/Static/bst-shape.svg)
- **Graph:** Connects vertices (items in a graph) with edges (connections) to represent a network of relationships.

  ![A graph connects people through friendships.](/materials/Assets/Data%20Structures/Static/friendship-graph.svg)

## Complexity Analysis in Data Structures

Suppose a collection stores the scores 72, 85, and 91.

![The scores 72, 85, and 91 are stored at indexes 0 to 2 in an array and connected by links in a linked list.](/materials/Assets/Data%20Structures/Static/array-vs-linked-list.svg)

1. To get the score at index 2 in the array, use the index to access 91 directly. This takes `O(1)` time.
2. To get the third score in the linked list, start at 72, follow a link to 85, then follow a link to 91. In a longer list, this can take `O(n)` time.
3. The linked list stores a link with each node, so it uses extra memory for those links. The array does not need those per-item links.

**Time complexity** describes how work grows as the number of items, `n`, grows. **Space complexity** describes how memory use grows. **Big-O notation** summarizes that growth. Here, `O(1)` means the lookup takes about the same work as the collection grows. `O(n)` means the work can grow in proportion to the number of items.

The better choice depends on which operations the program uses most and how much memory it can use.

### Check your understanding

A program often reads items by their position and rarely inserts items between existing ones. Which structure, an array or a linked list, is likely to fit better? Give one reason.

**Expected answer:** An array is likely to fit better because it gives direct access by position, usually in `O(1)` time. This assumes the program does not need many insertions in the middle.


## References

- IBM, [What is a data structure?](https://www.ibm.com/think/topics/data-structure)
- GeeksforGeeks, [Introduction to Linear Data Structures](https://www.geeksforgeeks.org/dsa/introduction-to-linear-data-structures/) (operation costs and link overhead).
- GeeksforGeeks, [Difference between Linear and Non-linear Data Structures](https://www.geeksforgeeks.org/dsa/difference-between-linear-and-non-linear-data-structures/) (linear and nonlinear classification).

## Read more

- [Linear Data Structures](#lesson=source-ds-02)
- [Nonlinear Data Structures](#lesson=source-ds-07)
- [Data Versioning](#lesson=source-ds-10).
