import { describe, expect, it } from "vitest";
import { formatFeedbackListDate, mediaUrlsToItems } from "./communityFeedbackDisplay";

describe("mediaUrlsToItems", () => {
  it("returns undefined for empty / missing", () => {
    expect(mediaUrlsToItems(undefined)).toBeUndefined();
    expect(mediaUrlsToItems([])).toBeUndefined();
  });

  it("classifies data:video and file extensions as video", () => {
    expect(mediaUrlsToItems(["data:video/mp4;base64,xxx"])).toEqual([
      { type: "video", url: "data:video/mp4;base64,xxx" },
    ]);
    expect(mediaUrlsToItems(["https://x.com/a.mp4"])).toEqual([{ type: "video", url: "https://x.com/a.mp4" }]);
    expect(mediaUrlsToItems(["https://x.com/a.webm#t=1"])).toEqual([{ type: "video", url: "https://x.com/a.webm#t=1" }]);
  });

  it("defaults other URLs to image", () => {
    expect(mediaUrlsToItems(["https://x.com/p.jpg", "data:image/png;base64,abc"])).toEqual([
      { type: "image", url: "https://x.com/p.jpg" },
      { type: "image", url: "data:image/png;base64,abc" },
    ]);
  });
});

describe("formatFeedbackListDate", () => {
  it("returns original string when not parseable", () => {
    expect(formatFeedbackListDate("")).toBe("");
    expect(formatFeedbackListDate("not-iso")).toBe("not-iso");
  });

  it("formats valid ISO to a short locale date string", () => {
    const out = formatFeedbackListDate("2020-06-15T12:00:00.000Z");
    expect(out.length).toBeGreaterThan(0);
    expect(/\d/.test(out)).toBe(true);
  });
});
