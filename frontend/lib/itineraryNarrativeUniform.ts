import { getDayDescription, type UnifiedDayRow } from "@/lib/itineraryUnified";

/** 多日行程说明正文是否完全相同（用于草稿预览去重提示） */
export function itineraryDescriptionsUniform(rows: UnifiedDayRow[]): boolean {
  const descs = rows.map((r) => getDayDescription(r).trim()).filter(Boolean);
  if (descs.length < 2) return false;
  const first = descs[0];
  return descs.every((d) => d === first);
}

export function uniformItineraryDescription(rows: UnifiedDayRow[]): string {
  const descs = rows.map((r) => getDayDescription(r).trim()).filter(Boolean);
  return descs[0] ?? "";
}
