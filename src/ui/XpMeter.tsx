import { useEffect, useState } from "react";
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
  useEffect(() => {
    if (xp === shown) return;
    if (reducedMotion) {
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
      <div className="xp-meter xp-compact" aria-label="Character progression">
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
