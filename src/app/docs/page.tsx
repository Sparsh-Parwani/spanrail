import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { TopNav } from "@/components/layout/TopNav";
import { Footer } from "@/components/layout/Footer";
import { CodeBlock } from "@/components/ui/CodeBlock";

export const metadata: Metadata = {
  title: "Docs & Quickstart",
  description:
    "Install the Spanrail OpenTelemetry SDK for TypeScript, Python, or raw OTLP/HTTP in two lines.",
};

const INGEST_ENDPOINT = "https" + "://ingest.spanrail.dev/v1/traces";

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

const OTLP_CURL_SNIPPET = `curl -X POST ${INGEST_ENDPOINT} \\
  -H "Authorization: Bearer $SPANRAIL_API_KEY" \\
  -H "Content-Type: application/x-protobuf" \\
  --data-binary @agent-trace.otlp`;

const OTLP_SPECS = [
  { label: "Ingest URL", value: INGEST_ENDPOINT, mono: true },
  { label: "Auth header", value: "Authorization: Bearer <SPANRAIL_API_KEY>", mono: true },
  { label: "Wire protocols", value: "OTLP/HTTP Protobuf & OTLP/gRPC", mono: false },
  { label: "Median overhead", value: "1.4ms non-blocking batch flush", mono: true },
] as const;

export default function DocsPage() {
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

          <h1 className="display-h2 mt-3">Quickstart and OTLP reference</h1>
          <p
            className="mt-3 max-w-[58ch] text-[15.5px] leading-[1.65] sm:text-[16px]"
            style={{ color: "var(--ink-secondary)" }}
          >
            Spanrail ingests standard OpenTelemetry traces over OTLP/HTTP
            Protobuf and gRPC with zero proprietary wrapper lock-in.
          </p>

          {/* In-page quick navigation — all 3 sections visible on phone & tablet */}
          <nav
            aria-label="Documentation sections"
            className="mt-6 grid grid-cols-3 gap-2 sm:inline-flex sm:gap-2.5"
          >
            {[
              { href: "#sdk", label: "TypeScript" },
              { href: "#python", label: "Python" },
              { href: "#otlp", label: "OTLP spec" },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="btn-tactile flex min-h-[44px] items-center justify-center rounded-xl border px-3 text-[13px] font-medium sm:rounded-full sm:px-4 [@media(hover:hover)]:hover:border-[var(--border-hover)]"
                style={{
                  backgroundColor: "var(--bg-surface)",
                  borderColor: "var(--border-whisper)",
                  color: "var(--ink-primary)",
                }}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <section id="sdk" className="mt-10 scroll-mt-24 space-y-4 sm:mt-12">
            <div>
              <h2
                className="text-[18.5px] font-medium tracking-[-0.015em] sm:text-[20px]"
                style={{ color: "var(--ink-primary)" }}
              >
                1. Drop-in TypeScript SDK
              </h2>
              <p
                className="mt-1.5 text-[14.5px] leading-[1.6]"
                style={{ color: "var(--ink-secondary)" }}
              >
                Auto-instruments Vercel AI SDK, OpenAI Agents, and Node.js
                fetch/HTTP tool spans.
              </p>
            </div>

            <CodeBlock
              filename="spanrail.otel.ts"
              label="TypeScript"
              code={TS_SNIPPET}
            />
          </section>

          <section id="python" className="mt-10 scroll-mt-24 space-y-4">
            <div>
              <h2
                className="text-[18.5px] font-medium tracking-[-0.015em] sm:text-[20px]"
                style={{ color: "var(--ink-primary)" }}
              >
                2. Python SDK for LangGraph and OpenAI Agents
              </h2>
              <p
                className="mt-1.5 text-[14.5px] leading-[1.6]"
                style={{ color: "var(--ink-secondary)" }}
              >
                Exports OpenTelemetry spans asynchronously without blocking
                async worker loops.
              </p>
            </div>

            <CodeBlock
              filename="spanrail_otel.py"
              label="Python"
              code={PY_SNIPPET}
            />
          </section>

          <section
            id="otlp"
            className="mt-10 scroll-mt-24 space-y-5 border-t pt-9 sm:mt-12 sm:pt-10"
            style={{ borderColor: "var(--border-whisper)" }}
          >
            <div>
              <h2
                className="text-[18.5px] font-medium tracking-[-0.015em] sm:text-[20px]"
                style={{ color: "var(--ink-primary)" }}
              >
                3. Direct OTLP collector endpoint
              </h2>
              <p
                className="mt-1.5 text-[14.5px] leading-[1.65] sm:text-[15px]"
                style={{ color: "var(--ink-secondary)" }}
              >
                Already running an OpenTelemetry Collector? Point your OTLP/HTTP
                exporter straight to the endpoint below.
              </p>
            </div>

            <dl
              className="divide-y divide-[var(--border-whisper)] rounded-2xl border px-4 sm:px-5"
              style={{
                backgroundColor: "var(--bg-surface)",
                borderColor: "var(--border-whisper)",
              }}
            >
              {OTLP_SPECS.map((spec) => (
                <div
                  key={spec.label}
                  className="flex flex-col gap-1 py-3.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4"
                >
                  <dt
                    className="shrink-0 text-[12.5px] font-medium sm:text-[13px]"
                    style={{ color: "var(--ink-secondary)" }}
                  >
                    {spec.label}
                  </dt>
                  <dd
                    translate={spec.mono ? "no" : undefined}
                    className={`${
                      spec.mono ? "tabular-telemetry break-all text-[12.5px]" : "text-[13.5px]"
                    } sm:text-right`}
                    style={{ color: "var(--ink-primary)" }}
                  >
                    {spec.value}
                  </dd>
                </div>
              ))}
            </dl>

            <CodeBlock
              filename="export-trace.sh"
              label="cURL"
              code={OTLP_CURL_SNIPPET}
            />

            <div className="flex flex-col gap-2.5 pt-2 sm:flex-row sm:items-center sm:gap-3">
              <Link
                href="/#demo"
                className="btn-tactile flex min-h-[46px] w-full items-center justify-center rounded-full px-5 text-[14px] font-medium sm:w-auto [@media(hover:hover)]:hover:bg-[var(--btn-primary-bg-hover)]"
                style={{
                  backgroundColor: "var(--btn-primary-bg)",
                  color: "var(--btn-primary-ink)",
                }}
              >
                Book an architecture review
              </Link>
              <Link
                href="/security"
                className="btn-tactile flex min-h-[46px] w-full items-center justify-center rounded-full border px-5 text-[14px] font-medium sm:w-auto [@media(hover:hover)]:hover:border-[var(--border-hover)]"
                style={{
                  backgroundColor: "var(--bg-surface)",
                  borderColor: "var(--border-whisper)",
                  color: "var(--ink-primary)",
                }}
              >
                Review security and VPC specs
              </Link>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}