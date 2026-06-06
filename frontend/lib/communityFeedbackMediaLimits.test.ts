import { describe, expect, it } from "vitest";
import {
  FEEDBACK_MEDIA_ITEM_MAX_UTF8_BYTES,
  estimateFeedbackDataUrlUtf8ByteLength,
  feedbackDataUrlBase64CharCount,
  feedbackDataUrlWouldExceedItemLimit,
} from "./communityFeedbackMediaLimits";

describe("communityFeedbackMediaLimits", () => {
  it("matches API FEEDBACK_MEDIA_ITEM_MAX_BYTES (950_000)", () => {
    expect(FEEDBACK_MEDIA_ITEM_MAX_UTF8_BYTES).toBe(950_000);
  });

  it("feedbackDataUrlBase64CharCount matches ceil(n/3)*4", () => {
    expect(feedbackDataUrlBase64CharCount(1)).toBe(4);
    expect(feedbackDataUrlBase64CharCount(2)).toBe(4);
    expect(feedbackDataUrlBase64CharCount(3)).toBe(4);
    expect(feedbackDataUrlBase64CharCount(750_000)).toBe(1_000_000);
  });

  it("flags ~712KiB raw video as under limit for video/mp4 prefix", () => {
    const n = 712_000;
    const est = estimateFeedbackDataUrlUtf8ByteLength("video/mp4", n);
    expect(est).toBeLessThanOrEqual(FEEDBACK_MEDIA_ITEM_MAX_UTF8_BYTES);
    expect(feedbackDataUrlWouldExceedItemLimit("video/mp4", n)).toBe(false);
  });

  it("flags 750KiB raw video as over limit (base64 expansion)", () => {
    const n = 750_000;
    expect(feedbackDataUrlWouldExceedItemLimit("video/mp4", n)).toBe(true);
  });
});
