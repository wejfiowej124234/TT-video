import { describe, expect, it } from "vitest";
import { dayHasStructuredBlocks, itineraryHasStructuredBlocks } from "./dayStructured";
import type { UnifiedDayRow } from "./types";

describe("dayStructured", () => {
  it("detects attractions/dining/hotel blocks", () => {
    const row: UnifiedDayRow = {
      day_index: 1,
      attractions: [{ name: "Temple" }],
    };
    expect(dayHasStructuredBlocks(row)).toBe(true);
    expect(itineraryHasStructuredBlocks([row])).toBe(true);
  });

  it("returns false for plain narrative-only rows", () => {
    const row: UnifiedDayRow = { day_index: 1, description: "Walk around" };
    expect(dayHasStructuredBlocks(row)).toBe(false);
  });
});
