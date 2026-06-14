import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getGuideAvailability } from "@/lib/apiClient";
import {
  clearGuideAvailabilityClientCache,
  fetchGuideAvailabilityCached,
  fetchGuideAvailabilityForMany,
} from "./guideAvailabilityClient";

vi.mock("@/lib/apiClient", () => ({
  getGuideAvailability: vi.fn(),
}));

describe("guideAvailabilityClient", () => {
  beforeEach(() => {
    clearGuideAvailabilityClientCache();
    vi.mocked(getGuideAvailability).mockReset();
  });

  afterEach(() => {
    clearGuideAvailabilityClientCache();
  });

  it("caches availability within TTL", async () => {
    vi.mocked(getGuideAvailability).mockResolvedValue({ occupied_ranges: [] });
    await fetchGuideAvailabilityCached("g1");
    await fetchGuideAvailabilityCached("g1");
    expect(getGuideAvailability).toHaveBeenCalledTimes(1);
  });

  it("retries on rate_limit_exceeded", async () => {
    vi.mocked(getGuideAvailability)
      .mockRejectedValueOnce(new Error("rate_limit_exceeded"))
      .mockResolvedValueOnce({ occupied_ranges: [] });
    const data = await fetchGuideAvailabilityCached("g2");
    expect(data.occupied_ranges).toEqual([]);
    expect(getGuideAvailability).toHaveBeenCalledTimes(2);
  });

  it("fetchGuideAvailabilityForMany limits parallel burst", async () => {
    let inFlight = 0;
    let maxInFlight = 0;
    vi.mocked(getGuideAvailability).mockImplementation(async () => {
      inFlight += 1;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await new Promise((r) => setTimeout(r, 5));
      inFlight -= 1;
      return { occupied_ranges: [] };
    });
    await fetchGuideAvailabilityForMany(["a", "b", "c", "d", "e", "f"]);
    expect(maxInFlight).toBeLessThanOrEqual(4);
    expect(getGuideAvailability).toHaveBeenCalledTimes(6);
  });
});
