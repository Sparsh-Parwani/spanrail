"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { playSuccessConfirm } from "@/lib/sound";

export interface CodeBlockProps {
  filename: string;
  label: string;
  code: string;
}

export function CodeBlock({ filename, label, code }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      playSuccessConfirm();
      toast.success(`${label} snippet copied`);
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
      timerRef.current = window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Unable to access clipboard in this browser.");
    }
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--border-whisper)] bg-[var(--code-bg)]">
      <div className="flex items-center justify-between gap-2 border-b border-[var(--border-whisper)] px-3.5 py-2 sm:px-4">
        <span
          translate="no"
          className="tabular-telemetry truncate text-[12px] text-[var(--ink-secondary)]"
        >
          {filename}
        </span>

        <button
          type="button"
          onClick={() => void handleCopy()}
          aria-label={copied ? `${label} snippet copied` : `Copy ${label} snippet`}
          className={`btn-tactile inline-grid min-h-[36px] shrink-0 cursor-pointer items-center justify-items-center rounded-full border bg-[var(--bg-surface-subtle)] px-3 text-[12px] font-medium [@media(hover:hover)]:hover:border-[var(--border-hover)] ${
            copied
              ? "border-[var(--status-pass-dot)] text-[var(--status-pass-text)]"
              : "border-[var(--border-whisper)] text-[var(--ink-primary)]"
          }`}
        >
          <span
            aria-hidden={copied}
            className={`col-start-1 row-start-1 inline-flex items-center gap-1.5 transition-opacity duration-150 ${
              copied ? "opacity-0" : "opacity-100"
            }`}
          >
            <Copy className="h-3.5 w-3.5 shrink-0" />
            <span>Copy</span>
          </span>
          <span
            aria-hidden={!copied}
            className={`col-start-1 row-start-1 inline-flex items-center gap-1.5 transition-opacity duration-150 ${
              copied ? "opacity-100" : "opacity-0"
            }`}
          >
            <Check className="h-3.5 w-3.5 shrink-0 text-[var(--status-pass-text)]" />
            <span>Copied</span>
          </span>
        </button>
      </div>

      <pre
        translate="no"
        className="tabular-telemetry overflow-x-auto p-3.5 text-[12px] leading-[1.7] text-[var(--ink-primary)] sm:p-5 sm:text-[13px] sm:leading-[1.75]"
      >
        <code>{code}</code>
      </pre>
    </div>
  );
}