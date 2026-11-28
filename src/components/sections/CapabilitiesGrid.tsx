"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, m } from "framer-motion";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import Pipeline from "@/components/react-bits/pipeline";
import { playSuccessConfirm, playSwitchClick } from "@/lib/sound";
import { useBreakpoint } from "@/lib/useBreakpoint";
import { ScrollReveal } from "@/components/ui/ScrollReveal";
import {
  REDUCED_TRANSITION,
  SegmentedControl,
  SoftTabs,
  SoftTabsContent,
  SoftTabsList,
  SoftTabsTrigger,
  TACTILE_SPRING,
} from "@/components/ui/Primitives";

type CapabilityId = "router" | "sdk" | "prompts" | "spend";

const CAPABILITY_INDEX: readonly {
  id: CapabilityId;
  title: string;
  mobileTitle: string;
  mobileMeta: string;
  summary: string;
}[] = [
  {
    id: "router",
    title: "Inline Guardrail Router",
    mobileTitle: "Guardrail router",
    mobileMeta: "1.4ms edge",
    summary:
      "Enforce prompt safety, hard per-run spend ceilings, and latency fallbacks directly in the request path.",
  },
  {
    id: "sdk",
    title: "Two-Line Drop-In SDK",
    mobileTitle: "Drop-in SDK",
    mobileMeta: "OTLP native",
    summary:
      "Standard OpenTelemetry exporters with zero proprietary lock-in and automatic model span parsing.",
  },
  {
    id: "prompts",
    title: "Prompt Version Comparison",
    mobileTitle: "Prompt diff",
    mobileMeta: "Replay evals",
    summary:
      "Score candidate prompt edits on real traces before shipping them to live traffic.",
  },
  {
    id: "spend",
    title: "Multi-Provider Token Spend",
    mobileTitle: "Token spend",
    mobileMeta: "6 providers",
    summary:
      "Attribute token costs per tenant, prompt, and model provider across hosted APIs and private clusters.",
  },
] as const;

type PolicyRuleId = "injection" | "budget" | "fallback";

const POLICY_RULES: readonly {
  id: PolicyRuleId;
  label: string;
  shortLabel: string;
  readoutLatency: string;
  readoutAction: string;
  dotColor: string;
}[] = [
  {
    id: "injection",
    label: "Block injection",
    shortLabel: "Injection",
    readoutLatency: "1.4ms total pipeline",
    readoutAction: "Prompt injection halted before model call",
    dotColor: "var(--status-warn-dot)",
  },
  {
    id: "budget",
    label: "Cap $0.05/run",
    shortLabel: "Cap $0.05",
    readoutLatency: "1.1ms policy check",
    readoutAction: "Token budget enforced inline per trace",
    dotColor: "var(--accent-brand)",
  },
  {
    id: "fallback",
    label: "Fallback fast",
    shortLabel: "Fallback",
    readoutLatency: "1.4ms route switch",
    readoutAction: "Rerouted to gpt-4.1-mini on 429 spike",
    dotColor: "var(--status-pass-dot)",
  },
] as const;

