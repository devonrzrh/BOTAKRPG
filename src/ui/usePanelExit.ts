import { useCallback, useEffect, useRef, useState } from "react";

export const PANEL_EXIT_MS = 180;

/** Keep a panel mounted through its exit; commit its action once, after the fade. */
export function usePanelExit<T>(
  onExit: (value: T) => void,
  reducedMotion = false,
) {
  const [leaving, setLeaving] = useState(false);
  const pending = useRef(false),
    timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const action = useRef(onExit);
  action.current = onExit;
  useEffect(() => {
    const previous = document.activeElement;
    return () => {
      clearTimeout(timer.current);
      if (
        previous instanceof HTMLElement &&
        previous.isConnected &&
        !previous.matches(":disabled") &&
        !previous.closest("[inert]") &&
        (!document.activeElement ||
          document.activeElement === document.body ||
          !document.activeElement.isConnected)
      )
        previous.focus({ preventScroll: true });
    };
  }, []);
  const exit = useCallback(
    (value: T) => {
      if (pending.current) return;
      pending.current = true;
      setLeaving(true);
      const instant =
        reducedMotion ||
        document.querySelector(".app")?.classList.contains("reduced-motion") ||
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (instant) action.current(value);
      else
        timer.current = setTimeout(() => action.current(value), PANEL_EXIT_MS);
    },
    [reducedMotion],
  );
  return { leaving, exit };
}
