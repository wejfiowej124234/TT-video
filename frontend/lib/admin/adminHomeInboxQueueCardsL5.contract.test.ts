import { describe, expect, it } from "vitest";

import { ADMIN_HOME_CARDS, resolveAdminHomeCardTier } from "./adminHomeModel";
import { ADMIN_INBOX_QUEUE_HREFS } from "./adminInboxQueueHrefs";
import { adminHomeCardLookupPath } from "./adminHomeCardCapability";
import { adminHomeCardRequiredPermission } from "./adminHomeCardPermission";

/** ① 首页卡片带 `?status=` 时 tier/perm 仍按 pathname 解析。 */
describe("admin home inbox queue cards L5 (①)", () => {
  it("inbox-key cards use ADMIN_INBOX_QUEUE_HREFS", () => {
    for (const key of ["provider", "steward", "approvals", "reports"] as const) {
      const card = ADMIN_HOME_CARDS.find((c) => c.inboxKey === key);
      expect(card?.href).toBe(ADMIN_INBOX_QUEUE_HREFS[key]);
    }
    const reportsCard = ADMIN_HOME_CARDS.find(
      (c) => c.titleKey === "admin_community_reports_title",
    );
    expect(reportsCard?.href).toBe(ADMIN_INBOX_QUEUE_HREFS.reports);
    expect(reportsCard?.inboxKey).toBe("reports");
  });

  it("resolves tier and permission via pathname when href has query", () => {
    const provider = ADMIN_INBOX_QUEUE_HREFS.provider;
    expect(adminHomeCardLookupPath(provider)).toBe("/admin/provider-applications");
    expect(resolveAdminHomeCardTier({ href: provider, titleKey: "x", descKey: "y", section: "onboarding" })).toBe(
      "write",
    );
    expect(adminHomeCardRequiredPermission(provider)).toBeDefined();
  });
});
