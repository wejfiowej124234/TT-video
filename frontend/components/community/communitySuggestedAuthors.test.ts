import { describe, it, expect } from "vitest";
import type { CommunityPost } from "@/lib/communityMockData";
import { suggestedAuthorsFromPosts } from "./communitySuggestedAuthors";

function post(author: CommunityPost["author"]): CommunityPost {
  return {
    id: "p1",
    type: "photo",
    content: "",
    media_url: "",
    tags: [],
    author,
    likes: 0,
    comments: 0,
    collects: 0,
    created_at: "",
  };
}

describe("suggestedAuthorsFromPosts", () => {
  it("dedupes, skips me and following", () => {
    const posts: CommunityPost[] = [
      post({ id: "a", nickname: "A", avatar_url: null, role: "guide" }),
      post({ id: "a", nickname: "A", avatar_url: null, role: "guide" }),
      post({ id: "me", nickname: "Me", avatar_url: null, role: "tourist" }),
      post({ id: "f", nickname: "F", avatar_url: null, role: "tourist" }),
      post({ id: "b", nickname: "B", avatar_url: null, role: "tourist", isEscrowGuide: true }),
    ];
    const out = suggestedAuthorsFromPosts(posts, {
      meUserId: "me",
      followingAuthorIds: new Set(["f"]),
      max: 10,
    });
    expect(out.map((x) => x.id)).toEqual(["a", "b"]);
    expect(out.find((x) => x.id === "b")?.isEscrowGuide).toBe(true);
  });
});
