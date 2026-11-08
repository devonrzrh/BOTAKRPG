import { combatCueDuration, type BattleCue } from "./combatPresentation";

type AudioContextLike = AudioContext;

/** Small synthesized battle cues. AudioContext is created only from unlock(). */
export function createCombatAudio() {
  let context: AudioContextLike | null = null;
  let muted = false;
  let disposed = false;
  let lastSequence = -1;
  let resumePending: Promise<void> | null = null;
  let queuedCue: { cue: BattleCue; reducedMotion: boolean } | null = null;
  const timers = new Set<ReturnType<typeof setTimeout>>();
  const nodes = new Set<OscillatorNode | GainNode>();

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
      enemy: [150, 72, "triangle"],
      heavyenemy: [105, 48, "sawtooth"],
      block: [420, 190, "triangle"],
      miss: [330, 210, "sine"],
      victory: [440, 660, "sine"],
    };
    const [startHz, endHz, type] = presets[cueName];
    const durationMs = combatCueDuration(reducedMotion);
    const delayMs =
      cue.kind === "enemy" ? durationMs * 0.62 : durationMs * 0.32;
    const timer = setTimeout(() => {
      timers.delete(timer);
      const ctx = context;
      if (!ctx || disposed || muted || ctx.state !== "running") return;
      try {
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();
        const now = ctx.currentTime;
        const length = cueName === "victory" ? 0.2 : 0.12;
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(startHz, now);
        oscillator.frequency.exponentialRampToValueAtTime(endHz, now + length);
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.exponentialRampToValueAtTime(0.055, now + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + length);
        oscillator.connect(gain);
        gain.connect(ctx.destination);
        nodes.add(oscillator);
        nodes.add(gain);
        oscillator.onended = () => {
          nodes.delete(oscillator);
          nodes.delete(gain);
          try {
            oscillator.disconnect();
            gain.disconnect();
          } catch {
            /* already disconnected */
          }
        };
        oscillator.start(now);
        oscillator.stop(now + length + 0.01);
      } catch {
        /* Audio may become unavailable between scheduling and playback. */
      }
    }, delayMs);
    timers.add(timer);
  };

  const drainQueuedCue = (ctx: AudioContextLike) => {
    if (ctx !== context || disposed || muted || ctx.state !== "running") {
      queuedCue = null;
      return;
    }
    const pending = queuedCue;
    queuedCue = null;
    if (pending) schedule(pending.cue, pending.reducedMotion);
  };

  const unlock = () => {
    if (disposed || muted || typeof window === "undefined") return;
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
    if (disposed || muted || !context || cue.sequence <= lastSequence) return;
    lastSequence = cue.sequence;
    if (context.state === "running") {
      queuedCue = null;
      schedule(cue, reducedMotion);
    } else if (resumePending) {
      queuedCue = { cue, reducedMotion };
    }
  };

  const setMuted = (value: boolean) => {
    muted = value;
    if (!value) return;
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
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    queuedCue = null;
    timers.forEach(clearTimeout);
    timers.clear();
    nodes.forEach((node) => {
      try {
        node.disconnect();
      } catch {
        /* noop */
      }
    });
    nodes.clear();
    if (context) void context.close().catch(() => {});
    context = null;
  };
  return { unlock, play, setMuted, dispose };
}
