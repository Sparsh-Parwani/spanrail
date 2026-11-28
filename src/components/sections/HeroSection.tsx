"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, m } from "framer-motion";
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
    const isExposed =
      line.includes("[EXPOSED]") || line.includes("ALERT_EXPOSED");
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
  const copyTimerRef = useRef<number | null>(null);
  const firstSwitchRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

  const evaluated = useMemo(
    () => evaluateTraceScenario(scenarioId, guardrails),
    [scenarioId, guardrails]
  );

  const waterfallItems = useMemo(() => {
    let elapsedMs = 0;
    const total = Math.max(1, evaluated.totalLatencyMs);
    return evaluated.spans.map((span) => {
      const startPct = Math.min(95, (elapsedMs / total) * 100);
      const rawWidth = (span.latencyMs / total) * 100;
      const widthPct = Math.max(4, Math.min(100 - startPct, rawWidth));
      elapsedMs += span.latencyMs;
      return { span, startPct, widthPct };
    });
  }, [evaluated]);

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
        block: "start",
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
      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current);
      }
      copyTimerRef.current = window.setTimeout(() => {
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
      className="relative isolate pt-20 pb-10 md:pt-24 md:pb-12"
    >
      <div className="spanrail-container">
        <div className="grid grid-cols-1 items-center gap-4 sm:gap-6 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <div className="tabular-telemetry inline-flex items-center gap-2 text-[11px] tracking-[0.02em] text-[var(--ink-muted)] lg:text-[12px]">
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 shrink-0 rounded-full"
                style={{
                  backgroundColor:
                    evaluated.status === "Healthy"
                      ? "var(--status-pass-dot)"
                      : "var(--accent-spark)",
                  transition: "background-color 280ms var(--ease-enter)",
                }}
              />
              <span>Live agent telemetry — OpenTelemetry native</span>
            </div>

            <h1
              id="hero-headline"
              className="mt-3.5 max-w-[16ch] text-[clamp(2.1rem,4.4vw,3.55rem)] leading-[1.06] font-medium tracking-[-0.034em] text-[var(--ink-primary)] [text-wrap:balance] sm:mt-4"
            >
              See every agent step. Stop slow runs and surprise bills
              <span className="text-[var(--accent-spark)]">.</span>
            </h1>

            <p className="mt-3 max-w-[46ch] text-[14px] leading-[1.6] text-[var(--ink-secondary)] md:text-[14.5px] lg:mt-4 lg:max-w-[50ch] lg:text-[16px] lg:leading-[1.65]">
              Real-time trace inspection, automatic PII and loop guardrails, and
              exact per-run token costs for production AI agents.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-2.5 sm:mt-6 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
              <a
                href="#demo"
                className="btn-tactile inline-flex min-h-[46px] items-center justify-center rounded-full bg-[var(--btn-primary-bg)] px-4 text-center text-[14px] font-medium text-[var(--btn-primary-ink)] sm:px-6 sm:text-[14.5px] [@media(hover:hover)]:hover:bg-[var(--btn-primary-bg-hover)]"
              >
                Book a demo
              </a>

              <button
                type="button"
                onClick={handleJumpToSandbox}
                className="btn-tactile group inline-flex min-h-[46px] cursor-pointer items-center justify-center gap-1.5 rounded-full border border-[var(--border-whisper)] bg-[var(--bg-surface)] px-4 text-center text-[14px] font-medium text-[var(--ink-primary)] sm:px-5 sm:text-[14.5px] [@media(hover:hover)]:hover:border-[var(--border-hover)]"
              >
                <span className="sm:hidden">Live preview</span>
                <span className="hidden sm:inline">Try the live preview</span>
                <ArrowDown
                  aria-hidden="true"
                  className="h-4 w-4 shrink-0 text-[var(--accent-spark)] transition-transform duration-200 [@media(hover:hover)]:group-hover:translate-y-0.5"
                  strokeWidth={1.75}
                />
              </button>
            </div>
          </div>

          <div className="h-[235px] w-full sm:h-[310px] lg:col-span-5 lg:h-[380px]">
            <NeuralBrain />
          </div>
        </div>

        {/* Full-Width Interactive Live Trace Sandbox */}
        <div
          id="sandbox"
          className="surface-fade mt-4 scroll-mt-20 overflow-hidden rounded-2xl border border-[var(--border-whisper)] bg-[var(--bg-surface)] sm:mt-6 sm:rounded-3xl md:mt-8 md:scroll-mt-24"
          style={{ boxShadow: "var(--shadow-stage)" }}
        >
          <div className="sr-only" aria-live="polite" aria-atomic="true">
            {`${evaluated.label} trace ${evaluated.traceId}: total latency ${formatLatencyMs(evaluated.totalLatencyMs)}, run cost ${formatCostUsd(evaluated.totalCostUsd)}, status ${evaluated.status}, ${evaluated.activeGuardrailCount} of 3 guardrails active.`}
          </div>

          <div className="flex flex-col gap-3.5 border-b border-[var(--border-whisper)] px-4 py-4 md:flex-row md:items-center md:justify-between md:px-8 md:py-5">
            <div className="w-full md:w-auto">
              <SegmentedControl
                options={scenarioOptions}
                value={scenarioId}
                onChange={handleScenarioChange}
                ariaLabel="Select simulated agent trace scenario"
                layoutId="hero-scenario-selector"
                fullWidth
              />
            </div>

            <div className="grid grid-cols-[1fr_1fr_auto] items-center gap-2 rounded-2xl border border-[var(--border-whisper)] bg-[var(--bg-surface-subtle)] px-3.5 py-2.5 md:flex md:items-center md:gap-5 md:rounded-none md:border-0 md:bg-transparent md:p-0">
              <div className="flex flex-col">
                <span className="text-[11px] font-medium text-[var(--ink-muted)] lg:text-[11.5px]">
                  Latency
                </span>
                <span
                  className="tabular-telemetry text-[14.5px] font-medium md:min-w-[74px] md:text-[15px]"
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

              <div className="flex flex-col border-l border-[var(--border-whisper)] pl-3 md:border-l md:pl-5">
                <span className="text-[11px] font-medium text-[var(--ink-muted)] lg:text-[11.5px]">
                  Run cost
                </span>
                <span
                  className="tabular-telemetry text-[14.5px] font-medium md:min-w-[58px] md:text-[15px]"
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

              <div className="justify-self-end">
                <QuietStatusPill tone={evaluated.statusTone}>
                  {evaluated.status}
                </QuietStatusPill>
              </div>
            </div>
          </div>

          <div
            ref={firstSwitchRef}
            className="border-b border-[var(--border-whisper)] bg-[var(--bg-surface-subtle)] px-4 py-4 md:px-8 md:py-5"
          >
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <span className="text-[12px] font-medium text-[var(--ink-secondary)] lg:text-[12.5px]">
                Inline guardrails{" "}
                <span className="tabular-telemetry ml-1">
                  ({evaluated.activeGuardrailCount}/3)
                </span>
              </span>
              <span
                className="text-[12px] font-medium lg:text-[12.5px]"
                style={{
                  color:
                    evaluated.status === "Healthy"
                      ? "var(--status-pass-text)"
                      : "var(--accent-spark-text)",
                  transition: "color 240ms var(--ease-enter)",
                }}
              >
                {evaluated.status === "Healthy"
                  ? `Stabilized — ${latencyDropPct}% faster`
                  : "Flip switches to stabilize trace"}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2 md:grid-cols-3 md:gap-3">
              {GUARDRAIL_CONTROLS.map((ctrl) => {
                const isOn = guardrails[ctrl.key];
                const switchId = `hero-switch-${ctrl.key}`;
                const captionId = `hero-caption-${ctrl.key}`;

                return (
                  <div
                    key={ctrl.key}
                    className={`surface-fade flex min-h-[54px] items-center justify-between gap-3 rounded-xl border bg-[var(--bg-surface-solid)] px-3.5 py-2.5 sm:rounded-2xl sm:px-4 sm:py-3 ${
                      isOn
                        ? "border-[var(--accent-brand)]"
                        : "border-[var(--border-whisper)]"
                    }`}
                  >
                    <label
                      htmlFor={switchId}
                      className="flex min-w-0 flex-1 cursor-pointer flex-col"
                    >
                      <span className="text-[13.5px] font-medium leading-snug text-[var(--ink-primary)]">
                        {ctrl.label}
                      </span>
                      <span
                        id={captionId}
                        className="text-[11.5px] leading-snug text-[var(--ink-muted)] lg:text-[12px]"
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
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between border-b border-[var(--border-whisper)] px-4 py-2 text-[11px] font-medium text-[var(--ink-muted)] md:hidden">
              <span>Tap any step to inspect JSON</span>
              <span className="tabular-telemetry">Time · Cost</span>
            </div>

            <div className="hidden items-center justify-between border-b border-[var(--border-whisper)] px-8 py-2.5 text-[11.5px] font-medium text-[var(--ink-secondary)] md:flex">
              <div className="flex items-center gap-3">
                <span>Trace step (click any row to inspect JSON)</span>
                <span className="tabular-telemetry hidden text-[11px] font-normal text-[var(--ink-muted)] lg:inline">
                  Alt+1/2 scenario · Alt+M audio
                </span>
              </div>
              <div className="flex items-center gap-6 pr-7">
                <span className="w-[168px]">Waterfall timeline</span>
                <span className="w-[62px] text-right">Time</span>
                <span className="w-[56px] text-right">Cost</span>
              </div>
            </div>

            <ul className="divide-y divide-[var(--border-whisper)]">
              {waterfallItems.map(({ span, startPct, widthPct }, spanIdx) => {
                const isExpanded = expandedSpanId === span.id;
                const panelId = `span-json-${span.id}`;
                const isCopied = copiedSpanId === span.id;

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
                      className={`group w-full cursor-pointer px-4 py-3.5 text-left transition-colors duration-200 md:flex md:min-h-[56px] md:items-center md:justify-between md:gap-3 md:px-8 ${
                        isExpanded
                          ? "bg-[var(--bg-surface-subtle)]"
                          : "bg-transparent [@media(hover:hover)]:hover:bg-[var(--bg-surface-subtle)]/55"
                      }`}
                    >
                      {/* Phone-Native 3-Line Span Row (< 768px) */}
                      <div
                        className={`md:hidden ${span.depth === 1 ? "pl-3" : ""}`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex min-w-0 items-center gap-2">
                            <span
                              aria-hidden="true"
                              className="h-1.5 w-1.5 shrink-0 rounded-full"
                              style={{
                                backgroundColor: getSpanDotColor(span.tone),
                                transition:
                                  "background-color 240ms var(--ease-enter)",
                              }}
                            />
                            <span
                              translate="no"
                              className="tabular-telemetry truncate text-[13px] font-medium text-[var(--ink-primary)]"
                            >
                              {span.name}
                            </span>
                          </div>

                          <div className="flex shrink-0 items-center gap-2">
                            <span className="tabular-telemetry text-[12.5px] font-medium text-[var(--ink-primary)]">
                              {formatLatencyMs(span.latencyMs)}
                            </span>
                            <span className="tabular-telemetry text-[11px] text-[var(--ink-muted)]">
                              {formatCostUsd(span.costUsd)}
                            </span>
                            <ChevronDown
                              aria-hidden="true"
                              className="h-4 w-4 shrink-0 text-[var(--ink-secondary)]"
                              strokeWidth={1.75}
                              style={{
                                transform: isExpanded
                                  ? "rotate(180deg)"
                                  : "rotate(0deg)",
                                transition: "transform 220ms var(--ease-enter)",
                              }}
                            />
                          </div>
                        </div>

                        <p
                          className="mt-1 pl-3.5 text-[11.5px] leading-snug"
                          style={{
                            color:
                              span.tone === "warn"
                                ? "var(--status-warn-text)"
                                : span.tone === "pass"
                                  ? "var(--status-pass-text)"
                                  : "var(--ink-muted)",
                          }}
                        >
                          {span.note}
                        </p>

                        <div
                          className="relative mt-2 ml-3.5 h-1.5 overflow-hidden rounded-[2px]"
                          style={{
                            backgroundColor: isExpanded
                              ? "var(--bg-surface-solid)"
                              : "var(--bg-surface-subtle)",
                          }}
                        >
                          <m.div
                            initial={
                              prefersReducedMotion
                                ? false
                                : { x: `${startPct}%`, scaleX: 0 }
                            }
                            animate={{
                              x: `${startPct}%`,
                              scaleX: widthPct / 100,
                            }}
                            transition={
                              prefersReducedMotion
                                ? REDUCED_TRANSITION
                                : {
                                    ...TACTILE_SPRING,
                                    delay: 0.05 + spanIdx * 0.03,
                                  }
                            }
                            className="absolute inset-0 w-full rounded-[2px] will-change-transform"
                            style={{
                              transformOrigin: "left center",
                              backgroundColor: getSpanBarColor(span.tone),
                            }}
                          />
                        </div>
                      </div>

                      {/* Desktop Span Row (>= 768px) */}
                      <div
                        className={`hidden min-w-0 flex-1 items-center gap-3 md:flex ${
                          span.depth === 1 ? "pl-5" : ""
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className="h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{
                            backgroundColor: getSpanDotColor(span.tone),
                            transition:
                              "background-color 240ms var(--ease-enter)",
                          }}
                        />

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
                            <span
                              translate="no"
                              className="tabular-telemetry truncate text-[13.5px] font-medium text-[var(--ink-primary)]"
                            >
                              {span.name}
                            </span>
                            <span
                              className="truncate text-[11.5px] lg:text-[12px]"
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
                        </div>
                      </div>

                      <div className="hidden shrink-0 items-center gap-6 md:flex">
                        <div
                          className="relative h-1.5 w-[168px] overflow-hidden rounded-[2px]"
                          style={{
                            backgroundColor: isExpanded
                              ? "var(--bg-surface-solid)"
                              : "var(--bg-surface-subtle)",
                          }}
                        >
                          <m.div
                            initial={
                              prefersReducedMotion
                                ? false
                                : { x: `${startPct}%`, scaleX: 0 }
                            }
                            animate={{
                              x: `${startPct}%`,
                              scaleX: widthPct / 100,
                            }}
                            transition={
                              prefersReducedMotion
                                ? REDUCED_TRANSITION
                                : {
                                    ...TACTILE_SPRING,
                                    delay: 0.05 + spanIdx * 0.03,
                                  }
                            }
                            className="absolute inset-0 w-full rounded-[2px] will-change-transform"
                            style={{
                              transformOrigin: "left center",
                              backgroundColor: getSpanBarColor(span.tone),
                            }}
                          />
                        </div>

                        <span className="tabular-telemetry w-[62px] text-right text-[13px] font-medium text-[var(--ink-primary)]">
                          {formatLatencyMs(span.latencyMs)}
                        </span>

                        <span className="tabular-telemetry w-[56px] text-right text-[12px] text-[var(--ink-secondary)] lg:text-[12.5px]">
                          {formatCostUsd(span.costUsd)}
                        </span>

                        <ChevronDown
                          aria-hidden="true"
                          className="h-4 w-4 shrink-0 text-[var(--ink-secondary)]"
                          strokeWidth={1.75}
                          style={{
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
                        <m.div
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
                          <div className="px-4 pt-1 pb-4 md:px-8 md:pb-6">
                            <div className="overflow-hidden rounded-2xl border border-[var(--border-whisper)] bg-[var(--code-bg)]">
                              <div className="flex items-center justify-between gap-2 border-b border-[var(--border-whisper)] px-3.5 py-2 sm:px-4 sm:py-2.5">
                                <div className="tabular-telemetry flex min-w-0 items-center gap-2 text-[11px] text-[var(--ink-muted)] sm:gap-3 lg:text-[12px]">
                                  <span translate="no" className="truncate">
                                    {evaluated.traceId}
                                  </span>
                                  <span aria-hidden="true">·</span>
                                  <span className="shrink-0">
                                    {span.tokens.toLocaleString("en-US")} tok
                                  </span>
                                  <span
                                    aria-hidden="true"
                                    className="hidden sm:inline"
                                  >
                                    ·
                                  </span>
                                  <span className="hidden shrink-0 sm:inline">
                                    {formatCostUsd(span.costUsd)}
                                  </span>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => void handleCopySpanJson(span)}
                                  className={`btn-tactile inline-grid min-h-[36px] shrink-0 cursor-pointer items-center justify-items-center rounded-full border bg-[var(--bg-surface-solid)] px-3 text-[12px] font-medium [@media(hover:hover)]:hover:border-[var(--border-hover)] ${
                                    isCopied
                                      ? "border-[var(--status-pass-dot)] text-[var(--status-pass-text)]"
                                      : "border-[var(--border-whisper)] text-[var(--ink-primary)]"
                                  }`}
                                >
                                  <span
                                    aria-hidden={isCopied}
                                    className={`col-start-1 row-start-1 inline-flex items-center gap-1.5 transition-opacity duration-150 ${
                                      isCopied ? "opacity-0" : "opacity-100"
                                    }`}
                                  >
                                    <Copy className="h-3.5 w-3.5 shrink-0" />
                                    <span>Copy JSON</span>
                                  </span>
                                  <span
                                    aria-hidden={!isCopied}
                                    className={`col-start-1 row-start-1 inline-flex items-center gap-1.5 transition-opacity duration-150 ${
                                      isCopied ? "opacity-100" : "opacity-0"
                                    }`}
                                  >
                                    <Check className="h-3.5 w-3.5 shrink-0 text-[var(--status-pass-text)]" />
                                    <span>Copied</span>
                                  </span>
                                </button>
                              </div>

                              <pre
                                translate="no"
                                className="tabular-telemetry overflow-x-auto p-3.5 text-[11.5px] leading-[1.65] text-[var(--ink-primary)] sm:p-4 sm:text-[12.5px]"
                              >
                                <code>{renderHighlightedJson(span.payload)}</code>
                              </pre>
                            </div>
                          </div>
                        </m.div>
                      )}
                    </AnimatePresence>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}