import WarmRouteFieldBackdrop from "@/components/shell/WarmRouteFieldBackdrop";

/**
 * 自由市场：`WarmRouteFieldBackdrop` + **弱** podium / 静态赛博渐变 / vignette（opacity 低于 `/community`），
 * 与 `/did-rank` / `/community` 同构递减，减轻切入色差且不抢 **29** 撮合卡片可读性。
 */
export default function MarketAmbientBackdrop() {
  return (
    <>
      <WarmRouteFieldBackdrop />
      <div
        className="fixed inset-0 z-0 bg-web3-podium-spotlight opacity-[0.16] pointer-events-none"
        aria-hidden
      />
      <div className="absolute inset-0 z-0 pointer-events-none" aria-hidden>
        <div className="absolute inset-0 bg-scifi-gradient-static opacity-[0.32]" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-ref-cyan/4 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_20%_0%,rgba(252,164,124,0.08),transparent_50%),radial-gradient(circle_at_95%_25%,rgba(249,215,121,0.04),transparent_45%)]" />
        <div className="absolute inset-0 bg-ref-silhouette-vignette opacity-[0.22]" />
      </div>
    </>
  );
}
