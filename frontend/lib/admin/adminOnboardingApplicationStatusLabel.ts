/**
 * V65-PROD-003-G059 / G073 · shared onboarding application status → locale key.
 * Queue rows + review cards must not render raw English enums as the only badge text.
 */

export function adminOnboardingApplicationStatusLabelKey(
  status: string | undefined | null,
): string {
  const s = (status ?? "").trim().toLowerCase();
  switch (s) {
    case "submitted":
      return "admin_onboarding_app_status_submitted";
    case "pending":
    case "pending_review":
      return "admin_onboarding_app_status_pending";
    case "reviewing":
      return "admin_onboarding_app_status_reviewing";
    case "approved":
      return "admin_onboarding_app_status_approved";
    case "rejected":
      return "admin_onboarding_app_status_rejected";
    case "needs_more_info":
      return "admin_onboarding_app_status_needs_more_info";
    case "stake_pending":
      return "admin_onboarding_app_status_stake_pending";
    case "stake_release_pending":
      return "admin_onboarding_app_status_stake_release_pending";
    default:
      return "";
  }
}

export function formatAdminOnboardingApplicationStatus(
  status: string | undefined | null,
  t: (key: string) => string,
): string {
  const key = adminOnboardingApplicationStatusLabelKey(status);
  if (key) return t(key);
  const raw = (status ?? "").trim();
  return raw || "—";
}
