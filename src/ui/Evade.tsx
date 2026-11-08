import { useCallback, useEffect, useRef, useState } from "react";
import {
  createEvade,
  evadeComplete,
  stepEvade,
  type EvadeState,
} from "../game/evade";
import "./Evade.css";
import { useGameSound } from "./GameSound";
import { evadeSoundCues } from "../game/sfx";

type Props = {
  seed: number;
  reducedMotion: boolean;
  muted: boolean;
  onResolve: (collisions: number) => void;
  onCancel: () => void;
};

export function Evade({
  seed,
  reducedMotion,
  muted,
  onResolve,
  onCancel,
}: Props) {
  const sound = useGameSound();
  const mutedRef = useRef(muted);
  mutedRef.current = muted;
  const [state, setState] = useState<EvadeState | null>(null);
  const arena = useRef<SVGSVGElement>(null);
  const stateRef = useRef<EvadeState | null>(null);
  const direction = useRef<-1 | 0 | 1>(0);
  const finished = useRef(false);
  const callbacks = useRef({ onResolve, onCancel });
  callbacks.current = { onResolve, onCancel };

  const cancel = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    callbacks.current.onCancel();
  }, []);

  const begin = useCallback(
    (assisted = false) => {
      if (finished.current) return;
      if (assisted) {
        if (!mutedRef.current) sound("dodge");
        finished.current = true;
        callbacks.current.onResolve(0);
        return;
      }
      const initial = createEvade(seed);
      if (!mutedRef.current) sound("scan");
      stateRef.current = initial;
      setState(initial);
      requestAnimationFrame(() => arena.current?.focus());
    },
    [seed, sound],
  );

  useEffect(() => {
    if (!state) return;
    let frame = 0;
    let previous = performance.now();
    const tick = (now: number) => {
      const current = stateRef.current;
      if (!current || finished.current) return;
      const dt = Math.min(0.1, Math.max(0, (now - previous) / 1000));
      previous = now;
      const next = stepEvade(current, dt, direction.current);
      if (!mutedRef.current) evadeSoundCues(current, next).forEach(sound);
      stateRef.current = next;
      setState(next);
      if (evadeComplete(next)) {
        finished.current = true;
        callbacks.current.onResolve(next.collisions);
      } else frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [!!state, sound]);

  const onKeyDown = (event: React.KeyboardEvent<SVGSVGElement>) => {
    if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
      event.preventDefault();
      direction.current = -1;
    } else if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
      event.preventDefault();
      direction.current = 1;
    } else if (event.key === "Escape") {
      event.preventDefault();
      cancel();
    }
  };
  const clearDirection = () => {
    direction.current = 0;
  };
  const hold =
    (value: -1 | 1) => (event: React.PointerEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      direction.current = value;
    };
  const timeLeft = state ? Math.max(0, 1 - state.elapsed / 2.8) : 1;

  return (
    <section className="evade" aria-label="Defensive dodge">
      {!state ? (
        <div className="evade-intro">
          <p>Move left/right to avoid the lanes. Guard is always available.</p>
          <div className="evade-actions">
            <button
              className="evade-primary"
              onClick={() => begin(reducedMotion)}
            >
              {" "}
              {reducedMotion ? "Use assisted dodge" : "Begin dodge"}
            </button>
            <button onClick={cancel}>Guard instead</button>
          </div>
        </div>
      ) : (
        <>
          <div className="evade-status">
            <span>DODGE WINDOW</span>
            <span>{state.collisions} / 3 hits</span>
          </div>
          <div
            className="evade-track"
            role="progressbar"
            aria-label="Dodge time remaining"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(timeLeft * 100)}
          >
            <span style={{ transform: `scaleX(${timeLeft})` }} />
          </div>
          <svg
            ref={arena}
            className="evade-arena"
            viewBox="0 0 480 200"
            role="img"
            aria-label="Dodge arena. Use left and right arrow keys or A and D."
            tabIndex={0}
            onKeyDown={onKeyDown}
            onKeyUp={(event) => {
              if (
                ["ArrowLeft", "ArrowRight", "a", "d", "A", "D"].includes(
                  event.key,
                )
              )
                clearDirection();
            }}
            onBlur={clearDirection}
          >
            <defs>
              <pattern
                id="evade-grid"
                width="24"
                height="24"
                patternUnits="userSpaceOnUse"
              >
                <path
                  d="M24 0H0V24"
                  fill="none"
                  stroke="#263844"
                  strokeWidth="1"
                />
              </pattern>
            </defs>
            <rect width="480" height="200" fill="url(#evade-grid)" />
            <line
              x1="18"
              x2="462"
              y1="160"
              y2="160"
              className="evade-player-line"
            />
            {state.hazards.map((hazard, index) => {
              const distance = (hazard.at - state.elapsed) * 320;
              const y = hazard.resolved
                ? -20
                : Math.max(18, Math.min(160, 160 - distance));
              return (
                <g
                  key={index}
                  className={
                    hazard.resolved ? "evade-hazard resolved" : "evade-hazard"
                  }
                >
                  <line x1={hazard.lane} x2={hazard.lane} y1="18" y2="176" />
                  <path
                    d={`M${hazard.lane - 9} ${y - 10} L${hazard.lane + 9} ${y - 10} L${hazard.lane} ${y + 8} Z`}
                  />
                </g>
              );
            })}
            <circle
              className="evade-player"
              cx={state.playerX}
              cy="160"
              r="12"
            />
            <circle
              className="evade-player-core"
              cx={state.playerX}
              cy="160"
              r="4"
            />
          </svg>
          <div className="evade-controls" aria-label="Movement controls">
            <button
              aria-label="Move left"
              onPointerDown={hold(-1)}
              onPointerUp={clearDirection}
              onPointerCancel={clearDirection}
              onLostPointerCapture={clearDirection}
            >
              ← Left
            </button>
            <span>← / A &nbsp; · &nbsp; D / →</span>
            <button
              aria-label="Move right"
              onPointerDown={hold(1)}
              onPointerUp={clearDirection}
              onPointerCancel={clearDirection}
              onLostPointerCapture={clearDirection}
            >
              Right →
            </button>
          </div>
          <button className="evade-guard" onClick={cancel}>
            Guard instead
          </button>
        </>
      )}
    </section>
  );
}
