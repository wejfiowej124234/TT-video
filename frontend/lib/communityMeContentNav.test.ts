import { describe, expect, it } from "vitest";
import {
  communityMeLoginReturnUrl,
  communityMePostsPathActive,
  parseCommunityMeTabQuery,
} from "./communityMeContentNav";

describe("parseCommunityMeTabQuery", () => {
  it("maps tab=community_posts to posts panel (IA alias)", () => {
    expect(parseCommunityMeTabQuery("/community/me", new URLSearchParams("tab=community_posts"))).toBe("posts");
    expect(communityMePostsPathActive("/community/me", new URLSearchParams("tab=community_posts"))).toBe(true);
  });

  it("still accepts tab=posts", () => {
    expect(parseCommunityMeTabQuery("/community/me", new URLSearchParams("tab=posts"))).toBe("posts");
  });
});

describe("communityMeLoginReturnUrl", () => {
  it("preserves full query on /community/me", () => {
    const sp = new URLSearchParams("tab=collects&utm=x");
    expect(communityMeLoginReturnUrl("/community/me", sp, "likes")).toBe("/community/me?tab=collects&utm=x");
  });

  it("uses tab fallback when /community/me has no query", () => {
    expect(communityMeLoginReturnUrl("/community/me", new URLSearchParams(""), "orders")).toBe("/community/me?tab=orders");
    expect(communityMeLoginReturnUrl("/community/me", null, "posts")).toBe("/community/me?tab=posts");
  });

  it("maps /community/me/posts to canonical hub with tab=posts", () => {
    expect(communityMeLoginReturnUrl("/community/me/posts", new URLSearchParams("f=all"), "posts")).toBe(
      "/community/me?f=all&tab=posts",
    );
    expect(communityMeLoginReturnUrl("/community/me/posts", new URLSearchParams(""), "posts")).toBe("/community/me?tab=posts");
  });

  it("maps /community/me/collects and /community/me/likes to canonical hub", () => {
    expect(communityMeLoginReturnUrl("/community/me/collects", new URLSearchParams("src=email"), "collects")).toBe(
      "/community/me?src=email&tab=collects",
    );
    expect(communityMeLoginReturnUrl("/community/me/likes", new URLSearchParams(""), "likes")).toBe("/community/me?tab=likes");
  });

  it("preserves /community/me/reports list and detail paths for login returnUrl", () => {
    expect(communityMeLoginReturnUrl("/community/me/reports", new URLSearchParams("src=email"), "posts")).toBe(
      "/community/me/reports?src=email",
    );
    expect(communityMeLoginReturnUrl("/community/me/reports", new URLSearchParams(""), "posts")).toBe("/community/me/reports");
    expect(
      communityMeLoginReturnUrl(
        "/community/me/reports/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
        new URLSearchParams("x=1"),
        "posts",
      ),
    ).toBe("/community/me/reports/aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee?x=1");
  });

  it("falls back for other pathnames", () => {
    expect(communityMeLoginReturnUrl("/community/explore", new URLSearchParams(), "likes")).toBe("/community/me?tab=likes");
  });
});
