export type ScenarioId = "refund" | "sql";

export interface GuardrailState {
  semanticCache: boolean;
  piiRedaction: boolean;
  loopBreaker: boolean;
}

export type TraceHealthStatus = "Blocked" | "Degraded" | "Healthy";
export type SpanTone = "neutral" | "warn" | "pass" | "brand";

export interface EvaluatedSpan {
  id: string;
  name: string;
  runtime: string;
  depth: 0 | 1;
  latencyMs: number;
  baselineLatencyMs: number;
  costUsd: number;
  tokens: number;
  note: string;
  tone: SpanTone;
  payload: Record<string, unknown>;
}

export interface EvaluatedTrace {
  scenarioId: ScenarioId;
  label: string;
  traceId: string;
  totalLatencyMs: number;
  baselineLatencyMs: number;
  totalCostUsd: number;
  baselineCostUsd: number;
  status: TraceHealthStatus;
  statusTone: "warn" | "brand" | "pass";
  activeGuardrailCount: number;
  spans: EvaluatedSpan[];
}

export interface ScenarioMeta {
  id: ScenarioId;
  label: string;
  traceId: string;
}

export const SANDBOX_SCENARIOS: readonly ScenarioMeta[] = [
  { id: "refund", label: "Refund Agent", traceId: "trace_89f2a" },
  { id: "sql", label: "SQL Analyst", traceId: "trace_41c0e" },
] as const;

export const GUARDRAIL_CONTROLS: readonly {
  key: keyof GuardrailState;
  label: string;
  caption: string;
}[] = [
  {
    key: "semanticCache",
    label: "Semantic Cache",
    caption: "Cuts repeat tool lookups",
  },
  {
    key: "piiRedaction",
    label: "PII Redaction",
    caption: "Masks exposed SSN inline",
  },
  {
    key: "loopBreaker",
    label: "Loop Breaker",
    caption: "Halts redundant retries",
  },
] as const;

function buildRefundSpans(g: GuardrailState): EvaluatedSpan[] {
  const traceId = "trace_89f2a";

  const step1: EvaluatedSpan = {
    id: "span_01_plan",
    name: "agent.orchestrator.plan",
    runtime: "gpt-4.1-mini",
    depth: 0,
    latencyMs: 180,
    baselineLatencyMs: 180,
    costUsd: 0.002,
    tokens: 412,
    note: "gpt-4.1-mini",
    tone: "neutral",
    payload: {
      trace_id: traceId,
      span_id: "sp_01a8e4",
      operation: "agent.orchestrator.plan",
      model: "gpt-4.1-mini",
      latency_ms: 180,
      tokens: { input: 294, output: 118, total: 412 },
      cost_usd: 0.002,
      intent: "refund_duplicate_charge",
      confidence: 0.97,
    },
  };

  const step2: EvaluatedSpan = {
    id: "span_02_stripe",
    name: "tool.stripe_ledger.lookup",
    runtime: "REST API",
    depth: 1,
    latencyMs: g.semanticCache ? 45 : 940,
    baselineLatencyMs: 940,
    costUsd: g.semanticCache ? 0.0 : 0.004,
    tokens: g.semanticCache ? 0 : 620,
    note: g.semanticCache ? "REST API · 45ms cached" : "REST API · uncached lookup",
    tone: g.semanticCache ? "pass" : "warn",
    payload: {
      trace_id: traceId,
      span_id: "sp_02f9b1",
      parent_span_id: "sp_01a8e4",
      operation: "tool.stripe_ledger.lookup",
      transport: "REST API",
      latency_ms: g.semanticCache ? 45 : 940,
      cache_hit: g.semanticCache,
      cache_similarity: g.semanticCache ? 0.991 : null,
      tokens: g.semanticCache ? 0 : 620,
      cost_usd: g.semanticCache ? 0.0 : 0.004,
      charge_id: "ch_3Qx9K2L00491",
      amount_cents: 14900,
    },
  };

  const step3: EvaluatedSpan = {
    id: "span_03_draft",
    name: "llm.draft_resolution",
    runtime: "claude-4-sonnet",
    depth: 1,
    latencyMs: g.loopBreaker ? 420 : 1120,
    baselineLatencyMs: 1120,
    costUsd: g.loopBreaker ? 0.011 : 0.038,
    tokens: g.loopBreaker ? 890 : 3140,
    note: g.loopBreaker
      ? "claude-4-sonnet · guarded"
      : "claude-4-sonnet · 3x retry loop",
    tone: g.loopBreaker ? "pass" : "warn",
    payload: {
      trace_id: traceId,
      span_id: "sp_03c7d2",
      parent_span_id: "sp_01a8e4",
      operation: "llm.draft_resolution",
      model: "claude-4-sonnet",
      latency_ms: g.loopBreaker ? 420 : 1120,
      retry_attempts: g.loopBreaker ? 1 : 3,
      loop_breaker: g.loopBreaker ? "active · halted_repeat_tool_call" : "disabled",
      tokens: g.loopBreaker
        ? { input: 610, output: 280, total: 890 }
        : { input: 2290, output: 850, total: 3140 },
      cost_usd: g.loopBreaker ? 0.011 : 0.038,
    },
  };

  const step4: EvaluatedSpan = {
    id: "span_04_pii",
    name: "guardrail.pii_scan",
    runtime: "Spanrail Edge",
    depth: 1,
    latencyMs: g.piiRedaction ? 6 : 471,
    baselineLatencyMs: 471,
    costUsd: g.piiRedaction ? 0.0 : 0.003,
    tokens: g.piiRedaction ? 0 : 380,
    note: g.piiRedaction ? "Masked in 6ms" : "SSN exposed",
    tone: g.piiRedaction ? "pass" : "warn",
    payload: {
      trace_id: traceId,
      span_id: "sp_04e1a9",
      parent_span_id: "sp_03c7d2",
      operation: "guardrail.pii_scan",
      engine: g.piiRedaction ? "spanrail-edge-inline-v2" : "unmanaged-post-webhook",
      latency_ms: g.piiRedaction ? 6 : 471,
      cost_usd: g.piiRedaction ? 0.0 : 0.003,
      policy_action: g.piiRedaction ? "MASKED_INLINE" : "ALERT_EXPOSED",
      customer_context: {
        account_id: "cus_90481a",
        ssn: g.piiRedaction ? "[REDACTED_PII]" : "412-88-**** [EXPOSED]",
      },
    },
  };

  const step5: EvaluatedSpan = {
    id: "span_05_emit",
    name: "agent.response.emit",
    runtime: "OTLP stream",
    depth: 0,
    latencyMs: 129,
    baselineLatencyMs: 129,
    costUsd: 0.001,
    tokens: 94,
    note: "OTLP stream",
    tone: "neutral",
    payload: {
      trace_id: traceId,
      span_id: "sp_05b4f0",
      parent_span_id: "sp_01a8e4",
      operation: "agent.response.emit",
      protocol: "otlp/http+protobuf",
      latency_ms: 129,
      tokens: 94,
      cost_usd: 0.001,
      http_status: g.piiRedaction ? 200 : 422,
      delivered: g.piiRedaction,
    },
  };

  return [step1, step2, step3, step4, step5];
}

