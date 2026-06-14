import { formatUnits } from "viem";

import { getMeFull, postGuideStake } from "@/lib/apiClient";

/** `GET /me` · `guide.id`（链上写成功后 DB 对拍用） */
export function parseGuideIdFromMe(mePayload: unknown): string | null {
  if (mePayload == null || typeof mePayload !== "object") return null;
  const guide = (mePayload as { guide?: { id?: unknown } | null }).guide;
  if (guide == null || typeof guide !== "object") return null;
  const raw = guide.id;
  if (typeof raw === "string" && raw.trim().length > 0) return raw.trim();
  return null;
}

/** 去掉 formatUnits 尾随零，与 API `guides.stake_amount` 展示习惯一致 */
export function formatStakeAmountForApi(raw: bigint, decimals: number): string {
  const s = formatUnits(raw, decimals);
  if (!s.includes(".")) return s;
  return s.replace(/\.?0+$/, "");
}

export type StakingGuideDbSyncResult =
  | { ok: true; guideId: string; amount: string }
  | { ok: false; reason: "not_guide_pool" | "guide_id_missing" | "api_error"; detail?: string };

/**
 * ① 本地：链上 stake/withdraw 成功后 best-effort 回写 `POST /guides/:id/stake`。
 * ② 须与链上事件/索引对拍；本函数 **不** 冒充链上真值已验。
 */
export async function syncGuideOnChainStakeToApi(
  totalStakeRaw: bigint,
  decimals: number,
): Promise<StakingGuideDbSyncResult> {
  try {
    const me = await getMeFull({ force: true });
    const guideId = parseGuideIdFromMe(me);
    if (!guideId) {
      return { ok: false, reason: "guide_id_missing" };
    }
    const amount = formatStakeAmountForApi(totalStakeRaw, decimals);
    const idempotencyKey = `chain-stake-sync-${guideId}-${totalStakeRaw.toString()}`;
    await postGuideStake(guideId, { amount }, idempotencyKey);
    return { ok: true, guideId, amount };
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    return { ok: false, reason: "api_error", detail };
  }
}
