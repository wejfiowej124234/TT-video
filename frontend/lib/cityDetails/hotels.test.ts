import { describe, expect, it } from "vitest";
import { getHotelDetails, getHotels, resolveHotelSubmitLabel } from "./hotels";

describe("hotel tiers", () => {
  it("各城市返回相同的三档酒店选项", () => {
    const tokyo = getHotels("东京");
    const osaka = getHotels("大阪");
    expect(tokyo).toHaveLength(3);
    expect(osaka.map((h) => h.value)).toEqual(tokyo.map((h) => h.value));
    expect(tokyo[0].value).toBe("tier_economy");
  });

  it("提交标签为通用档次描述", () => {
    expect(resolveHotelSubmitLabel("tier_comfort")).toContain("舒适");
  });

  it("酒店详情含独立配图", () => {
    const details = getHotelDetails("东京");
    const images = new Set(details.map((d) => d.image));
    expect(images.size).toBe(3);
  });
});
