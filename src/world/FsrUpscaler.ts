import type { Camera } from "@babylonjs/core/Cameras/camera";
import { ShaderStore } from "@babylonjs/core/Engines/shaderStore";
import { ShaderLanguage } from "@babylonjs/core/Materials/shaderLanguage";
import { PostProcess } from "@babylonjs/core/PostProcesses/postProcess";
import { fsrShaders } from "./FsrShaders";

export const FSR_RENDER_SCALE = 1 / 1.3;

export function attachFsrUpscaler(camera: Camera, receivesGeometry: boolean) {
  const engine = camera.getScene().getEngine();
  const wgsl = engine.isWebGPU;
  const store = wgsl ? ShaderStore.ShadersStoreWGSL : ShaderStore.ShadersStore;
  if (!store.fsrEasuPixelShader) {
    const shaders = fsrShaders(wgsl);
    store.fsrEasuPixelShader = shaders.easu;
    store.fsrRcasPixelShader = shaders.rcas;
  }
  const createPass = (name: string, size: number) => {
    const pass = new PostProcess(name, name, {
      camera,
      size,
      uniforms: ["inputSize"],
      shaderLanguage: wgsl ? ShaderLanguage.WGSL : ShaderLanguage.GLSL,
    });
    pass.onApply = (effect) => {
      effect.setFloat2(
        "inputSize",
        pass.inputTexture.width,
        pass.inputTexture.height,
      );
    };
    return pass;
  };
  const easu = createPass("fsrEasu", FSR_RENDER_SCALE);
  if (receivesGeometry) easu.samples = 4;
  const rcas = createPass("fsrRcas", 1);
  return () => {
    rcas.dispose();
    easu.dispose();
  };
}
