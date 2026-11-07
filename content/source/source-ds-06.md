---
type: lesson
id: source-ds-06
title: Queue
topic: structures
summary: Chapter 6 · Queue
prerequisites:
  - source-ds-05
source: Source/Content/Markdown/2_Data-Structures/06 queues.md
---

# Chapter 6: Queue

A queue is a linear data structure that usually follows the First-In, First-Out (FIFO) rule. The first item added is the first one removed. A line of people waiting for a bus is a familiar example.

![Nicky is first in line to board the bus.](/materials/Assets/Data%20Structures/Animated/bus-queue.svg)

![Nicky is at the front and leaves first. Darren is at the rear, where new jobs join.](/materials/Assets/Data%20Structures/Static/queue.svg)
## Contents

- [1. Operations](#1-operations)
- [2. Types](#2-types)
- [3. Application](#3-application)
- [4. Python example](#4-python-example)
- [References](#references)
## 1. Operations

- **Enqueue:** Add an item at the rear.

  ![Enqueue adds Darren at the rear](/materials/Assets/Data%20Structures/Animated/queue-enqueue.svg)

- **Dequeue:** Remove and return the item at the front. The queue must not be empty.

  ![Dequeue removes Nicky from the front](/materials/Assets/Data%20Structures/Animated/queue-dequeue.svg)

- **Front or peek:** Read the front item without removing it.

  ![Peek reads Nicky at the front while both items stay in place.](/materials/Assets/Data%20Structures/Animated/queue-peek.svg)

- **Rear:** Read the last item without removing it.

  ![Reading the rear returns Darren while both jobs stay in place.](/materials/Assets/Data%20Structures/Animated/queue-rear.svg)

- **Size:** Return the number of items. In the example below, this is `len(jobs) - front`.

  ![The queue has two waiting jobs.](/materials/Assets/Data%20Structures/Animated/queue-size.svg)

- **Is empty:** Check whether there are no items.

  ![The queue is empty when no jobs are waiting.](/materials/Assets/Data%20Structures/Animated/queue-empty.svg)



## 2. Types

- **Circular queue:** Treats the ends of an array as connected, so positions freed at the front can be reused.

  ![The next slot after 3 is 0.](/materials/Assets/Data%20Structures/Static/queue-circular.svg)
- **Double-ended queue (deque):** Items can enter or leave at either end. A **deque** is a kind of queue. **Dequeue** means remove the front item.

  ![Items can enter and leave at either end.](/materials/Assets/Data%20Structures/Static/queue-deque.svg)
- **Input-restricted deque:** Allows insertion at one end, but deletion at either end.

  ![Items enter at the left and leave at either end.](/materials/Assets/Data%20Structures/Static/queue-input-restricted.svg)
- **Output-restricted deque:** Allows deletion at one end, but insertion at either end.

  ![Items enter at either end and leave at the left.](/materials/Assets/Data%20Structures/Static/queue-output-restricted.svg)
- **Priority queue:** Removes the item with the highest (or lowest) priority first. The implementation determines the order among items with equal priority.

  ![The urgent job is served first even though it arrives second.](/materials/Assets/Data%20Structures/Static/queue-priority.svg)

Queues are useful for tasks such as handling print jobs, processing requests in arrival order, and keeping track of work waiting to be done.

**Quick check.** Nicky sends a print job, then Darren sends one. The printer dequeues one job. Whose job does it take, and whose job is now at the front?

**Expected answer.** It takes Nicky's job first. Darren's job is now at the front.

## 3. Application

Nicky and Darren share a printer. Nicky sends a job first, and Darren sends one before the printer is free. The printer takes Nicky's job from the front of the queue. Darren's job is next.

![Process print jobs in arrival order.](/materials/Assets/Data%20Structures/Animated/application-print-jobs.svg)

## 4. Python example

Use a list and a `front` index. Enqueue adds to the end. Dequeue reads the front item and advances the index, so no items have to shift. This simple version leaves processed entries in the list.

```python
jobs = []
front = 0
jobs.append("Nicky")
jobs.append("Darren")
# Take the oldest job and move the front to the next one.
next_job = jobs[front]
front += 1
print(next_job)
print(jobs[front])  # Peek at the new front.
```

Expected output

```text
Nicky
Darren
```


## References

- GeeksforGeeks, [Introduction to Linear Data Structures](https://www.geeksforgeeks.org/dsa/introduction-to-linear-data-structures/)
- IBM, [What is a data structure?](https://www.ibm.com/think/topics/data-structure) (FIFO and shared printers).
