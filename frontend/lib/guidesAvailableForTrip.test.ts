import { describe, expect, it, vi, beforeEach } from "vitest";
import { filterGuidesAvailableForTrip } from "./guidesAvailableForTrip";
import { fetchGuideAvailabilityForMany } from "./guideAvailabilityClient";

vi.mock("./guideAvailabilityClient", () => ({
  fetchGuideAvailabilityForMany: vi.fn(),
}));

describe("filterGuidesAvailableForTrip", () => {
  beforeEach(() => {
    vi.mocked(fetchGuideAvailabilityForMany).mockReset();
  });

  it("keeps guides with empty availability", async () => {
    vi.mocked(fetchGuideAvailabilityForMany).mockResolvedValue(
      new Map([["g1", { occupied_ranges: [] }]]),
    );
    const out = await filterGuidesAvailableForTrip([{ id: "g1" }], {
      start: "2026-06-10",
      end: "2026-06-13",
    });
    expect(out.map((g) => g.id)).toEqual(["g1"]);
  });

  it("drops guides with any occupied range (guide_slot parity)", async () => {
    vi.mocked(fetchGuideAvailabilityForMany).mockResolvedValue(
      new Map([
        [
          "g1",
          {
            occupied_ranges: [{ order_id: "o1", start_date: "2026-07-01", end_date: "2026-07-03" }],
          },
        ],
      ]),
    );
    const out = await filterGuidesAvailableForTrip([{ id: "g1" }], {
      start: "2026-06-10",
      end: "2026-06-13",
    });
    expect(out).toEqual([]);
  });
});
