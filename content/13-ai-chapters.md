# Connectionist AI: chapter quests

```entity
type: quest
kind: chapter
id: chapter-source-ai-01
title: Introduction to Connectionist AI
branch: signal-identification
lesson: source-ai-01
objectives: [encounter-source-ai-01]
prerequisites: []
xp: 0
rewards: []
description: See how changing learned connection strengths changes a classification.
learning:
  goal: Explain the difference between applying learned weights and changing them from feedback.
  concept: Connectionist systems combine many simple units through weighted connections. Applying the current weights produces a prediction; learning changes those weights using examples and a learning signal. A trained network can still make mistakes on new inputs, so its predictions need evaluation.
  example: |
    A toy classifier computes `score = w × x` and predicts class 1 when the score is at least `0.5`.

    For `x = 1`, weight `0.2` gives score `0.2`, so the prediction is class 0. After feedback changes the weight to `0.8`, the same input gives score `0.8` and class 1.

    The prediction changed because the connection strength changed. This score is not automatically a calibrated probability.
  practice:
    prompt: Using that same rule and x = 1, feedback changes w from 0.4 to 0.7. What class does the updated model predict?
    options: [Class 0 because the old weight was below the threshold, Class 1 because the new score is 0.7, Both classes with certainty, The threshold becomes 0.7 automatically]
    answer: 1
    explanation: The updated score is 0.7 × 1 = 0.7. It meets the fixed threshold of 0.5, so the model predicts class 1. Updating a weight does not itself change the classification threshold.
```

```entity
type: quest
kind: chapter
id: chapter-source-ai-02
title: Neural Network Concepts and Architectures
branch: signal-identification
lesson: source-ai-02
objectives: [encounter-source-ai-02]
prerequisites: [chapter-source-ai-01]
xp: 0
rewards: []
description: Calculate a neuron's weighted sum before choosing its activation.
learning:
  goal: Compute a forward pass using inputs, weights, bias and activation in the correct order.
  concept: A neuron multiplies each input by its corresponding weight, adds those contributions and a bias, then applies an activation. The contribution's sign depends on both the weight and the input. Layers connect several such units; the architecture describes those connections, while training determines parameter values.
  example: |
    Let `x = [2, 1]`, `w = [0.5, -0.4]` and bias `0.1`.

    `z = 2 × 0.5 + 1 × (-0.4) + 0.1 = 1 - 0.4 + 0.1 = 0.7`.

    Applying ReLU gives `max(0, 0.7) = 0.7`. Bias is added once; it is not multiplied by either input.
  practice:
    prompt: Inputs are [2, -1], weights are [0.3, 0.4], and bias is 0.2. What is the neuron's preactivation z?
    options: ['1.2', '0.8', '0.4', '0']
    answer: 2
    explanation: z = 2 × 0.3 + (-1) × 0.4 + 0.2 = 0.6 - 0.4 + 0.2 = 0.4. The positive second weight contributes negatively because its input is negative.
```

```entity
type: quest
kind: chapter
id: chapter-source-ai-03
title: Applications of Neural Networks
branch: signal-identification
lesson: source-ai-03
objectives: [encounter-source-ai-03]
prerequisites: [chapter-source-ai-02]
xp: 0
rewards: []
description: Evaluate a signal detector using the errors that matter for its task.
learning:
  goal: Interpret precision and recall when the interesting class is rare.
  concept: Neural networks can classify images, recognize speech and detect patterns, but their usefulness depends on the data and the errors being measured. Accuracy can hide total failure on a rare class. Recall measures how many actual positives were found; precision measures how many positive predictions were correct.
  example: |
    Among 1,000 signal packets, only 10 are rogue packets. A detector that always predicts ordinary gets 990 correct: accuracy is `990 / 1000 = 99%`.

    It catches `0 / 10 = 0%` of the rogue packets. High accuracy therefore does not make it useful for finding the rare signal.
  practice:
    prompt: There are 20 actual rogue packets. A detector finds 15 of them and flags 25 packets in total. What are its rogue-packet recall and precision?
    options: ['Recall 60%, precision 75%', 'Recall 75%, precision 60%', 'Recall 100%, precision 75%', 'Recall 75%, precision 100%']
    answer: 1
    explanation: Recall is 15 detected rogues divided by 20 actual rogues, or 75%. Precision is 15 actual rogues divided by 25 flagged packets, or 60%. The denominators answer different questions.
```