function buildSqlSpans(g: GuardrailState): EvaluatedSpan[] {
  const traceId = "trace_41c0e";

  const step1: EvaluatedSpan = {
    id: "sql_01_schema",
    name: "agent.schema.resolve",
    runtime: "gpt-4.1-mini",
    depth: 0,
    latencyMs: 145,
    baselineLatencyMs: 145,
    costUsd: 0.002,
    tokens: 348,
    note: "gpt-4.1-mini",
    tone: "neutral",
    payload: {
      trace_id: traceId,
      span_id: "sp_11c2a0",
      operation: "agent.schema.resolve",
      model: "gpt-4.1-mini",
      latency_ms: 145,
      tokens: { input: 240, output: 108, total: 348 },
      cost_usd: 0.002,
      tables_selected: ["invoices", "subscriptions", "customers"],
    },
  };

  const step2: EvaluatedSpan = {
    id: "sql_02_warehouse",
    name: "tool.warehouse.describe_tables",
    runtime: "Postgres Read",
    depth: 1,
    latencyMs: g.semanticCache ? 32 : 820,
    baselineLatencyMs: 820,
    costUsd: g.semanticCache ? 0.0 : 0.003,
    tokens: g.semanticCache ? 0 : 540,
    note: g.semanticCache ? "Postgres · 32ms cached" : "Postgres · cold metadata scan",
    tone: g.semanticCache ? "pass" : "warn",
    payload: {
      trace_id: traceId,
      span_id: "sp_12d7e4",
      parent_span_id: "sp_11c2a0",
      operation: "tool.warehouse.describe_tables",
      driver: "pg-read-replica",
      latency_ms: g.semanticCache ? 32 : 820,
      cache_hit: g.semanticCache,
      tokens: g.semanticCache ? 0 : 540,
      cost_usd: g.semanticCache ? 0.0 : 0.003,
      columns_indexed: 48,
    },
  };

  const step3: EvaluatedSpan = {
    id: "sql_03_synth",
    name: "llm.synthesize_sql",
    runtime: "claude-4-sonnet",
    depth: 1,
    latencyMs: g.loopBreaker ? 460 : 1340,
    baselineLatencyMs: 1340,
    costUsd: g.loopBreaker ? 0.013 : 0.044,
    tokens: g.loopBreaker ? 1040 : 3520,
    note: g.loopBreaker
      ? "claude-4-sonnet · guarded"
      : "claude-4-sonnet · 3x syntax loop",
    tone: g.loopBreaker ? "pass" : "warn",
    payload: {
      trace_id: traceId,
      span_id: "sp_13f4c8",
      parent_span_id: "sp_11c2a0",
      operation: "llm.synthesize_sql",
      model: "claude-4-sonnet",
      latency_ms: g.loopBreaker ? 460 : 1340,
      retry_attempts: g.loopBreaker ? 1 : 3,
      loop_breaker: g.loopBreaker ? "active · constrained_sql_grammar" : "disabled",
      tokens: g.loopBreaker
        ? { input: 730, output: 310, total: 1040 }
        : { input: 2610, output: 910, total: 3520 },
      cost_usd: g.loopBreaker ? 0.013 : 0.044,
    },
  };

  const step4: EvaluatedSpan = {
    id: "sql_04_pii",
    name: "guardrail.pii_scan",
    runtime: "Spanrail Edge",
    depth: 1,
    latencyMs: g.piiRedaction ? 5 : 380,
    baselineLatencyMs: 380,
    costUsd: g.piiRedaction ? 0.0 : 0.002,
    tokens: g.piiRedaction ? 0 : 290,
    note: g.piiRedaction ? "Masked in 5ms" : "Tax ID & SSN exposed",
    tone: g.piiRedaction ? "pass" : "warn",
    payload: {
      trace_id: traceId,
      span_id: "sp_14a9b2",
      parent_span_id: "sp_13f4c8",
      operation: "guardrail.pii_scan",
      engine: g.piiRedaction ? "spanrail-edge-inline-v2" : "unmanaged-post-webhook",
      latency_ms: g.piiRedaction ? 5 : 380,
      cost_usd: g.piiRedaction ? 0.0 : 0.002,
      policy_action: g.piiRedaction ? "MASKED_INLINE" : "ALERT_EXPOSED",
      sample_row: {
        org_id: "org_kestrel_19",
        ssn: g.piiRedaction ? "[REDACTED_PII]" : "412-88-**** [EXPOSED]",
      },
    },
  };

  const step5: EvaluatedSpan = {
    id: "sql_05_emit",
    name: "agent.response.emit",
    runtime: "OTLP stream",
    depth: 0,
    latencyMs: 115,
    baselineLatencyMs: 115,
    costUsd: 0.001,
    tokens: 82,
    note: "OTLP stream",
    tone: "neutral",
    payload: {
      trace_id: traceId,
      span_id: "sp_15e8d1",
      parent_span_id: "sp_11c2a0",
      operation: "agent.response.emit",
      protocol: "otlp/http+protobuf",
      latency_ms: 115,
      tokens: 82,
      cost_usd: 0.001,
      http_status: g.piiRedaction ? 200 : 422,
      delivered: g.piiRedaction,
    },
  };

  return [step1, step2, step3, step4, step5];
}

