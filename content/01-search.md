---
type: lesson
id: graph-search
title: Finding a way through
topic: algorithms
summary: Explore a graph with breadth-first and depth-first search.
prerequisites: []
---

# Finding a way through

A maze is a **graph**. Each walkable cell is a vertex; a possible move is an edge. An algorithm is a repeatable way to decide which edge to explore next.

## Breadth-first search

BFS explores in layers with a **queue**. On an unweighted graph it finds a shortest path. Mark cells visited when you enqueue them to avoid duplicate work.

```python
from collections import deque

start = position()
queue = deque([(start, [])])
seen = {tuple(start)}
while queue:
    cell, path = queue.popleft()
    if cell == goal():
        for direction in path:
            move(direction)
        break
    for direction, neighbor in neighbors(cell):
        key = tuple(neighbor)
        if key not in seen:
            seen.add(key)
            queue.append((neighbor, path + [direction]))
```

## Depth-first search

DFS explores a branch deeply before backtracking. It uses a **stack**, explicitly or through recursion. It finds a path, but does not generally guarantee the shortest path.

Both traversals run in **O(V + E)** time with an adjacency-list representation. Try both in the maze; compare the resulting paths rather than memorizing one route.

## Maze API

`position()` and `goal()` return `[x, y]`. `neighbors([x, y])` returns traversable `[direction, cell]` pairs. `move(direction)` accepts `north`, `east`, `south`, or `west` and returns whether movement succeeded. `can_move(direction)` senses from your current position. `at_goal()` checks completion.

```question
id: bfs-shortest
title: The shortest way
lesson: graph-search
format: choice
prompt: Which search guarantees a shortest path in an unweighted maze?
options: [Breadth-first search, Depth-first search, A random walk, Always turn left]
answer: [0]
explanation: BFS visits cells in nondecreasing distance from the start, so its first route to the goal is shortest.
```

```question
id: bfs-order
title: Search in order
lesson: graph-search
format: ordering
prompt: Arrange the steps for processing a cell in BFS.
options: [Remove the oldest cell from the queue, Inspect its neighbors, Mark unseen neighbors visited, Add those neighbors to the queue]
answer: [0, 1, 2, 3]
explanation: Remove from the front, discover neighbors, mark them once, then append them to the back.
```
