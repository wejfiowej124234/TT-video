/**
 * Batch-11 W03 · Official accounts L5 helpers (HU-341/342/345/346/347).
 */
import { describe, expect, it } from "vitest";
import {
  isOfficialAccountProbeRow,
  officialAccountKindLabelKey,
  officialAccountPublishShowFlags,
  officialAccountReviewLabelKey,
  officialAccountVerifyHref,
} from "./officialOpsL5";

describe("officialOpsL5 Batch-11 W03", () => {
  it("HU-341 · maps kinds to product label keys", () => {
    expect(officialAccountKindLabelKey("community_author")).toBe("admin_official_kind_community_author");
    expect(officialAccountKindLabelKey("merchant")).toBe("admin_official_kind_merchant");
  });

  it("HU-345 · maps review statuses", () => {
    expect(officialAccountReviewLabelKey("draft")).toBe("admin_official_review_draft");
    expect(officialAccountReviewLabelKey("published")).toBe("admin_official_review_published");
  });

  it("HU-342 · detects probe/seed rows", () => {
    expect(isOfficialAccountProbeRow({ data_origin: "test", display_label: "A" })).toBe(true);
    expect(
      isOfficialAccountProbeRow({
        data_origin: "production",
        display_label: "Diag Author",
        user_email: "diag-author-404@ocs.test",
      }),
    ).toBe(true);
    expect(
      isOfficialAccountProbeRow({
        data_origin: "production",
        display_label: "Tokyo Official",
        user_email: "official@traveltrust.app",
      }),
    ).toBe(false);
  });

  it("HU-347 · publish flags by review status", () => {
    expect(officialAccountPublishShowFlags("draft")).toEqual({
      submit: true,
      request: false,
      publish: false,
    });
    expect(officialAccountPublishShowFlags("in_review")).toEqual({
      submit: false,
      request: true,
      publish: true,
    });
    expect(officialAccountPublishShowFlags("published")).toEqual({
      submit: false,
      request: false,
      publish: false,
    });
  });

  it("HU-346 · verify href only when active", () => {
    expect(officialAccountVerifyHref({ account_kind: "community_author", is_active: true })).toBe(
      "/community",
    );
    expect(officialAccountVerifyHref({ account_kind: "guide", is_active: true })).toBe(
      "/admin/official/guides",
    );
    expect(officialAccountVerifyHref({ account_kind: "guide", is_active: false })).toBeNull();
  });
});
