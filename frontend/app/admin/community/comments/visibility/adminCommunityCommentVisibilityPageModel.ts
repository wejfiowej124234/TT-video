import { adminApiErrorUserText } from "@/lib/adminFetchDisplay";

export const COMMENT_VISIBILITY_STATUSES = ["visible", "hidden", "removed"] as const;
export type CommentVisibilityStatus = (typeof COMMENT_VISIBILITY_STATUSES)[number];

export const COMMENT_VIS_I18N: Record<CommentVisibilityStatus, string> = {
  visible: "admin_comment_vis_opt_visible",
  hidden: "admin_comment_vis_opt_hidden",
  removed: "admin_comment_vis_opt_removed",
};

export type AdminCommentVisibilityRes = {
  status?: string;
  error?: string;
  id?: string;
  visibility_status?: string;
};

export function visErr(code: string | undefined, t: (k: string) => string): string {
  switch (code) {
    case "invalid_comment_id":
      return t("admin_comment_vis_errBadId");
    case "invalid_comment_visibility_status":
      return t("admin_comment_vis_errBadVis");
    case "community_comment_not_found":
      return t("admin_comment_vis_errNotFound");
    default:
      return adminApiErrorUserText(code, t);
  }
}
