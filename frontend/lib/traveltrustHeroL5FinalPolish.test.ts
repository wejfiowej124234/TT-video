import { describe, expect, it } from "vitest";
import {
  TRAVELTRUST_HERO_L5_DESTINATION_LABEL_KEYS,
  TRAVELTRUST_HERO_L5_FINAL_POLISH_ID,
  resolveHeroL5DestinationLabelKey,
} from "./traveltrustHeroL5FinalPolish";
import { TRAVELTRUST_HERO_P3_CORE_LABEL_NODE_IDS } from "./traveltrustHeroP3DecorNodes";
import zh from "@/locales/zh";
import en from "@/locales/en";
import {
  TRAVELTRUST_V6_COMPLIANCE_MARKERS_ZH,
  assertComplianceMarkers,
} from "./traveltrustComplianceDisclosure";

describe("traveltrustHeroL5FinalPolish", () => {
  it("exposes stable polish id", () => {
    expect(TRAVELTRUST_HERO_L5_FINAL_POLISH_ID).toMatch(/^TT-HERO-L5-FINAL-POLISH/);
  });

  it("maps all ten core hubs to destination label keys", () => {
    for (const id of TRAVELTRUST_HERO_P3_CORE_LABEL_NODE_IDS) {
      expect(TRAVELTRUST_HERO_L5_DESTINATION_LABEL_KEYS[id]).toBe(`traveltrust_hero_l5_dest_${id}`);
      const key = resolveHeroL5DestinationLabelKey(id, id, "fallback");
      expect(zh[key]).toBeTruthy();
      expect(en[key]).toBeTruthy();
      expect(zh[key]).not.toMatch(/中国|美国|法国/);
    }
  });

  it("keeps zh compliance markers on hero p3 lead", () => {
    const violations = assertComplianceMarkers(zh, TRAVELTRUST_V6_COMPLIANCE_MARKERS_ZH).filter((v) =>
      v.startsWith("traveltrust_hero_p3_lead"),
    );
    expect(violations).toEqual([]);
  });
});
