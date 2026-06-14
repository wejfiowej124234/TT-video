import { describe, expect, it } from "vitest";
import { defaultForm } from "./types";
import {
  countItineraryDaysConfigured,
  guideHasMinimumInterest,
  touristHasMinimumInterest,
} from "./itineraryInterestValidation";

describe("itineraryInterestValidation", () => {
  it("tourist requires interest or description", () => {
    const form = defaultForm(2);
    form.country = "CN";
    form.dayPlans[0].city = "北京";
    form.dayPlans[1].city = "上海";
    expect(touristHasMinimumInterest(form)).toBe(false);
    form.dayPlans[0].attractions = ["故宫"];
    expect(touristHasMinimumInterest(form)).toBe(true);
  });

  it("guide accepts description or daily content", () => {
    const form = defaultForm(1);
    form.creatorType = "guide";
    form.guideDayPlans = form.guideDayPlans ?? [];
    form.guideDayPlans[0] = { ...form.guideDayPlans[0]!, attractions: "市区漫步" };
    expect(guideHasMinimumInterest(form)).toBe(true);
  });

  it("counts configured days with city", () => {
    const form = defaultForm(3);
    form.country = "CN";
    form.dayPlans[0].city = "北京";
    expect(countItineraryDaysConfigured(form)).toBe(1);
  });
});
