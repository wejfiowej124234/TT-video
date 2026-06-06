import { describe, expect, it } from "vitest";

import { ADMIN_INBOX_QUEUE_HREFS } from "./adminInboxQueueHrefs";
import { adminInboxQueuePathname, adminPathShowsInboxBreadcrumb } from "./adminInboxQueuePath";

describe("adminInboxQueuePath (①)", () => {
  it("maps queue list paths to inbox SSOT hrefs", () => {
    expect(adminInboxQueuePathname("/admin/provider-applications")).toBe(
      ADMIN_INBOX_QUEUE_HREFS.provider,
    );
    expect(adminInboxQueuePathname("/admin/approvals/abc")).toBe(ADMIN_INBOX_QUEUE_HREFS.approvals);
    expect(adminPathShowsInboxBreadcrumb("/admin/approvals/abc")).toBe(true);
    expect(adminPathShowsInboxBreadcrumb("/admin/community/reports")).toBe(true);
    expect(adminPathShowsInboxBreadcrumb("/admin/users")).toBe(false);
  });
});
