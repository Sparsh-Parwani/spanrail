"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, m } from "framer-motion";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import {
  AGENT_STACKS,
  PRIMARY_GOALS,
  VOLUME_TIERS,
  demoBookingSchema,
  workEmailSchema,
  type AgentStack,
  type DemoBookingResponse,
  type PrimaryGoal,
  type VolumeTier,
} from "@/lib/validation";
import {
  TRACE_TIERS,
  calculatePricing,
  mapTracesToDemoVolume,
} from "@/lib/pricing";
import { useSpanrailStore } from "@/store/useSpanrailStore";
import { playSuccessConfirm, playSwitchClick } from "@/lib/sound";
import { useBreakpoint } from "@/lib/useBreakpoint";
import { QuietStatusPill } from "@/components/ui/Primitives";
import { ScrollReveal } from "@/components/ui/ScrollReveal";

const STEPS = [
  { id: "contact", title: "Work details & volume", shortTitle: "Contact & volume" },
  { id: "runtime", title: "Agent stack & goal", shortTitle: "Stack & goal" },
] as const;

const contentVariants = {
  hidden: { opacity: 0, x: 32 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.24, ease: [0.22, 1, 0.36, 1] as const },
  },
  exit: {
    opacity: 0,
    x: -32,
    transition: { duration: 0.16, ease: [0.4, 0, 1, 1] as const },
  },
};

const INGEST_ENDPOINT = "https" + "://ingest.spanrail.dev/v1/traces";

const GENERIC_STARTER_CONFIG = `import { initSpanrail } from "@spanrail/otel";

export const spanrail = initSpanrail({
  serviceName: "agent-service",
  apiKey: process.env.SPANRAIL_API_KEY!,
  otlpEndpoint: "${INGEST_ENDPOINT}",
  guardrails: {
    semanticCache: { enabled: true, similarityThreshold: 0.96, ttlSeconds: 1800 },
    piiRedaction: { enabled: true, mode: "mask_inline", detectors: ["ssn", "credit_card", "api_key"] },
    loopBreaker: { enabled: true, maxRepeatedToolCalls: 2, maxRunCostUsd: 0.05 },
  },
});
`;

