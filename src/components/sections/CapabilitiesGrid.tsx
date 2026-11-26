"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
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
  code: string;
  title: string;
  summary: string;
}[] = [
  {
    id: "router",
    code: "01",
    title: "Inline Guardrail Router",
    summary:
      "Enforce prompt safety, hard per-run spend ceilings, and latency fallbacks directly in the request path.",
  },
  {
    id: "sdk",
    code: "02",
    title: "Two-Line Drop-In SDK",
    summary:
      "Standard OpenTelemetry exporters with zero proprietary lock-in and automatic model span parsing.",
  },
  {
    id: "prompts",
    code: "03",
    title: "Prompt Version Comparison",
    summary:
      "Score candidate prompt edits on real traces before shipping them to live traffic.",
  },
  {
    id: "spend",
    code: "04",
    title: "Multi-Provider Token Spend",
    summary:
      "Attribute token costs per tenant, prompt, and model provider across hosted APIs and private clusters.",
  },
] as const;

/* ============================================================================
   STAGE 1 — INLINE GUARDRAIL ROUTER
   ============================================================================ */
type PolicyRuleId = "injection" | "budget" | "fallback";

const POLICY_RULES: readonly {
  id: PolicyRuleId;
  label: string;
  readoutLatency: string;
  readoutAction: string;
  dotColor: string;
}[] = [
  {
    id: "injection",
    label: "Block Injection",
    readoutLatency: "1.4ms total pipeline",
    readoutAction: "Prompt injection halted before model call",
    dotColor: "var(--status-warn-dot)",
  },
  {
    id: "budget",
    label: "Cap $0.05/run",
    readoutLatency: "1.1ms policy check",
    readoutAction: "Token budget enforced inline per trace",
    dotColor: "var(--accent-brand)",
  },
  {
    id: "fallback",
    label: "Fallback Fast",
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
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3
            className="text-[20px] font-medium tracking-[-0.02em]"
            style={{ color: "var(--ink-primary)" }}
          >
            Inline Guardrail Router
          </h3>
          <span
            className="tabular-telemetry text-[12.5px] font-medium"
            style={{ color: "var(--accent-brand-text)" }}
          >
            {current.readoutLatency}
          </span>
        </div>

        <p
          className="mt-2 max-w-[52ch] text-[14.5px] leading-[1.6]"
          style={{ color: "var(--ink-secondary)" }}
        >
          Switch policies below to inspect real-time request-path routing and
          edge evaluation latency.
        </p>

        <div className="mt-7">
          <Pipeline activeRule={activeRule} />
        </div>
      </div>

      <div className="mt-8">
        <div
          className="flex flex-wrap gap-2"
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
                className="btn-tactile min-h-[40px] cursor-pointer rounded-full border px-4 text-[13px] font-medium"
                style={{
                  backgroundColor: isSelected
                    ? "var(--accent-brand-soft)"
                    : "var(--bg-surface-subtle)",
                  borderColor: isSelected
                    ? "var(--accent-brand)"
                    : "var(--border-whisper)",
                  color: isSelected
                    ? "var(--accent-brand-text)"
                    : "var(--ink-secondary)",
                }}
              >
                {rule.label}
              </button>
            );
          })}
        </div>

        <div
          className="mt-5 flex items-center gap-2.5 border-t pt-4 text-[13.5px]"
          style={{
            borderColor: "var(--border-whisper)",
            color: "var(--ink-secondary)",
          }}
        >
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

/* ============================================================================
   STAGE 2 — TWO-LINE DROP-IN SDK
   ============================================================================ */
type SdkTabId = "typescript" | "python" | "curl";

const SDK_SNIPPETS: Record<SdkTabId, { label: string; code: string }> = {
  typescript: {
    label: "TypeScript",
    code: `import { initSpanrail } from "@spanrail/otel";

initSpanrail({
  apiKey: process.env.SPANRAIL_API_KEY,
  guardrails: ["pii_redact", "loop_breaker"],
});`,
  },
  python: {
    label: "Python",
    code: `from spanrail_otel import init_spanrail

init_spanrail(
    api_key=os.environ["SPANRAIL_API_KEY"],
    guardrails=["pii_redact", "loop_breaker"],
)`,
  },
  curl: {
    label: "cURL",
    code: `curl -X POST https://ingest.spanrail.dev/v1/traces \\
  -H "Authorization: Bearer $SPANRAIL_API_KEY" \\
  -H "Content-Type: application/x-protobuf" \\
  --data-binary @agent-trace.otlp`,
  },
};

