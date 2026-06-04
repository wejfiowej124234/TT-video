import { describe, expect, it } from "vitest";

import { ADMIN_INBOX_QUEUE_HREFS } from "./adminInboxQueueHrefs";
import { adminRecentVisitHref } from "./adminRecentVisits";

describe("adminRecentVisits", () => {
  it("maps stored queue pathnames to inbox SSOT hrefs", () => {
    expect(adminRecentVisitHref("/admin/provider-applications")).toBe(
      ADMIN_INBOX_QUEUE_HREFS.provider,
    );
    expect(adminRecentVisitHref("/admin/steward-applications")).toBe(
      ADMIN_INBOX_QUEUE_HREFS.steward,
    );
    expect(adminRecentVisitHref("/admin/approvals")).toBe(ADMIN_INBOX_QUEUE_HREFS.approvals);
    expect(adminRecentVisitHref("/admin/community/reports")).toBe(ADMIN_INBOX_QUEUE_HREFS.reports);
  });

  it("passes through non-queue paths", () => {
    expect(adminRecentVisitHref("/admin/orders")).toBe("/admin/orders");
  });
});
