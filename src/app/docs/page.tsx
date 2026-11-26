import type { Metadata } from "next";
import { TopNav } from "@/components/layout/TopNav";
import { Footer } from "@/components/layout/Footer";

export const metadata: Metadata = {
  title: "Docs & Quickstart",
  description:
    "Install the Spanrail OpenTelemetry SDK for TypeScript, Python, or raw OTLP/HTTP in two lines.",
};

const INGEST_ENDPOINT = "https:" + "//ingest.spanrail.dev/v1/traces";

const TS_SNIPPET = `npm install @spanrail/otel

import { initSpanrail } from "@spanrail/otel";

initSpanrail({
  serviceName: "refund-agent-prod",
  apiKey: process.env.SPANRAIL_API_KEY!,
  otlpEndpoint: "${INGEST_ENDPOINT}",
  guardrails: {
    semanticCache: { enabled: true, ttlSeconds: 1800 },
    piiRedaction: { enabled: true, mode: "mask_inline" },
    loopBreaker: { enabled: true, maxRunCostUsd: 0.05 },
  },
});`;

const PY_SNIPPET = `pip install spanrail-otel

from spanrail_otel import init_spanrail
import os

init_spanrail(
    service_name="sql-analyst-prod",
    api_key=os.environ["SPANRAIL_API_KEY"],
    guardrails=["semantic_cache", "pii_redact", "loop_breaker"],
)`;

export default function DocsPage() {
  return (
    <div className="min-h-dvh">
      <TopNav />
      <main id="main-content" className="pt-28 pb-20">
        <div className="spanrail-container max-w-[820px]">
          <p
            className="tabular-telemetry text-[12px]"
            style={{ color: "var(--accent-spark-text)" }}
          >
            DOCUMENTATION · OPENTELEMETRY NATIVE
          </p>
          <h1 className="display-h2 mt-3">Quickstart &amp; OTLP Reference</h1>
          <p
            className="mt-4 text-[16px] leading-[1.65]"
            style={{ color: "var(--ink-secondary)" }}
          >
            Spanrail ingests standard OpenTelemetry traces over OTLP/HTTP
            Protobuf and gRPC—no proprietary wrapper lock-in.
          </p>

          <section id="sdk" className="mt-12 space-y-6">
            <h2
              className="text-[20px] font-medium"
              style={{ color: "var(--ink-primary)" }}
            >
              1. Drop-In TypeScript SDK
            </h2>
            <pre
              className="tabular-telemetry overflow-x-auto rounded-2xl border p-5 text-[13px] leading-[1.7]"
              style={{
                backgroundColor: "var(--code-bg)",
                borderColor: "var(--border-whisper)",
              }}
            >
              <code>{TS_SNIPPET}</code>
            </pre>

            <h2
              className="pt-4 text-[20px] font-medium"
              style={{ color: "var(--ink-primary)" }}
            >
              2. Python SDK (LangGraph / OpenAI Agents)
            </h2>
            <pre
              className="tabular-telemetry overflow-x-auto rounded-2xl border p-5 text-[13px] leading-[1.7]"
              style={{
                backgroundColor: "var(--code-bg)",
                borderColor: "var(--border-whisper)",
              }}
            >
              <code>{PY_SNIPPET}</code>
            </pre>
          </section>

          <section
            id="otlp"
            className="mt-12 space-y-4 border-t pt-10"
            style={{ borderColor: "var(--border-whisper)" }}
          >
            <h2
              className="text-[20px] font-medium"
              style={{ color: "var(--ink-primary)" }}
            >
              3. Direct OTLP Collector Endpoint
            </h2>
            <p
              className="text-[15px] leading-[1.65]"
              style={{ color: "var(--ink-secondary)" }}
            >
              Already running an OpenTelemetry Collector? Point your OTLP/HTTP
              exporter directly at{" "}
              <code className="tabular-telemetry">{INGEST_ENDPOINT}</code> with
              header{" "}
              <code className="tabular-telemetry">
                Authorization: Bearer &lt;SPANRAIL_API_KEY&gt;
              </code>
              .
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}