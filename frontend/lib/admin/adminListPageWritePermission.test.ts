import { describe, expect, it } from "vitest";
import { adminWritePermissionForPathname } from "./adminListPageWritePermission";
import { ADMIN_PERM } from "./adminPermissionIds";

describe("adminListPageWritePermission", () => {
  it("maps write and super_write routes", () => {
    expect(adminWritePermissionForPathname("/admin/approvals")).toBe(ADMIN_PERM.APPROVE);
    expect(adminWritePermissionForPathname("/admin/disputes")).toBe(ADMIN_PERM.DISPUTES_WRITE);
    expect(adminWritePermissionForPathname("/admin/flags")).toBe(ADMIN_PERM.PLATFORM_PUBLISH);
    expect(adminWritePermissionForPathname("/admin/orders")).toBeUndefined();
    expect(adminWritePermissionForPathname("/admin/compliance/requests/abc/events")).toBe(
      ADMIN_PERM.APPROVE,
    );
    expect(adminWritePermissionForPathname("/admin/community/abuse-policy")).toBe(
      ADMIN_PERM.COMMUNITY_SUPER,
    );
  });
});
