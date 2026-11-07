# Chapter 4: Deep Learning and Activation Functions

## 1. What Is Deep Learning?

**Deep learning** is machine learning with neural networks that have **many hidden layers**. Each layer transforms its input into a slightly more abstract representation:

```
Image: pixels → edges → textures → object parts → whole objects
Text:  characters → words → phrases → sentence meaning
Audio: waveform → sounds → phonemes → words
```

This is called **hierarchical feature learning**. Before deep learning, engineers designed features by hand (e.g. edge detectors). Deep networks **learn the features automatically** from raw data.

![An illustrative image network combines pixels into edges, edges into a part, and parts into a wheel-like pattern.](../../../Assets/Connectionist%20AI/Static/feature-hierarchy.svg)

### Why Depth?
- **Efficiency:** some functions need exponentially many units in a single wide layer but far fewer in a deep one.
- **Reuse:** early layers learn general features reused by later layers.
- **Universal approximation:** with suitable activations and enough neurons, even a single hidden layer can approximate any continuous function on a closed, bounded input domain to any desired accuracy. Deep networks can represent some functions with far fewer parameters, but better generalisation is not guaranteed.

### Depth vs Width
| | Deeper | Wider |
|---|---|---|
| Learns | Hierarchies of features | More features per level |
| Risk | Harder to train (vanishing gradients) | Many parameters, can overfit |
| Fix | Residual connections, normalisation | Regularisation |

![One hidden layer with five units illustrates width, while three hidden layers with three units each illustrate depth.](../../../Assets/Connectionist%20AI/Static/depth-and-width.svg)

## 2. Why We Need Activation Functions

Without an activation, every layer is linear: `y = W·x + b`. Stacking two linear layers:

```
y1 = W1·x + b1
y2 = W2·y1 + b2 = W2·(W1·x + b1) + b2 = (W2·W1)·x + (W2·b1 + b2)
```

That is just **one** linear layer with a new weight matrix. No matter how many linear layers you stack, the result is still a straight-line (linear) function. It can never learn XOR, curved boundaries, or anything non-linear.

An **activation function** is a non-linear function applied after each layer's sum. It is what allows depth to add power.

**Desirable properties of an activation**
- **Non-linear**
- **Differentiable** (almost everywhere), so gradients can flow
- **Cheap to compute**
- **Well-behaved gradients** (not too small or too large)

![A composition of affine layers still graphs as a straight line. Adding ReLU can create a bend.](../../../Assets/Connectionist%20AI/Static/affine-composition.svg)

## 3. The Activation Functions

![Plots of sigmoid, tanh, ReLU, and leaky ReLU. ReLU stays flat for negative inputs, while leaky ReLU keeps a small positive slope.](../../../Assets/Connectionist%20AI/Static/activation-curves.svg)

### Reference Values

| z | sigmoid(z) | tanh(z) | ReLU(z) | Leaky ReLU (0.01) |
|---|---|---|---|---|
| −2 | 0.119 | −0.964 | 0 | −0.02 |
| −1 | 0.269 | −0.762 | 0 | −0.01 |
| 0 | 0.500 | 0.000 | 0 | 0 |
| 1 | 0.731 | 0.762 | 1 | 1 |
| 2 | 0.881 | 0.964 | 2 | 2 |

### 3.1 Sigmoid (Logistic)
```
σ(z) = 1 / (1 + e^-z)          range (0, 1)
σ'(z) = σ(z) · (1 − σ(z))      max slope = 0.25 (at z = 0)
```
- **Pros:** smooth; output interpretable as a probability.
- **Cons:** **saturates** (slope near 0 when |z| is large); outputs not zero-centred; exponential is costly.
- **Use today:** output layer of **binary classification**, and gates in LSTMs. Rarely in hidden layers.

![The sigmoid is steepest near zero and almost flat at either extreme.](../../../Assets/Connectionist%20AI/Static/sigmoid-saturation.svg)

### 3.2 Tanh
```
tanh(z) = (e^z − e^-z) / (e^z + e^-z)     range (−1, 1)
tanh'(z) = 1 − tanh²(z)                   max slope = 1
```
- **Pros:** zero-centred; stronger gradients than sigmoid.
- **Cons:** still saturates at the extremes.
- **Use:** LSTM/GRU internals, some small networks, outputs that must be in (−1, 1).

![Tanh maps zero to zero and maps equal-magnitude inputs to outputs of equal magnitude and opposite signs.](../../../Assets/Connectionist%20AI/Static/tanh-zero-centred.svg)

