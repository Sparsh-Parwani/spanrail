export function SpanrailMark({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 28 28"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M14 2L24.4 8V20L14 26L3.6 20V8L14 2Z"
        stroke="currentColor"
        strokeWidth="1.65"
        strokeLinejoin="round"
        opacity="0.88"
      />
      <path
        d="M14 4.7L22.05 9.35V18.65L14 23.3L5.95 18.65V9.35L14 4.7Z"
        stroke="var(--accent-brand)"
        strokeWidth="0.9"
        strokeLinejoin="round"
        opacity="0.28"
      />
      <path
        d="M18.2 9.4H11.9L9.8 11.45V12.8L11.4 14H14"
        stroke="currentColor"
        strokeWidth="2.05"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
      <path
        d="M14 14H16.6L18.2 15.2V16.55L16.1 18.6H9.8"
        stroke="var(--accent-brand)"
        strokeWidth="2.05"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
    </svg>
  );
}