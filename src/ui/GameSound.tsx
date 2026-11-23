import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { createSoundManager, type SfxName } from "../game/soundManager";

const SoundContext = createContext({
  play: (_name: SfxName): (() => void) | undefined => undefined,
  setVolume: (_volume: number) => {},
});

export function GameSoundProvider({ children }: { children: ReactNode }) {
  const engine = useRef<ReturnType<typeof createSoundManager> | null>(null);
  const volume = useRef(0.65);
  const play = useCallback((name: SfxName) => engine.current?.play(name), []);
  const setVolume = useCallback((next: number) => {
    volume.current = next;
    engine.current?.setVolume(next);
  }, []);
  useEffect(() => {
    const audio = createSoundManager();
    engine.current = audio;
    audio.setVolume(volume.current);
    const unlock = () => audio.unlock();
    const click = (event: MouseEvent) => {
      const target =
        event.target instanceof Element
          ? event.target.closest("button,a,summary")
          : null;
      if (
        !target?.closest(".app") ||
        target.closest("[data-sfx-silent]") ||
        target.matches(":disabled,[aria-disabled=true]")
      )
        return;
      audio.play("click");
    };
    const hover = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const target = event.target instanceof Element
        ? event.target.closest("button,a,summary")
        : null;
      if (
        !target?.closest(".app") ||
        target.closest("[data-sfx-silent]") ||
        target.matches(":disabled,[aria-disabled=true]") ||
        (event.relatedTarget instanceof Node && target.contains(event.relatedTarget))
      ) return;
      audio.play("hover");
    };
    document.addEventListener("pointerdown", unlock, true);
    document.addEventListener("keydown", unlock, true);
    document.addEventListener("click", click, true);
    document.addEventListener("pointerover", hover, true);
    return () => {
      document.removeEventListener("pointerdown", unlock, true);
      document.removeEventListener("keydown", unlock, true);
      document.removeEventListener("click", click, true);
      document.removeEventListener("pointerover", hover, true);
      audio.dispose();
      engine.current = null;
    };
  }, []);
  const value = useMemo(() => ({ play, setVolume }), [play, setVolume]);
  return (
    <SoundContext.Provider value={value}>{children}</SoundContext.Provider>
  );
}

export const useGameSound = () => useContext(SoundContext).play;
export const useGameSoundVolume = () => useContext(SoundContext).setVolume;
