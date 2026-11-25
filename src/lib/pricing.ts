import type { VolumeTier } from "@/lib/validation";

export type RetentionDays = 30 | 90 | 365;
export type BillingCycle = "monthly" | "annual";

export interface TraceTierOption {
  value: number;
  label: string;
}

export interface EvalTierOption {
  value: number;
  label: string;
}

export interface RetentionOption {
  days: RetentionDays;
  label: string;
  badge: string;
  multiplier: number;
}

export const TRACE_TIERS: readonly TraceTierOption[] = [
  { value: 100_000, label: "100k" },
  { value: 500_000, label: "500k" },
  { value: 1_000_000, label: "1M" },
  { value: 2_500_000, label: "2.5M" },
  { value: 5_000_000, label: "5M" },
  { value: 10_000_000, label: "10M" },
  { value: 25_000_000, label: "25M" },
  { value: 50_000_000, label: "50M+" },
] as const;

export const EVAL_TIERS: readonly EvalTierOption[] = [
  { value: 0, label: "0" },
  { value: 50_000, label: "50k" },
  { value: 250_000, label: "250k" },
  { value: 1_000_000, label: "1M" },
  { value: 5_000_000, label: "5M" },
] as const;

export const RETENTION_OPTIONS: readonly RetentionOption[] = [
  { days: 30, label: "30 days", badge: "Included", multiplier: 1.0 },
  { days: 90, label: "90 days", badge: "+15%", multiplier: 1.15 },
  { days: 365, label: "365 days", badge: "+35%", multiplier: 1.35 },
] as const;

export const MIN_SEATS = 1;
export const MAX_SEATS = 50;
export const INCLUDED_SEATS = 5;
export const PRICE_PER_EXTRA_SEAT = 24;
export const BASE_PLATFORM_USD = 99;
export const INCLUDED_TRACES = 250_000;
export const INCLUDED_EVALS = 25_000;
export const ANNUAL_DISCOUNT_MULTIPLIER = 0.8;

export interface PricingInput {
  traceTierIndex: number;
  evalTierIndex: number;
  retentionDays: RetentionDays;
  seats: number;
  billingCycle: BillingCycle;
}

export interface PricingBreakdown {
  tracesCount: number;
  tracesLabel: string;
  evalsCount: number;
  evalsLabel: string;
  retentionDays: RetentionDays;
  seats: number;
  billingCycle: BillingCycle;

  platformBaseUsd: number;
  tracesBaseUsd: number;
  tracesWithRetentionUsd: number;
  retentionUpliftUsd: number;
  evalsUsd: number;
  seatsUsd: number;
  seatsAndRetentionUsd: number;

  monthlyUndiscountedUsd: number;
  monthlyTotalUsd: number;
  annualSavingsPerYearUsd: number;

  legacyApmMonthlyUsd: number;
  monthlySavingsVsLegacyUsd: number;
}

/**
 * Deterministic Spanrail usage pricing formula:
 * - Base Platform: $99/mo (includes 250k traces, 25k evals, 5 seats)
 * - Extra Traces: $0.18 / 10k traces ($0.12 / 10k above 10M traces)
 * - Extra Evals: $0.40 / 10k evals
 * - Retention multiplier (1.0, 1.15, 1.35) applied to trace storage subtotal
 * - Team Seats: first 5 included, $24/seat above 5
 * - Annual billing applies 0.80 multiplier to monthly total
 */
