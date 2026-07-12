import { describe, expect, it } from "vitest";
import {
  GOVERNANCE_FREEZE_V1,
  GOVERNANCE_PUBLIC_SALE_ROUNDS,
  GOVERNANCE_PUBLIC_SALE_TOTAL,
  GOVERNANCE_TTG_SUPPLY_ROWS,
  TTG_TOTAL_SUPPLY,
} from "./governanceParamsTokenomicsModel";
import {
  GOVERNANCE_PARAMS_PROTOCOL_REFERENCE_MIRROR,
} from "./governanceParamsProtocolReferenceMirror";
import { protocolReferenceHasSubstance } from "@/lib/governanceParams84Readonly";

describe("governanceParamsProtocolReferenceMirror", () => {
  it("bundled mirror has substance for offline params page", () => {
    expect(protocolReferenceHasSubstance(GOVERNANCE_PARAMS_PROTOCOL_REFERENCE_MIRROR)).toBe(true);
    expect(GOVERNANCE_PARAMS_PROTOCOL_REFERENCE_MIRROR.phase1_countries).toHaveLength(10);
  });
});

describe("governanceParamsTokenomicsModel", () => {
  it("supply rows sum to 10M TTG and 100%", () => {
    const totalUnits = GOVERNANCE_TTG_SUPPLY_ROWS.reduce((s, r) => s + r.ttgUnits, 0);
    const totalPct = GOVERNANCE_TTG_SUPPLY_ROWS.reduce((s, r) => s + r.sharePct, 0);
    expect(totalUnits).toBe(TTG_TOTAL_SUPPLY);
    expect(totalPct).toBe(100);
  });

  it("GOV-03 V1.1 cap_disabled and seat-one-per-entity", () => {
    expect(GOVERNANCE_FREEZE_V1.GOV_03.max_voting_power_cap_disabled).toBe(true);
    expect(GOVERNANCE_FREEZE_V1.GOV_03.max_voting_power_per_address_bps).toBe(0);
    expect(GOVERNANCE_FREEZE_V1.GOV_03.max_active_seats_per_controlling_entity).toBe(1);
  });

  it("public rounds fit inside Public Sale 50% bucket (Genesis V2)", () => {
    const total = GOVERNANCE_PUBLIC_SALE_ROUNDS.reduce((s, r) => s + r.ttgUnits, 0);
    expect(total).toBe(GOVERNANCE_PUBLIC_SALE_TOTAL.ttgUnits);
    expect(GOVERNANCE_PUBLIC_SALE_TOTAL.ttgUnits).toBe(5_000_000);
    expect(GOVERNANCE_PUBLIC_SALE_TOTAL.ofSupplyPct).toBe(50);
    expect(GOVERNANCE_TTG_SUPPLY_ROWS).toHaveLength(4);
  });
});
