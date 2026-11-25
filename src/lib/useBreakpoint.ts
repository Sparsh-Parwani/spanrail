"use client";

import { useEffect, useState } from "react";

export type BreakpointTier = "phone" | "tablet" | "desktop";

export interface BreakpointState {
  tier: BreakpointTier;
  isPhone: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  prefersReducedMotion: boolean;
  mounted: boolean;
}

const DEFAULT_STATE: BreakpointState = {
  tier: "desktop",
  isPhone: false,
  isTablet: false,
  isDesktop: true,
  prefersReducedMotion: false,
  mounted: false,
};

function readCurrentState(): BreakpointState {
  const width = window.innerWidth;
  const tier: BreakpointTier =
    width < 768 ? "phone" : width < 1024 ? "tablet" : "desktop";
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  return {
    tier,
    isPhone: tier === "phone",
    isTablet: tier === "tablet",
    isDesktop: tier === "desktop",
    prefersReducedMotion,
    mounted: true,
  };
}

export function useBreakpoint(): BreakpointState {
  const [state, setState] = useState<BreakpointState>(DEFAULT_STATE);

  useEffect(() => {
    const mqPhone = window.matchMedia("(max-width: 767px)");
    const mqTablet = window.matchMedia(
      "(min-width: 768px) and (max-width: 1023px)"
    );
    const mqReduced = window.matchMedia("(prefers-reduced-motion: reduce)");

    const update = () => {
      setState(readCurrentState());
    };

    update();

    mqPhone.addEventListener("change", update);
    mqTablet.addEventListener("change", update);
    mqReduced.addEventListener("change", update);

    return () => {
      mqPhone.removeEventListener("change", update);
      mqTablet.removeEventListener("change", update);
      mqReduced.removeEventListener("change", update);
    };
  }, []);

  return state;
}
