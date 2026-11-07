import { readFile, writeFile } from "node:fs/promises";
import { stringify } from "yaml";
import { parseMarkdown } from "./compile-content";
// Authored checkpoints complement the imported bank, including topics absent from it.
const checks = [
  [
    "source-alg-00",
    "What does range(3) produce in a Python for loop?",
    "0, 1, 2",
    "1, 2, 3",
    "0, 1, 2, 3",
    "Only 3",
    "range stops before its upper bound, so range(3) yields three integers starting at zero.",
  ],
  [
    "source-alg-01",
    "What distinguishes an algorithm from its implementation?",
    "An algorithm is a precise method; a program implements it",
    "An algorithm must use Python",
    "An algorithm never terminates",
    "Every program is a different algorithm",
    "The same sequence of problem-solving steps can be implemented in many programming languages.",
  ],
  [
    "source-alg-02",
    "Which sorting algorithm inserts each new element into a sorted prefix?",
    "Insertion sort",
    "Selection sort",
    "Binary search",
    "Breadth-first search",
    "Insertion sort shifts larger prefix elements right and places the new element in the gap.",
  ],
  [
    "source-alg-03",
    "What must hold before binary search can discard half the candidates?",
    "The sequence is sorted",
    "All values are positive",
    "The length is even",
    "The target is present",
    "Sorted order lets comparison with the midpoint rule out an entire half, even when the target is absent.",
  ],
  [
    "source-alg-04",
    "What stops a recursive function from continually calling itself?",
    "A reachable base case",
    "An extra loop",
    "A larger call stack",
    "A global variable alone",
    "A base case terminates recursion, and recursive calls must make progress toward it.",
  ],
  [
    "source-alg-05",
    "A pair of nested loops each visits all n elements. How does the work grow?",
    "O(n²)",
    "O(1)",
    "O(log n)",
    "O(n)",
    "Each of n outer iterations performs n inner iterations, giving n × n operations.",
  ],
  [
    "source-alg-06",
    "Which frontier rule gives BFS its shortest-path guarantee on an unweighted graph?",
    "Process the oldest discovered vertex first",
    "Process the newest vertex first",
    "Always take the largest edge",
    "Revisit every vertex indefinitely",
    "A FIFO queue processes vertices in nondecreasing distance from the start.",
  ],
  [
    "source-alg-07",
    "Greedy change for 6 with coins 1, 3, 4 uses 4+1+1. What does this demonstrate?",
    "A locally best choice can miss the global optimum",
    "Greedy always gives optimal change",
    "Three coins are optimal",
    "No solution exists",
    "The optimum is 3+3, only two coins. Greedy needs a proof of its choice property for the problem.",
  ],
  [
    "source-alg-08",
    "Why does dynamic programming store subproblem results?",
    "To avoid recomputing overlapping subproblems",
    "To make every choice random",
    "To discard the recurrence",
    "To prevent all memory use",
    "Memoization or tabulation reuses solutions to overlapping subproblems when building an optimal solution.",
  ],
  [
    "source-alg-09",
    "What does expected cost combine under uncertain demand?",
    "Each possible cost weighted by its probability",
    "Only the cheapest possible outcome",
    "Only the most likely demand",
    "The sum of costs without probabilities",
    "Expected cost is the sum of probability × cost over the possible outcomes.",
  ],
  [
    "source-alg-10",
    "Why can the cheapest immediate action be a poor sequential decision?",
    "It changes the state and costs of future decisions",
    "Future states never depend on actions",
    "Immediate cost is always the total cost",
    "Probabilities cannot be used",
    "A sequential policy accounts for both the immediate cost and the value of the resulting future state.",
  ],
  [
    "source-ds-01",
    "Why does choosing a data structure matter?",
    "It affects how efficiently required operations can be performed",
    "Every structure has identical costs",
    "It changes Python syntax",
    "It removes the need for algorithms",
    "Representation determines the operations available and their time and space costs.",
  ],
  [
    "source-ds-02",
    "What makes a data structure linear?",
    "Its elements have a sequential arrangement",
    "All its operations take constant time",
    "It cannot grow",
    "Every element has many children",
    "Arrays, linked lists, stacks and queues organize data in a sequence, with different access rules.",
  ],
  [
    "source-ds-03",
    "In a packed array, inserting at the front usually requires what?",
    "Shifting existing elements to make room",
    "Changing only a head pointer",
    "No element movement",
    "Sorting first",
    "Maintaining consecutive positions requires moving later elements one position right.",
  ],
  [
    "source-ds-04",
    "What does a singly linked-list node contain?",
    "A value and a link to the next node",
    "Only an array index",
    "All other nodes",
    "Only the last value",
    "Links connect separately stored nodes; reaching a position generally requires following preceding links.",
  ],
  [
    "source-ds-05",
    "After push(A), push(B), pop(), which stack element remains?",
    "A",
    "B",
    "Both A and B",
    "Neither",
    "A stack is last in, first out. B is removed first.",
  ],
  [
    "source-ds-06",
    "Which queue item is removed first under FIFO?",
    "The earliest item still waiting",
    "The most recent item",
    "The largest item",
    "An arbitrary item",
    "First in, first out preserves arrival order.",
  ],
  [
    "source-ds-07",
    "Which relationship is naturally represented by a nonlinear structure?",
    "A folder hierarchy with branching subfolders",
    "A single FIFO waiting line",
    "A plain sequence of scores",
    "A single undo stack",
    "Trees and graphs express branching or network relationships beyond one sequence.",
  ],
  [
    "source-ds-08",
    "Which traversal returns sorted keys from a binary search tree?",
    "Inorder: left, node, right",
    "Preorder: node, left, right",
    "Level order",
    "Any traversal always does",
    "The BST ordering property puts smaller keys left and larger keys right, so inorder visits keys in sorted order.",
  ],
  [
    "source-ds-09",
    "What does an adjacency list store for each graph vertex?",
    "Its directly connected neighbors",
    "Every reachable vertex only",
    "Only the shortest route",
    "Only its numeric index",
    "An adjacency list records direct edges; reachability and routes are computed by traversal algorithms.",
  ],
  [
    "source-ds-10",
    "Why record a revision's parent and checksum?",
    "To trace its lineage and detect content changes",
    "To guarantee the data is correct",
    "To erase earlier revisions",
    "To eliminate storage",
    "Parent references describe history; a checksum helps check content identity or integrity, not factual correctness.",
  ],
  [
    "source-ai-01",
    "How does a connectionist model usually learn?",
    "By adjusting connection weights from examples",
    "By storing only handwritten rules",
    "By ignoring observations",
    "By adding a neuron for each answer",
    "Connectionist systems learn distributed representations through networks of weighted connections.",
  ],
  [
    "source-ai-02",
    "What is computed before a neuron's activation function?",
    "A weighted sum of inputs plus bias",
    "Only the largest input",
    "The target label",
    "A random class",
    "The preactivation is z = sum(wᵢxᵢ) + b, then an activation transforms z.",
  ],
  [
    "source-ai-03",
    "Which task is a natural fit for a neural network with suitable data?",
    "Recognizing patterns in images",
    "Replacing exact integer addition",
    "Guaranteeing every prediction is correct",
    "Learning without any signal",
    "Neural networks can learn complex patterns from examples, but require evaluation on unseen data.",
  ],
  [
    "source-ai-04",
    "Why use nonlinear activation functions in hidden layers?",
    "Without them stacked affine layers collapse to one affine map",
    "They guarantee zero error",
    "They remove all gradients",
    "They replace training data",
    "Nonlinear activations let deep networks model nonlinear relationships such as XOR.",
  ],
  [
    "source-ai-05",
    "How should forecasting training and test data usually be split?",
    "Train on earlier times and test on later times",
    "Shuffle future and past indiscriminately",
    "Tune on test targets",
    "Use only training error",
    "A chronological split simulates predicting unseen future observations and helps prevent future leakage.",
  ],
  [
    "source-ai-06",
    "What does calibration of an 80% prediction interval mean?",
    "Across comparable predictions, about 80% of outcomes fall inside",
    "Every outcome must fall inside",
    "The interval must be infinitely wide",
    "It guarantees each individual outcome",
    "Calibration compares nominal and observed coverage. Width also matters; overly wide intervals are not automatically well calibrated.",
  ],
  [
    "source-ai-07",
    "What is concept drift?",
    "A change in the data-generating relationship over time",
    "A fixed ordering of training rows",
    "An unchanged loss function",
    "A larger batch alone",
    "Online systems monitor changing patterns and may adapt using recent examples, windows or drift detection.",
  ],
  [
    "source-ai-08",
    "What is the cold-start problem in recommendation?",
    "Too little interaction history for a new user or item",
    "A low machine temperature",
    "Too many known ratings",
    "A fully trained model",
    "Content features, initial preferences and exploration help when collaborative interaction history is sparse.",
  ],
  [
    "source-ai-09",
    "Why does an epsilon-greedy agent sometimes act randomly?",
    "To explore actions beyond its current best estimate",
    "To guarantee the optimal action every time",
    "To discard all learned values",
    "To avoid receiving rewards",
    "Exploration can discover better actions; exploitation uses current value estimates.",
  ],
  [
    "source-ai-10",
    "Training loss falls while validation loss rises. What is a likely issue?",
    "Overfitting",
    "Guaranteed generalization",
    "Too little training in every case",
    "A perfect test score",
    "The model may be fitting training-specific details. Early stopping, regularization or more suitable data can help.",
  ],
];
const manifest = JSON.parse(
  await readFile("content/source-manifest.json", "utf8"),
);
const records: object[] = checks.map(
  ([lesson, prompt, correct, ...rest], index) => {
    const options = [correct, ...rest.slice(0, 3)],
      rotation = index % 4;
    return {
      type: "question",
      id: `${lesson}-checkpoint`,
      title: "Checkpoint",
      lesson,
      format: "choice",
      prompt,
      options: [...options.slice(rotation), ...options.slice(0, rotation)],
      answer: [(4 - rotation) % 4],
      explanation: rest[3],
    };
  },
);
const specs = [
  {
    topic: "algorithms",
    branch: "routing-trace",
    boss: "route-warden",
    title: "Route Warden",
    clue: "PATCH's signed receipt",
    text: "Receipt: ECHO-7 entered maintenance relay R-17 at 02:14.",
  },
  {
    topic: "structures",
    branch: "access-records",
    boss: "archive-keeper",
    title: "Archive Keeper",
    clue: "FOLIO's signed audit",
    text: "Signed audit: ECHO-7 used M-04, then erased its gateway entry.",
  },
  {
    topic: "ai",
    branch: "signal-identification",
    boss: "signal-mimic",
    title: "Signal Mimic",
    clue: "Signal signature",
    text: "The model separates ECHO-7's signal from the decoy traffic.",
  },
];
const branches = parseMarkdown(
  await readFile("content/07-quest-branches.md", "utf8"),
);
for (const spec of specs) {
  const chapters = manifest.chapters.filter(
    (c: { topic: string }) => c.topic === spec.topic,
  );
  for (const chapter of chapters)
    records.push({
      type: "activity",
      id: `encounter-${chapter.id}`,
      title: chapter.title,
      template: "battle",
      lesson: chapter.id,
      enemy: {
        id: `guard-${chapter.id}`,
        title:
          spec.topic === "algorithms"
            ? "Route interceptor"
            : spec.topic === "structures"
              ? "Archive drone"
              : "Signal decoy",
        hp: 30,
        attack: 7,
        mixedQuestions: false,
        lessons: [chapter.id],
      },
    });
  records.push({
    type: "activity",
    id: spec.boss,
    title: spec.title,
    template: "battle",
    lesson: chapters[0].id,
    enemy: {
      id: spec.boss,
      title: spec.title,
      hp: 100,
      attack: 10,
      mixedQuestions: false,
      lessons: chapters.map((c: { id: string }) => c.id),
    },
    clue: { title: spec.clue, text: spec.text },
  });
  const branch = branches.find((b) => b.id === spec.branch)!;
  if (branch.type === "quest") {
    branch.objectives = [
      branch.objectives[0],
      ...chapters.map((c: { id: string }) => `encounter-${c.id}`),
      spec.boss,
    ];
    branch.description =
      spec.topic === "algorithms"
        ? "Find the trapped courier PATCH. Trace ECHO-7's forged routes and recover its signed delivery receipt from the Route Warden."
        : spec.topic === "structures"
          ? "Restore the archivist FOLIO's identity, reconstruct the erased gateway log and confront the Archive Keeper."
          : `Investigate ${chapters.length} ${spec.topic === "ai" ? "connectionist AI" : spec.topic} chapters, then defeat ${spec.title} to recover the clue.`;
  }
}
await writeFile(
  "content/08-curriculum.md",
  `# Curriculum encounters\n\n${records.map((record) => `\`\`\`entity\n${stringify(record)}\`\`\``).join("\n\n")}\n`,
);
await writeFile(
  "content/07-quest-branches.md",
  `# Clue branches\n\n${branches.map((record) => `\`\`\`entity\n${stringify(record)}\`\`\``).join("\n\n")}\n`,
);
