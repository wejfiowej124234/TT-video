import { describe, expect, it } from "vitest";
import {
  TT_PAGE_SCROLL_CHAPTER_STEP_L5,
  resolveTraveltrustScrollChapterIndex,
  traveltrustScrollChapterSnapAlign,
} from "./traveltrustPageScrollChapterStep";

describe("traveltrustPageScrollChapterStep", () => {
  it("lists narrative chapters aligned with in-page nav anchors", () => {
    expect(TT_PAGE_SCROLL_CHAPTER_STEP_L5.chapterSelectors).toEqual([
      "#hero",
      '[data-tt-traveltrust-snap-chapter="theater"]',
      '[data-tt-traveltrust-snap-chapter="liquidity"]',
      '[data-tt-traveltrust-snap-chapter="trust"]',
      '[data-tt-traveltrust-snap-chapter="settlement"]',
      '[data-tt-traveltrust-snap-chapter="faq"]',
      '[data-tt-traveltrust-snap-chapter="close"]',
    ]);
    expect(TT_PAGE_SCROLL_CHAPTER_STEP_L5.scrollBehavior).toBe("smooth");
    expect(TT_PAGE_SCROLL_CHAPTER_STEP_L5.cooldownMs).toBeGreaterThanOrEqual(1000);
    expect(TT_PAGE_SCROLL_CHAPTER_STEP_L5.scrollDurationMs).toBeGreaterThanOrEqual(900);
  });

  it("resolveTraveltrustScrollChapterIndex uses center anchor for center chapters", () => {
    const targets = [
      {
        id: "hero",
        getAttribute: () => "center",
        getBoundingClientRect: () => ({ top: 0, height: 800 }),
      },
      {
        getAttribute: () => "start",
        getBoundingClientRect: () => ({ top: 40, height: 1200 }),
      },
      {
        getAttribute: () => "start",
        getBoundingClientRect: () => ({ top: 900, height: 600 }),
      },
    ] as unknown as HTMLElement[];
    expect(traveltrustScrollChapterSnapAlign(targets[0])).toBe("center");
    expect(resolveTraveltrustScrollChapterIndex(targets, 88)).toBe(0);
  });

  it("resolveTraveltrustScrollChapterIndex picks closest start anchor", () => {
    const targets = [
      {
        getAttribute: () => "start",
        getBoundingClientRect: () => ({ top: 100, height: 400 }),
      },
      {
        getAttribute: () => "start",
        getBoundingClientRect: () => ({ top: 28, height: 400 }),
      },
      {
        getAttribute: () => "start",
        getBoundingClientRect: () => ({ top: 900, height: 400 }),
      },
    ] as unknown as HTMLElement[];
    expect(resolveTraveltrustScrollChapterIndex(targets, 28)).toBe(1);
  });
});
