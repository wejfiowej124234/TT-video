import { describe, expect, it } from "vitest";
import {
  communityMeDedicatedHrefFromHubQuery,
  communityMeDedicatedPathForTab,
  communityMeContentSegmentClass,
  communityMeLoginReturnUrl,
  communityMeLikesPathActive,
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

  it("treats dedicated /community/me/posts as posts segment active", () => {
    expect(communityMePostsPathActive("/community/me/posts", null)).toBe(true);
    expect(communityMePostsPathActive("/community/me", new URLSearchParams("tab=likes"))).toBe(false);
  });

  it("treats dedicated /community/me/likes as likes segment active", () => {
    expect(communityMeLikesPathActive("/community/me/likes", null)).toBe(true);
    expect(communityMeLikesPathActive("/community/me", new URLSearchParams("tab=posts"))).toBe(false);
  });
});

describe("communityMeContentSegmentClass (ME-P1-3 · warm active token)", () => {
  it("active segment uses ref-sun warm tokens (no cyan-200 drift)", () => {
    const active = communityMeContentSegmentClass(true);
    const inactive = communityMeContentSegmentClass(false);
    expect(active).toContain("text-ref-sun");
    expect(active).toContain("bg-ref-sun/14");
    expect(active).not.toMatch(/cyan-/);
    expect(inactive).not.toMatch(/cyan-/);
    expect(inactive).toContain("text-slate-400");
  });
});

describe("communityMeDedicatedPathForTab", () => {
  it("maps hub tabs to dedicated paths for logged-in users", () => {
    expect(communityMeDedicatedPathForTab("posts", true)).toBe("/community/me/posts");
    expect(communityMeDedicatedPathForTab("orders", true)).toBe("/orders");
    expect(communityMeDedicatedPathForTab("likes", false)).toBeNull();
    expect(communityMeDedicatedPathForTab("likes", true)).toBe("/community/me/likes");
  });

  it("merges hub query without tab when building dedicated href", () => {
    expect(
      communityMeDedicatedHrefFromHubQuery(
        "/community/me/posts",
        new URLSearchParams("tab=posts&utm=x&vis=public"),
      ),
    ).toBe("/community/me/posts?utm=x&vis=public");
  });
});

describe("communityMeLoginReturnUrl", () => {
  it("canonicalizes /community/me?tab= to dedicated paths", () => {
    expect(communityMeLoginReturnUrl("/community/me", new URLSearchParams("tab=posts"), "likes")).toBe(
      "/community/me/posts",
    );
    expect(communityMeLoginReturnUrl("/community/me", new URLSearchParams("tab=orders&utm=x"), "likes")).toBe(
      "/orders?utm=x",
    );
  });

  it("preserves full query on /community/me without tab", () => {
    const sp = new URLSearchParams("utm=x");
    expect(communityMeLoginReturnUrl("/community/me", sp, "likes")).toBe("/community/me?utm=x");
  });

  it("uses dedicated fallback when /community/me has no query", () => {
    expect(communityMeLoginReturnUrl("/community/me", new URLSearchParams(""), "orders")).toBe("/orders");
    expect(communityMeLoginReturnUrl("/community/me", null, "posts")).toBe("/community/me/posts");
    expect(communityMeLoginReturnUrl("/community/me", null, "likes")).toBe("/community/me/likes");
  });

  it("maps /community/me/posts to dedicated page for login return", () => {
    expect(communityMeLoginReturnUrl("/community/me/posts", new URLSearchParams("f=all"), "posts")).toBe(
      "/community/me/posts?f=all",
    );
    expect(communityMeLoginReturnUrl("/community/me/posts", new URLSearchParams(""), "posts")).toBe("/community/me/posts");
  });

  it("maps /community/me/collects to dedicated page for login return", () => {
    expect(communityMeLoginReturnUrl("/community/me/collects", new URLSearchParams("src=email"), "collects")).toBe(
      "/community/me/collects?src=email",
    );
  });

  it("maps /community/me/likes to dedicated page for login return", () => {
    expect(communityMeLoginReturnUrl("/community/me/likes", new URLSearchParams(""), "likes")).toBe("/community/me/likes");
    expect(communityMeLoginReturnUrl("/community/me/likes", new URLSearchParams("src=email"), "likes")).toBe(
      "/community/me/likes?src=email",
    );
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
    expect(communityMeLoginReturnUrl("/community/explore", new URLSearchParams(), "likes")).toBe("/community/me/likes");
  });
});
