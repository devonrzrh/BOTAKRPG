import type { Camera } from "@babylonjs/core/Cameras/camera";
import { PostProcess } from "@babylonjs/core/PostProcesses/postProcess";
import { ShaderStore } from "@babylonjs/core/Engines/shaderStore";
import { ShaderLanguage } from "@babylonjs/core/Materials/shaderLanguage";
import { Constants } from "@babylonjs/core/Engines/constants";
import "@babylonjs/core/Shaders/postprocess.vertex";
import "@babylonjs/core/ShadersWGSL/postprocess.vertex";
import type { TurnBlur } from "../game/turnBlur";

const name = "officeTurnBlur";
ShaderStore.ShadersStore[name + "PixelShader"] = `
varying vec2 vUV;
uniform sampler2D textureSampler;
uniform vec2 blurVector;
void main(void) {
  vec4 color=vec4(0.0);float total=0.0;
  for(int i=0;i<13;i++) {
    float t=float(i)/12.0;float weight=1.0-t*0.75;
    vec2 uv=clamp(vUV+blurVector*t,vec2(0.001),vec2(0.999));
    color+=texture2D(textureSampler,uv)*weight;total+=weight;
  }
  gl_FragColor=color/total;
}`;
ShaderStore.ShadersStoreWGSL[name + "PixelShader"] = `
varying vUV: vec2f;
var textureSamplerSampler: sampler;
var textureSampler: texture_2d<f32>;
uniform blurVector: vec2f;
@fragment
fn main(input: FragmentInputs)->FragmentOutputs {
  var color=vec4f(0.0);var total=0.0;
  for(var i:i32=0;i<13;i=i+1) {
    let t=f32(i)/12.0;let weight=1.0-t*0.75;
    let uv=clamp(input.vUV+uniforms.blurVector*t,vec2f(0.001),vec2f(0.999));
    color+=textureSampleLevel(textureSampler,textureSamplerSampler,uv,0.0)*weight;total+=weight;
  }
  fragmentOutputs.color=color/total;
}`;

export function attachTurnMotionBlur(camera: Camera) {
  const engine = camera.getScene().getEngine();
  const post = new PostProcess("Office camera turn blur", name, {
    camera,
    engine,
    size: 1,
    uniforms: ["blurVector"],
    samplingMode: Constants.TEXTURE_BILINEAR_SAMPLINGMODE,
    shaderLanguage: engine.isWebGPU ? ShaderLanguage.WGSL : ShaderLanguage.GLSL,
  });
  let vector: TurnBlur = { x: 0, y: 0, pixels: 0 },
    attached = false;
  camera.detachPostProcess(post);
  post.onApply = (effect) => effect.setFloat2("blurVector", vector.x, vector.y);
  return {
    update(next: TurnBlur) {
      vector = next;
      const enabled = next.pixels > 0 && post.isReady();
      if (enabled && !attached) {
        camera.attachPostProcess(post);
        attached = true;
      }
      if (!enabled && attached) {
        camera.detachPostProcess(post);
        attached = false;
      }
    },
    dispose() {
      camera.detachPostProcess(post);
      post.dispose(camera);
    },
  };
}
