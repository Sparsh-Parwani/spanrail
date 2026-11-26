"use client";

import dynamic from "next/dynamic";
import { useEffect } from "react";
import { TopNav } from "@/components/layout/TopNav";
import { MobileBottomDock } from "@/components/layout/MobileBottomDock";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/sections/HeroSection";
import { TrustStrip } from "@/components/sections/TrustStrip";
import { CapabilitiesGrid } from "@/components/sections/CapabilitiesGrid";
import { BeforeAfterSection } from "@/components/sections/BeforeAfterSection";
import { PricingCalculator } from "@/components/sections/PricingCalculator";
import { DemoBookingForm } from "@/components/sections/DemoBookingForm";
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

export default function SpanrailLandingPage() {
  const { isPhone, prefersReducedMotion, mounted } = useBreakpoint();

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
        const sandboxVisible = rect.bottom > 80 && rect.top < window.innerHeight - 80;
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
    <div className="relative isolate min-h-dvh">
      {mounted && !prefersReducedMotion && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-0 overflow-hidden"
          style={{ opacity: 0.6 }}
        >
          <GhostFibers
            glowColor="#2ea8d1"
            secondaryColor="#f2994a"
            lineColor="#d9f3fc"
            gradient="depth"
            layers={3}
            twist={1.2}
            threads={isPhone ? 34 : 56}
            fiberStyle="dots"
            depthOfField={0.85}
            hoverEffect="focus"
            intro={true}
            mouseInteraction={!isPhone}
            waves={1.15}
            volume={0.9}
            rotation={21}
            perspective={1}
            density={isPhone ? 0.85 : 1.15}
            foldGlow={1.05}
            flow={0.72}
            focusDepth={0.25}
            particles={isPhone ? 0.5 : 0.85}
            brightness={1.48}
            glow={0.72}
            lightMode={false}
            dpr={1}
            scrollParallax
          />
        </div>
      )}

      <TopNav />

      <main id="main-content" className="relative z-10">
        <HeroSection />
        <TrustStrip />
        <CapabilitiesGrid />
        <BeforeAfterSection />
        <PricingCalculator />
        <DemoBookingForm />
      </main>

      <div className="relative z-10">
        <Footer />
      </div>
      <MobileBottomDock />
    </div>
  );
}