/**
 * Batch-11 W05 · 入驻补件/详情/三卡/ACL 契约（①）
 * HU-361 needs_more_info · HU-363 detail routes · HU-364 hide empty · HU-368 ACL marker
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { onboardingApplicationDetailHref } from "@/lib/admin/adminOnboardingQueueRowDisplay";
import { TT_ADMIN_UPLOAD_ACL_PROVIDER_DOCS } from "@/components/admin/AdminAuthDocPreviewLink";

const root = resolve(__dirname, "../..");

function read(rel: string): string {
  return readFileSync(resolve(root, rel), "utf8");
}

describe("adminBatch11W05 onboarding flow", () => {
  it("HU-361 guide/provider/steward expose needs_more_info action", () => {
    for (const rel of [
      "components/admin/AdminGuideApplicationReviewCard.tsx",
      "components/admin/AdminProviderApplicationReviewCard.tsx",
      "components/admin/AdminStewardApplicationReviewCard.tsx",
    ]) {
      const src = read(rel);
      expect(src).toContain("needs_more_info");
      expect(src).toContain("data-tt-admin-action-needs-more-info");
      expect(src).toContain("actionNeedsMoreInfo");
    }
    expect(read("lib/apiClient/adminGuideApplication.ts")).toContain("needs_more_info");
    expect(read("lib/apiClient/adminProviderApplication.ts")).toContain("needs_more_info");
    expect(read("lib/apiClient/adminStewardApplication.ts")).toContain("needs_more_info");
  });

  it("HU-363 dedicated detail routes + queue link", () => {
    expect(read("app/admin/provider-applications/[id]/page.tsx")).toContain(
      "AdminOnboardingApplicationDetailPageMain",
    );
    expect(read("app/admin/guide-applications/[id]/page.tsx")).toContain(
      "AdminOnboardingApplicationDetailPageMain",
    );
    expect(read("app/admin/steward-applications/[id]/page.tsx")).toContain(
      "AdminOnboardingApplicationDetailPageMain",
    );
    const detail = read("components/admin/AdminOnboardingApplicationDetailPageMain.tsx");
    expect(detail).toContain("data-tt-admin-onboarding-detail");
    expect(detail).toContain("admin_onboarding_detail_back");
    const row = read("components/admin/AdminOnboardingQueueRowCard.tsx");
    expect(row).toContain("onboardingApplicationDetailHref");
    expect(row).toContain("data-tt-admin-onboarding-detail-link");
    expect(onboardingApplicationDetailHref("provider", "u1")).toBe(
      "/admin/provider-applications/u1",
    );
  });

  it("HU-364 user page conditional onboarding + cards hide empty", () => {
    const user = read("app/admin/users/[id]/AdminUserDetailPageMain.tsx");
    expect(user).toContain("data-tt-admin-user-onboarding-conditional");
    for (const rel of [
      "components/admin/AdminGuideApplicationReviewCard.tsx",
      "components/admin/AdminProviderApplicationReviewCard.tsx",
      "components/admin/AdminStewardApplicationReviewCard.tsx",
    ]) {
      const src = read(rel);
      expect(src).toMatch(/if \(!loading && !error && !app\?\.status\) return null/);
    }
  });

  it("HU-368 FE ACL marker + API helper present", () => {
    expect(TT_ADMIN_UPLOAD_ACL_PROVIDER_DOCS).toBe("tt-admin-upload-acl-provider-docs-v1");
    const preview = read("components/admin/AdminAuthDocPreviewLink.tsx");
    expect(preview).toContain("data-tt-admin-upload-acl-provider");
    const api = readFileSync(
      resolve(root, "../crates/api/src/routes/guides.rs"),
      "utf8",
    );
    expect(api).toContain("payload_contains_upload_name");
    expect(api).toContain("owner_provider");
  });
});
