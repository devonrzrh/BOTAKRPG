---
type: lesson
id: source-ai-06
title: Probabilistic Forecasting
topic: ai
summary: Chapter 6 · Probabilistic Forecasting
prerequisites:
  - source-ai-05
source: Source/Content/Markdown/3_Connectionist-AI/06 probabilistic forecasting.md
---

# Chapter 6: Probabilistic Forecasting

**Level:** Beginner to Intermediate | **Reading time:** ~45 minutes

## Learning Objectives
## Contents

- [Learning Objectives](#learning-objectives)
- [1. Point vs Probabilistic Forecasts](#1-point-vs-probabilistic-forecasts)
- [2. Where Does Uncertainty Come From?](#2-where-does-uncertainty-come-from)
- [3. Core Concepts](#3-core-concepts)
- [4. Three Ways Neural Networks Forecast Probabilistically](#4-three-ways-neural-networks-forecast-probabilistically)
- [5. The Pinball (Quantile) Loss](#5-the-pinball-quantile-loss)
- [6. A Gaussian Forecasting Head in PyTorch](#6-a-gaussian-forecasting-head-in-pytorch)
- [7. Evaluating Probabilistic Forecasts](#7-evaluating-probabilistic-forecasts)
- [8. Conformal Prediction (Distribution-Free Calibration)](#8-conformal-prediction-distribution-free-calibration)
- [9. From Probabilistic Forecast to Decision (The Newsvendor Idea)](#9-from-probabilistic-forecast-to-decision-the-newsvendor-idea)
- [10. Common Pitfalls](#10-common-pitfalls)
- [Key Takeaways](#key-takeaways)
- [Practice Questions](#practice-questions)
- [Answer Key](#answer-key)

- Why a single number is not enough, and what a forecast distribution is
- Quantiles, prediction intervals and how to read them
- Three ways neural networks produce probabilistic forecasts
- The Gaussian negative log-likelihood and the pinball (quantile) loss, with worked numbers
- Calibration, sharpness and the main metrics (coverage, CRPS)
- How to turn a probabilistic forecast into a decision

---

## 1. Point vs Probabilistic Forecasts

A **point forecast** says: *"Demand next week will be 100 units."*

A **probabilistic forecast** says: *"Demand will most likely be near 100, with an 80% chance it falls between 70 and 135."*

Why this matters:
- **Risk-aware decisions.** Stocking 100 units is very different if demand could be 99–101 versus 20–300.
- **Asymmetric costs.** Running out might cost more than overstocking, so the best order isn't the average.
- **Trust.** A forecast that says "I'm not sure" lets planners plan buffers.
- **Rare events.** Capacity planning cares about peaks (the 95th percentile), not the average.

![A point forecast at one hundred is shown inside a normal predictive distribution with mean one hundred and standard deviation ten. Different widths represent different uncertainty, even for the same point forecast.](/materials/Assets/Connectionist%20AI/Static/pf-point-distribution.svg)

## 2. Where Does Uncertainty Come From?

| Type | Meaning | Reducible? | Example |
|---|---|---|---|
| **Aleatoric** | Inherent randomness in the process | No | Whether a given customer walks in today |
| **Epistemic** | The model's lack of knowledge | Yes (more data or a better model) | A new product with little history |

Further sources: measurement error, unknown future covariates (e.g. tomorrow's weather), model mis-specification, and changing patterns (Chapter 7).

![The left panel shows random variation around a shared pattern. The right shows several model predictions disagreeing increasingly over the forecast range. Curves are illustrative.](/materials/Assets/Connectionist%20AI/Static/pf-uncertainty-sources.svg)

## 3. Core Concepts

- **Predictive distribution:** the full set of possible future values with their probabilities.
- **Quantile (percentile):** the value below which a stated share of outcomes fall.
  - **P50** = median
  - **P90** = 90% of outcomes expected at or below this value
- **Prediction interval:** a range expected to contain the true value with stated probability.
  - 80% interval = [P10, P90]
  - 90% interval = [P05, P95]
- **Fan chart:** a plot showing widening bands of intervals around the central forecast.

![For a normal distribution with mean one hundred and standard deviation ten, P10 is about 87.2 and P90 about 112.8. The interval between them contains eighty percent of probability.](/materials/Assets/Connectionist%20AI/Static/pf-quantiles.svg)

### 3.1 Intervals for a Gaussian Forecast
If the forecast is Normal with mean μ and standard deviation σ:

| Interval | Range |
|---|---|
| ~68% | μ ± 1.00σ |
| 80% | μ ± 1.28σ |
| 90% | μ ± 1.645σ |
| 95% | μ ± 1.96σ |

Example: μ = 100, σ = 10 → 90% interval ≈ [83.6, 116.5].

> **Warning:** intervals from a statistical model are not guaranteed to be right. They must be **checked** (see calibration).

![All intervals are centered on one hundred with standard deviation ten. The sixty-eight, eighty, ninety and ninety-five percent intervals use progressively wider bounds.](/materials/Assets/Connectionist%20AI/Static/pf-gaussian-intervals.svg)

![Nested illustrative forecast bands widen with horizon. The inner band represents an eighty percent interval and the outer band a ninety-five percent interval.](/materials/Assets/Connectionist%20AI/Static/pf-fan-chart.svg)

## 4. Three Ways Neural Networks Forecast Probabilistically

### 4.1 Predict the Parameters of a Distribution
The network outputs, e.g., a mean μ and standard deviation σ (for a Gaussian). It is trained to make the **observed value likely** under that distribution by minimising the **negative log-likelihood (NLL)**.

**Gaussian NLL for one observation:**
```
NLL = ½ · ln(2πσ²) + (y − μ)² / (2σ²)
```
Two forces: the second term punishes errors (more strongly when σ is small); the first term punishes large σ. The model must balance being accurate with being honestly uncertain.

**Worked example.** True value y = 100, predicted mean μ = 90:

| σ | ½·ln(2πσ²) | (y−μ)²/(2σ²) | NLL |
|---|---|---|---|
| 5 (overconfident) | 2.53 | 100/50 = 2.00 | **4.53** |
| 10 (about right) | 3.22 | 100/200 = 0.50 | **3.72** |
| 20 (too vague) | 3.92 | 100/800 = 0.13 | **4.04** |

The best σ is the one matching the actual error size (10 here). Both overconfidence and vagueness are penalised. That is the essence of honest probabilistic training.

![Three normal forecasts share a mean of ninety and have standard deviations five, ten and twenty. A vertical marker locates the observed value at one hundred.](/materials/Assets/Connectionist%20AI/Static/pf-nll-width.svg)

**Choosing the distribution matters:**
| Data | Suitable distribution |
|---|---|
| Continuous, roughly symmetric | Gaussian, Student-t (heavier tails) |
| Strictly positive, skewed | Log-normal, Gamma |
| Counts (units sold) | Poisson, **Negative Binomial** (handles over-dispersion) |
| Many zeros | Zero-inflated Negative Binomial |

Make σ positive with **softplus** on the network's output (Chapter 4).

**Example model: DeepAR.** An autoregressive LSTM, trained across many related series, that outputs distribution parameters at each step. To forecast, it **samples** future paths repeatedly and reads off quantiles from the samples.

### 4.2 Predict Quantiles Directly
The network has one output per quantile (e.g. P10, P50, P90) and is trained with the **quantile (pinball) loss**. No distribution assumption is required. Examples: Temporal Fusion Transformer, N-HiTS and many MLP/LSTM forecasters.

![Shared neural features can branch into a mean and a positive standard deviation for a Gaussian forecast, or into separate quantile predictions.](/materials/Assets/Connectionist%20AI/Static/pf-output-heads.svg)

### 4.3 Sampling and Ensemble Approaches
- **Deep ensembles:** train several networks with different random seeds. Disagreement estimates epistemic uncertainty.
- **Monte Carlo dropout:** keep dropout on at prediction time and run many forward passes. The spread approximates uncertainty.
- **Bayesian neural networks:** learn distributions over weights (powerful, costlier).
- **Conformal prediction:** wrap *any* model so its intervals have a guaranteed average coverage level, as long as new data resembles the calibration data (see below).
- **Generative models** (diffusion, normalising flows): sample entire future trajectories.

![Six illustrative future trajectories start from the same history and diverge over time. Their spread can be summarized as forecast quantiles.](/materials/Assets/Connectionist%20AI/Animated/pf-sampled-paths.svg)

## 5. The Pinball (Quantile) Loss

For a target quantile τ (0 < τ < 1), true value `y`, prediction `q`:

```
loss = τ · (y − q)          if y ≥ q   (we under-predicted)
loss = (1 − τ) · (q − y)    if y < q   (we over-predicted)
```

**Worked example** with τ = 0.9, y = 100:
- q = 90 (too low): loss = 0.9 × 10 = **9**
- q = 110 (too high): loss = 0.1 × 10 = **1**
- q = 100 (exact): loss = **0**

Because under-predicting costs 9× more than over-predicting, the model learns to set its P90 high enough that only about **10%** of actual values exceed it. For τ = 0.5 the loss is half the absolute error (so P50 learns the median).

```python
import torch

def pinball_loss(y, q_pred, tau):
    diff = y - q_pred
    return torch.mean(torch.maximum(tau * diff, (tau - 1) * diff))

# multi-quantile training
quantiles = [0.1, 0.5, 0.9]
def multi_quantile_loss(y, preds):         # y: (batch,), preds: (batch, len(quantiles))
    return sum(pinball_loss(y, preds[:, i], q) for i, q in enumerate(quantiles))
```

**Quantile crossing:** sometimes the model outputs P90 < P50. Fix by sorting the outputs, or by predicting P50 plus non-negative increments.

![For a fixed true value of one hundred, predicting ninety costs nine while predicting one hundred ten costs one. The underprediction branch is nine times as steep as the overprediction branch.](/materials/Assets/Connectionist%20AI/Static/pf-pinball.svg)

## 6. A Gaussian Forecasting Head in PyTorch

```python
import torch
import torch.nn as nn
import torch.nn.functional as F

class GaussianForecaster(nn.Module):
    def __init__(self, n_in, hidden=64):
        super().__init__()
        self.body = nn.Sequential(nn.Linear(n_in, hidden), nn.ReLU(),
                                  nn.Linear(hidden, hidden), nn.ReLU())
        self.mu = nn.Linear(hidden, 1)
        self.sigma = nn.Linear(hidden, 1)

    def forward(self, x):
        h = self.body(x)
        mu = self.mu(h)
        sigma = F.softplus(self.sigma(h)) + 1e-4   # strictly positive
        return mu, sigma

# built-in loss:
# loss = torch.nn.GaussianNLLLoss()(mu, y, sigma**2)
```

![Softplus keeps a distribution-scale output strictly positive.](/materials/Assets/Connectionist%20AI/Static/softplus-relu.svg)

## 7. Evaluating Probabilistic Forecasts

A good probabilistic forecast should be **calibrated** and **sharp**.

### 7.1 Calibration (Reliability)
Do stated probabilities match reality?
- If you issue many **80% intervals**, about **80%** of actual values should fall inside. This is the **empirical coverage**.
- Coverage below target → **overconfident** (intervals too narrow).
- Coverage above target → **too cautious** (intervals too wide).
- A **reliability diagram** plots nominal vs observed coverage for many quantile levels. A perfectly calibrated model lies on the diagonal.

![Eight of ten illustrative observed values lie inside their issued prediction intervals. Two observations lie outside, producing empirical coverage of eighty percent.](/materials/Assets/Connectionist%20AI/Static/pf-coverage.svg)

![The diagonal represents agreement between nominal and observed interval coverage. An illustrative overconfident model has observed coverage below the diagonal.](/materials/Assets/Connectionist%20AI/Static/pf-reliability.svg)

### 7.2 Sharpness
Among calibrated forecasts, **narrower intervals are better** because they are more informative. For a nonnegative target, an interval from zero to infinity has 100% coverage. It is not a calibrated 80% or 90% interval and is uninformative.

![Each panel shows ten illustrative prediction intervals and observed values. Both have eight hits and two misses. The narrower intervals therefore achieve the same empirical coverage with greater sharpness in this toy comparison.](/materials/Assets/Connectionist%20AI/Static/pf-sharpness.svg)

### 7.3 Metrics
| Metric | What it measures |
|---|---|
| **Pinball / quantile loss** | Accuracy of each quantile |
| **Weighted quantile loss (wQL)** | Pinball loss normalised by total demand, comparable across series |
| **CRPS** (Continuous Ranked Probability Score) | Overall quality of the whole distribution; reduces to MAE for a point forecast. Twice the average pinball loss over many quantiles approximates it |
| **Interval coverage** | Share of actuals inside an interval |
| **Interval width** | Average sharpness |
| **NLL / log score** | How probable the real value was under the forecast |
| **Winkler / interval score** | Width plus penalty when outside the interval |

## 8. Conformal Prediction (Distribution-Free Calibration)

A simple recipe to get intervals with **guaranteed average coverage** (at least 90% here) around any point forecaster:

1. Train a point model.
2. On a **held-out calibration set**, compute the absolute errors |y − ŷ|.
3. Sort the n errors and take the ⌈(n + 1) × 0.9⌉-th smallest (round up), call it `e90`. With n = 99 errors, that is the 90th smallest. (The rule needs at least 9 errors; use far more in practice.)
4. For new forecasts, use the interval **[ŷ − e90, ŷ + e90]**.

The guarantee holds on average over many forecasts, and only if future errors behave like the calibration errors (technically, they must be *exchangeable*). Recalibrate if the data drifts (Chapter 7).

![Nineteen illustrative sorted absolute errors are one through nineteen. For ninety percent nominal coverage, the rank ceiling of twenty times 0.9 is eighteen, so the radius is eighteen around a new point forecast.](/materials/Assets/Connectionist%20AI/Static/pf-conformal.svg)

## 9. From Probabilistic Forecast to Decision (The Newsvendor Idea)

Suppose:
- **Cost of a shortage** (underage) per unit: `Cu`
- **Cost of leftover** (overage) per unit: `Co`

The cost-minimising stock level is the quantile

```
τ* = Cu / (Cu + Co)
```

**Example.** Each unit short loses 9 in profit; each leftover unit costs 1.
τ* = 9 / (9 + 1) = **0.9**, so stock at the **P90** forecast, not the mean.

Other uses:
- **Safety stock:** set it from the gap between P90 (or P95) and P50.
- **Capacity planning:** plan for the P95 peak load.
- **Risk reporting:** communicate ranges, not false precision.

![The chapter assigns cost nine per unit short and cost one per unit left over. The optimal quantile for these costs is 0.9.](/materials/Assets/Connectionist%20AI/Static/pf-newsvendor.svg)

## 10. Common Pitfalls
- Assuming a Gaussian when data is skewed or count-based
- Reporting only average accuracy and never checking coverage
- Very wide intervals that are "safe" but useless
- Evaluating intervals on training data (usually overconfident)
- Quantile crossing
- Ignoring that calibration can drift when data changes

## Key Takeaways
- Probabilistic forecasts give a **range and probabilities**, enabling risk-aware decisions.
- Neural networks can output distribution parameters (NLL), quantiles (pinball loss), or samples.
- Good forecasts are **calibrated** (honest) and **sharp** (informative).
- The best stocking quantile is `Cu / (Cu + Co)`, not the mean.

---

## Practice Questions

1. What extra information does a probabilistic forecast give?
2. P10 = 70, P90 = 135: which interval is this?
3. Pinball loss for τ = 0.8, y = 50, q = 40?
4. Your 90% intervals contain the truth only 60% of the time. What does that mean?
5. Aleatoric vs epistemic uncertainty?
6. Shortage costs 4 per unit; overage costs 1. Which quantile to stock?
7. Which distribution suits count data with extra variability?
8. Name two ways to estimate uncertainty with neural networks.
9. Why is a very wide interval a poor forecast even if calibrated?
10. 90% interval for a Gaussian with μ = 200, σ = 20 (use 1.645)?

---

## Answer Key

1. A range of likely outcomes and their probabilities (uncertainty).
2. An 80% prediction interval.
3. 0.8 × (50 − 40) = **8**.
4. The model is overconfident (intervals too narrow).
5. Aleatoric: inherent randomness. Epistemic: model's lack of knowledge, reducible with data.
6. 4/(4+1) = 0.8, the **P80**.
7. Negative Binomial.
8. E.g. distribution parameters with NLL, quantile regression, MC dropout, ensembles, conformal prediction.
9. It is not sharp, so it gives little useful information.
10. 200 ± 1.645×20 → about **[167.1, 232.9]**.
