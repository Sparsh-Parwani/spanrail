import Link from "next/link";
import { SpanrailMark } from "@/components/ui/SpanrailMark";

const PORTFOLIO_URL = "https://sparshparwaniportfolio.vercel.app/";

const FOOTER_COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "Live Trace Sandbox", href: "/#sandbox" },
      { label: "Guardrail Router", href: "/#capabilities" },
      { label: "Production Impact", href: "/#compare" },
      { label: "Usage Pricing", href: "/#pricing" },
    ],
  },
  {
    title: "Developers",
    links: [
      { label: "Quickstart Docs", href: "/docs" },
      { label: "TypeScript & Python SDK", href: "/docs#sdk" },
      { label: "OTLP Wire Spec", href: "/docs#otlp" },
      { label: "Starter Config", href: "/#demo" },
    ],
  },
  {
    title: "Security & Trust",
    links: [
      { label: "Security Architecture", href: "/security" },
      { label: "Inline PII Redaction", href: "/security#pii" },
      { label: "VPC & HIPAA BAA", href: "/security#vpc" },
      { label: "Data Retention", href: "/#pricing" },
    ],
  },
  {
    title: "Legal & Company",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Book Engineering Review", href: "/#demo" },
    ],
  },
] as const;

export function Footer() {
  return (
    <footer className="border-t border-[var(--border-whisper)] pt-12 pb-28 md:pt-20 md:pb-14">
      <div className="spanrail-container">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12 md:gap-8">
          <div className="md:col-span-4">
            <Link
              href="/"
              className="inline-flex min-h-[44px] items-center gap-2.5 text-[15.5px] font-medium tracking-[-0.02em] text-[var(--ink-primary)]"
            >
              <SpanrailMark className="h-[22px] w-[22px] shrink-0" />
              <span translate="no">Spanrail</span>
            </Link>
            <p className="mt-2 max-w-[30ch] text-[12.5px] leading-[1.55] text-[var(--ink-muted)] lg:mt-2.5 lg:text-[13.5px] lg:leading-[1.6]">
              Real-time trace observability and inline safety switches for
              production AI agents.
            </p>

            <Link
              href="/security"
              className="mt-4 inline-flex min-h-[44px] items-center gap-2 text-[12px] text-[var(--ink-secondary)] transition-colors duration-200 [@media(pointer:fine)]:min-h-0 lg:text-[12.5px] [@media(hover:hover)]:hover:text-[var(--ink-primary)]"
            >
              <span
                aria-hidden="true"
                className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--status-pass-dot)]"
              />
              <span>Multi-region OTLP architecture</span>
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4 md:col-span-8">
            {FOOTER_COLUMNS.map((col) => (
              <div key={col.title}>
                <h3 className="text-[13px] font-medium text-[var(--ink-primary)]">
                  {col.title}
                </h3>
                <ul className="mt-3 space-y-0.5 [@media(pointer:fine)]:space-y-2.5 sm:mt-3.5">
                  {col.links.map((item) => (
                    <li key={item.label}>
                      <Link
                        href={item.href}
                        className="inline-flex min-h-[44px] items-center text-[12.5px] text-[var(--ink-secondary)] transition-colors duration-200 [@media(pointer:fine)]:min-h-0 lg:text-[13px] [@media(hover:hover)]:hover:text-[var(--ink-primary)]"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-[var(--border-whisper)] pt-6 text-[12px] text-[var(--ink-muted)] sm:mt-14 sm:flex-row sm:items-center lg:text-[12.5px]">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <p>© 2026 Spanrail Inc. All rights reserved.</p>
            <span aria-hidden="true" className="opacity-40">
              ·
            </span>
            <p>
              Made by{" "}
              <a
                href={PORTFOLIO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-[var(--accent-brand-text)] underline-offset-4 transition-colors duration-200 [@media(hover:hover)]:hover:underline"
              >
                Sparsh Parwani
              </a>
            </p>
          </div>
          <p className="tabular-telemetry hidden text-[11.5px] text-[var(--ink-muted)] lg:block">
            OpenTelemetry OTLP/HTTP + Protobuf
          </p>
        </div>
      </div>
    </footer>
  );
}