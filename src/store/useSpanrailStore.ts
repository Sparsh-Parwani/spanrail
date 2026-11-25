"use client";

import { create } from "zustand";
import type { ScenarioId, GuardrailState } from "@/lib/sandboxData";
import type { BillingCycle, RetentionDays } from "@/lib/pricing";

export type ThemeMode = "light" | "dark";

/**
 * Mutable pointer target read directly inside the R3F useFrame loop at 60fps
 * without triggering React or Zustand re-renders on pointermove.
 */
export const heroPointerRef = {
  x: 0.5,
  y: 0.45,
  active: false,
};

export function computeChaosTarget(guardrails: GuardrailState): number {
  const activeCount =
    (guardrails.semanticCache ? 1 : 0) +
    (guardrails.piiRedaction ? 1 : 0) +
    (guardrails.loopBreaker ? 1 : 0);

  if (activeCount === 0) return 1.0;
  if (activeCount === 1) return 0.66;
  if (activeCount === 2) return 0.33;
  return 0.0;
}

interface SpanrailStoreState {
  // Appearance & audio
  theme: ThemeMode;
  isSoundEnabled: boolean;

  // Interactive Hero Live Trace Sandbox
  scenarioId: ScenarioId;
  guardrails: GuardrailState;
  chaosTarget: number;
  expandedSpanId: string | null;

  // Shared Pricing Calculator state (drives MobileBottomDock + Demo form preselect)
  traceTierIndex: number;
  evalTierIndex: number;
  retentionDays: RetentionDays;
  seats: number;
  billingCycle: BillingCycle;

  // Actions
  hydrateTheme: (theme: ThemeMode) => void;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  setSoundEnabled: (enabled: boolean) => void;
  toggleSound: () => boolean;

  setScenarioId: (scenarioId: ScenarioId) => void;
  toggleGuardrail: (key: keyof GuardrailState) => {
    nextValue: boolean;
    allEnabled: boolean;
  };
  setExpandedSpanId: (spanId: string | null) => void;
  toggleExpandedSpanId: (spanId: string) => void;

  setTraceTierIndex: (index: number) => void;
  setEvalTierIndex: (index: number) => void;
  setRetentionDays: (days: RetentionDays) => void;
  setSeats: (seats: number) => void;
  setBillingCycle: (cycle: BillingCycle) => void;
  hydratePricing: (partial: {
    traceTierIndex: number;
    evalTierIndex: number;
    retentionDays: RetentionDays;
    seats: number;
    billingCycle: BillingCycle;
  }) => void;
}

function applyThemeToDocument(theme: ThemeMode): void {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  try {
    window.localStorage.setItem("spanrail-theme", theme);
  } catch {
    // Ignore storage quota or private-mode restrictions
  }
}

export const useSpanrailStore = create<SpanrailStoreState>((set, get) => ({
  theme: "dark",
  isSoundEnabled: true,

  scenarioId: "refund",
  guardrails: {
    semanticCache: false,
    piiRedaction: false,
    loopBreaker: false,
  },
  chaosTarget: 1.0,
  expandedSpanId: null,

  traceTierIndex: 3, // 2.5M traces/mo default
  evalTierIndex: 2, // 250k evals/mo default
  retentionDays: 30,
  seats: 5,
  billingCycle: "annual",

  hydrateTheme: (theme) => {
    set({ theme });
  },

  setTheme: (theme) => {
    applyThemeToDocument(theme);
    set({ theme });
  },

  toggleTheme: () => {
    const next: ThemeMode = "dark";
    applyThemeToDocument(next);
    set({ theme: next });
  },

  setSoundEnabled: (enabled) => {
    set({ isSoundEnabled: enabled });
  },

  toggleSound: () => {
    const next = !get().isSoundEnabled;
    set({ isSoundEnabled: next });
    return next;
  },

  setScenarioId: (scenarioId) => {
    set({ scenarioId, expandedSpanId: null });
  },

  toggleGuardrail: (key) => {
    const prev = get().guardrails;
    const nextGuardrails: GuardrailState = {
      ...prev,
      [key]: !prev[key],
    };
    const nextChaos = computeChaosTarget(nextGuardrails);
    const wasAllEnabled =
      prev.semanticCache && prev.piiRedaction && prev.loopBreaker;
    const isNowAllEnabled =
      nextGuardrails.semanticCache &&
      nextGuardrails.piiRedaction &&
      nextGuardrails.loopBreaker;

    set({
      guardrails: nextGuardrails,
      chaosTarget: nextChaos,
    });

    return {
      nextValue: nextGuardrails[key],
      allEnabled: !wasAllEnabled && isNowAllEnabled,
    };
  },

  setExpandedSpanId: (spanId) => {
    set({ expandedSpanId: spanId });
  },

  toggleExpandedSpanId: (spanId) => {
    set((state) => ({
      expandedSpanId: state.expandedSpanId === spanId ? null : spanId,
    }));
  },

  setTraceTierIndex: (index) => {
    const clamped = Math.max(0, Math.min(7, Math.round(index)));
    set({ traceTierIndex: clamped });
  },

  setEvalTierIndex: (index) => {
    const clamped = Math.max(0, Math.min(4, Math.round(index)));
    set({ evalTierIndex: clamped });
  },

  setRetentionDays: (days) => {
    set({ retentionDays: days });
  },

  setSeats: (seats) => {
    const clamped = Math.max(1, Math.min(50, Math.round(seats)));
    set({ seats: clamped });
  },

  setBillingCycle: (cycle) => {
    set({ billingCycle: cycle });
  },

  hydratePricing: (partial) => {
    set(partial);
  },
}));
