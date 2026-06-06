import { describe, expect, it } from "vitest";
import {
  COMMUNITY_PUBLISH_SUBMIT_REJECTED,
  CommunityPublishSubmitRejectedError,
  isCommunityPublishParentOwnedError,
} from "./communityPublishSubmitError";

describe("communityPublishSubmitError", () => {
  it("recognizes typed API rejection", () => {
    expect(isCommunityPublishParentOwnedError(new CommunityPublishSubmitRejectedError())).toBe(true);
  });

  it("recognizes legacy publish_post_not_ok message", () => {
    expect(isCommunityPublishParentOwnedError(new Error(COMMUNITY_PUBLISH_SUBMIT_REJECTED))).toBe(true);
  });

  it("does not treat multipart failures as parent-owned", () => {
    expect(isCommunityPublishParentOwnedError(new Error("part_upload_failed"))).toBe(false);
  });
});
