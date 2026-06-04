import { describe, expect, it } from "vitest";

import { ADMIN_HOME_CARDS } from "./adminHomeModel";
import { filterAdminHomeCardsForRole } from "./adminHomeVisibility";

describe("adminHomeVisibility", () => {
  it("hides superAdminOnly cards for admin role", () => {
    const adminVisible = filterAdminHomeCardsForRole(ADMIN_HOME_CARDS, "admin");
    const superVisible = filterAdminHomeCardsForRole(ADMIN_HOME_CARDS, "super_admin");
    expect(adminVisible.length).toBeLessThan(superVisible.length);
    expect(adminVisible.some((c) => c.href === "/admin/policies")).toBe(false);
    expect(superVisible.some((c) => c.href === "/admin/policies")).toBe(true);
  });

  it("treats null role like non-super_admin for superAdminOnly cards", () => {
    const visible = filterAdminHomeCardsForRole(ADMIN_HOME_CARDS, null);
    expect(visible.some((c) => c.href === "/admin/policies")).toBe(false);
  });
});
