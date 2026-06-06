import { ImageResponse } from "next/og";
import { DID_RANK_OG_COPY } from "@/lib/didRankOpenGraphCopy";

export const alt = "TravelTrust DID Rankings";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** `/did-rank` 路由级 OG（①） */
export default function DidRankOpenGraphImage() {
  const copy = DID_RANK_OG_COPY.zh;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(145deg, #14100d 0%, #3b0764 38%, #1a1512 100%)",
          color: "#f8fafc",
          fontFamily: "system-ui, sans-serif",
          padding: 48,
        }}
      >
        <div style={{ fontSize: 20, letterSpacing: "0.14em", color: "#fca47c", marginBottom: 16 }}>
          {copy.kicker}
        </div>
        <div style={{ fontSize: 52, fontWeight: 700, textAlign: "center" }}>{copy.title}</div>
        <div style={{ marginTop: 20, fontSize: 26, opacity: 0.9, textAlign: "center", maxWidth: 760 }}>
          {copy.tagline}
        </div>
        <div style={{ marginTop: 32, fontSize: 18, color: "#94a3b8" }}>{copy.chips.join(" · ")}</div>
      </div>
    ),
    { ...size },
  );
}
