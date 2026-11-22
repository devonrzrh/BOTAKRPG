// Adapted from AMD FidelityFX FSR 1.0.2, ffx-fsr/ffx_fsr1.h.
// Copyright (c) 2021 Advanced Micro Devices, Inc. All rights reserved.
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

export function fsrShaders(wgsl: boolean) {
  const types = wgsl
    ? { float: "f32", vec2: "vec2f", vec3: "vec3f", vec4: "vec4f" }
    : { float: "float", vec2: "vec2", vec3: "vec3", vec4: "vec4" };
  // Share the FSR math across backends. Only declarations and texture I/O differ.
  const syntax = (code: string) =>
    code
      .replace(/\b(float|vec[234]) (\w+) =/g, (_, type, name) =>
        wgsl ? `var ${name}: ${type} =` : `${type} ${name} =`,
      )
      .replace(
        /\b(float|vec[234])\b/g,
        (type) => types[type as keyof typeof types],
      );
  const fn = (result: string, name: string, args: string, body: string) => {
    const parameters = wgsl
      ? args.replace(/(float|vec[234]) (\w+)/g, "$2: $1")
      : args;
    return syntax(
      wgsl
        ? `fn ${name}(${parameters}) -> ${result} {${body}}`
        : `${result} ${name}(${parameters}) {${body}}`,
    );
  };
  const header = wgsl
    ? `
    varying vUV: vec2f;
    uniform inputSize: vec2f;
    var textureSamplerSampler: sampler;
    var textureSampler: texture_2d<f32>;
  `
    : `
    precision highp float;
    varying vec2 vUV;
    uniform vec2 inputSize;
    uniform sampler2D textureSampler;
  `;
  const read = fn(
    "vec3",
    "readColor",
    "vec2 pixel",
    wgsl
      ? `
    return textureSampleLevel(textureSampler, textureSamplerSampler,
      (pixel + vec2(0.5)) / uniforms.inputSize, 0.0).rgb;
  `
      : `
    return texture2D(textureSampler, (pixel + vec2(0.5)) / inputSize).rgb;
  `,
  );
  const main = (filter: string) =>
    wgsl
      ? `
    @fragment fn main(input: FragmentInputs) -> FragmentOutputs {
      fragmentOutputs.color = vec4f(${filter}(input.vUV * uniforms.inputSize), 1.0);
    }
  `
      : `
    void main() { gl_FragColor = vec4(${filter}(vUV * inputSize), 1.0); }
  `;

  const taps = [
    ["b", 0, -1],
    ["c", 1, -1],
    ["e", -1, 0],
    ["f", 0, 0],
    ["g", 1, 0],
    ["h", 2, 0],
    ["i", -1, 1],
    ["j", 0, 1],
    ["k", 1, 1],
    ["l", 2, 1],
    ["n", 0, 2],
    ["o", 1, 2],
  ] as const;
  const offset = (x: number, y: number) => `vec2(${x}.0, ${y}.0)`;
  const luma = fn(
    "float",
    "luma",
    "vec3 color",
    `
    return dot(color, vec3(0.5, 1.0, 0.5));
  `,
  );
  const gradient = fn(
    "vec3",
    "gradient",
    "float a, float b, float c, float d, float e",
    `
    vec2 dir = vec2(d - b, e - a);
    vec2 peak = max(abs(vec2(d - c, e - c)), abs(vec2(c - b, c - a)));
    vec2 slope = clamp(abs(dir) / max(peak, vec2(0.000001)), vec2(0.0), vec2(1.0));
    return vec3(dir, dot(slope, slope));
  `,
  );
  const weight = fn(
    "float",
    "tapWeight",
    "vec2 offset, vec2 dir, vec2 stretch, float lobe",
    `
    vec2 delta = vec2(dot(offset, dir), dot(offset, vec2(-dir.y, dir.x))) * stretch;
    float distance2 = min(dot(delta, delta), 1.0 / lobe);
    float base = 0.4 * distance2 - 1.0;
    float windowWeight = lobe * distance2 - 1.0;
    return (1.5625 * base * base - 0.5625) * windowWeight * windowWeight;
  `,
  );
  const easu = fn(
    "vec3",
    "upscale",
    "vec2 pixel",
    `
    vec2 base = floor(pixel - vec2(0.5));
    vec2 fraction = fract(pixel - vec2(0.5));
    vec2 inverse = vec2(1.0) - fraction;
    ${taps.map(([tap, x, y]) => `vec3 ${tap} = readColor(base + ${offset(x, y)});`).join("\n")}
    vec3 edge = gradient(luma(b), luma(e), luma(f), luma(g), luma(j)) * inverse.x * inverse.y
              + gradient(luma(c), luma(f), luma(g), luma(h), luma(k)) * fraction.x * inverse.y
              + gradient(luma(f), luma(i), luma(j), luma(k), luma(n)) * inverse.x * fraction.y
              + gradient(luma(g), luma(j), luma(k), luma(l), luma(o)) * fraction.x * fraction.y;
    vec2 dir = edge.xy;
    if (dot(dir, dir) < 0.000030517578125) {
      dir = vec2(1.0, 0.0);
    }
    dir = normalize(dir);
    float strength = edge.z * edge.z * 0.25;
    float diagonal = 1.0 / max(abs(dir.x), abs(dir.y));
    vec2 stretch = vec2(1.0 + (diagonal - 1.0) * strength, 1.0 - 0.5 * strength);
    float lobe = 0.5 - 0.29 * strength;
    vec4 sum = vec4(0.0);
    ${taps
      .map(
        ([tap, x, y]) =>
          `sum += vec4(${tap}, 1.0) * tapWeight(${offset(x, y)} - fraction, dir, stretch, lobe);`,
      )
      .join("\n")}
    return clamp(sum.rgb / sum.a, min(min(f, g), min(j, k)), max(max(f, g), max(j, k)));
  `,
  );
  const rcas = fn(
    "vec3",
    "sharpen",
    "vec2 pixel",
    `
    vec2 center = floor(pixel);
    vec3 e = readColor(center);
    vec3 b = readColor(center + vec2(0.0, -1.0));
    vec3 d = readColor(center + vec2(-1.0, 0.0));
    vec3 f = readColor(center + vec2(1.0, 0.0));
    vec3 h = readColor(center + vec2(0.0, 1.0));
    vec3 low = min(min(b, d), min(f, h));
    vec3 high = max(max(b, d), max(f, h));
    vec3 hitMin = min(low, e) / max(4.0 * high, vec3(0.000001));
    vec3 hitMax = (vec3(1.0) - max(high, e)) / min(4.0 * low - vec3(4.0), vec3(-0.000001));
    vec3 limit = max(-hitMin, hitMax);
    float lobe = clamp(max(limit.r, max(limit.g, limit.b)), -0.1875, 0.0) * 0.5;
    return clamp((lobe * (b + d + f + h) + e) / (4.0 * lobe + 1.0), vec3(0.0), vec3(1.0));
  `,
  );
  return {
    easu: header + read + luma + gradient + weight + easu + main("upscale"),
    rcas: header + read + rcas + main("sharpen"),
  };
}
