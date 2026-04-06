import { describe, expect, it } from "vitest";

import { adminAuditListPathForAction } from "./adminAuditNav";

describe("adminAuditListPathForAction", () => {
  it("builds path with encoded action and clamped limit", () => {
    expect(adminAuditListPathForAction("admin.users.read", 50)).toBe(
      "/admin/audit?limit=50&action=admin.users.read",
    );
  });

  it("clamps limit to 1..200", () => {
    expect(adminAuditListPathForAction("a.b", 0)).toBe("/admin/audit?limit=1&action=a.b");
    expect(adminAuditListPathForAction("a.b", 999)).toBe("/admin/audit?limit=200&action=a.b");
  });
});