### 3.3 ReLU (Rectified Linear Unit)
```
ReLU(z) = max(0, z)
ReLU'(z) = 1 if z > 0, else 0
```
- **Pros:** very cheap; no saturation for positive z, so gradients flow well; produces **sparse** activations (many zeros); trains fast.
- **Cons:** **dying ReLU.** If a neuron's input is always negative, its output and gradient are both 0 forever, so it never recovers. Not zero-centred.
- **Use:** the **default hidden-layer activation** for MLPs and CNNs.

### 3.4 Leaky ReLU and PReLU
```
LeakyReLU(z) = z        if z > 0
               α·z      otherwise     (α = 0.01 typical)
```
- Keeps a small gradient for negative inputs, avoiding dead neurons.
- **PReLU** makes α a learned parameter.

![A magnified view shows the small negative-input slope of leaky ReLU compared with the flat ReLU.](../../../Assets/Connectionist%20AI/Static/relu-negative-zoom.svg)

### 3.5 ELU and SELU
- **ELU:** `z` if z > 0, else `α(e^z − 1)`. Smooth, pushes mean activations toward zero.
- **SELU:** a scaled ELU that can make networks self-normalise (needs specific initialisation).

![ELU and SELU have different negative limits and different slopes on the positive side.](../../../Assets/Connectionist%20AI/Static/elu-selu.svg)

### 3.6 GELU and Swish (SiLU)
```
GELU(z) = z · Φ(z)        (Φ = standard normal CDF)
Swish(z) = z · σ(z)
```
- Smooth, non-monotonic cousins of ReLU that often train slightly better.
- **GELU** is standard in **Transformers**; **Swish/SiLU** is common in modern CNNs.

![GELU and SiLU both dip below zero before curving upward.](../../../Assets/Connectionist%20AI/Static/gelu-silu.svg)

### 3.7 Softplus
```
softplus(z) = ln(1 + e^z)       smooth version of ReLU, always > 0
```
- Useful when an output must be **strictly positive**, e.g. a standard deviation σ in probabilistic forecasting.

![Softplus rounds the ReLU corner and stays above zero even for negative inputs.](../../../Assets/Connectionist%20AI/Static/softplus-relu.svg)

### 3.8 Softmax (output layer, multi-class)
```
softmax(z_i) = e^(z_i) / Σ_j e^(z_j)
```
- Converts a vector of raw scores (**logits**) to probabilities that **sum to 1**.
- **Example:** scores `[2, 1, 0]` → e² = 7.389, e¹ = 2.718, e⁰ = 1 → sum = 11.107 → probabilities ≈ `[0.665, 0.245, 0.090]`.
- Adding the same number to all scores doesn't change the result, so implementations subtract the max for stability.
- **Temperature:** dividing scores by T > 1 flattens the probabilities; T < 1 sharpens them.

![Softmax turns scores 2, 1, and 0 into probabilities of approximately 66.5%, 24.5%, and 9.0%, preserving their ranking.](../../../Assets/Connectionist%20AI/Static/softmax-scores.svg)

![The same logits produce sharper probabilities at low temperature and flatter probabilities at high temperature.](../../../Assets/Connectionist%20AI/Static/temperature-bars.svg)

### 3.9 Linear (Identity)
- No activation. Used for **regression outputs** where any real number is allowed.

## 4. How to Choose

| Where | Task | Activation |
|---|---|---|
| Hidden layers (default) | MLP / CNN | **ReLU** |
| Hidden layers | Many dead neurons | Leaky ReLU / ELU |
| Hidden layers | Transformers | **GELU** (or SwiGLU variants) |
| Hidden layers | RNN/LSTM internals | tanh and sigmoid (already built in) |
| Output | Binary classification | **Sigmoid** |
| Output | Multi-class (one label) | **Softmax** |
| Output | Multi-label (several labels at once) | Sigmoid per label |
| Output | Regression (any value) | **Linear** |
| Output | Regression, must be strictly positive (e.g. σ) | **Softplus** |
| Output | Bounded value in (0, 1) | Sigmoid |

## 5. Gradients Through Activations

During backpropagation, the gradient is multiplied by the activation's **derivative** at each layer. So the derivative shapes how well learning signals travel back.

### The Vanishing Gradient Problem
Sigmoid's derivative is at most 0.25. In a simplified calculation along one path, assuming weights of about 1 in magnitude, the activation derivatives multiply through many layers:

![From the output back through three layers, each gradient bar is one quarter the length of the previous bar.](../../../Assets/Connectionist%20AI/Animated/gradient-shrinkage.svg)

```
5 layers:   0.25^5  ≈ 0.001
10 layers:  0.25^10 ≈ 0.000001   (about 1 in a million)
```
In this example, early layers receive almost no learning signal, so they barely learn. Actual gradients also depend on the weights and the combined contributions of different paths. Sigmoid and tanh networks historically struggled beyond a few layers for this reason.

