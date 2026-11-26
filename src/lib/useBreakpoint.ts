"use client";

import { useSyncExternalStore } from "react";

export type BreakpointTier = "phone" | "tablet" | "desktop";

export interface BreakpointState {
  tier: BreakpointTier;
  isPhone: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  prefersReducedMotion: boolean;
  mounted: boolean;
}

const SERVER_SNAPSHOT: BreakpointState = {
  tier: "desktop",
  isPhone: false,
  isTablet: false,
  isDesktop: true,
  prefersReducedMotion: false,
  mounted: false,
};

let currentSnapshot: BreakpointState = SERVER_SNAPSHOT;
const listeners = new Set<() => void>();
let initialized = false;

function computeSnapshot(): BreakpointState {
  if (typeof window === "undefined") return SERVER_SNAPSHOT;
  const isPhone = window.matchMedia("(max-width: 767px)").matches;
  const isTablet =
    !isPhone && window.matchMedia("(max-width: 1023px)").matches;
  const tier: BreakpointTier = isPhone
    ? "phone"
    : isTablet
      ? "tablet"
      : "desktop";
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if (
    currentSnapshot.mounted &&
    currentSnapshot.tier === tier &&
    currentSnapshot.prefersReducedMotion === prefersReducedMotion
  ) {
    return currentSnapshot;
  }

  currentSnapshot = {
    tier,
    isPhone,
    isTablet,
    isDesktop: tier === "desktop",
    prefersReducedMotion,
    mounted: true,
  };
  return currentSnapshot;
}

function ensureInitialized() {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  computeSnapshot();

  const mqPhone = window.matchMedia("(max-width: 767px)");
  const mqTablet = window.matchMedia(
    "(min-width: 768px) and (max-width: 1023px)"
  );
  const mqReduced = window.matchMedia("(prefers-reduced-motion: reduce)");

  const notify = () => {
    const prev = currentSnapshot;
    const next = computeSnapshot();
    if (next !== prev) {
      listeners.forEach((cb) => cb());
    }
  };

  mqPhone.addEventListener("change", notify);
  mqTablet.addEventListener("change", notify);
  mqReduced.addEventListener("change", notify);
}

function subscribe(callback: () => void): () => void {
  ensureInitialized();
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

function getSnapshot(): BreakpointState {
  ensureInitialized();
  return currentSnapshot;
}

function getServerSnapshot(): BreakpointState {
  return SERVER_SNAPSHOT;
}

export function useBreakpoint(): BreakpointState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}