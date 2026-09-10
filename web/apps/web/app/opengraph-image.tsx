import { ImageResponse } from "next/og";

export const alt = "TrueLabel — Know what you eat";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const BARS = "TRUELABEL·KNOWWHATYOUEAT·INDIA·OPENSOURCE".split("").map((c) => (c.charCodeAt(0) % 3) + 1);

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "radial-gradient(ellipse at 20% 0%, #10352a 0%, #0a0a0a 55%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 28, fontWeight: 600 }}>
          True<span style={{ color: "#10b981", marginLeft: -12 }}>Label</span>
          <span style={{ fontSize: 16, color: "#737373", letterSpacing: 4, marginLeft: 12 }}>
            FREE · OPEN-SOURCE · INDIA-FIRST
          </span>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 120, fontWeight: 600, letterSpacing: -6, lineHeight: 0.95 }}>Know what</div>
          <div style={{ fontSize: 120, fontWeight: 600, letterSpacing: -6, lineHeight: 0.95, color: "#10b981" }}>
            you eat.
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
          <div style={{ fontSize: 26, color: "#a3a3a3", maxWidth: 640 }}>
            Scan the barcode. Read the label in plain language. Checked by the community.
          </div>
          <div style={{ display: "flex", height: 72, gap: 3 }}>
            {BARS.map((w, i) => (
              <div key={i} style={{ width: w * 3, background: i % 7 === 0 ? "#10b981" : "white" }} />
            ))}
          </div>
        </div>
      </div>
    ),
    size,
  );
}
