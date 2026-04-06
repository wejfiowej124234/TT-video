/** 160 / 04：举报 `target_type` / `reason_code` / `status` → i18n，未知则回退原文 */

export function communityReportTargetTypeLabel(t: (key: string) => string, targetType: string): string {
  const key = `community_report_target_type_${targetType}`;
  const v = t(key);
  return v === key ? targetType : v;
}

export function communityReportReasonLabel(t: (key: string) => string, reasonCode: string): string {
  const key = `community_report_reason_${reasonCode}`;
  const v = t(key);
  return v === key ? reasonCode : v;
}

export function communityReportStatusLabel(t: (key: string) => string, status: string): string {
  const key = `community_report_status_${status}`;
  const v = t(key);
  return v === key ? status : v;
}
