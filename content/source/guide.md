---
type: lesson
id: source-guide
title: Module guide and review notes
topic: algorithms
summary: Curriculum map, source reviews and original resources
source: Source/Content/Markdown/Module Outline.md
---

# Module Outline

Our project will cover three interconnected areas: **algorithms, data structures, and connectionist artificial intelligence.**

### a. Algorithms

**Prerequisite:** [Introduction to Python Programming](#lesson=source-alg-00)

* [Introduction to Algorithms](#lesson=source-alg-01)
* [Basic Sorting Algorithms](#lesson=source-alg-02)
* [Binary Search, Linear Search, and Big O Notation](#lesson=source-alg-03)
* [Recursion and Call Stack](#lesson=source-alg-04)
* [Time Complexity Analysis](#lesson=source-alg-05)
* [Graph Searching: BFS, DFS & Routing and Coverage](#lesson=source-alg-06)
* [Greedy Algorithm and Optimization](#lesson=source-alg-07)
* [Dynamic Programming (DP)](#lesson=source-alg-08)
* [Inventory and Uncertainty Management](#lesson=source-alg-09)
* [Sequential Decisions Over Time](#lesson=source-alg-10)


### b. Data Structures

* [Introduction to Data Structures](#lesson=source-ds-01)
* [Arrays](#lesson=source-ds-03)
* [Stacks](#lesson=source-ds-05)
* [Queues](#lesson=source-ds-06)
* [Linked lists](#lesson=source-ds-04)
* [Graphs](#lesson=source-ds-09)
* [Binary Search Trees](#lesson=source-ds-08)
* [Data Versioning](#lesson=source-ds-10)

### c. Connectionist Artificial Intelligence

* [Introduction to Connectionist AI](#lesson=source-ai-01)
* [Basic concept, terminology and architectures of Neural Networks](#lesson=source-ai-02)
* [Application of Neural Networks](#lesson=source-ai-03)
* [Deep learning and Activaction Functions](#lesson=source-ai-04)
* [Demand Forecasting & Time-Series Forecasting](#lesson=source-ai-05)
* [Probabilistic Forecasting](#lesson=source-ai-06)
* [Online & Incremental Learning](#lesson=source-ai-07)
* [Recommendation Systems](#lesson=source-ai-08) 
* [Reinforcement Learning](#lesson=source-ai-09)
* [Model Training & Optimization](#lesson=source-ai-10)

### d. Connections Between the Three Areas

* How algorithms operate on and manipulate data structures to solve problems efficiently.
* How algorithms train neural networks, optimize their performance, and help them make predictions.
* How data structures store and organize training data, neural network weights, and other information needed by AI.
* How searching, optimization, and dynamic programming help computers find solutions and make better decisions.
* How organized data supports AI applications such as demand forecasting, recommendation systems, and reinforcement learning.

## Prerequisite

Learners should have the following basic knowledge to start the module:
* **Basic Computer Literacy:** Familiarity with using a computer, managing files, and interacting with common software.
* **Basic mathematical understanding:** Ability to work with whole numbers, basic arithmetic operations, comparisons, and simple patterns.
* **Elementary logical thinking:** Ability to understand simple rules, follow step-by-step instructions, and make decisions based on conditions.
* **Basic data interpretation:** Ability to read simple lists, tables, and organized information.
* **Willingness to learn computational concepts:** No prior knowledge of programming, data structures, algorithms, or artificial intelligence is required, as these concepts will be introduced progressively throughout the module.


## Reading and running examples

Start with the Python chapter. Maze scripts run in the game's Python worker using its maze API. General examples may use normal Python; PyTorch examples need a separate Python environment with PyTorch installed. The maze worker does not provide PyTorch or arbitrary application data.

[Full test bank](#lesson=source-test-bank)

## Source review notes

The following are the supplied peer reviews. They are retained as review records; their recommendations are not claims that every source issue has been corrected. Original files are preserved unchanged.

### Algorithm: Reviews

# Algorithms Review

Status: Needs revision.

## Main issues

- Activities and answers: Most chapters need learner tasks with checked answers. Add tracing, prediction, comparison, or problem-solving activities.
- Bubble sort: Compare values, not indexes. Clarify repeated passes and inclusive pseudocode bounds. Label pseudocode as text.
- Sorting counts: The random example requires 9 comparisons and 4 swaps, not 10 and 5.
- Binary search: Replace the displayed midpoint formula with `mid = (left + right) // 2`.
- Graphs: Correct the DFS comparison to say LIFO means Last In, First Out. Directed edges do not imply mutual connections. Remove “layer by layer” from the DFS description.
- Recursion: Explain the C prerequisites or use iterative Python. Correct invalid-input handling and the factorial input domain.
- Coverage: Add a checked example distinguishing visiting all required locations from reaching one destination.
- References: Add reliable sources to chapters 01-08 and 10.
- Presentation: Fix the stale “1.2” reference and inconsistent spelling and headings.



### Data-Structures: Review2

# Data Structures Review


I checked the explanations, terminology, examples, calculations, code, activities, references, and local links. All seven complete Python examples matched their expected outputs. All 110 local links resolved, and all 86 referenced SVGs passed structural checks. I found the content largely accurate and the cited sources relevant.

I recommend these improvements:

- Make the programming prerequisites consistent and explain how to run the Python examples.
- State when the Trees lesson returns to the original tree after deletion.
- Replace the introduction's outdated statement that Data Versioning is still planned.
- Clarify the difference between typed arrays and Python lists.
- Record reviewer names, lesson coverage, learner feedback, and resulting changes.


there is also a bit of unclear tree transitions and missing python guidance.


### Data-Structures: Reviews

# Content Review: Data Structures

## Review Summary

I have reviewed the Data Structures content, including the introduction, linear data structures, and nonlinear data structures. Overall, the content is easy to understand and covers the main topics needed for beginners.

## What Went Well

- The explanations are simple and easy to follow.
- The examples help explain how different data structures work.
- The content covers the main types of data structures, such as arrays, linked lists, stacks, queues, trees, and graphs.
- The practice questions help readers check their understanding.

## What Needs Improvement

- Some sections contain a lot of information and could be shortened.
- More simple diagrams or code examples could help explain some concepts.
- The connection between data structures and their uses in programming could be explained with more real examples.

## Review Outcome

**Status: Approved with minor improvements.**

The content is suitable for beginners and can be used in our learning module. Before the final submission, we can improve a few explanations and add more examples where needed. No major changes are required.

### Connetionist-AI: Review1

# Connectionist AI Peer Review


I found the explanations generally understandable and the key worked calculations correct. I checked the forward pass, gradient update, forecasting errors, Gaussian loss, recommendation score, and Q-learning update. All 21 Python blocks passed syntax checks. All 155 local links resolved, and all 143 referenced SVGs passed structural checks.

I recommend these revisions before approval:

- I found no references or citations in any lesson. I recommend adding sources for the historical, mathematical, and application claims. I cross-checked selected claims against PyTorch documentation, Forecasting: Principles and Practice, and the original PPO paper.
- In Chapter 06, line 196, I would correct the claim that an interval from zero to infinity is perfectly calibrated. For nonnegative outcomes it gives 100% coverage; that does not make it a calibrated 80% or 90% interval.
- In Chapter 09, line 237, I would clarify that PPO clips its objective to discourage large policy changes. It does not guarantee a strict limit on policy change.
- In Chapter 10, lines 282–319, I would supply the missing training and validation loaders, example data, and expected shapes. I would also weight validation losses by sample count because equally averaging batch means overweights a smaller final batch.
- In Chapter 05, line 266, I would distinguish the target stock level from the order quantity. Ordering also needs to account for existing inventory, outstanding orders, and backorders.
- I would add library installation and execution instructions, clarify the input-sign assumption behind Chapter 02's weight explanation, and describe Chapter 04's zero ReLU derivative as a chosen convention at its nondifferentiable point.

I used a separate AI learner walkthrough for Chapters 02, 06, and 09. It reached the supplied practice answers but identified missing setup in Chapter 10 as an execution blocker. I made no corrections.



## Supplementary folders

The supplied video, slide and Markdown test-bank indexes contain placeholders rather than additional teaching material.

- [Video index](/materials/Content/Videos/Videos.md)
- [Slide index](/materials/Content/PPT%20Slides/PPT%20Slides.md)
- [Test index](/materials/Content/Test%20Bank/Test.md)
