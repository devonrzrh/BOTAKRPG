import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import { createSfx, type SfxName } from "../game/sfx";

const SoundContext = createContext({
  play: (_name: SfxName) => {},
  setVolume: (_volume: number) => {},
});

export function GameSoundProvider({ children }: { children: ReactNode }) {
  const engine = useRef<ReturnType<typeof createSfx> | null>(null);
  const volume = useRef(0.65);
  const play = useCallback((name: SfxName) => engine.current?.play(name), []);
  const setVolume = useCallback((next: number) => {
    volume.current = next;
    engine.current?.setVolume(next);
  }, []);
  useEffect(() => {
    const audio = createSfx();
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
    document.addEventListener("pointerdown", unlock, true);
    document.addEventListener("keydown", unlock, true);
    document.addEventListener("click", click, true);
    return () => {
      document.removeEventListener("pointerdown", unlock, true);
      document.removeEventListener("keydown", unlock, true);
      document.removeEventListener("click", click, true);
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
