# Chapter 7: Online and Incremental Learning

**Level:** Beginner to Intermediate | **Reading time:** ~40 minutes

## What you will learn
- Batch vs incremental vs online learning, and when each fits
- How an online update works, with numbers
- Concept drift: types, detection and adaptation
- Catastrophic forgetting and continual-learning techniques
- How to evaluate models on streams (prequential evaluation)
- Practical code and design tips

---

## 1. Three Ways to Learn From Data

| Approach | How it learns | Data handling | Example |
|---|---|---|---|
| **Batch (offline)** | Trains on the full dataset, then is frozen. Retrained from scratch on a schedule | All data in memory | Monthly retraining of a sales model |
| **Incremental** | Updates an existing model with new chunks of data without restarting | Chunks (mini-batches) | Nightly update with the day's new data |
| **Online** | Updates after **each** example (or tiny group) as it arrives | One sample at a time, then discarded | Fraud model adjusting transaction by transaction |

The terms overlap. "Online learning" and "incremental learning" are often used loosely, and "continual (lifelong) learning" emphasises learning many tasks over time without forgetting.

![Offline training fits a full dataset then freezes a model. Incremental training updates with chunks. Online training updates with individual incoming examples.](../../../Assets/Connectionist%20AI/Static/ol-learning-modes.svg)

### Why Learn Online?
- **Streaming data:** sensors, clicks, transactions arrive continuously.
- **Too big for memory:** you process and discard.
- **Changing world:** patterns shift, so models go stale (Section 4).
- **Fast reaction:** adapting within minutes (news, trends, attacks).
- **Personalisation:** adapt to one user's behaviour.
- **Lower cost:** avoid retraining everything from scratch.

### Trade-offs
| Pros | Cons |
|---|---|
| Adapts quickly | Noisy updates, can be unstable |
| Memory efficient | Can forget old knowledge |
| No full retrain | Harder to debug and reproduce |
| Handles unbounded streams | Bad data can quickly corrupt the model |

## 2. How an Online Update Works

It is gradient descent (Chapter 10) applied to one sample at a time:

```
for each new example (x, y):
    1. predict:   ŷ = model(x)
    2. measure:   loss(ŷ, y)
    3. update:    weights ← weights − learning_rate · gradient
```

![An incoming example is first scored by the existing model. After its target is available, its error is measured and the model is updated for the next example.](../../../Assets/Connectionist%20AI/Animated/ol-update-sequence.svg)

### Worked Example: Online Linear Regression
Model: `ŷ = w·x`, loss `(ŷ − y)²`, gradient `2(ŷ − y)·x`, learning rate 0.1, start `w = 0`.

**Sample 1:** x = 2, y = 4
```
ŷ = 0·2 = 0
gradient = 2(0 − 4)·2 = −16
w = 0 − 0.1·(−16) = 1.6
```
**Sample 2:** x = 1, y = 2
```
ŷ = 1.6·1 = 1.6
gradient = 2(1.6 − 2)·1 = −0.8
w = 1.6 − 0.1·(−0.8) = 1.68
```
The weight moves toward the true value (2) as more data arrives. The model never stored the earlier samples.

![The chapter starts the linear model weight at zero. Sample one moves it to 1.6. Sample two moves it to 1.68, toward the illustrative underlying slope of two.](../../../Assets/Connectionist%20AI/Static/ol-weight-updates.svg)

### Streaming Statistics
You can't compute a mean over data you don't keep, so update **incrementally**:

```
new_mean = old_mean + (x − old_mean) / n
```
Example: old mean 10 over 3 values; new value 18 → n = 4 → new mean = 10 + 8/4 = **12**.

![The mean of three values is ten, giving total thirty. Adding a value of eighteen gives total forty-eight across four values, so the mean becomes twelve.](../../../Assets/Connectionist%20AI/Static/ol-running-mean.svg)

**Exponential moving average (EMA)** gives recent data more weight:
```
avg_new = α·x + (1 − α)·avg_old       (α = 0.1 means a long memory; 0.5 a short one)
```
This is how running feature normalisation can adapt to drift.

![After an observed level jumps from zero to ten, an exponential moving average with alpha 0.5 adapts faster than one with alpha 0.1.](../../../Assets/Connectionist%20AI/Static/ol-ema.svg)

### Learning Rate in Online Settings
- **Constant, moderate rate:** tracks change but stays noisy.
- **Decaying rate:** stable but eventually stops adapting. Not ideal if the world keeps changing.
- **Adaptive optimisers** (Adam, AdaGrad) are common; **Hoeffding trees** and **online linear models** are classic non-neural choices.

## 3. Mini-Batch Incremental Updates

Often you collect a small buffer (e.g. 32 or 256 samples) before each update. This reduces noise while remaining incremental, and works well with GPUs.

![A stream of examples fills a small buffer. One update uses the filled chunk, then the buffer is reused for later incoming data.](../../../Assets/Connectionist%20AI/Static/ol-chunk-updates.svg)

