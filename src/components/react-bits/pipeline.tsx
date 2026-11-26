"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { useBreakpoint } from "@/lib/useBreakpoint";

export type PipelineRuleId = "injection" | "budget" | "fallback";

interface StageNode {
  id: string;
  label: string;
  sub: string;
  ms: string;
  tone: "brand" | "warn" | "pass";
  halted?: boolean;
}

const RULE_STAGES: Record<PipelineRuleId, readonly StageNode[]> = {
  injection: [
    { id: "ingress", label: "Prompt", sub: "OTLP", ms: "0.2ms", tone: "brand" },
    { id: "pii", label: "PII Edge", sub: "SIMD", ms: "0.5ms", tone: "brand" },
    { id: "policy", label: "Blocked", sub: "HTTP 422", ms: "0.7ms", tone: "warn" },
    { id: "model", label: "Skipped", sub: "No LLM call", ms: "0.0ms", tone: "warn", halted: true },
  ],
  budget: [
    { id: "ingress", label: "Prompt", sub: "OTLP", ms: "0.2ms", tone: "brand" },
    { id: "pii", label: "PII Edge", sub: "SIMD", ms: "0.5ms", tone: "brand" },
    { id: "policy", label: "Cap $0.05", sub: "Ledger", ms: "0.4ms", tone: "brand" },
    { id: "model", label: "Primary", sub: "Guarded", ms: "0.3ms", tone: "pass" },
  ],
  fallback: [
    { id: "ingress", label: "Prompt", sub: "OTLP", ms: "0.2ms", tone: "brand" },
    { id: "pii", label: "PII Edge", sub: "SIMD", ms: "0.5ms", tone: "brand" },
    { id: "policy", label: "429 Catch", sub: "Reroute", ms: "0.4ms", tone: "brand" },
    { id: "model", label: "Fast LLM", sub: "410ms p95", ms: "0.3ms", tone: "pass" },
  ],
};

function toneColor(tone: StageNode["tone"]): string {
  if (tone === "warn") return "var(--status-warn-dot)";
  if (tone === "pass") return "var(--status-pass-dot)";
  return "var(--accent-brand)";
}

export default function Pipeline({
  activeRule = "budget",
}: {
  activeRule?: PipelineRuleId;
}) {
  const { prefersReducedMotion } = useBreakpoint();
  const stages = RULE_STAGES[activeRule];
  const maxStep = activeRule === "injection" ? 3 : stages.length;
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { amount: 0.1 });
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    setActiveIndex(0);
  }, [activeRule]);

  useEffect(() => {
    if (prefersReducedMotion || !isInView) return;
    const id = window.setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % maxStep);
    }, 1050);
    return () => window.clearInterval(id);
  }, [prefersReducedMotion, isInView, maxStep]);

  return (
    <div
      ref={containerRef}
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
        {stages.map((stage, idx) => {
          const isHalted = Boolean(stage.halted);
          const isActive = !isHalted && idx === activeIndex;
          const isCompleted = !isHalted && idx < activeIndex;
          const accent = toneColor(stage.tone);

          return (
            <div key={`${activeRule}-${stage.id}`} className="flex min-w-0 flex-1 items-center">
              <div
                className="relative flex w-full flex-col rounded-xl border px-2.5 py-2.5 sm:px-3"
                style={{
                  backgroundColor: "var(--bg-surface-solid)",
                  borderColor: isActive ? accent : "var(--border-whisper)",
                  opacity: isHalted ? 0.42 : 1,
                  boxShadow: isActive
                    ? "0 0 0 3px var(--accent-brand-soft)"
                    : "none",
                  transition:
                    "border-color 220ms var(--ease-enter), box-shadow 220ms var(--ease-enter), opacity 220ms var(--ease-enter)",
                }}
              >
                <div className="flex items-center justify-between gap-1">
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{
                      backgroundColor: isActive
                        ? accent
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
                  style={{
                    color:
                      stage.tone === "warn" && !isHalted
                        ? "var(--status-warn-text)"
                        : "var(--ink-secondary)",
                  }}
                >
                  {stage.sub}
                </span>
              </div>

              {idx < stages.length - 1 && (
                <div
                  aria-hidden="true"
                  className="relative mx-1 h-[2px] w-4 shrink-0 overflow-hidden rounded-full sm:w-6"
                  style={{
                    backgroundColor:
                      activeRule === "injection" && idx === 2
                        ? "var(--status-warn-soft)"
                        : "var(--border-hover)",
                  }}
                >
                  {!prefersReducedMotion && isActive && !(activeRule === "injection" && idx === 2) && (
                    <motion.span
                      key={`flow-${activeRule}-${activeIndex}-${idx}`}
                      initial={{ x: "-100%" }}
                      animate={{ x: "120%" }}
                      transition={{
                        duration: 0.7,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      className="absolute inset-y-0 left-0 w-full rounded-full"
                      style={{ backgroundColor: accent }}
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