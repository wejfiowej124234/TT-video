import { adminApiErrorUserText } from "@/lib/adminFetchDisplay";
import type { LocaleTranslateFn } from "@/lib/i18n";

export const APPEAL_REVIEW_DECISIONS = ["accepted", "rejected"] as const;

export const APPEAL_DECISION_I18N: Record<(typeof APPEAL_REVIEW_DECISIONS)[number], string> = {
  accepted: "admin_appeal_review_opt_accepted",
  rejected: "admin_appeal_review_opt_rejected",
};

export type CommunityAppealReviewRes = {
  status?: string;
  error?: string;
  current_version?: number;
  item?: { id?: string; status?: string; version?: number };
};

export function appealReviewErr(code: string | undefined, body: CommunityAppealReviewRes | undefined, t: LocaleTranslateFn): string {
  switch (code) {
    case "invalid_community_appeal_id":
      return t("admin_appeal_review_errBadId");
    case "invalid_community_appeal_decision":
      return t("admin_appeal_review_errBadDecision");
    case "community_appeal_not_found":
      return t("admin_appeal_review_errNotFound");
    case "community_appeal_not_pending":
      return t("admin_appeal_review_errNotPending");
    case "community_appeal_version_conflict": {
      const cv = body?.current_version;
      return typeof cv === "number"
        ? t("admin_appeal_review_errVersionConflict", { v: cv })
        : t("admin_appeal_review_errVersionConflictGeneric");
    }
    case "admin_community_appeal_review_race":
      return t("admin_appeal_review_errRace");
    default:
      return adminApiErrorUserText(code, t);
  }
}
