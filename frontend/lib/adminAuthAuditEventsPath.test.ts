import { describe, it, expect } from "vitest";
import { buildAdminAuthAuditEventsPath, parseAdminAuthAuditListQuery } from "./adminAuthAuditEventsPath";

describe("adminAuthAuditEventsPath", () => {
  it("parseAdminAuthAuditListQuery clamps limit and trims filters", () => {
    const q = parseAdminAuthAuditListQuery(
      new URLSearchParams("limit=999&event_type= auth_login_failure &reason=x&user_id=u1"),
    );
    expect(q.limit).toBe(200);
    expect(q.event_type).toBe("auth_login_failure");
    expect(q.reason).toBe("x");
    expect(q.user_id).toBe("u1");
  });

  it("buildAdminAuthAuditEventsPath round-trips query keys", () => {
    const path = buildAdminAuthAuditEventsPath({
      limit: 20,
      event_type: "auth_login_failure",
      reason: "invalid_credentials",
      user_id: "",
    });
    expect(path).toContain("limit=20");
    expect(path).toContain("event_type=auth_login_failure");
    expect(path).toContain("reason=invalid_credentials");
    expect(path).not.toContain("user_id=");
  });
});
