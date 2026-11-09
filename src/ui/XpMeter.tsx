import { useEffect, useRef, useState } from "react";
import { xpProgress } from "../game/xp";
export function XpMeter({
  xp,
  initialXp = xp,
  reducedMotion = false,
  label = "Experience",
  compact = false,
}: {
  xp: number;
  initialXp?: number;
  reducedMotion?: boolean;
  label?: string;
  compact?: boolean;
}) {
  const [shown, setShown] = useState(initialXp);
  const previousXp = useRef(xp);
  const [gain, setGain] = useState(0),
    [leveled, setLeveled] = useState(false);
  const gainTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => {
    const before = previousXp.current;
    previousXp.current = xp;
    if (!compact || xp === before) return;
    clearTimeout(gainTimer.current);
    if (xp < before) {
      setGain(0);
      setLeveled(false);
      return;
    }
    setGain((value) => value + xp - before);
    setLeveled(
      (value) => value || xpProgress(xp).level > xpProgress(before).level,
    );
    gainTimer.current = setTimeout(() => {
      setGain(0);
      setLeveled(false);
    }, 2800);
  }, [xp, compact]);
  useEffect(() => () => clearTimeout(gainTimer.current), []);
  useEffect(() => {
    if (xp === shown) return;
    if (
      reducedMotion ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setShown(xp);
      return;
    }
    const from = shown,
      start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 900);
      setShown(Math.floor(from + (xp - from) * t));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
    // Begin from the last displayed value when the actual XP changes.
  }, [xp, reducedMotion]);
  const progress = xpProgress(shown);
  if (compact)
    return (
      <div
        className={`xp-meter xp-compact${gain ? " xp-gained" : ""}`}
        aria-label="Character progression"
      >
        <span>Level {progress.level}</span>
        <div className="xp-compact-track">
          <strong>
            {progress.maxed ? "MAX" : `${progress.current} / 100 XP`}
          </strong>
          <div
            role="progressbar"
            aria-label={label}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress.current}
          >
            <i style={{ width: `${progress.current}%` }} />
          </div>
        </div>
        {!progress.maxed && (
          <span>
            {progress.needed} XP to level {progress.level + 1}
          </span>
        )}
        {gain > 0 && (
          <span className="xp-gain" key={gain} role="status">
            {leveled ? `Level ${xpProgress(xp).level} reached · ` : ""}+{gain}{" "}
            XP
          </span>
        )}
      </div>
    );
  return (
    <div className="xp-meter">
      <div>
        <span>Level {progress.level}</span>
        <strong>
          {progress.maxed ? "MAX" : `${progress.current} / 100 XP`}
        </strong>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress.current}
      >
        <i style={{ width: `${progress.current}%` }} />
      </div>
      {!progress.maxed && (
        <span className="xp-next">
          {progress.needed} XP to level {progress.level + 1}
        </span>
      )}
    </div>
  );
}
