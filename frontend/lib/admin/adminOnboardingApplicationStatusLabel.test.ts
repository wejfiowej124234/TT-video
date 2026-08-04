import { describe, expect, it } from "vitest";

import {
  adminOnboardingApplicationStatusLabelKey,
  formatAdminOnboardingApplicationStatus,
} from "./adminOnboardingApplicationStatusLabel";

describe("adminOnboardingApplicationStatusLabel", () => {
  it("maps known statuses to shared locale keys", () => {
    expect(adminOnboardingApplicationStatusLabelKey("submitted")).toBe(
      "admin_onboarding_app_status_submitted",
    );
    expect(adminOnboardingApplicationStatusLabelKey("stake_pending")).toBe(
      "admin_onboarding_app_status_stake_pending",
    );
    expect(adminOnboardingApplicationStatusLabelKey("needs_more_info")).toBe(
      "admin_onboarding_app_status_needs_more_info",
    );
    expect(adminOnboardingApplicationStatusLabelKey("pending_review")).toBe(
      "admin_onboarding_app_status_pending",
    );
  });

  it("formats via t() and falls back for unknown", () => {
    const t = (k: string) => (k === "admin_onboarding_app_status_approved" ? "已通过" : k);
    expect(formatAdminOnboardingApplicationStatus("approved", t)).toBe("已通过");
    expect(formatAdminOnboardingApplicationStatus("weird_custom", t)).toBe("weird_custom");
    expect(formatAdminOnboardingApplicationStatus("", t)).toBe("—");
  });
});
