import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  POST_AUTH_DEFAULT_RETURN_PATH,
  resolvePostAuthReturnPath,
} from "@/lib/auth/postAuthReturnPath";
import { ME_SETTINGS_PROFILE_PATH } from "@/lib/me/meSettingsL5";

const LOGIN_PAGE = join(process.cwd(), "app/auth/login/page.tsx");

/**
 * ① 烟测：无 returnUrl → 官网地球仪首页；裸 `/community/me` → 资料页。
 */
describe("login post-auth default return (smoke · ①)", () => {
  it("login page wires resolvePostAuthReturnPath for post-submit redirect", () => {
    const page = readFileSync(LOGIN_PAGE, "utf8");
    expect(page).toContain("resolvePostAuthReturnPath");
    expect(page).toContain("router.replace(returnUrl)");
  });

  it("missing or blank returnUrl → official globe home /", () => {
    expect(POST_AUTH_DEFAULT_RETURN_PATH).toBe("/");
    expect(resolvePostAuthReturnPath(null)).toBe("/");
    expect(resolvePostAuthReturnPath(undefined)).toBe("/");
    expect(resolvePostAuthReturnPath("")).toBe("/");
    expect(resolvePostAuthReturnPath("   ")).toBe("/");
  });

  it("bare /community/me → settings profile; tab deep links canonicalize to dedicated paths", () => {
    expect(resolvePostAuthReturnPath("/community/me")).toBe(ME_SETTINGS_PROFILE_PATH);
    expect(resolvePostAuthReturnPath("/community/me?tab=posts")).toBe("/community/me/posts");
    expect(resolvePostAuthReturnPath("/me/onboarding?role=region_steward&from=steward_pending")).toBe(
      "/me/onboarding?role=region_steward&from=steward_pending",
    );
  });
});
