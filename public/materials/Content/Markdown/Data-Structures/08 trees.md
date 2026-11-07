# Trees

A tree is a hierarchical structure made of **nodes** (items) connected by **edges** (links). The top node is the **root**. A node connected below another node is its **child**; the node above it is its **parent**.

Trees can represent a folder system: a folder can contain other folders, and those folders can contain more folders or files. There is one path from the root to each node.

![A folder tree with the path from Course to notes.md highlighted.](../../../Assets/Data%20Structures/Animated/folder-tree.svg)

## Binary trees

A **binary tree** is a tree in which each node has at most two children, commonly called the left child and right child.

![An unordered binary tree has root 8 with left child 10 and right child 3.](../../../Assets/Data%20Structures/Static/binary-tree-unordered.svg)

## Binary search trees

A **binary search tree** (BST) orders its nodes by **key**, a value used for comparisons, such as a student ID. Each key appears only once in these examples.

A **subtree** includes a node and everything below it. At every node in a BST, the ordering rule is the same.

- All keys in the left subtree are smaller than the node's key.
- All keys in the right subtree are larger than the node's key.

Putting `9` to the right of `3` in the diagram would break the rule at `8`. The `9` would still be in `8`'s left subtree.

![Root 8 has children 3 and 10. Node 3 has left child 1.](../../../Assets/Data%20Structures/Static/bst-shape.svg)

**Search and insertion.** Use the tree above and start at the root. If the target matches the current key, you have found it. Otherwise, follow the left link for a smaller target or the right link for a larger target.

1. To search for `1`, compare it with `8` and go left. Compare it with `3` and go left again. The next node holds `1`.

   ![Search the binary search tree for 1.](../../../Assets/Data%20Structures/Animated/bst-search.svg)

2. To search for `6`, go left from `8` and right from `3`. That link is empty, so `6` is absent.
3. To insert `6`, follow the same path and place it at the empty link as the right child of `3`. It belongs there because `3 < 6 < 8`.

   ![Before and after inserting 6 as the right child of 3.](../../../Assets/Data%20Structures/Animated/bst-insert.svg)

## Finding the smallest, largest, and next keys

- **Smallest key.** Start at the root and follow left links until there is no left child. In this tree, the path ends at `1`.

  ![Follow left links from 8 to 3 to 1.](../../../Assets/Data%20Structures/Animated/bst-minimum.svg)

- **Largest key.** Start at the root and follow right links until there is no right child. In this tree, the path ends at `10`.

  ![Follow the right link from 8 to 10.](../../../Assets/Data%20Structures/Animated/bst-maximum.svg)

The **successor** is the next larger key in sorted order.

- **With a right subtree.** Find the smallest key in it.

  ![After inserting 6, the successor of 3 is 6.](../../../Assets/Data%20Structures/Animated/bst-successor-right.svg)

- **Without a right subtree.** Follow parent links upward. The first parent you reach from its left child holds the successor.

  ![In the original tree, go up from 3 to its successor 8.](../../../Assets/Data%20Structures/Animated/bst-successor-parent.svg)

In the original tree, `3` is the left child of `8` and has no right subtree, so its successor is `8`. The largest key has no successor.

## Deleting a key

First find the node. In the examples below, each deletion starts from the same tree, which extends the original diagram by inserting `6` and then `7`.

![Starting BST with root 8, children 3 and 10, and 7 as the right child of 6.](../../../Assets/Data%20Structures/Static/bst-before-deletion.svg)

| Node to remove | What changes | Keys in sorted order |
| --- | --- | --- |
| `10` has no children | Clear the right link from `8`. | `1, 3, 6, 7, 8` |
| `6` has one child | Connect `3` directly to `7` through its right link. | `1, 3, 7, 8, 10` |
| `3` has two children | Move its successor `6` into its place and move `7` up to fill the old position. | `1, 6, 7, 8, 10` |

For the two-child case, look for the smallest key in `3`'s right subtree. That is `6`. It is larger than everything in `3`'s left subtree and smaller than every other key in its right subtree, so it fits between both sides. The successor has no left child, which lets its right child fill the old position. If a node stores a record alongside its key, move the record with the key.

![Deleting 3 in three steps. Find 3, choose its successor 6, then replace 3 with 6 and reconnect 7.](../../../Assets/Data%20Structures/Animated/bst-delete.svg)

After deleting `3`, `6` takes its place and `7` fills the old position of `6`.

## Tree traversal

**Traversal** means visiting the nodes in a tree. An **inorder traversal** repeats these steps at each node and skips empty links.

1. Visit the left subtree.
2. Visit the current node.
3. Visit the right subtree.

In the diagram, the left subtree gives `1, 3`, the root gives `8`, and the right subtree gives `10`. The keys come out in increasing order. A full traversal takes `O(n)` time because it visits all `n` nodes.