function GuardrailRouterStage() {
  const [activeRule, setActiveRule] = useState<PolicyRuleId>("budget");
  const current =
    POLICY_RULES.find((r) => r.id === activeRule) ?? POLICY_RULES[1]!;

  return (
    <div className="flex h-full flex-col justify-between">
      <div>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-[17.5px] font-medium tracking-[-0.02em] text-[var(--ink-primary)] md:text-[18.5px] lg:text-[20px]">
            Inline Guardrail Router
          </h3>
          <span className="tabular-telemetry text-[11.5px] font-medium text-[var(--accent-brand-text)] lg:text-[12.5px]">
            {current.readoutLatency}
          </span>
        </div>

        <p className="mt-1.5 max-w-[52ch] text-[12.5px] leading-[1.55] text-[var(--ink-secondary)] md:text-[13px] lg:mt-2 lg:text-[14.5px] lg:leading-[1.6]">
          Switch policies below to inspect real-time request-path routing and
          edge evaluation latency.
        </p>

        <div className="mt-5 sm:mt-7">
          <Pipeline activeRule={activeRule} />
        </div>
      </div>

      <div className="mt-6 sm:mt-8">
        <div
          className="grid grid-cols-3 gap-1.5 sm:flex sm:flex-wrap sm:gap-2"
          role="group"
          aria-label="Simulate inline policy rule"
        >
          {POLICY_RULES.map((rule) => {
            const isSelected = rule.id === activeRule;
            return (
              <button
                key={rule.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => {
                  setActiveRule(rule.id);
                  playSwitchClick(true);
                }}
                className={`btn-tactile flex min-h-[44px] cursor-pointer items-center justify-center rounded-xl border px-2 text-center text-[12.5px] font-medium sm:min-h-[40px] sm:rounded-full sm:px-4 sm:text-[13px] ${
                  isSelected
                    ? "border-[var(--accent-brand)] bg-[var(--accent-brand-soft)] text-[var(--accent-brand-text)]"
                    : "border-[var(--border-whisper)] bg-[var(--bg-surface-subtle)] text-[var(--ink-secondary)] [@media(hover:hover)]:hover:border-[var(--border-hover)] [@media(hover:hover)]:hover:text-[var(--ink-primary)]"
                }`}
              >
                <span className="sm:hidden">{rule.shortLabel}</span>
                <span className="hidden sm:inline">{rule.label}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-5 flex items-center gap-2.5 border-t border-[var(--border-whisper)] pt-4 text-[12px] text-[var(--ink-muted)] lg:text-[13.5px]">
          <span
            aria-hidden="true"
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: current.dotColor }}
          />
          <span>{current.readoutAction}</span>
        </div>
      </div>
    </div>
  );
}

type SdkTabId = "typescript" | "python" | "curl";

const INGEST_ENDPOINT = "https://ingest.spanrail.dev/v1/traces";

const SDK_SNIPPETS: Record<
  SdkTabId,
  { label: string; filename: string; code: string }
> = {
  typescript: {
    label: "TypeScript",
    filename: "spanrail.otel.ts",
    code: `import { initSpanrail } from "@spanrail/otel";

initSpanrail({
  apiKey: process.env.SPANRAIL_API_KEY,
  guardrails: ["pii_redact", "loop_breaker"],
});`,
  },
  python: {
    label: "Python",
    filename: "spanrail_otel.py",
    code: `from spanrail_otel import init_spanrail

init_spanrail(
    api_key=os.environ["SPANRAIL_API_KEY"],
    guardrails=["pii_redact", "loop_breaker"],
)`,
  },
  curl: {
    label: "cURL",
    filename: "export-trace.sh",
    code: `curl -X POST ${INGEST_ENDPOINT} \\
  -H "Authorization: Bearer $SPANRAIL_API_KEY" \\
  -H "Content-Type: application/x-protobuf" \\
  --data-binary @agent-trace.otlp`,
  },
};

function DropInSdkStage() {
  const [tab, setTab] = useState<SdkTabId>("typescript");
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(SDK_SNIPPETS[tab].code);
      setCopied(true);
      playSuccessConfirm();
      toast.success(`${SDK_SNIPPETS[tab].label} snippet copied`);
      if (copyTimerRef.current !== null) {
        window.clearTimeout(copyTimerRef.current);
      }
      copyTimerRef.current = window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Unable to access clipboard in this browser.");
    }
  };

  return (
    <div className="flex h-full flex-col justify-between">
      <div>
        <h3 className="text-[17.5px] font-medium tracking-[-0.02em] text-[var(--ink-primary)] md:text-[18.5px] lg:text-[20px]">
          Two-Line Drop-In SDK
        </h3>
        <p className="mt-1.5 max-w-[52ch] text-[12.5px] leading-[1.55] text-[var(--ink-secondary)] md:text-[13px] lg:mt-2 lg:text-[14.5px] lg:leading-[1.6]">
          Standard OpenTelemetry exporters with automatic span capture across
          LangGraph, Vercel AI SDK, OpenAI Agents, and custom OTLP pipelines.
        </p>

        <SoftTabs
          value={tab}
          onValueChange={(next) => {
            setTab(next as SdkTabId);
            setCopied(false);
            playSwitchClick(true);
          }}
          layoutId="capabilities-sdk-tabs"
          className="mt-5 sm:mt-6"
        >
          <SoftTabsList
            ariaLabel="Select SDK language"
            className="grid w-full grid-cols-3 sm:inline-flex sm:w-auto"
          >
            <SoftTabsTrigger value="typescript">TypeScript</SoftTabsTrigger>
            <SoftTabsTrigger value="python">Python</SoftTabsTrigger>
            <SoftTabsTrigger value="curl">cURL</SoftTabsTrigger>
          </SoftTabsList>

          {(["typescript", "python", "curl"] as const).map((lang) => (
            <SoftTabsContent key={lang} value={lang} className="mt-3.5 sm:mt-4">
              <div className="overflow-hidden rounded-2xl border border-[var(--border-whisper)] bg-[var(--code-bg)]">
                <div className="flex items-center justify-between gap-2 border-b border-[var(--border-whisper)] px-3.5 py-2 sm:px-4">
                  <span
                    translate="no"
                    className="tabular-telemetry truncate text-[11.5px] text-[var(--ink-muted)] lg:text-[12px]"
                  >
                    {SDK_SNIPPETS[lang].filename}
                  </span>

                  <button
                    type="button"
                    onClick={() => void handleCopy()}
                    aria-label={
                      copied
                        ? `${SDK_SNIPPETS[lang].label} snippet copied`
                        : `Copy ${SDK_SNIPPETS[lang].label} snippet`
                    }
                    className={`btn-tactile inline-grid min-h-[36px] shrink-0 cursor-pointer items-center justify-items-center rounded-full border bg-[var(--bg-surface-subtle)] px-3 text-[12px] font-medium [@media(hover:hover)]:hover:border-[var(--border-hover)] ${
                      copied
                        ? "border-[var(--status-pass-dot)] text-[var(--status-pass-text)]"
                        : "border-[var(--border-whisper)] text-[var(--ink-primary)]"
                    }`}
                  >
                    <span
                      aria-hidden={copied}
                      className={`col-start-1 row-start-1 inline-flex items-center gap-1.5 transition-opacity duration-150 ${
                        copied ? "opacity-0" : "opacity-100"
                      }`}
                    >
                      <Copy className="h-3.5 w-3.5 shrink-0" />
                      <span>Copy</span>
                    </span>
                    <span
                      aria-hidden={!copied}
                      className={`col-start-1 row-start-1 inline-flex items-center gap-1.5 transition-opacity duration-150 ${
                        copied ? "opacity-100" : "opacity-0"
                      }`}
                    >
                      <Check className="h-3.5 w-3.5 shrink-0 text-[var(--status-pass-text)]" />
                      <span>Copied</span>
                    </span>
                  </button>
                </div>

                <pre
                  translate="no"
                  className="tabular-telemetry min-h-[152px] overflow-x-auto p-4 text-[12px] leading-[1.7] text-[var(--ink-primary)] sm:min-h-[164px] sm:p-5 sm:text-[13px] sm:leading-[1.75]"
                >
                  <code>{SDK_SNIPPETS[lang].code}</code>
                </pre>
              </div>
            </SoftTabsContent>
          ))}
        </SoftTabs>
      </div>

      <p className="mt-5 border-t border-[var(--border-whisper)] pt-4 text-[12px] text-[var(--ink-muted)] lg:mt-6 lg:text-[13px]">
        Zero proprietary wrappers — export straight to OTLP/HTTP + Protobuf.
      </p>
    </div>
  );
}

