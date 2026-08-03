/** Guide directory list · operational status labels (display only). */

const GUIDE_STATUS_KEYS: Record<string, string> = {
  active: "admin_guides_directory_status_active",
  suspended: "admin_guides_directory_status_suspended",
  pending_review: "admin_guides_directory_status_pending_review",
  rejected: "admin_guides_directory_status_rejected",
};

export function guideDirectoryStatusLabelKey(status: string | undefined): string {
  const s = (status ?? "").trim().toLowerCase();
  return GUIDE_STATUS_KEYS[s] ?? "admin_guides_directory_status_other";
}
