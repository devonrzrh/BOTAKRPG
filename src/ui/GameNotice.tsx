import { useEffect, useRef, useState } from "react";
import { Radio, X } from "lucide-react";
import { usePanelExit } from "./usePanelExit";

const NOTICE_MS = 6500;

export function GameNotice({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss: () => void;
}) {
  const { leaving, exit } = usePanelExit(onDismiss);
  const [hovered, setHovered] = useState(false),
    [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(document.hidden);
  const remaining = useRef(NOTICE_MS);
  const paused = hovered || focused || hidden;
  useEffect(() => {
    const change = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", change);
    return () => document.removeEventListener("visibilitychange", change);
  }, []);
  useEffect(() => {
    if (paused || leaving) return;
    const started = performance.now();
    const timer = setTimeout(() => exit(undefined), remaining.current);
    return () => {
      clearTimeout(timer);
      remaining.current = Math.max(
        0,
        remaining.current - (performance.now() - started),
      );
    };
  }, [paused, leaving, exit]);
  return (
    <div
      className={`toast game-notice feedback-panel${leaving ? " is-leaving" : ""}`}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null))
          setFocused(false);
      }}
    >
      <Radio size={22} aria-hidden="true" />
      <span role="status">{message}</span>
      <button aria-label="Dismiss notification" onClick={() => exit(undefined)}>
        <X size={20} />
      </button>
      <i
        className="notice-lifetime"
        aria-hidden="true"
        style={{
          animationDuration: `${NOTICE_MS}ms`,
          animationPlayState: paused ? "paused" : "running",
        }}
      />
    </div>
  );
}
