"use client";

import {
  createContext,
  useContext,
  useId,
  useState,
  type ReactNode,
} from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import * as SliderPrimitive from "@radix-ui/react-slider";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { motion } from "framer-motion";
import { useBreakpoint } from "@/lib/useBreakpoint";

export const TACTILE_SPRING = {
  type: "spring" as const,
  stiffness: 440,
  damping: 34,
  mass: 0.8,
};

export const REDUCED_TRANSITION = {
  duration: 0.12,
};

/* ============================================================================
   SOFT SWITCH (@radix-ui/react-switch + calibrated spring thumb)
   ============================================================================ */
export interface SoftSwitchProps {
  id?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  ariaLabel?: string;
  ariaLabelledBy?: string;
  ariaDescribedBy?: string;
}

export function SoftSwitch({
  id,
  checked,
  onCheckedChange,
  disabled = false,
  ariaLabel,
  ariaLabelledBy,
  ariaDescribedBy,
}: SoftSwitchProps) {
  const { prefersReducedMotion } = useBreakpoint();

  return (
    <SwitchPrimitive.Root
      id={id}
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      aria-describedby={ariaDescribedBy}
      className="group relative inline-flex h-[26px] w-[44px] shrink-0 cursor-pointer items-center rounded-full p-[3px] disabled:cursor-not-allowed disabled:opacity-45"
      style={{
        backgroundColor: checked
          ? "var(--switch-track-on)"
          : "var(--switch-track-off)",
        transition:
          "background-color 220ms var(--ease-enter), opacity 180ms var(--ease-enter)",
      }}
    >
      {/* Expanded 44x44 invisible hit area for effortless touch ergonomics */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -inset-x-1 -inset-y-2.5"
      />
      <SwitchPrimitive.Thumb asChild>
        <motion.span
          layout={false}
          initial={false}
          animate={{ x: checked ? 18 : 0 }}
          transition={prefersReducedMotion ? REDUCED_TRANSITION : TACTILE_SPRING}
          className="block h-5 w-5 rounded-full group-active:scale-95"
          style={{
            backgroundColor: "var(--switch-thumb-bg)",
            boxShadow: "var(--switch-thumb-shadow)",
          }}
        />
      </SwitchPrimitive.Thumb>
    </SwitchPrimitive.Root>
  );
}

/* ============================================================================
   SOFT SLIDER (@radix-ui/react-slider with 44px mobile touch envelope)
   ============================================================================ */
export interface SoftSliderProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onValueChange: (value: number) => void;
  disabled?: boolean;
  ariaLabel: string;
  ariaValueText?: string;
}

export function SoftSlider({
  value,
  min,
  max,
  step = 1,
  onValueChange,
  disabled = false,
  ariaLabel,
  ariaValueText,
}: SoftSliderProps) {
  return (
    <SliderPrimitive.Root
      value={[value]}
      min={min}
      max={max}
      step={step}
      disabled={disabled}
      onValueChange={(vals) => {
        const next = vals[0];
        if (typeof next === "number") {
          onValueChange(next);
        }
      }}
      className="relative flex h-11 w-full touch-none items-center select-none data-[disabled]:cursor-not-allowed data-[disabled]:opacity-45"
    >
      <SliderPrimitive.Track
        className="relative h-1 w-full grow overflow-hidden rounded-full"
        style={{ backgroundColor: "var(--slider-track-bg)" }}
      >
        <SliderPrimitive.Range
          className="absolute h-full rounded-full"
          style={{ backgroundColor: "var(--slider-range-bg)" }}
        />
      </SliderPrimitive.Track>

      <SliderPrimitive.Thumb
        aria-label={ariaLabel}
        aria-valuetext={ariaValueText}
        className="relative block h-5 w-5 cursor-grab rounded-full border active:cursor-grabbing active:scale-95 hover:scale-105"
        style={{
          backgroundColor: "var(--slider-thumb-bg)",
          borderColor: "var(--slider-thumb-border)",
          boxShadow: "var(--slider-thumb-shadow)",
          transition:
            "transform 160ms var(--ease-enter), border-color 180ms var(--ease-enter)",
        }}
      >
        {/* Invisible >= 44x44 touch hit zone */}
        <span
          aria-hidden="true"
          className="absolute -inset-3 rounded-full"
        />
      </SliderPrimitive.Thumb>
    </SliderPrimitive.Root>
  );
}

