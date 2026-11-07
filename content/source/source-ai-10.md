---
type: lesson
id: source-ai-10
title: Model Training and Optimisation
topic: ai
summary: Chapter 10 · Model Training and Optimisation
prerequisites:
  - source-ai-09
source: Source/Content/Markdown/Connetionist-AI/10 model training and optimization.md
---

# Chapter 10: Model Training and Optimisation

**Level:** Beginner to Intermediate | **Reading time:** ~60 minutes

## What you will learn
- What training is trying to achieve, and how to split data
- Loss functions and gradient descent, with worked numbers
- Optimisers: SGD, Momentum, RMSprop, Adam, AdamW
- Learning rate, schedules and batch size
- Overfitting and the full regularisation toolbox
- Normalisation, initialisation and training stability
- Hyperparameter tuning, experiment tracking and a debugging checklist
- Efficiency tricks: mixed precision, transfer learning, and more

---

## 1. The Goal of Training

Find parameters (weights and biases) that **minimise a loss function** on training data while **generalising** to new data. Training too well on the training set is not success. Performance on unseen data is.

### Data Splits

| Set | Purpose | Typical share |
|---|---|---|
| **Training** | Fit the weights | 60–80% |
| **Validation** | Tune hyperparameters, choose when to stop, compare models | 10–20% |
| **Test** | One final, honest estimate of performance | 10–20% |

Rules:
- **Never tune on the test set.** Otherwise it stops being an unbiased estimate.
- **Time-ordered data** (Chapter 5): split chronologically.
- **Grouped data** (several rows from the same customer): keep each group in one split.
- **Imbalanced classes:** use **stratified** splits.
- **Cross-validation** (k-fold) gives more reliable estimates on small datasets.
- Prevent **data leakage**: fit scalers and encoders on training data only.

![Training fits weights, validation chooses settings, and the test set evaluates the chosen model.](/materials/Assets/Connectionist%20AI/Static/dataset-split.svg)

## 2. Loss Functions

| Task | Loss | Idea |
|---|---|---|
| Regression | **MSE** | mean((y − ŷ)²). Punishes big errors, sensitive to outliers |
| Regression | **MAE** | mean(\|y − ŷ\|). Robust to outliers |
| Regression | **Huber** | MSE for small errors, MAE for big ones |
| Binary classification | **Binary cross-entropy** | −[y·ln ŷ + (1−y)·ln(1−ŷ)] |
| Multi-class | **Categorical cross-entropy** | −Σ y_i·ln ŷ_i |
| Probabilistic forecast | **NLL / pinball** | Chapter 6 |
| Ranking | **BPR / contrastive** | Chapter 8 |
| Imbalanced classification | **Weighted CE / focal loss** | Emphasise rare or hard cases |

**Cross-entropy values:** correct-class probability 0.99 → loss 0.010; 0.7 → 0.357; 0.1 → 2.303. Confident wrong predictions cost the most.

**Sanity check:** with `C` balanced classes and random initial weights, the starting cross-entropy should be about `ln(C)`. For 10 classes, ln(10) ≈ **2.30**. If you see much more, something is wrong.

**Loss vs metric:** you *train* on a differentiable loss but *evaluate* with a metric that matters for the task (accuracy, F1, WAPE, NDCG). They can disagree, so monitor both.

![Cross-entropy for a correct class equals minus log of its assigned probability. The chapter examples are 0.99 to 0.010, 0.7 to 0.357, and 0.1 to 2.303.](/materials/Assets/Connectionist%20AI/Static/train-cross-entropy.svg)

## 3. Gradient Descent

The **gradient** points in the direction of steepest increase of the loss. We step the opposite way:

```
w ← w − η · ∂L/∂w            (η = learning rate)
```

**Worked example.** w = 2, gradient = 4, η = 0.1 → w = 2 − 0.4 = **1.6**.
If the gradient were −2 with w = 5, η = 0.5 → w = 5 + 1 = **6**.

**Landscape intuition.** Imagine walking downhill in fog. The gradient is the slope under your feet; the learning rate is your step size. Too big a step overshoots the valley; too small takes forever.

![Successive gradient descent steps approach the minimum of a toy squared loss.](/materials/Assets/Connectionist%20AI/Animated/descent-steps.svg)

### Backpropagation
Computes the gradient for **every** weight efficiently using the chain rule, working backwards from the loss. Frameworks do this automatically (`loss.backward()`).

![Backward gradients follow the forward dependencies in reverse.](/materials/Assets/Connectionist%20AI/Animated/chain-rule-path.svg)

