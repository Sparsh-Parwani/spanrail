"use client";

import {
  forwardRef,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
  type CSSProperties,
} from "react";
import { animate, useInView } from "framer-motion";
import styles from "@/components/ui/stats-band.module.css";

export type StatVisual =
  | { kind: "trend"; values: number[] }
  | { kind: "uptime"; days: number[] }
  | { kind: "distribution"; bins: number[]; max: number; marker: number }
  | { kind: "map"; points: [number, number][] };

export interface Stat {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  notation?: "standard" | "compact";
  detail?: string;
  context?: string;
  visual?: StatVisual;
}

export interface StatsBandProps {
  stats: Stat[];
  title?: string;
  description?: string;
  duration?: number;
  locale?: string;
  className?: string;
}

const WORLD = { columns: 42, rows: 16, west: -165, east: 175, north: 70, south: -52 };

// Compact 42x16 stylized world continent mask (1 = land, 0 = ocean)
const WORLD_ROWS = [
  "000011111110000000111000001111111111100000",
  "001111111111000001111000111111111111110000",
  "000111111110000000110011111111111111111000",
  "000011111100000000000111111111111111110000",
  "000001111000000000001111111111111111000000",
  "000000110000000000011111111111111100000000",
  "000000011000000000111111110111110000000000",
  "000000001110000000111111100011001000000000",
  "000000000111100000111111000000001100000000",
  "000000000111110000011111000000000011100000",
  "000000000011110000001110000000000111110000",
  "000000000011100000001110000000000111110000",
  "000000000001100000000100000000000011100000",
  "000000000001000000000000000000000000010000",
  "000000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000000",
];

const worldLand: number[] = WORLD_ROWS.join("")
  .split("")
  .map((c) => (c === "1" ? 1 : 0));

const enter: [number, number, number, number] = [0.22, 1, 0.36, 1];
const STAGGER = 0.08;
const REDUCE = "(prefers-reduced-motion: reduce)";

const subscribeReduced = (onChange: () => void) => {
  const query = window.matchMedia(REDUCE);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};

function useReducedMotionSafe() {
  return useSyncExternalStore(
    subscribeReduced,
    () => window.matchMedia(REDUCE).matches,
    () => false
  );
}

function useFormat(stat: Stat, locale: string) {
  return useMemo(() => {
    const decimals = stat.decimals ?? 0;
    const digits = new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
      numberingSystem: "latn",
    });
    if (stat.notation !== "compact") {
      return { unit: "", format: (value: number) => digits.format(value) };
    }
    const size = Math.abs(stat.value);
    const scale =
      size >= 1e12
        ? 1e12
        : size >= 1e9
          ? 1e9
          : size >= 1e6
            ? 1e6
            : size >= 1e3
              ? 1e3
              : 1;
    const unit =
      scale === 1
        ? ""
        : (new Intl.NumberFormat(locale, { notation: "compact" })
            .formatToParts(scale)
            .find((part) => part.type === "compact")?.value ?? "");
    return { unit, format: (value: number) => digits.format(value / scale) };
  }, [stat.decimals, stat.notation, stat.value, locale]);
}

function CountUp({
  stat,
  run,
  delay,
  duration,
  reduced,
  locale,
}: {
  stat: Stat;
  run: boolean;
  delay: number;
  duration: number;
  reduced: boolean;
  locale: string;
}) {
  const live = useRef<HTMLSpanElement>(null);
  const done = useRef(false);
  const { unit, format } = useFormat(stat, locale);
  const final = format(stat.value);
  const suffix = `${unit}${stat.suffix ?? ""}`;

  useLayoutEffect(() => {
    if (reduced || done.current || !live.current) return;
    live.current.textContent = format(0);
  }, [format, reduced]);

  useEffect(() => {
    const node = live.current;
    if (!node) return;
    if (reduced) {
      node.textContent = final;
      done.current = true;
      return;
    }
    if (!run || done.current) return;
    const controls = animate(0, stat.value, {
      duration,
      delay,
      ease: enter,
      onUpdate: (latest) => {
        node.textContent = format(latest);
      },
      onComplete: () => {
        node.textContent = final;
        done.current = true;
      },
    });
    return () => controls.stop();
  }, [run, reduced, stat.value, delay, duration, format, final]);

  return (
    <>
      <span className={styles.srOnly}>
        {stat.prefix}
        {final}
        {suffix}
      </span>
      <span className={styles.number} aria-hidden="true">
        {stat.prefix && <span className={styles.prefix}>{stat.prefix}</span>}
        <span className={styles.digits}>
          <span className={styles.sizer}>{final}</span>
          <span ref={live} className={styles.live}>
            {final}
          </span>
        </span>
        {suffix && <span className={styles.suffix}>{suffix}</span>}
      </span>
    </>
  );
}

function Trend({ values }: { values: number[] }) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const points = values.map(
    (value, index) =>
      [
        values.length > 1 ? (index / (values.length - 1)) * 100 : 100,
        36 - ((value - min) / span) * 30,
      ] as const
  );
  const line = points
    .map(
      ([x, y], index) => `${index ? "L" : "M"}${x.toFixed(2)} ${y.toFixed(2)}`
    )
    .join(" ");
  const [endX, endY] = points[points.length - 1];
  return (
    <div className={styles.trend}>
      <svg
        className={styles.draw}
        viewBox="0 0 100 40"
        preserveAspectRatio="none"
      >
        <path className={styles.area} d={`${line} L100 40 L0 40 Z`} />
        <path
          className={styles.line}
          d={line}
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <span
        className={styles.endDot}
        style={{ left: `${endX}%`, top: `${(endY / 40) * 100}%` }}
      />
    </div>
  );
}

