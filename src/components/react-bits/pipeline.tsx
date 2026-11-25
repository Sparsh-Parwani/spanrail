"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useBreakpoint } from "@/lib/useBreakpoint";

const STAGES = [
  { id: "ingress", label: "Prompt", sub: "OTLP", ms: "0.2ms" },
  { id: "pii", label: "PII Edge", sub: "SIMD", ms: "0.6ms" },
  { id: "policy", label: "Policy", sub: "Rules", ms: "0.4ms" },
  { id: "model", label: "Model", sub: "Route", ms: "0.5ms" },
] as const;

export default function Pipeline() {
  const { prefersReducedMotion } = useBreakpoint();
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (prefersReducedMotion) return;
    const id = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % STAGES.length);
    }, 1150);
    return () => window.clearInterval(id);
  }, [prefersReducedMotion]);

  return (
    <div
      className="relative overflow-hidden rounded-xl border px-3 py-5 sm:px-4"
      style={{
        backgroundColor: "var(--bg-surface-subtle)",
        borderColor: "var(--border-whisper)",
      }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-35"
        style={{
          backgroundImage:
            "radial-gradient(var(--border-hover) 1px, transparent 1px)",
          backgroundSize: "14px 14px",
        }}
      />

      <div className="relative flex items-center justify-between gap-1.5 sm:gap-2">
        {STAGES.map((stage, idx) => {
          const isActive = idx === activeIndex;
          const isCompleted = idx < activeIndex;

          return (
            <div key={stage.id} className="flex min-w-0 flex-1 items-center">
              <div
                className="relative flex w-full flex-col rounded-xl border px-2.5 py-2.5 sm:px-3"
                style={{
                  backgroundColor: "var(--bg-surface)",
                  borderColor: isActive
                    ? "var(--accent-brand)"
                    : "var(--border-whisper)",
                  boxShadow: isActive
                    ? "0 0 0 3px var(--accent-brand-soft)"
                    : "none",
                  transition:
                    "border-color 220ms var(--ease-enter), box-shadow 220ms var(--ease-enter)",
                }}
              >
                <div className="flex items-center justify-between gap-1">
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{
                      backgroundColor: isActive
                        ? "var(--accent-brand)"
                        : isCompleted
                          ? "var(--status-pass-dot)"
                          : "var(--ink-muted)",
                    }}
                  />
                  <span
                    className="tabular-telemetry text-[10px]"
                    style={{ color: "var(--ink-secondary)" }}
                  >
                    {stage.ms}
                  </span>
                </div>
                <span
                  className="mt-1.5 truncate text-[12px] font-medium"
                  style={{ color: "var(--ink-primary)" }}
                >
                  {stage.label}
                </span>
                <span
                  className="truncate text-[10.5px]"
                  style={{ color: "var(--ink-secondary)" }}
                >
                  {stage.sub}
                </span>
              </div>

              {idx < STAGES.length - 1 && (
                <div
                  aria-hidden="true"
                  className="relative mx-1 h-[2px] w-4 shrink-0 overflow-hidden rounded-full sm:w-6"
                  style={{ backgroundColor: "var(--border-hover)" }}
                >
                  {!prefersReducedMotion && isActive && (
                    <motion.span
                      key={`flow-${activeIndex}-${idx}`}
                      initial={{ x: "-100%" }}
                      animate={{ x: "120%" }}
                      transition={{
                        duration: 0.75,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      className="absolute inset-y-0 left-0 w-full rounded-full"
                      style={{ backgroundColor: "var(--accent-brand)" }}
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
