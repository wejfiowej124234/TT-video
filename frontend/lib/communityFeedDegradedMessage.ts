import type { LocaleTranslateFn } from "@/lib/i18n";

/** 与 `GET /api/v1/community/feed` 根级 `status: degraded` + `reason` 对齐（51 / 31）。 */
export function communityFeedDegradedMessage(data: unknown, t: LocaleTranslateFn): string {
  const reason = (data as { reason?: unknown } | null | undefined)?.reason;
  const r = typeof reason === "string" ? reason.trim() : "";
  if (r) {
    return t("community_feed_degraded_reason", { reason: r });
  }
  return t("community_feed_degraded");
}
