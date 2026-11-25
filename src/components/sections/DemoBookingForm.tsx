"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
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
  { id: "contact", title: "Work Details" },
  { id: "runtime", title: "Agent Stack" },
  { id: "goals", title: "Objectives" },
  { id: "guardrails", title: "Guardrails" },
] as const;

const DEPLOYMENT_MODES = [
  { value: "cloud", label: "Spanrail Cloud (US / EU / Asia)" },
  { value: "vpc", label: "Dedicated Private VPC" },
  { value: "hipaa", label: "HIPAA BAA / Isolated Cluster" },
] as const;

const GUARDRAIL_FEATURES = [
  "Semantic Cache",
  "Inline PII Masking",
  "Loop Breaker",
  "Prompt Replay Diff",
  "Per-Run Cost Caps",
  "OTLP Collector Sync",
] as const;

const fadeInUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.28 } },
};

const contentVariants = {
  hidden: { opacity: 0, x: 42 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] as const },
  },
  exit: {
    opacity: 0,
    x: -42,
    transition: { duration: 0.18, ease: [0.4, 0, 1, 1] as const },
  },
};

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
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [company, setCompany] = useState("");

  const [volumeTier, setVolumeTier] = useState<VolumeTier>(syncedVolume);
  const userOverrodeVolumeRef = useRef(false);
  const [agentStacks, setAgentStacks] = useState<AgentStack[]>([
    "Vercel AI SDK",
  ]);

  const [primaryGoal, setPrimaryGoal] = useState<PrimaryGoal>(
    "PII & safety guardrails"
  );
  const [deploymentMode, setDeploymentMode] = useState("cloud");

  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([
    "Semantic Cache",
    "Inline PII Masking",
    "Loop Breaker",
  ]);
  const [notes, setNotes] = useState("");

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

  const toggleFeature = (feat: string) => {
    setSelectedFeatures((prev) => {
      const exists = prev.includes(feat);
      playSwitchClick(!exists);
      return exists ? prev.filter((f) => f !== feat) : [...prev, feat];
    });
  };

  const isStepValid = (): boolean => {
    if (currentStep === 0) {
      return name.trim().length > 0 && validateEmail(email) === null;
    }
    if (currentStep === 1) {
      return agentStacks.length > 0;
    }
    if (currentStep === 2) {
      return Boolean(primaryGoal && deploymentMode);
    }
    return true;
  };

  const handleNext = () => {
    if (currentStep === 0) {
      setEmailTouched(true);
      const err = validateEmail(email);
      setEmailError(err);
      if (err || name.trim().length === 0) {
        playSwitchClick(false);
        return;
      }
    }
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
      playSwitchClick(true);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
      playSwitchClick(false);
    }
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
      setSubmitError("Please check your work email and agent stack selection.");
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

  const handleDownloadStarterConfig = () => {
    if (!confirmation) return;
    const blob = new Blob([confirmation.otelConfigContent], {
      type: "text/typescript;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = confirmation.otelConfigFilename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    playSuccessConfirm();
    toast.success(`Downloaded ${confirmation.otelConfigFilename}`);
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
              Tell us how your production agents run. We&apos;ll prepare a
              tailored OpenTelemetry starter config and review it live.
            </p>
          </div>

          <div className="mx-auto mt-9 w-full max-w-[580px]">
            {/* Animated Dot Stepper + Smooth Glowing Progress Bar (21st.dev OnboardingForm Aesthetic) */}
            {!confirmation && (
              <div className="mb-7">
                <div className="mb-2.5 flex justify-between px-1">
                  {STEPS.map((step, index) => {
                    const isActive = index === currentStep;
                    const isCompleted = index < currentStep;
                    const canJump = index <= currentStep;

                    return (
                      <motion.button
                        key={step.id}
                        type="button"
                        disabled={!canJump}
                        whileHover={canJump ? { scale: 1.08 } : undefined}
                        whileTap={canJump ? { scale: 0.95 } : undefined}
                        onClick={() => {
                          if (canJump) {
                            setCurrentStep(index);
                            playSwitchClick(true);
                          }
                        }}
                        className="flex cursor-pointer flex-col items-center disabled:cursor-default"
                      >
                        <span
                          className="h-4 w-4 rounded-full"
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
                          className="mt-2 hidden text-[12px] sm:block"
                          style={{
                            color: isActive
                              ? "var(--ink-primary)"
                              : "var(--ink-secondary)",
                            fontWeight: isActive ? 500 : 400,
                          }}
                        >
                          {step.title}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>

                <div
                  className="mt-2 h-1.5 w-full overflow-hidden rounded-full"
                  style={{ backgroundColor: "var(--bg-surface-subtle)" }}
                >
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: "var(--accent-spark)" }}
                    initial={{ width: "0%" }}
                    animate={{
                      width: `${(currentStep / (STEPS.length - 1)) * 100}%`,
                    }}
                    transition={{ duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
              </div>
            )}

            {/* Main Animated Form Card */}
            <div
              className="surface-fade overflow-hidden rounded-3xl border"
              style={{
                backgroundColor: "var(--bg-surface)",
                borderColor: "var(--border-whisper)",
                boxShadow: "var(--shadow-stage)",
              }}
            >
              {confirmation ? (
                <motion.div
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
                    Your starter environment is ready, {name.trim() || "team"}.
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
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={handleDownloadStarterConfig}
                      className="inline-flex min-h-[46px] flex-1 cursor-pointer items-center justify-center gap-2 rounded-2xl px-5 text-[14px] font-medium"
                      style={{
                        backgroundColor: "var(--btn-primary-bg)",
                        color: "var(--btn-primary-ink)",
                      }}
                    >
                      <Download className="h-4 w-4" />
                      <span>Download starter spanrail.otel.ts</span>
                    </motion.button>

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
                </motion.div>
              ) : (
                <div>
                  <div className="min-h-[340px] p-6 sm:p-8">
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.div
                        key={currentStep}
                        initial={prefersReducedMotion ? { opacity: 0 } : "hidden"}
                        animate={
                          prefersReducedMotion ? { opacity: 1 } : "visible"
                        }
                        exit={prefersReducedMotion ? { opacity: 0 } : "exit"}
                        variants={contentVariants}
                      >
                        {/* STEP 1 — WORK DETAILS */}
                        {currentStep === 0 && (
                          <div className="space-y-4">
                            <div>
                              <h3
                                className="text-[20px] font-medium tracking-[-0.02em]"
                                style={{ color: "var(--ink-primary)" }}
                              >
                                Tell us about your team
                              </h3>
                              <p
                                className="mt-1 text-[13.5px]"
                                style={{ color: "var(--ink-secondary)" }}
                              >
                                Start with your work contact so we can provision
                                a sandbox.
                              </p>
                            </div>

                            <motion.div variants={fadeInUp} className="space-y-1.5">
                              <label
                                htmlFor="demo-name"
                                className="block text-[13px] font-medium"
                                style={{ color: "var(--ink-primary)" }}
                              >
                                Full Name
                              </label>
                              <input
                                id="demo-name"
                                type="text"
                                placeholder="Alex Rivera"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="h-11 w-full rounded-xl border px-3.5 text-[14.5px] outline-none placeholder:text-[var(--ink-muted)]"
                                style={{
                                  backgroundColor: "var(--bg-surface-subtle)",
                                  borderColor: "var(--border-whisper)",
                                  color: "var(--ink-primary)",
                                }}
                              />
                            </motion.div>

                            <motion.div variants={fadeInUp} className="space-y-1.5">
                              <label
                                htmlFor="demo-work-email"
                                className="block text-[13px] font-medium"
                                style={{ color: "var(--ink-primary)" }}
                              >
                                Work Email
                              </label>
                              <input
                                id="demo-work-email"
                                type="email"
                                inputMode="email"
                                placeholder="alex@company.com"
                                value={email}
                                onChange={(e) => handleEmailChange(e.target.value)}
                                onBlur={() => {
                                  setEmailTouched(true);
                                  if (email.trim()) setEmailError(validateEmail(email));
                                }}
                                aria-invalid={Boolean(emailError)}
                                aria-describedby="demo-email-err"
                                className="h-11 w-full rounded-xl border px-3.5 text-[14.5px] outline-none placeholder:text-[var(--ink-muted)]"
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
                                className="min-h-[18px] text-[12px]"
                                style={{
                                  color: emailError
                                    ? "var(--status-warn-text)"
                                    : "var(--ink-secondary)",
                                }}
                              >
                                {emailError ??
                                  "Work domains only (Gmail, Yahoo, Outlook & iCloud blocked)."}
                              </p>
                            </motion.div>

                            <motion.div variants={fadeInUp} className="space-y-1.5">
                              <label
                                htmlFor="demo-company"
                                className="block text-[13px] font-medium"
                                style={{ color: "var(--ink-primary)" }}
                              >
                                Company / Engineering Org (Optional)
                              </label>
                              <input
                                id="demo-company"
                                type="text"
                                placeholder="Northstar Freight"
                                value={company}
                                onChange={(e) => setCompany(e.target.value)}
                                className="h-11 w-full rounded-xl border px-3.5 text-[14.5px] outline-none placeholder:text-[var(--ink-muted)]"
                                style={{
                                  backgroundColor: "var(--bg-surface-subtle)",
                                  borderColor: "var(--border-whisper)",
                                  color: "var(--ink-primary)",
                                }}
                              />
                            </motion.div>
                          </div>
                        )}

                        {/* STEP 2 — SCALE & AGENT RUNTIME */}
                        {currentStep === 1 && (
                          <div className="space-y-5">
                            <div>
                              <h3
                                className="text-[20px] font-medium tracking-[-0.02em]"
                                style={{ color: "var(--ink-primary)" }}
                              >
                                Agent runtime &amp; trace scale
                              </h3>
                              <p
                                className="mt-1 text-[13.5px]"
                                style={{ color: "var(--ink-secondary)" }}
                              >
                                Auto-synced with your pricing slider above.
                              </p>
                            </div>

                            <motion.div variants={fadeInUp} className="space-y-2">
                              <span
                                className="block text-[13px] font-medium"
                                style={{ color: "var(--ink-primary)" }}
                              >
                                Monthly trace volume
                              </span>
                              <div className="grid grid-cols-2 gap-2">
                                {VOLUME_TIERS.map((tier, idx) => {
                                  const active = volumeTier === tier;
                                  return (
                                    <motion.button
                                      key={tier}
                                      type="button"
                                      whileHover={{ scale: 1.02 }}
                                      whileTap={{ scale: 0.98 }}
                                      initial={{ opacity: 0, y: 8 }}
                                      animate={{
                                        opacity: 1,
                                        y: 0,
                                        transition: { delay: idx * 0.05 },
                                      }}
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
                                    </motion.button>
                                  );
                                })}
                              </div>
                            </motion.div>

                            <motion.div variants={fadeInUp} className="space-y-2">
                              <span
                                className="block text-[13px] font-medium"
                                style={{ color: "var(--ink-primary)" }}
                              >
                                Primary agent stack (select at least one)
                              </span>
                              <div className="grid grid-cols-2 gap-2">
                                {AGENT_STACKS.map((stack, idx) => {
                                  const active = agentStacks.includes(stack);
                                  return (
                                    <motion.button
                                      key={stack}
                                      type="button"
                                      whileHover={{ scale: 1.02 }}
                                      whileTap={{ scale: 0.98 }}
                                      initial={{ opacity: 0, x: -8 }}
                                      animate={{
                                        opacity: 1,
                                        x: 0,
                                        transition: { delay: 0.06 * idx },
                                      }}
                                      onClick={() => toggleStack(stack)}
                                      className="flex min-h-[44px] cursor-pointer items-center justify-between rounded-xl border px-3.5 text-left text-[13px] font-medium"
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
                                    </motion.button>
                                  );
                                })}
                              </div>
                            </motion.div>
                          </div>
                        )}

                        {/* STEP 3 — OBJECTIVES & DEPLOYMENT */}
                        {currentStep === 2 && (
                          <div className="space-y-5">
                            <div>
                              <h3
                                className="text-[20px] font-medium tracking-[-0.02em]"
                                style={{ color: "var(--ink-primary)" }}
                              >
                                Primary engineering objective
                              </h3>
                              <p
                                className="mt-1 text-[13.5px]"
                                style={{ color: "var(--ink-secondary)" }}
                              >
                                Shapes the default rules inside your starter
                                OpenTelemetry config.
                              </p>
                            </div>

                            <div className="space-y-2">
                              {PRIMARY_GOALS.map((goal, idx) => {
                                const active = primaryGoal === goal;
                                return (
                                  <motion.button
                                    key={goal}
                                    type="button"
                                    whileHover={{ scale: 1.015 }}
                                    whileTap={{ scale: 0.985 }}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{
                                      opacity: 1,
                                      x: 0,
                                      transition: { delay: 0.07 * idx },
                                    }}
                                    onClick={() => {
                                      setPrimaryGoal(goal);
                                      playSwitchClick(true);
                                    }}
                                    className="flex min-h-[44px] w-full cursor-pointer items-center justify-between rounded-xl border px-4 text-left text-[13.5px] font-medium"
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
                                    <span
                                      className="h-3.5 w-3.5 rounded-full border"
                                      style={{
                                        borderColor: active
                                          ? "var(--accent-brand)"
                                          : "var(--border-hover)",
                                        backgroundColor: active
                                          ? "var(--accent-brand)"
                                          : "transparent",
                                      }}
                                    />
                                  </motion.button>
                                );
                              })}
                            </div>

                            <motion.div variants={fadeInUp} className="space-y-1.5">
                              <label
                                htmlFor="demo-deploy"
                                className="block text-[13px] font-medium"
                                style={{ color: "var(--ink-primary)" }}
                              >
                                Deployment environment
                              </label>
                              <select
                                id="demo-deploy"
                                value={deploymentMode}
                                onChange={(e) => setDeploymentMode(e.target.value)}
                                className="h-11 w-full rounded-xl border px-3.5 text-[14px] outline-none"
                                style={{
                                  backgroundColor: "var(--bg-surface-subtle)",
                                  borderColor: "var(--border-whisper)",
                                  color: "var(--ink-primary)",
                                }}
                              >
                                {DEPLOYMENT_MODES.map((m) => (
                                  <option key={m.value} value={m.value}>
                                    {m.label}
                                  </option>
                                ))}
                              </select>
                            </motion.div>
                          </div>
                        )}

                        {/* STEP 4 — GUARDRAILS & FINAL NOTES */}
                        {currentStep === 3 && (
                          <div className="space-y-5">
                            <div>
                              <h3
                                className="text-[20px] font-medium tracking-[-0.02em]"
                                style={{ color: "var(--ink-primary)" }}
                              >
                                Guardrails &amp; notes
                              </h3>
                              <p
                                className="mt-1 text-[13.5px]"
                                style={{ color: "var(--ink-secondary)" }}
                              >
                                Select any inline switches to pre-enable in your
                                briefing sandbox.
                              </p>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              {GUARDRAIL_FEATURES.map((feat, idx) => {
                                const active = selectedFeatures.includes(feat);
                                return (
                                  <motion.button
                                    key={feat}
                                    type="button"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{
                                      opacity: 1,
                                      y: 0,
                                      transition: { delay: 0.04 * idx },
                                    }}
                                    onClick={() => toggleFeature(feat)}
                                    className="flex min-h-[42px] cursor-pointer items-center gap-2.5 rounded-xl border px-3 text-left text-[12.5px] font-medium"
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
                                    <span
                                      className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded border"
                                      style={{
                                        borderColor: active
                                          ? "var(--accent-spark)"
                                          : "var(--border-hover)",
                                        backgroundColor: active
                                          ? "var(--accent-spark)"
                                          : "transparent",
                                        color: "#ffffff",
                                      }}
                                    >
                                      {active && <Check className="h-3 w-3" />}
                                    </span>
                                    <span className="truncate">{feat}</span>
                                  </motion.button>
                                );
                              })}
                            </div>

                            <motion.div variants={fadeInUp} className="space-y-1.5">
                              <label
                                htmlFor="demo-notes"
                                className="block text-[13px] font-medium"
                                style={{ color: "var(--ink-primary)" }}
                              >
                                Architecture notes (Optional)
                              </label>
                              <textarea
                                id="demo-notes"
                                rows={3}
                                placeholder="e.g. Multi-agent customer support flow calling Stripe & Postgres..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                className="w-full rounded-xl border p-3.5 text-[14px] outline-none placeholder:text-[var(--ink-muted)]"
                                style={{
                                  backgroundColor: "var(--bg-surface-subtle)",
                                  borderColor: "var(--border-whisper)",
                                  color: "var(--ink-primary)",
                                }}
                              />
                            </motion.div>

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
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  {/* Animated Back / Next Footer Bar */}
                  <div
                    className="flex items-center justify-between border-t px-6 py-4 sm:px-8"
                    style={{ borderColor: "var(--border-whisper)" }}
                  >
                    <motion.button
                      type="button"
                      whileHover={currentStep > 0 ? { scale: 1.04 } : undefined}
                      whileTap={currentStep > 0 ? { scale: 0.96 } : undefined}
                      onClick={handlePrev}
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
                    </motion.button>

                    <motion.button
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
                        currentStep === STEPS.length - 1
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
                      ) : currentStep === STEPS.length - 1 ? (
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
                    </motion.button>
                  </div>
                </div>
              )}
            </div>

            {!confirmation && (
              <p
                className="tabular-telemetry mt-4 text-center text-[12.5px]"
                style={{ color: "var(--ink-secondary)" }}
              >
                Step {currentStep + 1} of {STEPS.length}:{" "}
                {STEPS[currentStep]!.title}
              </p>
            )}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}