import { describe, expect, it } from "vitest";
import {
  DID_RANK_AVATAR_PODIUM_BOX,
  DID_RANK_AVATAR_PODIUM_PX,
} from "@/lib/didRankAvatarClasses";

describe("didRankAvatarClasses", () => {
  it("podium avatars use one fixed box for ranks 1-3", () => {
    expect(DID_RANK_AVATAR_PODIUM_BOX).toContain("h-12 w-12");
    expect(DID_RANK_AVATAR_PODIUM_BOX).toContain("sm:h-[3.25rem]");
    expect(DID_RANK_AVATAR_PODIUM_PX).toBe(52);
  });
});
