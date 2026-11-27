import { useEffect, useRef, useState, type RefObject } from "react";
import type { AbstractEngine } from "@babylonjs/core/Engines/abstractEngine";
import { Scene } from "@babylonjs/core/scene";
import "@babylonjs/core/Engines/Extensions/engine.dynamicTexture";
import "@babylonjs/core/Engines/WebGPU/Extensions/engine.dynamicTexture";
import type { RendererPreference } from "../game/contracts";
import { buildCinematicStage, cinematicShots } from "./CinematicStage";
import { openWorldEngine } from "./WorldEngine";

export default function CinematicCanvas({
  shot,
  renderer,
  elapsed,
  readyShot,
}: {
  shot: string;
  renderer: RendererPreference;
  elapsed: RefObject<number>;
  readyShot: RefObject<string | null>;
}) {
  const surface = useRef<HTMLCanvasElement>(null);
  const [engine, setEngine] = useState<AbstractEngine | null>(null);
  const [visibleShot, setVisibleShot] = useState<string | null>(null);

  useEffect(() => {
    const startup = new AbortController();
    const canvas = surface.current!;
    let activeEngine: AbstractEngine | undefined;
    const resize = new ResizeObserver(() => activeEngine?.resize());
    void openWorldEngine(canvas, renderer, startup.signal)
      .then(({ engine }) => {
        if (startup.signal.aborted) {
          engine.dispose();
          return;
        }
        activeEngine = engine;
        resize.observe(canvas);
        setEngine(engine);
      })
      .catch(() => {
        // The shot's illustration remains visible if initialization fails.
      });
    return () => {
      startup.abort();
      resize.disconnect();
      activeEngine?.dispose();
    };
  }, [renderer]);

  useEffect(() => {
    readyShot.current = null;
    setVisibleShot(null);
    if (!engine || !cinematicShots.includes(shot)) return;
    const scene = new Scene(engine);
    let render: (() => void) | undefined;
    let lastTime = -1;
    let lastWidth = 0;
    let lastHeight = 0;
    const restored = engine.onContextRestoredObservable.add(() => {
      lastTime = -1;
    });
    try {
      const pose = buildCinematicStage(scene, shot);
      let rendered = false;
      render = () => {
        try {
          const time = elapsed.current;
          const width = engine.getRenderWidth();
          const height = engine.getRenderHeight();
          if (
            rendered &&
            time === lastTime &&
            width === lastWidth &&
            height === lastHeight
          )
            return;
          lastTime = time;
          lastWidth = width;
          lastHeight = height;
          pose(time / 1000);
          // Wait for a frame drawn with every material ready before hiding the poster.
          const ready = !rendered && scene.isReady();
          scene.render();
          if (ready) {
            rendered = true;
            readyShot.current = shot;
            setVisibleShot(shot);
          }
        } catch {
          engine.stopRenderLoop(render);
          setVisibleShot(null);
        }
      };
      engine.runRenderLoop(render);
    } catch {
      engine.onContextRestoredObservable.remove(restored);
      scene.dispose();
      return;
    }
    return () => {
      engine.stopRenderLoop(render);
      engine.onContextRestoredObservable.remove(restored);
      if (!scene.isDisposed) scene.dispose();
    };
  }, [elapsed, engine, readyShot, shot]);

  return (
    <canvas
      ref={surface}
      className="cutscene-canvas"
      data-visible={visibleShot === shot}
      aria-hidden="true"
    />
  );
}
