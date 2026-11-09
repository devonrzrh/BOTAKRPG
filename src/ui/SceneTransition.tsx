import {
  createContext,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type HTMLAttributes,
} from "react";
import "./SceneTransition.css";

const SceneLeaving = createContext(false);
export const useSceneLeaving = () => useContext(SceneLeaving);

/** Hold the departing scene through a short fade, then reveal the latest destination. */
export function SceneTransition({
  sceneKey,
  reducedMotion,
  children,
  ...surfaceProps
}: {
  sceneKey: string;
  reducedMotion: boolean;
  children: ReactNode;
} & HTMLAttributes<HTMLElement>) {
  const [displayed, setDisplayed] = useState(sceneKey);
  const [revealing, setRevealing] = useState(false);
  const [osReduced, setOsReduced] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const previous = useRef(children);
  const leaving = displayed !== sceneKey;
  const instant = reducedMotion || osReduced;
  useLayoutEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const change = () => setOsReduced(query.matches);
    query.addEventListener("change", change);
    return () => query.removeEventListener("change", change);
  }, []);
  useLayoutEffect(() => {
    if (!leaving) previous.current = children;
  }, [children, leaving]);
  useLayoutEffect(() => {
    if (!leaving) return;
    if (instant) {
      setDisplayed(sceneKey);
      setRevealing(false);
      return;
    }
    const timer = window.setTimeout(() => {
      setDisplayed(sceneKey);
      setRevealing(true);
    }, 140);
    return () => window.clearTimeout(timer);
  }, [sceneKey, leaving, instant]);
  useLayoutEffect(() => {
    if (!revealing) return;
    if (instant) {
      setRevealing(false);
      return;
    }
    const timer = window.setTimeout(() => setRevealing(false), 300);
    return () => window.clearTimeout(timer);
  }, [revealing, displayed, instant]);
  useLayoutEffect(() => {
    if ((!leaving && !revealing) || instant) return;
    // Inert blocks pointer/focus; also stop window-level movement shortcuts.
    const block = (event: KeyboardEvent) => {
      if (event.target instanceof Element && event.target.closest(".topbar"))
        return;
      event.preventDefault();
      event.stopImmediatePropagation();
    };
    window.addEventListener("keydown", block, true);
    return () => window.removeEventListener("keydown", block, true);
  }, [leaving, revealing, instant]);
  return (
    <main {...surfaceProps}>
      <div className="scene-content" inert={!instant && leaving}>
        <SceneLeaving.Provider value={leaving}>
          {leaving && !instant ? previous.current : children}
        </SceneLeaving.Provider>
      </div>
      {!instant && (leaving || revealing) && (
        <div
          key={`${displayed}-${leaving}`}
          className={`scene-curtain ${leaving ? "scene-departing" : "scene-arriving"}`}
          aria-hidden="true"
        />
      )}
    </main>
  );
}
