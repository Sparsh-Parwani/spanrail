"use client";

import { Toaster } from "sonner";
import { useBreakpoint } from "@/lib/useBreakpoint";

export function AppToaster() {
  const { isPhone } = useBreakpoint();

  return (
    <Toaster
      position={isPhone ? "top-center" : "bottom-right"}
      offset={isPhone ? "68px" : "20px"}
      toastOptions={{
        style: {
          background: "var(--bg-surface-solid)",
          color: "var(--ink-primary)",
          border: "1px solid var(--border-whisper)",
          boxShadow: "var(--shadow-card)",
          borderRadius: "14px",
          fontSize: "13.5px",
          fontFamily: "var(--font-sans)",
        },
      }}
    />
  );
}