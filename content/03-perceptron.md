---
type: lesson
id: perceptron-basics
title: A machine that learns a boundary
topic: ai
summary: Train a perceptron from examples and inspect its decision boundary.
prerequisites: []
---

# A machine that learns a boundary

A perceptron computes **z = w₁x₁ + w₂x₂ + b**. It predicts class 1 when z ≥ 0, otherwise class 0.

For each labeled example, the update is:

```text
error = label − prediction
wᵢ ← wᵢ + learning_rate × error × xᵢ
b  ← b  + learning_rate × error
```

## Your experiment

Add points to both sides of a diagonal and assign two classes. Train for several epochs, inspect the weights, then evaluate **held-out points** that were not used for updates.

A perfect score on training examples does not establish generalization. A single perceptron can represent a linear boundary, but cannot solve XOR. Contradictory labels may prevent convergence.

```question
id: held-out
title: An honest test
lesson: perceptron-basics
format: choice
prompt: Which examples should estimate how well a trained model generalizes?
options: [Only examples used for training, Unseen held-out examples, Only its easiest examples, Its weights]
answer: [1]
explanation: Held-out examples are not used in weight updates and give a more honest estimate of generalization.
```

```question
id: perceptron-error
title: A useful mistake
lesson: perceptron-basics
format: choice
prompt: The true label is 1 and the prediction is 0. What is label minus prediction?
options: ['-1', '0', '1', '2']
answer: [2]
explanation: The error is 1. A positive update shifts the boundary toward correctly recognizing this example.
```
