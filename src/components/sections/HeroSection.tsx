"use client";

import dynamic from "next/dynamic";
import { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowDown, Check, ChevronDown, Copy } from "lucide-react";
import { toast } from "sonner";
import {
  GUARDRAIL_CONTROLS,
  SANDBOX_SCENARIOS,
  evaluateTraceScenario,
  formatCostUsd,
  formatLatencyMs,
  type EvaluatedSpan,
  type GuardrailState,
  type ScenarioId,
} from "@/lib/sandboxData";
import { useSpanrailStore } from "@/store/useSpanrailStore";
import {
  playCoreStabilized,
  playSuccessConfirm,
  playSwitchClick,
} from "@/lib/sound";
import { useBreakpoint } from "@/lib/useBreakpoint";
import {
  QuietStatusPill,
  REDUCED_TRANSITION,
  SegmentedControl,
  SoftSwitch,
  TACTILE_SPRING,
} from "@/components/ui/Primitives";

const NeuralBrain = dynamic(() => import("@/components/three/NeuralBrain"), {
  ssr: false,
  loading: () => <div className="h-full w-full" aria-hidden="true" />,
});

function renderHighlightedJson(payload: Record<string, unknown>) {
  const formatted = JSON.stringify(payload, null, 2);
  const lines = formatted.split("\n");

  return lines.map((line, index) => {
    const isExposed = line.includes("[EXPOSED]") || line.includes("ALERT_EXPOSED");
    const isRedacted =
      line.includes("[REDACTED_PII]") || line.includes("MASKED_INLINE");

    return (
      <span
        key={index}
        className="-mx-1 block rounded px-1"
        style={
          isExposed
            ? {
                backgroundColor: "var(--status-warn-soft)",
                color: "var(--status-warn-text)",
              }
            : isRedacted
              ? {
                  backgroundColor: "var(--status-pass-soft)",
                  color: "var(--status-pass-text)",
                }
              : undefined
        }
      >
        {line}
      </span>
    );
  });
}

function getSpanDotColor(tone: EvaluatedSpan["tone"]): string {
  if (tone === "warn") return "var(--status-warn-dot)";
  if (tone === "pass") return "var(--status-pass-dot)";
  if (tone === "brand") return "var(--accent-brand)";
  return "var(--ink-muted)";
}

function getSpanBarColor(tone: EvaluatedSpan["tone"]): string {
  if (tone === "warn") return "var(--accent-spark)";
  if (tone === "pass") return "var(--status-pass-dot)";
  return "var(--accent-brand)";
}

