import { useEffect, useState } from "react";
import { Monitor, X } from "lucide-react";
import "./ViewportWarning.css";

const minimumWidth = 640;
const minimumHeight = 480;
const supportedViewport = `(min-width: ${minimumWidth}px) and (min-height: ${minimumHeight}px)`;

export function ViewportWarning() {
  const [compact, setCompact] = useState(
    () => !window.matchMedia(supportedViewport).matches,
  );
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const query = window.matchMedia(supportedViewport);
    const update = () => {
      setCompact(!query.matches);
      if (query.matches) setDismissed(false);
    };
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  if (!compact || dismissed) return null;

  return (
    <aside className="viewport-warning" aria-label="Display warning">
      <Monitor size={22} aria-hidden="true" />
      <div role="status">
        <strong>Small game window</strong>
        <p>
          Some controls may be cramped. Use a window at least {minimumWidth} ×{" "}
          {minimumHeight}, or try rotating your device.
        </p>
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
