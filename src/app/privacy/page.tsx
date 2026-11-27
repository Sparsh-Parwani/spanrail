import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { TopNav } from "@/components/layout/TopNav";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Spanrail handles website telemetry, demo requests, and customer trace data.",
};

const PRIVACY_SUMMARY = [
  "No sale of customer contact or telemetry data.",
  "No foundation model training on ingested OpenTelemetry spans.",
  "Customer-controlled 30, 90, or 365-day retention with EU/UK regional pinning.",
] as const;

export default function PrivacyPage() {
  return (
    <div className="min-h-dvh">
      <TopNav />
      <main id="main-content" className="pt-20 pb-16 md:pt-28 md:pb-20">
        <div className="spanrail-container max-w-[740px]">
          <Link
            href="/"
            className="inline-flex min-h-[44px] items-center gap-1.5 text-[13.5px] font-medium [@media(hover:hover)]:hover:text-[var(--ink-primary)]"
            style={{ color: "var(--ink-secondary)" }}
          >
            <ArrowLeft className="h-4 w-4 shrink-0" />
            <span>Back to Spanrail</span>
          </Link>

          <h1 className="display-h2 mt-3">Privacy policy</h1>
          <p
            className="tabular-telemetry mt-2 text-[12.5px]"
            style={{ color: "var(--ink-secondary)" }}
          >
            Updated November 2026
          </p>

          <div
            className="mt-6 rounded-2xl border p-4 sm:p-5"
            style={{
              backgroundColor: "var(--bg-surface)",
              borderColor: "var(--border-whisper)",
            }}
          >
            <p
              className="text-[13px] font-medium"
              style={{ color: "var(--ink-primary)" }}
            >
              Core commitments
            </p>
            <ul className="mt-2.5 space-y-2 text-[14px] leading-[1.55]">
              {PRIVACY_SUMMARY.map((line) => (
                <li
                  key={line}
                  className="flex items-start gap-2.5"
                  style={{ color: "var(--ink-secondary)" }}
                >
                  <span
                    aria-hidden="true"
                    className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: "var(--status-pass-dot)" }}
                  />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </div>

          <div
            className="mt-8 max-w-[62ch] space-y-7 divide-y divide-[var(--border-whisper)] text-[15px] leading-[1.7]"
            style={{ color: "var(--ink-secondary)" }}
          >
            <p>
              Spanrail Inc. collects only the minimum information required to
              operate the platform and respond to architecture briefing
              requests. We never sell customer data or train foundation models
              on ingested OpenTelemetry spans.
            </p>

            <section className="pt-7">
              <h2
                className="text-[17.5px] font-medium sm:text-[18px]"
                style={{ color: "var(--ink-primary)" }}
              >
                1. Information submitted via briefing requests
              </h2>
              <p className="mt-2.5">
                When you request an architecture review, we use your work email,
                estimated monthly trace volume, and selected runtime stack
                solely to prepare a tailored starter configuration and
                coordinate your engineering briefing.
              </p>
            </section>

            <section className="pt-7">
              <h2
                className="text-[17.5px] font-medium sm:text-[18px]"
                style={{ color: "var(--ink-primary)" }}
              >
                2. Telemetry and data retention
              </h2>
              <p className="mt-2.5">
                Production trace payloads are subject to customer-selected
                retention windows (30, 90, or 365 days) and inline edge PII
                redaction policies. EU and UK customers may pin ingestion and
                storage exclusively within EU regions under GDPR Standard
                Contractual Clauses.
              </p>
            </section>
          </div>

          <div
            className="mt-10 flex flex-wrap gap-3 border-t pt-6"
            style={{ borderColor: "var(--border-whisper)" }}
          >
            <Link
              href="/security"
              className="btn-tactile inline-flex min-h-[44px] items-center rounded-full border px-4 text-[13.5px] font-medium [@media(hover:hover)]:hover:border-[var(--border-hover)]"
              style={{
                backgroundColor: "var(--bg-surface)",
                borderColor: "var(--border-whisper)",
                color: "var(--ink-primary)",
              }}
            >
              Security architecture
            </Link>
            <Link
              href="/terms"
              className="btn-tactile inline-flex min-h-[44px] items-center rounded-full border px-4 text-[13.5px] font-medium [@media(hover:hover)]:hover:border-[var(--border-hover)]"
              style={{
                backgroundColor: "var(--bg-surface)",
                borderColor: "var(--border-whisper)",
                color: "var(--ink-primary)",
              }}
            >
              Terms of service
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}