import { describe, expect, it, vi } from "vitest";
import { FEEDBACK_MEDIA_ITEM_MAX_UTF8_BYTES } from "@/lib/communityFeedbackMediaLimits";
import {
  feedbackFormStateFromWriteInterpretation,
  validateFeedbackMediaPreviewsForSubmit,
} from "./communityFeedbackSubmitValidation";

describe("communityFeedbackSubmitValidation", () => {
  it("feedbackFormStateFromWriteInterpretation prefers field messages for content/media_urls", () => {
    const s = feedbackFormStateFromWriteInterpretation({
      topMessage: "Top",
      fieldMessages: { media_urls: "bad" },
    });
    expect(s.fieldMessages).toEqual({ media_urls: "bad" });
    expect(s.formError).toBeNull();
  });

  it("validateFeedbackMediaPreviewsForSubmit rejects oversized data URL", () => {
    const t = vi.fn((k: string) => k);
    const long = `${"a".repeat(FEEDBACK_MEDIA_ITEM_MAX_UTF8_BYTES + 1)}`;
    const bad = validateFeedbackMediaPreviewsForSubmit([{ type: "image", url: long }], t);
    expect(bad).not.toBeNull();
    expect(bad?.fieldMessages).toBeTruthy();
  });

  it("validateFeedbackMediaPreviewsForSubmit passes empty list", () => {
    const t = vi.fn((k: string) => k);
    expect(validateFeedbackMediaPreviewsForSubmit([], t)).toBeNull();
  });
});
