import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Spanrail",
  description:
    "Watch every step your production AI agents take. Catch slow tool calls and retry loops, mask customer PII inline, and keep token bills predictable.",
  metadataBase: new URL("https://spanrail.dev"),
  openGraph: {
    title: "Spanrail",
    description:
      "Real-time trace inspection, automatic PII and loop guardrails, and exact per-run token costs for production AI agents.",
    type: "website",
    siteName: "Spanrail",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#050B0F" },
    { media: "(prefers-color-scheme: dark)", color: "#071014" },
  ],
};

const THEME_INIT_SCRIPT = `(function(){try{var k='spanrail-theme';var saved=window.localStorage.getItem(k);var theme=(saved==='dark'||saved==='light')?'dark':'dark';document.documentElement.dataset.theme=theme;document.documentElement.style.colorScheme=theme;}catch(e){document.documentElement.dataset.theme='dark';}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500&family=Plus+Jakarta+Sans:wght@400;500;600&family=Space+Grotesk:wght@500;600&family=Syne:wght@600;700&display=swap"
          rel="stylesheet"
        />
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="antialiased selection:bg-[var(--accent-spark-soft)]">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-[var(--btn-primary-bg)] focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-[var(--btn-primary-ink)]"
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