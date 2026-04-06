import type { Locale } from "@/lib/i18n";

const INTL_LOCALE: Record<Locale, string> = { zh: "zh-CN", en: "en-US" };

/**
 * 格式化社区列表/会话中的日期时间，与当前语言一致。
 * 用于会话 last_at、消息时间等。
 */
export function formatCommunityDate(dateStr: string, locale: Locale): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], {
    month: "short",
    day: "numeric",
    year: d.getFullYear() !== new Date().getFullYear() ? "numeric" : undefined,
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

/** 仅日期，用于列表次要信息 */
export function formatCommunityDateShort(dateStr: string, locale: Locale): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr.slice(0, 10);
  return new Intl.DateTimeFormat(INTL_LOCALE[locale], {
    month: "short",
    day: "numeric",
  }).format(d);
}
