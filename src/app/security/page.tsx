import type { Metadata } from "next";
import Link from "next/link";
import { TopNav } from "@/components/layout/TopNav";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Security & Compliance",
  description:
    "Inline SIMD PII redaction, GDPR regional pinning, HIPAA BAA support, and dedicated VPC deployment options.",
};

export default function SecurityPage() {
  return (
    <div className="min-h-dvh">
      <TopNav />
      <main id="main-content" className="pt-28 pb-20">
        <div className="spanrail-container max-w-[820px] space-y-10">
          <div>
            <p className="tabular-telemetry text-[12px]" style={{ color: "var(--accent-spark-text)" }}>
              SECURITY &amp; TRUST ARCHITECTURE
            </p>
            <h1 className="display-h2 mt-3">Designed for regulated production agents.</h1>
            <p className="mt-4 text-[16px] leading-[1.65]" style={{ color: "var(--ink-secondary)" }}>
              Spanrail masks sensitive fields before span payloads reach storage, supports EU/US/APAC data residency, and deploys inside private customer VPCs.
            </p>
          </div>

          <section id="pii" className="rounded-3xl border p-6 md:p-8" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-whisper)" }}>
            <h2 className="text-[19px] font-medium">Inline Edge PII Redaction (&lt; 6ms p99)</h2>
            <p className="mt-2.5 text-[14.5px] leading-[1.65]" style={{ color: "var(--ink-secondary)" }}>
              Deterministic SIMD pattern &amp; checksum detectors mask SSNs, payment cards, JWTs, API keys, and email addresses inline before prompts or tool outputs are persisted or emitted downstream.
            </p>
          </section>

          <section id="vpc" className="rounded-3xl border p-6 md:p-8" style={{ backgroundColor: "var(--bg-surface)", borderColor: "var(--border-whisper)" }}>
            <h2 className="text-[19px] font-medium">Dedicated VPC, GDPR &amp; HIPAA BAA</h2>
            <p className="mt-2.5 text-[14.5px] leading-[1.65]" style={{ color: "var(--ink-secondary)" }}>
              Enterprise deployments run inside your AWS, GCP, or Azure VPC with customer-managed KMS keys, configurable 30–365 day retention windows, zero third-party model training on telemetry payloads, and signed HIPAA BAA / GDPR DPAs.
            </p>
            <Link
              href="/#demo"
              className="btn-tactile mt-5 inline-flex min-h-[42px] items-center rounded-full px-5 text-[13.5px] font-medium"
              style={{ backgroundColor: "var(--btn-primary-bg)", color: "var(--btn-primary-ink)" }}
            >
              Request security packet &amp; VPC review
            </Link>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}