### Variants

| Variant | Data per update | Notes |
|---|---|---|
| **Batch GD** | All data | Stable, but slow and memory heavy |
| **Stochastic GD (SGD)** | 1 sample | Very noisy, fast updates |
| **Mini-batch GD** | e.g. 32–512 samples | **The standard.** Good speed, noise and hardware use |

### Challenges in the Loss Landscape
- **Local minima:** in high dimensions, most points where the gradient is zero are **saddle points** or flat regions rather than bad minima.
- **Plateaus:** gradients near zero.
- **Ravines:** steep in one direction, shallow in another, so SGD zigzags (momentum helps).
- **Noise from mini-batches** is not entirely bad. It helps escape sharp minima and can improve generalisation.

## 4. Optimisers

### SGD with Momentum
Accumulates a **velocity** of past gradients, which smooths zigzags and speeds movement along consistent directions.
```
v ← β·v + g
w ← w − η·v         (β ≈ 0.9)
```
**Example** (constant gradient g = 1, η = 0.1, β = 0.9):
- Step 1: v = 1 → move 0.1
- Step 2: v = 1.9 → move 0.19
- Step 3: v = 2.71 → move 0.271

Steps grow while the direction stays consistent.
**Nesterov momentum** looks ahead before computing the gradient.

![With constant gradient one, beta 0.9 and learning rate 0.1, the three update sizes are 0.1,0.19,0.271. They grow as velocity accumulates.](/materials/Assets/Connectionist%20AI/Static/train-momentum.svg)

### AdaGrad, RMSprop
Give each parameter its **own step size**, shrinking it where gradients have been large.
RMSprop keeps a moving average of squared gradients (good for RNNs).

### Adam
Combines **momentum** (average of gradients, `m`) with **adaptive scaling** (average of squared gradients, `v`):
```
m ← β1·m + (1−β1)·g
v ← β2·v + (1−β2)·g²
m̂ = m/(1−β1^t),  v̂ = v/(1−β2^t)        (bias correction)
w ← w − η · m̂ / (√v̂ + ε)
```
Defaults: **η = 1e-3, β1 = 0.9, β2 = 0.999, ε = 1e-8**.
Fun fact: on the very first step the update size is about **η** regardless of the gradient's scale (since m̂/√v̂ ≈ ±1).

![The same gradient contributes to a first-moment average and a second-moment average of squared gradients. Bias-corrected estimates combine to scale the update.](/materials/Assets/Connectionist%20AI/Static/train-adam.svg)

### AdamW
Adam with **decoupled weight decay**, the usual choice for Transformers and many modern models.

| Optimiser | Strengths | Watch out for |
|---|---|---|
| **SGD + momentum** | Often best final generalisation (vision) | Needs careful learning rate and schedule |
| **Adam** | Fast, robust default | Sometimes slightly worse generalisation |
| **AdamW** | Proper weight decay | — |
| **RMSprop** | Good for RNNs, RL | — |
| **LAMB / LARS** | Very large batch training | Specialised |

> **Rule of thumb:** start with **AdamW, lr = 1e-3** (or 3e-4 for Transformers) and tune from there.

## 5. The Learning Rate

The most important hyperparameter.

| Learning rate | Typical symptom |
|---|---|
| Too low | Loss barely moves; very slow |
| Good | Steady decrease |
| Too high | Loss oscillates, spikes, or becomes **NaN** |

**Finding it:** the **learning-rate range test** increases the rate exponentially over a short run; pick a value somewhat below where the loss starts to rise sharply. Often tried: 1e-1, 1e-2, 1e-3, 1e-4.

![On this toy quadratic, rate 0.02 converges slowly, 0.2 converges quickly, and 1.005 diverges. All losses are divided by the starting loss.](/materials/Assets/Connectionist%20AI/Static/train-learning-rate.svg)

### Schedules

| Schedule | Idea |
|---|---|
| **Constant** | Simple baseline |
| **Step decay** | Multiply by e.g. 0.1 every N epochs |
| **Exponential decay** | Smooth shrink each epoch |
| **Cosine annealing** | Smoothly follows a cosine curve to near zero |
| **Warm-up** | Start tiny, ramp up over the first steps (stabilises Transformers and Adam) |
| **ReduceLROnPlateau** | Cut the rate when validation loss stalls |
| **One-cycle** | Ramp up then down in one run; often very fast training |

