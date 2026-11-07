---
type: lesson
id: source-ai-01
title: Introduction to Connectionist AI (Brief)
topic: ai
summary: Chapter 1 · Introduction to Connectionist AI (Brief)
prerequisites: []
source: Source/Content/Markdown/3_Connectionist-AI/01 introduction to
  connectionist ai.md
---

# Chapter 1: Introduction to Connectionist AI (Brief)
## Contents

- [1. What Is Connectionist AI?](#1-what-is-connectionist-ai)
- [2. The Core Principles of Connectionism](#2-the-core-principles-of-connectionism)
- [3. Symbolic AI vs Connectionist AI](#3-symbolic-ai-vs-connectionist-ai)
- [4. A Short History](#4-a-short-history)
- [5. Why Did It Take So Long to Work?](#5-why-did-it-take-so-long-to-work)
- [6. Your First Neuron: A Hands-On Example](#6-your-first-neuron-a-hands-on-example)
- [7. Common Misconceptions](#7-common-misconceptions)
- [Key Takeaways](#key-takeaways)
- [Practice Questions](#practice-questions)
- [Answer Key](#answer-key)

## Key Takeaways
- Connectionism builds intelligence from many simple connected units whose weights are learned.
- It excels at messy, perceptual data; symbolic AI excels at explicit logic.
- Data, compute and better algorithms made deep learning take off around 2012.
- A single neuron is limited; layers give networks their power.

---

## Practice Questions

1. In one sentence, what is the main idea of connectionism?
2. What in an artificial network plays the role of a synapse?
3. Give one strength and one weakness of connectionist AI versus symbolic AI.
4. What is "distributed representation"?
5. Which training method was popularised for multi-layer networks in 1986?
6. Which logic function can a single neuron *not* learn?
7. Name the three ingredients behind the deep learning boom.
8. True or False: Artificial neural networks are accurate simulations of the brain.

---

## Answer Key

1. Intelligence emerges from many simple connected units whose connection strengths are learned.
2. The weight.
3. Strength: handles messy data like images. Weakness: hard to interpret (or needs lots of data).
4. A concept is spread across many units, and each unit helps represent many concepts.
5. Backpropagation.
6. XOR.
7. Data, compute (GPUs), better algorithms.
8. False. They are loose, simplified inspirations.


## 1. What Is Connectionist AI?

**Connectionism** is an approach to building intelligent systems from **many simple processing units that are linked together**. No single unit is intelligent. The behaviour of the whole system comes from **how the units are connected** and **how strong each connection is**.

![Two tiny networks receive the same inputs. Changing the weights changes how much the active input contributes and changes the score from 0.2 to 0.8.](/materials/Assets/Connectionist%20AI/Animated/what-is-connectionism.svg)

The idea is inspired by the brain, where billions of neurons communicate through connections called **synapses**. Learning in the brain is believed to involve strengthening or weakening these synapses. Connectionist AI copies this idea in a simplified, mathematical form:

| Biology | Artificial version |
|---|---|
| Neuron | Unit / node that computes a number |
| Synapse (connection) | **Weight**, a learnable number |
| Strengthening a synapse | Increasing a weight |
| Learning from experience | Adjusting weights to reduce error |

> **Important:** artificial neural networks are only *loosely* inspired by the brain. They are mathematical models, not accurate simulations of biology.

The most successful modern form of connectionist AI is the **artificial neural network (ANN)**, and especially **deep learning**, which uses networks with many layers.

![Four pixel inputs feed a group of hidden units. Their outputs are combined to produce two class scores.](/materials/Assets/Connectionist%20AI/Static/simple-units-together.svg)

## 2. The Core Principles of Connectionism

1. **Many simple units.** Each unit does a tiny calculation (weighted sum plus a non-linear function).
2. **Parallel processing.** Many units compute at the same time, which suits modern GPUs.
3. **Distributed representation.** A concept like "cat" is not stored in one place. It is spread across many units and weights, and one unit takes part in many concepts.
4. **Learning by adjusting weights.** Knowledge is not programmed in. It is acquired from examples.
5. **Graceful degradation.** Damaging a few units usually reduces performance slightly rather than breaking everything (unlike deleting one rule from a rule list).
6. **Generalisation.** A trained network can handle new inputs it has never seen, as long as they resemble its training data.

![A toy network represents cat and dog images with distinct patterns across five units. One unit is active in both patterns.](/materials/Assets/Connectionist%20AI/Static/distributed-patterns.svg)

![The trained model predicts the class of a handwritten digit that was held out of training.](/materials/Assets/Connectionist%20AI/Static/generalisation-example.svg)

## 3. Symbolic AI vs Connectionist AI

Early AI (1950s to 1980s) was mostly **symbolic**: experts wrote explicit rules and logic. Connectionism took a different route: learn from data.

| | Symbolic AI | Connectionist AI |
|---|---|---|
| Knowledge stored as | Explicit rules, facts, logic | Numbers (weights) in a network |
| Built by | Human experts encoding knowledge | Learning from examples |
| Handles noisy or messy input | Poorly | Well |
| Explanation of decisions | Clear | Hard |
| Needs lots of data | No | Usually yes |
| Good at | Logic, planning, exact reasoning | Perception, language, pattern recognition |
| Example | "IF temperature > 38 THEN fever" | A network trained on thousands of X-rays |

![In symbolic AI an expert supplies a rule; in connectionist AI labelled examples are used to fit weights.](/materials/Assets/Connectionist%20AI/Static/rules-and-weights.svg)

Neither approach is simply better. Modern research increasingly explores **neuro-symbolic AI**, which combines learning with explicit reasoning.

## 4. A Short History

| Year | Milestone | Why it mattered |
|---|---|---|
| 1943 | McCulloch and Pitts publish a mathematical model of a neuron | First formal "artificial neuron" |
| 1949 | Donald Hebb proposes that connections strengthen with use | Early learning principle (later paraphrased as "cells that fire together wire together") |
| 1958 | Frank Rosenblatt publishes the **Perceptron** model | Early trainable neural model |
| 1969 | Minsky and Papert show a single perceptron cannot learn XOR | Contributes to reduced interest in perceptrons; the broader **AI winter** of the 1970s had several causes |
| 1986 | Rumelhart, Hinton and Williams popularise **backpropagation** | Efficient training of multi-layer networks becomes more widely used |
| 1989 to 1998 | LeCun's convolutional networks read handwritten digits | Practical success, mostly in niche uses |
| 1997 | LSTM networks introduced | Better memory for sequences |
| 2012 | AlexNet wins the ImageNet competition by a large margin | Starts the **deep learning** boom |
| 2014 to 2016 | GANs; deep reinforcement learning beats humans at Go | Generation and decision-making breakthroughs |
| 2017 | The **Transformer** architecture is introduced | Foundation of modern language models |
| 2020s | Large-scale models for text, images, audio, code | Connectionist AI becomes mainstream |

![Four selected milestones from the perceptron to the Transformer, in chronological order.](/materials/Assets/Connectionist%20AI/Static/selected-milestones.svg)

## 5. Why Did It Take So Long to Work?

Three ingredients had to arrive together:

1. **Data.** The internet created huge datasets (photos, text, clicks, sensor data).
2. **Compute.** GPUs, originally made for video games, turned out to be ideal for the matrix maths neural networks need.
3. **Better algorithms.** Improved activation functions, optimisers, initialisation, normalisation and architectures made deep networks trainable.

![Data supplies examples, compute speeds the calculations, and training methods make updates more effective.](/materials/Assets/Connectionist%20AI/Static/training-ingredients.svg)

## 6. Your First Neuron: A Hands-On Example

A single neuron computes a **weighted sum of inputs plus a bias**, then applies a decision rule. Let's build a neuron that behaves like the logical **AND** gate (output 1 only if both inputs are 1).

Choose weights `w = [1, 1]` and bias `b = -1.5`. Rule: output 1 if the sum is greater than 0, else 0.

![An AND neuron adds the two weighted inputs and the bias to get 0.5, then outputs 1.](/materials/Assets/Connectionist%20AI/Animated/and-neuron.svg)

| input1 | input2 | Sum = 1·input1 + 1·input2 − 1.5 | Output |
|---|---|---|---|
| 0 | 0 | −1.5 | 0 |
| 1 | 0 | −0.5 | 0 |
| 0 | 1 | −0.5 | 0 |
| 1 | 1 | 0.5 | 1 |

It works. Here we chose the weights by hand. A *learning* algorithm would find them automatically from examples, which is the whole point of connectionism.

```python
def neuron(input1, input2, w=(1, 1), bias=-1.5):
    value = w[0]*input1 + w[1]*input2 + bias
    return 1 if value > 0 else 0

for input1 in (0, 1):
    for input2 in (0, 1):
        print(input1, input2, "->", neuron(input1, input2))
```

![The AND boundary separates the single positive example from the three negative examples.](/materials/Assets/Connectionist%20AI/Static/and-input-space.svg)

**The XOR problem.** XOR (output 1 if the inputs *differ*) cannot be solved by any single neuron, because no straight line separates its 1s from its 0s. Adding a **hidden layer** solves it. This is exactly why multi-layer networks matter (Chapter 2).

![The XOR 0s and 1s occupy opposite corners of a square, so a straight line cannot separate the two groups.](/materials/Assets/Connectionist%20AI/Static/xor-boundary.svg)

![Two hidden detectors answer whether at least one input is active and whether both are active. Together they distinguish exactly one active input.](/materials/Assets/Connectionist%20AI/Static/xor-hidden-layer.svg)

## 7. Common Misconceptions

- **"Neural networks work like the brain."** They are loosely inspired by it and far simpler.
- **"More layers is always better."** Deeper networks need more data and care, and can overfit.
- **"It's a black box nobody understands."** Much is understood about training and behaviour, but explaining individual decisions is hard, and active research (interpretability) addresses it.
- **"AI means neural networks."** AI also includes symbolic methods, search, probabilistic models and more.

![During training, targets help update the weights. During prediction, the weights stay fixed.](/materials/Assets/Connectionist%20AI/Static/train-vs-use.svg)
