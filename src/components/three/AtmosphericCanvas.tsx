"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import {
  ATMOSPHERIC_VERTEX_SHADER,
  buildAtmosphericFragmentShader,
} from "@/components/three/atmosphericShader";
import {
  heroPointerRef,
  useSpanrailStore,
} from "@/store/useSpanrailStore";
import { useBreakpoint } from "@/lib/useBreakpoint";

interface SilkPlaneProps {
  octaves: 2 | 3;
  enablePointerTracking: boolean;
}

function DiffusedSilkPlane({ octaves, enablePointerTracking }: SilkPlaneProps) {
  const { size, viewport } = useThree();

  const geometry = useMemo(() => new THREE.PlaneGeometry(2, 2), []);

  const material = useMemo(() => {
    const initialState = useSpanrailStore.getState();
    return new THREE.ShaderMaterial({
      vertexShader: ATMOSPHERIC_VERTEX_SHADER,
      fragmentShader: buildAtmosphericFragmentShader(octaves),
      depthWrite: false,
      depthTest: false,
      uniforms: {
        uTime: { value: 0 },
        uMouse: { value: new THREE.Vector2(0.5, 0.55) },
        uChaos: { value: initialState.chaosTarget },
        uTheme: { value: initialState.theme === "dark" ? 1.0 : 0.0 },
        uResolution: { value: new THREE.Vector2(1440, 900) },
      },
    });
  }, [octaves]);

  const phaseRef = useRef(0);
  const smoothChaosRef = useRef(useSpanrailStore.getState().chaosTarget);
  const smoothThemeRef = useRef(
    useSpanrailStore.getState().theme === "dark" ? 1.0 : 0.0
  );
  const smoothMouseRef = useRef(new THREE.Vector2(0.5, 0.55));
  const autoDriftClockRef = useRef(0);

  // Explicit GPU resource disposal on unmount or octave tier swap
  useEffect(() => {
    return () => {
      geometry.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, 0.05);
    const store = useSpanrailStore.getState();

    // Frame-rate-independent smooth damping
    smoothChaosRef.current = THREE.MathUtils.damp(
      smoothChaosRef.current,
      store.chaosTarget,
      3.0,
      delta
    );

    const targetTheme = store.theme === "dark" ? 1.0 : 0.0;
    smoothThemeRef.current = THREE.MathUtils.damp(
      smoothThemeRef.current,
      targetTheme,
      4.0,
      delta
    );

    autoDriftClockRef.current += delta;

    // Gentle autonomous breathing drift on Phone or idle cursor
    const idleX = 0.5 + Math.sin(autoDriftClockRef.current * 0.24) * 0.08;
    const idleY = 0.56 + Math.cos(autoDriftClockRef.current * 0.19) * 0.06;

    const targetMouseX =
      enablePointerTracking && heroPointerRef.active ? heroPointerRef.x : idleX;
    const targetMouseY =
      enablePointerTracking && heroPointerRef.active ? heroPointerRef.y : idleY;

    smoothMouseRef.current.x = THREE.MathUtils.damp(
      smoothMouseRef.current.x,
      targetMouseX,
      2.2,
      delta
    );
    smoothMouseRef.current.y = THREE.MathUtils.damp(
      smoothMouseRef.current.y,
      targetMouseY,
      2.2,
      delta
    );

    // Monotonic accumulated time slows down by 55% cleanly as uChaos -> 0
    const speedFactor = THREE.MathUtils.lerp(0.45, 1.0, smoothChaosRef.current);
    phaseRef.current += delta * speedFactor;

    const uniforms = material.uniforms;
    if (uniforms.uTime) uniforms.uTime.value = phaseRef.current;
    if (uniforms.uChaos) uniforms.uChaos.value = smoothChaosRef.current;
    if (uniforms.uTheme) uniforms.uTheme.value = smoothThemeRef.current;
    if (uniforms.uMouse) {
      (uniforms.uMouse.value as THREE.Vector2).copy(smoothMouseRef.current);
    }
    if (uniforms.uResolution) {
      (uniforms.uResolution.value as THREE.Vector2).set(
        Math.max(1, size.width * viewport.dpr),
        Math.max(1, size.height * viewport.dpr)
      );
    }
  });

  return <mesh geometry={geometry} material={material} frustumCulled={false} />;
}

function detectWebGLSupport(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl2", { failIfMajorPerformanceCaveat: false }) ||
      canvas.getContext("webgl", { failIfMajorPerformanceCaveat: false });
    return Boolean(gl);
  } catch {
    return false;
  }
}

