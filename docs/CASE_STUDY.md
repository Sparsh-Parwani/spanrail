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

- **Server Components & Static Routes (`src/app/`):** Root shell, `Footer`, `/docs` (`1.28 kB`), `/security`, `/privacy`, `/terms` (`192 B` each), custom dark `not-found.tsx`, `/robots.txt`, and `/sitemap.xml` (`136 B` each) are Server Components; heavy WebGL2 and R3F canvases mount strictly post-LCP via `next/dynamic(..., { ssr: false })` + `requestIdleCallback`.
- **Motion Constraints:** Async `<LazyMotion features={domMax} strict>` with `m.*` across components; GPU-only `transform` (`x`, `scaleX`, `translate3d`) and `opacity` (zero layout `width`/`left` animations); zero `backdrop-filter: blur()` over animating WebGL; solid opaque surfaces (`alpha = 1`) for GPU occlusion culling; pure CSS `translate3d(-50%, 0, 0)` infinite logo marquee.
- **Single Breakpoint Subscription (`src/lib/useBreakpoint.ts`):** One module-level `useSyncExternalStore` backed by 3 `matchMedia` listeners — zero `window.resize` listener spam.

---

## 3. Real-Device QA, Lighthouse & Third-Party Audit Log

Testing on real hardware (**Intel Iris Xe 1080p**, **OnePlus 12R ~3× AMOLED**, **820×1180 tablet**), **Google PageSpeed Insights (Lighthouse 13.6)**, and a live-HTML third-party engineering audit surfaced 8 concrete engineering upgrades:

1. **Copy Button Layout Shift (CLS) on Phone:** Moved `Copy` into anchored code headers (`CodeBlock`, `DropInSdkStage`, `HeroSection`, `PricingCalculator`) using CSS Grid overlap (`col-start-1 row-start-1`) so `Copy` ↔ `Copied` produces **0px width shift / 0 CLS**.
2. **Shrunken-Desktop Components Rebuilt Native per Breakpoint:** 2×2 all-visible `CapabilitiesGrid` (`< 1024px`), vertical `<Pipeline>` timeline (`< 640px`), stacked vertical `PairedBars` metric cards (`< 768px`), 3-column `auto-cols-fr` retention control fitting `320px`, 2×3 tap-to-toggle `StatsBand`, and `MobileBottomDock` auto-hiding over both `#pricing` and `#demo`.
3. **Inline `style` Specificity Overriding Responsive & Hover Utilities:** Found inline `style={{ color / backgroundColor / borderColor }}` (`1,0,0,0`) silently overriding both responsive classes (`md:bg-transparent`) and 33 `[@media(hover:hover)]:hover:*` rules across 11 files. Migrated all interactive and breakpoint-reactive styling to Tailwind CSS-var utilities so every hover state and desktop container renders cleanly.
4. **Mobile & Tablet Typographic Hierarchy Audit:** Stepped `< 1024px` secondary copy cleanly below `14.5–15px` primary labels (`13.5–14px` section leads, `12.5–13px` card copy, `11.5–12px` `--ink-muted` helpers), verified `>= 4.65:1` WCAG 2.2 AA across every surface.
5. **Lighthouse Accessibility Tree & Software-WebGL Audit:** Refactored `StatsBand` from `<dl>` + `role="button"` to semantic `<ul>` → `<li>` → `<button type="button">` with phrasing `<span>` children (passing `agent-accessibility-tree` and all list audits) and added `failIfMajorPerformanceCaveat: true` to `GhostFibers.tsx`.
6. **WCAG 2.1.4 (Character Key Shortcuts) & SC 2.4.11 (Focus Not Obscured):** Upgraded single-key shortcuts (`M`, `1`, `2`) to modifier shortcuts (`Alt+M`, `Alt+1`, `Alt+2` keyed on `event.code` for macOS Option-key reliability), placed the hint inside the Hero sandbox toolbar (Law of Proximity), upgraded footer links to `min-h-[44px] [@media(pointer:fine)]:min-h-0` for tablet touch targets, added mobile `scroll-padding-bottom: 92px`, and switched phone toasts to `top-center` (`68px` offset) via `AppToaster.tsx`.
7. **Silent Unclosed Tailwind Bracket Scan:** Fixed all 7 corrupted Tailwind utility brackets (`border-[t`, `text-[center`, `leading-[none`, `text-[left`, `text-[right`) caught by regex scanning across `src/`.
8. **Production SEO & Error Boundaries:** Shipped full SEO `<title>`, branded dark `src/app/not-found.tsx`, `src/app/robots.ts`, and `src/app/sitemap.ts`.

---

## 4. Production Client Handoff Notes

Spanrail is shipped as a complete flagship portfolio case study. Adapting it for a real production SaaS deployment requires only:
1. Wiring `POST /api/demo-booking` (`src/app/api/demo-booking/route.ts`) to a real transactional email / CRM webhook (Resend, HubSpot, or Slack) — Zod schema validation, SHA-256 booking ref generation, and `spanrail.otel.ts` config output are already live.
2. Swapping modeled benchmarks, sample company marks, and template `/privacy` & `/terms` copy for client-approved production assets.