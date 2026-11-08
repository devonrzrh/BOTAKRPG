import { mkdir, copyFile, cp } from "node:fs/promises";
const root = new URL("../", import.meta.url);
await mkdir(new URL("public/pyodide/", root), { recursive: true });
for (const [source, target] of [
  ["pyodide.js", "pyodide.js"],
  ["pyodide.asm.js", "pyodide.asm.js"],
  ["pyodide.asm.wasm", "pyodide.asm.wasm"],
  ["python_stdlib.zip", "python_stdlib.zip"],
  ["pyodide-lock.json", "pyodide-lock.json"],
]) {
  await copyFile(
    new URL(`node_modules/pyodide/${source}`, root),
    new URL(`public/pyodide/${target}`, root),
  );
}
console.log("Local Python runtime ready.");
await cp(
  new URL("node_modules/blockly/media/", root),
  new URL("public/blockly-media/", root),
  { recursive: true },
);
console.log("Local Blockly media ready.");
