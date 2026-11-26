import type { Metadata } from "next";
import { TopNav } from "@/components/layout/TopNav";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Spanrail handles website telemetry, demo requests, and customer trace data.",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-dvh">
      <TopNav />
      <main id="main-content" className="pt-28 pb-20">
        <div className="spanrail-container max-w-[760px] space-y-6">
          <p className="tabular-telemetry text-[12px]" style={{ color: "var(--ink-secondary)" }}>
            LAST UPDATED · NOVEMBER 2026
          </p>
          <h1 className="display-h2">Privacy Policy</h1>
          <p className="text-[15.5px] leading-[1.7]" style={{ color: "var(--ink-secondary)" }}>
            Spanrail Inc. collects only the minimum information required to operate the platform and respond to architecture briefing requests. We never sell customer data or train foundation models on ingested OpenTelemetry spans.
          </p>
          <h2 className="pt-2 text-[18px] font-medium">1. Information Submitted via Briefing Requests</h2>
          <p className="text-[15px] leading-[1.7]" style={{ color: "var(--ink-secondary)" }}>
            When you request an architecture review, we use your work email, estimated monthly trace volume, and selected runtime stack solely to prepare a tailored starter configuration and coordinate your engineering briefing.
          </p>
          <h2 className="pt-2 text-[18px] font-medium">2. Telemetry &amp; Data Retention</h2>
          <p className="text-[15px] leading-[1.7]" style={{ color: "var(--ink-secondary)" }}>
            Production trace payloads are subject to customer-selected retention windows (30, 90, or 365 days) and inline edge PII redaction policies. EU/UK customers may pin ingestion and storage exclusively within EU regions under GDPR Standard Contractual Clauses.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}