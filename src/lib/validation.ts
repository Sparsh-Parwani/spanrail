import { z } from "zod";

export const FREE_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "yahoo.com",
  "outlook.com",
  "hotmail.com",
  "icloud.com",
]);

export const VOLUME_TIERS = [
  "< 500k",
  "500k – 5M",
  "5M – 25M",
  "25M+",
] as const;

export const AGENT_STACKS = [
  "LangGraph",
  "Vercel AI SDK",
  "OpenAI Agents",
  "Custom TS/Python",
] as const;

export const PRIMARY_GOALS = [
  "Debug slow traces",
  "Cut token spend",
  "PII & safety guardrails",
  "Replace legacy APM",
] as const;

export type VolumeTier = (typeof VOLUME_TIERS)[number];
export type AgentStack = (typeof AGENT_STACKS)[number];
export type PrimaryGoal = (typeof PRIMARY_GOALS)[number];

export function extractEmailDomain(email: string): string {
  const parts = email.trim().toLowerCase().split("@");
  return parts.length === 2 ? (parts[1] ?? "") : "";
}

export const workEmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1, "Enter your work email address.")
  .email("Enter a valid email address (for example, alex@company.com).")
  .refine((value) => {
    const domain = extractEmailDomain(value);
    return domain.length > 2 && !FREE_EMAIL_DOMAINS.has(domain);
  }, {
    message:
      "Please use your work email address rather than a personal inbox (Gmail, Yahoo, Outlook, Hotmail, or iCloud).",
  });

export const demoStep1Schema = z.object({
  email: workEmailSchema,
  volumeTier: z.enum(VOLUME_TIERS, {
    errorMap: () => ({ message: "Select your monthly agent trace volume." }),
  }),
});

export const demoBookingSchema = demoStep1Schema.extend({
  agentStacks: z
    .array(z.enum(AGENT_STACKS))
    .min(1, "Choose at least one agent framework or runtime.")
    .max(4),
  primaryGoal: z.enum(PRIMARY_GOALS, {
    errorMap: () => ({ message: "Select your primary focus area." }),
  }),
  estimatedMonthlyUsd: z.number().nonnegative().max(1_000_000).optional(),
});

export type DemoStep1Input = z.infer<typeof demoStep1Schema>;
export type DemoBookingInput = z.infer<typeof demoBookingSchema>;

export interface DemoBookingResponse {
  bookingRef: string;
  email: string;
  companyDomain: string;
  volumeTier: VolumeTier;
  agentStacks: AgentStack[];
  primaryGoal: PrimaryGoal;
  scheduledWindow: string;
  summary: string;
  otelConfigFilename: string;
  otelConfigContent: string;
}
