---
type: lesson
id: source-ai-09
title: Reinforcement Learning
topic: ai
summary: Chapter 9 · Reinforcement Learning
prerequisites:
  - source-ai-08
source: Source/Content/Markdown/3_Connectionist-AI/09 reinforcement learning.md
---

# Chapter 9: Reinforcement Learning

**Level:** Beginner to Intermediate | **Reading time:** ~55 minutes

## Learning Objectives
## Contents

- [Learning Objectives](#learning-objectives)
- [1. What Is Reinforcement Learning?](#1-what-is-reinforcement-learning)
- [2. Core Vocabulary](#2-core-vocabulary)
- [3. Markov Decision Process (MDP)](#3-markov-decision-process-mdp)
- [4. Value Functions and the Bellman Equation](#4-value-functions-and-the-bellman-equation)
- [5. Exploration vs Exploitation](#5-exploration-vs-exploitation)
- [6. Tabular Q-Learning](#6-tabular-q-learning)
- [7. Deep Reinforcement Learning](#7-deep-reinforcement-learning)
- [8. Reward Design](#8-reward-design)
- [9. Applications](#9-applications)
- [10. Challenges](#10-challenges)
- [11. Practical Tips](#11-practical-tips)
- [Key Takeaways](#key-takeaways)
- [Practice Questions](#practice-questions)
- [Answer Key](#answer-key)

- The reinforcement learning (RL) framework and its vocabulary
- Markov decision processes, returns, value functions and the Bellman equation
- Exploration vs exploitation
- Tabular Q-learning with worked numbers and runnable code
- Deep RL: DQN, policy gradients, actor-critic, PPO
- Applications, challenges and practical tips

---

## 1. What Is Reinforcement Learning?

Three main kinds of machine learning:

| Type | Learns from | Example |
|---|---|---|
| **Supervised** | Labelled examples | Photo → "cat" |
| **Unsupervised** | Structure in unlabelled data | Customer clustering |
| **Reinforcement** | **Rewards** from interacting with an environment | A robot learning to walk |

![Supervised learning uses example targets, unsupervised learning uses structure in inputs, and reinforcement learning obtains rewards after actions.](/materials/Assets/Connectionist%20AI/Static/rl-learning-signals.svg)

In RL an **agent** learns by **trial and error**. It acts, sees what happens, gets a reward, and gradually learns which behaviour earns more reward over time. No one tells it the correct action. It must discover it.

```
            action a_t
   Agent ─────────────────► Environment
     ▲                           │
     └──── state s_(t+1), reward r_(t+1) ◄──┘
```

Special difficulties compared with supervised learning:
- **Delayed reward:** a move may only pay off many steps later (credit assignment problem).
- **The agent's actions affect the data it sees.**
- **Exploration** is required.
- **Non-stationary** training data as the policy changes.

![An agent acts on an environment and receives a new observation and reward.](/materials/Assets/Connectionist%20AI/Animated/rl-feedback.svg)

## 2. Core Vocabulary

| Term | Meaning | Maze robot example |
|---|---|---|
| **Agent** | The learner and decision-maker | The robot |
| **Environment** | Everything the agent interacts with | The maze |
| **State (s)** | Description of the current situation | Robot's position |
| **Observation** | What the agent actually sees (may be partial) | Camera image |
| **Action (a)** | A choice available to the agent | Up, down, left, right |
| **Reward (r)** | Numeric feedback after an action | +10 at goal, −1 per step |
| **Policy (π)** | The agent's behaviour rule: state → action (or action probabilities) | "In cell X, go right" |
| **Episode** | One run from start to terminal state | One attempt at the maze |
| **Return (G)** | Total (discounted) future reward | Sum of rewards from now on |
| **Discount factor (γ)** | Weight of future vs immediate reward (0 to 1) | γ = 0.9 |
| **Value function V(s)** | Expected return from state s under a policy | "How good is this cell?" |
| **Action-value Q(s,a)** | Expected return after taking a in s, then following the policy | "How good is going right here?" |
| **Model** | The agent's prediction of environment dynamics (optional) | A map of the maze |

**Goal:** find a policy that **maximises the expected return**.

## 3. Markov Decision Process (MDP)

RL problems are usually formalised as an MDP: a set of states, actions, transition probabilities `P(s'|s,a)`, a reward function and γ.

**The Markov property:** the future depends only on the **current state and action**, not on the earlier history. (If the state captures everything relevant, this holds. Otherwise the problem is a *partially observable* MDP.)

![An illustrative state-action choice has two possible next states. The transition probabilities 0.7 and 0.3 sum to one. Rewards are attached to transitions.](/materials/Assets/Connectionist%20AI/Static/rl-mdp-transition.svg)

### 3.1 Return and Discounting
```
G_t = r_(t+1) + γ·r_(t+2) + γ²·r_(t+3) + ...
```
Example with rewards `[1, 1, 1]` and γ = 0.9:
```
G = 1 + 0.9 + 0.81 = 2.71
```
- γ near **0**: short-sighted (cares about immediate reward).
- γ near **1**: far-sighted.
- Discounting also keeps the infinite sum finite.

![For rewards one,one,one and discount factor 0.9, the contributions are one,0.9,0.81. Their sum is 2.71.](/materials/Assets/Connectionist%20AI/Static/rl-discounted-return.svg)

## 4. Value Functions and the Bellman Equation

The core idea: the value of a state equals **the reward you get now plus the discounted value of where you end up**.

```
V(s)   = E[ r + γ · V(s') ]
Q(s,a) = E[ r + γ · max_a' Q(s', a') ]       (optimal Q, the "Bellman optimality" form)
```

If we know the optimal `Q*`, the optimal policy is simply: **in each state pick the action with the highest Q**.

![The worked example combines immediate reward one with the best next-state value two discounted by 0.9, giving target 2.8.](/materials/Assets/Connectionist%20AI/Static/rl-bellman-target.svg)

## 5. Exploration vs Exploitation

- **Exploit:** choose the action currently believed best.
- **Explore:** try other actions to learn if something is better.

Only exploiting traps the agent in a mediocre routine; only exploring never cashes in.

**Strategies**
| Strategy | Idea |
|---|---|
| **ε-greedy** | With probability ε act randomly; otherwise pick the best action. Decay ε over time |
| **Softmax / Boltzmann** | Choose actions with probability based on Q values (temperature controls randomness) |
| **UCB (upper confidence bound)** | Favour actions with high value **or** high uncertainty |
| **Thompson sampling** | Sample from a belief about each action's value |
| **Curiosity / intrinsic rewards** | Reward the agent for visiting novel states |

![With epsilon 0.2, eighty percent of decisions use a current best action and twenty percent choose randomly from all actions. The random branch may also select a best action.](/materials/Assets/Connectionist%20AI/Static/rl-epsilon-greedy.svg)

### 5.1 The Multi-Armed Bandit (simplest case)
One state, several actions (slot-machine arms), unknown payouts. It isolates the explore/exploit trade-off and underlies A/B testing and online recommendation.

## 6. Tabular Q-Learning

Keep a table `Q[state][action]`. After each step update:

```
Q(s,a) ← Q(s,a) + α · [ r + γ · max_a' Q(s',a') − Q(s,a) ]
                          └──────── target ────────┘   └ current estimate ┘
```
- **α** = learning rate
- The bracket is the **temporal-difference (TD) error**: what happened minus what we expected.

**Worked example.** Current `Q(s,a) = 0`, α = 0.5, γ = 0.9, reward r = 1, best next value `max Q(s',a') = 2`:
```
target   = 1 + 0.9 × 2 = 2.8
TD error = 2.8 − 0 = 2.8
new Q    = 0 + 0.5 × 2.8 = 1.4
```

![With old Q zero, target 2.8 and learning rate 0.5, one Q-learning update moves halfway to the target, to 1.4.](/materials/Assets/Connectionist%20AI/Static/rl-q-update.svg)

### 6.1 Runnable Example: A 5-Cell Corridor
States 0 to 4 in a line. The agent starts at 0, moves left or right, and gets **+1** on reaching cell 4.

```python
import numpy as np

n_states, n_actions = 5, 2            # actions: 0 = left, 1 = right
Q = np.zeros((n_states, n_actions))
alpha, gamma, eps = 0.1, 0.9, 0.2
rng = np.random.default_rng(0)

for episode in range(500):
    s = 0
    while s != n_states - 1:                              # until goal
        if rng.random() < eps:
            a = int(rng.integers(n_actions))              # explore
        else:
            a = int(np.argmax(Q[s]))                      # exploit
        s2 = max(0, s - 1) if a == 0 else s + 1
        r = 1.0 if s2 == n_states - 1 else 0.0
        Q[s, a] += alpha * (r + gamma * np.max(Q[s2]) - Q[s, a])
        s = s2

print(Q.round(2))
```

After training, "right" values approach the discounted distance to the goal:

| State | Q(right) → approx. |
|---|---|
| 3 | 1.0 |
| 2 | 0.9 |
| 1 | 0.81 |
| 0 | 0.729 |

Reading this, the policy "always go right" emerges. Notice how value spreads **backwards** from the rewarding state, which is the Bellman equation at work.

![An agent moves right through states zero to four. Reaching state four gives reward one. The learned right-action values are 0.729,0.81,0.9,1.0 before the goal.](/materials/Assets/Connectionist%20AI/Animated/rl-corridor.svg)

### 6.2 On-Policy vs Off-Policy
- **Q-learning is off-policy:** it learns the value of the *greedy* policy while behaving with an exploratory one.
- **SARSA is on-policy:** it updates using the action actually taken next, `Q(s',a')`, so it learns the value of the policy it follows (more cautious near dangers).

![For a next-state estimate with left value two and right value five, Q-learning bootstraps from five. SARSA uses the value of the actual next action, which is two if exploration selects left.](/materials/Assets/Connectionist%20AI/Static/rl-on-off-policy.svg)

## 7. Deep Reinforcement Learning

A Q-table is impossible when states are huge or continuous (game pixels, robot sensors). **Neural networks approximate** the value function or the policy, and can **generalise** across similar states.

### 7.1 Deep Q-Network (DQN)
- A network takes the **state** and outputs **Q-values for every action**.
![A neural network maps an illustrative state vector to one value per discrete action. The action with the larger estimated Q-value is the greedy choice.](/materials/Assets/Connectionist%20AI/Static/rl-dqn-values.svg)

- Loss: squared TD error `(r + γ · max Q_target(s',a') − Q(s,a))²`.
- Two key stabilising tricks:
  1. **Experience replay:** store transitions `(s, a, r, s', done)` in a buffer and train on random mini-batches. This breaks the correlation between consecutive steps and reuses data.
  2. **Target network:** a slowly updated copy of the network used to compute targets, so the target doesn't shift every step.
- Variants: **Double DQN** (reduces overestimation), **Dueling DQN**, **Prioritised replay**, **Rainbow** (combines many).
- Works for **discrete actions**.

```python
import torch, torch.nn as nn

q_net = nn.Sequential(nn.Linear(4, 64), nn.ReLU(),
                      nn.Linear(64, 64), nn.ReLU(),
                      nn.Linear(64, 2))            # 4-dim state, 2 actions

# one training step (batch from replay buffer: s, a, r, s2, done)
with torch.no_grad():
    target = r + gamma * (1 - done) * target_net(s2).max(dim=1).values
q_sa = q_net(s).gather(1, a.unsqueeze(1)).squeeze(1)
loss = nn.functional.mse_loss(q_sa, target)
```

![Transitions are stored in replay memory, then sampled into training batches. A separate slowly updated target network supplies bootstrap values, while the online network is trained against those targets.](/materials/Assets/Connectionist%20AI/Static/rl-replay-target.svg)

### 7.2 Policy Gradient Methods
Learn the **policy network** `π_θ(a|s)` directly, which outputs action probabilities (or a Gaussian over continuous actions). Nudge it to make good actions more likely:

```
∇J(θ) = E[ ∇ log π_θ(a|s) · G ]       (REINFORCE)
```
Intuition: if an episode earned high return, increase the probability of the actions taken; if low, decrease it.
- ✅ Handles **continuous actions** and stochastic policies.
- ❌ High variance, sample-inefficient. Reduce variance with a **baseline** (subtract an average value) giving the **advantage** `A = G − V(s)`.

![An illustrative policy maps state features to probabilities of left 0.25 and right 0.75. Actions are sampled from the distribution during stochastic behavior.](/materials/Assets/Connectionist%20AI/Static/rl-policy-probabilities.svg)

### 7.3 Actor-Critic
- **Actor:** the policy network (chooses actions).
- **Critic:** a value network (estimates how good states/actions are, supplying the advantage).
- The critic gives lower-variance feedback to the actor.
- Examples: **A2C/A3C, DDPG, TD3, SAC** (continuous control), **PPO**.

![An actor chooses an action from the state. A critic evaluates the state or action and produces an advantage estimate that helps train the actor.](/materials/Assets/Connectionist%20AI/Static/rl-actor-critic.svg)

### 7.4 PPO (Proximal Policy Optimization)
PPO clips its surrogate objective to discourage excessively large policy updates. This does not impose a strict bound on policy change. It is simple, robust and a very common default, including in fine-tuning language models from human feedback (**RLHF**).

![For positive advantage equal to one and clipping epsilon 0.2, the clipped surrogate equals the probability ratio up to 1.2 and then stays at 1.2.](/materials/Assets/Connectionist%20AI/Static/rl-ppo-clip.svg)

### 7.5 Method Overview

| Family | Learns | Examples | Best for |
|---|---|---|---|
| Value-based | Q-values | Q-learning, DQN | Discrete actions |
| Policy-based | The policy | REINFORCE | Continuous / stochastic actions |
| Actor-critic | Both | A2C, PPO, SAC | General, most popular |
| Model-based | Environment model + planning | Dyna, MuZero | Sample-efficient settings |

**Model-free vs model-based:** model-free methods learn directly from experience; model-based methods learn (or are given) a model of the environment and **plan** with it, often needing less data.

## 8. Reward Design

The reward defines what the agent optimises, so it must reflect your **true goal**.
- **Sparse rewards** (only at the end) make learning hard. **Reward shaping** adds helpful intermediate signals, but badly designed shaping can mislead.
- **Reward hacking:** agents exploit loopholes. Classic example: a boat-racing agent circles to collect bonus points instead of finishing the race.
- Prefer rewards aligned with real outcomes, and test for unintended behaviour.
- **Imitation learning** and **inverse RL** learn from demonstrations when a reward is hard to write.

![A schematic route offers repeated bonus points on a loop while the finish is elsewhere. Optimizing bonus reward alone can favor circling over finishing.](/materials/Assets/Connectionist%20AI/Static/rl-reward-loophole.svg)

## 9. Applications
- **Games:** Atari, Go, chess, StarCraft, poker
- **Robotics and control:** walking, grasping, drones, data-centre cooling
- **Operations:** inventory and supply-chain control, dynamic pricing, traffic-light control, energy management
- **Recommendation and advertising:** bandits and long-term engagement optimisation (Chapter 8)
- **Finance:** portfolio and execution strategies (with great care)
- **Language models:** RLHF and preference-based fine-tuning
- **Science and engineering:** chip floorplanning, molecule design, plasma control

## 10. Challenges
| Challenge | Notes |
|---|---|
| **Sample inefficiency** | Needs millions of interactions |
| **Reward design** | Misspecified rewards cause bad behaviour |
| **Instability** | Sensitive to hyperparameters and random seeds |
| **Exploration in sparse-reward tasks** | Random behaviour rarely finds the reward |
| **Sim-to-real gap** | Skills learned in simulation may fail on real hardware |
| **Safety** | Exploring in the real world can be costly or dangerous |
| **Reproducibility** | Results vary; run multiple seeds |

**Offline RL** learns from a fixed logged dataset (no live exploration), useful when experimentation is risky.

## 11. Practical Tips
- Start with a **tiny environment** you can verify (like the corridor), then scale.
- Use well-tested libraries: **Gymnasium** (environments), **Stable-Baselines3**, **RLlib**, **CleanRL**.
- **Normalise observations and rewards.**
- Log **episode return**, episode length and loss; average over several **seeds**.
- Compare against a **random policy** and a **hand-written heuristic** baseline.
- Use **simulators** for safety and speed.

```python
# Minimal Stable-Baselines3 example
import gymnasium as gym
from stable_baselines3 import PPO

env = gym.make("CartPole-v1")
model = PPO("MlpPolicy", env, verbose=0)
model.learn(total_timesteps=50_000)
```

## Key Takeaways
- RL learns behaviour from **rewards through interaction**, balancing exploration and exploitation.
- The Bellman equation links a state's value to the next state's value, and Q-learning exploits it.
- Deep RL replaces tables with neural networks (DQN for values, policy gradients and actor-critic for policies; PPO is a popular default).
- Reward design, stability and safety are the main practical hurdles.

---

## Practice Questions

1. How does RL differ from supervised learning?
2. For a thermostat: name the agent, environment, state, action, reward.
3. What does γ control? What if γ = 0?
4. Return for rewards `[2, 2, 2]` with γ = 0.5?
5. ε-greedy in one sentence?
6. New Q: `Q = 2`, α = 0.1, γ = 0.9, r = 3, `max Q(s') = 5`?
7. Why does DQN use experience replay and a target network?
8. Why can't a Q-table handle game screens?
9. Actor vs critic?
10. What is reward hacking?

---

## Answer Key

1. Supervised learns from correct labels; RL learns from rewards via trial and error, often delayed.
2. Agent: controller. Environment: room. State: temperature, time, occupancy. Action: heat/cool/off. Reward: comfort minus energy cost.
3. The weight of future rewards. γ = 0 means only the immediate reward counts.
4. 2 + 1 + 0.5 = **3.5**.
5. Act randomly with probability ε, otherwise take the best-known action.
6. target = 3 + 0.9×5 = 7.5; new Q = 2 + 0.1×(7.5 − 2) = **2.55**.
7. Replay breaks correlation and reuses data; the target network keeps targets stable.
8. There are far too many possible states to store or generalise across.
9. Actor chooses actions (policy); critic estimates value to guide the actor.
10. The agent exploits loopholes in the reward to score high without achieving the intended goal.
