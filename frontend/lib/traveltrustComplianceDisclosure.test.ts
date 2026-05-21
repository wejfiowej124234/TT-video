import { describe, expect, it } from "vitest";
import en from "@/locales/en";
import zh from "@/locales/zh";
import {
  assertComplianceMarkers,
  TRAVELTRUST_V6_COMPLIANCE_MARKERS_EN,
  TRAVELTRUST_V6_COMPLIANCE_MARKERS_ZH,
} from "@/lib/traveltrustComplianceDisclosure";

describe("traveltrustComplianceDisclosure (TT-PH1-168/179)", () => {
  it("zh disclosure keys contain required semantic markers", () => {
    expect(assertComplianceMarkers(zh, TRAVELTRUST_V6_COMPLIANCE_MARKERS_ZH)).toEqual([]);
  });

  it("en disclosure keys contain required semantic markers", () => {
    expect(assertComplianceMarkers(en, TRAVELTRUST_V6_COMPLIANCE_MARKERS_EN)).toEqual([]);
  });
});