export function calculatePricing(input: PricingInput): PricingBreakdown {
  const safeTraceIndex = Math.max(
    0,
    Math.min(TRACE_TIERS.length - 1, Math.round(input.traceTierIndex))
  );
  const safeEvalIndex = Math.max(
    0,
    Math.min(EVAL_TIERS.length - 1, Math.round(input.evalTierIndex))
  );
  const safeSeats = Math.max(MIN_SEATS, Math.min(MAX_SEATS, Math.round(input.seats)));

  const traceTier = TRACE_TIERS[safeTraceIndex]!;
  const evalTier = EVAL_TIERS[safeEvalIndex]!;
  const retentionOption =
    RETENTION_OPTIONS.find((opt) => opt.days === input.retentionDays) ??
    RETENTION_OPTIONS[0]!;

  // Piecewise extra trace pricing
  const tracesAboveIncluded = Math.max(0, traceTier.value - INCLUDED_TRACES);
  const standardBandCap = 10_000_000 - INCLUDED_TRACES; // 9,750,000 extra up to 10M total
  const standardBandTraces = Math.min(tracesAboveIncluded, standardBandCap);
  const highVolumeTraces = Math.max(0, tracesAboveIncluded - standardBandCap);

  const tracesBaseUsd =
    (standardBandTraces / 10_000) * 0.18 + (highVolumeTraces / 10_000) * 0.12;
  const tracesWithRetentionUsd = tracesBaseUsd * retentionOption.multiplier;
  const retentionUpliftUsd = tracesWithRetentionUsd - tracesBaseUsd;

  // Extra automated eval runs
  const evalsAboveIncluded = Math.max(0, evalTier.value - INCLUDED_EVALS);
  const evalsUsd = (evalsAboveIncluded / 10_000) * 0.4;

  // Additional team seats
  const extraSeats = Math.max(0, safeSeats - INCLUDED_SEATS);
  const seatsUsd = extraSeats * PRICE_PER_EXTRA_SEAT;
  const seatsAndRetentionUsd = seatsUsd + retentionUpliftUsd;

  const monthlyUndiscountedUsd =
    BASE_PLATFORM_USD + tracesWithRetentionUsd + evalsUsd + seatsUsd;

  const billingMultiplier =
    input.billingCycle === "annual" ? ANNUAL_DISCOUNT_MULTIPLIER : 1.0;

  const monthlyTotalUsd = Math.round(monthlyUndiscountedUsd * billingMultiplier);
  const annualSavingsPerYearUsd =
    input.billingCycle === "annual"
      ? Math.round((monthlyUndiscountedUsd - monthlyTotalUsd) * 12)
      : 0;

  // Realistic legacy APM comparison anchored to ~$4,850/mo at 10M traces
  const legacyTraceCost = (traceTier.value / 10_000) * 4.35;
  const legacyEvalCost = (evalTier.value / 10_000) * 1.15;
  const legacySeatCost = extraSeats * 45;
  const legacyBase = 500;
  const legacyApmMonthlyUsd = Math.round(
    (legacyBase + legacyTraceCost + legacyEvalCost + legacySeatCost) *
      retentionOption.multiplier
  );
  const monthlySavingsVsLegacyUsd = Math.max(
    180,
    legacyApmMonthlyUsd - monthlyTotalUsd
  );

  return {
    tracesCount: traceTier.value,
    tracesLabel: traceTier.label,
    evalsCount: evalTier.value,
    evalsLabel: evalTier.label,
    retentionDays: retentionOption.days,
    seats: safeSeats,
    billingCycle: input.billingCycle,

    platformBaseUsd: BASE_PLATFORM_USD,
    tracesBaseUsd: Math.round(tracesBaseUsd),
    tracesWithRetentionUsd: Math.round(tracesWithRetentionUsd),
    retentionUpliftUsd: Math.round(retentionUpliftUsd),
    evalsUsd: Math.round(evalsUsd),
    seatsUsd: Math.round(seatsUsd),
    seatsAndRetentionUsd: Math.round(seatsAndRetentionUsd),

    monthlyUndiscountedUsd: Math.round(monthlyUndiscountedUsd),
    monthlyTotalUsd,
    annualSavingsPerYearUsd,

    legacyApmMonthlyUsd,
    monthlySavingsVsLegacyUsd,
  };
}

export function mapTracesToDemoVolume(tracesCount: number): VolumeTier {
  if (tracesCount < 500_000) return "< 500k";
  if (tracesCount <= 5_000_000) return "500k – 5M";
  if (tracesCount <= 25_000_000) return "5M – 25M";
  return "25M+";
}

export function serializePricingToQuery(input: PricingInput): string {
  const traceTier = TRACE_TIERS[input.traceTierIndex] ?? TRACE_TIERS[3]!;
  const evalTier = EVAL_TIERS[input.evalTierIndex] ?? EVAL_TIERS[2]!;
  const params = new URLSearchParams({
    traces: String(traceTier.value),
    evals: String(evalTier.value),
    retention: String(input.retentionDays),
    seats: String(input.seats),
    billing: input.billingCycle,
  });
  return `?${params.toString()}`;
}

function findNearestIndex(
  target: number,
  options: readonly { value: number }[]
): number {
  let bestIndex = 0;
  let bestDelta = Infinity;
  options.forEach((opt, idx) => {
    const delta = Math.abs(opt.value - target);
    if (delta < bestDelta) {
      bestDelta = delta;
      bestIndex = idx;
    }
  });
  return bestIndex;
}

export function parsePricingFromSearch(search: string): PricingInput | null {
  const params = new URLSearchParams(search);
  const hasAny =
    params.has("traces") ||
    params.has("evals") ||
    params.has("retention") ||
    params.has("seats") ||
    params.has("billing");

  if (!hasAny) return null;

  const tracesRaw = Number(params.get("traces"));
  const evalsRaw = Number(params.get("evals"));
  const retentionRaw = Number(params.get("retention"));
  const seatsRaw = Number(params.get("seats"));
  const billingRaw = params.get("billing");

  const traceTierIndex =
    Number.isFinite(tracesRaw) && tracesRaw > 0
      ? findNearestIndex(tracesRaw, TRACE_TIERS)
      : 3;

  const evalTierIndex =
    Number.isFinite(evalsRaw) && evalsRaw >= 0
      ? findNearestIndex(evalsRaw, EVAL_TIERS)
      : 2;

  const retentionDays: RetentionDays =
    retentionRaw === 90 ? 90 : retentionRaw === 365 ? 365 : 30;

  const seats =
    Number.isFinite(seatsRaw) && seatsRaw >= MIN_SEATS
      ? Math.min(MAX_SEATS, Math.round(seatsRaw))
      : 5;

  const billingCycle: BillingCycle =
    billingRaw === "monthly" ? "monthly" : "annual";

  return {
    traceTierIndex,
    evalTierIndex,
    retentionDays,
    seats,
    billingCycle,
  };
}

export function formatUsd(amount: number): string {
  return `$${Math.round(amount).toLocaleString("en-US")}`;
}
