/**
 * 向导列表 / 详情 / discover 等「市场域」页共用：全屏 z-0 氛围 + 点阵，仅装饰、不接收指针事件。
 * 与历史 `guides/*` / `discover` 内联双 `div` 视觉一致。
 */
export function MarketPageAmbientLayers() {
  return (
    <>
      <div className="fixed inset-0 z-0 bg-market-atmosphere pointer-events-none" aria-hidden />
      <div className="fixed inset-0 z-0 bg-web3-dot-grid opacity-[0.22] pointer-events-none" aria-hidden />
    </>
  );
}
