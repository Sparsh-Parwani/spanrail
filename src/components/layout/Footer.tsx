"use client";

import { SpanrailMark } from "@/components/layout/TopNav";

const FOOTER_COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "Live Trace Sandbox", href: "#sandbox" },
      { label: "Guardrail Router", href: "#capabilities" },
      { label: "Production Impact", href: "#compare" },
      { label: "Usage Pricing", href: "#pricing" },
    ],
  },
  {
    title: "Developers",
    links: [
      { label: "OpenTelemetry (OTLP)", href: "#capabilities" },
      { label: "TypeScript SDK", href: "#capabilities" },
      { label: "Python SDK", href: "#capabilities" },
      { label: "Starter Config", href: "#demo" },
    ],
  },
  {
    title: "Security",
    links: [
      { label: "Inline PII Redaction", href: "#sandbox" },
      { label: "Retention Policies", href: "#pricing" },
      { label: "VPC & HIPAA BAA", href: "#pricing" },
      { label: "Architecture Review", href: "#demo" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Engineering Teams", href: "#compare" },
      { label: "Book a Demo", href: "#demo" },
      { label: "Transparent Pricing", href: "#pricing" },
      { label: "spanrail.dev", href: "#" },
    ],
  },
] as const;

export function Footer() {
  return (
    <footer
      className="border-t pt-16 pb-24 md:pt-20 md:pb-14"
      style={{ borderColor: "var(--border-whisper)" }}
    >
      <div className="spanrail-container">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-12 md:gap-8">
          {/* Brand Summary */}
          <div className="md:col-span-4">
            <a
              href="#"
              className="inline-flex items-center gap-2.5 text-[15.5px] font-medium tracking-[-0.02em]"
              style={{ color: "var(--ink-primary)" }}
            >
              <SpanrailMark className="h-[20px] w-[20px]" />
              <span>Spanrail</span>
            </a>
            <p
              className="mt-3 max-w-[30ch] text-[13.5px] leading-[1.6]"
              style={{ color: "var(--ink-secondary)" }}
            >
              Real-time trace observability and inline safety switches for
              production AI agents.
            </p>

            {/* Quiet Operational Status Indicator */}
            <div className="mt-5 inline-flex items-center gap-2 text-[12.5px]">
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: "var(--status-pass-dot)" }}
              />
              <span style={{ color: "var(--ink-secondary)" }}>
                All ingestion regions operational
              </span>
            </div>
          </div>

          {/* Minimal 4-Column Index */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 md:col-span-8">
            {FOOTER_COLUMNS.map((col) => (
              <div key={col.title}>
                <h3
                  className="text-[13px] font-medium"
                  style={{ color: "var(--ink-primary)" }}
                >
                  {col.title}
                </h3>
                <ul className="mt-3.5 space-y-2.5">
                  {col.links.map((item) => (
                    <li key={item.label}>
                      <a
                        href={item.href}
                        className="inline-block text-[13px] hover:text-[var(--ink-primary)]"
                        style={{
                          color: "var(--ink-secondary)",
                          transition: "color 180ms var(--ease-enter)",
                        }}
                      >
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Copyright & Subtle Desktop Shortcut Hint */}
        <div
          className="mt-14 flex flex-col items-start justify-between gap-3 border-t pt-6 text-[12.5px] sm:flex-row sm:items-center"
          style={{
            borderColor: "var(--border-whisper)",
            color: "var(--ink-secondary)",
          }}
        >
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <p>© 2026 Spanrail Inc. All rights reserved.</p>
            <span aria-hidden="true" style={{ opacity: 0.4 }}>·</span>
            <p>
              Made by{" "}
              <a
                href="https://sparshparwaniportfolio.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium underline-offset-4 hover:underline"
                style={{
                  color: "var(--accent-brand-text)",
                  transition: "color 180ms var(--ease-enter)",
                }}
              >
                Sparsh Parwani
              </a>
            </p>
          </div>
          <p className="hidden tabular-telemetry text-[12px] lg:block">
            Shortcuts: M sound · 1 / 2 trace scenario
          </p>
        </div>
      </div>
    </footer>
  );
}
