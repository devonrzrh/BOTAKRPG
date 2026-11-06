export interface Sample {
  x: number;
  y: number;
  label: 0 | 1;
}
export interface Perceptron {
  weights: [number, number];
  bias: number;
  epochs: number;
}
export const initialNetwork = (): Perceptron => ({
  weights: [0.12, -0.18],
  bias: 0,
  epochs: 0,
});
export const predict = (net: Perceptron, x: number, y: number): 0 | 1 =>
  net.weights[0] * x + net.weights[1] * y + net.bias >= 0 ? 1 : 0;
export const heldOut: Sample[] = [
  { x: -0.85, y: -0.6, label: 0 },
  { x: -0.7, y: 0.2, label: 0 },
  { x: -0.2, y: -0.7, label: 0 },
  { x: 0.8, y: 0.6, label: 1 },
  { x: 0.6, y: -0.1, label: 1 },
  { x: 0.1, y: 0.75, label: 1 },
];
export const samePoint = (
  a: Pick<Sample, "x" | "y">,
  b: Pick<Sample, "x" | "y">,
) => Math.hypot(a.x - b.x, a.y - b.y) < 0.035;
export function addSample(samples: Sample[], sample: Sample): Sample[] {
  if (samples.length >= 200)
    throw new Error("This exhibit supports up to 200 examples.");
  if (heldOut.some((p) => samePoint(p, sample)))
    throw new Error(
      "That location is reserved for a held-out point. Choose another.",
    );
  if (samples.some((p) => samePoint(p, sample)))
    throw new Error("A nearby example already exists.");
  return [...samples, sample];
}
export function train(
  net: Perceptron,
  samples: Sample[],
  epochs: number,
  rate: number,
): Perceptron {
  if (
    !samples.some((p) => p.label === 0) ||
    !samples.some((p) => p.label === 1)
  )
    throw new Error("Label at least one example of each class.");
  if (
    !Number.isInteger(epochs) ||
    epochs < 1 ||
    epochs > 100 ||
    !Number.isFinite(rate) ||
    rate <= 0 ||
    rate > 1
  )
    throw new Error("Use 1–100 epochs and a learning rate in (0, 1].");
  const next = structuredClone(net);
  for (let i = 0; i < epochs; i++)
    for (const p of samples) {
      const error = p.label - predict(next, p.x, p.y);
      next.weights[0] += rate * error * p.x;
      next.weights[1] += rate * error * p.y;
      next.bias += rate * error;
    }
  next.epochs += epochs;
  return next;
}
export const accuracy = (net: Perceptron, samples: Sample[]) =>
  samples.length
    ? samples.filter((p) => predict(net, p.x, p.y) === p.label).length /
      samples.length
    : 0;