type PromptVersionId = "v14" | "v15";

const PROMPT_VERSIONS: Record<
  PromptVersionId,
  {
    accuracy: { display: string; pct: number; delta?: string };
    latency: { display: string; pct: number; delta?: string };
    cost: { display: string; pct: number; delta?: string };
    summary: string;
  }
> = {
  v14: {
    accuracy: { display: "89.2%", pct: 89.2 },
    latency: { display: "1.92s", pct: 84 },
    cost: { display: "$42.10", pct: 86 },
    summary: "Baseline production prompt — 1,000 replayed traces",
  },
  v15: {
    accuracy: { display: "96.4%", pct: 96.4, delta: "+7.2%" },
    latency: { display: "0.81s", pct: 35, delta: "-58%" },
    cost: { display: "$16.80", pct: 34, delta: "-60%" },
    summary: "Candidate structured prompt — ready to promote",
  },
};

function PromptComparisonStage() {
  const [version, setVersion] = useState<PromptVersionId>("v15");
  const { prefersReducedMotion } = useBreakpoint();
  const data = PROMPT_VERSIONS[version];

  const rows = [
    {
      label: "Eval accuracy",
      value: data.accuracy.display,
      pct: data.accuracy.pct,
      delta: data.accuracy.delta,
      barColor:
        version === "v15" ? "var(--status-pass-dot)" : "var(--accent-brand)",
    },
    {
      label: "p95 latency",
      value: data.latency.display,
      pct: data.latency.pct,
      delta: data.latency.delta,
      barColor:
        version === "v15" ? "var(--accent-brand)" : "var(--ink-muted)",
    },
    {
      label: "Cost / 1k runs",
      value: data.cost.display,
      pct: data.cost.pct,
      delta: data.cost.delta,
      barColor:
        version === "v15" ? "var(--accent-brand)" : "var(--ink-muted)",
    },
  ];

  return (
    <div className="flex h-full flex-col justify-between">
      <div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <h3 className="text-[17.5px] font-medium tracking-[-0.02em] text-[var(--ink-primary)] md:text-[18.5px] lg:text-[20px]">
            Prompt Version Comparison
          </h3>

          <div className="w-full sm:w-auto">
            <SegmentedControl
              options={[
                { value: "v14", label: "Prompt v14" },
                { value: "v15", label: "Prompt v15" },
              ]}
              value={version}
              onChange={(next) => {
                setVersion(next);
                playSwitchClick(next === "v15");
              }}
              ariaLabel="Compare prompt versions"
              layoutId="capabilities-prompt-diff"
              fullWidth
            />
          </div>
        </div>

        <p className="mt-2 max-w-[52ch] text-[12.5px] leading-[1.55] text-[var(--ink-secondary)] md:text-[13px] lg:text-[14.5px] lg:leading-[1.6]">
          Replay historical production traces against candidate prompts and
          measure accuracy, tail latency, and dollar impact side by side.
        </p>

        <div className="mt-6 space-y-5 sm:mt-7 sm:space-y-6">
          {rows.map((row) => (
            <div key={row.label}>
              <div className="mb-2 flex items-baseline justify-between gap-3">
                <span className="text-[12.5px] font-medium text-[var(--ink-secondary)] md:text-[13px] lg:text-[14px]">
                  {row.label}
                </span>
                <div className="tabular-telemetry flex items-baseline gap-2.5">
                  {row.delta && (
                    <span className="text-[11.5px] font-medium text-[var(--status-pass-text)] lg:text-[12.5px]">
                      {row.delta}
                    </span>
                  )}
                  <span className="min-w-[64px] text-right text-[17px] font-medium text-[var(--ink-primary)] sm:min-w-[66px] sm:text-[18px]">
                    {row.value}
                  </span>
                </div>
              </div>

              <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--bg-surface-subtle)]">
                <m.div
                  initial={false}
                  animate={{ scaleX: row.pct / 100 }}
                  transition={
                    prefersReducedMotion ? REDUCED_TRANSITION : TACTILE_SPRING
                  }
                  className="h-full w-full origin-left rounded-full"
                  style={{ backgroundColor: row.barColor }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-6 border-t border-[var(--border-whisper)] pt-4 text-[12px] text-[var(--ink-muted)] lg:mt-7 lg:text-[13px]">
        {data.summary}
      </p>
    </div>
  );
}

interface ProviderSlice {
  id: string;
  name: string;
  sharePct: number;
  costPer1k: string;
  avgTokens: string;
  color: string;
}

const PROVIDER_SLICES: readonly ProviderSlice[] = [
  {
    id: "anthropic",
    name: "Anthropic",
    sharePct: 38,
    costPer1k: "$18.40",
    avgTokens: "2,140 avg tokens/run",
    color: "var(--accent-brand)",
  },
  {
    id: "openai",
    name: "OpenAI",
    sharePct: 24,
    costPer1k: "$14.20",
    avgTokens: "1,780 avg tokens/run",
    color: "var(--accent-brand-text)",
  },
  {
    id: "gemini",
    name: "Gemini",
    sharePct: 14,
    costPer1k: "$7.90",
    avgTokens: "2,420 avg tokens/run",
    color: "var(--status-pass-dot)",
  },
  {
    id: "bedrock",
    name: "AWS Bedrock",
    sharePct: 10,
    costPer1k: "$11.60",
    avgTokens: "1,920 avg tokens/run",
    color: "#d4a259",
  },
  {
    id: "vllm",
    name: "Self-Hosted vLLM",
    sharePct: 8,
    costPer1k: "$3.10",
    avgTokens: "1,350 avg tokens/run",
    color: "var(--ink-secondary)",
  },
  {
    id: "mistral",
    name: "Mistral",
    sharePct: 6,
    costPer1k: "$5.40",
    avgTokens: "1,510 avg tokens/run",
    color: "var(--ink-muted)",
  },
] as const;

function ProviderSpendStage() {
  const [selectedId, setSelectedId] = useState<string>("anthropic");
  const active =
    PROVIDER_SLICES.find((p) => p.id === selectedId) ?? PROVIDER_SLICES[0]!;

  return (
    <div className="flex h-full flex-col justify-between">
      <div>
        <h3 className="text-[17.5px] font-medium tracking-[-0.02em] text-[var(--ink-primary)] md:text-[18.5px] lg:text-[20px]">
          Multi-Provider Token Spend
        </h3>
        <p className="mt-1.5 max-w-[52ch] text-[12.5px] leading-[1.55] text-[var(--ink-secondary)] md:text-[13px] lg:mt-2 lg:text-[14.5px] lg:leading-[1.6]">
          Attribute token costs per tenant, prompt, and model provider across
          hosted APIs and private inference clusters.
        </p>

        <div
          aria-hidden="true"
          className="mt-6 flex h-3 w-full gap-[3px] overflow-hidden rounded-full sm:mt-7 sm:h-3.5"
        >
          {PROVIDER_SLICES.map((slice) => {
            const isSelected = slice.id === selectedId;
            return (
              <div
                key={slice.id}
                className="h-full rounded-[2px] first:rounded-l-full last:rounded-r-full"
                style={{
                  width: `${slice.sharePct}%`,
                  backgroundColor: slice.color,
                  opacity: isSelected ? 1 : 0.34,
                  transition: "opacity 200ms var(--ease-enter)",
                }}
              />
            );
          })}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2 sm:mt-6 sm:grid-cols-3 sm:gap-2.5">
          {PROVIDER_SLICES.map((slice) => {
            const isSelected = slice.id === selectedId;
            return (
              <button
                key={slice.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => {
                  setSelectedId(slice.id);
                  playSwitchClick(true);
                }}
                className={`btn-tactile flex min-h-[56px] cursor-pointer flex-col justify-between rounded-xl border px-3 py-2.5 text-left sm:min-h-[48px] sm:flex-row sm:items-center sm:px-3.5 ${
                  isSelected
                    ? "border-[var(--accent-brand)] bg-[var(--bg-surface-subtle)]"
                    : "border-[var(--border-whisper)] bg-transparent [@media(hover:hover)]:hover:border-[var(--border-hover)]"
                }`}
              >
                <span className="flex w-full items-center justify-between gap-2 sm:w-auto sm:min-w-0 sm:justify-start">
                  <span className="inline-flex min-w-0 items-center gap-2">
                    <span
                      aria-hidden="true"
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: slice.color }}
                    />
                    <span className="hidden truncate text-[13px] font-medium text-[var(--ink-primary)] sm:inline">
                      {slice.name}
                    </span>
                  </span>
                  <span className="tabular-telemetry text-[11.5px] text-[var(--ink-muted)] sm:hidden">
                    {slice.sharePct}%
                  </span>
                </span>

                <span className="mt-1 block truncate text-[13px] font-medium text-[var(--ink-primary)] sm:hidden">
                  {slice.name}
                </span>

                <span className="tabular-telemetry hidden shrink-0 text-[12px] text-[var(--ink-muted)] sm:inline lg:text-[12.5px]">
                  {slice.sharePct}%
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-1.5 border-t border-[var(--border-whisper)] pt-4 sm:mt-7 sm:flex-row sm:items-baseline sm:justify-between sm:gap-2">
        <span className="text-[12px] text-[var(--ink-muted)] lg:text-[13px]">
          <strong className="font-medium text-[var(--ink-primary)]">
            {active.name}
          </strong>{" "}
          — {active.avgTokens}
        </span>
        <div className="tabular-telemetry sm:text-right">
          <span className="text-[18px] font-medium text-[var(--ink-primary)]">
            {active.costPer1k}
          </span>
          <span className="ml-1 text-[12px] text-[var(--ink-muted)] lg:text-[12.5px]">
            / 1k runs
          </span>
        </div>
      </div>
    </div>
  );
}

export function CapabilitiesGrid() {
  const [activeTab, setActiveTab] = useState<CapabilityId>("router");
  const { prefersReducedMotion } = useBreakpoint();

  return (
    <section
      id="capabilities"
      aria-labelledby="capabilities-heading"
      className="scroll-mt-20 py-14 md:py-20"
    >
      <div className="spanrail-container">
        <ScrollReveal>
          <div className="max-w-[580px]">
            <h2 id="capabilities-heading" className="display-h2">
              Built for teams shipping real agents.
            </h2>
            <p className="mt-2.5 max-w-[46ch] text-[13.5px] leading-[1.6] text-[var(--ink-secondary)] md:text-[14px] lg:mt-3 lg:max-w-[54ch] lg:text-[17px] lg:leading-[1.65]">
              One quiet telemetry layer for inline safety switches, prompt
              regressions, and exact token accounting.
            </p>
          </div>

          {/* Phone & Tablet 2x2 Selector Grid */}
          <div
            role="tablist"
            aria-label="Core Spanrail capabilities"
            className="mt-6 grid grid-cols-2 gap-2.5 lg:hidden"
          >
            {CAPABILITY_INDEX.map((item) => {
              const isSelected = item.id === activeTab;
              return (
                <button
                  key={item.id}
                  id={`cap-mob-tab-${item.id}`}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  aria-controls="capabilities-stage-panel"
                  onClick={() => {
                    setActiveTab(item.id);
                    playSwitchClick(true);
                  }}
                  className={`btn-tactile flex min-h-[68px] cursor-pointer flex-col justify-between rounded-2xl border px-3.5 py-3 text-left sm:min-h-[76px] sm:px-4 ${
                    isSelected
                      ? "border-[var(--accent-brand)] bg-[var(--bg-surface)]"
                      : "border-[var(--border-whisper)] bg-[var(--bg-surface-subtle)]"
                  }`}
                  style={{
                    boxShadow: isSelected
                      ? "0 0 0 1px var(--accent-brand-soft)"
                      : "none",
                  }}
                >
                  <div className="flex w-full items-center justify-between gap-2">
                    <span
                      aria-hidden="true"
                      className={`h-1.5 w-1.5 rounded-full ${
                        isSelected
                          ? "bg-[var(--accent-brand)]"
                          : "bg-[var(--ink-muted)]/50"
                      }`}
                    />
                    <span
                      className={`tabular-telemetry text-[10.5px] ${
                        isSelected
                          ? "text-[var(--accent-brand-text)]"
                          : "text-[var(--ink-muted)]"
                      }`}
                    >
                      {item.mobileMeta}
                    </span>
                  </div>

                  <span
                    className={`mt-1.5 text-[13.5px] font-medium leading-[1.25] sm:text-[15px] ${
                      isSelected
                        ? "text-[var(--ink-primary)]"
                        : "text-[var(--ink-secondary)]"
                    }`}
                  >
                    <span className="sm:hidden">{item.mobileTitle}</span>
                    <span className="hidden sm:inline">{item.title}</span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-4 grid grid-cols-1 items-stretch gap-8 lg:mt-10 lg:grid-cols-12 lg:gap-10">
            <div
              role="tablist"
              aria-label="Core Spanrail capabilities"
              className="hidden flex-col divide-y divide-[var(--border-whisper)] border-y border-[var(--border-whisper)] lg:col-span-5 lg:flex"
            >
              {CAPABILITY_INDEX.map((item) => {
                const isSelected = item.id === activeTab;
                return (
                  <button
                    key={item.id}
                    id={`cap-desk-tab-${item.id}`}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    aria-controls="capabilities-stage-panel"
                    onClick={() => {
                      setActiveTab(item.id);
                      playSwitchClick(true);
                    }}
                    className="relative flex flex-1 cursor-pointer flex-col justify-center py-5 pr-4 pl-5 text-left"
                    style={{
                      opacity: isSelected ? 1 : 0.62,
                      transition: "opacity 200ms var(--ease-enter)",
                    }}
                  >
                    {isSelected && (
                      <m.span
                        layoutId="capabilities-active-rail"
                        aria-hidden="true"
                        transition={
                          prefersReducedMotion
                            ? REDUCED_TRANSITION
                            : TACTILE_SPRING
                        }
                        className="absolute inset-y-3 left-0 w-[2.5px] rounded-full bg-[var(--accent-brand)]"
                      />
                    )}

                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[16px] font-medium tracking-[-0.015em] text-[var(--ink-primary)]">
                        {item.title}
                      </span>
                      <span
                        className={`tabular-telemetry text-[11.5px] ${
                          isSelected
                            ? "text-[var(--accent-brand-text)]"
                            : "text-[var(--ink-muted)]"
                        }`}
                      >
                        {item.mobileMeta}
                      </span>
                    </div>
                    <p className="mt-1.5 text-[13.5px] leading-[1.55] text-[var(--ink-secondary)]">
                      {item.summary}
                    </p>
                  </button>
                );
              })}
            </div>

            <div
              id="capabilities-stage-panel"
              role="tabpanel"
              className="surface-fade min-h-[380px] rounded-2xl border border-[var(--border-whisper)] bg-[var(--bg-surface)] p-4 sm:min-h-[410px] sm:rounded-3xl sm:p-7 md:p-9 lg:col-span-7"
              style={{ boxShadow: "var(--shadow-stage)" }}
            >
              <AnimatePresence mode="wait" initial={false}>
                <m.div
                  key={activeTab}
                  initial={
                    prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 8 }
                  }
                  animate={
                    prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }
                  }
                  exit={
                    prefersReducedMotion
                      ? { opacity: 0 }
                      : { opacity: 0, y: -6 }
                  }
                  transition={
                    prefersReducedMotion
                      ? REDUCED_TRANSITION
                      : { duration: 0.2, ease: [0.22, 1, 0.36, 1] }
                  }
                  className="h-full"
                >
                  {activeTab === "router" && <GuardrailRouterStage />}
                  {activeTab === "sdk" && <DropInSdkStage />}
                  {activeTab === "prompts" && <PromptComparisonStage />}
                  {activeTab === "spend" && <ProviderSpendStage />}
                </m.div>
              </AnimatePresence>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}