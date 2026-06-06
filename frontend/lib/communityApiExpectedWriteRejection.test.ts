import { describe, expect, it } from "vitest";
import { isExpectedCommunityWriteRejection } from "./communityApiExpectedWriteRejection";

describe("communityApiExpectedWriteRejection", () => {
  it("treats post_duplicate_body as expected", () => {
    expect(
      isExpectedCommunityWriteRejection({
        status: "error",
        error: "post_duplicate_body",
        message: "post_duplicate_body",
      }),
    ).toBe(true);
  });

  it("does not treat media_required as abuse expected", () => {
    expect(
      isExpectedCommunityWriteRejection({
        status: "error",
        error: "media_required",
      }),
    ).toBe(false);
  });
});
