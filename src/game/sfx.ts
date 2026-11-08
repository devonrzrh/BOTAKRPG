import type { EvadeState } from "./evade";

export type SfxName =
  | "click"
  | "open"
  | "close"
  | "page"
  | "bookOpen"
  | "bookClose"
  | "move"
  | "blocked"
  | "puzzleAction"
  | "success"
  | "error"
  | "clue"
  | "levelUp"
  | "dialogue"
  | "connect"
  | "pursuit"
  | "train"
  | "scan"
  | "hazard"
  | "dodge"
  | "hit";

type Voice = {
  sources: AudioScheduledSourceNode[];
  nodes: AudioNode[];
  ended: number;
};
type AudioContextConstructor = new () => AudioContext;

/** Use crossings rather than elapsed-time windows so each lane sounds once. */
export function evadeSoundCues(
  before: EvadeState,
  after: EvadeState,
): SfxName[] {
  return after.hazards.flatMap((hazard, index): SfxName[] => {
    const previous = before.hazards[index];
    if (hazard.resolved && !previous.resolved)
      return [hazard.hit ? "hit" : "dodge"];
    if (
      !hazard.resolved &&
      before.elapsed < hazard.at - 0.3 &&
      after.elapsed >= hazard.at - 0.3
    )
      return ["hazard"];
    return [];
  });
}

const MAX_VOICES = 12;
const COOLDOWNS: Record<SfxName, number> = {
  click: 45,
  open: 110,
  close: 110,
  page: 120,
  bookOpen: 180,
  bookClose: 180,
  move: 100,
  blocked: 120,
  puzzleAction: 80,
  success: 180,
  error: 130,
  clue: 220,
  levelUp: 300,
  dialogue: 90,
  connect: 250,
  pursuit: 120,
  train: 180,
  scan: 180,
  hazard: 180,
  dodge: 180,
  hit: 180,
};

