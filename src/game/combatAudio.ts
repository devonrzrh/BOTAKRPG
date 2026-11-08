import { combatCueDuration, type BattleCue } from "./combatPresentation";

type AudioContextLike = AudioContext;

/** Small synthesized battle cues. AudioContext is created only from unlock(). */
export function createCombatAudio() {
  let context: AudioContextLike | null = null;
  let muted = false;
  let volume = 1;
  let disposed = false;
  let lastSequence = -1;
  let resumePending: Promise<void> | null = null;
  let queuedCue: { cue: BattleCue; reducedMotion: boolean } | null = null;
  const timers = new Set<ReturnType<typeof setTimeout>>();
  const nodes = new Set<AudioNode>();
  let noiseBuffer: AudioBuffer | null = null;

  const trackVoice = (
    source: AudioScheduledSourceNode,
    voiceNodes: AudioNode[],
  ) => {
    if (nodes.size + voiceNodes.length > 64) return false;
    voiceNodes.forEach((node) => nodes.add(node));
    let cleaned = false;
    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;
      voiceNodes.forEach((node) => {
        nodes.delete(node);
        try {
          node.disconnect();
        } catch {
          /* already disconnected */
        }
      });
    };
    source.onended = cleanup;
    return true;
  };

  const playNoise = (
    ctx: AudioContextLike,
    now: number,
    duration: number,
    level: number,
    filterType: BiquadFilterType,
    frequency: number,
    resonance = 0.8,
  ) => {
    try {
      if (!ctx.createBufferSource || !ctx.createBuffer) return;
      if (!noiseBuffer) {
        const buffer = ctx.createBuffer(
          1,
          Math.ceil(ctx.sampleRate * 0.35),
          ctx.sampleRate,
        );
        const channel = buffer.getChannelData(0);
        for (let i = 0; i < channel.length; i += 1)
          channel[i] = Math.random() * 2 - 1;
        noiseBuffer = buffer;
      }
      const source = ctx.createBufferSource();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();
      source.buffer = noiseBuffer;
      filter.type = filterType;
      filter.frequency.setValueAtTime(frequency, now);
      filter.Q.setValueAtTime(resonance, now);
      gain.gain.setValueAtTime(level * volume, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      source.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      if (!trackVoice(source, [source, filter, gain])) {
        source.disconnect();
        filter.disconnect();
        gain.disconnect();
        return;
      }
      source.start(now);
      source.stop(now + duration);
    } catch {
      /* Tone remains available when noise nodes are unsupported. */
    }
  };

  const schedule = (cue: BattleCue, reducedMotion: boolean) => {
    const victory =
      cue.defeated || (cue.kind === "recover" && cue.special === "pacify");
    const playerHit = cue.kind === "player" || cue.kind === "poison";
    const cueName = victory
      ? "victory"
      : cue.kind === "miss"
        ? "miss"
        : cue.kind === "enemy" && cue.blocked
          ? "block"
          : cue.kind === "enemy" && cue.heavy
            ? "heavyenemy"
            : cue.kind === "enemy"
              ? "enemy"
              : cue.special === "break"
                ? "break"
                : cue.special === "weakness"
                  ? "weakness"
                  : playerHit
                    ? "playerhit"
                    : "miss";
    const presets: Record<string, [number, number, OscillatorType]> = {
      playerhit: [190, 82, "triangle"],
      weakness: [280, 116, "sine"],
      break: [125, 58, "sawtooth"],
      enemy: [150, 72, "square"],
      heavyenemy: [105, 48, "sawtooth"],
      block: [420, 190, "triangle"],
      miss: [330, 210, "sine"],
      victory: [440, 660, "sine"],
    };
    const skillVoices: Record<string, [number, number, OscillatorType]> = {
      insight: [900, 140, "triangle"],
      ward: [420, 630, "sine"],
      trace: [240, 110, "square"],
      simplify: [340, 130, "triangle"],
    };
    const [startHz, endHz, type] =
      cueName === "playerhit"
        ? (skillVoices[cue.skill ?? ""] ?? presets[cueName])
        : presets[cueName];
    const durationMs = combatCueDuration(reducedMotion);
    const delayMs =
      cue.kind === "enemy" ? durationMs * 0.62 : durationMs * 0.32;
    const timer = setTimeout(() => {
      timers.delete(timer);
      const ctx = context;
      if (!ctx || disposed || muted || volume === 0 || ctx.state !== "running")
        return;
      try {
        const now = ctx.currentTime;
        const damage = cue.kind === "enemy" && cue.amount > 0;
        const length = damage
          ? cue.heavy
            ? 0.22
            : 0.18
          : cueName === "victory"
            ? 0.2
            : 0.12;
        const peak = damage ? (cue.heavy ? 0.18 : 0.14) : 0.055;
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(startHz, now);
        oscillator.frequency.exponentialRampToValueAtTime(endHz, now + length);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(
          peak * volume,
          now + (damage ? 0.006 : 0.012),
        );
        gain.gain.exponentialRampToValueAtTime(0.0001, now + length);
        oscillator.connect(gain);
        gain.connect(ctx.destination);
        if (!trackVoice(oscillator, [oscillator, gain])) {
          oscillator.disconnect();
          gain.disconnect();
          return;
        }
        oscillator.start(now);
        oscillator.stop(now + length + 0.01);
        if (cueName === "playerhit") {
          if (cue.kind === "poison" || cue.skill === "trace")
            playNoise(ctx, now, 0.11, 0.007, "highpass", 3200, 0.45);
          else if (cue.skill === "ward")
            playNoise(ctx, now, 0.075, 0.014, "highpass", 1750, 1.1);
          else playNoise(ctx, now, 0.045, 0.012, "bandpass", 1450, 0.65);
          if (cue.special === "limit") {
            try {
              const pulse = ctx.createOscillator();
              const pulseGain = ctx.createGain();
              pulse.type = "sine";
              pulse.frequency.setValueAtTime(92, now);
              pulseGain.gain.setValueAtTime(0.0001, now);
              pulseGain.gain.exponentialRampToValueAtTime(
                0.024 * volume,
                now + 0.008,
              );
              pulseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
              pulse.connect(pulseGain);
              pulseGain.connect(ctx.destination);
              if (!trackVoice(pulse, [pulse, pulseGain])) {
                pulse.disconnect();
                pulseGain.disconnect();
              } else {
                pulse.start(now);
                pulse.stop(now + 0.17);
              }
            } catch {
              /* Keep the main strike tone. */
            }
          }
        } else if (cueName === "block") {
          playNoise(ctx, now, 0.075, 0.014, "highpass", 1750, 1.1);
        } else if (cueName === "heavyenemy") {
          playNoise(ctx, now, 0.14, 0.055, "lowpass", 320, 0.7);
        } else if (cueName === "enemy") {
          playNoise(ctx, now, 0.085, 0.035, "bandpass", 920, 0.55);
        } else if (cueName === "break") {
          playNoise(ctx, now, 0.085, 0.014, "highpass", 2200, 0.6);
          playNoise(ctx, now + 0.04, 0.06, 0.008, "bandpass", 1050, 0.7);
        } else if (cueName === "weakness" || cue.kind === "poison") {
          playNoise(ctx, now, 0.11, 0.007, "highpass", 3200, 0.45);
        } else if (cueName === "victory") {
          for (const [offset, hz] of [
            [0.055, 554.37],
            [0.11, 659.25],
          ] as const) {
            try {
              const note = ctx.createOscillator();
              const noteGain = ctx.createGain();
              note.type = "sine";
              note.frequency.setValueAtTime(hz, now + offset);
              noteGain.gain.setValueAtTime(0.0001, now + offset);
              noteGain.gain.exponentialRampToValueAtTime(
                0.022 * volume,
                now + offset + 0.01,
              );
              noteGain.gain.exponentialRampToValueAtTime(
                0.0001,
                now + offset + 0.13,
              );
              note.connect(noteGain);
              noteGain.connect(ctx.destination);
              if (!trackVoice(note, [note, noteGain])) {
                note.disconnect();
                noteGain.disconnect();
                continue;
              }
              note.start(now + offset);
              note.stop(now + offset + 0.14);
            } catch {
              /* Keep the main victory tone. */
            }
          }
        }
      } catch {
        /* Audio may become unavailable between scheduling and playback. */
      }
    }, delayMs);
    timers.add(timer);
  };

  const drainQueuedCue = (ctx: AudioContextLike) => {
    if (
      ctx !== context ||
      disposed ||
      muted ||
      volume === 0 ||
      ctx.state !== "running"
    ) {
      queuedCue = null;
      return;
    }
    const pending = queuedCue;
    queuedCue = null;
    if (pending) schedule(pending.cue, pending.reducedMotion);
  };

  const unlock = () => {
    if (disposed || muted || volume === 0 || typeof window === "undefined")
      return;
    if (!context) {
      const Context = window.AudioContext;
      if (!Context) return;
      try {
        context = new Context();
      } catch {
        context = null;
        return;
      }
    }
    const ctx = context;
    if (ctx.state === "running") {
      drainQueuedCue(ctx);
      return;
    }
    if (resumePending) return;
    let attempt: Promise<void>;
    try {
      attempt = ctx.resume();
    } catch {
      queuedCue = null;
      return;
    }
    resumePending = attempt;
    void attempt.then(
      () => {
        if (resumePending !== attempt) return;
        resumePending = null;
        drainQueuedCue(ctx);
      },
      () => {
        if (resumePending === attempt) resumePending = null;
        queuedCue = null;
      },
    );
  };

  const play = (cue: BattleCue, reducedMotion = false) => {
    if (
      disposed ||
      muted ||
      volume === 0 ||
      !context ||
      cue.sequence <= lastSequence
    )
      return;
    lastSequence = cue.sequence;
    if (context.state === "running") {
      queuedCue = null;
      schedule(cue, reducedMotion);
    } else if (resumePending) {
      queuedCue = { cue, reducedMotion };
    }
  };

  const silence = () => {
    queuedCue = null;
    timers.forEach(clearTimeout);
    timers.clear();
    nodes.forEach((node) => {
      try {
        node.disconnect();
      } catch {
        /* already disconnected */
      }
    });
    nodes.clear();
  };
  const setMuted = (value: boolean) => {
    muted = value;
    if (value) silence();
  };
  const setVolume = (value: number) => {
    volume = Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;
    if (volume === 0) silence();
  };
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    silence();
    if (context) void context.close().catch(() => {});
    context = null;
  };
  return { unlock, play, setMuted, setVolume, dispose };
}
