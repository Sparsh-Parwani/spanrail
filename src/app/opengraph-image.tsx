import { ImageResponse } from "next/og";

export const alt = "Spanrail — Real-Time Observability & Guardrails for AI Agents";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px 72px",
          backgroundColor: "#050b0f",
          backgroundImage: "radial-gradient(circle at 82% 24%, rgba(46,168,209,0.22), transparent 46%), radial-gradient(circle at 18% 82%, rgba(242,153,74,0.16), transparent 44%)",
          color: "#f0f5f7",
          fontFamily: "sans-serif",
        }}
      >
        {/* Top brand bar */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <svg width="42" height="42" viewBox="0 0 28 28" fill="none">
              <path
                d="M14 2L24.4 8V20L14 26L3.6 20V8L14 2Z"
                stroke="#f0f5f7"
                strokeWidth="1.7"
                strokeLinejoin="round"
              />
              <path
                d="M18.2 9.4H11.9L9.8 11.45V12.8L11.4 14H14"
                stroke="#f0f5f7"
                strokeWidth="2.1"
                strokeLinecap="square"
              />
              <path
                d="M14 14H16.6L18.2 15.2V16.55L16.1 18.6H9.8"
                stroke="#2ea8d1"
                strokeWidth="2.1"
                strokeLinecap="square"
              />
            </svg>
            <span style={{ fontSize: "30px", fontWeight: 600, letterSpacing: "-0.03em" }}>
              Spanrail
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "10px 18px",
              borderRadius: "999px",
              border: "1px solid rgba(240,245,247,0.14)",
              backgroundColor: "rgba(14,26,32,0.85)",
              fontSize: "18px",
              color: "#93a6b1",
            }}
          >
            <span
              style={{
                width: "9px",
                height: "9px",
                borderRadius: "999px",
                backgroundColor: "#82d96e",
              }}
            />
            <span>OpenTelemetry Native · OTLP</span>
          </div>
        </div>

        {/* Center headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "940px" }}>
          <div
            style={{
              fontSize: "64px",
              fontWeight: 600,
              lineHeight: 1.06,
              letterSpacing: "-0.035em",
              color: "#f0f5f7",
            }}
          >
            See every agent step. Stop slow runs and surprise bills.
          </div>
          <div
            style={{
              fontSize: "26px",
              lineHeight: 1.45,
              color: "#93a6b1",
            }}
          >
            Live trace waterfalls, inline edge PII masking, loop breakers, and flat metered OTLP pricing.
          </div>
        </div>

        {/* Bottom telemetry strip */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: "1px solid rgba(240,245,247,0.12)",
            paddingTop: "28px",
          }}
        >
          <div style={{ display: "flex", gap: "48px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <span style={{ fontSize: "28px", fontWeight: 600, color: "#2ea8d1" }}>1.4ms</span>
              <span style={{ fontSize: "16px", color: "#93a6b1" }}>SDK ingest overhead</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <span style={{ fontSize: "28px", fontWeight: 600, color: "#82d96e" }}>&lt; 6ms</span>
              <span style={{ fontSize: "16px", color: "#93a6b1" }}>Inline edge PII mask</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <span style={{ fontSize: "28px", fontWeight: 600, color: "#f2994a" }}>$275/mo</span>
              <span style={{ fontSize: "16px", color: "#93a6b1" }}>10M traces flat metered</span>
            </div>
          </div>

          <span style={{ fontSize: "20px", color: "#93a6b1" }}>spanrail.dev</span>
        </div>
      </div>
    ),
    { ...size }
  );
}