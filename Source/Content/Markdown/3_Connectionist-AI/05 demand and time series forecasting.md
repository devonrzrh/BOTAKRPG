# Chapter 5: Demand Forecasting and Time-Series Forecasting

**Level:** Beginner | **Reading time:** ~50 minutes

## Learning Objectives
## Contents

- [Learning Objectives](#learning-objectives)
- [1. What Is Time-Series Forecasting?](#1-what-is-time-series-forecasting)
- [2. Anatomy of a Time Series](#2-anatomy-of-a-time-series)
- [3. Key Statistical Ideas](#3-key-statistical-ideas)
- [4. Framing Forecasting as Supervised Learning](#4-framing-forecasting-as-supervised-learning)
- [5. Forecast Horizon and Multi-Step Strategies](#5-forecast-horizon-and-multi-step-strategies)
- [6. Models](#6-models)
- [7. An LSTM Forecaster in PyTorch](#7-an-lstm-forecaster-in-pytorch)
- [8. Preparing and Splitting Data Correctly](#8-preparing-and-splitting-data-correctly)
- [9. Evaluation Metrics](#9-evaluation-metrics)
- [10. Special Situations](#10-special-situations)
- [11. From Forecast to Decision](#11-from-forecast-to-decision)
- [12. Common Pitfalls](#12-common-pitfalls)
- [Key Takeaways](#key-takeaways)
- [Practice Questions](#practice-questions)
- [Answer Key](#answer-key)

- What a time series is, and what demand forecasting is for
- Trend, seasonality, stationarity, autocorrelation
- How to turn forecasting into a supervised learning problem
- Models from naive baselines to LSTMs and Transformers
- How to split data and validate correctly
- Metrics (MAE, RMSE, MAPE, WAPE, MASE, bias) and how to choose
- Special cases: intermittent demand, many products, hierarchies

---

## 1. What Is Time-Series Forecasting?

A **time series** is a sequence of observations ordered in time, usually at regular intervals (hourly, daily, weekly). **Forecasting** predicts future values from past values and known future information.

**Demand forecasting** predicts how much of a product or service customers will want. It drives decisions on:
- **Inventory:** how much to stock or order
- **Staffing:** how many people to schedule
- **Production and logistics:** what to make and ship
- **Pricing and promotion planning**

The cost of errors is usually **asymmetric**:
- Forecast too high → excess stock, waste, tied-up cash
- Forecast too low → lost sales, unhappy customers

(Chapter 6 shows how probabilistic forecasts handle this asymmetry.)

![Past observations end at a forecast cutoff, followed by future predictions and an uncertainty band.](../../../Assets/Connectionist%20AI/Static/forecast-window.svg)

## 2. Anatomy of a Time Series

| Component | Meaning | Example |
|---|---|---|
| **Level** | The baseline average | ~200 units per day |
| **Trend** | Long-term rise or fall | Sales growing 10% a year |
| **Seasonality** | Repeating pattern at a fixed period | Weekend peaks; summer peaks; December spike |
| **Cycles** | Irregular longer waves | Business or economic cycles |
| **Calendar effects** | Holidays, paydays, events | Black Friday |
| **Noise** | Random variation | Unexplained daily jitter |

A series can combine them:
- **Additive:** `value = trend + seasonality + noise` (seasonal swings have constant size)
- **Multiplicative:** `value = trend × seasonality × noise` (swings grow with the level)

Multiplicative patterns can be made additive by taking the **logarithm**.

**Multiple seasonalities:** hourly electricity demand has daily, weekly and yearly cycles at once.

**External drivers (covariates / exogenous variables):** price, promotions, weather, holidays, competitor actions, marketing spend, stock availability.

![Toy signals isolate level, increasing trend, and a fixed-period seasonal cycle. The final signal combines trend and seasonality.](../../../Assets/Connectionist%20AI/Static/ts-components.svg)

## 3. Key Statistical Ideas

### 3.1 Stationarity
A series is **stationary** if its statistical properties (mean, variance, autocorrelation) don't change over time. Classic models like ARIMA rely on it: the "I" (integrated) step differences the series until it is stationary. Make a series more stationary by:
- **Differencing:** `y_t − y_(t−1)` (removes trend), or `y_t − y_(t−7)` (removes weekly seasonality)
- **Log transform:** stabilises growing variance

Neural networks don't strictly require stationarity but still **train better on scaled, detrended or normalised inputs**.

![The increasing series 10,12,14,16,18 becomes four constant increments of two when adjacent values are subtracted.](../../../Assets/Connectionist%20AI/Static/ts-differencing.svg)

### 3.2 Autocorrelation
How strongly a series correlates with its own **lagged** values. A strong correlation at lag 7 in daily data signals weekly seasonality. Plotting the **autocorrelation function (ACF)** helps you choose which lags to feed a model.

![This autocorrelation is calculated from six periods of a seven-day sinusoidal series. Peaks at lags seven and fourteen reflect weekly repetition. Finite-sample autocorrelation peaks decrease with lag.](../../../Assets/Connectionist%20AI/Static/ts-seasonal-acf.svg)

## 4. Framing Forecasting as Supervised Learning

Neural networks need input/output pairs. Create them with a **sliding window**:

```
Series: 10, 12, 13, 15, 14, 16, 18      window = 3, horizon = 1

Input         → Target
[10, 12, 13]  → 15
[12, 13, 15]  → 14
[13, 15, 14]  → 16
[15, 14, 16]  → 18
```

```python
import numpy as np

def make_windows(series, window, horizon=1):
    X, y = [], []
    for i in range(len(series) - window - horizon + 1):
        X.append(series[i : i + window])
        y.append(series[i + window : i + window + horizon])
    return np.array(X), np.array(y)

X, y = make_windows(np.array([10, 12, 13, 15, 14, 16, 18]), window=3)
```

![The three-step input window moves over the exact sequence from the chapter. Each next value, in green, is the one-step target.](../../../Assets/Connectionist%20AI/Animated/ts-sliding-window.svg)

### 4.1 Useful Features
- **Lag features:** value 1 day ago, 7 days ago, 365 days ago
- **Rolling statistics:** 7-day mean, 28-day standard deviation
- **Calendar features:** day of week, month, week of year, holiday flag (often encoded cyclically with sine and cosine)
- **Known future inputs:** planned promotions, prices, holidays
- **Static features:** product category, store location, size

### 4.2 Cyclical Encoding (for features like hour or month)
```python
hour_sin = np.sin(2*np.pi*hour/24)
hour_cos = np.cos(2*np.pi*hour/24)
```
This tells the network that hour 23 and hour 0 are close.

![The twenty-four hours are placed on a circle. Hours twenty-three and zero are neighbors on the circle, illustrating sine and cosine encoding.](../../../Assets/Connectionist%20AI/Static/ts-cyclic-clock.svg)

## 5. Forecast Horizon and Multi-Step Strategies

- **One-step:** predict the next value.
- **Multi-step:** predict several steps ahead (e.g. the next 14 days).

| Strategy | How | Pros / Cons |
|---|---|---|
| **Recursive** | Predict one step, feed it back as input | Simple, but errors accumulate |
| **Direct** | Separate model (or output) per step | No error feedback, but more models |
| **Multi-output (seq2vec)** | One network outputs the whole horizon | Efficient, shares structure |
| **Seq2seq / encoder-decoder** | Encode history, decode future step by step | Flexible, handles future covariates |

![Recursive forecasting feeds a predicted value back into the model to predict the next value. Multi-output forecasting emits the whole horizon from one input window.](../../../Assets/Connectionist%20AI/Animated/ts-multistep.svg)

## 6. Models

| Model | Idea | Notes |
|---|---|---|
| **Naive** | Forecast = last value | Baseline #1 |
| **Seasonal naive** | Forecast = value from the same point last season | Baseline #2. Surprisingly hard to beat |
| **Moving average** | Mean of recent values | Smooths noise |
| **Exponential smoothing (ETS, Holt-Winters)** | Weighted averages with level, trend, seasonality | Strong for single series |
| **ARIMA / SARIMA** | Auto-regression plus differencing plus moving average | Classic; differencing makes the series stationary |
| **Prophet-style additive models** | Trend + seasonality + holidays | Easy, interpretable |
| **Gradient boosting (LightGBM)** on lag features | Tree model on engineered features | A very strong baseline in competitions |
| **MLP** | Dense network on windowed inputs and covariates | Simple neural baseline |
| **RNN / LSTM / GRU** | Reads the sequence step by step | Learns temporal dependencies |
| **1D CNN / TCN** | Convolutions across time | Fast, parallel, long receptive field |
| **N-BEATS / N-HiTS** | Stacks of MLP blocks with trend and seasonality structure | Strong pure neural forecasters |
| **Temporal Fusion Transformer (TFT)** | Attention plus covariate handling plus interpretability | Multi-horizon, many series |
| **DeepAR** | Autoregressive LSTM across many series, probabilistic | Chapter 6 |

> **Honest advice:** for a single short series, simple statistical methods are often as good or better than neural networks. Neural networks win when you have **many related series** (thousands of products or stores) and rich covariates. One **global model** trained across all series can share patterns, handle new products and use the covariates.

### 6.1 Global vs Local Models
- **Local:** one model per series. Flexible but data-hungry per series, and impractical for thousands of series.
- **Global:** one model for all series, with series identity as an input (often an embedding). Shares strength across series.

![Local forecasting gives each series its own model. A global model learns from several related series and receives series identity as an input.](../../../Assets/Connectionist%20AI/Static/ts-global-local.svg)

## 7. An LSTM Forecaster in PyTorch

```python
import torch
import torch.nn as nn

class LSTMForecaster(nn.Module):
    def __init__(self, n_features=1, hidden=64, horizon=7):
        super().__init__()
        self.lstm = nn.LSTM(n_features, hidden, num_layers=2,
                            batch_first=True, dropout=0.1)
        self.head = nn.Linear(hidden, horizon)

    def forward(self, x):                  # x: (batch, window, features)
        out, _ = self.lstm(x)
        return self.head(out[:, -1, :])    # use the last time step

model = LSTMForecaster()
loss_fn = nn.L1Loss()                      # MAE
opt = torch.optim.Adam(model.parameters(), lr=1e-3)
```

![Each recurrent step combines the current input with the previous hidden state.](../../../Assets/Connectionist%20AI/Animated/rnn-state.svg)

**Scaling.** Compute the mean and standard deviation on the **training period only**, then apply them to validation and test data:
```python
mu, sd = train.mean(), train.std()
train_s, val_s = (train - mu)/sd, (val - mu)/sd
# remember to invert the scaling on predictions: pred * sd + mu
```

## 8. Preparing and Splitting Data Correctly

1. **Never shuffle across time.** Split chronologically:
   ```
   |-------- train --------|--- validation ---|--- test ---|
   past                                                 latest
   ```
2. **Fit scalers and encoders on training data only.**
3. **Avoid leakage:** don't use information unavailable at forecast time (e.g. next week's actual weather instead of the weather *forecast*; or a 7-day rolling mean that includes the target day).
4. **Handle missing data:** distinguish true zero sales from **stock-outs** (zero sales because there was nothing to sell). Stock-outs hide true demand.
5. **Handle outliers and special events:** flag them (promotions, outages) rather than silently deleting.
6. **Cold-start products:** use category, price and similar items.

![Earlier observations are used for training, followed by a validation period and a final test period. Fitting preprocessing uses the training portion only.](../../../Assets/Connectionist%20AI/Static/ts-time-split.svg)

![On an illustrative stock-out day, observed sales stop at eight available units. Additional desired purchases are unobserved, so sales alone cannot reveal total demand.](../../../Assets/Connectionist%20AI/Static/ts-stockout.svg)

### 8.1 Rolling-Origin (Walk-Forward) Validation
A single split can be misleading. Instead, repeatedly train on a growing past and test on the next block:

```
Fold 1: train [1..100]   test [101..114]
Fold 2: train [1..114]   test [115..128]
Fold 3: train [1..128]   test [129..142]
```
Average the errors. This mimics real deployment. In scikit-learn: `TimeSeriesSplit`.

![Three folds have expanding training histories and immediately following held-out blocks. Test blocks never precede their training history.](../../../Assets/Connectionist%20AI/Static/ts-rolling-origin.svg)

## 9. Evaluation Metrics

Example: actual = `[100, 120, 90]`, forecast = `[110, 115, 100]`, errors (forecast − actual) = `[10, −5, 10]`, absolute errors = `[10, 5, 10]`.

| Metric | Formula | Result | Notes |
|---|---|---|---|
| **MAE** | mean(\|e\|) | (10+5+10)/3 = **8.33** | Same units as data; robust |
| **MSE** | mean(e²) | (100+25+100)/3 = **75** | Penalises big errors |
| **RMSE** | √MSE | **8.66** | Same units; sensitive to outliers |
| **MAPE** | mean(\|e\|/\|actual\|)×100 | (10% + 4.17% + 11.11%)/3 ≈ **8.43%** | Breaks at actual = 0; favours under-forecasting |
| **WAPE** | Σ\|e\| / Σ\|actual\| | 25/310 = **8.06%** | Good for demand; handles zeros and mixed scales |
| **MASE** | MAE / MAE of the naive forecast (in-sample) | < 1 means beats naive | Scale-free; compare across series |
| **Bias** | mean(forecast − actual) | (10 − 5 + 10)/3 = **+5** | Positive = over-forecasting |

**Choosing:**
- Business-friendly percentage: **WAPE**
- Comparing across series with different scales: **MASE**
- Large errors are especially costly: **RMSE**
- Always report **bias** too. A forecast with low error but persistent bias still causes systematic over- or under-stocking.
- Always compare against the **seasonal naive baseline**.

![For actual values 100,120,90 and forecasts 110,115,100, the vertical gaps are plus ten, minus five, and plus ten units.](../../../Assets/Connectionist%20AI/Static/ts-residuals.svg)

## 10. Special Situations

### 10.1 Intermittent (Lumpy) Demand
Spare parts or slow sellers have many zero-sales days. Standard models and MAPE fail. Use **Croston's method** (models demand size and interval separately), count distributions (Poisson, negative binomial), or probabilistic neural models (Chapter 6).

![Twelve illustrative days contain nine zero-demand days and three nonzero days. Separate gaps and nonzero sizes help explain intermittent demand.](../../../Assets/Connectionist%20AI/Static/ts-intermittent.svg)

### 10.2 Hierarchies
Sales roll up: SKU → category → store → region → total. Forecasts at different levels should **add up consistently**. Use **hierarchical reconciliation** (e.g. top-down, bottom-up, MinT).

![SKU forecasts of ten and twenty sum to category thirty. A second category of forty makes a total of seventy.](../../../Assets/Connectionist%20AI/Static/ts-hierarchy.svg)

### 10.3 New Products (Cold Start)
No history. Use attributes (category, price, brand) and "similar product" histories, or global models with embeddings.

### 10.4 Promotions and Price Effects
Include price, discount depth and promo flags as covariates, and consider **cannibalisation** (a promotion on one item reduces others).

### 10.5 Forecast Value Added (FVA)
Measure whether each step (statistical model, neural network, human adjustment) actually improves on the previous one. Many manual overrides make forecasts worse.

## 11. From Forecast to Decision

A forecast only matters through the decision it drives. Example, a simple **safety stock** idea:
```
order quantity = forecast demand over lead time + safety stock
```
The safety stock depends on the forecast's **uncertainty** and the target service level, which motivates probabilistic forecasting (Chapter 6).

![A simplified order quantity consists of forecast demand over lead time plus safety stock. The illustration assigns forecast demand one hundred and safety stock twenty.](../../../Assets/Connectionist%20AI/Static/ts-inventory-decision.svg)

## 12. Common Pitfalls
- Random train/test split (the model "sees the future")
- Scaling using the entire dataset (leakage)
- No baseline comparison
- Ignoring holidays, promotions, stock-outs
- Optimising MAPE and ending up with systematically low forecasts
- Forgetting that patterns change (concept drift, Chapter 7)
- Using a deep model when a seasonal naive nearly matches it

## Key Takeaways
- Break a series into level, trend, seasonality, calendar effects and noise.
- Turn forecasting into supervised learning with windows, lags and covariates.
- Split by time, use walk-forward validation, avoid leakage.
- Always beat a seasonal naive baseline, and report bias along with error.
- Neural networks shine with many related series and rich covariates.

---

## Practice Questions

1. Name the trend, seasonality and noise in: "Sales rise slowly each year, jump every December, and vary randomly day to day."
2. Window size 2 on `[5, 7, 6, 8, 9]`: list the input → target pairs.
3. Why not shuffle a time series before splitting?
4. MAE for actual `[50, 60]`, forecast `[55, 54]`?
5. What is a seasonal naive forecast?
6. Why encode hour of day with sine and cosine?
7. WAPE if total absolute error is 30 and total actual demand is 400?
8. What is a stock-out, and why does it distort demand data?
9. When might ARIMA beat an LSTM?
10. Recursive vs direct multi-step forecasting?

---

## Answer Key

1. Trend: slow yearly rise. Seasonality: December jump. Noise: daily randomness.
2. `[5,7]→6`, `[7,6]→8`, `[6,8]→9`.
3. It leaks future data into training and inflates results.
4. (5 + 6)/2 = **5.5**.
5. Use the value from the same point in the previous season (e.g. same weekday last week).
6. So hour 23 and hour 0 are recognised as close neighbours.
7. 30/400 = **7.5%**.
8. Zero sales because nothing was available, so recorded sales understate true demand.
9. A single short series with little data.
10. Recursive feeds predictions back as inputs (errors accumulate); direct uses a separate model/output per step.
