import { useEffect, useState } from "react";
import { Monitor, X } from "lucide-react";
import "./ViewportWarning.css";

const minimumWidth = 640;
const minimumHeight = 480;
const supportedViewport = `(min-width: ${minimumWidth}px) and (min-height: ${minimumHeight}px)`;

export function ViewportWarning({ mobileOnly = false }: { mobileOnly?: boolean }) {
  const mobile =
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const [compact, setCompact] = useState(
    () => !window.matchMedia(supportedViewport).matches,
  );
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const query = window.matchMedia(supportedViewport);
    const update = () => {
      setCompact(!query.matches);
      if (query.matches && !mobile) setDismissed(false);
    };
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, [mobile]);

  if (dismissed || (!mobile && (mobileOnly || !compact))) return null;

  return (
    <aside className="viewport-warning" aria-label="Display warning">
      <Monitor size={22} aria-hidden="true" />
      <div role="status">
        <strong>
          {mobile ? "Mobile is unsupported" : "Small game window"}
        </strong>
        {mobile ? (
          <p>Open NULL / TRACE on a desktop or laptop to play.</p>
        ) : (
          <p>
            Some controls may be cramped. Use a window at least {minimumWidth} ×{" "}
            {minimumHeight}.
          </p>
        )}
      </div>
      <button
        type="button"
        aria-label="Dismiss display warning"
        onClick={() => setDismissed(true)}
      >
        <X size={20} aria-hidden="true" />
      </button>
    </aside>
  );
}
