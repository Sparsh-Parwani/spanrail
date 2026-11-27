import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { TopNav } from "@/components/layout/TopNav";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Security & Compliance",
  description:
    "Inline SIMD PII redaction, GDPR regional pinning, HIPAA BAA support, and dedicated VPC deployment options.",
};

const SECURITY_METRICS = [
  { label: "Edge PII masking p99", value: "< 6ms", sub: "Inline SIMD scan" },
  { label: "Active-active PoPs", value: "14", sub: "US, EU, APAC pinning" },
  { label: "Retention windows", value: "30–365d", sub: "Configurable per workspace" },
] as const;

const PII_CONTROLS = [
  {
    name: "Deterministic detectors",
    detail: "Masks SSNs, payment cards, JWTs, API keys, and emails before storage.",
  },
  {
    name: "Pre-persistence redaction",
    detail: "Raw sensitive tokens are scrubbed at edge ingress prior to indexing or downstream webhook emission.",
  },
  {
    name: "Zero model training",
    detail: "Ingested prompts, tool outputs, and evaluation traces are never used to train foundation models.",
  },
] as const;

const VPC_CONTROLS = [
  {
    name: "Private cloud deployment",
    detail: "Runs inside your AWS, GCP, or Azure VPC with private OTLP ingress endpoints.",
  },
  {
    name: "Customer-managed encryption",
    detail: "Supports KMS key isolation for trace payloads, embeddings, and audit logs.",
  },
  {
    name: "Contractual compliance",
    detail: "Signed HIPAA BAAs, GDPR DPAs, and EU/UK regional data pinning available on enterprise plans.",
  },
] as const;

export default function SecurityPage() {
  return (
    <div className="min-h-dvh">
      <TopNav />
      <main id="main-content" className="pt-20 pb-16 md:pt-28 md:pb-20">
        <div className="spanrail-container max-w-[820px]">
          <Link
            href="/"
            className="inline-flex min-h-[44px] items-center gap-1.5 text-[13.5px] font-medium [@media(hover:hover)]:hover:text-[var(--ink-primary)]"
            style={{ color: "var(--ink-secondary)" }}
          >
            <ArrowLeft className="h-4 w-4 shrink-0" />
            <span>Back to Spanrail</span>
          </Link>

          <h1 className="display-h2 mt-3">
            Designed for regulated production agents.
          </h1>
          <p
            className="mt-3 max-w-[58ch] text-[15.5px] leading-[1.65] sm:text-[16px]"
            style={{ color: "var(--ink-secondary)" }}
          >
            Spanrail masks sensitive fields before span payloads reach storage,
            supports EU, US, and APAC data residency, and deploys inside private
            customer VPCs.
          </p>

          {/* Compact architecture summary strip */}
          <dl
            className="mt-7 grid grid-cols-1 divide-y divide-[var(--border-whisper)] overflow-hidden rounded-2xl border sm:grid-cols-3 sm:divide-x sm:divide-y-0"
            style={{
              backgroundColor: "var(--bg-surface)",
              borderColor: "var(--border-whisper)",
            }}
          >
            {SECURITY_METRICS.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between gap-3 px-4 py-3.5 sm:flex-col sm:items-start sm:justify-start sm:p-5"
              >
                <div>
                  <dt
                    className="text-[12px] font-medium"
                    style={{ color: "var(--ink-secondary)" }}
                  >
                    {item.label}
                  </dt>
                  <p
                    className="mt-0.5 text-[11.5px] sm:hidden"
                    style={{ color: "var(--ink-muted)" }}
                  >
                    {item.sub}
                  </p>
                </div>
                <div className="text-right sm:mt-2 sm:text-left">
                  <dd
                    className="tabular-telemetry text-[20px] font-medium sm:text-[24px]"
                    style={{ color: "var(--ink-primary)" }}
                  >
                    {item.value}
                  </dd>
                  <p
                    className="mt-1 hidden text-[12px] sm:block"
                    style={{ color: "var(--ink-muted)" }}
                  >
                    {item.sub}
                  </p>
                </div>
              </div>
            ))}
          </dl>

          <div className="mt-7 space-y-5 sm:mt-9 sm:space-y-6">
            <section
              id="pii"
              className="scroll-mt-24 rounded-2xl border p-5 sm:rounded-3xl sm:p-7 md:p-8"
              style={{
                backgroundColor: "var(--bg-surface)",
                borderColor: "var(--border-whisper)",
              }}
            >
              <h2
                className="text-[18px] font-medium tracking-[-0.015em] sm:text-[19px]"
                style={{ color: "var(--ink-primary)" }}
              >
                Inline edge PII redaction (&lt; 6ms p99)
              </h2>
              <dl className="mt-4 divide-y divide-[var(--border-whisper)]">
                {PII_CONTROLS.map((item) => (
                  <div
                    key={item.name}
                    className="py-3.5 first:pt-1 last:pb-0"
                  >
                    <dt
                      className="text-[14px] font-medium"
                      style={{ color: "var(--ink-primary)" }}
                    >
                      {item.name}
                    </dt>
                    <dd
                      className="mt-1 text-[14px] leading-[1.6]"
                      style={{ color: "var(--ink-secondary)" }}
                    >
                      {item.detail}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>

            <section
              id="vpc"
              className="scroll-mt-24 rounded-2xl border p-5 sm:rounded-3xl sm:p-7 md:p-8"
              style={{
                backgroundColor: "var(--bg-surface)",
                borderColor: "var(--border-whisper)",
              }}
            >
              <h2
                className="text-[18px] font-medium tracking-[-0.015em] sm:text-[19px]"
                style={{ color: "var(--ink-primary)" }}
              >
                Dedicated VPC, GDPR, and HIPAA BAA
              </h2>
              <dl className="mt-4 divide-y divide-[var(--border-whisper)]">
                {VPC_CONTROLS.map((item) => (
                  <div
                    key={item.name}
                    className="py-3.5 first:pt-1 last:pb-0"
                  >
                    <dt
                      className="text-[14px] font-medium"
                      style={{ color: "var(--ink-primary)" }}
                    >
                      {item.name}
                    </dt>
                    <dd
                      className="mt-1 text-[14px] leading-[1.6]"
                      style={{ color: "var(--ink-secondary)" }}
                    >
                      {item.detail}
                    </dd>
                  </div>
                ))}
              </dl>

              <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-3">
                <Link
                  href="/#demo"
                  className="btn-tactile flex min-h-[46px] w-full items-center justify-center rounded-full px-5 text-[14px] font-medium sm:w-auto [@media(hover:hover)]:hover:bg-[var(--btn-primary-bg-hover)]"
                  style={{
                    backgroundColor: "var(--btn-primary-bg)",
                    color: "var(--btn-primary-ink)",
                  }}
                >
                  Request security packet and VPC review
                </Link>
                <Link
                  href="/docs"
                  className="btn-tactile flex min-h-[46px] w-full items-center justify-center rounded-full border px-5 text-[14px] font-medium sm:w-auto [@media(hover:hover)]:hover:border-[var(--border-hover)]"
                  style={{
                    backgroundColor: "var(--bg-surface-solid)",
                    borderColor: "var(--border-whisper)",
                    color: "var(--ink-primary)",
                  }}
                >
                  Inspect OTLP docs
                </Link>
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}