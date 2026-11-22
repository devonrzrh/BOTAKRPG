import { Constants } from "@babylonjs/core/Engines/constants";
import { GlowLayer } from "@babylonjs/core/Layers/glowLayer";
import { Color4 } from "@babylonjs/core/Maths/math.color";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { ImageProcessingPostProcess } from "@babylonjs/core/PostProcesses/imageProcessingPostProcess";
import type { Scene } from "@babylonjs/core/scene";

export function attachSceneEffects(
  scene: Scene,
  look: "office" | "network" | "battle",
  enabled: () => boolean,
) {
  let grade: ImageProcessingPostProcess | undefined;
  let glow: GlowLayer | undefined;
  let background: Color4 | undefined;
  const clear = () => {
    grade?.dispose();
    glow?.dispose();
    grade = undefined;
    glow = undefined;
    if (background) scene.clearColor = background;
    background = undefined;
    scene.imageProcessingConfiguration.vignetteEnabled = false;
    scene.imageProcessingConfiguration.contrast = 1;
  };
  scene.onBeforeRenderObservable.add(() => {
    if (enabled() === Boolean(grade)) return;
    if (grade) {
      clear();
      return;
    }
    const camera = scene.activeCamera;
    if (!camera) return;

    // Keep the vignette away from the office's wall controls and printed text.
    const office = look === "office";
    const config = scene.imageProcessingConfiguration;
    config.vignetteColor = new Color4(0.32, 0.43, 0.53, 0);
    config.vignetteWeight = office ? 1.05 : 1.55;
    config.vignetteStretch = office ? 0.7 : 0.4;
    config.vignetteCenterY = look === "battle" ? 0.15 : 0;
    config.vignetteEnabled = true;
    config.contrast = office ? 1 : 1.04;
    // Clear colors bypass the material shaders that convert the frame to linear space.
    background = scene.clearColor;
    scene.clearColor = background.toLinearSpace();
    const engine = scene.getEngine();
    const textureType = engine.getCaps().textureHalfFloatRender
      ? Constants.TEXTURETYPE_HALF_FLOAT
      : Constants.TEXTURETYPE_UNSIGNED_BYTE;
    grade = new ImageProcessingPostProcess(
      "scene grade",
      1,
      camera,
      undefined,
      engine,
      false,
      textureType,
    );
    if (!office) {
      glow = new GlowLayer("signal bloom", scene, {
        mainTextureRatio: 0.35,
        blurKernelSize: 28,
      });
      glow.intensity = look === "battle" ? 0.55 : 0.35;
      for (const mesh of scene.meshes) {
        if (mesh instanceof Mesh && mesh.name.startsWith("sign-")) {
          glow.addExcludedMesh(mesh);
        }
      }
    }
  });
  scene.onDisposeObservable.addOnce(clear);
}