export function DemoBookingForm() {
  const traceTierIndex = useSpanrailStore((s) => s.traceTierIndex);
  const evalTierIndex = useSpanrailStore((s) => s.evalTierIndex);
  const retentionDays = useSpanrailStore((s) => s.retentionDays);
  const seats = useSpanrailStore((s) => s.seats);
  const billingCycle = useSpanrailStore((s) => s.billingCycle);
  const { prefersReducedMotion } = useBreakpoint();

  const syncedVolume = useMemo(() => {
    const tier = TRACE_TIERS[traceTierIndex] ?? TRACE_TIERS[3]!;
    return mapTracesToDemoVolume(tier.value);
  }, [traceTierIndex]);

  const currentPricing = useMemo(
    () =>
      calculatePricing({
        traceTierIndex,
        evalTierIndex,
        retentionDays,
        seats,
        billingCycle,
      }),
    [traceTierIndex, evalTierIndex, retentionDays, seats, billingCycle]
  );

  const [currentStep, setCurrentStep] = useState(0);
  const [email, setEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const emailInputRef = useRef<HTMLInputElement | null>(null);

  const [volumeTier, setVolumeTier] = useState<VolumeTier>(syncedVolume);
  const userOverrodeVolumeRef = useRef(false);
  const [agentStacks, setAgentStacks] = useState<AgentStack[]>([
    "Vercel AI SDK",
  ]);
  const [primaryGoal, setPrimaryGoal] = useState<PrimaryGoal>(
    "PII & safety guardrails"
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmation, setConfirmation] =
    useState<DemoBookingResponse | null>(null);

  useEffect(() => {
    if (!userOverrodeVolumeRef.current) {
      setVolumeTier(syncedVolume);
    }
  }, [syncedVolume]);

  const validateEmail = (val: string): string | null => {
    const parsed = workEmailSchema.safeParse(val);
    return parsed.success
      ? null
      : (parsed.error.issues[0]?.message ?? "Enter a valid work email.");
  };

  const handleEmailChange = (val: string) => {
    setEmail(val);
    if (emailTouched || emailError) {
      setEmailError(validateEmail(val));
    }
  };

  const toggleStack = (stack: AgentStack) => {
    setAgentStacks((prev) => {
      const exists = prev.includes(stack);
      playSwitchClick(!exists);
      return exists ? prev.filter((s) => s !== stack) : [...prev, stack];
    });
  };

  const isStepValid = (): boolean => {
    if (currentStep === 0) return validateEmail(email) === null;
    return agentStacks.length > 0 && Boolean(primaryGoal);
  };

  const handleNext = () => {
    setEmailTouched(true);
    const err = validateEmail(email);
    setEmailError(err);
    if (err) {
      playSwitchClick(false);
      emailInputRef.current?.focus();
      return;
    }
    setCurrentStep(1);
    playSwitchClick(true);
  };

  const handleSubmit = async () => {
    setSubmitError(null);
    const parsed = demoBookingSchema.safeParse({
      email,
      volumeTier,
      agentStacks,
      primaryGoal,
      estimatedMonthlyUsd: currentPricing.monthlyTotalUsd,
    });

    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      if (fieldErrors.email?.[0]) {
        setEmailError(fieldErrors.email[0]);
        setCurrentStep(0);
        window.setTimeout(() => emailInputRef.current?.focus(), 60);
      }
      setSubmitError("Please review your work email and agent stack.");
      playSwitchClick(false);
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/demo-booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const data = (await response.json()) as
        | DemoBookingResponse
        | { error?: string };

      if (!response.ok) {
        setSubmitError(
          (data as { error?: string }).error ??
            "Could not reserve briefing. Please retry."
        );
        playSwitchClick(false);
        return;
      }

      setConfirmation(data as DemoBookingResponse);
      playSuccessConfirm();
      toast.success("Architecture briefing confirmed");
    } catch {
      setSubmitError("Network error while submitting. Please try again.");
      playSwitchClick(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const triggerDownload = (filename: string, content: string) => {
    const blob = new Blob([content], {
      type: "text/typescript;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    playSuccessConfirm();
    toast.success(`Downloaded ${filename}`);
  };

  const handleReset = () => {
    setConfirmation(null);
    setCurrentStep(0);
    setSubmitError(null);
    playSwitchClick(false);
  };

  return (
    <section
      id="demo"
      aria-labelledby="demo-heading"
      className="scroll-mt-20 py-14 md:py-20"
    >
      <div className="spanrail-container">
        <ScrollReveal>
          <div className="mx-auto max-w-[580px] text-center">
            <h2 id="demo-heading" className="display-h2">
              Walk through your agent traces with engineering.
            </h2>
            <p
              className="mx-auto mt-3 max-w-[48ch] text-[15px] leading-[1.6] sm:text-[15.5px]"
              style={{ color: "var(--ink-secondary)" }}
            >
              Book a 25-minute review with a systems engineer, or grab the
              starter OpenTelemetry config below with zero signup.
            </p>
          </div>

          <div className="mx-auto mt-8 w-full max-w-[580px] sm:mt-9">
            {!confirmation && (
              <div className="mb-6 sm:mb-7">
                <div className="mb-2 flex items-center justify-between gap-2 px-0.5">
                  {STEPS.map((step, index) => {
                    const isActive = index === currentStep;
                    const isCompleted = index < currentStep;
                    const canJump = index <= currentStep;

                    return (
                      <button
                        key={step.id}
                        type="button"
                        disabled={!canJump}
                        onClick={() => {
                          if (canJump) {
                            setCurrentStep(index);
                            playSwitchClick(true);
                          }
                        }}
                        className="btn-tactile flex min-h-[40px] cursor-pointer items-center gap-2 rounded-lg px-1 disabled:cursor-default"
                      >
                        <span
                          aria-hidden="true"
                          className="h-3 w-3 shrink-0 rounded-full sm:h-3.5 sm:w-3.5"
                          style={{
                            backgroundColor:
                              isCompleted || isActive
                                ? "var(--accent-spark)"
                                : "var(--border-hover)",
                            boxShadow: isActive
                              ? "0 0 0 4px var(--accent-spark-soft)"
                              : "none",
                            transition:
                              "background-color 260ms var(--ease-enter), box-shadow 260ms var(--ease-enter)",
                          }}
                        />
                        <span
                          className="text-[12.5px] sm:text-[13px]"
                          style={{
                            color: isActive
                              ? "var(--ink-primary)"
                              : "var(--ink-secondary)",
                            fontWeight: isActive ? 500 : 400,
                          }}
                        >
                          <span className="sm:hidden">{step.shortTitle}</span>
                          <span className="hidden sm:inline">{step.title}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div
                  className="h-1.5 w-full overflow-hidden rounded-full"
                  style={{ backgroundColor: "var(--bg-surface-subtle)" }}
                >
                  <m.div
                    className="h-full w-full origin-left rounded-full"
                    style={{ backgroundColor: "var(--accent-spark)" }}
                    initial={false}
                    animate={{ scaleX: currentStep === 0 ? 0.5 : 1 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
              </div>
            )}

            <div
              className="surface-fade overflow-hidden rounded-2xl border sm:rounded-3xl"
              style={{
                backgroundColor: "var(--bg-surface)",
                borderColor: "var(--border-whisper)",
                boxShadow: "var(--shadow-stage)",
              }}
            >
              {confirmation ? (
                <m.div
                  initial={prefersReducedMotion ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="p-5 sm:p-7 md:p-9"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <QuietStatusPill tone="pass">
                      Architecture briefing confirmed
                    </QuietStatusPill>
                    <span
                      className="tabular-telemetry text-[12px] font-medium sm:text-[12.5px]"
                      style={{ color: "var(--ink-secondary)" }}
                    >
                      Ref · {confirmation.bookingRef}
                    </span>
                  </div>

                  <h3
                    className="mt-5 text-[20px] font-medium tracking-[-0.02em] sm:text-[21px]"
                    style={{ color: "var(--ink-primary)" }}
                  >
                    Your starter environment is ready.
                  </h3>

                  <p
                    className="mt-2.5 text-[14px] leading-[1.65] sm:text-[14.5px]"
                    style={{ color: "var(--ink-secondary)" }}
                  >
                    {confirmation.summary}
                  </p>

                  <pre
                    translate="no"
                    className="tabular-telemetry mt-5 max-h-[210px] overflow-auto rounded-2xl border p-3.5 text-[11.5px] leading-[1.65] sm:p-4 sm:text-[12px]"
                    style={{
                      backgroundColor: "var(--code-bg)",
                      borderColor: "var(--border-whisper)",
                      color: "var(--ink-primary)",
                    }}
                  >
                    <code>{confirmation.otelConfigContent}</code>
                  </pre>

                  <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        triggerDownload(
                          confirmation.otelConfigFilename,
                          confirmation.otelConfigContent
                        )
                      }
                      className="btn-tactile inline-flex min-h-[46px] flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl px-5 text-[14px] font-medium"
                      style={{
                        backgroundColor: "var(--btn-primary-bg)",
                        color: "var(--btn-primary-ink)",
                      }}
                    >
                      <Download className="h-4 w-4 shrink-0" />
                      <span>Download starter spanrail.otel.ts</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleReset}
                      className="btn-tactile inline-flex min-h-[46px] cursor-pointer items-center justify-center gap-1.5 rounded-2xl border px-4 text-[13px] font-medium [@media(hover:hover)]:hover:border-[var(--border-hover)]"
                      style={{
                        borderColor: "var(--border-whisper)",
                        color: "var(--ink-secondary)",
                      }}
                    >
                      <RotateCcw className="h-3.5 w-3.5 shrink-0" />
                      <span>Reset</span>
                    </button>
                  </div>
                </m.div>
              ) : (
                <div>
                  <div className="min-h-[286px] p-4 sm:min-h-[300px] sm:p-8">
                    <AnimatePresence mode="wait" initial={false}>
                      <m.div
                        key={currentStep}
                        initial={
                          prefersReducedMotion ? { opacity: 0 } : "hidden"
                        }
                        animate={
                          prefersReducedMotion ? { opacity: 1 } : "visible"
                        }
                        exit={prefersReducedMotion ? { opacity: 0 } : "exit"}
                        variants={contentVariants}
                      >
                        {currentStep === 0 && (
                          <div className="space-y-5">
                            <div>
                              <label
                                htmlFor="demo-work-email"
                                className="block text-[13.5px] font-medium"
                                style={{ color: "var(--ink-primary)" }}
                              >
                                Work email
                              </label>
                              <input
                                ref={emailInputRef}
                                id="demo-work-email"
                                type="email"
                                inputMode="email"
                                autoComplete="email"
                                autoCapitalize="none"
                                spellCheck={false}
                                placeholder="alex@company.com"
                                value={email}
                                onChange={(e) =>
                                  handleEmailChange(e.target.value)
                                }
                                onBlur={() => {
                                  setEmailTouched(true);
                                  if (email.trim())
                                    setEmailError(validateEmail(email));
                                }}
                                aria-invalid={Boolean(emailError)}
                                aria-describedby="demo-email-err"
                                className="mt-2 h-12 w-full rounded-xl border px-3.5 text-[16px] placeholder:text-[var(--ink-muted)] sm:px-4 sm:text-[15px]"
                                style={{
                                  backgroundColor: "var(--bg-surface-subtle)",
                                  borderColor: emailError
                                    ? "var(--status-warn-dot)"
                                    : "var(--border-whisper)",
                                  color: "var(--ink-primary)",
                                }}
                              />
                              <p
                                id="demo-email-err"
                                role={emailError ? "alert" : undefined}
                                className="mt-1.5 min-h-[18px] text-[12px]"
                                style={{
                                  color: emailError
                                    ? "var(--status-warn-text)"
                                    : "var(--ink-secondary)",
                                }}
                              >
                                {emailError ??
                                  "Work email required for dedicated sandbox provisioning."}
                              </p>
                            </div>

                            <div className="space-y-2.5">
                              <div className="flex flex-wrap items-baseline justify-between gap-2">
                                <span
                                  className="text-[13.5px] font-medium"
                                  style={{ color: "var(--ink-primary)" }}
                                >
                                  Monthly trace volume
                                </span>
                                {!userOverrodeVolumeRef.current && (
                                  <span
                                    className="text-[12px]"
                                    style={{ color: "var(--ink-secondary)" }}
                                  >
                                    Synced from calculator
                                  </span>
                                )}
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                {VOLUME_TIERS.map((tier) => {
                                  const active = volumeTier === tier;
                                  return (
                                    <button
                                      key={tier}
                                      type="button"
                                      aria-pressed={active}
                                      onClick={() => {
                                        userOverrodeVolumeRef.current = true;
                                        setVolumeTier(tier);
                                        playSwitchClick(true);
                                      }}
                                      className="btn-tactile tabular-telemetry min-h-[46px] cursor-pointer rounded-xl border px-3 text-[13.5px] font-medium"
                                      style={{
                                        backgroundColor: active
                                          ? "var(--accent-brand-soft)"
                                          : "var(--bg-surface-subtle)",
                                        borderColor: active
                                          ? "var(--accent-brand)"
                                          : "var(--border-whisper)",
                                        color: active
                                          ? "var(--accent-brand-text)"
                                          : "var(--ink-primary)",
                                      }}
                                    >
                                      {tier}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        )}

                        {currentStep === 1 && (
                          <div className="space-y-5">
                            <div className="space-y-2.5">
                              <span
                                className="block text-[13.5px] font-medium"
                                style={{ color: "var(--ink-primary)" }}
                              >
                                Primary agent stack
                              </span>
                              <div className="grid grid-cols-2 gap-2">
                                {AGENT_STACKS.map((stack) => {
                                  const active = agentStacks.includes(stack);
                                  return (
                                    <button
                                      key={stack}
                                      type="button"
                                      aria-pressed={active}
                                      onClick={() => toggleStack(stack)}
                                      className="btn-tactile flex min-h-[46px] cursor-pointer items-center justify-between gap-2 rounded-xl border px-3 text-left text-[13px] font-medium sm:px-3.5"
                                      style={{
                                        backgroundColor: active
                                          ? "var(--accent-spark-soft)"
                                          : "var(--bg-surface-subtle)",
                                        borderColor: active
                                          ? "var(--accent-spark)"
                                          : "var(--border-whisper)",
                                        color: active
                                          ? "var(--accent-spark-text)"
                                          : "var(--ink-primary)",
                                      }}
                                    >
                                      <span className="truncate">{stack}</span>
                                      {active && (
                                        <Check className="h-3.5 w-3.5 shrink-0" />
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            <div className="space-y-2.5">
                              <span
                                className="block text-[13.5px] font-medium"
                                style={{ color: "var(--ink-primary)" }}
                              >
                                Main engineering goal
                              </span>
                              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                {PRIMARY_GOALS.map((goal) => {
                                  const active = primaryGoal === goal;
                                  return (
                                    <button
                                      key={goal}
                                      type="button"
                                      aria-pressed={active}
                                      onClick={() => {
                                        setPrimaryGoal(goal);
                                        playSwitchClick(true);
                                      }}
                                      className="btn-tactile flex min-h-[46px] cursor-pointer items-center justify-between rounded-xl border px-3.5 text-left text-[13px] font-medium"
                                      style={{
                                        backgroundColor: active
                                          ? "var(--accent-brand-soft)"
                                          : "var(--bg-surface-subtle)",
                                        borderColor: active
                                          ? "var(--accent-brand)"
                                          : "var(--border-whisper)",
                                        color: active
                                          ? "var(--accent-brand-text)"
                                          : "var(--ink-primary)",
                                      }}
                                    >
                                      <span>{goal}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>

                            {submitError && (
                              <div
                                role="alert"
                                className="rounded-xl px-3.5 py-2.5 text-[13px]"
                                style={{
                                  backgroundColor: "var(--status-warn-soft)",
                                  color: "var(--status-warn-text)",
                                }}
                              >
                                {submitError}
                              </div>
                            )}
                          </div>
                        )}
                      </m.div>
                    </AnimatePresence>
                  </div>

                  {/* Action Footer: Balanced full-width mobile buttons -> edge-aligned on >=640px */}
                  <div
                    className="flex items-center justify-between gap-2.5 border-t px-4 py-3.5 sm:px-8 sm:py-4"
                    style={{ borderColor: "var(--border-whisper)" }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentStep(0);
                        playSwitchClick(false);
                      }}
                      disabled={currentStep === 0 || isSubmitting}
                      className="btn-tactile inline-flex min-h-[46px] flex-1 cursor-pointer items-center justify-center gap-1 rounded-2xl border px-4 text-[14px] font-medium sm:min-h-[42px] sm:flex-none sm:text-[13.5px] disabled:cursor-not-allowed disabled:opacity-40"
                      style={{
                        borderColor: "var(--border-whisper)",
                        backgroundColor: "var(--bg-surface-subtle)",
                        color: "var(--ink-primary)",
                      }}
                    >
                      <ChevronLeft className="h-4 w-4 shrink-0" />
                      <span>Back</span>
                    </button>

                    <button
                      type="button"
                      onClick={
                        currentStep === 1
                          ? () => void handleSubmit()
                          : handleNext
                      }
                      disabled={!isStepValid() || isSubmitting}
                      className="btn-tactile inline-flex min-h-[46px] flex-[1.5] cursor-pointer items-center justify-center gap-1.5 rounded-2xl px-5 text-[14px] font-medium sm:min-h-[42px] sm:flex-none sm:text-[13.5px] disabled:cursor-not-allowed disabled:opacity-45"
                      style={{
                        backgroundColor: "var(--btn-primary-bg)",
                        color: "var(--btn-primary-ink)",
                      }}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                          <span>Provisioning…</span>
                        </>
                      ) : currentStep === 1 ? (
                        <>
                          <span>Confirm briefing</span>
                          <Check className="h-4 w-4 shrink-0" />
                        </>
                      ) : (
                        <>
                          <span>Next</span>
                          <ChevronRight className="h-4 w-4 shrink-0" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Zero-Gate Self-Serve Escape Hatch for Developers */}
            {!confirmation && (
              <div className="mt-4 flex flex-col items-start justify-between gap-1.5 px-1 text-[12.5px] sm:flex-row sm:items-center sm:gap-2">
                <span
                  className="tabular-telemetry"
                  style={{ color: "var(--ink-secondary)" }}
                >
                  Step {currentStep + 1} of 2 — {STEPS[currentStep]!.title}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    triggerDownload("spanrail.otel.ts", GENERIC_STARTER_CONFIG)
                  }
                  className="inline-flex min-h-[44px] cursor-pointer items-center gap-1.5 font-medium underline-offset-4 sm:min-h-0 [@media(hover:hover)]:hover:underline"
                  style={{ color: "var(--accent-brand-text)" }}
                >
                  <Download className="h-3.5 w-3.5 shrink-0" />
                  <span>Just evaluating? Download generic OTel config</span>
                </button>
              </div>
            )}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}