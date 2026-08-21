import { describe, expect, it } from "vitest";

import {
  POST_AUTH_DEFAULT_RETURN_PATH,
  normalizeXiaohongshuCommunityReturn,
  resolvePostAuthReturnPath,
} from "@/lib/auth/postAuthReturnPath";
import { ME_SETTINGS_PROFILE_PATH } from "@/lib/me/meSettingsL5";

describe("postAuthReturnPath", () => {
  it("defaults to community feed when returnUrl is absent (小红书式)", () => {
    expect(POST_AUTH_DEFAULT_RETURN_PATH).toBe("/");
    expect(resolvePostAuthReturnPath(null)).toBe("/");
    expect(resolvePostAuthReturnPath("")).toBe("/");
  });

  it("normalizes bare community profile shell to settings profile", () => {
    expect(normalizeXiaohongshuCommunityReturn("/community/me")).toBe(ME_SETTINGS_PROFILE_PATH);
    expect(resolvePostAuthReturnPath("/community/me")).toBe(ME_SETTINGS_PROFILE_PATH);
  });

  it("preserves community profile deep links and subpaths", () => {
    expect(resolvePostAuthReturnPath("/community/me?tab=posts")).toBe("/community/me/posts");
    expect(resolvePostAuthReturnPath("/community/me?tab=community_posts")).toBe("/community/me/posts");
    expect(resolvePostAuthReturnPath("/community/me?tab=orders&utm=x")).toBe("/orders?utm=x");
    expect(resolvePostAuthReturnPath("/community/me/posts")).toBe("/community/me/posts");
    expect(resolvePostAuthReturnPath("/me/onboarding?role=region_steward&from=steward_pending")).toBe(
      "/me/onboarding?role=region_steward&from=steward_pending",
    );
    expect(resolvePostAuthReturnPath("/me/identities")).toBe("/me/identities");
  });
});
