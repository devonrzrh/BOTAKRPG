import { useState } from "react";
import {
  addSample,
  accuracy,
  heldOut,
  initialNetwork,
  predict,
  train,
  type Sample,
} from "../game/perceptron";
export function Garden({
  onComplete,
  onLesson,
}: {
  onComplete: () => void;
  onLesson: () => void;
}) {
  const [samples, setSamples] = useState<Sample[]>([]),
    [network, setNetwork] = useState(initialNetwork),
    [label, setLabel] = useState<0 | 1>(0),
    [rate, setRate] = useState(0.2),
    [epochs, setEpochs] = useState(10),
    [tested, setTested] = useState(false),
    [message, setMessage] = useState(""),
    [x, setX] = useState(-0.5),
    [y, setY] = useState(-0.5);
  const add = (px: number, py: number) => {
    try {
      setSamples((previous) => addSample(previous, { x: px, y: py, label }));
      setTested(false);
      setMessage("Example added.");
    } catch (e) {
      setMessage(String(e));
    }
  };
  const score = accuracy(network, heldOut);
  return (
    <div className="garden-layout">
      <div>
        <p className="muted">
          Mark signals: amber if x₁ + x₂ &lt; 0; teal otherwise.
        </p>
        <div className="segmented">
          <button
            className={label === 0 ? "selected" : ""}
            onClick={() => setLabel(0)}
          >
            ● Amber / 0
          </button>
          <button
            className={label === 1 ? "selected" : ""}
            onClick={() => setLabel(1)}
          >
            ● Teal / 1
          </button>
        </div>
        <svg
          className="neuron-plot"
          viewBox="0 0 400 400"
          role="img"
          aria-label="Classification plane. Use the coordinate fields below as a keyboard alternative."
          onClick={(event) => {
            const rect = event.currentTarget.getBoundingClientRect();
            add(
              Math.round(
                (((event.clientX - rect.left) / rect.width) * 2 - 1) * 100,
              ) / 100,
              Math.round(
                (1 - ((event.clientY - rect.top) / rect.height) * 2) * 100,
              ) / 100,
            );
          }}
        >
          {Array.from({ length: 20 }, (_, row) =>
            Array.from({ length: 20 }, (_, col) => (
              <rect
                key={`${row}-${col}`}
                x={col * 20}
                y={row * 20}
                width="20"
                height="20"
                fill={
                  predict(network, col / 10 - 0.95, 0.95 - row / 10)
                    ? "#438b803b"
                    : "#d3a35c26"
                }
              />
            )),
          )}
          {[80, 160, 240, 320].map((n) => (
            <g key={n} stroke="#52665a30">
              <line x1={n} x2={n} y1="0" y2="400" />
              <line y1={n} y2={n} x1="0" x2="400" />
            </g>
          ))}
          <path
            d="M200 0V400M0 200H400"
            stroke="#6b8074"
            strokeDasharray="4 5"
          />
          {samples.map((p, i) => (
            <circle
              key={i}
              cx={(p.x + 1) * 200}
              cy={(1 - p.y) * 200}
              r="7"
              fill={p.label ? "#438b80" : "#d3a35c"}
              stroke="#e8eadb"
              strokeWidth="2"
            />
          ))}
          {tested &&
            heldOut.map((p, i) => (
              <text
                key={i}
                x={(p.x + 1) * 200}
                y={(1 - p.y) * 200 + 5}
                textAnchor="middle"
                fill={
                  predict(network, p.x, p.y) === p.label ? "#408675" : "#c05a50"
                }
                fontSize="21"
              >
                ×
              </text>
            ))}
          <text x="370" y="188" fill="#b5c3b9" fontSize="20">
            x₁
          </text>
          <text x="208" y="25" fill="#b5c3b9" fontSize="20">
            x₂
          </text>
        </svg>
        <details className="activity-tools">
          <summary>Add by coordinates</summary>
          <div className="inline-fields">
            <label>
              x₁
              <input
                type="number"
                min="-1"
                max="1"
                step=".1"
                value={x}
                onChange={(e) =>
                  setX(Math.max(-1, Math.min(1, Number(e.target.value))))
                }
              />
            </label>
            <label>
              x₂
              <input
                type="number"
                min="-1"
                max="1"
                step=".1"
                value={y}
                onChange={(e) =>
                  setY(Math.max(-1, Math.min(1, Number(e.target.value))))
                }
              />
            </label>
            <button onClick={() => add(x, y)}>Add example</button>
          </div>
        </details>
      </div>
      <div className="experiment-controls">
        <h3>Decode the signal</h3>
        <p>
          Add examples of both colors. Train, then test the unknown signals.
        </p>
        <div className="metric-grid">
          <div>
            <strong>{samples.length}</strong>
            <span>examples</span>
          </div>
          <div>
            <strong>{network.epochs}</strong>
            <span>epochs</span>
          </div>
          <div>
            <strong>{tested ? `${Math.round(score * 100)}%` : "—"}</strong>
            <span>held-out accuracy</span>
          </div>
        </div>
        <details className="activity-tools network-settings">
          <summary>Tune network</summary>
          <p>
            Class 1 when <code>w₁x₁ + w₂x₂ + b ≥ 0</code>. Mistakes adjust the
            weights.
          </p>
          <label>
            Learning rate{" "}
            <input
              type="number"
              min=".01"
              max="1"
              step=".05"
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
            />
          </label>
          <div className="weights">
            <span>
              w₁ <b>{network.weights[0].toFixed(3)}</b>
            </span>
            <span>
              w₂ <b>{network.weights[1].toFixed(3)}</b>
            </span>
            <span>
              bias <b>{network.bias.toFixed(3)}</b>
            </span>
          </div>
          <label>
            Epochs per run{" "}
            <input
              type="number"
              min="1"
              max="100"
              value={epochs}
              onChange={(e) => setEpochs(Number(e.target.value))}
            />
          </label>
        </details>
        <button
          className="primary"
          onClick={() => {
            try {
              setNetwork(train(network, samples, epochs, rate));
              setTested(false);
              setMessage("Weights updated. Test on unseen examples next.");
            } catch (e) {
              setMessage(String(e));
            }
          }}
        >
          Train
        </button>
        <button
          disabled={!network.epochs}
          onClick={() => {
            setTested(true);
            if (network.epochs >= 10 && score >= 5 / 6) {
              onComplete();
              setMessage(
                "Exhibit complete. Your boundary generalizes to the held-out examples.",
              );
            } else
              setMessage(
                "Try more varied examples. Aim for 83% on held-out points after at least 10 epochs.",
              );
          }}
        >
          Test signals
        </button>
        <p className="feedback" role="status">
          {message || "Start by adding examples of both classes."}
        </p>
        <button className="text-button" onClick={onLesson}>
          Reference book
        </button>
        <button
          className="text-button"
          onClick={() => {
            setSamples([]);
            setNetwork(initialNetwork());
            setTested(false);
            setMessage("Exhibit reset.");
          }}
        >
          Clear signals
        </button>
      </div>
    </div>
  );
}
