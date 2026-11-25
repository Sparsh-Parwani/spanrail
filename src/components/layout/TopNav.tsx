"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, Volume2, VolumeX, X } from "lucide-react";
import { useSpanrailStore } from "@/store/useSpanrailStore";
import { initSoundEngine, playSwitchClick } from "@/lib/sound";
import { useBreakpoint } from "@/lib/useBreakpoint";
import { REDUCED_TRANSITION } from "@/components/ui/Primitives";

const NAV_LINKS = [
  { href: "#sandbox", label: "Sandbox" },
  { href: "#capabilities", label: "Capabilities" },
  { href: "#pricing", label: "Pricing" },
] as const;

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
      className="fixed inset-x-0 top-0 z-40"
      style={{
        backgroundColor:
          scrolled || mobileMenuOpen ? "var(--bg-nav-glass)" : "transparent",
        backdropFilter:
          scrolled || mobileMenuOpen ? "blur(14px)" : "blur(0px)",
        WebkitBackdropFilter:
          scrolled || mobileMenuOpen ? "blur(14px)" : "blur(0px)",
        borderBottom:
          scrolled || mobileMenuOpen
            ? "1px solid var(--border-whisper)"
            : "1px solid transparent",
        transition:
          "background-color 240ms var(--ease-enter), border-color 240ms var(--ease-enter)",
      }}
    >
      <div className="spanrail-container flex h-14 items-center justify-between md:grid md:h-16 md:grid-cols-[1fr_auto_1fr]">
        <a
          href="#"
          className="inline-flex min-h-[44px] items-center gap-2.5 justify-self-start rounded-lg text-[15.5px] font-medium tracking-[-0.02em]"
          style={{ color: "var(--ink-primary)" }}
          aria-label="Spanrail home"
        >
          <SpanrailMark className="h-[24px] w-[24px]" />
          <span>Spanrail</span>
        </a>

        <nav
          aria-label="Primary navigation"
          className="hidden items-center justify-center gap-1 justify-self-center md:flex"
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="inline-flex min-h-[44px] items-center rounded-full px-4 text-[14px] font-medium hover:text-[var(--ink-primary)]"
              style={{
                color: "var(--ink-secondary)",
                transition: "color 180ms var(--ease-enter)",
              }}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-1.5 justify-self-end md:gap-2">
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
            className="btn-tactile inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-transparent hover:border-[var(--border-whisper)] hover:bg-[var(--bg-surface-subtle)] md:h-9 md:w-9"
            style={{
              color: isSoundEnabled
                ? "var(--accent-brand)"
                : "var(--ink-secondary)",
            }}
          >
            {isSoundEnabled ? (
              <Volume2 className="h-[17px] w-[17px]" strokeWidth={1.8} />
            ) : (
              <VolumeX className="h-[17px] w-[17px]" strokeWidth={1.8} />
            )}
          </button>

          <a
            href="#demo"
            className="btn-tactile ml-1 hidden min-h-[38px] items-center justify-center rounded-full px-4 text-[13.5px] font-medium hover:bg-[var(--btn-primary-bg-hover)] md:inline-flex"
            style={{
              backgroundColor: "var(--btn-primary-bg)",
              color: "var(--btn-primary-ink)",
            }}
          >
            Book a demo
          </a>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav-drawer"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            className="btn-tactile inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-transparent hover:bg-[var(--bg-surface-subtle)] md:hidden"
            style={{ color: "var(--ink-primary)" }}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" strokeWidth={1.75} />
            ) : (
              <Menu className="h-5 w-5" strokeWidth={1.75} />
            )}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.nav
            id="mobile-nav-drawer"
            aria-label="Mobile navigation"
            initial={
              prefersReducedMotion
                ? { opacity: 0 }
                : { opacity: 0, height: 0 }
            }
            animate={
              prefersReducedMotion
                ? { opacity: 1 }
                : { opacity: 1, height: "auto" }
            }
            exit={
              prefersReducedMotion
                ? { opacity: 0 }
                : { opacity: 0, height: 0 }
            }
            transition={
              prefersReducedMotion
                ? REDUCED_TRANSITION
                : { duration: 0.24, ease: [0.22, 1, 0.36, 1] }
            }
            className="overflow-hidden border-t md:hidden"
            style={{
              borderColor: "var(--border-whisper)",
              backgroundColor: "var(--bg-surface-solid)",
            }}
          >
            <div className="spanrail-container flex flex-col gap-1 py-4">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="inline-flex min-h-[48px] items-center rounded-xl px-3 text-[15px] font-medium hover:bg-[var(--bg-surface-subtle)]"
                  style={{ color: "var(--ink-primary)" }}
                >
                  {link.label}
                </a>
              ))}

              <div className="pt-2">
                <a
                  href="#demo"
                  onClick={() => setMobileMenuOpen(false)}
                  className="btn-tactile flex min-h-[48px] w-full items-center justify-center rounded-full text-[15px] font-medium"
                  style={{
                    backgroundColor: "var(--btn-primary-bg)",
                    color: "var(--btn-primary-ink)",
                  }}
                >
                  Book a demo
                </a>
              </div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}