![The BST is labeled with visit numbers. Inorder visits 1 first, then 3, then root 8, and finally 10.](../../../Assets/Data%20Structures/Animated/bst-inorder.svg)

## How tree shape affects performance

A **leaf** is a node with no children. The **height** is the number of nodes on the longest path from the root to a leaf.

Insert `1, 3, 8, 10` into an empty BST in that order. The tree becomes a chain of right children. Searching for `10` checks all four nodes. In the earlier diagram, the same search checks just `8` and `10`.

Search, insertion, and deletion take `O(h)` time in the worst case, where `h` is the height. A chain has height `n`, so these operations can take `O(n)` time. A **balanced BST** keeps branches short as it grows, giving `O(log n)` time.

An **AVL tree** is one kind of BST that restores balance after insertions and deletions.

## Choosing a structure

Imagine a library that stores books by numeric ID.

- **Balanced BST.** Use it when staff often add or remove books. Finding, adding, or removing a book takes `O(log n)` time. Listing all books in ID order takes `O(n)`.
- **Sorted array.** Use it when the catalog rarely changes and staff often look up books by position. Reading by position takes `O(1)`, and searching by ID takes `O(log n)`. Inserting or deleting in the middle can require shifting `O(n)` entries.

## Practice

Start with the original tree in the diagram. Insert `9`, then search for `9` in the updated tree. Which keys do you compare during the search? What order does an inorder traversal produce?

**Expected answer.** Insert `9` as the left child of `10` because `9 > 8` and `9 < 10`. The search compares `8`, `10`, then `9`. The inorder traversal produces `1, 3, 8, 9, 10`.

**Find the error.** Suppose someone adds `12` as the right child of `3` in the original tree. Which node's ordering rule does this break? Where should `12` go?

**Expected answer.** It breaks the rule at `8`. Every key below its left child must be smaller than `8`. Insert `12` to the right of `10`.

**Delete the root.** Start with the tree containing `1, 3, 6, 7, 8, 10` in the deletion example. Delete `8` using its successor. Draw the new tree and give its inorder order.

**Expected answer.** `10` is the only key in `8`'s right subtree, so it becomes the root. The subtree rooted at `3` remains its left subtree. The new root has no right child. Inorder gives `1, 3, 6, 7, 10`.

**Compare insertion orders.** Build one BST by inserting `1, 3, 6, 8, 10` in that order. Build a second BST by inserting `6, 3, 8, 1, 10`. Search for `10` in both. How many keys do you compare?

**Expected answer.** The first tree is a chain, so the search checks all five keys. The second tree checks three keys along `6 → 8 → 10`. Both trees hold the same keys and give the same inorder result.

## Application

Imagine Glen is looking up book `10` in a library catalog. The catalog stores book IDs in a binary search tree. Glen starts at `8` and follows the right branch because `10` is larger. That comparison lets him skip the entire left branch.

![Look up a library book by ID.](../../../Assets/Data%20Structures/Animated/application-library.svg)

## Python example

Build the BST from the diagram by inserting one key at a time. Each call to `insert` returns the root of the updated subtree. The inorder function visits the keys in sorted order.

```python
class Node:
    def __init__(self, key):
        self.key = key
        self.left = None
        self.right = None

def insert(node, key):
    # An empty link is where the new key belongs.
    if node is None:
        return Node(key)
    if key < node.key:
        node.left = insert(node.left, key)
    elif key > node.key:
        node.right = insert(node.right, key)
    return node  # Keep the existing node if the key matches.

def contains(node, key):
    while node is not None:
        if key == node.key:
            return True
        # The ordering rule tells us which branch can contain the key.
        if key < node.key:
            node = node.left
        else:
            node = node.right
    return False

def print_inorder(node):
    if node is not None:
        # Visit smaller keys, then this key, then larger keys.
        print_inorder(node.left)
        print(node.key)
        print_inorder(node.right)

root = None
for key in [8, 3, 10, 1, 6]:
    root = insert(root, key)

print(contains(root, 6))
print(contains(root, 9))
print_inorder(root)
```

Expected output

```text
True
False
1
3
6
8
10
```

## References

- Jessica Su, Stanford CS 161, [Lecture 8: Binary Search Trees](https://web.stanford.edu/class/archive/cs/cs161/cs161.1168/lecture8.pdf), sections 1 through 1.3 and section 2 (BST operations, inorder traversal, and height).
- CompilerSutra, [Non-Linear Data Structures](https://www.compilersutra.com/docs/DSA/non-Linear-DSA/) (binary trees, AVL trees, and file-system hierarchies).
- GeeksforGeeks, [Difference between Linear and Non-linear Data Structures](https://www.geeksforgeeks.org/dsa/difference-between-linear-and-non-linear-data-structures/) (tree hierarchy and unique root-to-node paths).
- GeeksforGeeks, [Introduction to Linear Data Structures](https://www.geeksforgeeks.org/dsa/introduction-to-linear-data-structures/) (sorted-array search and update costs).