/* ============================================================================
   SOFT TABS (@radix-ui/react-tabs + Framer Motion layoutId pill indicator)
   ============================================================================ */
interface SoftTabsContextValue {
  activeValue: string;
  indicatorId: string;
  prefersReducedMotion: boolean;
}

const SoftTabsContext = createContext<SoftTabsContextValue | null>(null);

export interface SoftTabsProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  layoutId?: string;
  className?: string;
  children: ReactNode;
}

export function SoftTabs({
  value,
  defaultValue = "",
  onValueChange,
  layoutId,
  className = "",
  children,
}: SoftTabsProps) {
  const autoId = useId();
  const { prefersReducedMotion } = useBreakpoint();
  const [internalValue, setInternalValue] = useState(defaultValue);

  const activeValue = value !== undefined ? value : internalValue;
  const indicatorId = layoutId ?? `soft-tabs-${autoId}`;

  const handleChange = (next: string) => {
    if (value === undefined) {
      setInternalValue(next);
    }
    onValueChange?.(next);
  };

  return (
    <SoftTabsContext.Provider
      value={{ activeValue, indicatorId, prefersReducedMotion }}
    >
      <TabsPrimitive.Root
        value={activeValue}
        onValueChange={handleChange}
        className={className}
      >
        {children}
      </TabsPrimitive.Root>
    </SoftTabsContext.Provider>
  );
}

export function SoftTabsList({
  className = "",
  ariaLabel,
  children,
}: {
  className?: string;
  ariaLabel?: string;
  children: ReactNode;
}) {
  return (
    <TabsPrimitive.List
      aria-label={ariaLabel}
      className={`inline-flex items-center gap-0.5 rounded-full border p-1 ${className}`}
      style={{
        backgroundColor: "var(--bg-surface-subtle)",
        borderColor: "var(--border-whisper)",
      }}
    >
      {children}
    </TabsPrimitive.List>
  );
}

export function SoftTabsTrigger({
  value,
  className = "",
  children,
}: {
  value: string;
  className?: string;
  children: ReactNode;
}) {
  const ctx = useContext(SoftTabsContext);
  const isActive = ctx?.activeValue === value;

  return (
    <TabsPrimitive.Trigger
      value={value}
      className={`relative z-0 inline-flex min-h-[36px] cursor-pointer items-center justify-center rounded-full px-3.5 py-1.5 text-[13px] font-medium select-none active:scale-[0.98] ${className}`}
      style={{
        color: isActive ? "var(--ink-primary)" : "var(--ink-secondary)",
        transition:
          "color 180ms var(--ease-enter), transform 140ms var(--ease-enter)",
      }}
    >
      {isActive && ctx && (
        <motion.span
          layoutId={ctx.indicatorId}
          aria-hidden="true"
          transition={
            ctx.prefersReducedMotion ? REDUCED_TRANSITION : TACTILE_SPRING
          }
          className="absolute inset-0 -z-10 rounded-full border"
          style={{
            backgroundColor: "var(--bg-surface)",
            borderColor: "var(--border-whisper)",
            boxShadow: "0 1px 2px rgba(9, 19, 24, 0.05)",
          }}
        />
      )}
      <span className="relative z-10 inline-flex items-center gap-1.5">
        {children}
      </span>
    </TabsPrimitive.Trigger>
  );
}

export function SoftTabsContent({
  value,
  className = "",
  children,
}: {
  value: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <TabsPrimitive.Content value={value} className={`outline-none ${className}`}>
      {children}
    </TabsPrimitive.Content>
  );
}

