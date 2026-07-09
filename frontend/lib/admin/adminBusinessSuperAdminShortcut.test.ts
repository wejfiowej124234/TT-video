import { describe, expect, it } from "vitest";

import {
  ADMIN_BUSINESS_SUPERADMIN_SHORTCUT_EMAILS,
  isAdminBusinessSuperAdminShortcut,
  meEmailFromGetMe,
} from "./adminBusinessSuperAdminShortcut";

describe("adminBusinessSuperAdminShortcut", () => {
  it("detects C2 tourist@test.com super_admin shortcut", () => {
    const me = { user: { email: "tourist@test.com", role: "super_admin" } };
    expect(isAdminBusinessSuperAdminShortcut(me)).toBe(true);
    expect(meEmailFromGetMe(me)).toBe("tourist@test.com");
  });

  it("does not flag ADM-U01 style super_admin emails", () => {
    const me = { user: { email: "adm-u01-super@traveltrust.staging", role: "super_admin" } };
    expect(isAdminBusinessSuperAdminShortcut(me)).toBe(false);
  });

  it("does not flag business tourist without super_admin", () => {
    const me = { user: { email: "tourist@test.com", role: "tourist" } };
    expect(isAdminBusinessSuperAdminShortcut(me)).toBe(false);
  });

  it("keeps C2 email in immutable shortcut set", () => {
    expect(ADMIN_BUSINESS_SUPERADMIN_SHORTCUT_EMAILS.has("tourist@test.com")).toBe(true);
  });
});