export function evaluateTraceScenario(
  scenarioId: ScenarioId,
  guardrails: GuardrailState
): EvaluatedTrace {
  const spans =
    scenarioId === "refund"
      ? buildRefundSpans(guardrails)
      : buildSqlSpans(guardrails);

  const meta =
    scenarioId === "refund" ? SANDBOX_SCENARIOS[0]! : SANDBOX_SCENARIOS[1]!;

  const totalLatencyMs = spans.reduce((sum, s) => sum + s.latencyMs, 0);
  const baselineLatencyMs = spans.reduce((sum, s) => sum + s.baselineLatencyMs, 0);
  const totalCostUsd = Number(
    spans.reduce((sum, s) => sum + s.costUsd, 0).toFixed(3)
  );
  const baselineCostUsd = scenarioId === "refund" ? 0.048 : 0.052;

  const activeGuardrailCount =
    (guardrails.semanticCache ? 1 : 0) +
    (guardrails.piiRedaction ? 1 : 0) +
    (guardrails.loopBreaker ? 1 : 0);

  let status: TraceHealthStatus = "Blocked";
  let statusTone: "warn" | "brand" | "pass" = "warn";

  if (activeGuardrailCount === 3) {
    status = "Healthy";
    statusTone = "pass";
  } else if (activeGuardrailCount >= 1) {
    status = "Degraded";
    statusTone = guardrails.piiRedaction ? "brand" : "warn";
  }

  return {
    scenarioId,
    label: meta.label,
    traceId: meta.traceId,
    totalLatencyMs,
    baselineLatencyMs,
    totalCostUsd,
    baselineCostUsd,
    status,
    statusTone,
    activeGuardrailCount,
    spans,
  };
}

export function formatLatencyMs(ms: number): string {
  return `${ms.toLocaleString("en-US")}ms`;
}

export function formatCostUsd(usd: number): string {
  return `$${usd.toFixed(3)}`;
}
