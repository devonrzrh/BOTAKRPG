---
type: lesson
id: source-alg-06
title: "Graph Searching: BFS, DFS & Routing and Coverage"
topic: algorithms
summary: "Chapter 7 · Graph Searching: BFS, DFS & Routing and Coverage"
prerequisites:
  - source-alg-05
source: Source/Content/Markdown/Algorithm/06 graph searching routing and coverage.md
---

# Graph Searching: BFS, DFS & Routing and Coverage

## Graphs
Graphs are the few foundational concepts you typically need to understand before going to pathfinding, so:
1. what are graphs?

Graphs, as explained in our **Data structure** modules is a data structure used to represent relationships.
* vertices(nodes) : locations/points/objects
* Edges: connections between those nodes/vertices.

Although this is how we read, and define them, its worth noting that there are different types of graphs, cinluding:
1. Directed Graphs: **edges have directions representing mutual relationships.**

   ![Edges point in a particular direction.](/materials/Assets/Algorithms/Static/directed-graph.svg)

2. Undirected graphs: **edges has no particular direction/mutuality.**

   ![Edges connect vertices in both directions.](/materials/Assets/Algorithms/Static/undirected-graph.svg)

3. Weighted graphs: **edges have weight, typically representing cost, distance,time,etc**

   ![Edge weights can represent cost, distance, or time.](/materials/Assets/Algorithms/Static/weighted-graph.svg)

4. unweighted graphs: **edges dont take into account of distance/time, etc.**

   ![Each edge counts as one step.](/materials/Assets/Algorithms/Static/unweighted-graph.svg)

Examine our undirected graph, the vertices would be the marked points (A-D), the edges would be the lines connecting them. if we assume each letter represents different rooms, then we can assume the lines connects two rooms.

## Graph Traversal
### definition:
process of systematically visiting nodes in a graph.

specifically, were visiting, checking, and updating every node in a graph.

later on in the module, you'll see an implementation of BFS, and DFS, they're the primary algorithms used graph traversal. 


![A is connected to B and C, with D and E below B and F and G below C.](/materials/Assets/Algorithms/Static/traversal-graph.svg)

look at this specific graph as an example, and note:
**there can be multiple ways to traverse the same graph.**

we could:
1. explore all nodes at the current level, and then moves to the next level and repeat:

```
Possible traversal order:
A > B > C > D > E > F > G
A > C > B > G > F > E > D
A > B > C > E > D > G > F
```

Notice: everything starts at A, we typically call it the **Root node** , everything below is the child nod of A. D,E is the child node of the parent node B. F,G is the child node of the parent node C. 

This specific traversal order is often used by **BFS**, one of our introductory pathfinding algorithms.

Recall [the call stack](#lesson=source-alg-04): if stacks operate on the principle **LIFO**, then **queue** operates on **FIFO**

**FIFO** = First in, First out. this is how **BFS** maintains this specific traversal order.

2. Explore nodes layer by layer as deeply as possible along each branch before **Backtracking**, and then explores adjacent nodes as deeply as possible.

```
Possible traversal order:
A > B > D > E > C > F > G
A > C > G > F > B > E > D
A > B > E > D > C > F > G
```
**LIFO** = Last in, First out. This is how DFS Maintains this specific traversal order.
![DFS explores B and its children before the branch at C.](/materials/Assets/Algorithms/Animated/dfs-traversal.svg)

## Graph Searching
[Graph Traversal](#graph-traversal) covered traversal, but notice that during all our time finding the order in which we cna traverse the graph, we never found or ended up at a specific node or value nor did we stop exploring at a certain node.

At its core, this is what Graph searching is about.

If Graph traversal's goal is to visit and explore every node systematically, then Graph searching involves finding a specific target node or value, with a stop condition implemented as well to stop once the target is found.

Recall the possible ways to traverse through a graph and what pathfinding algorithm was associated with the order...those algorithms use graph traversal strategies, but graph searching adds a goal, target, and check.

![BFS searching for E stops once E is reached.](/materials/Assets/Algorithms/Animated/graph-search.svg)

## Connection to Pathfinding

The best way to sum up pathfinding is by asking yourself how can you get from a starting point (node) A,  to an end point (target),B through all possible valid **routes**.

you can find a path, but which route is takes the fewest steps, whats the shortest path? Its important to note that not every graph searching algorithm guarantees the shortest path.

![The path A to B to E contains two edges.](/materials/Assets/Algorithms/Animated/bfs-path.svg)

## Breadth-First Search (BFS)
BFS - Breadth-First Search is our first graph traversal algorithm.

### How BFS Works
* starts off from its starting node
* explores level by level
* gradually moves farther away
* can find the shortest path in an unweighted graph



uses queue (FIFO) to remember which nodes to explore next.

![BFS removes the front node and appends newly discovered neighbors at the rear.](/materials/Assets/Algorithms/Animated/bfs-queue.svg)



![BFS explores all vertices at the current distance before going farther.](/materials/Assets/Algorithms/Animated/bfs-traversal.svg)

### Implementation (Python)
```python
from collections import deque

def bfs(graph, start_node):
    visited = set()
    queue = deque([start_node])
    
    visited.add(start_node)
    
    traversal_order = []

    while queue:
        current_node = queue.popleft()
        traversal_order.append(current_node)
        
        for neighbor in graph.get(current_node, []):
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append(neighbor)
                
    return traversal_order

if __name__ == "__main__":
    graph = {
        'A': ['B', 'C'],
        'B': ['D', 'E'],
        'C': ['F'],
        'D': [],
        'E': ['F'],
        'F': []
    }
    
    print("BFS Traversal starting from 'A':")
    print(bfs(graph, 'A'))
```

![The Python example uses this directed graph and visits A, B, C, D, E, F.](/materials/Assets/Algorithms/Animated/bfs-code-graph.svg)

## Depth-First Search (DFS)

* Start form the starting node
* explore one branch as deeply as possible
* backtrack once it reaches a dead end
* explores the next unvisited branch
* repeat until every branch/path has been explored or it finds its target
* Dosnt guarantee shortest path


Uses Stack (LIFO) **Last in FIrst out**

Typically uses **Recursion**
```python
def dfs_recursive(graph, source, visited=None):
    if visited is None:
        visited = set()
    visited.add(source)
    print(source, end=" ")
    for neighbor in graph[source]:
        if neighbor not in visited:
            dfs_recursive(graph, neighbor, visited)
```

![DFS uses a branch-first visit order on the tree-shaped example.](/materials/Assets/Algorithms/Animated/dfs-traversal.svg)

## DFS vs BFS
**DFS:**
* Most commonly implemented with recursion
* uses STACK (LIFO) **First In First Out**
* Explores deeply, not level by level
* it can find a longer path and finish, it does not guarantee the shortest possible path

**BFS:**
* uses queue (FIFO) **First In First Out**
* explores level by level
* guarantees the shortest possible path **(in unweighted graphs)**


Differentiate Graph Traversal, graph searching, and pathfinding from one another. They are closely related but not the same.

Pathfinding: getting from a starting point to an end point (A to B)

Graph traversal: systematically visiting nodes in a graph.

For weighted-route optimization with Dijkstra and A*, see [Greedy Algorithm and Optimization](#lesson=source-alg-07).
