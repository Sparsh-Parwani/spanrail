"use client";

import type { ReactNode } from "react";
import { m } from "framer-motion";
import { useBreakpoint } from "@/lib/useBreakpoint";

export function ScrollReveal({
  children,
  delay = 0,
  y = 22,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  const { prefersReducedMotion } = useBreakpoint();

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <m.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: "some" }}
      transition={{
        duration: 0.52,
        delay,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={className}
    >
      {children}
    </m.div>
  );
}