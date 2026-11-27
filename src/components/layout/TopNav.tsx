"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AnimatePresence, m } from "framer-motion";
import { Menu, Volume2, VolumeX, X } from "lucide-react";
import { useSpanrailStore } from "@/store/useSpanrailStore";
import { initSoundEngine, playSwitchClick } from "@/lib/sound";
import { useBreakpoint } from "@/lib/useBreakpoint";
import { REDUCED_TRANSITION } from "@/components/ui/Primitives";
import { SpanrailMark } from "@/components/ui/SpanrailMark";
export { SpanrailMark };

const NAV_LINKS = [
  { href: "/#sandbox", label: "Sandbox" },
  { href: "/#capabilities", label: "Capabilities" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/docs", label: "Docs" },
] as const;

export function TopNav() {
  const isSoundEnabled = useSpanrailStore((s) => s.isSoundEnabled);
  const toggleSound = useSpanrailStore((s) => s.toggleSound);

  const { prefersReducedMotion } = useBreakpoint();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const unlock = () => {
      if (useSpanrailStore.getState().isSoundEnabled) {
        initSoundEngine();
      }
    };
    window.addEventListener("pointerdown", unlock, { once: true, passive: true });
    window.addEventListener("keydown", unlock, { once: true, passive: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 24);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileMenuOpen]);

  const handleToggleSound = () => {
    if (!isSoundEnabled) {
      initSoundEngine();
    }
    const next = toggleSound();
    if (next) {
      playSwitchClick(true);
    }
  };

  return (
    <header
      className="fixed inset-x-0 top-0 z-40 pt-[env(safe-area-inset-top)]"
      style={{
        backgroundColor:
          scrolled || mobileMenuOpen ? "var(--bg-nav-glass)" : "transparent",
        borderBottom:
          scrolled || mobileMenuOpen
            ? "1px solid var(--border-whisper)"
            : "1px solid transparent",
        transition:
          "background-color 240ms var(--ease-enter), border-color 240ms var(--ease-enter)",
      }}
    >
      <div className="spanrail-container flex h-14 items-center justify-between md:grid md:h-16 md:grid-cols-[1fr_auto_1fr]">
        <Link
          href="/"
          className="inline-flex min-h-[44px] items-center gap-2.5 justify-self-start rounded-lg text-[15.5px] font-medium tracking-[-0.02em]"
          style={{ color: "var(--ink-primary)" }}
          aria-label="Spanrail home"
        >
          <SpanrailMark className="h-[24px] w-[24px] shrink-0" />
          <span translate="no">Spanrail</span>
        </Link>

        <nav
          aria-label="Primary navigation"
          className="hidden items-center justify-center gap-0.5 justify-self-center md:flex lg:gap-1"
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="inline-flex min-h-[44px] items-center rounded-full px-3 text-[13.5px] font-medium lg:px-4 lg:text-[14px] [@media(hover:hover)]:hover:text-[var(--ink-primary)]"
              style={{
                color: "var(--ink-secondary)",
                transition: "color 180ms var(--ease-enter)",
              }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1 justify-self-end md:gap-2">
          <button
            type="button"
            onClick={handleToggleSound}
            aria-pressed={isSoundEnabled}
            aria-label={
              isSoundEnabled
                ? "Mute tactile sound cues"
                : "Enable tactile sound cues"
            }
            title={isSoundEnabled ? "Sound on (M)" : "Sound muted (M)"}
            className="btn-tactile inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-transparent md:h-9 md:w-9 [@media(hover:hover)]:hover:border-[var(--border-whisper)] [@media(hover:hover)]:hover:bg-[var(--bg-surface-subtle)]"
            style={{
              color: isSoundEnabled
                ? "var(--accent-brand)"
                : "var(--ink-secondary)",
            }}
          >
            {isSoundEnabled ? (
              <Volume2 className="h-[17px] w-[17px] shrink-0" strokeWidth={1.8} />
            ) : (
              <VolumeX className="h-[17px] w-[17px] shrink-0" strokeWidth={1.8} />
            )}
          </button>

          <Link
            href="/#demo"
            className="btn-tactile ml-1 hidden min-h-[38px] items-center justify-center rounded-full px-4 text-[13.5px] font-medium whitespace-nowrap md:inline-flex [@media(hover:hover)]:hover:bg-[var(--btn-primary-bg-hover)]"
            style={{
              backgroundColor: "var(--btn-primary-bg)",
              color: "var(--btn-primary-ink)",
            }}
          >
            Book a demo
          </Link>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav-drawer"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            className="btn-tactile inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-transparent md:hidden [@media(hover:hover)]:hover:bg-[var(--bg-surface-subtle)]"
            style={{ color: "var(--ink-primary)" }}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5 shrink-0" strokeWidth={1.75} />
            ) : (
              <Menu className="h-5 w-5 shrink-0" strokeWidth={1.75} />
            )}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <m.button
              type="button"
              aria-label="Close navigation menu"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-x-0 top-14 bottom-0 z-30 bg-black/55 md:hidden"
            />
            <m.nav
              id="mobile-nav-drawer"
              aria-label="Mobile navigation"
              initial={
                prefersReducedMotion
                  ? { opacity: 0 }
                  : { opacity: 0, y: -8 }
              }
              animate={
                prefersReducedMotion
                  ? { opacity: 1 }
                  : { opacity: 1, y: 0 }
              }
              exit={
                prefersReducedMotion
                  ? { opacity: 0 }
                  : { opacity: 0, y: -6 }
              }
              transition={
                prefersReducedMotion
                  ? REDUCED_TRANSITION
                  : { duration: 0.2, ease: [0.22, 1, 0.36, 1] }
              }
              className="relative z-40 overscroll-contain border-t md:hidden"
              style={{
                borderColor: "var(--border-whisper)",
                backgroundColor: "var(--bg-surface-solid)",
                boxShadow: "var(--shadow-stage)",
              }}
            >
              <div className="spanrail-container flex flex-col gap-1 py-4">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="inline-flex min-h-[48px] items-center rounded-xl px-3.5 text-[15.5px] font-medium active:bg-[var(--bg-surface-subtle)]"
                    style={{ color: "var(--ink-primary)" }}
                  >
                    {link.label}
                  </Link>
                ))}

                <div
                  className="mt-2 border-t pt-3"
                  style={{ borderColor: "var(--border-whisper)" }}
                >
                  <Link
                    href="/#demo"
                    onClick={() => setMobileMenuOpen(false)}
                    className="btn-tactile flex min-h-[48px] w-full items-center justify-center rounded-full text-[15px] font-medium"
                    style={{
                      backgroundColor: "var(--btn-primary-bg)",
                      color: "var(--btn-primary-ink)",
                    }}
                  >
                    Book a demo
                  </Link>
                </div>
              </div>
            </m.nav>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}