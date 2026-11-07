# Chapter 3: Applications of Neural Networks (Brief)
## Contents

- [1. Why So Many Applications?](#1-why-so-many-applications)
- [2. Major Application Areas](#2-major-application-areas)
- [3. Quick Reference](#3-quick-reference)
- [4. A Typical Project Pipeline](#4-a-typical-project-pipeline)
- [5. When Is a Neural Network a Good Fit?](#5-when-is-a-neural-network-a-good-fit)
- [6. Mini Case Study: Defect Detection on a Production Line](#6-mini-case-study-defect-detection-on-a-production-line)
- [7. Responsible Use](#7-responsible-use)
- [Key Takeaways](#key-takeaways)
- [Practice Questions](#practice-questions)
- [Answer Key](#answer-key)

## Key Takeaways
- The same core idea adapts to many tasks by choosing the right architecture.
- Match the **metric** to the real-world cost of errors.
- Start with a baseline; deploy with monitoring.
- Neural networks are powerful but not always the best tool.

---

## Practice Questions

1. Match task to model: (a) defect photos, (b) translation, (c) unusual machine behaviour, no fault labels.
2. Name two situations where a neural network is a poor choice.
3. Why track recall, not just accuracy, in fraud detection?
4. Why monitor a model after deployment?
5. What baseline would you try first on a plain spreadsheet dataset?
6. Name one risk of using biased training data.

---

## Answer Key

1. (a) CNN, (b) Transformer, (c) Autoencoder.
2. E.g. tiny datasets; a simple rule already works; full explainability required.
3. Fraud is rare, so a model can be highly "accurate" while missing most fraud.
4. Real-world data changes, so performance can silently degrade.
5. Gradient boosting or a linear model.
6. The model learns and repeats unfair patterns, harming some groups.


## 1. Why So Many Applications?

Neural networks are **universal function approximators**: with suitable activations and enough units, they can approximate any continuous function on a closed, bounded input domain to any desired accuracy. This does not guarantee that training will find the right weights or that the model will generalise well. Different architectures (Chapter 2) specialise the idea for images, sequences, graphs and more. This is why the same toolbox spans medicine, finance, entertainment and engineering.

Most applications fall into a few **task types**:

| Task type | Output | Example |
|---|---|---|
| **Classification** | A category | Spam or not spam |
| **Regression** | A number | Predicted house price |
| **Detection / segmentation** | Where things are | Locating pedestrians in an image |
| **Sequence prediction** | Next items or a translation | Forecasting, speech-to-text |
| **Generation** | New content | Text, images, music |
| **Decision-making (RL)** | Actions | Robot control, game play |
| **Ranking / retrieval** | Ordered list | Search results, recommendations |
| **Anomaly detection** | Normal vs unusual | Machine failure alerts |

## 2. Major Application Areas

### 2.1 Computer Vision
- **Tasks:** image classification, object detection, segmentation, face recognition, OCR.
- **Models:** CNNs, Vision Transformers.
- **Examples:** phone face unlock, factory defect inspection, crop disease detection, self-driving perception.
- **Metrics:** accuracy, precision/recall, mean average precision (mAP).
- **Watch out for:** lighting and camera changes between training and real use.

![Classification labels a whole image, detection draws boxes around objects, and segmentation labels their pixels.](../../../Assets/Connectionist%20AI/Static/vision-outputs.svg)

### 2.2 Natural Language Processing (NLP)
- **Tasks:** translation, summarisation, question answering, sentiment analysis, chatbots, search.
- **Models:** Transformers (including large language models).
- **Metrics:** accuracy/F1 for classification, BLEU or human ratings for generation.
- **Watch out for:** factual mistakes, bias in text data, privacy of user text.

![A text model maps the tokens in a sentence to one sentiment label.](../../../Assets/Connectionist%20AI/Static/text-token-label.svg)

### 2.3 Speech and Audio
- **Tasks:** speech recognition, voice assistants, speaker identification, music tagging.
- **Models:** CNNs on spectrograms, RNNs, Transformers.
- **Metric:** word error rate (WER).

![Speech recognition turns a waveform into audio features and decodes a sequence of text tokens.](../../../Assets/Connectionist%20AI/Static/speech-to-text.svg)

### 2.4 Forecasting and Time Series
- **Tasks:** demand, energy load, traffic, weather, finance.
- **Models:** MLPs, LSTMs, temporal convolution, Transformers.
- **Metrics:** MAE, RMSE, quantile loss.

![Observed values end at a cutoff. Future predictions begin at that cutoff with a widening uncertainty band.](../../../Assets/Connectionist%20AI/Static/forecast-window.svg)

### 2.5 Recommendation
- **Tasks:** suggest products, videos, music, news.
- **Models:** embeddings plus MLPs, two-tower models, sequence models.

![Sorting three candidates by score puts item B first, then C, then A.](../../../Assets/Connectionist%20AI/Static/ranking-scores.svg)

### 2.6 Healthcare and Life Sciences
- **Tasks:** detecting disease in X-rays, CT and pathology images; predicting patient risk; protein structure prediction; drug discovery.
- **Models:** CNNs, Transformers, graph networks.
- **Watch out for:** small labelled datasets, strict regulation, need for explanation and human oversight.

![A model flags an image region for a clinician to review alongside other evidence.](../../../Assets/Connectionist%20AI/Static/clinical-review.svg)

### 2.7 Finance
- **Tasks:** fraud detection, credit scoring, risk modelling, algorithmic trading signals.
- **Models:** MLPs, autoencoders, sequence models.
- **Watch out for:** rare events (fraud is a tiny fraction of transactions), changing behaviour (concept drift), fairness and regulation.

![Example transaction risk scores above a review threshold are routed for further review.](../../../Assets/Connectionist%20AI/Static/fraud-threshold.svg)

### 2.8 Robotics, Control and Games
- **Tasks:** walking robots, warehouse picking, game agents, chip design, data-centre cooling.
- **Models:** deep reinforcement learning combined with vision networks.

![A game agent sends an action to the environment, which returns the next observation and a reward.](../../../Assets/Connectionist%20AI/Animated/rl-feedback.svg)

### 2.9 Generative AI
- **Tasks:** text, image, audio, video and code generation.
- **Models:** Transformers, diffusion models, GANs, VAEs.

![The model predicts a token, appends it to the prefix, and uses the extended prefix for the next prediction.](../../../Assets/Connectionist%20AI/Animated/next-token-generation.svg)

### 2.10 Anomaly Detection and Monitoring
- **Tasks:** machine failure prediction, network intrusion, medical monitoring.
- **Models:** autoencoders trained on normal data; anything reconstructed poorly is flagged.

![On a reconstruction-error scale, examples to the right of a chosen threshold are flagged for review.](../../../Assets/Connectionist%20AI/Static/anomaly-threshold.svg)

## 3. Quick Reference

| Area | Typical input | Typical model | Key metric |
|---|---|---|---|
| Vision | Images | CNN / ViT | Accuracy, mAP |
| Language | Text | Transformer | F1, BLEU |
| Speech | Audio | CNN / Transformer | WER |
| Forecasting | Time series | LSTM / Transformer | MAE, quantile loss |
| Recommendation | Interactions | Embeddings + MLP | Precision@K, NDCG |
| Fraud | Transactions | MLP / autoencoder | Recall, precision |
| Control | State | Deep RL | Cumulative reward |

## 4. A Typical Project Pipeline

1. **Define the problem and success metric** (including the business cost of errors).
2. **Collect and label data.** Often the hardest and most expensive step.
3. **Clean and split data** into train, validation and test sets.
4. **Build a simple baseline** (a rule, a linear model). Know what you need to beat.
5. **Train and tune** a neural network.
6. **Evaluate honestly** on unseen data, including edge cases.
7. **Deploy** (as an API, on a phone, on a device).
8. **Monitor and update**: performance degrades as the world changes.

![Use training data to fit weights, validation data to choose settings, and held-out test data to evaluate the selected model.](../../../Assets/Connectionist%20AI/Static/dataset-split.svg)

## 5. When Is a Neural Network a Good Fit?

**Good fit**
- Large amounts of data
- Unstructured inputs (images, audio, text) or complex non-linear patterns
- Accuracy matters more than a simple explanation
- You can use a **pre-trained model** and fine-tune it

**Poor fit**
- Very small datasets (gradient boosting or linear models often win)
- A simple known rule or formula already solves the problem
- Strict requirement to explain every decision
- Very limited compute or latency budget (though small networks can still work)

> **Rule of thumb:** for plain tabular data, try gradient boosting (e.g. XGBoost, LightGBM) as a baseline. It frequently matches or beats neural networks.

![A simple rule gets 82 correct and a neural model gets 85 correct on the same illustrative test set of 100 examples.](../../../Assets/Connectionist%20AI/Static/baseline-compare.svg)

## 6. Mini Case Study: Defect Detection on a Production Line

- **Problem:** catch faulty bottles automatically.
- **Data:** 20,000 photos, labelled "ok" or "defect" (only 2% defective).
- **Model:** a pre-trained CNN fine-tuned on the photos.
- **Challenge:** class imbalance. Accuracy of 98% is achievable by always saying "ok", so track **recall on defects** and **precision**, and use class weights or oversampling.
- **Deployment:** camera feeds images to the model; uncertain cases go to a human inspector.
- **Monitoring:** if lighting or bottle design changes, retrain.

![A camera photographs each bottle, a CNN scores the image, and uncertain cases go to a human inspector.](../../../Assets/Connectionist%20AI/Animated/defect-detection.svg)

![Out of 100 representative bottles, always predicting OK gets 98 correct but catches neither of the two defects.](../../../Assets/Connectionist%20AI/Static/accuracy-trap.svg)

![Bright and dim photos of the same bottle show how deployment images can differ from training images.](../../../Assets/Connectionist%20AI/Static/lighting-shift.svg)

## 7. Responsible Use
- **Bias:** models copy biases in training data. Check performance across groups.
- **Privacy:** minimise and protect personal data.
- **Reliability and safety:** test realistic and rare cases; keep a **human in the loop** for high-stakes decisions.
- **Transparency:** document what the model is for, its data, and its limits.

![The same model scores 90 percent overall, 98 percent on one group, and 82 percent on an equally sized group.](../../../Assets/Connectionist%20AI/Static/subgroup-evaluation.svg)