function Uptime({ days }: { days: number[] }) {
  return (
    <div className={styles.bars} data-dense="">
      {days.map((uptime, index) => (
        <span
          key={index}
          className={styles.bar}
          data-ink={uptime >= 99.9 ? "" : undefined}
          style={
            {
              "--j": index / days.length,
              "--h": Math.min(1, Math.max(0.35, 1 - (100 - uptime) * 0.6)),
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}

function Distribution({
  bins,
  max,
  marker,
}: {
  bins: number[];
  max: number;
  marker: number;
}) {
  const peak = Math.max(...bins) || 1;
  const width = max / bins.length;
  return (
    <div className={styles.bars}>
      {bins.map((count, index) => (
        <span
          key={index}
          className={styles.bar}
          data-ink={index * width < marker ? "" : undefined}
          style={
            {
              "--j": index / bins.length,
              "--h": Math.max(0.08, count / peak),
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}

const cellOf = (lon: number, lat: number) => {
  const x = Math.floor(
    (((((lon - WORLD.west) % 360) + 360) % 360) / (WORLD.east - WORLD.west)) *
      WORLD.columns
  );
  const y = Math.floor(
    ((WORLD.north - lat) / (WORLD.north - WORLD.south)) * WORLD.rows
  );
  return [
    Math.min(WORLD.columns - 1, Math.max(0, x)),
    Math.min(WORLD.rows - 1, Math.max(0, y)),
  ] as const;
};

function nearestLand(lon: number, lat: number) {
  const [x, y] = cellOf(lon, lat);
  let best = y * WORLD.columns + x;
  let distance = Infinity;
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -2; dx <= 2; dx++) {
      const cx = x + dx;
      const cy = y + dy;
      if (
        cx < 0 ||
        cy < 0 ||
        cx >= WORLD.columns ||
        cy >= WORLD.rows ||
        !worldLand[cy * WORLD.columns + cx]
      ) {
        continue;
      }
      const d = dx * dx + dy * dy;
      if (d < distance) {
        distance = d;
        best = cy * WORLD.columns + cx;
      }
    }
  }
  return best;
}

function WorldMap({ points }: { points: [number, number][] }) {
  const lit = useMemo(
    () => new Set(points.map(([lon, lat]) => nearestLand(lon, lat))),
    [points]
  );
  return (
    <div className={styles.map}>
      <svg
        className={styles.draw}
        viewBox={`0 0 ${WORLD.columns} ${WORLD.rows}`}
      >
        {worldLand.map(
          (land, index) =>
            land &&
            !lit.has(index) && (
              <circle
                key={index}
                className={styles.land}
                cx={(index % WORLD.columns) + 0.5}
                cy={Math.floor(index / WORLD.columns) + 0.5}
                r={0.3}
              />
            )
        )}
        {[...lit].map((index) => (
          <circle
            key={index}
            className={styles.lit}
            cx={(index % WORLD.columns) + 0.5}
            cy={Math.floor(index / WORLD.columns) + 0.5}
            r={0.55}
          />
        ))}
      </svg>
    </div>
  );
}

function Visual({ visual }: { visual: StatVisual }) {
  switch (visual.kind) {
    case "trend":
      return <Trend values={visual.values} />;
    case "uptime":
      return <Uptime days={visual.days} />;
    case "distribution":
      return (
        <Distribution
          bins={visual.bins}
          max={visual.max}
          marker={visual.marker}
        />
      );
    case "map":
      return <WorldMap points={visual.points} />;
  }
}

export const StatsBand = forwardRef<HTMLElement, StatsBandProps>(
  function StatsBand(
    {
      stats,
      title,
      description,
      duration = 1.4,
      locale = "en-US",
      className,
    },
    ref
  ) {
    const id = useId();
    const list = useRef<HTMLDListElement>(null);
    const inView = useInView(list, { once: true, amount: 0.2 });
    const reduced = useReducedMotionSafe();

    return (
      <section
        ref={ref}
        className={[styles.band, className].filter(Boolean).join(" ")}
        data-in-view={inView || reduced ? "" : undefined}
        aria-labelledby={title ? `${id}-title` : undefined}
        aria-label={title ? undefined : "Platform telemetry statistics"}
      >
        <div className={styles.inner}>
          {(title || description) && (
            <header className={styles.header}>
              {title && (
                <h2 id={`${id}-title`} className={styles.title}>
                  {title}
                </h2>
              )}
              {description && (
                <p className={styles.description}>{description}</p>
              )}
            </header>
          )}
          <dl
            ref={list}
            className={styles.stats}
            style={
              {
                "--draw": `${Math.round(duration * 460)}ms`,
              } as CSSProperties
            }
          >
            {stats.map((stat, index) => (
              <div
                key={`${stat.label}-${index}`}
                className={styles.stat}
                style={{ "--i": index } as CSSProperties}
                tabIndex={stat.context ? 0 : undefined}
                data-context={stat.context && stat.detail ? "" : undefined}
              >
                <dt className={styles.label}>{stat.label}</dt>
                <dd className={styles.figure}>
                  <CountUp
                    stat={stat}
                    run={inView}
                    delay={index * STAGGER}
                    duration={duration}
                    reduced={reduced}
                    locale={locale}
                  />
                </dd>
                {(stat.detail || stat.context) && (
                  <dd className={styles.caption}>
                    {stat.detail && (
                      <span className={styles.detail}>{stat.detail}</span>
                    )}
                    {stat.context && (
                      <span className={styles.context}>{stat.context}</span>
                    )}
                  </dd>
                )}
                {stat.visual && (
                  <dd className={styles.visual} aria-hidden="true">
                    <Visual visual={stat.visual} />
                  </dd>
                )}
              </div>
            ))}
          </dl>
        </div>
      </section>
    );
  }
);

StatsBand.displayName = "StatsBand";

export default StatsBand;