/**
 * 51-T3：`useCommunityFeed` 再导出的 `mapApiPostToCommunityPost` 单测
 */
import { describe, expect, it } from "vitest";
import { mapApiPostToCommunityPost } from "./useCommunityFeed";

describe("mapApiPostToCommunityPost", () => {
  it("maps minimal API post to CommunityPost", () => {
    const api = {
      id: "post-1",
      user_id: "user-uuid-1234",
      body: "Hello world",
      post_type: "photo",
      tags: [],
      media_urls: ["https://example.com/1.jpg"],
      created_at: "2025-03-04T12:00:00Z",
    };
    const out = mapApiPostToCommunityPost(api);
    expect(out.id).toBe("post-1");
    expect(out.content).toBe("Hello world");
    expect(out.type).toBe("photo");
    expect(out.media_url).toBe("https://example.com/1.jpg");
    expect(out.media_urls).toBeUndefined();
    expect(out.is_video).toBe(false);
    expect(out.author.id).toBe("user-uuid-1234");
    expect(out.author.nickname).toBe("user-uui");
    expect(out.author.avatar_url).toBeNull();
    expect(out.author.role).toBe("tourist");
    expect(out.likes).toBe(0);
    expect(out.created_at).toBe(api.created_at);
  });

  it("uses author_nickname and author_avatar_url on post when present", () => {
    const out = mapApiPostToCommunityPost({
      id: "p1",
      user_id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
      body: "x",
      post_type: "photo",
      tags: [],
      media_urls: ["https://x.com/1.jpg"],
      created_at: "2025-03-04T12:00:00Z",
      author_nickname: "Guide A",
      author_avatar_url: "https://x.com/a.png",
    });
    expect(out.author.nickname).toBe("Guide A");
    expect(out.author.avatar_url).toBe("https://x.com/a.png");
  });

  it("uses author_role when present", () => {
    const guide = mapApiPostToCommunityPost({
      id: "p-role",
      user_id: "u1",
      body: "x",
      post_type: "photo",
      tags: [],
      media_urls: [],
      created_at: "2025-03-04T12:00:00Z",
      author_role: "guide",
    });
    expect(guide.author.role).toBe("guide");
    const arb = mapApiPostToCommunityPost({
      id: "p-role2",
      user_id: "u1",
      body: "x",
      post_type: "photo",
      tags: [],
      media_urls: [],
      created_at: "2025-03-04T12:00:00Z",
      author_role: "arbitrator",
    });
    expect(arb.author.role).toBe("arbitrator");
  });

  it("sets author.isEscrowGuide when author_is_escrow_guide is true", () => {
    const out = mapApiPostToCommunityPost({
      id: "p-esc",
      user_id: "u1",
      body: "x",
      post_type: "photo",
      tags: [],
      media_urls: [],
      created_at: "2025-03-04T12:00:00Z",
      author_is_escrow_guide: true,
    });
    expect(out.author.isEscrowGuide).toBe(true);
  });

  it("maps text post_type with empty media", () => {
    const out = mapApiPostToCommunityPost({
      id: "p-txt",
      user_id: "u1",
      body: "仅文字",
      post_type: "text",
      tags: [],
      media_urls: [],
      created_at: "2025-03-04T12:00:00Z",
    });
    expect(out.type).toBe("text");
    expect(out.media_url).toBe("");
    expect(out.is_video).toBe(false);
  });

  it("maps multi media_urls to media_url and media_urls", () => {
    const api = {
      id: "p2",
      user_id: "u2",
      body: "Multi",
      post_type: "photo",
      tags: ["tag1"],
      media_urls: ["https://a/1.jpg", "https://a/2.jpg"],
      created_at: "2025-03-04T12:00:00Z",
    };
    const out = mapApiPostToCommunityPost(api);
    expect(out.media_url).toBe("https://a/1.jpg");
    expect(out.media_urls).toEqual(["https://a/1.jpg", "https://a/2.jpg"]);
  });

  it("sets is_video true when post_type is video", () => {
    const api = {
      id: "v1",
      user_id: "u1",
      body: "Video",
      post_type: "video",
      tags: [],
      media_urls: ["https://example.com/v.mp4"],
      created_at: "2025-03-04T12:00:00Z",
    };
    const out = mapApiPostToCommunityPost(api);
    expect(out.type).toBe("video");
    expect(out.is_video).toBe(true);
  });

  it("uses like_count when provided", () => {
    const api = {
      id: "p3",
      user_id: "u3",
      body: "Liked",
      post_type: "photo",
      tags: [],
      media_urls: ["https://x/1.jpg"],
      created_at: "2025-03-04T12:00:00Z",
      like_count: 42,
    };
    const out = mapApiPostToCommunityPost(api);
    expect(out.likes).toBe(42);
  });

  it("maps collected_by_me to collectedByMe when boolean", () => {
    const yes = mapApiPostToCommunityPost({
      id: "pcol",
      user_id: "u1",
      body: "x",
      post_type: "photo",
      tags: [],
      media_urls: [],
      created_at: "2025-03-04T12:00:00Z",
      collected_by_me: true,
    });
    expect(yes.collectedByMe).toBe(true);
    const no = mapApiPostToCommunityPost({
      id: "pcol2",
      user_id: "u1",
      body: "x",
      post_type: "photo",
      tags: [],
      media_urls: [],
      created_at: "2025-03-04T12:00:00Z",
      collected_by_me: false,
    });
    expect(no.collectedByMe).toBe(false);
  });

  it("maps liked_by_me to likedByMe when boolean", () => {
    const on = mapApiPostToCommunityPost({
      id: "pl",
      user_id: "u1",
      body: "x",
      post_type: "photo",
      tags: [],
      media_urls: [],
      created_at: "2025-03-04T12:00:00Z",
      liked_by_me: true,
    });
    expect(on.likedByMe).toBe(true);
    const off = mapApiPostToCommunityPost({
      id: "pl2",
      user_id: "u1",
      body: "x",
      post_type: "photo",
      tags: [],
      media_urls: [],
      created_at: "2025-03-04T12:00:00Z",
      liked_by_me: false,
    });
    expect(off.likedByMe).toBe(false);
  });

  it("uses collect_count when provided", () => {
    const out = mapApiPostToCommunityPost({
      id: "pc",
      user_id: "u1",
      body: "c",
      post_type: "photo",
      tags: [],
      media_urls: [],
      created_at: "2025-03-04T12:00:00Z",
      collect_count: 9,
    });
    expect(out.collects).toBe(9);
  });

  it("uses comment_count when provided", () => {
    const api = {
      id: "p5",
      user_id: "u5",
      body: "Discussed",
      post_type: "photo",
      tags: [],
      media_urls: [],
      created_at: "2025-03-04T12:00:00Z",
      comment_count: 7,
    };
    const out = mapApiPostToCommunityPost(api);
    expect(out.comments).toBe(7);
  });

  it("handles empty media_urls", () => {
    const api = {
      id: "p4",
      user_id: "u4",
      body: "No media",
      post_type: "photo",
      tags: [],
      media_urls: [],
      created_at: "2025-03-04T12:00:00Z",
    };
    const out = mapApiPostToCommunityPost(api);
    expect(out.media_url).toBe("");
    expect(out.media_urls).toBeUndefined();
  });
});
