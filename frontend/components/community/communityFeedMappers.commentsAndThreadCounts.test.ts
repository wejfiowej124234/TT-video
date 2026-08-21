import { describe, expect, it } from "vitest";
import type { CommunityComment } from "@/lib/communityMockData";
import { COMMUNITY_COMMENT_OPTIMISTIC_ID_PREFIX } from "./communityFeedConstants";
import {
  communityCommentModerationPlaceholderI18nKey,
  communityCommentUseModerationPlaceholder,
  communityDrawerCommentCountFromPost,
  communityFeedListCardCommentCountHonest,
  communityFeedCardCommentDisplayCountHonest,
  communityDrawerCommentCountHonestWithApiCache,
  communityVideoOverlayCommentDisplayCount,
  communityFeedCardCommentDisplayCount,
  communityFeedListCardCommentCount,
  mapApiCommentToCommunityComment,
  mapApiPostToCommunityPost,
  withPostServerCommentCountBumped,
  type ApiCommentInput,
} from "./communityFeedMappers";
import { COMMUNITY_MAPPERS_TEST_API_POST_BASE } from "./communityFeedMappers.vitestShared";

const base = COMMUNITY_MAPPERS_TEST_API_POST_BASE;

describe("mapApiCommentToCommunityComment / communityCommentUseModerationPlaceholder", () => {
  const commentBase: ApiCommentInput = {
    id: "00000000-0000-4000-8000-000000000099",
    post_id: "p1",
    user_id: "00000000-0000-4000-8000-000000000002",
    body: "hi",
    created_at: "2026-04-20T12:00:00Z",
  };

  it("maps visibility_status and resolves relative avatar paths", () => {
    const c = mapApiCommentToCommunityComment({
      ...commentBase,
      body: "",
      visibility_status: "hidden",
      author_avatar_url: "/api/v1/uploads/community-posts/abc.jpg",
    });
    expect(c.visibilityStatus).toBe("hidden");
    expect(c.content).toBe("");
    expect(c.author.avatar_url).toContain("/api/v1/uploads/community-posts/abc.jpg");
    expect(communityCommentUseModerationPlaceholder(c)).toBe(true);
    expect(communityCommentModerationPlaceholderI18nKey(c)).toBe("community_comment_status_hidden");
  });

  it("remaps OCS legacy author avatar on comments to Tigris (no legacy upload path)", () => {
    const c = mapApiCommentToCommunityComment({
      ...commentBase,
      author_avatar_url: "/api/v1/uploads/community-posts/ocs-tokyo-photo-official-guide-cover.jpg",
    });
    expect(c.author.avatar_url).toContain("official-cold-start/v1/ocs-tokyo-photo-official-guide-cover.jpg");
    expect(c.author.avatar_url).not.toContain("/api/v1/uploads/community-posts/ocs-");
  });

  it("maps removed visibility to removed i18n key", () => {
    const c = mapApiCommentToCommunityComment({
      ...commentBase,
      body: "",
      visibility_status: "removed",
    });
    expect(communityCommentModerationPlaceholderI18nKey(c)).toBe("community_comment_status_removed");
  });

  it("uses body_is_redacted with empty body for placeholder", () => {
    const c = mapApiCommentToCommunityComment({
      ...commentBase,
      body: "   ",
      body_is_redacted: true,
    });
    expect(communityCommentUseModerationPlaceholder(c)).toBe(true);
    expect(communityCommentModerationPlaceholderI18nKey(c)).toBe("community_comment_moderated_placeholder");
  });

  it("does not use placeholder when body has text", () => {
    const c = mapApiCommentToCommunityComment({ ...commentBase, body: "visible" });
    expect(communityCommentUseModerationPlaceholder(c)).toBe(false);
  });
});

describe("withPostServerCommentCountBumped", () => {
  it("increments comments by 1", () => {
    const post = mapApiPostToCommunityPost({ ...base, comment_count: 4 });
    expect(withPostServerCommentCountBumped(post).comments).toBe(5);
  });
});

describe("communityFeedListCardCommentCount", () => {
  it("matches post.comments + comment-local- optimistic when no API cache", () => {
    const post = mapApiPostToCommunityPost({ ...base, comment_count: 4 });
    const local: CommunityComment[] = [
      {
        id: `${COMMUNITY_COMMENT_OPTIMISTIC_ID_PREFIX}1-abc`,
        post_id: post.id,
        author: { id: "u", nickname: "n", avatar_url: null, role: "tourist" },
        content: "x",
        created_at: "2026-04-20T12:00:00Z",
      },
    ];
    expect(communityFeedListCardCommentCount(post, undefined, local)).toBe(5);
  });

  it("does not add server-id locals (post success already merged into post.comments / cache)", () => {
    const post = mapApiPostToCommunityPost({ ...base, comment_count: 11 });
    const local: CommunityComment[] = [
      {
        id: "00000000-0000-4000-8000-000000000099",
        post_id: post.id,
        author: { id: "u", nickname: "n", avatar_url: null, role: "tourist" },
        content: "x",
        created_at: "2026-04-20T12:00:00Z",
      },
    ];
    expect(communityFeedListCardCommentCount(post, undefined, local)).toBe(11);
  });

  it("uses cached thread when larger than snapshot + optimistic", () => {
    const post = mapApiPostToCommunityPost({ ...base, comment_count: 3 });
    const cached: CommunityComment[] = Array.from({ length: 10 }, (_, i) => ({
      id: `c${i}`,
      post_id: post.id,
      author: { id: "u", nickname: "n", avatar_url: null, role: "tourist" },
      content: "x",
      created_at: "2026-04-20T12:00:00Z",
    }));
    expect(communityFeedListCardCommentCount(post, cached, [])).toBe(10);
  });
});