### The Exploding Gradient Problem
If each factor is larger than 1 (e.g. large weights), the product grows exponentially, so updates become huge and the loss becomes NaN. Common in RNNs.

![In a toy backward chain, doubling at each step grows a gradient from 1 to 16 in four steps.](../../../Assets/Connectionist%20AI/Static/exploding-gradient.svg)

### Remedies

| Problem | Fix |
|---|---|
| Vanishing | **ReLU-family** activations; proper **initialisation**; **batch/layer normalisation**; **residual (skip) connections**; LSTM/GRU for sequences |
| Exploding | **Gradient clipping**; smaller learning rate; good initialisation; normalisation |
| Dead ReLU | Leaky ReLU / ELU; lower learning rate; careful initialisation |

![Norm clipping shortens a gradient vector from magnitude five to magnitude two without changing its direction.](../../../Assets/Connectionist%20AI/Static/gradient-clipping.svg)

### Residual Connections (Skip Connections)
`output = layer(x) + x`. The "+ x" gives gradients a direct highway back, which is what made networks with hundreds of layers (ResNet) trainable.

![An animated residual block shows the input passing along two paths, with the original input added to the transformed result.](../../../Assets/Connectionist%20AI/Animated/residual-path.svg)

## 6. Weight Initialisation

Starting weights should keep activations and gradients at a stable scale:
- **All zeros:** bad. Every neuron in a layer behaves identically (symmetry).
- **Too large / too small:** signals explode or shrink layer after layer.
- **Xavier/Glorot:** variance ≈ 2/(n_in + n_out). Suits **tanh/sigmoid**.
- **He:** variance ≈ 2/n_in. Suits **ReLU-family**.

Frameworks apply sensible defaults, but know which to pick when building custom layers.

![When two units start identically and receive identical updates, they stay identical. Different starting weights can break that symmetry.](../../../Assets/Connectionist%20AI/Static/initialisation-symmetry.svg)

## 7. Code

### NumPy
```python
import numpy as np

def sigmoid(z): return 1 / (1 + np.exp(-z))
def relu(z):    return np.maximum(0, z)
def leaky(z, a=0.01): return np.where(z > 0, z, a*z)
def softmax(z):
    e = np.exp(z - np.max(z))     # subtract max for numerical stability
    return e / e.sum()

z = np.array([-2, -1, 0, 1, 2])
print(sigmoid(z).round(3))        # [0.119 0.269 0.5   0.731 0.881]
print(relu(z))                    # [0 0 0 1 2]
print(softmax(np.array([2., 1., 0.])).round(3))   # [0.665 0.245 0.09 ]
```

### PyTorch: a small deep network
```python
import torch.nn as nn

model = nn.Sequential(
    nn.Linear(20, 64), nn.ReLU(),
    nn.Linear(64, 64), nn.ReLU(),
    nn.Linear(64, 32), nn.ReLU(),
    nn.Linear(32, 3)          # 3 raw scores (logits)
)
# For multi-class, use nn.CrossEntropyLoss(), which applies softmax internally.
```

## 8. Common Mistakes
- Using **sigmoid in all hidden layers** of a deep network.
- Applying **softmax before** a loss that already includes it.
- Putting an activation on a **regression output** that should be unbounded.
- Using **ReLU on an output that can be negative**.
- Initialising all weights to the same value.

## Key Takeaways
- Depth lets networks build features in stages; activations make that useful.
- Without non-linear activations, any network collapses to a linear model.
- **ReLU** for hidden layers, **sigmoid/softmax/linear** for outputs, depending on the task.
- Vanishing gradients come from repeated multiplication by small derivatives; ReLU, good initialisation, normalisation and skip connections can reduce it.

---

## Practice Questions

1. Why can't stacked linear layers learn curved boundaries?
2. Compute ReLU(−2), ReLU(3.5), sigmoid(0).
3. Output activation for (a) spam/not spam, (b) digits 0–9, (c) house price?
4. Softmax of `[1, 1, 1]`?
5. What is the maximum slope of sigmoid?
6. What is "dying ReLU" and one fix?
7. Name two ways to reduce vanishing gradients.
8. Which activation suits an output that must be strictly positive?
9. Which initialisation pairs with ReLU?

---

## Answer Key

1. They collapse into a single linear function.
2. 0, 3.5, 0.5.
3. (a) Sigmoid, (b) Softmax, (c) Linear.
4. Each 1/3 ≈ 0.333.
5. 0.25.
6. A neuron stuck outputting 0 has zero gradient and stops learning. Fix: Leaky ReLU.
7. E.g. ReLU activations, residual connections, batch/layer normalisation, He initialisation.
8. Softplus. ReLU can output zero, so it does not guarantee a strictly positive output.
9. He initialisation.
