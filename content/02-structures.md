---
type: lesson
id: stacks-queues
title: What comes next?
topic: structures
summary: Stacks remember the newest thing; queues remember the oldest.
prerequisites: [graph-search]
---

# What comes next?

A **stack** follows last in, first out (LIFO). A **queue** follows first in, first out (FIFO).

| Structure | Insert  | Remove         | A useful example  |
| --------- | ------- | -------------- | ----------------- |
| Stack     | Push    | Pop newest     | DFS, undo history |
| Queue     | Enqueue | Dequeue oldest | BFS, scheduling   |

In Python, a list's `append()` and `pop()` make a stack. Use `collections.deque` with `append()` and `popleft()` for an efficient queue. Removing the first element of a Python list shifts remaining elements.

## Trace before you answer

Push A, then B, then C. A stack removes **C** first. A queue removes **A** first. Trace a few small examples when the names feel abstract.

```question
id: stack-pop
title: Last in
lesson: stacks-queues
format: choice
prompt: Push A, B, then C onto a stack. What does pop return?
options: [A, B, C, Nothing]
answer: [2]
explanation: A stack removes the most recently inserted element. C was inserted last.
```

```question
id: queue-pop
title: First in
lesson: stacks-queues
format: choice
prompt: Enqueue A, B, then C. What does the first dequeue return?
options: [C, B, Nothing, A]
answer: [3]
explanation: A queue preserves insertion order. A arrived first and leaves first.
```
