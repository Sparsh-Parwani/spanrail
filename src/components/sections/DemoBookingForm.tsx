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
  { id: "contact", title: "Work Details & Volume" },
  { id: "runtime", title: "Agent Stack & Goal" },
] as const;

const contentVariants = {
  hidden: { opacity: 0, x: 40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.26, ease: [0.22, 1, 0.36, 1] as const },
  },
  exit: {
    opacity: 0,
    x: -40,
    transition: { duration: 0.18, ease: [0.4, 0, 1, 1] as const },
  },
};

const GENERIC_STARTER_CONFIG = `import { initSpanrail } from "@spanrail/otel";

export const spanrail = initSpanrail({
  serviceName: "agent-service",
  apiKey: process.env.SPANRAIL_API_KEY!,
  otlpEndpoint: "https://ingest.spanrail.dev/v1/traces",
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
      toast.success("Architecture briefing confirmed!");
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
              className="mx-auto mt-3 max-w-[48ch] text-[15.5px] leading-[1.6]"
              style={{ color: "var(--ink-secondary)" }}
            >
              Book a 25-minute review with a systems engineer, or grab the
              starter OpenTelemetry config below with zero signup.
            </p>
          </div>

          <div className="mx-auto mt-9 w-full max-w-[580px]">
            {!confirmation && (
              <div className="mb-7">
                <div className="mb-2.5 flex justify-between px-1">
                  {STEPS.map((step, index) => {
                    const isActive = index === currentStep;
                    const isCompleted = index < currentStep;
                    const canJump = index <= currentStep;

                    return (
                      <m.button
                        key={step.id}
                        type="button"
                        disabled={!canJump}
                        whileHover={canJump ? { scale: 1.06 } : undefined}
                        whileTap={canJump ? { scale: 0.95 } : undefined}
                        onClick={() => {
                          if (canJump) {
                            setCurrentStep(index);
                            playSwitchClick(true);
                          }
                        }}
                        className="flex cursor-pointer items-center gap-2.5 disabled:cursor-default"
                      >
                        <span
                          className="h-3.5 w-3.5 rounded-full"
                          style={{
                            backgroundColor:
                              isCompleted || isActive
                                ? "var(--accent-spark)"
                                : "var(--border-hover)",
                            boxShadow: isActive
                              ? "0 0 0 5px var(--accent-spark-soft)"
                              : "none",
                            transition:
                              "background-color 260ms var(--ease-enter), box-shadow 260ms var(--ease-enter)",
                          }}
                        />
                        <span
                          className="text-[12.5px]"
                          style={{
                            color: isActive
                              ? "var(--ink-primary)"
                              : "var(--ink-secondary)",
                            fontWeight: isActive ? 500 : 400,
                          }}
                        >
                          {step.title}
                        </span>
                      </m.button>
                    );
                  })}
                </div>

                <div
                  className="mt-2 h-1.5 w-full overflow-hidden rounded-full"
                  style={{ backgroundColor: "var(--bg-surface-subtle)" }}
                >
                  <m.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: "var(--accent-spark)" }}
                    initial={false}
                    animate={{ width: currentStep === 0 ? "50%" : "100%" }}
                    transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
              </div>
            )}

            <div
              className="surface-fade overflow-hidden rounded-3xl border"
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
                  className="p-7 md:p-9"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <QuietStatusPill tone="pass">
                      Architecture briefing confirmed
                    </QuietStatusPill>
                    <span
                      className="tabular-telemetry text-[12.5px] font-medium"
                      style={{ color: "var(--ink-secondary)" }}
                    >
                      Ref · {confirmation.bookingRef}
                    </span>
                  </div>

                  <h3
                    className="mt-5 text-[21px] font-medium tracking-[-0.02em]"
                    style={{ color: "var(--ink-primary)" }}
                  >
                    Your starter environment is ready.
                  </h3>

                  <p
                    className="mt-2.5 text-[14.5px] leading-[1.65]"
                    style={{ color: "var(--ink-secondary)" }}
                  >
                    {confirmation.summary}
                  </p>

                  <pre
                    className="tabular-telemetry mt-5 max-h-[210px] overflow-auto rounded-2xl border p-4 text-[12px] leading-[1.65]"
                    style={{
                      backgroundColor: "var(--code-bg)",
                      borderColor: "var(--border-whisper)",
                      color: "var(--ink-primary)",
                    }}
                  >
                    <code>{confirmation.otelConfigContent}</code>
                  </pre>

                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    <m.button
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() =>
                        triggerDownload(
                          confirmation.otelConfigFilename,
                          confirmation.otelConfigContent
                        )
                      }
                      className="inline-flex min-h-[46px] flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl px-5 text-[14px] font-medium"
                      style={{
                        backgroundColor: "var(--btn-primary-bg)",
                        color: "var(--btn-primary-ink)",
                      }}
                    >
                      <Download className="h-4 w-4" />
                      <span>Download starter spanrail.otel.ts</span>
                    </m.button>

                    <button
                      type="button"
                      onClick={handleReset}
                      className="btn-tactile inline-flex min-h-[46px] cursor-pointer items-center gap-1.5 rounded-2xl border px-4 text-[13px] font-medium hover:border-[var(--border-hover)]"
                      style={{
                        borderColor: "var(--border-whisper)",
                        color: "var(--ink-secondary)",
                      }}
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Reset</span>
                    </button>
                  </div>
                </m.div>
              ) : (
                <div>
                  <div className="min-h-[300px] p-6 sm:p-8">
                    <AnimatePresence mode="wait" initial={false}>
                      <m.div
                        key={currentStep}
                        initial={prefersReducedMotion ? { opacity: 0 } : "hidden"}
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
                                id="demo-work-email"
                                type="email"
                                inputMode="email"
                                autoComplete="email"
                                placeholder="alex@company.com"
                                value={email}
                                onChange={(e) => handleEmailChange(e.target.value)}
                                onBlur={() => {
                                  setEmailTouched(true);
                                  if (email.trim())
                                    setEmailError(validateEmail(email));
                                }}
                                aria-invalid={Boolean(emailError)}
                                aria-describedby="demo-email-err"
                                className="mt-2 h-12 w-full rounded-xl border px-4 text-[15px] placeholder:text-[var(--ink-muted)]"
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

                            <div className="space-y-2">
                              <div className="flex items-baseline justify-between gap-2">
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
                                    <m.button
                                      key={tier}
                                      type="button"
                                      whileHover={{ scale: 1.02 }}
                                      whileTap={{ scale: 0.98 }}
                                      onClick={() => {
                                        userOverrodeVolumeRef.current = true;
                                        setVolumeTier(tier);
                                        playSwitchClick(true);
                                      }}
                                      className="tabular-telemetry min-h-[44px] cursor-pointer rounded-xl border px-3 text-[13.5px] font-medium"
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
                                    </m.button>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        )}

                        {currentStep === 1 && (
                          <div className="space-y-5">
                            <div className="space-y-2">
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
                                    <m.button
                                      key={stack}
                                      type="button"
                                      whileHover={{ scale: 1.02 }}
                                      whileTap={{ scale: 0.98 }}
                                      onClick={() => toggleStack(stack)}
                                      className="flex min-h-[44px] cursor-pointer items-center justify-between rounded-xl border px-3.5 text-[left text-[13px] font-medium"
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
                                    </m.button>
                                  );
                                })}
                              </div>
                            </div>

                            <div className="space-y-2">
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
                                    <m.button
                                      key={goal}
                                      type="button"
                                      whileHover={{ scale: 1.015 }}
                                      whileTap={{ scale: 0.985 }}
                                      onClick={() => {
                                        setPrimaryGoal(goal);
                                        playSwitchClick(true);
                                      }}
                                      className="flex min-h-[44px] cursor-pointer items-center justify-between rounded-xl border px-3.5 text-[left text-[13px] font-medium"
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
                                    </m.button>
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

                  <div
                    className="flex items-center justify-between border-t px-6 py-4 sm:px-8"
                    style={{ borderColor: "var(--border-whisper)" }}
                  >
                    <m.button
                      type="button"
                      whileHover={currentStep > 0 ? { scale: 1.04 } : undefined}
                      whileTap={currentStep > 0 ? { scale: 0.96 } : undefined}
                      onClick={() => {
                        setCurrentStep(0);
                        playSwitchClick(false);
                      }}
                      disabled={currentStep === 0 || isSubmitting}
                      className="inline-flex min-h-[42px] cursor-pointer items-center gap-1 rounded-2xl border px-4 text-[13.5px] font-medium disabled:cursor-not-allowed disabled:opacity-40"
                      style={{
                        borderColor: "var(--border-whisper)",
                        backgroundColor: "var(--bg-surface-subtle)",
                        color: "var(--ink-primary)",
                      }}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span>Back</span>
                    </m.button>

                    <m.button
                      type="button"
                      whileHover={
                        isStepValid() && !isSubmitting
                          ? { scale: 1.04 }
                          : undefined
                      }
                      whileTap={
                        isStepValid() && !isSubmitting
                          ? { scale: 0.96 }
                          : undefined
                      }
                      onClick={
                        currentStep === 1
                          ? () => void handleSubmit()
                          : handleNext
                      }
                      disabled={!isStepValid() || isSubmitting}
                      className="inline-flex min-h-[42px] cursor-pointer items-center gap-1.5 rounded-2xl px-5 text-[13.5px] font-medium disabled:cursor-not-allowed disabled:opacity-45"
                      style={{
                        backgroundColor: "var(--btn-primary-bg)",
                        color: "var(--btn-primary-ink)",
                      }}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Provisioning…</span>
                        </>
                      ) : currentStep === 1 ? (
                        <>
                          <span>Confirm briefing</span>
                          <Check className="h-4 w-4" />
                        </>
                      ) : (
                        <>
                          <span>Next</span>
                          <ChevronRight className="h-4 w-4" />
                        </>
                      )}
                    </m.button>
                  </div>
                </div>
              )}
            </div>

            {/* Zero-Gate Self-Serve Escape Hatch for Developers */}
            {!confirmation && (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2 px-1 text-[12.5px]">
                <span
                  className="tabular-telemetry"
                  style={{ color: "var(--ink-secondary)" }}
                >
                  Step {currentStep + 1} of 2 · {STEPS[currentStep]!.title}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    triggerDownload("spanrail.otel.ts", GENERIC_STARTER_CONFIG)
                  }
                  className="inline-flex cursor-pointer items-center gap-1.5 font-medium underline-offset-4 hover:underline"
                  style={{ color: "var(--accent-brand-text)" }}
                >
                  <Download className="h-3.5 w-3.5" />
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