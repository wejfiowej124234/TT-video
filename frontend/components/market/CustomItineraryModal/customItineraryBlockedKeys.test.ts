import { describe, it, expect } from "vitest";
import { defaultForm } from "./types";
import { customItineraryGuideBlockedKeys, customItineraryTouristBlockedKeys } from "./customItineraryBlockedKeys";

describe("customItineraryBlockedKeys", () => {
  it("guide: requires session, amount", () => {
    const base = defaultForm(3);
    const form = { ...base, creatorType: "guide" as const, amount: "" };
    const keys = customItineraryGuideBlockedKeys(form, { sessionOk: false, coverFileTooBig: false });
    expect(keys).toContain("action_gate_item_login");
    expect(keys).toContain("action_gate_itin_amount_empty");
  });

  it("tourist: requires country and cities", () => {
    const form = defaultForm(2);
    form.country = "CN";
    form.dayPlans[0].city = "";
    const keys = customItineraryTouristBlockedKeys(form, {
      sessionOk: true,
      coverFileTooBig: false,
      suggestedTransportFee: 0,
    });
    expect(keys).toContain("action_gate_itin_tourist_cities");
  });

  it("tourist: requires minimum interest", () => {
    const form = defaultForm(1);
    form.country = "CN";
    form.dayPlans[0].city = "北京";
    form.amount = "100";
    const keys = customItineraryTouristBlockedKeys(form, {
      sessionOk: true,
      coverFileTooBig: false,
      suggestedTransportFee: 0,
    });
    expect(keys).toContain("action_gate_itin_interest_required");
  });
});
