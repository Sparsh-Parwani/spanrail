import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { TopNav } from "@/components/layout/TopNav";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Terms governing access to Spanrail software, SDKs, and documentation.",
};

const TERMS_SUMMARY = [
  "Transparent usage metering on traces, evals, retention tier, and extra seats.",
  "Full customer ownership and standard OTLP data portability at any time.",
  "Enterprise VPC clusters and HIPAA BAAs governed by executed MSAs.",
] as const;

export default function TermsPage() {
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

          <h1 className="display-h2 mt-3">Terms of service</h1>
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
              Key terms overview
            </p>
            <ul className="mt-2.5 space-y-2 text-[14px] leading-[1.55]">
              {TERMS_SUMMARY.map((line) => (
                <li
                  key={line}
                  className="flex items-start gap-2.5"
                  style={{ color: "var(--ink-secondary)" }}
                >
                  <span
                    aria-hidden="true"
                    className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: "var(--accent-brand)" }}
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
              By accessing Spanrail documentation, interactive sandboxes, or
              OpenTelemetry ingestion services, you agree to use the service in
              compliance with applicable laws and not attempt to disrupt
              multi-tenant infrastructure.
            </p>

            <section className="pt-7">
              <h2
                className="text-[17.5px] font-medium sm:text-[18px]"
                style={{ color: "var(--ink-primary)" }}
              >
                1. Usage metering and billing
              </h2>
              <p className="mt-2.5">
                Paid plans are metered transparently on ingested spans,
                automated evaluation runs, retention tier, and seats above
                included allowances. Enterprise VPC clusters and HIPAA BAAs are
                governed by executed Master Services Agreements.
              </p>
            </section>

            <section className="pt-7">
              <h2
                className="text-[17.5px] font-medium sm:text-[18px]"
                style={{ color: "var(--ink-primary)" }}
              >
                2. OpenTelemetry portability
              </h2>
              <p className="mt-2.5">
                You retain full ownership of all ingested spans, prompt
                versions, and evaluation datasets and may export data in
                standard OTLP formats at any time.
              </p>
            </section>
          </div>

          <div
            className="mt-10 flex flex-wrap gap-3 border-t pt-6"
            style={{ borderColor: "var(--border-whisper)" }}
          >
            <Link
              href="/privacy"
              className="btn-tactile inline-flex min-h-[44px] items-center rounded-full border px-4 text-[13.5px] font-medium [@media(hover:hover)]:hover:border-[var(--border-hover)]"
              style={{
                backgroundColor: "var(--bg-surface)",
                borderColor: "var(--border-whisper)",
                color: "var(--ink-primary)",
              }}
            >
              Privacy policy
            </Link>
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
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}