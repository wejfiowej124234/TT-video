import { adminApiErrorUserText } from "@/lib/adminFetchDisplay";
import type { LocaleTranslateFn } from "@/lib/i18n";
import type { ModerationRes } from "./adminCommunityReportsTypes";

export function moderationErrText(
  code: string | undefined,
  body: ModerationRes | undefined,
  t: LocaleTranslateFn
): string {
  switch (code) {
    case "community_report_version_conflict": {
      const cv = body?.current_version;
      return typeof cv === "number"
        ? t("admin_reports_modErrVersionConflict", { v: cv })
        : t("admin_reports_modErrVersionConflictGeneric");
    }
    case "admin_community_moderation_race":
      return t("admin_reports_modErrRace");
    case "community_penalty_only_when_resolved":
      return t("admin_reports_modErrPenaltyResolved");
    case "invalid_community_penalty_action":
      return t("admin_reports_modErrBadPenaltyAction");
    case "penalty_subject_required":
      return t("admin_reports_modErrPenaltySubject");
    case "invalid_penalty_subject_user_id":
      return t("admin_reports_modErrBadSubject");
    case "invalid_penalty_expires_at":
      return t("admin_reports_modErrBadExpires");
    default:
      return adminApiErrorUserText(code, t);
  }
}
