/**
 * DID 排行榜 · ① 本地预览数据闸门（与 `marketSubsiteProductionGate` 同族）。
 * 各环境默认不注入；显式 `NEXT_PUBLIC_DID_RANK_DEMO_PREVIEW=1` 才开。
 */

function didRankDemoPreviewEnvOn(): boolean {
  const v = (process.env.NEXT_PUBLIC_DID_RANK_DEMO_PREVIEW ?? "").trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes" || v === "on";
}

export function didRankDevPreviewEnabled(): boolean {
  if (process.env.NODE_ENV === "test") return false;
  if (process.env.NODE_ENV === "production") return false;
  return didRankDemoPreviewEnvOn();
}
