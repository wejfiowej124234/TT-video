import { describe, expect, it } from "vitest";
import { headerUserMenuNavItemIsActive } from "./headerUserMenuNavActive";

describe("headerUserMenuNavItemIsActive", () => {
  it("settings hub highlights on settings sub-routes", () => {
    expect(headerUserMenuNavItemIsActive("/me/settings", "/me/settings", null)).toBe(true);
    expect(headerUserMenuNavItemIsActive("/me/settings/profile", "/me/settings", null)).toBe(true);
  });

  it("profile nav item active only on settings profile page", () => {
    expect(headerUserMenuNavItemIsActive("/me/settings/profile", "/me/settings/profile", null)).toBe(true);
    expect(headerUserMenuNavItemIsActive("/community/me/posts", "/me/settings/profile", null)).toBe(false);
    expect(headerUserMenuNavItemIsActive("/community/me", "/me/settings/profile", null)).toBe(false);
  });

  it("legacy hub tab query no longer activates profile item", () => {
    const params = new URLSearchParams("tab=likes");
    expect(headerUserMenuNavItemIsActive("/community/me", "/me/settings/profile", params)).toBe(false);
  });
});
