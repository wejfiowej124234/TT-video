import { describe, it, expect } from "vitest";
import {
  buildFeeMetricDiffRows,
  protocolReferenceHasSubstance,
  PROTOCOL_REF_CHECKSUM_DISPLAY_KEYS,
  type ProtocolRef84Mirror,
} from "./governanceParams84Readonly";

const baseMirror = (): ProtocolRef84Mirror => ({
  status: "ok",
  doc_version: "1.0.0",
  fee_router: {
    layer1_percent_of_allocatable_platform_fee: { country_bucket: 45, global_pool: 55 },
    global_pool_split_percent: { ttg_stakers: 65, reserve: 20, operations: 15 },
  },
  phase1_countries: [{ name_zh: "X", tier: "S", national_pool_cap_fee_points: 1, phase1_open_fee_points: 1, fundraise_target_cny_wan: 1, fundraise_cap_cny_wan: 1 }],
});

describe("governanceParams84Readonly (P5-5-3)", () => {
  it("protocolReferenceHasSubstance is false when phase1_countries missing", () => {
    const thin: ProtocolRef84Mirror = {
      status: "ok",
      fee_router: {
        layer1_percent_of_allocatable_platform_fee: { country_bucket: 45, global_pool: 55 },
        global_pool_split_percent: { ttg_stakers: 65, reserve: 20, operations: 15 },
      },
    };
    expect(protocolReferenceHasSubstance(thin)).toBe(false);
  });

  it("protocolReferenceHasSubstance is true for full doc mirror shape", () => {
    expect(protocolReferenceHasSubstance(baseMirror())).toBe(true);
  });

  it("buildFeeMetricDiffRows returns five rows when both sides complete", () => {
    const a = baseMirror();
    const b = baseMirror();
    b.fee_router!.layer1_percent_of_allocatable_platform_fee!.country_bucket = 44;
    const rows = buildFeeMetricDiffRows(a, b);
    expect(rows).not.toBeNull();
    expect(rows!.length).toBe(5);
    expect(rows!.find((r) => r.id === "l1_country")).toMatchObject({ cur: 45, pen: 44 });
  });

  it("checksum display keys list is stable for i18n rows", () => {
    expect(PROTOCOL_REF_CHECKSUM_DISPLAY_KEYS).toContain("phase1_open_fee_points_sum");
    expect(PROTOCOL_REF_CHECKSUM_DISPLAY_KEYS).toContain("phase1_open_over_country_bucket");
  });
});