function DropInSdkStage() {
  const [tab, setTab] = useState<SdkTabId>("typescript");
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(SDK_SNIPPETS[tab].code);
      setCopied(true);
      playSuccessConfirm();
      toast.success(`${SDK_SNIPPETS[tab].label} snippet copied`);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Unable to access clipboard in this browser.");
    }
  };

  return (
    <div className="flex h-full flex-col justify-between">
      <div>
        <h3
          className="text-[20px] font-medium tracking-[-0.02em]"
          style={{ color: "var(--ink-primary)" }}
        >
          Two-Line Drop-In SDK
        </h3>
        <p
          className="mt-2 max-w-[52ch] text-[14.5px] leading-[1.6]"
          style={{ color: "var(--ink-secondary)" }}
        >
          Standard OpenTelemetry exporters with automatic span capture across
          LangGraph, Vercel AI SDK, OpenAI Agents, and custom OTLP pipelines.
        </p>

        <SoftTabs
          value={tab}
          onValueChange={(next) => {
            setTab(next as SdkTabId);
            playSwitchClick(true);
          }}
          layoutId="capabilities-sdk-tabs"
          className="mt-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <SoftTabsList ariaLabel="Select SDK language">
              <SoftTabsTrigger value="typescript">TypeScript</SoftTabsTrigger>
              <SoftTabsTrigger value="python">Python</SoftTabsTrigger>
              <SoftTabsTrigger value="curl">cURL</SoftTabsTrigger>
            </SoftTabsList>

            <button
              type="button"
              onClick={() => void handleCopy()}
              className="btn-tactile inline-flex min-h-[38px] cursor-pointer items-center gap-1.5 rounded-full border px-3.5 text-[12.5px] font-medium hover:border-[var(--border-hover)]"
              style={{
                backgroundColor: "var(--bg-surface-subtle)",
                borderColor: "var(--border-whisper)",
                color: "var(--ink-primary)",
              }}
            >
              {copied ? (
                <>
                  <Check
                    className="h-3.5 w-3.5"
                    style={{ color: "var(--status-pass-text)" }}
                  />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          {(["typescript", "python", "curl"] as const).map((lang) => (
            <SoftTabsContent key={lang} value={lang} className="mt-4">
              <pre
                className="tabular-telemetry min-h-[164px] overflow-x-auto rounded-2xl border p-5 text-[13px] leading-[1.75]"
                style={{
                  backgroundColor: "var(--code-bg)",
                  borderColor: "var(--border-whisper)",
                  color: "var(--ink-primary)",
                }}
              >
                <code>{SDK_SNIPPETS[lang].code}</code>
              </pre>
            </SoftTabsContent>
          ))}
        </SoftTabs>
      </div>

      <p
        className="mt-6 border-t pt-4 text-[13px]"
        style={{
          borderColor: "var(--border-whisper)",
          color: "var(--ink-secondary)",
        }}
      >
        Zero proprietary wrappers · Export straight to OTLP/HTTP + Protobuf.
      </p>
    </div>
  );
}

/* ============================================================================
   STAGE 3 — PROMPT VERSION COMPARISON
   ============================================================================ */
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
    summary: "Baseline production prompt · 1,000 replayed traces",
  },
  v15: {
    accuracy: { display: "96.4%", pct: 96.4, delta: "+7.2%" },
    latency: { display: "0.81s", pct: 35, delta: "-58%" },
    cost: { display: "$16.80", pct: 34, delta: "-60%" },
    summary: "Candidate structured prompt · ready to promote",
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
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h3
            className="text-[20px] font-medium tracking-[-0.02em]"
            style={{ color: "var(--ink-primary)" }}
          >
            Prompt Version Comparison
          </h3>

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
          />
        </div>

        <p
          className="mt-2 max-w-[52ch] text-[14.5px] leading-[1.6]"
          style={{ color: "var(--ink-secondary)" }}
        >
          Replay historical production traces against candidate prompts and
          measure accuracy, tail latency, and dollar impact side by side.
        </p>

        <div className="mt-7 space-y-6">
          {rows.map((row) => (
            <div key={row.label}>
              <div className="mb-2 flex items-baseline justify-between gap-3">
                <span
                  className="text-[14px] font-medium"
                  style={{ color: "var(--ink-secondary)" }}
                >
                  {row.label}
                </span>
                <div className="tabular-telemetry flex items-baseline gap-2.5">
                  {row.delta && (
                    <span
                      className="text-[12.5px] font-medium"
                      style={{ color: "var(--status-pass-text)" }}
                    >
                      {row.delta}
                    </span>
                  )}
                  <span
                    className="min-w-[66px] text-right text-[18px] font-medium"
                    style={{ color: "var(--ink-primary)" }}
                  >
                    {row.value}
                  </span>
                </div>
              </div>

              <div
                className="h-2 w-full overflow-hidden rounded-full"
                style={{ backgroundColor: "var(--bg-surface-subtle)" }}
              >
                <motion.div
                  initial={false}
                  animate={{ width: `${row.pct}%` }}
                  transition={
                    prefersReducedMotion ? REDUCED_TRANSITION : TACTILE_SPRING
                  }
                  className="h-full rounded-full"
                  style={{ backgroundColor: row.barColor }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <p
        className="mt-7 border-t pt-4 text-[13px]"
        style={{
          borderColor: "var(--border-whisper)",
          color: "var(--ink-secondary)",
        }}
      >
        {data.summary}
      </p>
    </div>
  );
}

/* ============================================================================
   STAGE 4 — MULTI-PROVIDER TOKEN SPEND (6 Providers in a 2x3 Layout)
   ============================================================================ */
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
        <h3
          className="text-[20px] font-medium tracking-[-0.02em]"
          style={{ color: "var(--ink-primary)" }}
        >
          Multi-Provider Token Spend
        </h3>
        <p
          className="mt-2 max-w-[52ch] text-[14.5px] leading-[1.6]"
          style={{ color: "var(--ink-secondary)" }}
        >
          Attribute token costs per tenant, prompt, and model provider across
          hosted APIs and private inference clusters.
        </p>

        {/* Horizontal Stacked Spend Bar (pure visual; interactive controls sit cleanly in the 2x3 grid below) */}
        <div
          aria-hidden="true"
          className="mt-7 flex h-3.5 w-full gap-[3px] overflow-hidden rounded-full"
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

        {/* 6 Providers arranged in a clean 2x3 selector grid */}
        <div className="mt-6 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
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
                className="btn-tactile flex min-h-[48px] cursor-pointer items-center justify-between rounded-xl border px-3.5 py-2.5 text-left"
                style={{
                  backgroundColor: isSelected
                    ? "var(--bg-surface-subtle)"
                    : "transparent",
                  borderColor: isSelected
                    ? "var(--accent-brand)"
                    : "var(--border-whisper)",
                }}
              >
                <span className="inline-flex min-w-0 items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: slice.color }}
                  />
                  <span
                    className="truncate text-[13px] font-medium"
                    style={{ color: "var(--ink-primary)" }}
                  >
                    {slice.name}
                  </span>
                </span>
                <span
                  className="tabular-telemetry text-[12.5px]"
                  style={{ color: "var(--ink-secondary)" }}
                >
                  {slice.sharePct}%
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Provider Detail Ledger */}
      <div
        className="mt-7 flex flex-wrap items-baseline justify-between gap-2 border-t pt-4"
        style={{ borderColor: "var(--border-whisper)" }}
      >
        <span
          className="text-[13px]"
          style={{ color: "var(--ink-secondary)" }}
        >
          <strong className="font-medium" style={{ color: "var(--ink-primary)" }}>
            {active.name}
          </strong>{" "}
          · {active.avgTokens}
        </span>
        <div className="tabular-telemetry text-right">
          <span
            className="text-[18px] font-medium"
            style={{ color: "var(--ink-primary)" }}
          >
            {active.costPer1k}
          </span>
          <span
            className="ml-1 text-[12.5px]"
            style={{ color: "var(--ink-secondary)" }}
          >
            / 1k runs
          </span>
        </div>
      </div>
    </div>
  );
}

