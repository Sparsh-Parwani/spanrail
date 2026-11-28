import type { Metadata, Viewport } from "next";
import "@fontsource-variable/plus-jakarta-sans";
import "@fontsource-variable/jetbrains-mono";
import { MotionProvider } from "@/components/ui/MotionProvider";
import { AppToaster } from "@/components/ui/AppToaster";
import "./globals.css";

const SITE_URL = "https://spanrail.vercel.app";

export const metadata: Metadata = {
  title: {
    default: "Spanrail — Real-Time Observability & Guardrails for AI Agents",
    template: "%s · Spanrail",
  },
  description:
    "Real-time OpenTelemetry trace inspection, inline PII and retry-loop guardrails, and exact per-run token cost accounting for production AI agents.",
  metadataBase: new URL(SITE_URL),
  openGraph: {
    title: "Spanrail — Real-Time Observability & Guardrails for AI Agents",
    description:
      "See every agent step. Catch slow tool calls and retry loops, mask customer PII inline, and keep token bills predictable.",
    type: "website",
    siteName: "Spanrail",
    url: SITE_URL,
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
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-[var(--btn-primary-bg)] focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-[var(--btn-primary-ink)]"
        >
          Skip to content
        </a>

        <MotionProvider>{children}</MotionProvider>
        <AppToaster />
      </body>
    </html>
  );
}