/* ============================================================================
   SEGMENTED CONTROL (Accessible radiogroup with spring layoutId pill)
   ============================================================================ */
export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  sublabel?: string;
}

export interface SegmentedControlProps<T extends string> {
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  layoutId?: string;
  fullWidth?: boolean;
  size?: "sm" | "md";
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  layoutId,
  fullWidth = false,
  size = "sm",
}: SegmentedControlProps<T>) {
  const autoId = useId();
  const { prefersReducedMotion } = useBreakpoint();
  const indicatorId = layoutId ?? `segmented-${autoId}`;

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={`inline-flex items-center gap-0.5 rounded-full border p-1 ${
        fullWidth ? "w-full" : ""
      }`}
      style={{
        backgroundColor: "var(--bg-surface-subtle)",
        borderColor: "var(--border-whisper)",
      }}
    >
      {options.map((option) => {
        const isActive = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            onClick={() => onChange(option.value)}
            className={`relative z-0 inline-flex cursor-pointer items-center justify-center rounded-full font-medium select-none active:scale-[0.98] ${
              fullWidth ? "flex-1" : ""
            } ${
              size === "md"
                ? "min-h-[40px] px-4 py-2 text-[13.5px]"
                : "min-h-[36px] px-3.5 py-1.5 text-[13px]"
            }`}
            style={{
              color: isActive ? "var(--ink-primary)" : "var(--ink-secondary)",
              transition:
                "color 180ms var(--ease-enter), transform 140ms var(--ease-enter)",
            }}
          >
            {isActive && (
              <motion.span
                layoutId={indicatorId}
                aria-hidden="true"
                transition={
                  prefersReducedMotion ? REDUCED_TRANSITION : TACTILE_SPRING
                }
                className="absolute inset-0 -z-10 rounded-full border"
                style={{
                  backgroundColor: "var(--bg-surface)",
                  borderColor: "var(--border-whisper)",
                  boxShadow: "0 1px 2px rgba(9, 19, 24, 0.05)",
                }}
              />
            )}
            <span className="relative z-10 inline-flex items-center gap-1.5 whitespace-nowrap">
              <span>{option.label}</span>
              {option.sublabel && (
                <span
                  className="text-[11.5px] font-normal"
                  style={{
                    color: isActive
                      ? "var(--accent-brand-text)"
                      : "var(--ink-secondary)",
                  }}
                >
                  {option.sublabel}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ============================================================================
   QUIET STATUS DOT & PILL (Strictly 6px muted dot + barely-there tint)
   ============================================================================ */
export type QuietTone = "neutral" | "brand" | "warn" | "pass";

const TONE_MAP: Record<
  QuietTone,
  { dot: string; bg: string; text: string }
> = {
  neutral: {
    dot: "var(--ink-muted)",
    bg: "var(--bg-surface-subtle)",
    text: "var(--ink-secondary)",
  },
  brand: {
    dot: "var(--accent-brand)",
    bg: "var(--accent-brand-soft)",
    text: "var(--accent-brand-text)",
  },
  warn: {
    dot: "var(--status-warn-dot)",
    bg: "var(--status-warn-soft)",
    text: "var(--status-warn-text)",
  },
  pass: {
    dot: "var(--status-pass-dot)",
    bg: "var(--status-pass-soft)",
    text: "var(--status-pass-text)",
  },
};

export function QuietStatusPill({
  tone,
  children,
  className = "",
}: {
  tone: QuietTone;
  children: ReactNode;
  className?: string;
}) {
  const styles = TONE_MAP[tone];
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-[12.5px] font-medium ${className}`}
      style={{
        backgroundColor: styles.bg,
        color: styles.text,
        transition:
          "background-color 240ms var(--ease-enter), color 240ms var(--ease-enter)",
      }}
    >
      <span
        aria-hidden="true"
        className="h-1.5 w-1.5 shrink-0 rounded-full"
        style={{
          backgroundColor: styles.dot,
          transition: "background-color 240ms var(--ease-enter)",
        }}
      />
      <span>{children}</span>
    </span>
  );
}
