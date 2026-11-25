"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { useBreakpoint } from "@/lib/useBreakpoint";

export type PairedBarMeasure = {
  label: string;
  value: number;
  valueLabel?: string;
};

export type PairedBarGroup = {
  label: string;
  deltaBadge?: string;
  color?: string;
  secondaryColor?: string;
  a: PairedBarMeasure;
  b: PairedBarMeasure;
};

function GridLines({ ticks, max }: { ticks: number[]; max: number }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0">
      {ticks
        .filter((tick) => tick > 0 && tick < max)
        .map((tick) => (
          <span
            key={tick}
            className="absolute inset-y-0 border-l"
            style={{
              left: `${(tick / max) * 100}%`,
              borderColor: "var(--border-whisper)",
            }}
          />
        ))}
    </div>
  );
}

export function PairedBars({
  groups,
  max,
  unit = "",
  ticks,
  barLabel,
}: {
  groups: PairedBarGroup[];
  max?: number;
  unit?: string;
  ticks?: number[];
  barLabel?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const inView = useInView(containerRef, { once: true, amount: 0.2 });
  const { prefersReducedMotion } = useBreakpoint();

  const dataMax = Math.max(
    ...groups.flatMap((group) => [group.a.value, group.b.value]),
    1
  );
  const axisMax = max && max > 0 ? max : dataMax;
  const axisTicks = ticks ?? [0, axisMax / 3, (axisMax * 2) / 3, axisMax];
  const pct = (value: number) =>
    Math.max(2, Math.min(100, (value / axisMax) * 100));
  const formatTick = (value: number) =>
    Number.isInteger(value) ? String(value) : value.toFixed(1);

  return (
    <div
      ref={containerRef}
      className="surface-fade overflow-x-auto rounded-3xl border px-5 py-6 sm:px-8 md:py-7 [font-variant-numeric:tabular-nums]"
      style={{
        backgroundColor: "var(--bg-surface)",
        borderColor: "var(--border-whisper)",
        boxShadow: "var(--shadow-stage)",
        color: "var(--ink-primary)",
      }}
    >
      <div className="min-w-[600px]">
        <div
          className="tabular-telemetry grid grid-cols-[155px_minmax(250px,1fr)_120px] gap-x-4 border-b pb-2.5 text-[10px] uppercase tracking-[0.11em]"
          style={{
            borderColor: "var(--border-hover)",
            color: "var(--ink-secondary)",
          }}
        >
          <span>measurement</span>
          <span>{barLabel}</span>
          <span className="text-right">observed</span>
        </div>

        <div className="divide-y divide-[var(--border-whisper)]">
          {groups.map((group, groupIndex) => {
            const colorA = group.color ?? "var(--accent-brand)";
            const colorB = group.secondaryColor ?? "var(--accent-spark)";

            return (
              <section
                key={`${group.label}-${groupIndex}`}
                className="py-5 first:pt-5 last:pb-3"
              >
                <div className="mb-3 flex items-baseline justify-between gap-3">
                  <h3 className="flex items-center gap-2.5 text-[15px] font-medium tracking-[-0.01em]">
                    <span
                      aria-hidden="true"
                      className="h-2 w-2 rounded-[2px]"
                      style={{ backgroundColor: colorA }}
                    />
                    <span>{group.label}</span>
                  </h3>
                  {group.deltaBadge && (
                    <span
                      className="tabular-telemetry text-[15.5px] font-bold tracking-[-0.02em] md:text-[17px]"
                      style={{ color: "var(--accent-spark-text)" }}
                    >
                      {group.deltaBadge}
                    </span>
                  )}
                </div>

                <div className="space-y-2.5">
                  {[group.a, group.b].map((measure, measureIndex) => {
                    const valueLabel =
                      measure.valueLabel ?? `${measure.value}${unit}`;
                    const isPrimary = measureIndex === 0;
                    const barColor = isPrimary ? colorA : colorB;
                    const targetWidth = `${pct(measure.value)}%`;

                    return (
                      <div
                        key={`${measure.label}-${measureIndex}`}
                        className="grid grid-cols-[155px_minmax(250px,1fr)_120px] items-center gap-x-4"
                      >
                        <p
                          className="tabular-telemetry truncate text-[11.5px]"
                          style={{
                            color: isPrimary
                              ? "var(--ink-primary)"
                              : "var(--ink-secondary)",
                            fontWeight: isPrimary ? 500 : 400,
                          }}
                        >
                          {measure.label}
                        </p>

                        <div
                          className="relative h-[16px] overflow-hidden rounded-[3px] border-y"
                          style={{
                            borderColor: "var(--border-whisper)",
                            backgroundColor: "var(--bg-surface-subtle)",
                          }}
                          title={`${group.label} · ${measure.label} · ${valueLabel}`}
                        >
                          <GridLines ticks={axisTicks} max={axisMax} />
                          <motion.div
                            initial={
                              prefersReducedMotion ? false : { width: "0%" }
                            }
                            animate={
                              inView || prefersReducedMotion
                                ? { width: targetWidth }
                                : { width: "0%" }
                            }
                            transition={{
                              duration: 0.78,
                              delay: groupIndex * 0.1 + measureIndex * 0.12,
                              ease: [0.22, 1, 0.36, 1],
                            }}
                            className="absolute inset-y-[2px] left-0 rounded-[2px]"
                            style={{
                              backgroundColor: barColor,
                              opacity: isPrimary ? 1 : 0.55,
                            }}
                          />
                        </div>

                        <p
                          className="tabular-telemetry text-right text-[12.5px] font-medium"
                          style={{
                            color: isPrimary
                              ? "var(--accent-brand-text)"
                              : "var(--ink-secondary)",
                          }}
                        >
                          {valueLabel}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>

        <div
          className="tabular-telemetry mt-3 grid grid-cols-[155px_minmax(250px,1fr)_120px] gap-x-4 border-t pt-3 text-[10px]"
          style={{
            borderColor: "var(--border-whisper)",
            color: "var(--ink-secondary)",
          }}
        >
          <span />
          <div className="flex justify-between">
            {axisTicks.map((tick, index) => (
              <span key={`${tick}-${index}`}>
                {formatTick(tick)}
                {index === axisTicks.length - 1 ? unit : ""}
              </span>
            ))}
          </div>
          <span />
        </div>
      </div>
    </div>
  );
}