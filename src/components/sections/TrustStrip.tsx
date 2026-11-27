"use client";

import type { CSSProperties } from "react";
import { StatsBand, type Stat } from "@/components/ui/stats-band";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

interface CustomerLogo {
  name: string;
  markPosition: "left" | "right";
  fontStyle: CSSProperties;
  mark: React.ReactNode;
}

const SANS = '"Plus Jakarta Sans Variable", "Plus Jakarta Sans", sans-serif';
const MONO = '"JetBrains Mono Variable", "JetBrains Mono", monospace';
const SERIF = SANS;

const CUSTOMERS: readonly CustomerLogo[] = [
  {
    name: "Northstar Freight",
    markPosition: "left",
    fontStyle: { fontFamily: SANS, fontSize: "20.5px", letterSpacing: "-0.035em", fontWeight: 600 },
    mark: (
      <svg viewBox="0 0 28 28" fill="none" aria-hidden="true" className="h-7 w-7 shrink-0">
        <path d="M14 2.5L17.2 10.8L25.5 14L17.2 17.2L14 25.5L10.8 17.2L2.5 14L10.8 10.8L14 2.5Z" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" />
        <circle cx="14" cy="14" r="2.2" fill="var(--accent-spark)" />
      </svg>
    ),
  },
  {
    name: "Kestrel Pay",
    markPosition: "right",
    fontStyle: { fontFamily: SERIF, fontSize: "19.5px", letterSpacing: "0.08em", fontWeight: 400, textTransform: "uppercase" },
    mark: (
      <svg viewBox="0 0 28 28" fill="none" aria-hidden="true" className="h-7 w-7 shrink-0">
        <path d="M4 21L12.5 6H24L15.5 21H4Z" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" />
        <path d="M9.5 13.5H19" stroke="var(--accent-brand)" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    name: "BRAMBLE HEALTH",
    markPosition: "left",
    fontStyle: { fontFamily: MONO, fontSize: "17px", letterSpacing: "0.09em", fontWeight: 500 },
    mark: (
      <svg viewBox="0 0 28 28" fill="none" aria-hidden="true" className="h-7 w-7 shrink-0">
        <rect x="11.2" y="3.5" width="5.6" height="21" rx="2.8" fill="currentColor" />
        <rect x="3.5" y="11.2" width="21" height="5.6" rx="2.8" fill="currentColor" />
      </svg>
    ),
  },
  {
    name: "Vektor Legal",
    markPosition: "right",
    fontStyle: { fontFamily: SANS, fontSize: "20px", letterSpacing: "0.02em", fontWeight: 700 },
    mark: (
      <svg viewBox="0 0 28 28" fill="none" aria-hidden="true" className="h-7 w-7 shrink-0">
        <path d="M4.5 6L14 22.5L23.5 6" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M10.5 6L14 12.2L17.5 6" stroke="var(--accent-spark)" strokeWidth="1.9" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    name: "cinder_ops",
    markPosition: "left",
    fontStyle: { fontFamily: MONO, fontSize: "19px", letterSpacing: "-0.02em", fontWeight: 500 },
    mark: (
      <svg viewBox="0 0 28 28" fill="none" aria-hidden="true" className="h-7 w-7 shrink-0">
        <rect x="14" y="3.5" width="14.8" height="14.8" rx="3" transform="rotate(45 14 3.5)" stroke="currentColor" strokeWidth="1.9" />
        <circle cx="14" cy="14" r="2.6" fill="var(--accent-spark)" />
      </svg>
    ),
  },
  {
    name: "Meridian Cloud",
    markPosition: "right",
    fontStyle: { fontFamily: SANS, fontSize: "21px", letterSpacing: "-0.04em", fontWeight: 500 },
    mark: (
      <svg viewBox="0 0 28 28" fill="none" aria-hidden="true" className="h-7 w-7 shrink-0">
        <circle cx="14" cy="14" r="10" stroke="currentColor" strokeWidth="1.9" />
        <ellipse cx="14" cy="14" rx="4.6" ry="10" stroke="currentColor" strokeWidth="1.6" />
        <path d="M4.5 14H23.5" stroke="var(--accent-brand)" strokeWidth="1.8" />
      </svg>
    ),
  },
  {
    name: "HALCYON ROBOTICS",
    markPosition: "left",
    fontStyle: { fontFamily: SANS, fontSize: "16.5px", letterSpacing: "0.11em", fontWeight: 600 },
    mark: (
      <svg viewBox="0 0 28 28" fill="none" aria-hidden="true" className="h-7 w-7 shrink-0">
        <path d="M14 3L23.5 8.5V19.5L14 25L4.5 19.5V8.5L14 3Z" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" />
        <path d="M14 14V25M14 14L23.5 8.5M14 14L4.5 8.5" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    ),
  },
  {
    name: "Alder Bio",
    markPosition: "right",
    fontStyle: { fontFamily: SERIF, fontStyle: "italic", fontSize: "21px", letterSpacing: "-0.02em", fontWeight: 500 },
    mark: (
      <svg viewBox="0 0 28 28" fill="none" aria-hidden="true" className="h-7 w-7 shrink-0">
        <path d="M7 22C7 12.5 12 6 22 5C21 15 15.5 22 7 22Z" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" />
        <path d="M7 22L16.5 12.5" stroke="var(--accent-brand)" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    name: "STRATOS GRID",
    markPosition: "left",
    fontStyle: { fontFamily: MONO, fontSize: "17.5px", letterSpacing: "0.06em", fontWeight: 500 },
    mark: (
      <svg viewBox="0 0 28 28" fill="none" aria-hidden="true" className="h-7 w-7 shrink-0">
        <rect x="4" y="4" width="8.5" height="8.5" rx="2" fill="currentColor" />
        <rect x="15.5" y="4" width="8.5" height="8.5" rx="2" stroke="currentColor" strokeWidth="1.9" />
        <rect x="4" y="15.5" width="8.5" height="8.5" rx="2" stroke="currentColor" strokeWidth="1.9" />
        <rect x="15.5" y="15.5" width="8.5" height="8.5" rx="2" fill="var(--accent-spark)" />
      </svg>
    ),
  },
  {
    name: "Quarry Data",
    markPosition: "right",
    fontStyle: { fontFamily: MONO, fontSize: "18.5px", letterSpacing: "-0.02em", fontWeight: 400 },
    mark: (
      <svg viewBox="0 0 28 28" fill="none" aria-hidden="true" className="h-7 w-7 shrink-0">
        <path d="M4.5 9.5L14 4.5L23.5 9.5L14 14.5L4.5 9.5Z" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" />
        <path d="M4.5 14.8L14 19.8L23.5 14.8" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M4.5 19.6L14 24.4L23.5 19.6" stroke="var(--accent-brand)" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    name: "Loomis Treasury",
    markPosition: "left",
    fontStyle: { fontFamily: SERIF, fontSize: "19.5px", letterSpacing: "0.04em", fontWeight: 400 },
    mark: (
      <svg viewBox="0 0 28 28" fill="none" aria-hidden="true" className="h-7 w-7 shrink-0">
        <path d="M5 21H23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M8 21V9.5L14 6L20 9.5V21" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" />
        <path d="M14 11V21" stroke="var(--accent-spark)" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    name: "Ironclad Rail",
    markPosition: "right",
    fontStyle: { fontFamily: SANS, fontSize: "20px", letterSpacing: "-0.025em", fontWeight: 600 },
    mark: (
      <svg viewBox="0 0 28 28" fill="none" aria-hidden="true" className="h-7 w-7 shrink-0">
        <path d="M4 9H24M4 19H24" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" />
        <path d="M9.5 9V19M18.5 9V19" stroke="var(--accent-brand)" strokeWidth="2.1" strokeLinecap="round" />
      </svg>
    ),
  },
] as const;

const SPANRAIL_STATS: Stat[] = [
  {
    label: "Median SDK ingestion overhead",
    value: 1.4,
    decimals: 1,
    suffix: "ms",
    detail: "Non-blocking OTLP batch flush",
    context: "Matches 0.2 + 0.5 + 0.4 + 0.3ms router path",
    visual: {
      kind: "distribution",
      bins: [8, 28, 64, 98, 72, 42, 21, 12, 7, 4, 2, 1, 1, 1],
      max: 6,
      marker: 2.2,
    },
  },
  {
    label: "Modeled LLM token spend saved",
    value: 64,
    suffix: "%",
    detail: "Semantic cache + loop breakers",
    context: "Benchmarked on multi-step tool-calling agents",
    visual: {
      kind: "trend",
      values: [14, 22, 29, 34, 41, 46, 52, 57, 60, 64],
    },
  },
  {
    label: "Zero-config OTLP span auto-capture",
    value: 94.6,
    decimals: 1,
    suffix: "%",
    detail: "Protobuf & HTTP/gRPC spans",
    context: "38+ agent runtimes parsed without custom wrappers",
    visual: {
      kind: "uptime",
      days: [
        99.9, 99.6, 100, 99.9, 99.7, 100, 99.8, 100, 99.9, 99.5, 100, 99.9,
        100, 99.8, 100, 99.9, 99.7, 100, 99.9, 100,
      ],
    },
  },
  {
    label: "Reference cluster span capacity / mo",
    value: 4_200_000_000,
    decimals: 1,
    notation: "compact",
    suffix: "+",
    detail: "Tool calls, prompts & guardrails",
    context: "Horizontally sharded OTLP ingestion pipeline",
    visual: {
      kind: "trend",
      values: [0.8, 1.1, 1.4, 1.9, 2.3, 2.7, 3.1, 3.6, 3.9, 4.2],
    },
  },
  {
    label: "Inline edge PII detection & masking p99",
    value: 6,
    prefix: "<",
    suffix: "ms",
    detail: "SIMD scanner at edge ingress",
    context: "Masks SSNs, cards, tokens & API keys inline",
    visual: {
      kind: "distribution",
      bins: [16, 48, 86, 100, 66, 36, 18, 9, 5, 3, 2, 1, 1, 1],
      max: 12,
      marker: 6,
    },
  },
  {
    label: "Global edge OTLP ingest round-trip",
    value: 18.4,
    decimals: 1,
    suffix: "ms",
    detail: "14 active-active regional edge PoPs",
    context: "US, EU, India, Singapore, Tokyo & Sydney",
    visual: {
      kind: "map",
      points: [
        [-122.4, 37.7],
        [-97.7, 30.2],
        [-74.0, 40.7],
        [-46.6, -23.5],
        [-6.2, 53.3],
        [-0.1, 51.5],
        [8.6, 50.1],
        [18.0, 59.3],
        [55.3, 25.2],
        [72.8, 19.0],
        [103.8, 1.3],
        [126.9, 37.5],
        [139.7, 35.6],
        [151.2, -33.8],
      ],
    },
  },
];

function CustomerLockup({ customer }: { customer: CustomerLogo }) {
  return (
    <span
      className="inline-flex h-10 origin-center scale-[0.86] items-center gap-3 px-2 leading-none opacity-80 sm:h-11 sm:scale-100 [@media(hover:hover)]:hover:opacity-100"
      style={{
        color: "var(--ink-primary)",
        transition: "opacity 200ms var(--ease-enter)",
      }}
    >
      {customer.markPosition === "left" && (
        <span className="inline-flex h-7 w-7 items-center justify-center">
          {customer.mark}
        </span>
      )}
      <span
        translate="no"
        className="inline-flex h-7 items-center whitespace-nowrap leading-none"
        style={customer.fontStyle}
      >
        {customer.name}
      </span>
      {customer.markPosition === "right" && (
        <span className="inline-flex h-7 w-7 items-center justify-center">
          {customer.mark}
        </span>
      )}
    </span>
  );
}

export function TrustStrip() {
  return (
    <section
      aria-label="Production teams and platform telemetry"
      className="py-8 md:py-14"
    >
      <ScrollReveal>
        <div
          className="surface-fade border-y py-7 md:py-11"
          style={{
            borderColor: "var(--border-whisper)",
            backgroundColor: "var(--bg-nav-glass)",
          }}
        >
          <div className="spanrail-container mb-5 text-center md:mb-7">
            <p
              className="text-[13.5px] font-medium tracking-[-0.015em] [text-wrap:balance] md:text-[15px] lg:text-[18.5px]"
              style={{ color: "var(--ink-primary)" }}
            >
              Built for engineering teams running production LLM agents
            </p>
          </div>

          <ul className="sr-only">
            {CUSTOMERS.map((c) => (
              <li key={c.name}>{c.name}</li>
            ))}
          </ul>

          <div className="mx-auto max-w-[1440px]">
            <div className="marquee-viewport">
              <div className="marquee-rail">
                <div className="marquee-track">
                  {CUSTOMERS.map((customer) => (
                    <CustomerLockup key={`a-${customer.name}`} customer={customer} />
                  ))}
                </div>
                <div className="marquee-track" aria-hidden="true">
                  {CUSTOMERS.map((customer) => (
                    <CustomerLockup key={`b-${customer.name}`} customer={customer} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </ScrollReveal>

      <div className="spanrail-container mt-10 md:mt-16">
        <ScrollReveal delay={0.05}>
          <div
            className="overflow-hidden rounded-2xl border sm:rounded-3xl"
            style={{
              borderColor: "var(--border-whisper)",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <StatsBand stats={SPANRAIL_STATS} duration={1.4} />
          </div>
          <p
            className="mt-3 text-left text-[11px] leading-[1.45] sm:text-right lg:text-[11.5px]"
            style={{ color: "var(--ink-muted)" }}
          >
            Modeled OTLP benchmark metrics across multi-step agent workloads — tap or hover any metric for context.
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}