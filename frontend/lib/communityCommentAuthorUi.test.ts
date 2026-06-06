import { describe, expect, it } from "vitest";
import {
  communityCommentAuthorDisplayName,
  communityCommentAuthorInitial,
} from "@/lib/communityCommentAuthorUi";

describe("communityCommentAuthorUi", () => {
  const dash = "—";
  const guestLabel = "访客";

  it("uses nickname when present", () => {
    expect(
      communityCommentAuthorDisplayName(
        { id: "u1", nickname: "Alice", avatar_url: null, role: "traveler" },
        { dash, guestLabel },
      ),
    ).toBe("Alice");
  });

  it("falls back to guest label for em-dash nickname", () => {
    expect(
      communityCommentAuthorDisplayName(
        { id: "unknown", nickname: dash, avatar_url: null, role: "traveler" },
        { dash, guestLabel },
      ),
    ).toBe(guestLabel);
  });

  it("uses initial from display name", () => {
    expect(
      communityCommentAuthorInitial(
        { id: "local-guest", nickname: guestLabel, avatar_url: null, role: "traveler" },
        { dash, guestLabel },
      ),
    ).toBe("访");
  });
});
