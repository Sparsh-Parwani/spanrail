import type { Metadata } from "next";
import { TopNav } from "@/components/layout/TopNav";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms governing access to Spanrail software, SDKs, and documentation.",
};

export default function TermsPage() {
  return (
    <div className="min-h-dvh">
      <TopNav />
      <main id="main-content" className="pt-28 pb-20">
        <div className="spanrail-container max-w-[760px] space-y-6">
          <p className="tabular-telemetry text-[12px]" style={{ color: "var(--ink-secondary)" }}>
            LAST UPDATED · NOVEMBER 2026
          </p>
          <h1 className="display-h2">Terms of Service</h1>
          <p className="text-[15.5px] leading-[1.7]" style={{ color: "var(--ink-secondary)" }}>
            By accessing Spanrail documentation, interactive sandboxes, or OpenTelemetry ingestion services, you agree to use the service in compliance with applicable laws and not attempt to disrupt multi-tenant infrastructure.
          </p>
          <h2 className="pt-2 text-[18px] font-medium">1. Usage Metering &amp; Billing</h2>
          <p className="text-[15px] leading-[1.7]" style={{ color: "var(--ink-secondary)" }}>
            Paid plans are metered transparently on ingested spans, automated evaluation runs, retention tier, and seats above included allowances. Enterprise VPC clusters and HIPAA BAAs are governed by executed Master Services Agreements.
          </p>
          <h2 className="pt-2 text-[18px] font-medium">2. OpenTelemetry Portability</h2>
          <p className="text-[15px] leading-[1.7]" style={{ color: "var(--ink-secondary)" }}>
            You retain full ownership of all ingested spans, prompt versions, and evaluation datasets and may export data in standard OTLP formats at any time.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}