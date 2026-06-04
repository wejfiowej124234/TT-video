import { sortRowsByKey, type AdminTableSortDir } from "@/lib/admin/useAdminTableSort";

export type OnboardingQueueSortKey = "submitted_at" | "status";

type RowWithApplication = {
  application?: { status?: string; submitted_at?: string } | null;
};

/** 入驻队列卡片列表 · 按提交时间 / 状态排序（① 客户端 · 已加载行）。 */
export function sortOnboardingQueueItems<T extends RowWithApplication>(
  rows: T[],
  key: OnboardingQueueSortKey,
  dir: AdminTableSortDir,
): T[] {
  return sortRowsByKey(rows, key, dir, (row, k) => {
    if (k === "submitted_at") return row.application?.submitted_at ?? "";
    return row.application?.status ?? "";
  });
}
