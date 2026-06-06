/** GET /me 用于仲裁区与结案后链上意图区；与 string | null 角色解耦，避免失败时无限 loading */
export type MeRoleFetchState =
  | { phase: "loading" }
  | { phase: "failed" }
  | { phase: "ready"; role: string | null };

/** GET 订单证据列表：与上传错误 evidenceError 分离，避免加载失败被当成「无证据」 */
export type OrderEvidenceListFetch = "idle" | "loading" | "ready" | "error";

export type OrderEvidenceRow = {
  content_hash: string;
  created_at?: string;
  uploader_id?: string;
};

/** 51-F8：13-1 表4 可追溯 hash（txHash、blockNumber）必现；API 未返回时展示占位 */
export type DisputeDetail = {
  id?: string;
  order_id?: string;
  status?: string;
  evidence_hashes?: string[];
  arbitrator_id?: string | null;
  refund_ratio?: number | null;
  slash_guide?: boolean | null;
  resolved_at?: string | null;
  created_at?: string;
  arb_fee_paid?: string | null;
  dispute_sequence?: number;
  resolution_tx_hash?: string | null;
  resolution_block_number?: number | string | null;
};

/** 区块浏览器 tx 页 base URL（13-1 表4 可追溯；与 Escrow OnchainEventTimeline 一致） */
export function getExplorerTxUrl(chainId: number): string | undefined {
  if (chainId === 137) return "https://polygonscan.com/tx/";
  if (chainId === 80002) return "https://amoy.polygonscan.com/tx/";
  return undefined;
}
