import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from "react";
import {
  MAX_UI_PARTICLES,
  advanceParticles,
  createBurst,
  particleOpacity,
  type ParticleOrigin,
  type UiParticle,
  type UiParticleKind,
} from "../game/uiParticles";

type EmitParticles = (kind: UiParticleKind, origin?: ParticleOrigin) => void;
type SetReducedMotion = (reduced: boolean) => void;
type ParticleContextValue = {
  emit: EmitParticles;
  setReducedMotion: SetReducedMotion;
};

const ParticleContext = createContext<ParticleContextValue>({
  emit: () => undefined,
  setReducedMotion: () => undefined,
});

const COLORS = { teal: "#4dd8c3", gold: "#efc66f" } as const;

export function GameParticlesProvider({ children }: { children: ReactNode }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<UiParticle[]>([]);
  const rafRef = useRef<number | null>(null);
  const reducedRef = useRef(false);
  const osReducedRef = useRef(false);
  const seedRef = useRef(0);

  const clear = useCallback(() => {
    particlesRef.current = [];
    if (
      rafRef.current !== null &&
      typeof cancelAnimationFrame !== "undefined"
    ) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    const canvas = canvasRef.current;
    canvas?.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  const applyReducedMotion = useCallback(() => {
    if (reducedRef.current || osReducedRef.current) clear();
  }, [clear]);

  const setReducedMotion = useCallback<SetReducedMotion>(
    (reduced) => {
      reducedRef.current = reduced;
      applyReducedMotion();
    },
    [applyReducedMotion],
  );

  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined")
      return;
    const media = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    osReducedRef.current = media?.matches ?? false;
    const onMotionChange = (event: MediaQueryListEvent) => {
      osReducedRef.current = event.matches;
      applyReducedMotion();
    };
    const onVisibility = () => {
      if (document.hidden) clear();
    };
    media?.addEventListener?.("change", onMotionChange);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      media?.removeEventListener?.("change", onMotionChange);
      document.removeEventListener("visibilitychange", onVisibility);
      clear();
      canvasRef.current?.remove();
      canvasRef.current = null;
    };
  }, [applyReducedMotion, clear]);

  const ensureCanvas = useCallback(() => {
    if (canvasRef.current || typeof document === "undefined")
      return canvasRef.current;
    const canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    Object.assign(canvas.style, {
      position: "fixed",
      inset: "var(--top-height, 56px) 0 0",
      width: "100vw",
      height: "calc(100vh - var(--top-height, 56px))",
      pointerEvents: "none",
      zIndex: "999",
    });
    document.body.appendChild(canvas);
    canvasRef.current = canvas;
    return canvas;
  }, []);

  const draw = useCallback(
    (time: number) => {
      const canvas = canvasRef.current;
      if (!canvas || typeof window === "undefined") {
        rafRef.current = null;
        return;
      }
      if (document.hidden || reducedRef.current || osReducedRef.current) {
        clear();
        return;
      }
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const width = Math.max(1, Math.round(rect.width * dpr));
      const height = Math.max(1, Math.round(rect.height * dpr));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      const context = canvas.getContext("2d");
      if (!context) {
        clear();
        return;
      }
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, rect.width, rect.height);
      const dt = Math.min(
        0.05,
        Math.max(0, (time - (lastFrameRef.current ?? time)) / 1000),
      );
      lastFrameRef.current = time;
      particlesRef.current = advanceParticles(particlesRef.current, time, dt);
      for (const particle of particlesRef.current) {
        const alpha = particleOpacity(particle, time);
        if (alpha <= 0) continue;
        context.globalAlpha = alpha * 0.82;
        context.fillStyle = COLORS[particle.color];
        const size = particle.size;
        if (particle.square)
          context.fillRect(particle.x, particle.y, size, size);
        else {
          context.beginPath();
          context.arc(particle.x, particle.y, size * 0.55, 0, Math.PI * 2);
          context.fill();
        }
      }
      context.globalAlpha = 1;
      if (particlesRef.current.length)
        rafRef.current = requestAnimationFrame(draw);
      else {
        context.clearRect(0, 0, rect.width, rect.height);
        lastFrameRef.current = null;
        rafRef.current = null;
      }
    },
    [clear],
  );
  const lastFrameRef = useRef<number | null>(null);

  const emit = useCallback<EmitParticles>(
    (kind, origin) => {
      if (
        reducedRef.current ||
        osReducedRef.current ||
        typeof window === "undefined" ||
        document.hidden
      )
        return;
      const canvas = ensureCanvas();
      const context = canvas?.getContext("2d");
      if (!canvas) return;
      if (!context) {
        canvas.remove();
        canvasRef.current = null;
        return;
      }
      const rect = canvas.getBoundingClientRect();
      const point = origin ?? {
        x: rect.width * 0.5,
        y: rect.height * 0.45 + rect.top,
      };
      const localOrigin = { x: point.x, y: point.y - rect.top };
      seedRef.current += 1;
      particlesRef.current = [
        ...particlesRef.current,
        ...createBurst(kind, localOrigin, performance.now(), seedRef.current),
      ].slice(-MAX_UI_PARTICLES);
      if (rafRef.current === null) {
        lastFrameRef.current = null;
        rafRef.current = requestAnimationFrame(draw);
      }
    },
    [draw, ensureCanvas],
  );

  const value = useMemo(
    () => ({ emit, setReducedMotion }),
    [emit, setReducedMotion],
  );
  return (
    <ParticleContext.Provider value={value}>
      {children}
    </ParticleContext.Provider>
  );
}

/** Emits a restrained, semantic burst from a viewport point or screen center. */
export function useGameParticles(): EmitParticles {
  return useContext(ParticleContext).emit;
}

/** Configure the saved preference; the operating system preference is also honored. */
export function useGameParticlesReducedMotion(): SetReducedMotion {
  return useContext(ParticleContext).setReducedMotion;
}
