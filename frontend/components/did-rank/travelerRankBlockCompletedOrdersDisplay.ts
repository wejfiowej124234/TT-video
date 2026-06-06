import type { TravelerRankItem } from "@/lib/didRankTypes";
import type { TravelerRankTFunc } from "@/components/did-rank/travelerRankBlockTypes";

/** 仅当 API 返回有限数时展示数字；缺字段或非数用 em dash，避免与「真实 0 单」混淆。 */
export function formatTravelerCompletedOrdersDisplay(item: TravelerRankItem, t: TravelerRankTFunc): string {
  const v = item.completed_orders;
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return t("ui_em_dash");
}
