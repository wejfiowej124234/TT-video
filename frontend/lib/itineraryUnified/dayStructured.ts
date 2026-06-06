import type { UnifiedDayRow } from "./types";

/** 当日是否含 52 结构化块（景点/餐饮/住宿），有则优先只读列表展示 */
export function dayHasStructuredBlocks(row: UnifiedDayRow): boolean {
  if (row.hotel != null && String(row.hotel).trim() !== "") return true;
  if (Array.isArray(row.attractions) && row.attractions.length > 0) return true;
  if (Array.isArray(row.dining) && row.dining.length > 0) return true;
  return false;
}

export function itineraryHasStructuredBlocks(days: UnifiedDayRow[]): boolean {
  return days.some(dayHasStructuredBlocks);
}