/* ============================================================================
   EDITORIAL INTERACTIVE FEATURE SHOWCASE (Zero Bento Grid!)
   ============================================================================ */
export function CapabilitiesGrid() {
  const [activeTab, setActiveTab] = useState<CapabilityId>("router");
  const { prefersReducedMotion } = useBreakpoint();

  return (
    <section
      id="capabilities"
      aria-labelledby="capabilities-heading"
      className="scroll-mt-20 py-14 md:py-20"
    >
      <div className="spanrail-container"><ScrollReveal>
        <div className="max-w-[580px]">
          <h2 id="capabilities-heading" className="display-h2">
            Built for teams shipping real agents.
          </h2>
          <p
            className="mt-3 text-[16px] leading-[1.65] md:text-[17px]"
            style={{ color: "var(--ink-secondary)" }}
          >
            One quiet telemetry layer for inline safety switches, prompt
            regressions, and exact token accounting.
          </p>
        </div>

        {/* Phone Horizontal Switcher */}
        <div className="mt-7 flex gap-2 overflow-x-auto pb-1 lg:hidden">
          {CAPABILITY_INDEX.map((item) => {
            const isSelected = item.id === activeTab;
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => {
                  setActiveTab(item.id);
                  playSwitchClick(true);
                }}
                className="btn-tactile shrink-0 cursor-pointer rounded-full border px-4 py-2 text-[13px] font-medium"
                style={{
                  backgroundColor: isSelected
                    ? "var(--bg-surface)"
                    : "var(--bg-surface-subtle)",
                  borderColor: isSelected
                    ? "var(--accent-brand)"
                    : "var(--border-whisper)",
                  color: isSelected
                    ? "var(--ink-primary)"
                    : "var(--ink-secondary)",
                }}
              >
                {item.title}
              </button>
            );
          })}
        </div>

        {/* Desktop Editorial Index (Left 5 cols) + Spacious Interactive Stage (Right 7 cols) */}
        <div className="mt-6 grid grid-cols-1 items-stretch gap-8 lg:mt-10 lg:grid-cols-12 lg:gap-10">
          {/* Left Vertical Hairline Index (Zero boxed cards!) */}
          <div
            role="tablist"
            aria-label="Core Spanrail capabilities"
            className="hidden flex-col divide-y divide-[var(--border-whisper)] border-y lg:col-span-5 lg:flex"
            style={{ borderColor: "var(--border-whisper)" }}
          >
            {CAPABILITY_INDEX.map((item) => {
              const isSelected = item.id === activeTab;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
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
                  {/* Crisp Ocean Blue Left Active Rail */}
                  {isSelected && (
                    <motion.span
                      layoutId="capabilities-active-rail"
                      aria-hidden="true"
                      transition={
                        prefersReducedMotion ? REDUCED_TRANSITION : TACTILE_SPRING
                      }
                      className="absolute inset-y-3 left-0 w-[2.5px] rounded-full"
                      style={{ backgroundColor: "var(--accent-brand)" }}
                    />
                  )}

                  <div className="flex items-baseline gap-2.5">
                    <span
                      className="tabular-telemetry text-[12px] font-medium"
                      style={{
                        color: isSelected
                          ? "var(--accent-brand-text)"
                          : "var(--ink-muted)",
                      }}
                    >
                      {item.code}
                    </span>
                    <span
                      className="text-[16px] font-medium tracking-[-0.015em]"
                      style={{ color: "var(--ink-primary)" }}
                    >
                      {item.title}
                    </span>
                  </div>
                  <p
                    className="mt-1.5 pl-6 text-[13.5px] leading-[1.55]"
                    style={{ color: "var(--ink-secondary)" }}
                  >
                    {item.summary}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Right Spacious Interactive Showcase Stage */}
          <div
            role="tabpanel"
            className="surface-fade min-h-[390px] rounded-3xl border p-6 sm:p-8 md:p-9 lg:col-span-7"
            style={{
              backgroundColor: "var(--bg-surface)",
              borderColor: "var(--border-whisper)",
              boxShadow: "var(--shadow-stage)",
            }}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={activeTab}
                initial={
                  prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 8 }
                }
                animate={
                  prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0 }
                }
                exit={
                  prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -6 }
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
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </ScrollReveal></div>
    </section>
  );
}