import { Engine } from "@babylonjs/core/Engines/engine";
import { WebGPUEngine } from "@babylonjs/core/Engines/webgpuEngine";
import type { RendererPreference } from "../game/contracts";

export async function openWorldEngine(
  canvas: HTMLCanvasElement,
  renderer: RendererPreference,
  signal: AbortSignal,
) {
  let notice = "";
  if (renderer !== "webgl") {
    let gpu: WebGPUEngine | undefined;
    try {
      const supported = await WebGPUEngine.IsSupportedAsync;
      signal.throwIfAborted();
      if (supported) {
        gpu = new WebGPUEngine(canvas, { antialias: true });
        await gpu.initAsync();
        signal.throwIfAborted();
        return { engine: gpu, notice };
      }
      if (renderer === "webgpu")
        notice = "WebGPU is unavailable here. Using WebGL2.";
    } catch {
      gpu?.dispose();
      signal.throwIfAborted();
      notice = "WebGPU initialization failed. Using WebGL2.";
    }
  }
  signal.throwIfAborted();
  const engine = new Engine(canvas, true, {
    preserveDrawingBuffer: true,
    stencil: true,
    disableWebGL2Support: false,
  });
  if (engine.webGLVersion < 2) {
    engine.dispose();
    throw new Error("WebGL2 or WebGPU is required.");
  }
  return { engine, notice };
}
