import { useEffect, useRef, useState } from "react";
import { Camera } from "@babylonjs/core/Cameras/camera";
import { UniversalCamera } from "@babylonjs/core/Cameras/universalCamera";
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
import { PointLight } from "@babylonjs/core/Lights/pointLight";
import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Scene } from "@babylonjs/core/scene";
import { attachSoftShadows } from "./SoftShadows";
import type { RendererPreference } from "../game/contracts";
import { buildSupplyCrate } from "./SupplyCrate";
import { crateLidAngle, crateOpeningMs } from "../game/supplyCratePresentation";
import { openWorldEngine } from "./WorldEngine";
import "@babylonjs/core/Engines/Extensions/engine.dynamicTexture";
import "@babylonjs/core/Engines/WebGPU/Extensions/engine.dynamicTexture";

type Props = {
  renderer: RendererPreference;
  openingAt?: number;
  reseal: boolean;
  opened: boolean;
  shadows: boolean;
};

export default function SupplyCrateCanvas(props: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const latest = useRef(props);
  latest.current = props;
  const [ready, setReady] = useState(false);
  const { renderer } = props;

  useEffect(() => {
    const surface = canvas.current!;
    const startup = new AbortController();
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let dispose: (() => void) | undefined;
    void openWorldEngine(surface, renderer, startup.signal)
      .then(({ engine }) => {
        if (startup.signal.aborted) {
          engine.dispose();
          return;
        }
        const scene = new Scene(engine);
        let dirty = true;
        const resize = new ResizeObserver(() => {
          engine.resize();
          dirty = true;
        });
        dispose = () => {
          dispose = undefined;
          resize.disconnect();
          engine.stopRenderLoop();
          scene.dispose();
          engine.dispose();
        };
        scene.clearColor = new Color4(0.052, 0.085, 0.092, 1);
        const camera = new UniversalCamera(
          "supply box close-up",
          new Vector3(2.4, 2.7, -4.4),
          scene,
        );
        camera.mode = Camera.ORTHOGRAPHIC_CAMERA;
        camera.setTarget(new Vector3(0, 0.74, 0));
        camera.minZ = 0.05;
        camera.maxZ = 35;
        scene.activeCamera = camera;
        const ambient = new HemisphericLight("case fill", Vector3.Up(), scene);
        ambient.intensity = 0.52;
        ambient.diffuse = Color3.FromHexString("#c3d4d5");
        const key = new PointLight(
          "warm work light",
          new Vector3(-2.5, 4, -2.8),
          scene,
        );
        key.diffuse = Color3.FromHexString("#ffd6a4");
        key.intensity = 1.6;
        const rim = new PointLight(
          "cool rim light",
          new Vector3(1.8, 3.3, 2.8),
          scene,
        );
        rim.diffuse = Color3.FromHexString("#89c9d5");
        rim.intensity = 1.3;
        const bench = MeshBuilder.CreateGround(
          "supply bench",
          { width: 24, height: 24 },
          scene,
        );
        const benchMaterial = new StandardMaterial("bench finish", scene);
        benchMaterial.diffuseColor = Color3.FromHexString("#1e3033");
        benchMaterial.specularColor.setAll(0.025);
        bench.material = benchMaterial;
        const crate = buildSupplyCrate(scene);
        attachSoftShadows(
          key,
          new Vector3(0.5, -1, 0.4),
          [crate.base],
          [bench],
          () => latest.current.shadows,
          true,
        );
        let angle = -1;
        let rendered = false;
        let primed = false;
        let shadows = latest.current.shadows;
        engine.onContextLostObservable.add(() => {
          if (!startup.signal.aborted) setReady(false);
        });
        engine.onContextRestoredObservable.add(() => {
          rendered = false;
          primed = false;
          dirty = true;
        });
        const render = () => {
          const { openingAt, opened, reseal } = latest.current;
          const progress =
            openingAt === undefined
              ? Number(opened)
              : reduceMotion.matches
                ? 1
                : (performance.now() - openingAt) / crateOpeningMs;
          const next = crateLidAngle(progress, reseal);
          if (
            rendered &&
            next === angle &&
            !dirty &&
            shadows === latest.current.shadows
          )
            return;
          try {
            shadows = latest.current.shadows;
            if (dirty) {
              const aspect = engine.getAspectRatio(camera);
              const halfHeight = Math.max(1.11, 1.26 / aspect);
              camera.orthoTop = halfHeight;
              camera.orthoBottom = -halfHeight;
              camera.orthoRight = halfHeight * aspect;
              camera.orthoLeft = -halfHeight * aspect;
              dirty = false;
            }
            angle = next;
            crate.hinge.rotation.x = angle;
            const firstFrame = primed && !rendered && scene.isReady();
            scene.render();
            primed = true;
            if (firstFrame) {
              rendered = true;
              setReady(true);
            }
          } catch {
            engine.stopRenderLoop(render);
            setReady(false);
          }
        };
        resize.observe(surface);
        engine.runRenderLoop(render);
      })
      .catch(() => dispose?.());
    return () => {
      startup.abort();
      dispose?.();
    };
  }, [renderer]);

  return (
    <canvas ref={canvas} className="supply-crate-canvas" data-ready={ready} />
  );
}
