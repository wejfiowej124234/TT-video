import { afterEach, describe, expect, it } from "vitest";
import {
  clearCommunityBrowseHistory,
  readCommunityBrowseHistory,
  recordCommunityPostBrowse,
} from "./communityBrowseHistory";

describe("communityBrowseHistory", () => {
  afterEach(() => {
    localStorage.clear();
  });

  it("dedupes by id and caps length", () => {
    for (let i = 0; i < 45; i += 1) {
      recordCommunityPostBrowse({ id: `p-${i}`, preview: `x${i}` });
    }
    recordCommunityPostBrowse({ id: "p-0", preview: "bump" });
    const list = readCommunityBrowseHistory();
    expect(list.length).toBe(40);
    expect(list[0]?.id).toBe("p-0");
    expect(list[0]?.preview).toBe("bump");
  });

  it("clear removes storage", () => {
    recordCommunityPostBrowse({ id: "a", title: "T" });
    expect(readCommunityBrowseHistory().length).toBe(1);
    clearCommunityBrowseHistory();
    expect(readCommunityBrowseHistory().length).toBe(0);
  });
});
