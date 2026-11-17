import {
  createContext,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type HTMLAttributes,
} from "react";
import "./SceneTransition.css";

const SceneTransitioning = createContext(false);
export const useSceneTransitioning = () => useContext(SceneTransitioning);

const battleCloseMs = 230;
const battleOpenMs = 380;

/** Cover the departing scene before swapping in the latest destination. */
export function SceneTransition({
  sceneKey,
  battleEntry = false,
  reducedMotion,
  children,
  ...surfaceProps
}: {
  sceneKey: string;
  battleEntry?: boolean;
  reducedMotion: boolean;
  children: ReactNode;
} & HTMLAttributes<HTMLElement>) {
  const [displayed, setDisplayed] = useState(sceneKey);
  const [reveal, setReveal] = useState<"fade" | "battle" | null>(null);
  const [osReduced, setOsReduced] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  const previous = useRef(children);
  const leaving = displayed !== sceneKey;
  const instant = reducedMotion || osReduced;
  const transitioning = !instant && (leaving || reveal !== null);
  const battleCurtain = leaving ? battleEntry : reveal === "battle";
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
    setReveal(null);
    if (instant) {
      setDisplayed(sceneKey);
      return;
    }
    const timer = window.setTimeout(
      () => {
        setDisplayed(sceneKey);
        setReveal(battleEntry ? "battle" : "fade");
      },
      battleEntry ? battleCloseMs : 140,
    );
    return () => window.clearTimeout(timer);
  }, [sceneKey, leaving, instant, battleEntry]);
  useLayoutEffect(() => {
    if (!reveal) return;
    if (instant) {
      setReveal(null);
      return;
    }
    const timer = window.setTimeout(
      () => setReveal(null),
      reveal === "battle" ? battleOpenMs : 300,
    );
    return () => window.clearTimeout(timer);
  }, [reveal, instant]);
  useLayoutEffect(() => {
    if (!transitioning) return;
    // Inert blocks pointer/focus; also stop window-level movement shortcuts.
    const block = (event: KeyboardEvent) => {
      if (event.target instanceof Element && event.target.closest(".topbar"))
        return;
      event.preventDefault();
      event.stopImmediatePropagation();
    };
    window.addEventListener("keydown", block, true);
    return () => window.removeEventListener("keydown", block, true);
  }, [transitioning]);
  return (
    <main {...surfaceProps}>
      <div
        className="scene-content"
        inert={!instant && transitioning}
      >
        <SceneTransitioning.Provider value={transitioning}>
          {leaving && !instant ? previous.current : children}
        </SceneTransitioning.Provider>
      </div>
      {transitioning && (
        <div
          key={`${displayed}-${leaving}-${battleCurtain}`}
          className={`scene-curtain ${leaving ? "scene-departing" : "scene-arriving"}${battleCurtain ? " battle-entry-curtain" : ""}`}
          style={
            battleCurtain
              ? ({
                  "--battle-curtain-duration": `${leaving ? battleCloseMs : battleOpenMs}ms`,
                } as CSSProperties)
              : undefined
          }
          aria-hidden="true"
        >
          {battleCurtain && <span className="battle-entry-reticle" />}
        </div>
      )}
    </main>
  );
}
