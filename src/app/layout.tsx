import type { Metadata, Viewport } from "next";
import "@fontsource-variable/plus-jakarta-sans";
import "@fontsource-variable/jetbrains-mono";
import "@fontsource/instrument-serif/400.css";
import "@fontsource/instrument-serif/400-italic.css";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Spanrail — AI Agent Observability & Inline Guardrails",
    template: "%s · Spanrail",
  },
  description:
    "Real-time OpenTelemetry trace inspection, inline PII and retry-loop guardrails, and exact per-run token cost accounting for production AI agents.",
  metadataBase: new URL("https://spanrail.vercel.app"),
  openGraph: {
    title: "Spanrail — Real-Time Observability & Guardrails for AI Agents",
    description:
      "See every agent step. Catch slow tool calls and retry loops, mask customer PII inline, and keep token bills predictable.",
    type: "website",
    siteName: "Spanrail",
    url: "https://spanrail.vercel.app",
  },
  twitter: {
    card: "summary_large_image",
    title: "Spanrail — Real-Time Observability & Guardrails for AI Agents",
    description:
      "Real-time trace inspection, inline PII and loop guardrails, and flat OTLP pricing for production LLM agents.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#050B0F",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark" style={{ colorScheme: "dark" }}>
      <body className="antialiased selection:bg-[var(--accent-spark-soft)]">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-[var(--btn-primary-bg)] focus:px-4 focus:py-2 focus:text-[sm focus:font-medium focus:text-[var(--btn-primary-ink)]"
        >
          Skip to content
        </a>

        {children}

        <Toaster
          position="bottom-right"
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
      </body>
    </html>
  );
}