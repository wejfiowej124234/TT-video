import { describe, expect, it, beforeEach } from "vitest";
import {
  loadShowcaseEngagementSets,
  persistShowcaseCollectedIds,
  persistShowcaseLikedIds,
} from "./communityShowcaseEngagementStorage";

describe("communityShowcaseEngagementStorage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("persists showcase liked ids only", () => {
    persistShowcaseLikedIds(new Set(["tt-showcase-post-002", "real-id"]));
    expect([...loadShowcaseEngagementSets().liked]).toEqual(["tt-showcase-post-002"]);
  });

  it("persists showcase collected ids only", () => {
    persistShowcaseCollectedIds(new Set(["tt-showcase-post-010"]));
    expect([...loadShowcaseEngagementSets().collected]).toEqual(["tt-showcase-post-010"]);
  });
});
