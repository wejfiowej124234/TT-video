import { describe, expect, it } from "vitest";

import { ADMIN_PERM } from "./adminPermissionIds";
import { adminPermissionForPathname } from "./adminRoutePermission";

describe("adminPermissionForPathname", () => {
  it("maps list and detail routes", () => {
    expect(adminPermissionForPathname("/admin")).toBeNull();
    expect(adminPermissionForPathname("/admin/approvals")).toBe(ADMIN_PERM.APPROVE);
    expect(adminPermissionForPathname("/admin/users/abc")).toBe(ADMIN_PERM.USERS_READ);
    expect(adminPermissionForPathname("/admin/onboarding/entitlements/1")).toBe(
      ADMIN_PERM.ONBOARDING_WRITE,
    );
    expect(adminPermissionForPathname("/admin/observability")).toBe(ADMIN_PERM.READ);
    expect(adminPermissionForPathname("/admin/disputes/abc")).toBe(ADMIN_PERM.ORDERS_READ);
  });
});
