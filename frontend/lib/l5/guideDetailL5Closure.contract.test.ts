import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  GUIDE_DETAIL_L5_BANNED_COPY,
  GUIDE_DETAIL_L5_CLOSURE_FINDINGS,
  GUIDE_DETAIL_L5_CLOSURE_PROBE,
  GUIDE_DETAIL_L5_CLOSURE_SPRINT_ID,
  GUIDE_DETAIL_L5_FROZEN_MARKER,
  GUIDE_DETAIL_L5_LOCALE_KEYS,
  GUIDE_DETAIL_L5_OPEN_P0,
  GUIDE_DETAIL_L5_OPEN_P1,
  GUIDE_DETAIL_L5_UI_FROZEN,
} from "./guideDetailL5ClosureSprintModel";

const feRoot = join(__dirname, "../..");

function read(rel: string) {
  return readFileSync(join(feRoot, rel), "utf8");
}

function extractLocaleValue(src: string, key: string): string {
  const re = new RegExp(`${key}:\\s*"([^"]*)"`, "m");
  const single = src.match(re);
  if (single?.[1]) return single[1];
  const multi = src.match(new RegExp(`${key}:\\s*\\n\\s*"([^"]*)"`, "m"));
  return multi?.[1] ?? "";
}

describe("Guide Detail L5 Closure Sprint", () => {
  const loaded = read("app/guides/[id]/GuideDetailPageLoaded.tsx");
  const schedule = read("components/guides/GuideOccupiedScheduleBlock.tsx");
  const constants = read("app/guides/[id]/guideDetailPageConstants.ts");

  it("registers sprint, consumer-grade probe, UI frozen, zero open P0/P1", () => {
    expect(GUIDE_DETAIL_L5_CLOSURE_SPRINT_ID).toContain("guide-detail-l5-closure");
    expect(GUIDE_DETAIL_L5_CLOSURE_PROBE).toBe("consumer-grade");
    expect(GUIDE_DETAIL_L5_UI_FROZEN).toBe(true);
    expect(GUIDE_DETAIL_L5_CLOSURE_FINDINGS.length).toBeGreaterThanOrEqual(7);
    expect(GUIDE_DETAIL_L5_OPEN_P0).toHaveLength(0);
    expect(GUIDE_DETAIL_L5_OPEN_P1).toHaveLength(0);
  });

  it("closure locale keys avoid ops/API/托管 copy (zh + en)", () => {
    for (const localeFile of ["locales/zh.ts", "locales/en.ts"] as const) {
      const src = read(localeFile);
      for (const key of GUIDE_DETAIL_L5_LOCALE_KEYS) {
        const value = extractLocaleValue(src, key);
        expect(value.length, `${localeFile}:${key}`).toBeGreaterThan(0);
        expect(value, `${localeFile}:${key}`).not.toMatch(GUIDE_DETAIL_L5_BANNED_COPY);
      }
    }
  });

  it("loaded page exposes frozen consumer-grade probes and hero decision strip", () => {
    expect(loaded).toContain("data-tt-guide-detail-l5-closure={GUIDE_DETAIL_L5_CLOSURE_PROBE}");
    expect(loaded).toContain("data-tt-ui-frozen={GUIDE_DETAIL_L5_FROZEN_MARKER}");
    expect(loaded).toContain("guide_detail_hero_signals_aria");
    expect(loaded).toContain("guide_card_rating");
    expect(loaded).toContain("GUIDE_DETAIL_SECTION_LABEL_CLASS");
    expect(loaded).not.toContain("drawerSectionAccent");
    expect(loaded).not.toContain("market_segment_back_travel");
  });

  it("schedule defaults to collapsed month with expand control", () => {
    expect(schedule).toContain("guide_availability_expand");
    expect(schedule).toContain("guide_availability_this_month_kicker");
    expect(schedule).toContain("expanded");
    expect(schedule).not.toContain("guide_availability_ranges_heading");
    expect(schedule).not.toContain("guide_availability_source_");
  });

  it("schedule greys out past dates and excludes them from bookable semantics", () => {
    expect(schedule).toContain("todayYmd");
    expect(schedule).toContain("guide_availability_dayPast");
    expect(schedule).toContain("guide_availability_legend_past");
    expect(schedule).toContain("data-tt-guide-availability-past");
    expect(schedule).toContain("aria-disabled={isPast || busy ? true : undefined}");
    expect(schedule).toContain("selectable");
    expect(schedule).toContain("data-tt-guide-trip-selected");
  });

  it("specialty tags render without registration hint copy", () => {
    expect(loaded).not.toContain("guide_detail_specialty_hint");
  });

  it("constants use drawer meta labels not uppercase accent", () => {
    expect(constants).toContain("GUIDE_DETAIL_SECTION_LABEL_CLASS");
    expect(constants).not.toContain("drawerSectionAccent");
  });

  it("matrix documents 3-second clarity and freeze", () => {
    const md = read("evidence/GUIDE-DETAIL-L5-CLOSURE-SPRINT-MATRIX.md");
    expect(md).toContain("3 秒");
    expect(md).toContain("冻结");
    expect(md).toContain("consumer-grade");
  });
});
