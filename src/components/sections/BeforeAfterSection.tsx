"use client";

import { PairedBars, type PairedBarGroup } from "@/components/ui/paired-bars";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

const PRODUCTION_GROUPS: PairedBarGroup[] = [
  {
    label: "Trace resolution speed",
    deltaBadge: "128× faster",
    color: "var(--accent-brand)",
    secondaryColor: "var(--accent-spark)",
    a: {
      label: "With Spanrail",
      value: 94,
      valueLabel: "22 secs",
    },
    b: {
      label: "Without Spanrail",
      value: 14,
      valueLabel: "47 mins",
    },
  },
  {
    label: "Monthly bill retained (10M traces)",
    deltaBadge: "−94% invoice",
    color: "var(--accent-brand)",
    secondaryColor: "var(--accent-spark)",
    a: {
      label: "With Spanrail",
      value: 92,
      valueLabel: "$275/mo",
    },
    b: {
      label: "Without Spanrail",
      value: 16,
      valueLabel: "$4,850/mo",
    },
  },
  {
    label: "Production PII & output containment",
    deltaBadge: "−98.7% leak",
    color: "var(--status-pass-dot)",
    secondaryColor: "var(--accent-spark)",
    a: {
      label: "With Spanrail",
      value: 96,
      valueLabel: "< 0.05% leak",
    },
    b: {
      label: "Without Spanrail",
      value: 28,
      valueLabel: "3.8% raw",
    },
  },
  {
    label: "Runaway retry loop prevention",
    deltaBadge: "Halted < 2ms",
    color: "var(--status-pass-dot)",
    secondaryColor: "var(--accent-spark)",
    a: {
      label: "With Spanrail",
      value: 91,
      valueLabel: "< 2ms halt",
    },
    b: {
      label: "Without Spanrail",
      value: 11,
      valueLabel: "Post-invoice",
    },
  },
];

export function BeforeAfterSection() {
  return (
    <section
      id="compare"
      aria-labelledby="compare-heading"
      className="scroll-mt-20 py-14 md:py-20"
    >
      <div className="spanrail-container">
        <ScrollReveal>
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between md:gap-5">
            <div className="max-w-[560px]">
              <h2 id="compare-heading" className="display-h2">
                What changes in production.
              </h2>
              <p
                className="mt-2.5 max-w-[46ch] text-[13.5px] leading-[1.6] md:text-[14px] lg:mt-3 lg:max-w-[54ch] lg:text-[17px] lg:leading-[1.65]"
                style={{ color: "var(--ink-secondary)" }}
              >
                Modeled at 10M traces/mo (30-day retention, 5 seats) comparing
                Spanrail flat OTLP metering against raw logs and list-rate APM
                suites.
              </p>
            </div>

            <div className="tabular-telemetry flex flex-wrap items-center gap-4 text-[11.5px] lg:gap-5 lg:text-[12px]">
              <span
                className="inline-flex items-center gap-2 font-medium"
                style={{ color: "var(--ink-primary)" }}
              >
                <span
                  aria-hidden="true"
                  className="h-2.5 w-2.5 rounded-[2px]"
                  style={{ backgroundColor: "var(--accent-brand)" }}
                />
                <span>With Spanrail</span>
              </span>
              <span
                className="inline-flex items-center gap-2"
                style={{ color: "var(--ink-secondary)" }}
              >
                <span
                  aria-hidden="true"
                  className="h-2.5 w-2.5 rounded-[2px] opacity-60"
                  style={{ backgroundColor: "var(--accent-spark)" }}
                />
                <span>Without Spanrail</span>
              </span>
            </div>
          </div>

          <div className="mt-7 md:mt-10">
            <PairedBars
              barLabel="normalized SLA index (0–100 · higher is stronger)"
              unit=""
              max={100}
              ticks={[0, 25, 50, 75, 100]}
              groups={PRODUCTION_GROUPS}
            />
          </div>

          <p
            className="mt-3 text-[11.5px] leading-[1.5] lg:text-[12px]"
            style={{ color: "var(--ink-muted)" }}
          >
            Bars map each heterogeneous metric onto a 0–100 normalized SLA index; exact observed figures appear on the right. Spanrail 10M trace cost ($99 base + 975 × $0.18 = $274.50/mo) matches the live calculator below.
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}