```entity
type: quest
kind: chapter
id: chapter-source-ai-04
title: Deep Learning and Activation Functions
branch: signal-identification
lesson: source-ai-04
objectives: [encounter-source-ai-04]
prerequisites: [chapter-source-ai-03]
xp: 0
rewards: []
description: Trace how an activation changes a layer's output.
learning:
  goal: Apply ReLU and leaky ReLU to positive and negative preactivations.
  concept: Stacking affine layers without nonlinear activations still produces one affine transformation. Nonlinear activations let a network represent more complex relationships. ReLU maps negative inputs to zero, while leaky ReLU keeps a small negative slope so a negative input need not lose all gradient.
  example: |
    For preactivations `[-2, 0.5, 3]`, ReLU produces `[0, 0.5, 3]`.

    Leaky ReLU with negative slope `0.1` instead produces `[-0.2, 0.5, 3]`. Only the negative branch is scaled; positive values pass through unchanged.
  practice:
    prompt: A hidden unit has preactivation -3 and uses leaky ReLU with negative slope 0.1. What is its output?
    options: ['0', '0.3', '-3', '-0.3']
    answer: 3
    explanation: On the negative branch, leaky ReLU returns slope × input. Here 0.1 × (-3) = -0.3. Ordinary ReLU would return zero, but this unit uses leaky ReLU.
```

```entity
type: quest
kind: chapter
id: chapter-source-ai-05
title: Demand and Time-Series Forecasting
branch: signal-identification
lesson: source-ai-05
objectives: [encounter-source-ai-05]
prerequisites: [chapter-source-ai-04]
xp: 0
rewards: []
description: Measure forecast error without allowing future observations into training.
learning:
  goal: Calculate mean absolute error and distinguish it from signed bias.
  concept: Time-series forecasting predicts later observations from information available at forecast time. Evaluation should train on earlier observations and test on later ones so future information cannot leak backward. Mean absolute error averages error magnitudes; signed bias measures whether forecasts tend to be too high or too low.
  example: |
    Actual packet counts are `[8, 12, 10]`; forecasts are `[10, 9, 11]`.

    Forecast-minus-actual errors are `[2, -3, 1]`. Their absolute values sum to `6`, so `MAE = 6 / 3 = 2` packets.

    Bias is `(2 - 3 + 1) / 3 = 0`. The forecasts have zero average bias even though individual forecasts are wrong.
  practice:
    prompt: Actual counts are [4, 8] and forecasts are [6, 7]. What is the mean absolute error?
    options: ['0.5 packets', '1 packet', '1.5 packets', '3 packets']
    answer: 2
    explanation: The errors are 2 and -1, whose magnitudes are 2 and 1. Their mean is (2 + 1) / 2 = 1.5 packets. Adding signed errors would measure bias instead.
```

```entity
type: quest
kind: chapter
id: chapter-source-ai-06
title: Probabilistic Forecasting
branch: signal-identification
lesson: source-ai-06
objectives: [encounter-source-ai-06]
prerequisites: [chapter-source-ai-05]
xp: 0
rewards: []
description: Use quantiles and asymmetric loss to express uncertainty.
learning:
  goal: Calculate pinball loss for an overprediction and explain the asymmetry.
  concept: A probabilistic forecast describes uncertainty rather than only one expected value. A quantile at level tau aims to place that share of outcomes at or below its prediction. Pinball loss charges tau times the shortfall for underprediction and one minus tau times the excess for overprediction, so high quantiles penalize underprediction more.
  example: |
    For quantile level `tau = 0.8` and actual demand `50`:

    - Predicting `45` is 5 too low: loss is `0.8 × 5 = 4`.
    - Predicting `55` is 5 too high: loss is `(1 - 0.8) × 5 = 1`.

    Equal-sized errors have different costs. The model targets the 80th percentile rather than the mean. For discrete or degenerate distributions, that percentile can equal the median.
  practice:
    prompt: For tau = 0.75, the prediction is 24 and the actual value is 20. What is the pinball loss?
    options: ['1', '3', '4', '16']
    answer: 0
    explanation: This is an overprediction of 4, so use (1 - tau) × excess = 0.25 × 4 = 1. Using tau × 4 would apply the underprediction branch incorrectly.
```

```entity
type: quest
kind: chapter
id: chapter-source-ai-07
title: Online and Incremental Learning
branch: signal-identification
lesson: source-ai-07
objectives: [encounter-source-ai-07]
prerequisites: [chapter-source-ai-06]
xp: 0
rewards: []
description: Update a running statistic without retaining the entire signal history.
learning:
  goal: Update a mean using its previous count and a newly observed value.
  concept: Incremental methods update existing state when new data arrives rather than starting from scratch. In supervised online evaluation, predict before training on that example's label; otherwise the evaluation can use information it is meant to predict. An all-history mean is memory efficient, but may adapt slowly if the underlying signal changes.
  example: |
    Two observed counts, `2` and `6`, have mean `4`. The next observed count is `10`.

    The updated mean is `4 + (10 - 4) / 3 = 6`. Checking the full history gives `(2 + 6 + 10) / 3 = 6` as well.

    Keep only the mean and count. Averaging the old mean and new observation equally would wrongly ignore the two observations behind the old mean.
  practice:
    prompt: Five observations have mean 8. A sixth observation is 14. What is the updated mean over all six observations?
    options: ['11', '14', '8', '9']
    answer: 3
    explanation: The old sum is 5 × 8 = 40. Adding 14 gives 54, and 54 / 6 = 9. Equivalently, update 8 + (14 - 8) / 6 = 9; the new observation is not half the dataset.
```

