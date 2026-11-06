// Adapted from References/PythonWeb: synchronous Python APIs over a shared-memory
// channel, with run identities, trace-boundary stepping, and worker replacement.
let python,
  header,
  buffer,
  runId = 0,
  callId = 0,
  started = 0,
  pausedMs = 0,
  lastLine = 0,
  outputCount = 0;
const stopped = () => {
  if (Atomics.load(header, 3) === 3) throw new Error("Execution stopped");
  if (performance.now() - started - pausedMs > 30000)
    throw new Error("Execution time limit exceeded (30 seconds)");
};
function line(number) {
  stopped();
  let control = Atomics.load(header, 3);
  if (control === 1) {
    postMessage({ type: "paused", runId, line: number });
    const before = performance.now();
    while (Atomics.load(header, 3) === 1) {
      Atomics.wait(header, 3, 1, 100);
      if (Atomics.load(header, 5) !== runId) throw new Error("Stale run");
    }
    pausedMs += performance.now() - before;
    stopped();
    control = Atomics.load(header, 3);
  }
  if (control === 2) Atomics.store(header, 3, 1);
  if (control === 2 || performance.now() - lastLine > 45) {
    postMessage({ type: "line", runId, line: number });
    lastLine = performance.now();
  }
}
function call(method, payload) {
  stopped();
  const requestId = ++callId;
  Atomics.store(header, 0, 1);
  Atomics.store(header, 1, requestId);
  postMessage({
    type: "call",
    runId,
    requestId,
    method,
    args: JSON.parse(payload),
  });
  const deadline = performance.now() + 10000;
  while (Atomics.load(header, 0) !== 2) {
    Atomics.wait(header, 0, 1, 100);
    stopped();
    if (performance.now() > deadline) throw new Error("Game command timed out");
  }
  if (
    Atomics.load(header, 5) !== runId ||
    Atomics.load(header, 1) !== requestId
  )
    throw new Error("Stale response");
  // TextDecoder rejects shared views in Chromium; copy the completed payload.
  const text = new TextDecoder().decode(
    new Uint8Array(buffer, 32, Atomics.load(header, 2)).slice(),
  );
  Atomics.store(header, 0, 0);
  return text;
}
self.onmessage = async ({ data }) => {
  if (data.type === "init") {
    buffer = data.buffer;
    header = new Int32Array(buffer, 0, 8);
    try {
      importScripts("/pyodide/pyodide.js");
      python = await loadPyodide({
        indexURL: "/pyodide/",
        stdout: (message) => {
          if (outputCount++ < 150)
            postMessage({ type: "output", runId, message });
        },
        stderr: (message) => {
          if (outputCount++ < 150)
            postMessage({ type: "output", runId, message });
        },
      });
      python.globals.set("__bridge__", { call, line });
      postMessage({ type: "ready" });
    } catch (error) {
      postMessage({ type: "load-error", message: String(error) });
    }
    return;
  }
  if (data.type !== "run" || !python) return;
  runId = data.runId;
  callId = 0;
  started = performance.now();
  pausedMs = 0;
  outputCount = 0;
  python.globals.set("__source__", data.code);
  try {
    await python.runPythonAsync(`
import sys, json
def __game_call(method, *args):
    response = json.loads(__bridge__.call(method, json.dumps(args)))
    if 'error' in response:
        raise RuntimeError(response['error'])
    return response.get('value')
def __trace(frame, event, arg):
    if frame.f_code.co_filename == '<learner>' and event == 'line':
        __bridge__.line(frame.f_lineno)
    return __trace
__environment = {'__builtins__': __builtins__}
for __name in ['position', 'goal', 'neighbors', 'move', 'can_move', 'at_goal']:
    __environment[__name] = (lambda name: lambda *args: __game_call(name, *args))(__name)
sys.settrace(__trace)
try:
    exec(compile(__source__, '<learner>', 'exec'), __environment)
finally:
    sys.settrace(None)
`);
    postMessage({ type: "finished", runId });
  } catch (error) {
    postMessage({ type: "error", runId, message: String(error) });
  }
};
