import { asRecord, type OverviewBody } from "@/app/admin/observability/observabilityPageModel";

/** FIN-02 · 可观测 overview 摘要（partial 深度面板）。 */
export function adminObservabilityOverviewSnapshot(
  ov: OverviewBody["overview"] | undefined,
  bodyStatus?: string | null,
) {
  if (!ov) {
    return {
      chainId: null as string | null,
      indexerLag: null as number | null,
      status: bodyStatus ?? null,
    };
  }
  const idx = asRecord(ov.indexer);
  const lag = idx && typeof idx.lag_blocks === "number" ? idx.lag_blocks : null;
  const chainId = typeof ov.chain_id === "string" ? ov.chain_id : null;
  return { chainId, indexerLag: lag, status: bodyStatus ?? null };
}
