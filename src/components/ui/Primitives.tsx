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
import { m } from "framer-motion";
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
        <m.span
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
  ariaLabel?: string;
  ariaLabelledBy?: string;
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
  ariaLabelledBy,
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
        className="relative h-1.5 w-full grow overflow-hidden rounded-full sm:h-1"
        style={{ backgroundColor: "var(--slider-track-bg)" }}
      >
        <SliderPrimitive.Range
          className="absolute h-full rounded-full"
          style={{ backgroundColor: "var(--slider-range-bg)" }}
        />
      </SliderPrimitive.Track>

      <SliderPrimitive.Thumb
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-valuetext={ariaValueText}
        className="relative block h-5 w-5 cursor-grab rounded-full border active:scale-95 active:cursor-grabbing [@media(hover:hover)]:hover:scale-105"
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
      className={`relative z-0 inline-flex min-h-[40px] cursor-pointer items-center justify-center rounded-full px-3 py-1.5 text-[13px] font-medium select-none active:scale-[0.98] sm:min-h-[36px] sm:px-3.5 ${className}`}
      style={{
        color: isActive ? "var(--ink-primary)" : "var(--ink-secondary)",
        transition:
          "color 180ms var(--ease-enter), transform 140ms var(--ease-enter)",
      }}
    >
      {isActive && ctx && (
        <m.span
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
    <TabsPrimitive.Content
      value={value}
      className={`rounded-2xl ${className}`}
    >
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
  stackSublabelOnMobile?: boolean;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  layoutId,
  fullWidth = false,
  size = "sm",
  stackSublabelOnMobile = false,
}: SegmentedControlProps<T>) {
  const autoId = useId();
  const { prefersReducedMotion } = useBreakpoint();
  const indicatorId = layoutId ?? `segmented-${autoId}`;

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={`${
        stackSublabelOnMobile
          ? "grid w-full auto-cols-fr grid-flow-col gap-1 rounded-2xl border p-1 sm:inline-flex sm:items-center sm:gap-0.5 sm:rounded-full"
          : `inline-flex items-center gap-0.5 rounded-full border p-1 ${
              fullWidth ? "w-full" : ""
            }`
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
            className={`relative z-0 inline-flex min-w-0 cursor-pointer items-center justify-center font-medium select-none active:scale-[0.98] ${
              fullWidth ? "flex-1" : ""
            } ${
              stackSublabelOnMobile
                ? "min-h-[54px] rounded-xl px-2 py-2 text-[13px] sm:min-h-[40px] sm:rounded-full sm:px-4 sm:py-2 sm:text-[13.5px]"
                : size === "md"
                  ? "min-h-[44px] rounded-full px-3.5 py-2 text-[13.5px] sm:min-h-[40px] sm:px-4"
                  : "min-h-[40px] rounded-full px-3 py-1.5 text-[13px] sm:min-h-[36px] sm:px-3.5"
            }`}
            style={{
              color: isActive ? "var(--ink-primary)" : "var(--ink-secondary)",
              transition:
                "color 180ms var(--ease-enter), transform 140ms var(--ease-enter)",
            }}
          >
            {isActive && (
              <m.span
                layoutId={indicatorId}
                aria-hidden="true"
                transition={
                  prefersReducedMotion ? REDUCED_TRANSITION : TACTILE_SPRING
                }
                className={`absolute inset-0 -z-10 border ${
                  stackSublabelOnMobile
                    ? "rounded-xl sm:rounded-full"
                    : "rounded-full"
                }`}
                style={{
                  backgroundColor: "var(--bg-surface)",
                  borderColor: "var(--border-whisper)",
                  boxShadow: "0 1px 2px rgba(9, 19, 24, 0.05)",
                }}
              />
            )}
            <span
              className={`relative z-10 inline-flex items-center whitespace-nowrap ${
                stackSublabelOnMobile
                  ? "flex-col gap-0.5 leading-tight sm:flex-row sm:gap-1.5"
                  : "gap-1.5"
              }`}
            >
              <span>{option.label}</span>
              {option.sublabel && (
                <span
                  className="tabular-telemetry text-[11px] font-normal sm:text-[11.5px]"
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