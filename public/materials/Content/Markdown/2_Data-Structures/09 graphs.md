# Chapter 9: Graphs

A graph has a set of **vertices** and a set of **edges** that connect pairs of vertices. In a friendship network, the vertices are people and the edges are friendships.

- An **undirected graph** has connections that can be followed in either direction.

  ![A line without an arrow connects Nicky and Darren.](../../../Assets/Data%20Structures/Static/graph-undirected.svg)

- A **directed graph** has connections with a direction.

  ![An arrow points from Nicky to Darren.](../../../Assets/Data%20Structures/Static/graph-directed.svg)
## Contents

- [1. Example: a small friendship network](#1-example-a-small-friendship-network)
- [2. Storing the friendship graph](#2-storing-the-friendship-graph)
- [3. Graph traversal](#3-graph-traversal)
- [4. Application](#4-application)
- [5. Python example](#5-python-example)
- [References](#references)
## 1. Example: a small friendship network

Each person below is a vertex, and each line is an undirected edge. This example is made for these notes.

![Nicky is friends with Darren and Neil. Darren and Neil are both friends with Glen.](../../../Assets/Data%20Structures/Static/friendship-graph.svg)

Nicky can reach Glen in two steps by following the edges Nicky → Neil → Glen.

## 2. Storing the friendship graph

Two vertices are **adjacent** if one edge connects them. An **adjacency list** records each vertex's direct neighbors. Each friendship appears in both people's lists because the graph is undirected.

![Adjacency lists showing the two direct neighbors of each person.](../../../Assets/Data%20Structures/Static/friendship-adjacency-list.svg)

An **adjacency matrix** has one row and one column for each vertex. In this unweighted graph, a `1` marks an edge from the row vertex to the column vertex and a `0` means there is no edge. The table is symmetric because each friendship goes both ways.

| From / to | Nicky | Darren | Neil | Glen |
| --- | --- | --- | --- | --- |
| Nicky | 0 | 1 | 1 | 0 |
| Darren | 1 | 0 | 0 | 1 |
| Neil | 1 | 0 | 0 | 1 |
| Glen | 0 | 1 | 1 | 0 |

The list makes it easy to see all of Nicky's neighbors. The matrix lets you check a particular pair directly, such as Nicky and Glen, by reading one cell.

## 3. Graph traversal

A graph traversal visits vertices by following edges from a starting vertex. Keep track of which vertices you have seen so that a cycle does not lead to repeated visits.

- **Depth-first search (DFS)** follows unvisited neighbors as far as it can. When it runs out of unvisited neighbors, it backtracks to look for another branch. A stack can track where to return.
- **Breadth-first search (BFS)** uses a queue to visit vertices in layers. It processes the vertices one edge away before those two edges away, then continues outward.

Start at Nicky and choose Darren first.

- **DFS** visits Nicky → Darren → Glen → Neil. It reaches Neil from Glen while exploring Darren's branch. By the time it returns to Nicky, Neil has already been visited.

  ![Depth-first search visit order.](../../../Assets/Data%20Structures/Animated/graph-dfs.svg)

- **BFS** visits Nicky → Darren → Neil → Glen. It visits both people one edge away before reaching Glen, who is two edges away.

  ![Breadth-first search visit order.](../../../Assets/Data%20Structures/Animated/graph-bfs.svg)


**Quick check.** If DFS starts from Nicky and chooses Neil first, what order does it visit the four people?

**Expected answer.** Nicky → Neil → Glen → Darren. The order changes, but it still reaches all four people.

## 4. Application

Nicky hears that the club meeting has moved to Friday. In each round, anyone who just heard the news tells their friends. Who hears it first, and how many rounds does it take to reach Glen?

In round 1, Nicky tells Darren and Neil. In round 2, Glen hears from Darren or Neil. Count Glen once even if both friends tell him. This is how BFS explores a graph, one group of neighbors at a time.

![Nicky starts with the news. Darren and Neil hear in round 1, then Glen hears in round 2.](../../../Assets/Data%20Structures/Animated/application-club-announcement.svg)

## 5. Python example

- `friends` is a dictionary that gives each person's list of neighbors.
- `queue` holds people in the order they joined. The `front` index tells us who to visit next.
- `seen` is a set of everyone who has joined the queue. Add people to it as soon as they join so they enter only once.

```python
friends = {
    "Nicky": ["Darren", "Neil"],
    "Darren": ["Nicky", "Glen"],
    "Neil": ["Nicky", "Glen"],
    "Glen": ["Darren", "Neil"],
}

queue = ["Nicky"]
front = 0
seen = {"Nicky"}

# Keep going while someone in the queue is waiting to be visited.
while front < len(queue):
    person = queue[front]
    front += 1
    print(person)
    for neighbor in friends[person]:
        if neighbor not in seen:
            # Mark the neighbor now so no one queues them twice.
            seen.add(neighbor)
            queue.append(neighbor)
```

Expected output

```text
Nicky
Darren
Neil
Glen
```


## References

- CompilerSutra, [Non-Linear Data Structures](https://www.compilersutra.com/docs/DSA/non-Linear-DSA/#2-graphs) (graph types, adjacency representations, DFS, and BFS).
