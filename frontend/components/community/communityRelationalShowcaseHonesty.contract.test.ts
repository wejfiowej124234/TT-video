import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = join(import.meta.dirname, "../..");

describe("community relational showcase honesty (P1-CM-REL-01)", () => {
  it("friends and messages pages wire data-tt + sr-only hint", () => {
    const friends = readFileSync(join(root, "app/community/friends/page.tsx"), "utf8");
    const messages = readFileSync(
      join(root, "app/community/messages/CommunityMessagesPageMain.tsx"),
      "utf8",
    );
    const note = readFileSync(
      join(root, "components/community/CommunityRelationalShowcaseHonestyNote.tsx"),
      "utf8",
    );
    expect(note).toContain("data-tt-community-relational-showcase");
    expect(note).toContain("shouldUseCommunityShowcaseForRelationalUi");
    expect(friends).toContain("CommunityRelationalShowcaseHonestyNote");
    expect(friends).toContain("community_friends_relational_showcase_hint");
    expect(messages).toContain("CommunityRelationalShowcaseHonestyNote");
    expect(messages).toContain("community_messages_relational_showcase_hint");
  });
});
