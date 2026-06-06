/** 设置族扩展页 query 解析（反馈 / 社区资料 / 验证邮箱等） */

export type MeSettingsExtensionFrom = "settings" | "settings-data" | null;

export function parseMeSettingsExtensionFrom(
  raw: string | null | undefined,
): MeSettingsExtensionFrom {
  if (raw === "settings" || raw === "settings-data") return raw;
  return null;
}

export function isMeSettingsExtensionFromSettings(from: MeSettingsExtensionFrom): boolean {
  return from === "settings" || from === "settings-data";
}

/** URL `?from=settings`（含帮助 / 争议等扩展页） */
export function isMeSettingsExtensionFromQuery(raw: string | null | undefined): boolean {
  return raw === "settings" || raw === "settings-data";
}

/** 争议列表/详情链保留设置族 query */
export function meSettingsDisputesHrefSuffix(raw: string | null | undefined): string {
  return meSettingsExtensionQuerySuffix(raw);
}

/** Hub / 扩展页 URL 追加 `?from=settings` */
export function meSettingsExtensionQuerySuffix(raw: string | null | undefined): string {
  return isMeSettingsExtensionFromQuery(raw) ? "?from=settings" : "";
}

/** 设置 Hub 导航项 href（始终带设置族来源） */
export function meSettingsNavExtensionHref(path: string): string {
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}from=settings`;
}

export function isMeSettingsDeleteAccountFeedbackIntent(
  from: MeSettingsExtensionFrom,
  intent: string | null | undefined,
): boolean {
  return from === "settings-data" && intent === "delete-account";
}
