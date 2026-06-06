import { describe, expect, it } from "vitest";
import { defaultForm } from "@/components/market/CustomItineraryModal/types";
import { mapCustomItineraryFormToItineraryNewForm } from "./draftHydrateMap";

describe("mapCustomItineraryFormToItineraryNewForm", () => {
  it("maps country + first day city + days + amount + notes", () => {
    const cf = defaultForm(4);
    cf.country = "中国";
    cf.dayPlans[0] = { ...cf.dayPlans[0], city: "上海" };
    cf.title = "标题";
    cf.description = "说明";
    cf.amount = "1200";
    const out = mapCustomItineraryFormToItineraryNewForm(cf);
    expect(out.destination).toBe("中国");
    expect(out.city).toBe("上海");
    expect(out.days).toBe(4);
    expect(out.budget_max).toBe("1200");
    expect(out.notes).toContain("标题");
    expect(out.notes).toContain("说明");
  });

  it("clears city when not in preset list for country", () => {
    const cf = defaultForm(3);
    cf.country = "中国";
    cf.dayPlans[0] = { ...cf.dayPlans[0], city: "不存在市" };
    const out = mapCustomItineraryFormToItineraryNewForm(cf);
    expect(out.destination).toBe("中国");
    expect(out.city).toBe("");
  });
});
