import { describe, expect, it } from "vitest";
import {
  communityWriteRejectionCode,
  isCommunityCommentDuplicateRejection,
  isExpectedCommunityWriteRejection,
} from "./communityApiExpectedWriteRejection";

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

  it("exposes comment_duplicate as soft-success candidate", () => {
    const body = {
      status: "error",
      error: "comment_duplicate",
      message: "comment_duplicate",
    };
    expect(communityWriteRejectionCode(body)).toBe("comment_duplicate");
    expect(isCommunityCommentDuplicateRejection(body)).toBe(true);
    expect(isExpectedCommunityWriteRejection(body)).toBe(true);
  });

  it("does not treat comment_too_fast as duplicate soft-success", () => {
    expect(
      isCommunityCommentDuplicateRejection({
        status: "error",
        error: "comment_too_fast",
      }),
    ).toBe(false);
  });
});
