import { describe, expect, it, beforeEach } from "vitest";
import { loadShowcaseFollowIds, persistShowcaseFollowIds } from "./communityShowcaseFollowStorage";

describe("communityShowcaseFollowStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("persists showcase follow ids only", () => {
    persistShowcaseFollowIds(new Set(["tt-demo-yuki", "real-user"]));
    expect([...loadShowcaseFollowIds()]).toEqual(["tt-demo-yuki"]);
  });
});