```entity
type: quest
kind: chapter
id: chapter-source-ai-08
title: Recommendation Systems
branch: signal-identification
lesson: source-ai-08
objectives: [encounter-source-ai-08]
prerequisites: [chapter-source-ai-07]
xp: 0
rewards: []
description: Score candidate matches from learned user and item representations.
learning:
  goal: Calculate an embedding dot product and use it to compare candidates.
  concept: A recommender can learn a small embedding for each user and item from interaction data. A dot product combines their latent factors into a matching score, which is useful for ranking candidates. This score is not automatically a probability, and a missing interaction is not proof that the user dislikes an item.
  example: |
    User vector `u = [2, 1]` is compared with item A `[1, 3]` and item B `[3, 0]`.

    `score(A) = 2 × 1 + 1 × 3 = 5`.

    `score(B) = 2 × 3 + 1 × 0 = 6`.

    Under this scoring rule, B ranks above A. The result does not mean a 600% probability of choosing B.
  practice:
    prompt: A model scores an item using user vector [2, -1] and item vector [3, 2]. What is their dot-product score?
    options: ['8', '6', '4', '-2']
    answer: 2
    explanation: Multiplying matching coordinates and adding gives 2 × 3 + (-1) × 2 = 6 - 2 = 4. Do not drop the negative contribution or multiply coordinates across different positions.
```

```entity
type: quest
kind: chapter
id: chapter-source-ai-09
title: Reinforcement Learning
branch: signal-identification
lesson: source-ai-09
objectives: [encounter-source-ai-09]
prerequisites: [chapter-source-ai-08]
xp: 0
rewards: []
description: Combine immediate reward and an estimated future value in a Q update.
learning:
  goal: Calculate a Q-learning target and move the old estimate partway toward it.
  concept: Reinforcement learning learns from the rewards that follow actions rather than receiving a correct action label for every state. Q-learning estimates an action's immediate reward plus discounted future value. Its learning rate controls how far one update moves toward that target, and exploration helps discover actions the current estimates underrate.
  example: |
    At a nonterminal transition, old Q is `1`, reward is `0`, discount is `0.8`, best next-state Q is `3` and learning rate is `0.5`.

    `target = 0 + 0.8 × 3 = 2.4`.

    `new Q = 1 + 0.5 × (2.4 - 1) = 1.7`.

    The update moves halfway toward 2.4; it does not replace Q with the target. At a terminal transition there is no future bootstrap term.
  practice:
    prompt: At a nonterminal transition, old Q = 2, learning rate = 0.25, reward = 1, discount = 0.5 and best next Q = 4. What is the updated Q?
    options: ['3', '2.25', '0.75', '2.75']
    answer: 1
    explanation: The target is 1 + 0.5 × 4 = 3. The change is 0.25 × (3 - 2) = 0.25, so new Q is 2.25. The learning rate scales the difference from the old estimate.
```

```entity
type: quest
kind: chapter
id: chapter-source-ai-10
title: Model Training and Optimisation
branch: signal-identification
lesson: source-ai-10
objectives: [encounter-source-ai-10]
prerequisites: [chapter-source-ai-09]
xp: 0
rewards: []
description: Update parameters and evaluate loss without giving small batches extra weight.
learning:
  goal: Apply gradient descent and aggregate validation losses by example count.
  concept: Gradient descent subtracts the learning rate times the gradient because the gradient points toward increasing loss. Training data fits weights, validation data guides settings and stopping, and the test set evaluates the chosen model. If validation batches have different sizes, weight each batch's mean loss by its number of examples before averaging.
  example: |
    A weight is `1.5`, its gradient is `-2`, and the learning rate is `0.1`.

    `new weight = 1.5 - 0.1 × (-2) = 1.7`.

    The weight increases because the gradient is negative. Separately, a validation score should include each example once; treating each batch as one equally weighted example changes the metric when the last batch is smaller.
  practice:
    prompt: One validation batch has 4 examples with mean per-example loss 2. A second has 1 example with mean loss 7. What is the mean loss over all 5 examples?
    options: ['4.5', '15', '3', '1.5']
    answer: 2
    explanation: The total loss is 4 × 2 + 1 × 7 = 15. Divide by 5 examples to obtain 3. Averaging the two batch means equally would give 4.5 and overweight the single-example batch.
```
