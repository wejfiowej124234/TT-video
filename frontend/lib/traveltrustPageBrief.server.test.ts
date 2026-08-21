import { beforeEach, describe, expect, it, vi } from "vitest";
import { TRAVELTRUST_PAGE_BRIEF_DEV_FALLBACK } from "@/lib/traveltrustPageBrief";

vi.mock("@/lib/traveltrustPageBrief", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/lib/traveltrustPageBrief")>();
  return {
    ...mod,
    fetchTravelTrustPageBrief: vi.fn(),
  };
});

import { fetchTravelTrustPageBrief } from "@/lib/traveltrustPageBrief";
import { loadTraveltrustLayoutPreload } from "@/lib/traveltrustPageBrief.server";

describe("loadTraveltrustLayoutPreload", () => {
  beforeEach(() => {
    vi.mocked(fetchTravelTrustPageBrief).mockReset();
  });

  it("resolves hero and five role videos from API brief", async () => {
    vi.mocked(fetchTravelTrustPageBrief).mockResolvedValue({
      brief: TRAVELTRUST_PAGE_BRIEF_DEV_FALLBACK,
      source: "api",
    });
    const preload = await loadTraveltrustLayoutPreload();
    expect(preload.source).toBe("api");
    expect(preload.hero.mp4).toMatch(/hero-loop\.mp4$/);
    expect(preload.roles).toHaveLength(5);
    expect(preload.roles.every((r) => r.mp4.includes("/media/traveltrust/roles/"))).toBe(true);
  });

  it("falls back when fetch returns fallback source", async () => {
    vi.mocked(fetchTravelTrustPageBrief).mockResolvedValue({
      brief: TRAVELTRUST_PAGE_BRIEF_DEV_FALLBACK,
      source: "fallback",
    });
    const preload = await loadTraveltrustLayoutPreload();
    expect(preload.source).toBe("fallback");
    expect(preload.hero.tier).toBe("tier1-placeholder");
  });
});
