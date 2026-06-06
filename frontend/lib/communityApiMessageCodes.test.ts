import { describe, expect, it } from "vitest";
import { COMMUNITY_API_MESSAGE_CODES } from "./communityApiMessageCodes";

describe("communityApiMessageCodes SSOT hygiene", () => {
  it("COMMUNITY_API_MESSAGE_CODES stays lexicographically sorted (merge / review hygiene)", () => {
    const codes = [...COMMUNITY_API_MESSAGE_CODES];
    const sorted = [...codes].sort((a, b) => a.localeCompare(b));
    expect(codes).toEqual(sorted);
  });
});
