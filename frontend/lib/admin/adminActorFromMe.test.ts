import { describe, expect, it } from "vitest";
import {
  adminActorLabelKey,
  adminActorRoleFromMe,
  isAdminActorRole,
  isSuperAdminActorRole,
} from "./adminActorFromMe";

describe("adminActorFromMe", () => {
  it("recognizes admin actor roles", () => {
    expect(isAdminActorRole("admin")).toBe(true);
    expect(isAdminActorRole("super_admin")).toBe(true);
    expect(isAdminActorRole("traveler")).toBe(false);
    expect(isAdminActorRole(null)).toBe(false);
  });

  it("parses role from GET /me envelope", () => {
    expect(adminActorRoleFromMe({ user: { role: "admin" } })).toBe("admin");
    expect(adminActorRoleFromMe({ user: { role: "super_admin" } })).toBe("super_admin");
  });

  it("maps label keys", () => {
    expect(isSuperAdminActorRole("super_admin")).toBe(true);
    expect(adminActorLabelKey("admin")).toBe("admin_shell_role_admin");
    expect(adminActorLabelKey("super_admin")).toBe("admin_shell_role_super_admin");
    expect(adminActorLabelKey("traveler")).toBeNull();
  });
});
