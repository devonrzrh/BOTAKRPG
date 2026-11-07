# Stack

A stack is a linear data structure that follows the Last-In, First-Out (LIFO) principle. The most recently added element is the first one removed. A stack of plates is a familiar example: the top plate is usually the first one picked up.

![A pile of plates with the last plate added on top.](../../../Assets/Data%20Structures/Animated/plate-stack.svg)

![A is below B. Both push and pop operate at the top of the stack.](../../../Assets/Data%20Structures/Static/stack.svg)

## Operations

- **Push:** Add an item to the top.

  ![Push adds B above A](../../../Assets/Data%20Structures/Animated/stack-push.svg)

- **Pop:** Remove and return the top item. The stack must not be empty.

  ![Pop removes B and leaves A](../../../Assets/Data%20Structures/Animated/stack-pop.svg)

- **Top or peek:** Read the top item without removing it.

  ![Peek reads B at the top while both items stay in place.](../../../Assets/Data%20Structures/Animated/stack-peek.svg)

- **Size:** Return the number of items.

  ![A and B are both still on the stack, so its size is 2.](../../../Assets/Data%20Structures/Animated/stack-size.svg)

- **Is empty:** Check whether there are no items.

  ![An empty stack contains no items.](../../../Assets/Data%20Structures/Animated/stack-empty.svg)


A stack can be implemented with an array or a linked list. An array-based stack can use a fixed number of slots and a **top index** that tracks the position of the top item. In that fixed-capacity implementation, a successful push, pop, or peek takes `O(1)` because it touches one slot. Stacks are used for undo history and checking matching brackets.

**Quick check.** You type A and then B. The editor pushes each edit onto an undo stack. Which edit does Undo pop, and which edit is now on top?

**Expected answer.** Undo pops the edit that added B. The edit that added A is now on top.

## Application

Neil types `A` and then `B`. The editor adds both edits to an undo stack. When Neil presses Undo, the editor takes the top edit off the stack and reverses it. `B` disappears, and the edit that added `A` is now on top.

![Undo the latest edit.](../../../Assets/Data%20Structures/Animated/application-undo.svg)

## Python example

Use the end of a Python list as the top of the stack. Call `append()` to push an item. Call `pop()` to remove and return the last item, so we can print it directly.

```python
stack = []
# Push two edits onto the stack.
stack.append("A")
stack.append("B")
# Pop removes and returns B. A is now the top item.
print(stack.pop())

# Index -1 reads the last item without removing it.
print(stack[-1])
```

Expected output

```text
B
A
```

## References

- GeeksforGeeks, [Introduction to Linear Data Structures](https://www.geeksforgeeks.org/dsa/introduction-to-linear-data-structures/)
- IBM, [What is a data structure?](https://www.ibm.com/think/topics/data-structure) (undo history and bracket matching).
