import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import {
  demoBookingSchema,
  extractEmailDomain,
  type DemoBookingInput,
  type DemoBookingResponse,
} from "@/lib/validation";

export const runtime = "nodejs";

function generateBookingRef(input: DemoBookingInput): string {
  const dateStamp = new Date().toISOString().slice(0, 10);
  const seed = `${input.email}|${input.volumeTier}|${input.primaryGoal}|${dateStamp}`;
  const digest = createHash("sha256").update(seed).digest("hex").slice(0, 6).toUpperCase();
  return `SR-${dateStamp.slice(0, 4)}-${digest}`;
}

function buildTailoredOtelConfig(
  input: DemoBookingInput,
  bookingRef: string,
  companyDomain: string
): string {
  const enablePiiStrict = input.primaryGoal === "PII & safety guardrails";
  const enableCostCap =
    input.primaryGoal === "Cut token spend" ||
    input.primaryGoal === "Replace legacy APM";

  const stackIntegrations = input.agentStacks
    .map((stack) => {
      if (stack === "LangGraph") return `    "langgraph"`;
      if (stack === "Vercel AI SDK") return `    "vercel-ai-sdk"`;
      if (stack === "OpenAI Agents") return `    "openai-agents"`;
      return `    "otlp-custom"`;
    })
    .join(",\n");

  const serviceSlug = companyDomain.replace(/[^a-z0-9]/gi, "-").toLowerCase();

  return `/**
 * Spanrail OpenTelemetry Starter Configuration
 * Booking Reference: ${bookingRef}
 * Provisioned for: ${input.email} (${input.volumeTier} monthly traces)
 * Primary Objective: ${input.primaryGoal}
 */
import { initSpanrail } from "@spanrail/otel";

export const spanrail = initSpanrail({
  serviceName: "${serviceSlug}-agents",
  apiKey: process.env.SPANRAIL_API_KEY!,
  otlpEndpoint: "https://ingest.spanrail.dev/v1/traces",
  instrumentations: [
${stackIntegrations}
  ],
  guardrails: {
    semanticCache: {
      enabled: true,
      similarityThreshold: 0.96,
      ttlSeconds: 1800,
    },
    piiRedaction: {
      enabled: true,
      mode: "${enablePiiStrict ? "block_and_mask_inline" : "mask_inline"}",
      detectors: ["ssn", "credit_card", "api_key", "email"],
    },
    loopBreaker: {
      enabled: true,
      maxRepeatedToolCalls: 2,
      maxRunCostUsd: ${enableCostCap ? "0.05" : "0.12"},
    },
  },
  sampling: {
    volumeTier: "${input.volumeTier}",
    captureAllErrors: true,
  },
});
`;
}

export async function POST(request: Request) {
  let rawBody: unknown;

  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json(
      {
        error: "Invalid JSON payload.",
        fieldErrors: {},
      },
      { status: 400 }
    );
  }

  const parsed = demoBookingSchema.safeParse(rawBody);

  if (!parsed.success) {
    const flattened = parsed.error.flatten();
    return NextResponse.json(
      {
        error: "Please review the highlighted fields and try again.",
        fieldErrors: flattened.fieldErrors,
      },
      { status: 422 }
    );
  }

  const data = parsed.data;
  const companyDomain = extractEmailDomain(data.email);
  const bookingRef = generateBookingRef(data);
  const otelConfigContent = buildTailoredOtelConfig(
    data,
    bookingRef,
    companyDomain
  );

  const stackSummary = data.agentStacks.join(", ");
  const estimateNote =
    typeof data.estimatedMonthlyUsd === "number" && data.estimatedMonthlyUsd > 0
      ? ` Estimated usage baseline: $${Math.round(data.estimatedMonthlyUsd).toLocaleString("en-US")}/mo.`
      : "";

  const payload: DemoBookingResponse = {
    bookingRef,
    email: data.email,
    companyDomain,
    volumeTier: data.volumeTier,
    agentStacks: data.agentStacks,
    primaryGoal: data.primaryGoal,
    scheduledWindow: "Within 1 business day · Direct engineering briefing",
    summary: `Prepared for ${companyDomain} running ${stackSummary} at ${data.volumeTier} monthly traces, focused on "${data.primaryGoal}".${estimateNote}`,
    otelConfigFilename: "spanrail.otel.ts",
    otelConfigContent,
  };

  // Production note: wire CRM/webhook persistence (e.g. Resend / HubSpot / Slack webhook) here before launch.
  return NextResponse.json(payload, { status: 201 });
}
