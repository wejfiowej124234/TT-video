import { describe, expect, it } from "vitest";
import { getTraveltrustGlobeHeroHud, setTraveltrustGlobeHeroHud } from "@/lib/traveltrustGlobeHeroHud";

describe("traveltrustGlobeHeroHud", () => {
  it("stores visible hubs and route bias", () => {
    setTraveltrustGlobeHeroHud({ visibleHubIds: ["cn", "jp"], routeBias: "asia" });
    expect(getTraveltrustGlobeHeroHud().visibleHubIds).toEqual(["cn", "jp"]);
    expect(getTraveltrustGlobeHeroHud().routeBias).toBe("asia");
  });
});
