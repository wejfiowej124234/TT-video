import { describe, expect, it } from "vitest";

import {
  adminAuditLogDetailFieldListHref,
  buildAdminAuditLogsPath,
  clampAdminAuditLimit,
} from "./adminAuditLogsPath";

describe("clampAdminAuditLimit", () => {
  it("defaults invalid to 50 and clamps to 1..200", () => {
    expect(clampAdminAuditLimit(NaN)).toBe(50);
    expect(clampAdminAuditLimit(0)).toBe(1);
    expect(clampAdminAuditLimit(999)).toBe(200);
  });
});

describe("buildAdminAuditLogsPath", () => {
  it("omits empty filters and keeps limit", () => {
    expect(
      buildAdminAuditLogsPath({ limit: 50, actor_id: "", action: "", resource_type: "" }),
    ).toBe("/admin/audit?limit=50");
  });

  it("includes trimmed filters when set", () => {
    expect(
      buildAdminAuditLogsPath({
        limit: 10,
        actor_id: "  uuid  ",
        action: " admin.x ",
        resource_type: " orders ",
      }),
    ).toBe("/admin/audit?limit=10&actor_id=uuid&action=admin.x&resource_type=orders");
  });
});

describe("adminAuditLogDetailFieldListHref", () => {
  it("returns null for empty or non-string", () => {
    expect(adminAuditLogDetailFieldListHref("action", "")).toBeNull();
    expect(adminAuditLogDetailFieldListHref("actor_id", "  ")).toBeNull();
    expect(adminAuditLogDetailFieldListHref("resource_type", null)).toBeNull();
  });

  it("builds isolated list URLs per field", () => {
    expect(adminAuditLogDetailFieldListHref("action", " admin.x ")).toBe(
      "/admin/audit?limit=50&action=admin.x",
    );
    expect(adminAuditLogDetailFieldListHref("actor_id", " uuid ")).toBe(
      "/admin/audit?limit=50&actor_id=uuid",
    );
    expect(adminAuditLogDetailFieldListHref("resource_type", " orders ")).toBe(
      "/admin/audit?limit=50&resource_type=orders",
    );
  });
});
