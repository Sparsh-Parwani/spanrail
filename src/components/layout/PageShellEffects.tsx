"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useSpanrailStore } from "@/store/useSpanrailStore";
import { initSoundEngine, playSwitchClick } from "@/lib/sound";
import { useBreakpoint } from "@/lib/useBreakpoint";

const GhostFibers = dynamic(() => import("@/components/GhostFibers"), {
  ssr: false,
});

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    target.isContentEditable
  );
}

export function PageShellEffects() {
  const { isPhone, prefersReducedMotion, mounted } = useBreakpoint();
  const [allowWebglBg, setAllowWebglBg] = useState(false);

  useEffect(() => {
    if (!mounted || prefersReducedMotion || isPhone) {
      setAllowWebglBg(false);
      return;
    }

    const nav = navigator as Navigator & {
      connection?: { saveData?: boolean };
    };
    const lowCoreCpu =
      typeof navigator.hardwareConcurrency === "number" &&
      navigator.hardwareConcurrency <= 2;
    const saveData = Boolean(nav.connection?.saveData);

    if (lowCoreCpu || saveData) {
      setAllowWebglBg(false);
      return;
    }

    let timer: number | undefined;
    let idleId: number | undefined;
    const win = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    if (win.requestIdleCallback) {
      idleId = win.requestIdleCallback(() => setAllowWebglBg(true), {
        timeout: 280,
      });
    } else {
      timer = window.setTimeout(() => setAllowWebglBg(true), 240);
    }

    return () => {
      if (idleId !== undefined) win.cancelIdleCallback?.(idleId);
      if (timer !== undefined) window.clearTimeout(timer);
    };
  }, [mounted, prefersReducedMotion, isPhone]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      if (isTypingTarget(event.target)) return;

      const key = event.key.toLowerCase();
      const store = useSpanrailStore.getState();

      if (key === "m") {
        if (!store.isSoundEnabled) {
          initSoundEngine();
        }
        const next = store.toggleSound();
        if (next) {
          playSwitchClick(true);
        }
        return;
      }

      if (key === "1" || key === "2") {
        const sandbox = document.getElementById("sandbox");
        if (!sandbox) return;
        const rect = sandbox.getBoundingClientRect();
        const sandboxVisible =
          rect.bottom > 80 && rect.top < window.innerHeight - 80;
        if (!sandboxVisible) return;

        const targetScenario = key === "1" ? "refund" : "sql";
        if (store.scenarioId !== targetScenario) {
          store.setScenarioId(targetScenario);
          playSwitchClick(true);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
      style={{
        contain: "strict",
        transform: "translateZ(0)",
      }}
    >
      {/* Zero-GPU Ocean & Amber ambient fallback */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: [
            "radial-gradient(58% 44% at 78% 18%, rgba(46, 168, 209, 0.14) 0%, transparent 72%)",
            "radial-gradient(50% 42% at 18% 76%, rgba(242, 153, 74, 0.09) 0%, transparent 70%)",
          ].join(", "),
        }}
      />

      {allowWebglBg && (
        <div className="absolute inset-0" style={{ opacity: 0.6 }}>
          <GhostFibers
            glowColor="#2ea8d1"
            secondaryColor="#f2994a"
            lineColor="#d9f3fc"
            gradient="depth"
            layers={3}
            twist={1.2}
            threads={38}
            fiberStyle="dots"
            depthOfField={0.85}
            hoverEffect="focus"
            intro={true}
            mouseInteraction={true}
            waves={1.15}
            volume={0.9}
            rotation={21}
            perspective={1}
            density={0.8}
            thickness={1.22}
            foldGlow={1.05}
            flow={0.72}
            focusDepth={0.25}
            particles={0.45}
            brightness={1.62}
            glow={0.72}
            lightMode={false}
            dpr={1}
            scrollParallax
          />
        </div>
      )}
    </div>
  );
}