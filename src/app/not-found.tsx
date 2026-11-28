import Link from "next/link";
import { TopNav } from "@/components/layout/TopNav";
import { Footer } from "@/components/layout/Footer";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col">
      <TopNav />
      <main
        id="main-content"
        className="flex flex-1 items-center pt-24 pb-16 md:pt-32 md:pb-24"
      >
        <div className="spanrail-container max-w-[640px]">
          <div className="rounded-2xl border border-[var(--border-whisper)] bg-[var(--bg-surface)] p-6 sm:rounded-3xl sm:p-9">
            <p className="tabular-telemetry text-[12px] font-medium text-[var(--accent-spark-text)]">
              HTTP 404 — Span not found
            </p>
            <h1 className="display-h2 mt-3">This route does not exist.</h1>
            <p className="mt-3 max-w-[46ch] text-[13.5px] leading-[1.6] text-[var(--ink-secondary)] md:text-[14.5px] lg:text-[15.5px]">
              The page you requested could not be located. Jump back to the live
              trace sandbox or inspect the OpenTelemetry quickstart docs.
            </p>

            <div className="mt-6 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-3">
              <Link
                href="/"
                className="btn-tactile flex min-h-[46px] w-full items-center justify-center rounded-full bg-[var(--btn-primary-bg)] px-5 text-[14px] font-medium text-[var(--btn-primary-ink)] sm:w-auto [@media(hover:hover)]:hover:bg-[var(--btn-primary-bg-hover)]"
              >
                Return to live sandbox
              </Link>
              <Link
                href="/docs"
                className="btn-tactile flex min-h-[46px] w-full items-center justify-center rounded-full border border-[var(--border-whisper)] bg-[var(--bg-surface-solid)] px-5 text-[14px] font-medium text-[var(--ink-primary)] sm:w-auto [@media(hover:hover)]:hover:border-[var(--border-hover)]"
              >
                Read quickstart docs
              </Link>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}