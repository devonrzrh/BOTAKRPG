import type { PointLight } from "@babylonjs/core/Lights/pointLight";
import { ShadowGenerator } from "@babylonjs/core/Lights/Shadows/shadowGenerator";
import "@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent";
import type { AbstractMesh } from "@babylonjs/core/Meshes/abstractMesh";
import type { Vector3 } from "@babylonjs/core/Maths/math.vector";

export function attachSoftShadows(
  light: PointLight,
  direction: Vector3,
  casters: readonly AbstractMesh[],
  receivers: readonly AbstractMesh[],
  enabled: () => boolean,
  staticCasters = false,
) {
  let generator: ShadowGenerator | undefined;
  const scene = light.getScene();
  scene.onBeforeRenderObservable.add(() => {
    if (enabled() === Boolean(generator)) return;
    if (generator) {
      generator.dispose();
      generator = undefined;
      for (const mesh of receivers) mesh.receiveShadows = false;
      return;
    }

    // A direction limits the point light's shadows to one map instead of a cubemap.
    light.direction = direction;
    light.shadowAngle = Math.PI * 0.7;
    light.shadowMinZ = 0.2;
    light.shadowMaxZ = 14;
    generator = new ShadowGenerator(512, light);
    generator.usePercentageCloserFiltering = true;
    generator.bias = 0.001;
    generator.setDarkness(0.25);
    for (const mesh of casters) generator.addShadowCaster(mesh, false);
    for (const mesh of receivers) mesh.receiveShadows = true;
    const map = generator.getShadowMap();
    if (staticCasters && map) map.refreshRate = 0;
  });
}
