import { adminApiErrorUserText } from "@/lib/adminFetchDisplay";

type TFn = (key: string) => string;

export function penaltyCreateErr(code: string | undefined, t: TFn): string {
  switch (code) {
    case "invalid_penalty_subject_user_id":
      return t("admin_penalties_createErrBadSubject");
    case "invalid_community_penalty_action":
      return t("admin_penalties_createErrBadAction");
    case "community_report_not_found_for_penalty":
      return t("admin_penalties_createErrReportMissing");
    case "invalid_penalty_report_id":
      return t("admin_penalties_createErrBadReport");
    case "invalid_penalty_expires_at":
      return t("admin_penalties_createErrBadExpires");
    default:
      return adminApiErrorUserText(code, t);
  }
}

export function adminCommunityPenaltyMetaPreview(m: unknown, dash: string): string {
  if (m == null) return dash;
  try {
    const s = typeof m === "string" ? m : JSON.stringify(m);
    return s.length > 72 ? `${s.slice(0, 72)}…` : s;
  } catch {
    return dash;
  }
}
