import { describe, expect, it } from "vitest";
import {
  communityUserPostsEmptyI18nKey,
  communityUserProfileDisplayName,
  communityUserSelfProfileAuthor,
  mergeCommunitySelfProfileAuthor,
} from "./communityUserSelfProfileAuthor";

const ID = "e17bf320-d74d-40ac-a4ea-fcd4a1fccd80";

describe("communityUserSelfProfileAuthor", () => {
  it("uses GET /me nickname/role/wallet when viewing self, even with zero posts", () => {
    const author = communityUserSelfProfileAuthor(
      {
        id: ID,
        nickname: "TTG",
        role: "admin",
        avatar_url: null,
        default_wallet_address: "0x104FabcdefD212",
      },
      ID,
    );
    expect(author?.nickname).toBe("TTG");
    expect(author?.role).toBe("admin");
    expect(author?.wallet).toMatch(/^0x104F…D212$/i);
    expect(communityUserProfileDisplayName(author, ID)).toBe("TTG");
  });

  it("does not invent a profile for another user id", () => {
    expect(
      communityUserSelfProfileAuthor({ id: ID, nickname: "TTG", role: "admin" }, "00000000-0000-4000-8000-000000000000"),
    ).toBeUndefined();
  });

  it("falls back to uuid prefix only when there is no nickname", () => {
    expect(communityUserProfileDisplayName(undefined, ID)).toBe("e17bf320");
  });

  it("keeps GET /me identity when the current visibility filter has no posts", () => {
    const fromMe = communityUserSelfProfileAuthor(
      { id: ID, nickname: "TTG", role: "admin", default_wallet_address: "0x104FabcdefD212" },
      ID,
    );
    const merged = mergeCommunitySelfProfileAuthor(fromMe, undefined);
    expect(merged?.nickname).toBe("TTG");
    expect(merged?.role).toBe("admin");
    expect(communityUserProfileDisplayName(merged, ID)).toBe("TTG");
  });

  it("fills sparse GET /me chrome from this account's public post author", () => {
    const fromMe = communityUserSelfProfileAuthor({ id: ID, nickname: "", role: "tourist" }, ID);
    const merged = mergeCommunitySelfProfileAuthor(fromMe, {
      id: ID,
      nickname: "TTG",
      avatar_url: null,
      role: "admin",
      wallet: "0x104F…D212",
    });
    expect(merged?.nickname).toBe("TTG");
    expect(merged?.role).toBe("admin");
    expect(merged?.wallet).toBe("0x104F…D212");
  });

  it("uses filter-specific empty copy for self 仅自己/归档, not a new-account prompt", () => {
    expect(communityUserPostsEmptyI18nKey(true, "private")).toBe("community_me_posts_empty_private");
    expect(communityUserPostsEmptyI18nKey(true, "archived")).toBe("community_me_posts_empty_archived");
    expect(communityUserPostsEmptyI18nKey(false, "private")).toBe("community_empty");
  });
});
