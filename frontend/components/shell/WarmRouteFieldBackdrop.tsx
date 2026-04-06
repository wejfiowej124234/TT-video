/**
 * 自由市场 / DID 排行榜 / TT 社区 共用页身底：与 `/traveltrust`、`/market` 同系暖场域，
 * 减少顶栏下三路由之间的色差（86 Tropical jade + 日出金/珊瑚）。
 */
export default function WarmRouteFieldBackdrop() {
  return (
    <>
      <div className="fixed inset-0 z-0 bg-[#14100d] pointer-events-none" aria-hidden />
      <div className="fixed inset-0 z-0 bg-traveltrust-atmosphere pointer-events-none" aria-hidden />
      <div
        className="fixed inset-0 z-0 bg-traveltrust-dot-grid opacity-[0.22] pointer-events-none"
        aria-hidden
      />
    </>
  );
}