```python
opt = torch.optim.AdamW(model.parameters(), lr=1e-3, weight_decay=1e-2)
sched = torch.optim.lr_scheduler.CosineAnnealingLR(opt, T_max=50)
# call sched.step() once per epoch
```

![Illustrative schedules compare step decay, cosine annealing, and linear warm-up followed by cosine decay. The vertical axis is normalized to each schedule's peak.](/materials/Assets/Connectionist%20AI/Static/train-lr-schedules.svg)

## 6. Batch Size

| Small batch (8–64) | Large batch (512+) |
|---|---|
| Noisier gradients (can regularise) | Smoother, accurate gradients |
| More updates per epoch | Faster per epoch on GPUs |
| Less memory | More memory |
| Often generalises a bit better | May need larger learning rate and warm-up |

A common heuristic is to scale the learning rate with batch size. **Gradient accumulation** simulates a large batch by summing gradients over several small batches before one update.

![Four micro-batches produce four gradient contributions. These are averaged before one optimizer update, giving an effective batch of sixty-four for four micro-batches of sixteen.](/materials/Assets/Connectionist%20AI/Static/train-accumulation.svg)

## 7. Overfitting and Underfitting

| | Training error | Validation error | What to do |
|---|---|---|---|
| **Underfitting (high bias)** | High | High | Bigger model, train longer, better features, lower regularisation |
| **Good fit** | Low | Low and close | — |
| **Overfitting (high variance)** | Very low | High | More data, regularise, simpler model, early stopping |

**Learning curves:** plot training and validation loss against epochs (or data size). A widening gap signals overfitting; both stuck high signals underfitting.

**Bias–variance trade-off:** simple models are stable but may miss patterns (bias); complex models fit anything but are sensitive to the training sample (variance). Modern deep networks with enough data and regularisation often sit well in the "very large but regularised" regime.

![Illustrative training loss continues falling while validation loss reaches its lowest point and then rises. The lowest-validation checkpoint is marked.](/materials/Assets/Connectionist%20AI/Static/train-overfitting.svg)

## 8. Regularisation Toolbox

| Technique | How it helps |
|---|---|
| **More data** | Often the most effective regulariser |
| **Data augmentation** | Create varied examples: flips, crops, noise, time-warp, mixup |
| **L2 / weight decay** | Penalises large weights → smoother functions |
| **L1** | Pushes weights to exactly zero (sparse models) |
| **Dropout** | Randomly zeroes a fraction (e.g. 20–50%) of units during training, preventing co-dependence. Disabled at inference (`model.eval()`) |
| **Early stopping** | Stop when validation loss stops improving; keep the best checkpoint |
| **Smaller / simpler model** | Fewer parameters to memorise with |
| **Label smoothing** | Soften targets (e.g. 0.9 / 0.1) to reduce overconfidence |
| **Ensembling** | Average several models |
| **Noise injection** | Add noise to inputs or weights |
| **Transfer learning** | Start from a pre-trained network |

**L2 regularised loss:** `L_total = L_data + λ · Σ w²`.
**Dropout detail:** with rate p, surviving activations are scaled by 1/(1−p) during training ("inverted dropout") so inference needs no change.

![The training mask alternates between two example subsets of zeroed units. The evaluation layer uses all units. Surviving units are scaled appropriately during inverted dropout training.](/materials/Assets/Connectionist%20AI/Animated/train-dropout.svg)

## 9. Normalisation, Initialisation and Stability

### Input Scaling
Standardise features (mean 0, std 1), or scale to [0, 1]. It speeds training and avoids features with large ranges dominating. Use **training-set statistics only**.

### Normalisation Layers
| Layer | Normalises over | Typical use |
|---|---|---|
| **Batch Norm** | The batch, per feature/channel | CNNs |
| **Layer Norm** | Features within one sample | Transformers, RNNs |
| **Group / Instance Norm** | Groups of channels | Small batches, style tasks |

Benefits: faster, more stable training; allows higher learning rates; mild regularisation.
Remember: Batch Norm behaves differently in `train()` and `eval()` mode.

![In the left sample-by-feature matrix, batch normalization uses values down one feature column. In the right matrix, layer normalization uses the features across one sample row.](/materials/Assets/Connectionist%20AI/Static/train-normalisation-axes.svg)

### Weight Initialisation
- **Never all zeros** (symmetry: every neuron learns the same thing).
- **Xavier/Glorot** for tanh/sigmoid; **He** for ReLU-family.
- Frameworks default to sensible choices, but custom layers need care.

![Identical incoming weights can preserve identical behavior when updates are the same.](/materials/Assets/Connectionist%20AI/Static/initialisation-symmetry.svg)

### Gradient Clipping
Cap the gradient norm (e.g. 1.0) to stop exploding gradients:
```python
torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
```

![Norm clipping scales a gradient vector while keeping its direction.](/materials/Assets/Connectionist%20AI/Static/gradient-clipping.svg)

### Residual Connections
`output = layer(x) + x` lets gradients flow through very deep networks (Chapter 4).

![The input passes through a transformation and also reaches the output by an identity path.](/materials/Assets/Connectionist%20AI/Animated/residual-path.svg)

## 10. Hyperparameter Tuning

Typical hyperparameters: learning rate, batch size, depth and width, dropout rate, weight decay, optimiser, schedule, augmentation strength.

| Method | Notes |
|---|---|
| **Manual** | Start here; use intuition, change one thing at a time |
| **Grid search** | Try all combinations. Costly, wasteful for many parameters |
| **Random search** | Often **more efficient** than grid: tries more distinct values of the important parameters |
| **Bayesian optimisation** (Optuna, Ray Tune) | Uses past trials to choose promising settings |
| **Successive halving / Hyperband** | Stop poor runs early |
| **Population-based training** | Evolve hyperparameters during training |

![Grid search tests a regular set of combinations. Random search spreads a similar number of trials over distinct settings, with learning rate and decay represented on log scales.](/materials/Assets/Connectionist%20AI/Static/train-hyperparameter-search.svg)

**Tips**
- Tune on a **log scale** for learning rate and weight decay (e.g. 1e-5 to 1e-1).
- Tune the **learning rate first**, then batch size, then regularisation.
- Use a **small, fast version** of the problem for initial sweeps.
- Fix random seeds when comparing, and repeat with several seeds for important decisions.

## 11. A Complete Training Loop (PyTorch)

```python
import torch, torch.nn as nn

model = nn.Sequential(nn.Linear(10, 32), nn.ReLU(),
                      nn.Dropout(0.2), nn.Linear(32, 1))
loss_fn = nn.MSELoss()
opt = torch.optim.AdamW(model.parameters(), lr=1e-3, weight_decay=1e-2)
sched = torch.optim.lr_scheduler.ReduceLROnPlateau(opt, factor=0.5, patience=3)

best_val, patience, wait = float("inf"), 8, 0
for epoch in range(200):
    # ---- training ----
    model.train()
    for X, y in train_loader:
        opt.zero_grad()
        loss = loss_fn(model(X), y)
        loss.backward()
        torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
        opt.step()

    # ---- validation ----
    model.eval()
    with torch.no_grad():
        val_loss = sum(loss_fn(model(X), y).item() for X, y in val_loader) / len(val_loader)
    sched.step(val_loss)

    # ---- early stopping + checkpoint ----
    if val_loss < best_val:
        best_val, wait = val_loss, 0
        torch.save(model.state_dict(), "best.pt")
    else:
        wait += 1
        if wait >= patience:
            break

model.load_state_dict(torch.load("best.pt"))
```

![Each batch clears old gradients, runs a forward pass, computes gradients, and updates parameters. After each epoch, validation decides whether to save a checkpoint or stop.](/materials/Assets/Connectionist%20AI/Animated/train-loop.svg)

## 12. Debugging Checklist

1. **Overfit one tiny batch** (e.g. 10 samples). A healthy model reaches near-zero loss. If not, there is a bug.
2. **Check the data pipeline:** shapes, label alignment, scaling, no leakage. Look at a few real samples.
3. **Check initial loss** against theory (e.g. ln(C) for classification).
4. **Plot** training and validation loss (and metrics) every epoch.
5. **Loss is NaN or inf:** lower the learning rate, clip gradients, check for division by zero or log(0), inspect the data for NaNs.
6. **Loss not decreasing:** wrong learning rate, forgot `zero_grad()`, frozen layers, bad labels, dead ReLUs, or too much regularisation.
7. **Training good, validation bad:** overfitting, or train/validation distribution mismatch.
8. **Both bad:** underfitting, weak features, or too short training.
9. **Validation better than training?** Dropout on during training, or leakage.
10. **Change one thing at a time** and log every run.
11. **Compare to a simple baseline** (Chapter 5) to know if the model is adding value.

![If a model cannot overfit a tiny training batch, inspect the implementation and data. If it can, compare full training and validation behavior to investigate underfitting, overfitting, or data mismatch.](/materials/Assets/Connectionist%20AI/Static/train-debug-flow.svg)

## 13. Efficiency and Practical Tricks

- **GPU / TPU** training; keep data loading from becoming the bottleneck (`num_workers`, prefetching).
- **Mixed precision** (float16 / bfloat16): faster and lighter on memory.
- **Gradient accumulation** for large effective batches.
- **Gradient checkpointing:** trade compute for memory in very deep models.
- **Transfer learning / fine-tuning:** start from a pre-trained model, often the biggest win with limited data. Freeze early layers first, then optionally unfreeze with a small learning rate.
- **Parameter-efficient fine-tuning (e.g. LoRA):** train a few extra parameters instead of the whole model.
- **Checkpointing:** save regularly so you can resume.
- **Reproducibility:** set seeds, record library versions, config and data version.
- **Experiment tracking:** TensorBoard, Weights & Biases, MLflow.
- **Model compression for deployment:** pruning, quantisation, distillation.

![A pretrained feature extractor can be frozen while a new task head is trained. A later fine-tuning phase may unfreeze selected layers at a smaller learning rate.](/materials/Assets/Connectionist%20AI/Static/train-transfer-freeze.svg)

## 14. Common Mistakes
- Tuning on the test set
- Leakage from scaling or splitting incorrectly
- Forgetting `model.eval()` at validation or inference
- Comparing models using a single random seed
- Changing many things at once
- Training far longer than validation justifies
- Not saving the best checkpoint

## Key Takeaways
- Training minimises a loss with gradient descent, using backpropagation for gradients.
- **AdamW** is a strong default; the **learning rate** matters most, and schedules help.
- Combat overfitting with data, augmentation, weight decay, dropout, early stopping.
- Normalisation, good initialisation, clipping and residual connections keep training stable.
- Debug methodically: tiny-batch overfit, loss curves, baselines, one change at a time.

---

## Practice Questions

1. One gradient step: w = 5, gradient = −2, η = 0.5?
2. Batch vs stochastic vs mini-batch GD?
3. Training loss 0.02, validation loss 0.45. Diagnosis and three fixes?
4. What happens if the learning rate is too high? Too low?
5. Validation set vs test set?
6. How does dropout reduce overfitting?
7. Why not initialise all weights to zero?
8. Expected starting cross-entropy for 10 balanced classes?
9. What is early stopping?
10. Name two benefits of transfer learning.
11. Typical Adam default learning rate?
12. Momentum: v = 0, β = 0.9, g = 1. What are v after steps 1 and 2?

---

## Answer Key

1. 5 − 0.5×(−2) = **6**.
2. Batch uses all data per update; stochastic uses 1 sample; mini-batch uses a small group (most common).
3. Overfitting. Fixes: more data/augmentation, dropout, weight decay, smaller model, early stopping.
4. Too high: oscillation or divergence (NaN). Too low: very slow or stalled training.
5. Validation tunes and selects; test gives a final unbiased estimate.
6. It randomly disables units so the network can't rely on specific ones, learning more robust features.
7. All neurons would be identical and learn the same thing (symmetry).
8. About ln(10) ≈ **2.3**.
9. Stop when validation loss stops improving, keeping the best checkpoint.
10. Needs less data and training time, and often reaches higher accuracy.
11. **1e-3**.
12. Step 1: v = 1. Step 2: v = 0.9×1 + 1 = **1.9**.

---

# 🎓 Course Wrap-Up

You have now covered the connectionist AI journey: what it is (Ch 1), how networks work (Ch 2), where they're used (Ch 3), depth and activations (Ch 4), forecasting (Ch 5–6), learning from streams (Ch 7), recommendations (Ch 8), reinforcement learning (Ch 9), and how to train well (Ch 10).

**Suggested next steps**
1. Train a small MLP on a tabular dataset and compare it with gradient boosting.
2. Forecast a public time series, beating a seasonal naive baseline and checking interval coverage.
3. Implement the corridor Q-learning, then try a Gymnasium environment with PPO.
4. Build a matrix-factorisation recommender on a small ratings dataset.

Practising on real data is the fastest way to make these ideas stick.


## Reading note

The PyTorch loop below requires an external Python environment with PyTorch installed. Its inputs have shape [batch, 10] and targets [batch, 1]. Provide train_loader and val_loader before running it. For validation with unequal batch sizes, accumulate batch mean loss multiplied by batch size, then divide by the total number of examples; averaging batch means equally overweights a smaller final batch.
