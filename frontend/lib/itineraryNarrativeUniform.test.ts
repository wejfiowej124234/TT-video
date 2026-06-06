import { describe, expect, it } from "vitest";
import {
  itineraryDescriptionsUniform,
  uniformItineraryDescription,
} from "./itineraryNarrativeUniform";

describe("itineraryNarrativeUniform", () => {
  it("returns false for fewer than two non-empty descriptions", () => {
    expect(itineraryDescriptionsUniform([{ day_index: 1, description: "a" }])).toBe(false);
    expect(itineraryDescriptionsUniform([{ day_index: 1 }, { day_index: 2 }])).toBe(false);
  });

  it("detects identical descriptions across days", () => {
    const rows = [
      { day_index: 1, description: "same text" },
      { day_index: 2, description: "same text" },
      { day_index: 3, description: "same text" },
    ];
    expect(itineraryDescriptionsUniform(rows)).toBe(true);
    expect(uniformItineraryDescription(rows)).toBe("same text");
  });

  it("returns false when any day differs", () => {
    expect(
      itineraryDescriptionsUniform([
        { day_index: 1, description: "a" },
        { day_index: 2, description: "b" },
      ]),
    ).toBe(false);
  });
});
