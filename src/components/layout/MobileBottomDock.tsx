"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { useSpanrailStore } from "@/store/useSpanrailStore";
import { calculatePricing, formatUsd } from "@/lib/pricing";
import { useBreakpoint } from "@/lib/useBreakpoint";
import { REDUCED_TRANSITION, TACTILE_SPRING } from "@/components/ui/Primitives";

export function MobileBottomDock() {
  const { isPhone, prefersReducedMotion, mounted } = useBreakpoint();

  const traceTierIndex = useSpanrailStore((s) => s.traceTierIndex);
  const evalTierIndex = useSpanrailStore((s) => s.evalTierIndex);
  const retentionDays = useSpanrailStore((s) => s.retentionDays);
  const seats = useSpanrailStore((s) => s.seats);
  const billingCycle = useSpanrailStore((s) => s.billingCycle);

  const [pastHero, setPastHero] = useState(false);
  const [nearDemoForm, setNearDemoForm] = useState(false);

  const pricing = useMemo(
    () =>
      calculatePricing({
        traceTierIndex,
        evalTierIndex,
        retentionDays,
        seats,
        billingCycle,
      }),
    [traceTierIndex, evalTierIndex, retentionDays, seats, billingCycle]
  );

  useEffect(() => {
    if (!mounted || !isPhone) return;

    const heroEl = document.getElementById("hero-stage");
    const demoEl = document.getElementById("demo");

    let heroObserver: IntersectionObserver | null = null;
    let demoObserver: IntersectionObserver | null = null;

    if (heroEl && typeof IntersectionObserver !== "undefined") {
      heroObserver = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (entry) {
            // Show dock once hero leaves viewport upward
            setPastHero(!entry.isIntersecting && entry.boundingClientRect.top < 0);
          }
        },
        { threshold: 0.08 }
      );
      heroObserver.observe(heroEl);
    }

    if (demoEl && typeof IntersectionObserver !== "undefined") {
      demoObserver = new IntersectionObserver(
        (entries) => {
          const entry = entries[0];
          if (entry) {
            setNearDemoForm(entry.isIntersecting);
          }
        },
        { threshold: 0.15 }
      );
      demoObserver.observe(demoEl);
    }

    return () => {
      heroObserver?.disconnect();
      demoObserver?.disconnect();
    };
  }, [mounted, isPhone]);

  const shouldShow = mounted && isPhone && pastHero && !nearDemoForm;

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.aside
          aria-label="Live plan estimate and demo shortcut"
          initial={
            prefersReducedMotion
              ? { opacity: 0 }
              : { opacity: 0, y: 24, scale: 0.97 }
          }
          animate={
            prefersReducedMotion
              ? { opacity: 1 }
              : { opacity: 1, y: 0, scale: 1 }
          }
          exit={
            prefersReducedMotion
              ? { opacity: 0 }
              : { opacity: 0, y: 20, scale: 0.98 }
          }
          transition={
            prefersReducedMotion ? REDUCED_TRANSITION : TACTILE_SPRING
          }
          className="fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-30 md:hidden"
        >
          <div
            className="flex items-center justify-between gap-3 rounded-full border py-1.5 pr-1.5 pl-4"
            style={{
              backgroundColor: "var(--bg-nav-glass)",
              borderColor: "var(--border-whisper)",
              boxShadow: "var(--shadow-stage)",
            }}
          >
            <a
              href="#pricing"
              className="flex min-h-[44px] flex-col justify-center rounded-full pr-2"
              aria-label={`Estimated monthly total ${formatUsd(pricing.monthlyTotalUsd)} per month for ${pricing.tracesLabel} traces. Jump to pricing calculator.`}
            >
              <span
                className="text-[11px] font-medium leading-tight"
                style={{ color: "var(--ink-secondary)" }}
              >
                {pricing.tracesLabel} traces ·{" "}
                {pricing.billingCycle === "annual" ? "annual" : "monthly"}
              </span>
              <span
                className="tabular-telemetry text-[15px] font-medium leading-tight"
                style={{ color: "var(--ink-primary)" }}
              >
                {formatUsd(pricing.monthlyTotalUsd)}
                <span
                  className="text-[12px] font-normal"
                  style={{ color: "var(--ink-secondary)" }}
                >
                  /mo
                </span>
              </span>
            </a>

            <a
              href="#demo"
              className="btn-tactile inline-flex min-h-[44px] shrink-0 items-center justify-center gap-1.5 rounded-full px-5 text-[14px] font-medium"
              style={{
                backgroundColor: "var(--btn-primary-bg)",
                color: "var(--btn-primary-ink)",
              }}
            >
              <span>Book demo</span>
              <ArrowUpRight className="h-4 w-4" strokeWidth={1.85} />
            </a>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}
