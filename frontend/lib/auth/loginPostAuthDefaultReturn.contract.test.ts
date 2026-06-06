import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import {
  COMMUNITY_FEED_PATH,
  POST_AUTH_DEFAULT_RETURN_PATH,
  resolvePostAuthReturnPath,
} from "@/lib/auth/postAuthReturnPath";
import { ME_SETTINGS_PROFILE_PATH } from "@/lib/me/meSettingsL5";

const LOGIN_PAGE = join(process.cwd(), "app/auth/login/page.tsx");

/**
 * ① 烟测：无 returnUrl → 社区动态；裸 `/community/me` → 动态（小红书式）。
 */
describe("login post-auth default return (smoke · ①)", () => {
  it("login page wires resolvePostAuthReturnPath for post-submit redirect", () => {
    const page = readFileSync(LOGIN_PAGE, "utf8");
    expect(page).toContain("resolvePostAuthReturnPath");
    expect(page).toContain("router.replace(returnUrl)");
  });

  it("missing or blank returnUrl → /community feed only", () => {
    expect(POST_AUTH_DEFAULT_RETURN_PATH).toBe(COMMUNITY_FEED_PATH);
    expect(resolvePostAuthReturnPath(null)).toBe("/community");
    expect(resolvePostAuthReturnPath(undefined)).toBe("/community");
    expect(resolvePostAuthReturnPath("")).toBe("/community");
    expect(resolvePostAuthReturnPath("   ")).toBe("/community");
  });

  it("bare /community/me → settings profile; tab deep links canonicalize to dedicated paths", () => {
    expect(resolvePostAuthReturnPath("/community/me")).toBe(ME_SETTINGS_PROFILE_PATH);
    expect(resolvePostAuthReturnPath("/community/me?tab=posts")).toBe("/community/me/posts");
    expect(resolvePostAuthReturnPath("/me/onboarding?role=region_steward&from=steward_pending")).toBe(
      "/me/onboarding?role=region_steward&from=steward_pending",
    );
  });
});