export function HeroSection() {
  const scenarioId = useSpanrailStore((s) => s.scenarioId);
  const guardrails = useSpanrailStore((s) => s.guardrails);
  const expandedSpanId = useSpanrailStore((s) => s.expandedSpanId);
  const setScenarioId = useSpanrailStore((s) => s.setScenarioId);
  const toggleGuardrail = useSpanrailStore((s) => s.toggleGuardrail);
  const toggleExpandedSpanId = useSpanrailStore((s) => s.toggleExpandedSpanId);

  const { isPhone, prefersReducedMotion } = useBreakpoint();
  const [copiedSpanId, setCopiedSpanId] = useState<string | null>(null);
  const firstSwitchRef = useRef<HTMLDivElement | null>(null);

  const evaluated = useMemo(
    () => evaluateTraceScenario(scenarioId, guardrails),
    [scenarioId, guardrails]
  );

  const maxSpanDuration = useMemo(
    () => Math.max(...evaluated.spans.map((span) => span.baselineLatencyMs)),
    [evaluated.spans]
  );

  const latencyDropPct = Math.round(
    ((evaluated.baselineLatencyMs - evaluated.totalLatencyMs) /
      evaluated.baselineLatencyMs) *
      100
  );

  const handleToggleGuardrail = (key: keyof GuardrailState) => {
    const result = toggleGuardrail(key);
    playSwitchClick(result.nextValue);
    if (result.allEnabled) {
      playCoreStabilized();
    }
  };

  const handleScenarioChange = (nextId: ScenarioId) => {
    if (nextId === scenarioId) return;
    setScenarioId(nextId);
    playSwitchClick(true);
  };

  const handleJumpToSandbox = () => {
    const sandboxEl = document.getElementById("sandbox");
    if (sandboxEl) {
      sandboxEl.scrollIntoView({
        behavior: prefersReducedMotion ? "auto" : "smooth",
        block: "center",
      });
    }
    const firstBtn = firstSwitchRef.current?.querySelector<HTMLButtonElement>(
      'button[role="switch"]'
    );
    if (firstBtn) {
      window.setTimeout(() => {
        firstBtn.focus({ preventScroll: true });
      }, 360);
    }
  };

  const handleCopySpanJson = async (span: EvaluatedSpan) => {
    try {
      await navigator.clipboard.writeText(
        JSON.stringify(span.payload, null, 2)
      );
      setCopiedSpanId(span.id);
      playSuccessConfirm();
      toast.success(`Copied ${span.name} payload`);
      window.setTimeout(() => {
        setCopiedSpanId((prev) => (prev === span.id ? null : prev));
      }, 1800);
    } catch {
      toast.error("Unable to access clipboard in this browser.");
    }
  };

  const scenarioOptions = useMemo(
    () =>
      SANDBOX_SCENARIOS.map((item) => ({
        value: item.id,
        label: item.label,
        sublabel: isPhone ? undefined : item.traceId,
      })),
    [isPhone]
  );

  return (
    <section
      id="hero-stage"
      aria-labelledby="hero-headline"
      className="relative isolate pt-22 pb-10 md:pt-26 md:pb-14"
    >
      <div className="spanrail-container">
        {/* Top Editorial Stage: Flush-Left Copy | Frameless Interactive 3D Neural Brain (Zero Box!) */}
        <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-12">
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-7"
          >
            <div
              className="tabular-telemetry inline-flex items-center gap-2 text-[12px] tracking-[0.02em]"
              style={{ color: "var(--ink-secondary)" }}
            >
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 rounded-full"
                style={{
                  backgroundColor:
                    evaluated.status === "Healthy"
                      ? "var(--status-pass-dot)"
                      : "var(--accent-spark)",
                  transition: "background-color 280ms var(--ease-enter)",
                }}
              />
              <span>Live agent telemetry · OpenTelemetry native</span>
            </div>

            <p
              className="mt-3 text-[clamp(2.9rem,6vw,4.5rem)] leading-[0.98] font-medium tracking-[-0.042em]"
              style={{ color: "var(--ink-primary)" }}
            >
              Spanrail
              <span style={{ color: "var(--accent-spark)" }}>.</span>
            </p>

            <h1
              id="hero-headline"
              className="mt-4 max-w-[20ch] text-[clamp(1.65rem,2.9vw,2.45rem)] leading-[1.14] font-medium tracking-[-0.028em]"
              style={{ color: "var(--ink-primary)" }}
            >
              See every agent step. Stop slow runs and surprise bills.
            </h1>

            <p
              className="mt-4 max-w-[52ch] text-[16px] leading-[1.65]"
              style={{ color: "var(--ink-secondary)" }}
            >
              Real-time trace inspection, automatic PII and loop guardrails, and
              exact per-run token costs for production AI agents.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <a
                href="#demo"
                className="btn-tactile inline-flex min-h-[46px] items-center justify-center rounded-full px-6 text-[14.5px] font-medium hover:bg-[var(--btn-primary-bg-hover)]"
                style={{
                  backgroundColor: "var(--btn-primary-bg)",
                  color: "var(--btn-primary-ink)",
                }}
              >
                Book a demo
              </a>

              <button
                type="button"
                onClick={handleJumpToSandbox}
                className="btn-tactile group inline-flex min-h-[46px] cursor-pointer items-center justify-center gap-1.5 rounded-full border px-5 text-[14.5px] font-medium hover:border-[var(--border-hover)]"
                style={{
                  backgroundColor: "var(--bg-surface)",
                  borderColor: "var(--border-whisper)",
                  color: "var(--ink-primary)",
                }}
              >
                <span>Try the live preview</span>
                <ArrowDown
                  aria-hidden="true"
                  className="h-4 w-4 transition-transform duration-200 group-hover:translate-y-0.5"
                  strokeWidth={1.75}
                  style={{ color: "var(--accent-spark)" }}
                />
              </button>
            </div>
          </motion.div>

          {/* Right 5 Columns: Frameless Interactive 3D Neural Brain — No Box, No Border */}
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="h-[320px] w-full sm:h-[380px] lg:col-span-5 lg:h-[440px] lg:translate-x-[15%]"
          >
            <NeuralBrain />
          </motion.div>
        </div>

        {/* Full-Width Interactive Live Trace Sandbox */}
        <motion.div
          id="sandbox"
          initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.14, ease: [0.22, 1, 0.36, 1] }}
          className="surface-fade mt-8 scroll-mt-24 overflow-hidden rounded-3xl border md:mt-10"
          style={{
            backgroundColor: "var(--bg-surface)",
            borderColor: "var(--border-whisper)",
            boxShadow: "var(--shadow-stage)",
          }}
        >
          <div className="sr-only" aria-live="polite" aria-atomic="true">
            {`${evaluated.label} trace ${evaluated.traceId}: total latency ${formatLatencyMs(evaluated.totalLatencyMs)}, run cost ${formatCostUsd(evaluated.totalCostUsd)}, status ${evaluated.status}, ${evaluated.activeGuardrailCount} of 3 guardrails active.`}
          </div>

          <div
            className="flex flex-col gap-4 border-b px-5 py-4 md:flex-row md:items-center md:justify-between md:px-8 md:py-5"
            style={{ borderColor: "var(--border-whisper)" }}
          >
            <div className="flex items-center justify-between gap-3 md:justify-start">
              <SegmentedControl
                options={scenarioOptions}
                value={scenarioId}
                onChange={handleScenarioChange}
                ariaLabel="Select simulated agent trace scenario"
                layoutId="hero-scenario-selector"
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 md:justify-end md:gap-5">
              <div className="flex items-center gap-4 sm:gap-5">
                <div className="flex flex-col">
                  <span
                    className="text-[11.5px] font-medium"
                    style={{ color: "var(--ink-secondary)" }}
                  >
                    Latency
                  </span>
                  <span
                    className="tabular-telemetry min-w-[74px] text-[15px] font-medium"
                    style={{
                      color:
                        evaluated.activeGuardrailCount === 3
                          ? "var(--status-pass-text)"
                          : "var(--ink-primary)",
                      transition: "color 240ms var(--ease-enter)",
                    }}
                  >
                    {formatLatencyMs(evaluated.totalLatencyMs)}
                  </span>
                </div>

                <span
                  aria-hidden="true"
                  className="h-7 w-px"
                  style={{ backgroundColor: "var(--border-whisper)" }}
                />

                <div className="flex flex-col">
                  <span
                    className="text-[11.5px] font-medium"
                    style={{ color: "var(--ink-secondary)" }}
                  >
                    Run cost
                  </span>
                  <span
                    className="tabular-telemetry min-w-[58px] text-[15px] font-medium"
                    style={{
                      color:
                        evaluated.activeGuardrailCount === 3
                          ? "var(--status-pass-text)"
                          : "var(--ink-primary)",
                      transition: "color 240ms var(--ease-enter)",
                    }}
                  >
                    {formatCostUsd(evaluated.totalCostUsd)}
                  </span>
                </div>
              </div>

              <QuietStatusPill tone={evaluated.statusTone}>
                {evaluated.status}
              </QuietStatusPill>
            </div>
          </div>

          <div
            ref={firstSwitchRef}
            className="border-b px-5 py-4 md:px-8 md:py-5"
            style={{
              borderColor: "var(--border-whisper)",
              backgroundColor: "var(--bg-surface-subtle)",
            }}
          >
            <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2">
              <span
                className="text-[12.5px] font-medium"
                style={{ color: "var(--ink-secondary)" }}
              >
                Inline guardrails{" "}
                <span className="tabular-telemetry ml-1">
                  ({evaluated.activeGuardrailCount}/3 active)
                </span>
              </span>
              <span
                className="text-[12.5px] font-medium"
                style={{
                  color:
                    evaluated.status === "Healthy"
                      ? "var(--status-pass-text)"
                      : "var(--accent-spark-text)",
                  transition: "color 240ms var(--ease-enter)",
                }}
              >
                {evaluated.status === "Healthy"
                  ? `Trace stabilized · ${latencyDropPct}% faster`
                  : "Flip switches to stabilize trace"}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2.5 md:grid-cols-3 md:gap-3">
              {GUARDRAIL_CONTROLS.map((ctrl, idx) => {
                const isOn = guardrails[ctrl.key];
                const switchId = `hero-switch-${ctrl.key}`;
                const captionId = `hero-caption-${ctrl.key}`;

                return (
                  <motion.div
                    key={ctrl.key}
                    initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.35,
                      delay: 0.2 + idx * 0.08,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className="surface-fade flex min-h-[54px] items-center justify-between gap-3 rounded-2xl border px-4 py-3"
                    style={{
                      backgroundColor: "var(--bg-surface-solid)",
                      borderColor: isOn
                        ? "var(--accent-brand)"
                        : "var(--border-whisper)",
                    }}
                  >
                    <label
                      htmlFor={switchId}
                      className="flex min-w-0 flex-1 cursor-pointer flex-col"
                    >
                      <span
                        className="text-[13.5px] font-medium leading-snug"
                        style={{ color: "var(--ink-primary)" }}
                      >
                        {ctrl.label}
                      </span>
                      <span
                        id={captionId}
                        className="text-[12px] leading-snug"
                        style={{ color: "var(--ink-secondary)" }}
                      >
                        {ctrl.caption}
                      </span>
                    </label>

                    <SoftSwitch
                      id={switchId}
                      checked={isOn}
                      onCheckedChange={() => handleToggleGuardrail(ctrl.key)}
                      ariaDescribedBy={captionId}
                    />
                  </motion.div>
                );
              })}
            </div>
          </div>

          <div>
            <div
              className="hidden items-center justify-between border-b px-8 py-2.5 text-[11.5px] font-medium md:flex"
              style={{
                borderColor: "var(--border-whisper)",
                color: "var(--ink-secondary)",
              }}
            >
              <span>Trace step (click any row to inspect JSON)</span>
              <div className="flex items-center gap-6 pr-7">
                <span className="w-[152px]">Duration</span>
                <span className="w-[62px] text-right">Time</span>
                <span className="w-[56px] text-right">Cost</span>
              </div>
            </div>

            <ul className="divide-y divide-[var(--border-whisper)]">
              {evaluated.spans.map((span, spanIdx) => {
                const isExpanded = expandedSpanId === span.id;
                const panelId = `span-json-${span.id}`;
                const barPercent = Math.max(
                  3,
                  Math.min(100, Math.round((span.latencyMs / maxSpanDuration) * 100))
                );

                return (
                  <li key={span.id}>
                    <button
                      type="button"
                      onClick={() => {
                        toggleExpandedSpanId(span.id);
                        playSwitchClick(!isExpanded);
                      }}
                      aria-expanded={isExpanded}
                      aria-controls={panelId}
                      className="group flex min-h-[56px] w-full cursor-pointer items-center justify-between gap-3 px-5 py-3.5 text-left hover:bg-[var(--bg-surface-subtle)]/55 md:px-8"
                      style={{
                        backgroundColor: isExpanded
                          ? "var(--bg-surface-subtle)"
                          : "transparent",
                        transition: "background-color 180ms var(--ease-enter)",
                      }}
                    >
                      <div
                        className={`flex min-w-0 flex-1 items-center gap-3 ${
                          span.depth === 1 ? "pl-3 md:pl-5" : ""
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className="h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{
                            backgroundColor: getSpanDotColor(span.tone),
                            transition: "background-color 240ms var(--ease-enter)",
                          }}
                        />

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
                            <span
                              className="tabular-telemetry truncate text-[13px] font-medium md:text-[13.5px]"
                              style={{ color: "var(--ink-primary)" }}
                            >
                              {span.name}
                            </span>
                            <span
                              className="truncate text-[12px]"
                              style={{
                                color:
                                  span.tone === "warn"
                                    ? "var(--status-warn-text)"
                                    : span.tone === "pass"
                                      ? "var(--status-pass-text)"
                                      : "var(--ink-secondary)",
                                transition: "color 240ms var(--ease-enter)",
                              }}
                            >
                              {span.note}
                            </span>
                          </div>

                          <div
                            className="mt-2 h-1.5 w-full max-w-[180px] overflow-hidden rounded-full md:hidden"
                            style={{ backgroundColor: "var(--bg-surface-subtle)" }}
                          >
                            <motion.div
                              initial={prefersReducedMotion ? false : { width: "0%" }}
                              animate={{ width: `${barPercent}%` }}
                              transition={
                                prefersReducedMotion
                                  ? REDUCED_TRANSITION
                                  : { ...TACTILE_SPRING, delay: 0.1 + spanIdx * 0.04 }
                              }
                              className="h-full rounded-full"
                              style={{
                                backgroundColor: getSpanBarColor(span.tone),
                              }}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-3 md:gap-6">
                        <div
                          className="hidden h-1.5 w-[152px] overflow-hidden rounded-full md:block"
                          style={{
                            backgroundColor: isExpanded
                              ? "var(--bg-surface-solid)"
                              : "var(--bg-surface-subtle)",
                          }}
                        >
                          <motion.div
                            initial={prefersReducedMotion ? false : { width: "0%" }}
                            animate={{ width: `${barPercent}%` }}
                            transition={
                              prefersReducedMotion
                                ? REDUCED_TRANSITION
                                : { ...TACTILE_SPRING, delay: 0.1 + spanIdx * 0.04 }
                            }
                            className="h-full rounded-full"
                            style={{
                              backgroundColor: getSpanBarColor(span.tone),
                            }}
                          />
                        </div>

                        <span
                          className="tabular-telemetry w-[58px] text-right text-[13px] font-medium md:w-[62px]"
                          style={{ color: "var(--ink-primary)" }}
                        >
                          {formatLatencyMs(span.latencyMs)}
                        </span>

                        <span
                          className="tabular-telemetry hidden w-[56px] text-right text-[12.5px] sm:inline"
                          style={{ color: "var(--ink-secondary)" }}
                        >
                          {formatCostUsd(span.costUsd)}
                        </span>

                        <ChevronDown
                          aria-hidden="true"
                          className="h-4 w-4 shrink-0"
                          strokeWidth={1.75}
                          style={{
                            color: "var(--ink-secondary)",
                            transform: isExpanded
                              ? "rotate(180deg)"
                              : "rotate(0deg)",
                            transition: "transform 220ms var(--ease-enter)",
                          }}
                        />
                      </div>
                    </button>

                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          id={panelId}
                          role="region"
                          aria-label={`${span.name} JSON payload`}
                          initial={
                            prefersReducedMotion
                              ? { opacity: 0 }
                              : { opacity: 0, height: 0 }
                          }
                          animate={
                            prefersReducedMotion
                              ? { opacity: 1 }
                              : { opacity: 1, height: "auto" }
                          }
                          exit={
                            prefersReducedMotion
                              ? { opacity: 0 }
                              : { opacity: 0, height: 0 }
                          }
                          transition={
                            prefersReducedMotion
                              ? REDUCED_TRANSITION
                              : { duration: 0.24, ease: [0.22, 1, 0.36, 1] }
                          }
                          className="overflow-hidden"
                        >
                          <div className="px-5 pt-1 pb-5 md:px-8 md:pb-6">
                            <div
                              className="overflow-hidden rounded-2xl border"
                              style={{
                                backgroundColor: "var(--code-bg)",
                                borderColor: "var(--border-whisper)",
                              }}
                            >
                              <div
                                className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2.5"
                                style={{ borderColor: "var(--border-whisper)" }}
                              >
                                <div
                                  className="tabular-telemetry flex items-center gap-3 text-[12px]"
                                  style={{ color: "var(--ink-secondary)" }}
                                >
                                  <span>{evaluated.traceId}</span>
                                  <span aria-hidden="true">·</span>
                                  <span>
                                    {span.tokens.toLocaleString("en-US")} tokens
                                  </span>
                                  <span
                                    aria-hidden="true"
                                    className="hidden sm:inline"
                                  >
                                    ·
                                  </span>
                                  <span className="hidden sm:inline">
                                    {formatCostUsd(span.costUsd)}
                                  </span>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => void handleCopySpanJson(span)}
                                  className="btn-tactile inline-flex min-h-[32px] cursor-pointer items-center gap-1.5 rounded-full border px-3 text-[12px] font-medium hover:border-[var(--border-hover)]"
                                  style={{
                                    backgroundColor: "var(--bg-surface-solid)",
                                    borderColor: "var(--border-whisper)",
                                    color: "var(--ink-primary)",
                                  }}
                                >
                                  {copiedSpanId === span.id ? (
                                    <>
                                      <Check
                                        className="h-3.5 w-3.5"
                                        style={{
                                          color: "var(--status-pass-text)",
                                        }}
                                      />
                                      <span>Copied</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="h-3.5 w-3.5" />
                                      <span>Copy JSON</span>
                                    </>
                                  )}
                                </button>
                              </div>

                              <pre
                                className="tabular-telemetry overflow-x-auto p-4 text-[12px] leading-[1.65] md:text-[12.5px]"
                                style={{ color: "var(--ink-primary)" }}
                              >
                                <code>{renderHighlightedJson(span.payload)}</code>
                              </pre>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </li>
                );
              })}
            </ul>
          </div>
        </motion.div>
      </div>
    </section>
  );
}