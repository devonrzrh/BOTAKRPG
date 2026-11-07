---
type: lesson
id: source-ds-04
title: Linked List
topic: structures
summary: Chapter 4 · Linked List
prerequisites:
  - source-ds-03
source: Source/Content/Markdown/Data-Structures/04 linked lists.md
---

# Linked List

A linked list is a sequence of nodes. A node is an item that stores a value and one or more links to other nodes. Nodes do not have to be stored next to each other in memory.

## Features

- **Node:** Holds data and link information.
- **Head:** The first node and the starting point for traversing the list.
- **Tail:** The last node. Its next link is empty in a non-circular list and points back to the head in a circular list.

## Types

- **Singly linked list:** Each node links to the next node, so traversal moves forward.

  ![Links go forward from 72 to 85 to 91.](/materials/Assets/Data%20Structures/Static/list-singly.svg)
- **Doubly linked list:** Each node links to both the next and previous nodes, so traversal can move in either direction. It uses extra memory for the additional link.

  ![Links connect neighboring nodes in both directions.](/materials/Assets/Data%20Structures/Static/list-doubly.svg)
- **Circular linked list:** The last node links back to the first node.

  ![The last node points back to the first.](/materials/Assets/Data%20Structures/Static/list-circular.svg)

## Operations

- **Accessing an element:** Start at the head and follow links until reaching the required position. This takes `O(n)` time in the general case.

  ![Follow links from the head to read the third node.](/materials/Assets/Data%20Structures/Animated/list-access.svg)

- **Searching:** Start at the head and follow links until you find the value. If it is absent, stop at the empty link in a non-circular list or when you return to the head in a circular list. This takes up to `O(n)` time.

  ![Check 72, then stop at 85.](/materials/Assets/Data%20Structures/Animated/list-search.svg)

- **Insertion:** A node can be inserted by changing links. Inserting at the head takes `O(1)` time. Inserting after a node also takes `O(1)` once that node is known, finding the position can still take `O(n)`.

  ![Insert 85 after the head.](/materials/Assets/Data%20Structures/Animated/list-insert.svg)

- **Deletion:** Change links to skip the node being removed. Deleting the head takes `O(1)`. In a singly linked list, unlinking a non-head node takes `O(1)` once you have the previous node. Finding that node may take `O(n)`.

  ![Delete 85 by changing one link.](/materials/Assets/Data%20Structures/Animated/list-delete.svg)


Linked lists are useful when items are often added or removed at known positions. They do not provide direct index-based access like arrays, and each node needs memory for its links.

After inserting `85`, follow the links from the head until you reach `None`.

![Head points to 72, then 85, then 91, then None.](/materials/Assets/Data%20Structures/Static/list-traversal.svg)

## Application

Imagine a music app where each song stores a link to the next one. If Darren adds a song between Track 1 and Track 2, the app first links the new song to Track 2. Then it updates Track 1 to play the new song next. The rest of the playlist can stay as it is.

![Insert a song into a playlist.](/materials/Assets/Data%20Structures/Animated/application-playlist.svg)

## Python example

Each node stores a value and a link to the next node. Insert `85` after the head, then follow the links until they end.

```python
class Node:
    def __init__(self, value, next_node=None):
        self.value = value
        self.next = next_node

head = Node(72, Node(91))
# Link 85 to the old next node before making it the new next node.
head.next = Node(85, head.next)

# Walk from the head until there is no next node.
current = head
while current is not None:
    print(current.value)
    current = current.next
```

Expected output

```text
72
85
91
```

## References

- GeeksforGeeks, [Introduction to Linear Data Structures](https://www.geeksforgeeks.org/dsa/introduction-to-linear-data-structures/)
- IBM, [What is a data structure?](https://www.ibm.com/think/topics/data-structure) (linked-list updates and playlists).