describe("communityFeedCardCommentDisplayCount", () => {
  it("uses post.comments when no cached thread", () => {
    const post = mapApiPostToCommunityPost({ ...base, comment_count: 7 });
    expect(communityFeedCardCommentDisplayCount(post, undefined)).toBe(7);
    expect(communityFeedCardCommentDisplayCount(post, [])).toBe(7);
  });

  it("uses max when cache has more rows than snapshot (e.g. new comment before list refetch)", () => {
    const post = mapApiPostToCommunityPost({ ...base, comment_count: 1 });
    const loaded: CommunityComment[] = [
      {
        id: "c1",
        post_id: post.id,
        author: { id: "u", nickname: "n", avatar_url: null, role: "tourist" },
        content: "a",
        created_at: "2026-04-20T12:00:00Z",
      },
      {
        id: "c2",
        post_id: post.id,
        author: { id: "u", nickname: "n", avatar_url: null, role: "tourist" },
        content: "b",
        created_at: "2026-04-20T12:01:00Z",
      },
    ];
    expect(communityFeedCardCommentDisplayCount(post, loaded)).toBe(2);
  });
});

describe("communityVideoOverlayCommentDisplayCount", () => {
  const row = (id: string): CommunityComment => ({
    id,
    post_id: "p1",
    author: { id: "u1", nickname: "n", avatar_url: null, role: "tourist" },
    content: "c",
    created_at: "2026-04-20T12:00:00Z",
  });

  it("shows 0 when API fetched empty (showcase mock count ignored)", () => {
    const post = mapApiPostToCommunityPost({ ...base, comment_count: 22 });
    expect(
      communityVideoOverlayCommentDisplayCount(post, [], { apiFetched: true, commentsLoadError: null }),
    ).toBe(0);
  });

  it("uses server total before API fetch completes", () => {
    const post = mapApiPostToCommunityPost({ ...base, comment_count: 22 });
    expect(
      communityVideoOverlayCommentDisplayCount(post, [], { apiFetched: false, commentsLoadError: null }),
    ).toBe(22);
  });

  it("uses loaded length after fetch when comments exist", () => {
    const post = mapApiPostToCommunityPost({ ...base, comment_count: 100 });
    expect(
      communityVideoOverlayCommentDisplayCount(post, [row("a")], { apiFetched: true, commentsLoadError: null }),
    ).toBe(100);
  });
});

describe("communityDrawerCommentCountFromPost", () => {
  const row = (id: string): CommunityComment => ({
    id,
    post_id: "p1",
    author: { id: "u1", nickname: "n", avatar_url: null, role: "tourist" },
    content: "c",
    created_at: "2026-04-20T12:00:00Z",
  });

  it("uses server total when paginated list is shorter", () => {
    const post = mapApiPostToCommunityPost({ ...base, comment_count: 100 });
    expect(communityDrawerCommentCountFromPost(post, [row("a")])).toBe(100);
  });

  it("uses loaded length when optimistic rows exceed snapshot count", () => {
    const post = mapApiPostToCommunityPost({ ...base, comment_count: 2 });
    expect(communityDrawerCommentCountFromPost(post, [row("a"), row("b"), row("c")])).toBe(3);
  });
});

describe("communityFeedListCardCommentCountHonest", () => {
  it("returns 0 for showcase post before API", () => {
    const post = mapApiPostToCommunityPost({ ...base, id: "tt-showcase-post-010", comment_count: 22 });
    expect(communityFeedListCardCommentCountHonest(post, {}, undefined)).toBe(0);
  });
});

describe("communityFeedCardCommentDisplayCountHonest", () => {
  it("returns 0 when API cache key exists with empty thread", () => {
    const post = mapApiPostToCommunityPost({ ...base, id: "p1", comment_count: 22 });
    expect(communityFeedCardCommentDisplayCountHonest(post, { p1: [] })).toBe(0);
  });
});

describe("communityDrawerCommentCountHonestWithApiCache", () => {
  it("returns 0 when API cache is empty for post key", () => {
    const post = mapApiPostToCommunityPost({ ...base, id: "p1", comment_count: 22 });
    expect(communityDrawerCommentCountHonestWithApiCache(post, [], { p1: [] }, null)).toBe(0);
  });

  it("returns showcase honest 0 without API key", () => {
    const post = mapApiPostToCommunityPost({ ...base, id: "tt-showcase-post-010", comment_count: 22 });
    expect(communityDrawerCommentCountHonestWithApiCache(post, [], {}, null)).toBe(0);
  });

  it("showcase drawer count follows loaded thread not mock post.comments", () => {
    const post = mapApiPostToCommunityPost({ ...base, id: "tt-showcase-post-007", comment_count: 7 });
    const loaded = [
      {
        id: "comment-local-1",
        post_id: post.id,
        author: { id: "u1", nickname: "TTG", avatar_url: null, role: "traveler" as const },
        content: "1321",
        created_at: new Date().toISOString(),
      },
    ];
    expect(communityDrawerCommentCountHonestWithApiCache(post, loaded, {}, null)).toBe(1);
  });
});
