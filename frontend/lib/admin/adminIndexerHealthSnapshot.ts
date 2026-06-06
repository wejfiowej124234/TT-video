import { asRecord } from "@/app/admin/indexer/indexerPageModel";

/** FIN-02 · 从 indexer health JSON 提取 partial 深度面板字段。 */
export function adminIndexerHealthSnapshot(health: Record<string, unknown> | null) {
  if (!health) {
    return {
      checkpointBlock: null as number | null,
      checkpointLog: null as number | null,
      lagBlocks: null as number | null,
      reorgDetected: null as boolean | null,
      replayRequired: null as boolean | null,
    };
  }
  const cp = asRecord(health.checkpoint);
  return {
    checkpointBlock: typeof cp?.block_number === "number" ? cp.block_number : null,
    checkpointLog: typeof cp?.log_index === "number" ? cp.log_index : null,
    lagBlocks: typeof health.lag_blocks === "number" ? health.lag_blocks : null,
    reorgDetected: health.reorg_detected === true,
    replayRequired: health.replay_required === true,
  };
}
