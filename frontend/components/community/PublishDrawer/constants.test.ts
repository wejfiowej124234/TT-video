import { describe, it, expect } from "vitest";
import {
  MAX_VIDEO_DURATION_SEC,
  MAX_IMAGES,
  COMMUNITY_POST_MEDIA_MAX_DECODED_BYTES_DEFAULT,
  getCommunityPostMediaMaxDecodedBytes,
} from "./constants";

/** 与 31 / 51-31-2 注释一致：短内容信息流上限可回归调参，本测防无意归零 */
describe("PublishDrawer constants", () => {
  it("caps community video duration at 180s (short-form feed)", () => {
    expect(MAX_VIDEO_DURATION_SEC).toBe(180);
  });

  it("aligns client upload precheck with API default decoded cap (04 upload-media)", () => {
    expect(getCommunityPostMediaMaxDecodedBytes()).toBe(COMMUNITY_POST_MEDIA_MAX_DECODED_BYTES_DEFAULT);
    expect(MAX_IMAGES).toBe(9);
  });
});
