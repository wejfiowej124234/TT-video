/**
 * Batch-11 W04 · 入驻可见性契约（①）
 * HU-357 steward payload · HU-358 auth preview · HU-359 provider fields · HU-360 guide reject · HU-362 queue keys
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import {
  resolveOnboardingQueueKeyFieldsPreview,
  resolveOnboardingQueuePrimaryLabel,
} from "@/lib/admin/adminOnboardingQueueRowDisplay";

const root = resolve(__dirname, "../..");

function read(rel: string): string {
  return readFileSync(resolve(root, rel), "utf8");
}

describe("adminBatch11W04 onboarding visibility", () => {
  it("HU-357 steward card shows motivation / contact_email / country_code", () => {
    const src = read("components/admin/AdminStewardApplicationReviewCard.tsx");
    expect(src).toContain("admin_steward_app_motivation");
    expect(src).toContain("admin_steward_app_contactEmail");
    expect(src).toContain("admin_steward_app_country");
    expect(src).toContain("data-tt-admin-steward-motivation");
  });

  it("HU-358 guide + provider use AdminAuthDocPreviewLink", () => {
    const guide = read("components/admin/AdminGuideApplicationReviewCard.tsx");
    const provider = read("components/admin/AdminProviderApplicationReviewCard.tsx");
    const preview = read("components/admin/AdminAuthDocPreviewLink.tsx");
    expect(guide).toContain("AdminAuthDocPreviewLink");
    expect(provider).toContain("AdminAuthDocPreviewLink");
    expect(guide).not.toMatch(/target="_blank"/);
    expect(provider).not.toMatch(/target="_blank"/);
    expect(preview).toContain("writeRequestHeaders");
    expect(preview).toContain("createObjectURL");
  });

  it("HU-359 provider shows categories / bio / tax_id", () => {
    const src = read("components/admin/AdminProviderApplicationReviewCard.tsx");
    expect(src).toContain("admin_provider_app_categories");
    expect(src).toContain("admin_provider_app_bio");
    expect(src).toContain('["tax_id", "admin_provider_app_taxId"]');
  });

  it("HU-360 guide echoes rejection when rejected", () => {
    const src = read("components/admin/AdminGuideApplicationReviewCard.tsx");
    expect(src).toContain('app.status === "rejected"');
    expect(src).toContain("data-tt-admin-guide-rejection");
  });

  it("HU-362 queue key-fields helper + row card", () => {
    const card = read("components/admin/AdminOnboardingQueueRowCard.tsx");
    expect(card).toContain("resolveOnboardingQueueKeyFieldsPreview");
    expect(card).toContain("data-tt-admin-onboarding-key-fields");
    const preview = resolveOnboardingQueueKeyFieldsPreview("provider", {
      application: { shop_name: "店", country_code: "JP", city: "Tokyo", entity_type: "llc" },
    });
    expect(preview).toEqual(["JP", "Tokyo", "llc"]);
    expect(
      resolveOnboardingQueuePrimaryLabel("provider", {
        application: { shop_name: "店", country_code: "JP" },
      }),
    ).toBe("店");
  });
});
