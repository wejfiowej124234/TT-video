import { describe, expect, it } from "vitest";

import { ADMIN_HOME_CARDS } from "./adminHomeModel";
import { ADMIN_PERM } from "./adminPermissionIds";
import {
  adminHomeCardRequiredPermission,
  filterAdminHomeCardsForCapabilities,
} from "./adminHomeCardPermission";

describe("adminHomeCardPermission", () => {
  it("maps flags href to platform publish", () => {
    expect(adminHomeCardRequiredPermission("/admin/flags")).toBe(ADMIN_PERM.PLATFORM_PUBLISH);
  });

  it("filters super-only cards for CS-like grants", () => {
    const grants = new Set([ADMIN_PERM.READ, ADMIN_PERM.USERS_READ, ADMIN_PERM.ORDERS_READ]);
    const has = (p: string) => grants.has(p);
    const visible = filterAdminHomeCardsForCapabilities(ADMIN_HOME_CARDS, has);
    expect(visible.some((c) => c.href === "/admin/flags")).toBe(false);
    expect(visible.some((c) => c.href === "/admin/orders")).toBe(true);
  });
});
