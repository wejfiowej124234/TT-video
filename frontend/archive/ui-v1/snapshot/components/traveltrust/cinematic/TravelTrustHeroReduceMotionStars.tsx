"use client";

/** 减动效时替代 WebGL 的 CSS 星野 + 冷青光晕（TT-PH1-161 · ①） */
export function TravelTrustHeroReduceMotionStars() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-[0] overflow-hidden"
      aria-hidden
      data-tt-traveltrust-hero-reduce-motion-stars="1"
      style={{
        background: [
          "radial-gradient(ellipse 62% 52% at var(--tt-hero-globe-optical-x,34%) 40%, rgba(35,206,217,0.16) 0%, transparent 68%)",
          "radial-gradient(circle at 18% 22%, rgba(255,255,255,0.07) 0%, transparent 42%)",
          "radial-gradient(circle at 72% 28%, rgba(35,206,217,0.05) 0%, transparent 38%)",
          "radial-gradient(circle at 48% 78%, rgba(3,7,18,0.55) 0%, transparent 55%)",
          "radial-gradient(1px 1px at 12% 18%, rgba(255,255,255,0.35), transparent)",
          "radial-gradient(1px 1px at 28% 62%, rgba(255,255,255,0.22), transparent)",
          "radial-gradient(1px 1px at 44% 34%, rgba(255,255,255,0.28), transparent)",
          "radial-gradient(1px 1px at 58% 72%, rgba(255,255,255,0.18), transparent)",
          "radial-gradient(1px 1px at 76% 44%, rgba(255,255,255,0.24), transparent)",
          "radial-gradient(1px 1px at 88% 22%, rgba(255,255,255,0.2), transparent)",
          "linear-gradient(180deg, #030712 0%, #080e12 48%, #030712 100%)",
        ].join(", "),
        backgroundSize:
          "auto, auto, auto, auto, 100% 100%, 100% 100%, 100% 100%, 100% 100%, 100% 100%, 100% 100%, auto",
      }}
    />
  );
}