export function AtmosphericCanvas() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { isPhone, isDesktop, prefersReducedMotion, mounted } = useBreakpoint();
  const theme = useSpanrailStore((s) => s.theme);
  const chaosTarget = useSpanrailStore((s) => s.chaosTarget);

  const [webglAvailable, setWebglAvailable] = useState(false);
  const [canvasReady, setCanvasReady] = useState(false);
  const [contextLost, setContextLost] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  const cleanupContextRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    setWebglAvailable(detectWebGLSupport());
  }, []);

  // Pause rendering when scrolled below the hero fold to protect battery/thermals
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) {
          setIsVisible(entry.isIntersecting);
        }
      },
      { rootMargin: "120px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Soft window pointer/touch tracking stored outside React state
  useEffect(() => {
    if (!mounted || prefersReducedMotion || isPhone) {
      heroPointerRef.active = false;
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;

      const nx = (event.clientX - rect.left) / rect.width;
      const ny = 1.0 - (event.clientY - rect.top) / rect.height;

      heroPointerRef.x = Math.max(0, Math.min(1, nx));
      heroPointerRef.y = Math.max(0, Math.min(1, ny));
      heroPointerRef.active = true;
    };

    const handlePointerLeave = () => {
      heroPointerRef.active = false;
    };

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    document.addEventListener("pointerleave", handlePointerLeave, {
      passive: true,
    });

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerleave", handlePointerLeave);
    };
  }, [mounted, prefersReducedMotion, isPhone]);

  useEffect(() => {
    return () => {
      cleanupContextRef.current?.();
      cleanupContextRef.current = null;
    };
  }, []);

  const shouldRenderWebGL =
    mounted && !prefersReducedMotion && webglAvailable && !contextLost;

  const octaves: 2 | 3 = isPhone ? 2 : 3;
  const maxDpr = isPhone ? 1.25 : 1.5;

  // Adaptive zero-GPU CSS radial mist wash (SSR first-frame + reduced-motion fallback)
  const fallbackBackground = useMemo(() => {
    const isDark = theme === "dark";
    const calm = 1 - chaosTarget;
    const coralAlpha = Number((chaosTarget * (isDark ? 0.13 : 0.095)).toFixed(3));
    const sageAlpha = Number((calm * (isDark ? 0.12 : 0.085)).toFixed(3));
    const oceanAlpha = isDark ? 0.16 : 0.13;

    const oceanColor = isDark
      ? `rgba(46, 168, 209, ${oceanAlpha})`
      : `rgba(17, 138, 178, ${oceanAlpha})`;
    const coralColor = isDark
      ? `rgba(218, 98, 82, ${coralAlpha})`
      : `rgba(217, 74, 74, ${coralAlpha})`;
    const sageColor = isDark
      ? `rgba(88, 188, 132, ${sageAlpha})`
      : `rgba(43, 158, 91, ${sageAlpha})`;

    return [
      `radial-gradient(64% 52% at 32% 24%, ${oceanColor} 0%, transparent 72%)`,
      `radial-gradient(56% 48% at 64% 34%, ${coralColor} 0%, transparent 70%)`,
      `radial-gradient(58% 50% at 54% 40%, ${sageColor} 0%, transparent 72%)`,
    ].join(", ");
  }, [theme, chaosTarget]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden select-none"
    >
      {/* Zero-CLS & reduced-motion CSS mist wash */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: fallbackBackground,
          transition: "opacity 400ms var(--ease-enter)",
        }}
      />

      {/* WebGL Diffused Ocean-Mist Silk Shader */}
      {shouldRenderWebGL && (
        <div
          className="absolute inset-0"
          style={{
            opacity: canvasReady ? 1 : 0,
            transition: "opacity 400ms var(--ease-enter)",
          }}
        >
          <Canvas
            orthographic
            dpr={[1, maxDpr]}
            frameloop={isVisible ? "always" : "demand"}
            gl={{
              antialias: false,
              alpha: false,
              depth: false,
              stencil: false,
              powerPreference: "high-performance",
            }}
            onCreated={({ gl }) => {
              const domEl = gl.domElement;

              const onLost = (event: Event) => {
                event.preventDefault();
                setContextLost(true);
              };

              const onRestored = () => {
                setContextLost(false);
              };

              domEl.addEventListener("webglcontextlost", onLost, false);
              domEl.addEventListener("webglcontextrestored", onRestored, false);

              cleanupContextRef.current = () => {
                domEl.removeEventListener("webglcontextlost", onLost, false);
                domEl.removeEventListener(
                  "webglcontextrestored",
                  onRestored,
                  false
                );
              };

              requestAnimationFrame(() => {
                setCanvasReady(true);
              });
            }}
          >
            <DiffusedSilkPlane
              octaves={octaves}
              enablePointerTracking={isDesktop || !isPhone}
            />
          </Canvas>
        </div>
      )}

      {/* Seamless lower fade melting into pure page canvas */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, transparent 0%, transparent 62%, var(--bg-canvas) 100%)",
        }}
      />
    </div>
  );
}
