# Spanrail — Engineering Case Study

> **Live Demo:** [spanrail.vercel.app](https://spanrail.vercel.app/) · **Author:** [Sparsh Parwani](https://sparshparwaniportfolio.vercel.app/) · **Stack:** Next.js 15.5, React 19.1, TypeScript (`strict: true`), Tailwind v4, WebGL2, Three.js / React Three Fiber v9, Framer Motion v12, Zustand, Zod

---

## 1. Product Thesis — Product-as-Hero Over Brochure Slogans

Technical buyers evaluating AI observability and inline guardrail tooling inspect code, latency budgets, pricing formulas, and security architecture before talking to sales. Spanrail puts an interactive **Live Trace Sandbox** and coupled **3D Neural Telemetry Mesh** directly above the fold on Frame 0 (`opacity: 1`, zero splash gate):

- Flipping **Semantic Cache**, **Inline PII Redaction**, and **Loop Breaker** immediately recalculates deterministic span latency (`2,840ms → 780ms`), run cost (`$0.048 → $0.014`), waterfall bar offsets, JSON payload redaction (`[EXPOSED]` → `[REDACTED_PII]`), and the 3D `NeuralBrain` mesh color/pulse physics (`amber → ocean → sage`).
- All domain math is reconciled across every section:
  - **Inline router pipeline (`src/components/react-bits/pipeline.tsx`):** `0.2ms + 0.5ms + 0.4ms + 0.3ms = 1.4ms` (matching `StatsBand` median overhead `1.4ms`).
  - **10M trace comparison (`BeforeAfterSection` & `PricingCalculator`):** `$99 base + 975 × $0.18 = $274.50` (`$275/mo`) vs. modeled `$4,850/mo` list-rate host/custom-metric APM (`−94%`).
  - **SSR Pricing Default:** Initializes directly to `$119/mo` on the server (zero `$0` hydration flash) and syncs URL query params strictly on explicit user interaction while preserving inbound `utm_*` / `gclid` attribution parameters.

---

## 2. Dual-Layer Spatial + DOM Architecture

### Layer 1 — Spatial Canvas (`GhostFibers.tsx` & `NeuralBrain.tsx`)

| Concern | Engineering Decision | Why |
|---|---|---|
| **144Hz / 240Hz Scroll Pacing** | Native VSync rAF + `MAX_RENDER_DIM = 1280` + `BLOOM_LEVELS = 2` | Capping scroll-linked WebGL at 60fps creates visible 2-3-2-3 judder on 120Hz/144Hz panels; cutting pixel fill-rate keeps HDR `RGBA16F` bloom smooth at native refresh rates. |
| **Software WebGL Protection** | `failIfMajorPerformanceCaveat: true` on `GhostFibers.tsx` WebGL2 context | Keeps full HDR shader bloom active on every real hardware GPU while preventing 32+ second CPU main-thread stalls on SwiftShader/software-rendered browsers and headless VMs. |
| **Garbage Collection Hygiene** | 10 pre-allocated module-level `Float32Array` scratch buffers (`GhostFibers.tsx`) | Eliminates GC frame spikes inside `requestAnimationFrame` (`0` heap allocations per frame). |
| **Mobile GPU Context Budget** | `GhostFibers` skipped `< 768px`, `<= 2` CPU cores, or `saveData`; `NeuralBrain` capped at `dpr <= 1.25` (`1.0` on constrained devices) | Prevents mobile WebGL context eviction and thermal throttling while keeping touch scrolling fluid. |
| **High-DPI OLED Sharpness** | `128×128` mipmapped (`LinearMipmapLinearFilter`) crisp-core radial point sprite texture (`NeuralBrain.tsx`) | Kept points crisp on ~3× AMOLED panels (OnePlus 12R) without exceeding the `1.25` mobile DPR budget. |
| **Mesh Integrity & Lifecycle** | Live synaptic `LineSegments` welded to deformed cortex vertices every frame; `requestIdleCallback` post-LCP mount; `frameloop="always" | "demand"` coupled to `IntersectionObserver` + `visibilitychange` + `prefers-reduced-motion`; `contextEpoch` rebuild on `webglcontextrestored`; manual `.dispose()` on unmount; `onPointerCancel` touch cleanup | Prevents blank reduced-motion boxes, floating disconnected synapses, dead GPU handles, and stuck mobile drag states. |

### Layer 2 — Interface, Motion & Bundle Hygiene

- **Server Components & Dynamic Splits (`src/app/page.tsx`):** Root shell, `Footer`, `/docs`, `/security`, `/privacy`, and `/terms` stay Server Components (`191 B` static route JS on legal/security pages); below-the-fold interactive modules split via `next/dynamic` (`ssr: true`).
- **Motion Constraints:** Async `<LazyMotion features={domMax} strict>` with `m.*` across components; GPU-only `transform` (`x`, `scaleX`, `translate3d`) and `opacity` (zero layout `width`/`left` animations); zero `backdrop-filter: blur()` over animating WebGL; solid opaque surfaces (`alpha = 1`) for GPU occlusion culling; pure CSS `translate3d(-50%, 0, 0)` infinite logo marquee.
- **Single Breakpoint Subscription (`src/lib/useBreakpoint.ts`):** One module-level `useSyncExternalStore` backed by 3 `matchMedia` listeners — zero `window.resize` listener spam.

---

## 3. Real-Device QA & Lighthouse Debugging Log

Testing on real hardware (**Intel Iris Xe 1080p**, **OnePlus 12R ~3× AMOLED**, **820×1180 tablet**) and **Google PageSpeed Insights (Lighthouse 13.6)** surfaced concrete engineering wins:

1. **Copy Button Layout Shift (CLS) on Phone:**
   - *Symptom:* Tapping `Copy` inside `CapabilitiesGrid` expanded the label to `Copied`, wrapping the button onto a new line below the SDK tabs and shifting the page downward.
   - *Fix:* Moved `Copy` into an anchored code-pane header (`CodeBlock`, `DropInSdkStage`, `HeroSection`, `PricingCalculator`) and overlaid both labels in the same CSS Grid cell (`col-start-1 row-start-1`), locking button width to **0px delta / 0 CLS**.
2. **Shrunken-Desktop Components Rebuilt Native per Breakpoint:**
   - *Capabilities Switcher:* Replaced horizontal scrolling pills (hiding 2 of 4 items on Phone & `820px` Tablet) with a full-visibility **2×2 grid** (`< 1024px`).
   - *Inline Guardrail Pipeline (`pipeline.tsx`):* Replaced cramped 4-column chips (`< 65px` each) with a **vertical animated timeline** on `< 640px`.
   - *Production Comparison (`paired-bars.tsx`):* Replaced the `min-w-[600px]` horizontal scrolling table with **vertical stacked metric cards** on `< 768px` and sized tablet columns (`136px / minmax(220px,1fr) / 108px`) so `820px` fits without horizontal scroll.
   - *Pricing Retention (`PricingCalculator.tsx` / `Primitives.tsx`):* `365 days +35%` overflowed horizontal `SegmentedControl`; added `stackSublabelOnMobile` (`grid auto-cols-fr grid-flow-col`) fitting cleanly down to `320px`.
   - *Duplicate Mobile Floating Bars:* Observed `#pricing` inside `MobileBottomDock.tsx` so the bottom dock hides whenever `#pricing` or `#demo` is already visible.
   - *Touch-Inaccessible Stat Context:* Converted `StatsBand` from a 1,200px single-column wall to a compact **2×3 telemetry grid** with tap-to-toggle context (`data-active`) and gated `:hover` behind `@media (hover: hover)`.
3. **Inline `style` Specificity Overriding Responsive Tailwind (`md:bg-transparent`):**
   - *Symptom:* Mobile containers in `HeroSection` and `PricingCalculator` rendered sharp `#14232b` rectangular boxes on desktop because inline `style={{ backgroundColor }}` (`1,0,0,0`) beat Tailwind's `md:bg-transparent` (`0,1,0`).
   - *Fix:* Migrated breakpoint-dependent surface/border tokens to Tailwind arbitrary CSS-var utilities (`bg-[var(--bg-surface-subtle)] md:bg-transparent md:border-0`).
4. **Mobile & Tablet Typographic Hierarchy Audit:**
   - *Symptom:* `16–17px` section subtitles rendered larger than `14.5–15px` primary card/metric titles on phone and tablet.
   - *Fix:* Established a strict `< 1024px` hierarchy staircase (`13.5–14px` section leads, `12.5–13px` card descriptions, `11.5–12px` helper captions in `--ink-muted`) verified mathematically against WCAG 2.2 AA (`>= 4.65:1` even on subtle `#14232b` surfaces).
5. **Lighthouse Accessibility Tree & Software-WebGL Audit:**
   - *Symptom:* Putting `role="button"` on a `<div>` inside `<dl>` in `StatsBand` triggered both `<dl>` semantic warnings and Lighthouse's `agent-accessibility-tree` audit; running `GhostFibers` on software SwiftShader WebGL caused a 32s desktop TBT stall.
   - *Fix:* Refactored `StatsBand` to semantic `<ul>` → `<li>` → `<button type="button">` with phrasing `<span>` children (passing `agent-accessibility-tree` and all list semantics) and added `failIfMajorPerformanceCaveat: true` to `GhostFibers.tsx`.
6. **Silent Unclosed Tailwind Bracket Scan:**
   - *Symptom:* `tsc --noEmit` and `next build` passed while 7 corrupted Tailwind tokens (`border-[t`, `text-[center`, `leading-[none`, `text-[left`, `text-[right`) silently broke styling.
   - *Fix:* Ran a repo-wide regex scan (`[a-z]+-\[[a-z0-9]+(?=\s)`), fixed all 7 instances across 4 files, and confirmed zero remaining matches.

---

## 4. Production Client Handoff Notes

Spanrail is shipped as a complete flagship portfolio case study. Adapting it for a real production SaaS deployment requires only:
1. Wiring `POST /api/demo-booking` (`src/app/api/demo-booking/route.ts`) to a real transactional email / CRM webhook (Resend, HubSpot, or Slack) — Zod schema validation, SHA-256 booking ref generation, and `spanrail.otel.ts` config output are already live.
2. Swapping modeled benchmarks, sample company marks, and template `/privacy` & `/terms` copy for client-approved production assets.