import { describe, expect, it } from "vitest";
import type { CommunityPost } from "@/lib/communityPostTypes";
import {
  inferCommunityMePostsShowcaseKind,
  isCommunityMePostsShowcaseKindFromApi,
  formatPostsShowcaseCardTitle,
  pickPostsShowcaseCoverUrl,
} from "./communityMePostsShowcaseModel";

const author = { id: "a", nickname: "n", avatar_url: null, role: "tourist" };

describe("isCommunityMePostsShowcaseKindFromApi", () => {
  it("is true only for known commerce_showcase_kind values", () => {
    const apiPost = {
      id: "x",
      type: "text",
      content: "",
      media_url: "",
      tags: [],
      author,
      likes: 0,
      comments: 0,
      collects: 0,
      created_at: "",
      commerceShowcaseKind: "lodging_led",
    } as CommunityPost;
    expect(isCommunityMePostsShowcaseKindFromApi(apiPost)).toBe(true);
    const inferredOnly = { ...apiPost, commerceShowcaseKind: undefined } as CommunityPost;
    expect(isCommunityMePostsShowcaseKindFromApi(inferredOnly)).toBe(false);
  });
});

describe("inferCommunityMePostsShowcaseKind", () => {
  it("prefers server commerceShowcaseKind over body heuristics", () => {
    const post = {
      id: "0",
      type: "text",
      content: "收购日本零食",
      media_url: "",
      tags: [],
      author,
      likes: 0,
      comments: 0,
      collects: 0,
      created_at: "",
      commerceShowcaseKind: "itinerary_led",
    } as CommunityPost;
    expect(inferCommunityMePostsShowcaseKind(post)).toBe("itinerary_led");
  });

  it("detects lodging hints", () => {
    const post = {
      id: "1",
      type: "photo",
      content: "",
      media_url: "",
      tags: ["酒店套餐"],
      author,
      likes: 0,
      comments: 0,
      collects: 0,
      created_at: "",
    } as CommunityPost;
    expect(inferCommunityMePostsShowcaseKind(post)).toBe("lodging_led");
  });

  it("detects acquisition hints", () => {
    const post = {
      id: "2",
      type: "text",
      content: "收购日本零食",
      media_url: "",
      tags: [],
      author,
      likes: 0,
      comments: 0,
      collects: 0,
      created_at: "",
    } as CommunityPost;
    expect(inferCommunityMePostsShowcaseKind(post)).toBe("acquisition_led");
  });

  it("uses travel type", () => {
    const post = {
      id: "3",
      type: "travel",
      content: "x",
      media_url: "",
      tags: [],
      author,
      likes: 0,
      comments: 0,
      collects: 0,
      created_at: "",
    } as CommunityPost;
    expect(inferCommunityMePostsShowcaseKind(post)).toBe("itinerary_led");
  });
});

describe("formatPostsShowcaseCardTitle", () => {
  it("prefers destination", () => {
    const post = { destination: " 巴黎 " } as CommunityPost;
    expect(formatPostsShowcaseCardTitle(post, "U")).toBe("巴黎");
  });
});

describe("pickPostsShowcaseCoverUrl", () => {
  it("reads media_urls first", () => {
    const post = { media_urls: [" https://x/a.png "] } as CommunityPost;
    expect(pickPostsShowcaseCoverUrl(post)).toBe("https://x/a.png");
  });
});