## 4. Concept Drift

**Concept drift** = the relationship between inputs and target changes over time, so a once-accurate model degrades.

| Type | Pattern | Example |
|---|---|---|
| **Sudden (abrupt)** | Jump to a new regime | A pandemic or new competitor changes buying overnight |
| **Gradual** | Old and new concepts mix, then switch | A new product slowly replaces an old one |
| **Incremental** | Slow, continuous drift | Customer tastes shifting over years |
| **Recurring** | Patterns return | Seasonal behaviour |
| **Outliers / blips** | Temporary spikes (not drift) | One-off event |

Related terms:
- **Covariate (data) drift:** the distribution of inputs `P(x)` changes, but the rule `P(y|x)` stays the same.
- **Label (prior) drift:** the class proportions change (e.g. fraud rate rises).
- **Real concept drift:** `P(y|x)` itself changes. This is the most damaging.

![Four schematic panels show an abrupt change, a gradual mixture transition, continuous incremental drift, and recurring behavior. Heights represent an illustrative concept statistic.](../../../Assets/Connectionist%20AI/Static/ol-drift-types.svg)

### Detecting Drift
1. **Monitor performance** (when true labels arrive): rising error rate.
2. **Statistical tests on error streams:** **ADWIN** (adaptive windowing), **DDM/EDDM**, **Page-Hinkley**, CUSUM.
3. **Compare input distributions:** Kolmogorov-Smirnov test, Population Stability Index (PSI), KL/JS divergence between a reference window and a recent window. Useful when labels are delayed.
4. **Model-based signals:** the model's confidence or prediction distribution shifts.

> **Delayed labels:** in demand forecasting you only learn actual demand after the period ends, so drift in *inputs* and *forecast errors* are monitored as soon as they become available.

![The input is available and a prediction is recorded before the true label arrives. Evaluation and supervised updating wait until the matching label is available.](../../../Assets/Connectionist%20AI/Static/ol-delayed-labels.svg)

### Adapting to Drift
| Strategy | Idea |
|---|---|
| **Sliding window** | Train only on the most recent N samples |
| **Forgetting / decay weights** | Weight recent samples more (e.g. exponential decay) |
| **Higher learning rate** after drift | Re-learn faster |
| **Trigger-based retraining** | Retrain when a detector fires |
| **Ensembles** | Keep several models of different ages; weight them by recent performance |
| **Periodic scheduled retraining** | Simple and often effective |

**Window-size trade-off:** a short window adapts quickly but is noisy; a long window is stable but slow to adapt.

![The window keeps four recent examples. As later examples arrive, the active window shifts right and older examples leave it.](../../../Assets/Connectionist%20AI/Animated/ol-recent-window.svg)

## 5. Catastrophic Forgetting

When a neural network is trained only on new data, it can **overwrite** weights that encoded earlier knowledge, so performance on the old data collapses. This is **catastrophic forgetting**. It is a major challenge in **continual learning** (learning a sequence of tasks or distributions).

**The stability–plasticity dilemma:** the model must be **plastic** enough to learn new things and **stable** enough to keep old ones.

![An illustrative model first learns task A, then trains only on task B. Its task B accuracy increases while task A performance falls.](../../../Assets/Connectionist%20AI/Static/ol-forgetting.svg)

### Main Techniques

| Family | Method | How it helps |
|---|---|---|
| **Replay / rehearsal** | Keep a small memory buffer of old examples; mix them with new data | Simple and very effective |
| **Generative replay** | A generator recreates old-like data instead of storing it | Saves memory/privacy |
| **Regularisation** | **EWC (Elastic Weight Consolidation):** penalise changes to weights important for old tasks | No stored data needed |
| **Knowledge distillation (LwF)** | Make the new model's outputs on new data match the old model's | Preserves behaviour |
| **Architecture-based** | Add new modules or freeze old ones; **parameter isolation** | No interference |
| **Gentle fine-tuning** | Low learning rate, freeze early layers | Limits overwriting |

**EWC idea:** new loss = `new-task loss + (λ/2) · Σ F_i · (θ_i − θ*_i)²` where `F_i` measures how important weight `i` was to the old task and `θ*` are the old weights. Important weights are "anchored".

**Reservoir sampling** keeps a fair random sample of a stream in a fixed-size replay buffer.

![New examples are combined with a sample of earlier examples retained in a bounded memory. The mixed batch updates the model.](../../../Assets/Connectionist%20AI/Static/ol-replay-buffer.svg)

## 6. Evaluating Online Models

A fixed test set doesn't reflect a changing stream. Use **prequential evaluation** (test-then-train):

```
for each incoming (x, y):
    1. predict ŷ = model(x)         ← test on data the model has NOT seen
    2. record the error
    3. update model with (x, y)     ← then train
```

Report a **sliding-window or fading-factor average** of the error so you can see performance over time and spot drift:

```
fading_sum   = α · fading_sum + current_error
fading_count = α · fading_count + 1
fading_error = fading_sum / fading_count            (α near 1 = long memory)
```

