# Chapter 2: Basic Concepts, Terminology and Architectures of Neural Networks
## Contents

- [1. The Artificial Neuron](#1-the-artificial-neuron)
- [2. Essential Terminology](#2-essential-terminology)
- [3. Layers and Matrix Form](#3-layers-and-matrix-form)
- [4. A Complete Worked Example: Forward Pass, Loss and One Weight Update](#4-a-complete-worked-example-forward-pass-loss-and-one-weight-update)
- [5. What Backpropagation Really Is](#5-what-backpropagation-really-is)
- [6. The Learning Loop](#6-the-learning-loop)
- [7. Common Loss Functions](#7-common-loss-functions)
- [8. Architectures](#8-architectures)
- [9. How to Choose an Architecture](#9-how-to-choose-an-architecture)
- [10. Tiny Code Example (PyTorch)](#10-tiny-code-example-pytorch)
- [11. Common Beginner Mistakes](#11-common-beginner-mistakes)
- [Key Takeaways](#key-takeaways)
- [Practice Questions](#practice-questions)
- [Answer Key](#answer-key)

## Key Takeaways
- A neuron = weighted sum + bias + activation.
- A network is layers of neurons; parameters = weights + biases.
- Training = forward pass, loss, backpropagation, update, repeated.
- Choose the architecture to match the data's structure.

---

## Practice Questions

1. Compute a ReLU neuron with inputs `[2, 1]`, weights `[0.4, 0.6]`, bias `-1`.
2. Parameters in a dense layer with 5 inputs and 3 neurons?
3. 2,000 samples, batch size 250: how many iterations per epoch?
4. Order these: update weights, forward pass, compute loss, backward pass.
5. Which neural network architecture suits (a) photos, (b) spreadsheet, (c) translation?
6. What problem do LSTM gates help solve?
7. What does validation loss rising while training loss falls indicate?
8. Why is a bias term useful?

---

## Answer Key

1. z = 0.8 + 0.6 − 1 = 0.4, ReLU → **0.4**.
2. 5×3 + 3 = **18**.
3. 2000 / 250 = **8**.
4. Forward pass → loss → backward pass → update.
5. (a) CNN, (b) MLP, (c) Transformer. For plain spreadsheet data, try gradient boosting or a linear model as a baseline first.
6. Vanishing gradients and forgetting over long sequences.
7. Overfitting.
8. It shifts the activation threshold so the neuron isn't forced through the origin.



## 1. The Artificial Neuron

### 1.1 How Does an Artificial Neuron Work?

A neuron performs three simple steps:

1. **Multiply:** Multiply each input by its weight.
2. **Add:** Add all the results together, then add the bias.
3. **Activate:** Apply an activation function to get the final output.

```text
z = (w1 × x1) + (w2 × x2) + ... + b
output = activation(z)
```

- `x`: Input values.
- `w`: Weights that determine the importance of each input.
- `b`: Bias, which adjusts the neuron's calculation.
- `z`: Result before applying the activation function.

![Two equal inputs contribute different amounts because of their weights. The negative contribution leaves the sum below zero even after adding the bias, so ReLU outputs zero.](../../../Assets/Connectionist%20AI/Static/weighted-neuron.svg)

**Why do we need bias?**

Bias allows a neuron to adjust its activation threshold. Without bias, the neuron's decision boundary must pass through the origin. Think of it as the `b` in the equation `y = mx + b`.

![With weight 1, changing the bias from 0 to −2 moves the input threshold from 0 to 2.](../../../Assets/Connectionist%20AI/Static/bias-threshold.svg)

**Worked Example**

Suppose we have:
- Inputs: `x = [1, 2]`
- Weights: `w = [0.5, -0.3]`
- Bias: `b = 0.4`

First, multiply the inputs by their weights and add the bias:

```text
z = (0.5 × 1) + (-0.3 × 2) + 0.4
z = 0.5 - 0.6 + 0.4
z = 0.3
```

Now, apply an activation function:

**ReLU (Rectified Linear Unit):** Converts negative values to 0 while keeping positive values unchanged. Formula: `max(0, z)`.
- **ReLU:** `max(0, 0.3)` = **0.3**

**Sigmoid:** Converts any input into a value between 0 and 1. Often used when the output represents a probability.
- **Sigmoid:** `1 / (1 + e^-0.3)` ≈ **0.574**

Both functions receive the same value but produce different outputs.

**Understanding Weights:**

- Positive weight: Increases the neuron's result.
- Negative weight: Decreases the neuron's result.
- Larger absolute weight: Has a stronger influence on the result.

## 2. Essential Terminology

| Term | Meaning |
|---|---|
| **Feature** | One input variable (a pixel, a price, a word embedding value) |
| **Input layer** | Receives the raw features. It does no computation |
| **Hidden layer** | Layers between input and output that learn intermediate features |
| **Output layer** | Produces the final prediction |
| **Weight** | Learned strength of a connection |
| **Bias** | Learned offset added before the activation |
| **Activation function** | Non-linear function applied to a neuron's sum (Chapter 4) |
| **Parameters** | All learnable numbers (weights and biases) |
| **Hyperparameters** | Settings chosen by *you*: learning rate, layers, units, batch size |
| **Forward pass** | Computing the output from the input |
| **Loss / cost function** | A number measuring how wrong the prediction is |
| **Backpropagation** | Computes how much each weight contributed to the loss |
| **Gradient** | The slope of the loss with respect to a parameter |
| **Gradient descent** | Moves parameters in the direction that reduces loss |
| **Learning rate** | Size of each update step |
| **Epoch** | One full pass through the training data |
| **Batch / mini-batch** | A subset of the data used for one update |
| **Iteration** | One update step (one batch) |
| **Overfitting** | Memorising training data, performing poorly on new data |
| **Underfitting** | Too simple to capture the pattern |
| **Generalisation** | Performing well on unseen data |
| **Training / validation / test sets** | Fit the weights / tune choices / final honest check |
| **Depth** | Number of layers. **Width** is the units per layer |

**Epochs, batches and iterations.** If you have 1,000 samples and a batch size of 100, one epoch = 10 iterations.

![One thousand training examples form ten batches of one hundred. With one update per batch, a full epoch contains ten updates.](../../../Assets/Connectionist%20AI/Static/batches-and-epochs.svg)

## 3. Layers and Matrix Form

A **dense (fully connected) layer** is a group of neurons where every neuron receives input from every neuron in the previous layer. Each connection has its own weight, and each neuron has its own bias.

For an entire layer, we can calculate all neuron outputs at once using:

```text
h = activation(W · x + b)
```

- `x`: Input vector containing the values passed into the layer (size `n_in`).
- `W`: Weight matrix containing the weights of all connections (size `n_out × n_in`).
- `b`: Bias vector, with one bias for each neuron (size `n_out`).
- `activation`: An activation function such as ReLU or Sigmoid.
- `h`: The output vector produced by the layer.

**How it works:** The layer multiplies each input by its corresponding weight, adds the biases, and applies an activation function to produce its outputs.

![A dense layer with three inputs and two neurons has one row of three weights and one bias for each output.](../../../Assets/Connectionist%20AI/Static/matrix-layer.svg)

**Parameter count of a dense layer** = `(n_in × n_out) + n_out`.

Parameters are the values (weights and biases) that a neural network learns during training.

**Example: 3 inputs → 4 neurons**
- Weights: 3 × 4 = 12
- Biases: 4 (one for each neuron)
- Total: 12 + 4 = **16 parameters**.

A network `3 → 4 → 4 → 1` has three sets of connections (one between each pair of neighbouring layers):

- Layer 1: (3 × 4 + 4) = 16
- Layer 2: (4 × 4 + 4) = 20
- Layer 3: (4 × 1 + 1) = 5

Total: 16 + 20 + 5 = **41 trainable parameters**.

## 4. A Complete Worked Example: Forward Pass, Loss and One Weight Update

A neural network learns by making predictions, checking how far they are from the correct answers, and adjusting its weights to reduce errors.

This process has four main steps:

1. **Forward Pass:** Calculate the network's prediction using the given inputs, weights, and biases.
2. **Loss Calculation:** Measure how far the prediction is from the correct answer.
3. **Backward Pass (Backpropagation):** Calculate how much a weight contributes to the error using derivatives and the chain rule.
4. **Weight Update:** Adjust the weight to reduce the error.

**Network Structure:**

A network with 2 inputs → 2 hidden neurons (ReLU) → 1 output neuron (linear).

Input: `x = [1, 2]`

Correct answer (target): `y = 1`

Hidden layer:
- Neuron 1: weights `[0.5, -0.3]`, bias `0.4`
- Neuron 2: weights `[0.2, 0.4]`, bias `-0.1`

Output neuron: weights `[1.0, -0.5]`, bias `0.2`.

![Signals travel from both inputs to both ReLU neurons, then combine at the output to predict 0.05.](../../../Assets/Connectionist%20AI/Animated/worked-network.svg)

### 4.1 Step 1: Forward Pass (Making a Prediction)

First, calculate the outputs of both hidden neurons using their weights, biases, and ReLU activation function.

```text
h1 = ReLU(0.5 × 1 + (-0.3) × 2 + 0.4)
h1 = ReLU(0.3) = 0.3

h2 = ReLU(0.2 × 1 + 0.4 × 2 - 0.1)
h2 = ReLU(0.9) = 0.9
```

Next, use these two outputs as inputs for the output neuron. Since it uses a linear activation, we simply calculate the weighted sum and add the bias.

```text
ŷ = 1.0 × 0.3 + (-0.5) × 0.9 + 0.2
ŷ = 0.3 - 0.45 + 0.2
ŷ = 0.05
```

The network's prediction is **0.05**, while the correct answer is **1**.

### 4.2 Step 2: Loss Calculation (Measuring the Error)

Loss measures how far the network's prediction is from the correct answer. Here, we use **Squared Error**, which squares the difference between the prediction and the target.

Formula:

```text
L = (Prediction - Target)²
```

Calculation:

```text
L = (ŷ - y)²
L = (0.05 - 1)²
L = (-0.95)²
L = 0.9025
```

The loss is **0.9025**. A smaller loss means the prediction is closer to the correct answer.

### 4.3 Step 3: Backward Pass (Calculating the Error's Effect)

Backpropagation calculates how much each weight affects the loss. This information helps the network decide how to adjust its weights.

For this example, we will only calculate the gradient for the output weight `v1 = 1.0` (from hidden neuron 1 to the output).

Using the **chain rule**, we calculate:

```text
dL/dŷ = 2(ŷ - y)
      = 2(0.05 - 1)
      = -1.9

dŷ/dv1 = h1
       = 0.3

dL/dv1 = (-1.9) × 0.3
       = -0.57
```

The result `-0.57` is the gradient. It tells us how changing this weight affects the loss.

Note: This example only calculates the gradient for one weight. A complete training process calculates gradients for all trainable weights and biases.

### 4.4 Step 4: Weight Update (Learning from the Error)

Now, we adjust the weight using the gradient and a value called the **learning rate**.

The learning rate controls how big each weight adjustment is. Here, we use `0.1`.

Formula:

```text
New Weight = Old Weight - (Learning Rate × Gradient)
```

Calculation:

```text
v1_new = 1.0 - (0.1 × -0.57)
v1_new = 1.0 + 0.057
v1_new = 1.057
```

The new weight is **1.057**, increased from 1.0.

This adjustment moves the prediction closer to the target value of 1.

### 4.5 What Happens Next?

![One training step predicts 0.05, computes a loss of 0.9025 and a gradient of −0.57, then updates the output weight to 1.057.](../../../Assets/Connectionist%20AI/Animated/training-step.svg)

The network repeats these steps during training:

- Make predictions using a forward pass.
- Calculate the loss to measure errors.
- Use backpropagation to calculate gradients.
- Update weights and biases using the gradients.

Repeating this process across many batches (groups of training examples) and epochs (complete passes through the training dataset) allows the network to gradually improve its predictions.
## 5. What Backpropagation Really Is

Backpropagation uses the **chain rule of calculus** to calculate how much each weight affects the loss. It works backward from the output, reusing calculations to efficiently find gradients for all weights. Its computational cost is typically a small multiple of a forward pass.

Libraries like PyTorch and TensorFlow automate this using **automatic differentiation**:

```python
import torch

v1 = torch.tensor(1.0, requires_grad=True)
h1 = torch.tensor(0.3)
h2 = torch.tensor(0.9)

loss = (v1 * h1 + (-0.5) * h2 + 0.2 - 1.0) ** 2
loss.backward()

print(v1.grad)  # tensor(-0.5700)
```

`loss.backward()` automatically calculates the gradient of the loss with respect to `v1`.

![The forward pass moves from weight to prediction to loss. The backward pass follows the same dependencies in reverse and multiplies local derivatives.](../../../Assets/Connectionist%20AI/Animated/chain-rule-path.svg)

## 6. The Learning Loop

1. **Forward pass:** make a prediction
2. **Compute loss:** compare with the truth
3. **Backward pass:** compute gradients
4. **Update:** `w ← w − learning_rate × gradient`
5. Repeat over batches and epochs, monitoring validation loss

![On a toy squared loss surface, successive gradient descent steps move closer to zero.](../../../Assets/Connectionist%20AI/Animated/descent-steps.svg)

## 7. Common Loss Functions

| Task | Output layer | Loss |
|---|---|---|
| Regression | Linear | Mean Squared Error (MSE) or MAE |
| Binary classification | Sigmoid | Binary cross-entropy |
| Multi-class classification | Softmax | Categorical cross-entropy |

**Cross-entropy example.** If the true class gets predicted probability 0.7, the loss is −ln(0.7) ≈ **0.357**. Probability 0.99 gives 0.010; probability 0.1 gives 2.30. Confident wrong answers are punished heavily.

![As errors grow, absolute error rises in a straight line and squared error rises increasingly quickly.](../../../Assets/Connectionist%20AI/Static/loss-shapes.svg)

## 8. Architectures

### 8.1 Feedforward Network / Multi-Layer Perceptron (MLP)
- Information flows one way, input → hidden → output.
- Every layer is dense.
- **Use for:** tabular data, simple regression and classification, and as building blocks inside bigger models.
- **Limit:** ignores structure (it doesn't know pixels are neighbours or that words come in order).

### 8.2 Convolutional Neural Network (CNN)
- A small **filter (kernel)** slides over the image, detecting a local pattern wherever it appears.
- **Weight sharing:** the same filter is reused across positions, so far fewer parameters than a dense layer.
- **Pooling** reduces size and adds tolerance to small shifts.
- Early layers detect edges, later layers detect textures, parts and objects.

![A two-by-two edge filter scans nine patches of an image. Each patch contributes one score at the corresponding location in the feature map.](../../../Assets/Connectionist%20AI/Animated/cnn-filter-scan.svg)

**Useful formulas**
- Output size = `floor((n − k + 2p) / s) + 1` (input size n, kernel k, padding p, stride s; dilation 1). `floor` means round down.
  Example: n = 32, k = 3, p = 1, s = 1 → (32 − 3 + 2)/1 + 1 = **32**.
- Parameters of a conv layer = `(k × k × c_in + 1) × c_out`.
  Example: 3×3 kernel, 3 input channels, 16 filters → (27 + 1) × 16 = **448**.

**Use for:** images, video, audio spectrograms, also some text and time series (1D convolution).

![Each coloured 2 by 2 block becomes one number, its largest value, in the pooled output.](../../../Assets/Connectionist%20AI/Static/max-pooling.svg)

### 8.3 Recurrent Networks: RNN, LSTM, GRU

![Three copies of the same recurrent cell show how the hidden state passes from one sequence step to the next.](../../../Assets/Connectionist%20AI/Animated/rnn-state.svg)

A basic RNN keeps a **hidden state** that carries information through a sequence:

```
h_t = tanh(Wx · x_t + Wh · h_(t-1) + b)
```
- **Problem:** gradients vanish over long sequences, so it forgets distant history.
- **LSTM** adds a **cell state** and three **gates** (forget, input, output) that decide what to erase, store and reveal.
- **GRU** is a lighter two-gate version.
- **Use for:** time series, speech, older text models. Largely replaced by Transformers in language, but still useful for small sequence tasks.

![An LSTM filters the old memory and new candidate before adding them. The output gate controls the exposed state.](../../../Assets/Connectionist%20AI/Static/lstm-gates.svg)

### 8.4 Transformer
- Uses **self-attention**: each element of a sequence computes how relevant every other element is, then mixes information accordingly.

![In an example attention head, the updated representation of “it” mixes information from three tokens with different weights.](../../../Assets/Connectionist%20AI/Static/attention-mix.svg)

```
Attention(Q, K, V) = softmax(Q·Kᵀ / √d) · V
```
- Processes the whole sequence **in parallel** (fast on GPUs) and captures long-range relationships directly.
- Needs **positional encodings**, since it has no built-in notion of order.
- **Use for:** language, and increasingly vision, audio, time series and multimodal tasks.

### 8.5 Autoencoder
- **Encoder** compresses input into a small **latent code**; **decoder** reconstructs the input from it.
- Trained to minimise reconstruction error, with no labels needed.
- **Use for:** dimensionality reduction, denoising, **anomaly detection** (anomalies reconstruct poorly).
- **Variational autoencoders (VAEs)** learn a smooth latent space that can generate new samples.

![An encoder compresses the input into a small code. The decoder reconstructs the input, and training compares the reconstruction with the original.](../../../Assets/Connectionist%20AI/Static/autoencoder-bottleneck.svg)

### 8.6 Generative Adversarial Network (GAN)
- **Generator** creates fake samples; **discriminator** tries to tell real from fake. They improve by competing.
- **Use for:** realistic image synthesis. Training can be unstable.

![A discriminator sees both training examples and generated examples. Its feedback trains the generator.](../../../Assets/Connectionist%20AI/Static/gan-feedback.svg)

### 8.7 Other Types Worth Knowing
- **Graph neural networks (GNNs):** data shaped as nodes and edges (molecules, social networks).
- **Diffusion models:** generate images by learning to remove noise step by step.

![Three neighbors send messages to a central graph node, which combines them with its own features.](../../../Assets/Connectionist%20AI/Static/graph-messages.svg)

### 8.8 Architecture Comparison

| Architecture | Typical data | Key idea | Main strength | Main limitation |
|---|---|---|---|---|
| MLP | Tabular | Dense layers | Simple, flexible | Ignores structure |
| CNN | Images | Local filters, shared weights | Efficient for spatial data | Limited long-range context |
| RNN/LSTM | Sequences | Hidden state | Handles variable length | Slow, hard to parallelise |
| Transformer | Text, sequences | Attention | Long-range, parallel | Memory heavy for long inputs |
| Autoencoder | Any | Compress and reconstruct | Unsupervised features | Reconstruction ≠ usefulness |
| GAN | Images | Generator vs discriminator | Sharp samples | Unstable training |

## 9. How to Choose an Architecture

1. Look at your **data type** (table, image, sequence, graph).
2. Start with the **simplest sensible model** (try gradient boosting or a linear model for plain tabular data; an MLP is a neural option, and pre-trained models suit many image and text tasks).
3. Build a **baseline** first, then add complexity only if needed.
4. Prefer **transfer learning** (reuse a pre-trained network) when data is limited.

## 10. Tiny Code Example (PyTorch)

```python
import torch
import torch.nn as nn

model = nn.Sequential(
    nn.Linear(2, 2),   # input 2 -> hidden 2
    nn.ReLU(),
    nn.Linear(2, 1)    # hidden 2 -> output 1
)

x = torch.tensor([[1.0, 2.0]])
y = torch.tensor([[1.0]])

loss_fn = nn.MSELoss()
opt = torch.optim.SGD(model.parameters(), lr=0.1)

for step in range(100):
    opt.zero_grad()
    loss = loss_fn(model(x), y)
    loss.backward()
    opt.step()

print(model(x).item())   # close to 1.0
```

## 11. Common Beginner Mistakes
- Forgetting to **scale inputs**, which makes training slow or unstable.
- Evaluating on training data only.
- Using softmax **and** a loss that already includes softmax (e.g. PyTorch `CrossEntropyLoss` expects raw scores).
- Making the network far bigger than the data justifies.