/** Original, asset-free interface and discovery sounds. AudioContext starts only after unlock(). */
export function createSfx() {
  let context: AudioContext | null = null;
  let master: GainNode | null = null;
  let volume = 0.65;
  let disposed = false;
  let resumePending: Promise<void> | null = null;
  let queued: SfxName | null = null;
  let noiseBuffer: AudioBuffer | null = null;
  const voices = new Set<Voice>();
  const lastPlayed = new Map<SfxName, number>();

  const disconnectVoice = (voice: Voice) => {
    if (!voices.delete(voice)) return;
    for (const node of [...voice.sources, ...voice.nodes]) {
      try {
        node.disconnect();
      } catch {
        /* already disconnected */
      }
    }
  };
  const cancelAll = () => {
    queued = null;
    for (const voice of [...voices]) {
      for (const source of voice.sources) {
        try {
          source.stop();
        } catch {
          /* may have ended */
        }
      }
      disconnectVoice(voice);
    }
  };

  const render = (name: SfxName) => {
    const ctx = context;
    if (!ctx || !master || disposed || volume <= 0 || ctx.state !== "running")
      return;
    const nowMs =
      typeof performance !== "undefined" ? performance.now() : Date.now();
    if (nowMs - (lastPlayed.get(name) ?? -Infinity) < COOLDOWNS[name]) return;
    lastPlayed.set(name, nowMs);
    if (voices.size >= MAX_VOICES) {
      const oldest = voices.values().next().value!;
      for (const source of oldest.sources) {
        try {
          source.stop();
        } catch {
          /* may have ended */
        }
      }
      disconnectVoice(oldest);
    }

    const voice: Voice = { sources: [], nodes: [], ended: 0 };
    voices.add(voice);
    const tone = (
      start: number,
      end: number,
      duration: number,
      type: OscillatorType,
      level: number,
      offset = 0,
    ) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const startAt = ctx.currentTime + offset;
      osc.type = type;
      osc.frequency.setValueAtTime(start, startAt);
      if (end !== start)
        osc.frequency.exponentialRampToValueAtTime(end, startAt + duration);
      gain.gain.setValueAtTime(0.0001, startAt);
      gain.gain.exponentialRampToValueAtTime(
        level,
        startAt + Math.min(0.009, duration / 3),
      );
      gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
      osc.connect(gain);
      gain.connect(master!);
      voice.sources.push(osc);
      voice.nodes.push(gain);
      osc.onended = () => {
        if (++voice.ended >= voice.sources.length) disconnectVoice(voice);
      };
      osc.start(startAt);
      osc.stop(startAt + duration + 0.015);
    };
    const noise = (duration: number, level: number, offset = 0) => {
      try {
        if (!noiseBuffer) {
          noiseBuffer = ctx.createBuffer(
            1,
            Math.ceil(ctx.sampleRate * 0.18),
            ctx.sampleRate,
          );
          const data = noiseBuffer.getChannelData(0);
          for (let i = 0; i < data.length; i++)
            data[i] = (Math.random() * 2 - 1) * (1 - (i / data.length) * 0.4);
        }
        const source = ctx.createBufferSource();
        const filter = ctx.createBiquadFilter();
        const gain = ctx.createGain();
        const at = ctx.currentTime + offset;
        source.buffer = noiseBuffer;
        filter.type = "highpass";
        filter.frequency.setValueAtTime(450, at);
        gain.gain.setValueAtTime(level, at);
        gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
        source.connect(filter);
        filter.connect(gain);
        gain.connect(master!);
        voice.sources.push(source);
        voice.nodes.push(filter, gain);
        source.onended = () => {
          if (++voice.ended >= voice.sources.length) disconnectVoice(voice);
        };
        source.start(at);
        source.stop(at + duration + 0.015);
      } catch {
        /* Audio support can disappear after unlock. */
      }
    };
    try {
      switch (name) {
        case "click":
          tone(1250, 850, 0.025, "triangle", 0.035);
          break;
        case "open":
          tone(380, 720, 0.11, "sine", 0.045);
          tone(620, 980, 0.055, "triangle", 0.012, 0.045);
          break;
        case "close":
          tone(700, 320, 0.1, "sine", 0.04);
          break;
        case "page":
          noise(0.105, 0.045);
          tone(240, 160, 0.07, "triangle", 0.009);
          break;
        case "bookOpen":
          noise(0.16, 0.055);
          tone(180, 390, 0.19, "sine", 0.025);
          tone(270, 350, 0.15, "triangle", 0.012, 0.07);
          break;
        case "bookClose":
          noise(0.12, 0.045);
          tone(330, 145, 0.14, "sine", 0.03);
          break;
        case "move":
          noise(0.035, 0.018);
          tone(95, 65, 0.045, "triangle", 0.012);
          break;
        case "blocked":
          tone(170, 112, 0.13, "square", 0.025);
          break;
        case "puzzleAction":
          tone(520, 690, 0.065, "triangle", 0.026);
          tone(1040, 930, 0.035, "sine", 0.008, 0.025);
          break;
        case "success":
          tone(520, 780, 0.12, "sine", 0.04);
          tone(780, 1040, 0.16, "sine", 0.035, 0.09);
          break;
        case "error":
          tone(260, 155, 0.16, "sawtooth", 0.025);
          noise(0.065, 0.012);
          break;
        case "clue":
          tone(660, 880, 0.18, "sine", 0.032);
          tone(990, 1320, 0.22, "sine", 0.025, 0.08);
          tone(1480, 1480, 0.19, "sine", 0.014, 0.18);
          break;
        case "levelUp":
          tone(440, 660, 0.22, "sine", 0.035);
          tone(660, 880, 0.24, "sine", 0.032, 0.12);
          tone(880, 1320, 0.28, "sine", 0.03, 0.25);
          break;
        case "dialogue":
          tone(540, 470, 0.035, "sine", 0.012);
          break;
        case "connect":
          // A modem-like handshake, ending in a settled carrier tone.
          tone(220, 880, 0.24, "triangle", 0.025);
          tone(1320, 660, 0.13, "sine", 0.018, 0.12);
          tone(880, 880, 0.2, "sine", 0.022, 0.26);
          noise(0.14, 0.015);
          break;
        case "pursuit":
          // Paired wet footsteps, distinct from quiet indoor movement.
          noise(0.07, 0.045);
          tone(120, 55, 0.09, "triangle", 0.035);
          noise(0.06, 0.032, 0.13);
          tone(100, 48, 0.08, "triangle", 0.025, 0.13);
          break;
        case "train":
          [330, 440, 550, 660].forEach((pitch, i) =>
            tone(pitch, pitch * 1.12, 0.075, "triangle", 0.022, i * 0.055),
          );
          break;
        case "scan":
          tone(420, 1260, 0.25, "sine", 0.018);
          tone(840, 420, 0.18, "triangle", 0.012, 0.1);
          break;
        case "hazard":
          // Two short warning pips before a lane reaches the player.
          tone(740, 740, 0.055, "sine", 0.035);
          tone(740, 980, 0.07, "sine", 0.03, 0.085);
          break;
        case "dodge":
          noise(0.12, 0.028);
          tone(310, 900, 0.13, "sine", 0.018);
          break;
        case "hit":
          noise(0.13, 0.06);
          tone(140, 45, 0.2, "triangle", 0.065);
          break;
      }
    } catch {
      disconnectVoice(voice);
    }
  };

  const unlock = () => {
    if (disposed || volume <= 0 || typeof window === "undefined") return;
    if (!context) {
      const Ctor = (
        window as Window & { AudioContext?: AudioContextConstructor }
      ).AudioContext;
      if (!Ctor) return;
      try {
        context = new Ctor();
        master = context.createGain();
        master.gain.setValueAtTime(volume, context.currentTime);
        master.connect(context.destination);
      } catch {
        context = null;
        master = null;
        return;
      }
    }
    const ctx = context;
    if (ctx.state === "running") {
      if (queued) {
        const cue = queued;
        queued = null;
        render(cue);
      }
      return;
    }
    if (resumePending) return;
    let attempt: Promise<void>;
    try {
      attempt = ctx.resume();
    } catch {
      queued = null;
      return;
    }
    resumePending = attempt;
    void attempt.then(
      () => {
        if (resumePending !== attempt) return;
        resumePending = null;
        if (disposed || context !== ctx || volume <= 0) {
          queued = null;
          return;
        }
        if (queued) {
          const cue = queued;
          queued = null;
          render(cue);
        }
      },
      () => {
        if (resumePending === attempt) resumePending = null;
        queued = null;
      },
    );
  };
  const play = (name: SfxName) => {
    if (disposed || volume <= 0 || !context) return;
    if (context.state === "running") {
      queued = null;
      render(name);
    } else if (resumePending) queued = name;
  };
  const setVolume = (value: number) => {
    volume = Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0;
    if (master && context) {
      try {
        master.gain.setTargetAtTime(volume, context.currentTime, 0.008);
      } catch {
        /* context closed */
      }
    }
    if (volume === 0) cancelAll();
  };
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    cancelAll();
    const ctx = context;
    try {
      master?.disconnect();
    } catch {
      /* noop */
    }
    context = null;
    master = null;
    noiseBuffer = null;
    if (ctx) void ctx.close().catch(() => {});
  };
  return { unlock, play, setVolume, dispose };
}
