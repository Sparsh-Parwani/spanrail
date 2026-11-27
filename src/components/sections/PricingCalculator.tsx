"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { animate } from "framer-motion";
import { ArrowRight, Check, Link2, Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import {
  EVAL_TIERS,
  INCLUDED_EVALS,
  INCLUDED_SEATS,
  INCLUDED_TRACES,
  MAX_SEATS,
  MIN_SEATS,
  PRICE_PER_EXTRA_SEAT,
  RETENTION_OPTIONS,
  TRACE_TIERS,
  calculatePricing,
  formatUsd,
  parsePricingFromSearch,
  serializePricingToQuery,
  type BillingCycle,
  type RetentionDays,
} from "@/lib/pricing";
import { useSpanrailStore } from "@/store/useSpanrailStore";
import {
  playSliderTick,
  playSuccessConfirm,
  playSwitchClick,
} from "@/lib/sound";
import { useBreakpoint } from "@/lib/useBreakpoint";
import { SegmentedControl, SoftSlider } from "@/components/ui/Primitives";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

export function PricingCalculator() {
  const traceTierIndex = useSpanrailStore((s) => s.traceTierIndex);
  const evalTierIndex = useSpanrailStore((s) => s.evalTierIndex);
  const retentionDays = useSpanrailStore((s) => s.retentionDays);
  const seats = useSpanrailStore((s) => s.seats);
  const billingCycle = useSpanrailStore((s) => s.billingCycle);

  const setTraceTierIndex = useSpanrailStore((s) => s.setTraceTierIndex);
  const setEvalTierIndex = useSpanrailStore((s) => s.setEvalTierIndex);
  const setRetentionDays = useSpanrailStore((s) => s.setRetentionDays);
  const setSeats = useSpanrailStore((s) => s.setSeats);
  const setBillingCycle = useSpanrailStore((s) => s.setBillingCycle);
  const hydratePricing = useSpanrailStore((s) => s.hydratePricing);

  const { prefersReducedMotion } = useBreakpoint();
  const [copiedUrl, setCopiedUrl] = useState(false);
  const copyTimerRef = useRef<number | null>(null);
  const hasInteractedRef = useRef(false);

  const breakdown = useMemo(
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

  // Initialize directly to real SSR total ($119/mo) so SSR HTML is 100% consistent
  const [displayTotal, setDisplayTotal] = useState(breakdown.monthlyTotalUsd);
  const prevTotalRef = useRef(breakdown.monthlyTotalUsd);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const parsed = parsePricingFromSearch(window.location.search);
    if (parsed) {
      hydratePricing(parsed);
    }
  }, [hydratePricing]);

  useEffect(() => {
    if (!hasInteractedRef.current) return;
    const merged = new URLSearchParams(window.location.search);
    const pricingParams = new URLSearchParams(
      serializePricingToQuery({
        traceTierIndex,
        evalTierIndex,
        retentionDays,
        seats,
        billingCycle,
      })
    );
    pricingParams.forEach((value, key) => merged.set(key, value));
    const nextUrl = `${window.location.pathname}?${merged.toString()}${window.location.hash}`;
    window.history.replaceState(null, "", nextUrl);
  }, [traceTierIndex, evalTierIndex, retentionDays, seats, billingCycle]);

  // Animate total smoothly whenever user interacts with sliders/controls
  useEffect(() => {
    const from = prevTotalRef.current;
    const to = breakdown.monthlyTotalUsd;
    prevTotalRef.current = to;
    if (from === to) return;

    if (prefersReducedMotion) {
      setDisplayTotal(to);
      return;
    }

    const ctrl = animate(from, to, {
      duration: 0.28,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplayTotal(Math.round(v)),
      onComplete: () => setDisplayTotal(to),
    });
    return () => ctrl.stop();
  }, [breakdown.monthlyTotalUsd, prefersReducedMotion]);

  const handleCopyEstimateLink = async () => {
    try {
      const query = serializePricingToQuery({
        traceTierIndex,
        evalTierIndex,
        retentionDays,
        seats,
        billingCycle,
      });
      const shareUrl = `${window.location.origin}${window.location.pathname}${query}#pricing`;
      await navigator.clipboard.writeText(shareUrl);
      setCopiedUrl(true);
      playSuccessConfirm();
      toast.success("Estimate link copied to clipboard");
      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current);
      }
      copyTimerRef.current = window.setTimeout(() => setCopiedUrl(false), 1800);
    } catch {
      toast.error("Unable to copy estimate link.");
    }
  };

  return (
    <section
      id="pricing"
      aria-labelledby="pricing-heading"
      className="scroll-mt-20 py-14 md:py-20"
    >
      <div className="spanrail-container">
        <ScrollReveal>
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between md:gap-6">
            <div className="max-w-[560px]">
              <h2 id="pricing-heading" className="display-h2">
                Simple usage pricing. Zero surprise overages.
              </h2>
              <p
                className="mt-3 max-w-[48ch] text-[15.5px] leading-[1.65] md:text-[17px]"
                style={{ color: "var(--ink-secondary)" }}
              >
                Metered strictly on traces and automated evals. Adjust volume
                below to preview exact monthly spend.
              </p>
            </div>

            <div className="w-full shrink-0 sm:w-auto sm:min-w-[244px]">
              <SegmentedControl<BillingCycle>
                options={[
                  { value: "monthly", label: "Monthly" },
                  { value: "annual", label: "Annual", sublabel: "-20%" },
                ]}
                value={billingCycle}
                onChange={(next) => {
                  hasInteractedRef.current = true;
                  setBillingCycle(next);
                  playSwitchClick(next === "annual");
                }}
                ariaLabel="Select billing cycle"
                layoutId="pricing-billing-cycle"
                fullWidth
                size="md"
              />
            </div>
          </div>

          {/* Mobile Sticky Live Estimate Pill */}
          <div
            className="sticky top-[62px] z-20 mt-6 mb-4 flex items-center justify-between gap-3 rounded-2xl border px-3.5 py-2.5 md:hidden"
            style={{
              backgroundColor: "var(--bg-nav-glass)",
              borderColor: "var(--border-whisper)",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <div className="min-w-0">
              <span
                className="block truncate text-[11.5px] font-medium"
                style={{ color: "var(--ink-secondary)" }}
              >
                {breakdown.tracesLabel} traces · {breakdown.retentionDays}d ·{" "}
                {breakdown.seats} seats
              </span>
              <span
                className="block truncate text-[12px]"
                style={{ color: "var(--status-pass-text)" }}
              >
                Save {formatUsd(breakdown.monthlySavingsVsLegacyUsd)}/mo vs list APM
              </span>
            </div>
            <div className="tabular-telemetry shrink-0 text-right">
              <span
                className="text-[21px] font-medium"
                style={{ color: "var(--ink-primary)" }}
              >
                {formatUsd(displayTotal)}
              </span>
              <span
                className="text-[12px]"
                style={{ color: "var(--ink-secondary)" }}
              >
                /mo
              </span>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 items-stretch gap-5 md:mt-10 md:grid-cols-12 md:gap-6 lg:gap-8">
            {/* Controls Column */}
            <div
              className="surface-fade flex flex-col justify-between space-y-7 rounded-2xl border p-4 sm:rounded-3xl sm:p-6 md:col-span-7 md:space-y-8 md:p-8"
              style={{
                backgroundColor: "var(--bg-surface)",
                borderColor: "var(--border-whisper)",
                boxShadow: "var(--shadow-card)",
              }}
            >
              {/* Traces Slider */}
              <div>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span
                    id="label-traces"
                    className="text-[15px] font-medium"
                    style={{ color: "var(--ink-primary)" }}
                  >
                    Monthly agent traces
                  </span>
                  <span
                    className="tabular-telemetry text-[16px] font-medium"
                    style={{ color: "var(--accent-brand-text)" }}
                  >
                    {breakdown.tracesLabel} / mo
                  </span>
                </div>
                <p
                  className="mt-1 text-[13px] leading-[1.5]"
                  style={{ color: "var(--ink-secondary)" }}
                >
                  First {(INCLUDED_TRACES / 1000).toFixed(0)}k traces included.
                  $0.18 per 10k up to 10M, then $0.12 per 10k.
                </p>

                <div className="mt-3" id="slider-traces">
                  <SoftSlider
                    value={traceTierIndex}
                    min={0}
                    max={TRACE_TIERS.length - 1}
                    step={1}
                    ariaLabelledBy="label-traces"
                    ariaValueText={`${breakdown.tracesLabel} traces per month`}
                    onValueChange={(next) => {
                      if (next !== traceTierIndex) {
                        hasInteractedRef.current = true;
                        setTraceTierIndex(next);
                        playSliderTick();
                      }
                    }}
                  />
                  <div
                    className="tabular-telemetry mt-1 flex items-center justify-between text-[11.5px]"
                    style={{ color: "var(--ink-secondary)" }}
                  >
                    {TRACE_TIERS.map((tier, idx) => (
                      <button
                        key={tier.label}
                        type="button"
                        onClick={() => {
                          hasInteractedRef.current = true;
                          setTraceTierIndex(idx);
                          playSliderTick();
                        }}
                        className={`min-h-[32px] cursor-pointer rounded px-1.5 py-1 [@media(hover:hover)]:hover:text-[var(--ink-primary)] ${
                          idx % 2 === 1 && idx !== TRACE_TIERS.length - 1
                            ? "hidden sm:inline-flex sm:items-center"
                            : "inline-flex items-center"
                        }`}
                        style={{
                          color:
                            idx === traceTierIndex
                              ? "var(--ink-primary)"
                              : "var(--ink-secondary)",
                          fontWeight: idx === traceTierIndex ? 500 : 400,
                        }}
                      >
                        {tier.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <hr style={{ borderColor: "var(--border-whisper)" }} />

              {/* Evals Slider */}
              <div>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span
                    id="label-evals"
                    className="text-[15px] font-medium"
                    style={{ color: "var(--ink-primary)" }}
                  >
                    Automated eval runs
                  </span>
                  <span
                    className="tabular-telemetry text-[16px] font-medium"
                    style={{ color: "var(--accent-brand-text)" }}
                  >
                    {breakdown.evalsLabel} / mo
                  </span>
                </div>
                <p
                  className="mt-1 text-[13px] leading-[1.5]"
                  style={{ color: "var(--ink-secondary)" }}
                >
                  First {(INCLUDED_EVALS / 1000).toFixed(0)}k evals included.
                  $0.40 per 10k additional online or CI eval runs.
                </p>

                <div className="mt-3" id="slider-evals">
                  <SoftSlider
                    value={evalTierIndex}
                    min={0}
                    max={EVAL_TIERS.length - 1}
                    step={1}
                    ariaLabelledBy="label-evals"
                    ariaValueText={`${breakdown.evalsLabel} evaluation runs per month`}
                    onValueChange={(next) => {
                      if (next !== evalTierIndex) {
                        hasInteractedRef.current = true;
                        setEvalTierIndex(next);
                        playSliderTick();
                      }
                    }}
                  />
                  <div
                    className="tabular-telemetry mt-1 flex items-center justify-between text-[11.5px]"
                    style={{ color: "var(--ink-secondary)" }}
                  >
                    {EVAL_TIERS.map((tier, idx) => (
                      <button
                        key={tier.label}
                        type="button"
                        onClick={() => {
                          hasInteractedRef.current = true;
                          setEvalTierIndex(idx);
                          playSliderTick();
                        }}
                        className="inline-flex min-h-[32px] cursor-pointer items-center rounded px-1.5 py-1 [@media(hover:hover)]:hover:text-[var(--ink-primary)]"
                        style={{
                          color:
                            idx === evalTierIndex
                              ? "var(--ink-primary)"
                              : "var(--ink-secondary)",
                          fontWeight: idx === evalTierIndex ? 500 : 400,
                        }}
                      >
                        {tier.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <hr style={{ borderColor: "var(--border-whisper)" }} />

              {/* Retention Selector (Stacked 3-column mobile segmented tiles -> inline pill on >=640px) */}
              <div>
                <div className="mb-3 flex flex-wrap items-baseline justify-between gap-1.5">
                  <span
                    className="text-[15px] font-medium"
                    style={{ color: "var(--ink-primary)" }}
                  >
                    Trace retention
                  </span>
                  <span
                    className="text-[12.5px] sm:text-[13px]"
                    style={{ color: "var(--ink-secondary)" }}
                  >
                    Applied to trace storage subtotal
                  </span>
                </div>

                <SegmentedControl<`${RetentionDays}`>
                  options={RETENTION_OPTIONS.map((opt) => ({
                    value: `${opt.days}` as `${RetentionDays}`,
                    label: opt.label,
                    sublabel: opt.badge,
                  }))}
                  value={`${retentionDays}`}
                  onChange={(next) => {
                    hasInteractedRef.current = true;
                    setRetentionDays(Number(next) as RetentionDays);
                    playSwitchClick(true);
                  }}
                  ariaLabel="Select trace retention period"
                  layoutId="pricing-retention-selector"
                  fullWidth
                  size="md"
                  stackSublabelOnMobile
                />
              </div>

              <hr style={{ borderColor: "var(--border-whisper)" }} />

              {/* Team Seats Stepper (Full-width locked 44px-1fr-44px mobile bar -> inline desktop row) */}
              <div className="flex flex-col gap-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <div>
                  <span
                    className="block text-[15px] font-medium"
                    style={{ color: "var(--ink-primary)" }}
                  >
                    Team seats
                  </span>
                  <span
                    className="mt-0.5 block text-[13px]"
                    style={{ color: "var(--ink-secondary)" }}
                  >
                    First {INCLUDED_SEATS} seats included · $
                    {PRICE_PER_EXTRA_SEAT}/seat above {INCLUDED_SEATS}
                  </span>
                </div>

                <div
                  className="grid w-full grid-cols-[44px_1fr_44px] items-center rounded-2xl border p-1.5 sm:inline-flex sm:w-auto sm:gap-3 sm:rounded-none sm:border-0 sm:bg-transparent sm:p-0"
                  style={{
                    backgroundColor: "var(--bg-surface-subtle)",
                    borderColor: "var(--border-whisper)",
                  }}
                >
                  <button
                    type="button"
                    disabled={seats <= MIN_SEATS}
                    onClick={() => {
                      hasInteractedRef.current = true;
                      setSeats(seats - 1);
                      playSwitchClick(false);
                    }}
                    aria-label="Decrease team seats"
                    className="btn-tactile inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl border sm:rounded-full [@media(hover:hover)]:hover:border-[var(--border-hover)] disabled:cursor-not-allowed disabled:opacity-40"
                    style={{
                      backgroundColor: "var(--bg-surface)",
                      borderColor: "var(--border-whisper)",
                      color: "var(--ink-primary)",
                    }}
                  >
                    <Minus className="h-4 w-4" strokeWidth={1.8} />
                  </button>

                  <span
                    aria-live="polite"
                    className="tabular-telemetry min-w-[36px] text-center text-[16px] font-medium"
                    style={{ color: "var(--ink-primary)" }}
                  >
                    {seats}
                    <span
                      className="ml-1.5 text-[12.5px] font-normal sm:hidden"
                      style={{ color: "var(--ink-secondary)" }}
                    >
                      {seats === 1 ? "seat" : "seats"}
                    </span>
                  </span>

                  <button
                    type="button"
                    disabled={seats >= MAX_SEATS}
                    onClick={() => {
                      hasInteractedRef.current = true;
                      setSeats(seats + 1);
                      playSwitchClick(true);
                    }}
                    aria-label="Increase team seats"
                    className="btn-tactile inline-flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl border sm:rounded-full [@media(hover:hover)]:hover:border-[var(--border-hover)] disabled:cursor-not-allowed disabled:opacity-40"
                    style={{
                      backgroundColor: "var(--bg-surface)",
                      borderColor: "var(--border-whisper)",
                      color: "var(--ink-primary)",
                    }}
                  >
                    <Plus className="h-4 w-4" strokeWidth={1.8} />
                  </button>
                </div>
              </div>
            </div>

            {/* Summary Column */}
            <div className="flex flex-col md:col-span-5">
              <div
                className="surface-fade flex flex-1 flex-col justify-between rounded-2xl border p-5 sm:rounded-3xl sm:p-6 md:p-8"
                style={{
                  backgroundColor: "var(--bg-surface)",
                  borderColor: "var(--border-whisper)",
                  boxShadow: "var(--shadow-stage)",
                }}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="text-[13.5px] font-medium"
                      style={{ color: "var(--ink-secondary)" }}
                    >
                      Estimated monthly total
                    </span>
                    <span
                      className="shrink-0 rounded-full px-2.5 py-0.5 text-[12px] font-medium"
                      style={{
                        backgroundColor: "var(--accent-spark-soft)",
                        color: "var(--accent-spark-text)",
                      }}
                    >
                      {billingCycle === "annual" ? "Billed annually" : "Monthly"}
                    </span>
                  </div>

                  <div className="mt-3 flex items-baseline gap-1.5">
                    <span
                      className="tabular-telemetry text-[2.75rem] leading-none font-medium tracking-[-0.035em] md:text-[3.25rem]"
                      style={{ color: "var(--ink-primary)" }}
                    >
                      {formatUsd(displayTotal)}
                    </span>
                    <span
                      className="text-[15px]"
                      style={{ color: "var(--ink-secondary)" }}
                    >
                      /mo
                    </span>
                  </div>

                  <p
                    className="mt-2 min-h-[20px] text-[13px]"
                    style={{ color: "var(--ink-secondary)" }}
                  >
                    {billingCycle === "annual"
                      ? `Saves ${formatUsd(breakdown.annualSavingsPerYearUsd)}/yr with annual billing`
                      : "Switch to annual billing to save 20%"}
                  </p>

                  <dl
                    className="mt-6 space-y-3 border-t pt-5 text-[13.5px]"
                    style={{ borderColor: "var(--border-whisper)" }}
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <dt style={{ color: "var(--ink-secondary)" }}>
                        Platform base
                      </dt>
                      <dd
                        className="tabular-telemetry font-medium"
                        style={{ color: "var(--ink-primary)" }}
                      >
                        {formatUsd(breakdown.platformBaseUsd)}
                      </dd>
                    </div>

                    <div className="flex items-baseline justify-between gap-3">
                      <dt style={{ color: "var(--ink-secondary)" }}>
                        Traces ({breakdown.tracesLabel})
                      </dt>
                      <dd
                        className="tabular-telemetry font-medium"
                        style={{ color: "var(--ink-primary)" }}
                      >
                        {breakdown.tracesBaseUsd === 0
                          ? "Included"
                          : formatUsd(breakdown.tracesBaseUsd)}
                      </dd>
                    </div>

                    <div className="flex items-baseline justify-between gap-3">
                      <dt style={{ color: "var(--ink-secondary)" }}>
                        Evaluations ({breakdown.evalsLabel})
                      </dt>
                      <dd
                        className="tabular-telemetry font-medium"
                        style={{ color: "var(--ink-primary)" }}
                      >
                        {breakdown.evalsUsd === 0
                          ? "Included"
                          : formatUsd(breakdown.evalsUsd)}
                      </dd>
                    </div>

                    <div className="flex items-baseline justify-between gap-3">
                      <dt style={{ color: "var(--ink-secondary)" }}>
                        Seats &amp; retention ({breakdown.seats} ·{" "}
                        {breakdown.retentionDays}d)
                      </dt>
                      <dd
                        className="tabular-telemetry font-medium"
                        style={{ color: "var(--ink-primary)" }}
                      >
                        {breakdown.seatsAndRetentionUsd === 0
                          ? "Included"
                          : formatUsd(breakdown.seatsAndRetentionUsd)}
                      </dd>
                    </div>

                    {billingCycle === "annual" && (
                      <div
                        className="flex items-baseline justify-between gap-3 border-t pt-3"
                        style={{ borderColor: "var(--border-whisper)" }}
                      >
                        <dt style={{ color: "var(--status-pass-text)" }}>
                          Annual discount (-20%)
                        </dt>
                        <dd
                          className="tabular-telemetry font-medium"
                          style={{ color: "var(--status-pass-text)" }}
                        >
                          -
                          {formatUsd(
                            breakdown.monthlyUndiscountedUsd -
                              breakdown.monthlyTotalUsd
                          )}
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>

                <div className="mt-6">
                  <div
                    className="flex items-start gap-2.5 rounded-xl p-3.5 text-[12.5px] leading-[1.5]"
                    style={{
                      backgroundColor: "var(--status-pass-soft)",
                      color: "var(--status-pass-text)",
                    }}
                  >
                    <span
                      aria-hidden="true"
                      className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: "var(--status-pass-dot)" }}
                    />
                    <span>
                      Est.{" "}
                      <span className="tabular-telemetry font-medium">
                        {formatUsd(breakdown.monthlySavingsVsLegacyUsd)}/mo
                      </span>{" "}
                      below metered host + custom-metric APM list rates (e.g.
                      Datadog / New Relic).
                    </span>
                  </div>

                  <div className="mt-5 flex flex-col gap-2.5">
                    <a
                      href="#demo"
                      className="btn-tactile flex min-h-[48px] w-full items-center justify-center rounded-full px-5 text-center text-[14.5px] font-medium [@media(hover:hover)]:hover:bg-[var(--btn-primary-bg-hover)]"
                      style={{
                        backgroundColor: "var(--btn-primary-bg)",
                        color: "var(--btn-primary-ink)",
                      }}
                    >
                      Configure sandbox &amp; book briefing
                    </a>

                    <button
                      type="button"
                      onClick={() => void handleCopyEstimateLink()}
                      className="btn-tactile inline-grid min-h-[44px] w-full cursor-pointer items-center justify-items-center rounded-full text-[13px] font-medium [@media(hover:hover)]:hover:text-[var(--ink-primary)]"
                      style={{ color: "var(--ink-secondary)" }}
                    >
                      <span
                        aria-hidden={copiedUrl}
                        className={`col-start-1 row-start-1 inline-flex items-center gap-1.5 transition-opacity duration-150 ${
                          copiedUrl ? "opacity-0" : "opacity-100"
                        }`}
                      >
                        <Link2 className="h-3.5 w-3.5 shrink-0" />
                        <span>Copy estimate link</span>
                      </span>
                      <span
                        aria-hidden={!copiedUrl}
                        className={`col-start-1 row-start-1 inline-flex items-center gap-1.5 transition-opacity duration-150 ${
                          copiedUrl ? "opacity-100" : "opacity-0"
                        }`}
                        style={{ color: "var(--status-pass-text)" }}
                      >
                        <Check className="h-3.5 w-3.5 shrink-0" />
                        <span>Estimate link copied</span>
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Enterprise / VPC Bar */}
          <div
            className="surface-fade mt-5 flex flex-col items-start justify-between gap-5 rounded-2xl border px-5 py-5 sm:mt-6 sm:rounded-3xl sm:px-6 sm:py-6 md:flex-row md:items-center md:gap-6 md:px-8 md:py-7"
            style={{
              backgroundColor: "var(--bg-surface)",
              borderColor: "var(--border-whisper)",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <div className="max-w-[660px]">
              <h3
                className="text-[17px] font-medium tracking-[-0.015em]"
                style={{ color: "var(--ink-primary)" }}
              >
                50M+ traces or VPC deployment?
              </h3>
              <p
                className="mt-1.5 text-[14px] leading-[1.6] sm:text-[14.5px]"
                style={{ color: "var(--ink-secondary)" }}
              >
                Dedicated cluster, HIPAA BAA, custom retention windows, and a
                direct Slack channel with our systems team.
              </p>
            </div>

            <Link
              href="/security"
              className="btn-tactile group inline-flex min-h-[46px] w-full shrink-0 items-center justify-center gap-2 rounded-full border px-5 text-[14px] font-medium sm:w-auto [@media(hover:hover)]:hover:border-[var(--border-hover)]"
              style={{
                backgroundColor: "var(--bg-surface-solid)",
                borderColor: "var(--border-whisper)",
                color: "var(--ink-primary)",
              }}
            >
              <span>Security &amp; VPC specs</span>
              <ArrowRight
                aria-hidden="true"
                className="h-4 w-4 shrink-0 transition-transform duration-200 [@media(hover:hover)]:group-hover:translate-x-0.5"
                strokeWidth={1.85}
                style={{ color: "var(--accent-spark)" }}
              />
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}