![For each arriving example, the model predicts before that example is used for training. The metric is updated with that prediction, then learning takes place.](../../../Assets/Connectionist%20AI/Static/ol-prequential.svg)

Also useful:
- **Compare against a frozen batch model** to see whether adaptation helps.
- **Track per-segment performance** (new vs returning users).
- Keep a **stable fallback** if the adaptive model degrades.

## 7. Code Examples

### scikit-learn `partial_fit`
```python
from sklearn.linear_model import SGDClassifier
import numpy as np

clf = SGDClassifier(loss="log_loss")
classes = np.array([0, 1])            # must be declared on the first call

for X_batch, y_batch in data_stream():            # your stream of mini-batches
    clf.partial_fit(X_batch, y_batch, classes=classes)
```

### Prequential loop with `river` (a streaming ML library)
```python
from river import linear_model, preprocessing, metrics

model = preprocessing.StandardScaler() | linear_model.LogisticRegression()
metric = metrics.Accuracy()

for x, y in stream:                  # x is a dict of features
    y_pred = model.predict_one(x)    # 1. test
    metric.update(y, y_pred)         # 2. score
    model.learn_one(x, y)            # 3. train
print(metric)
```

### PyTorch online step with a replay buffer
```python
import random, torch

buffer, BUF_SIZE = [], 1000
seen = 0                                  # samples seen so far

def online_step(model, opt, loss_fn, x, y):
    global seen
    seen += 1
    # reservoir sampling: every sample seen so far has an equal chance of being kept
    if len(buffer) < BUF_SIZE:
        buffer.append((x, y))
    else:
        j = random.randrange(seen)
        if j < BUF_SIZE:
            buffer[j] = (x, y)

    replay = random.sample(buffer, min(31, len(buffer)))  # samples replayed from the buffer
    batch = replay + [(x, y)]                             # always include the new one
    xb = torch.stack([b[0] for b in batch])
    yb = torch.stack([b[1] for b in batch])

    opt.zero_grad()
    loss = loss_fn(model(xb), yb)
    loss.backward()
    opt.step()
    return loss.item()
```

**Libraries to explore:** `river`, scikit-learn `partial_fit` estimators, Avalanche and Continuum (continual learning), Vowpal Wabbit.

## 8. Online Learning in Forecasting and Recommendation

- **Demand forecasting:** update the model as each day's actuals arrive; shorten the training window after a sudden event; use drift detectors on forecast error.
- **Recommendation:** user clicks update embeddings continuously (Chapter 8).
- **Reinforcement learning:** inherently online; the agent learns from each interaction (Chapter 9).

## 9. Practical Design Tips
- **Scale features with running statistics**, since the full-data mean is unknown.
- **Guard against bad data:** validate inputs, clip outliers, and avoid poisoned updates.
- **Keep versioned snapshots** so you can roll back.
- **Delay and batch updates** where per-sample updates are too noisy.
- **Watch for feedback loops:** the model's predictions influence what data you see next (e.g. only recommended items get clicked).
- **Test with simulated drift** before going live.
- **Log everything**: predictions, errors, drift alarms.

![Shown items generate observed interactions. Those interactions train the next model, influencing which items are shown again. Unshown items have less observed feedback.](../../../Assets/Connectionist%20AI/Animated/ol-feedback-loop.svg)

## 10. Common Pitfalls
- Assuming more adaptation is always better (it can chase noise)
- No replay or regularisation, leading to forgetting
- Evaluating on a static test set that hides drift
- Using a constantly decaying learning rate on a changing stream
- Updating on unverified labels

## Key Takeaways
- Online learning updates continuously; incremental learning updates in chunks; batch learning retrains.
- The world changes (concept drift), so detect and adapt with windows, weights, detectors and ensembles.
- Neural networks can forget; use replay, regularisation or gentle fine-tuning.
- Evaluate with prequential (test-then-train) and compare to a frozen baseline.

---

## Practice Questions

1. Batch vs online learning in one sentence each?
2. Two reasons to prefer online learning?
3. Mean of 4 values is 20; a fifth value 30 arrives. New mean?
4. A new competitor suddenly changes buying habits. Which drift type?
5. What is catastrophic forgetting?
6. Name two techniques that reduce forgetting.
7. Describe prequential evaluation.
8. Covariate drift vs real concept drift?
9. Trade-off of a short sliding window?

---

## Answer Key

1. Batch: train on all data, retrain periodically. Online: update as each sample arrives.
2. E.g. data streams, too big for memory, patterns change, fast adaptation.
3. 20 + (30 − 20)/5 = **22**.
4. Sudden drift.
5. New training overwrites old knowledge, so old-task performance collapses.
6. E.g. replay buffer, EWC, distillation, low learning rate.
7. Predict on each new sample first, record the error, then train on it.
8. Covariate: inputs change, rule stays. Real: the input-to-output relationship itself changes.
9. Adapts quickly but is noisier and uses less data.
