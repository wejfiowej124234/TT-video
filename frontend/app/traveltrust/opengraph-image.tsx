import { ImageResponse } from "next/og";
import { TRAVELTRUST_OG_COPY } from "@/lib/traveltrustOpenGraphCopy";

export const alt = "TravelTrust Network — digital travel Web3";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** v6 路由级 OG 1200×630（TT-PH1-073 / 167 · ①） */
export default function TravelTrustOpenGraphImage() {
  const copy = TRAVELTRUST_OG_COPY.zh;

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
          background: "linear-gradient(145deg, #14100d 0%, #0c4a47 42%, #1a1512 100%)",
          color: "#f8fafc",
          fontFamily: "system-ui, sans-serif",
          padding: 48,
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 32,
            right: 40,
            fontSize: 18,
            padding: "8px 16px",
            borderRadius: 999,
            border: "1px solid rgba(251,191,36,0.45)",
            background: "rgba(251,191,36,0.12)",
            color: "#fde68a",
          }}
        >
          {copy.illustrative}
        </div>
        <div
          style={{
            position: "absolute",
            width: 320,
            height: 320,
            borderRadius: "50%",
            border: "2px solid rgba(35,206,217,0.35)",
            top: 120,
            opacity: 0.85,
          }}
        />
        <div
          style={{
            position: "absolute",
            width: 280,
            height: 280,
            borderRadius: "50%",
            border: "1px solid rgba(110,231,183,0.25)",
            top: 140,
            opacity: 0.7,
          }}
        />
        <div
          style={{
            fontSize: 22,
            letterSpacing: "0.12em",
            color: "#fca47c",
            marginBottom: 20,
          }}
        >
          {copy.kicker}
        </div>
        <div style={{ fontSize: 56, fontWeight: 700, lineHeight: 1.1, textAlign: "center" }}>{copy.title}</div>
        <div
          style={{
            marginTop: 24,
            fontSize: 28,
            opacity: 0.92,
            textAlign: "center",
            maxWidth: 720,
            lineHeight: 1.35,
          }}
        >
          {copy.tagline}
        </div>
        <div
          style={{
            marginTop: 36,
            fontSize: 18,
            color: "#94a3b8",
          }}
        >
          {copy.chips.join(" · ")}
        </div>
      </div>
    ),
    { ...size },
  );
}
