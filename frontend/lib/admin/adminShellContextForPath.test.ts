import { describe, expect, it } from "vitest";
import { adminPathShowsInboxBreadcrumb } from "./adminInboxQueuePath";
import { adminBreadcrumbLeafForPath, adminShellContextForPath } from "./adminShellContextForPath";

describe("adminShellContextForPath", () => {
  it("maps admin routes to shell groups", () => {
    expect(adminShellContextForPath("/admin")?.groupId).toBe("workspace");
    expect(adminShellContextForPath("/admin/approvals")?.groupId).toBe("onboarding");
    expect(adminShellContextForPath("/admin/orders/abc")?.groupId).toBe("operations");
    expect(adminShellContextForPath("/admin/community/reports")?.groupId).toBe("community");
    expect(adminShellContextForPath("/admin/finance-reconciliation")?.groupId).toBe("finance");
    expect(adminShellContextForPath("/admin/cross-check")?.groupId).toBe("governance");
    expect(adminShellContextForPath("/admin/config/releases")?.groupId).toBe("more");
  });

  it("maps pathname to breadcrumb leaf label keys", () => {
    expect(adminBreadcrumbLeafForPath("/admin/approvals")).toBe("admin_approvals_title");
    expect(adminBreadcrumbLeafForPath("/admin/provider-applications")).toBe("admin_provider_list_title");
    expect(adminBreadcrumbLeafForPath("/admin/users/abc")).toBe("admin_user_detail_title");
    expect(adminBreadcrumbLeafForPath("/admin/community/reports")).toBe("admin_community_reports_title");
    expect(adminBreadcrumbLeafForPath("/admin/compliance/requests/req-1/events")).toBe(
      "admin_compliance_events_title",
    );
    expect(adminBreadcrumbLeafForPath("/admin/compliance/requests/req-1/update")).toBe(
      "admin_compliance_update_title",
    );
    expect(adminBreadcrumbLeafForPath("/admin")).toBeNull();
  });

  it("flags inbox breadcrumb on four queue list paths", () => {
    expect(adminPathShowsInboxBreadcrumb("/admin/provider-applications")).toBe(true);
    expect(adminPathShowsInboxBreadcrumb("/admin/inbox")).toBe(false);
  });
});
