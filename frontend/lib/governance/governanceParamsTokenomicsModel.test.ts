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
    expect(GOVERNANCE_PARAMS_PROTOCOL_REFERENCE_MIRROR.fee_router?.global_pool_split_percent?.ttg_stakers).toBe(0);
  });
});

describe("governanceParamsTokenomicsModel", () => {
  it("supply rows sum to 25T TTG and 100% (Design Lock 50/35/3/5/7)", () => {
    const totalUnits = GOVERNANCE_TTG_SUPPLY_ROWS.reduce((s, r) => s + r.ttgUnits, 0);
    const totalPct = GOVERNANCE_TTG_SUPPLY_ROWS.reduce((s, r) => s + r.sharePct, 0);
    expect(TTG_TOTAL_SUPPLY).toBe(25_000_000_000_000);
    expect(totalUnits).toBe(TTG_TOTAL_SUPPLY);
    expect(totalPct).toBe(100);
    expect(GOVERNANCE_TTG_SUPPLY_ROWS).toHaveLength(5);
  });

  it("GOV-03 V1.1 cap_disabled and seat-one-per-entity", () => {
    expect(GOVERNANCE_FREEZE_V1.GOV_03.max_voting_power_cap_disabled).toBe(true);
    expect(GOVERNANCE_FREEZE_V1.GOV_03.max_voting_power_per_address_bps).toBe(0);
    expect(GOVERNANCE_FREEZE_V1.GOV_03.max_active_seats_per_controlling_entity).toBe(1);
  });

  it("ACTIVE nested table is five Norm batches (not legacy 800k/1.2M/3M)", () => {
    const total = GOVERNANCE_PUBLIC_SALE_ROUNDS.reduce((s, r) => s + r.ttgUnits, 0);
    expect(total).toBe(GOVERNANCE_PUBLIC_SALE_TOTAL.ttgUnits);
    expect(GOVERNANCE_PUBLIC_SALE_ROUNDS).toHaveLength(5);
    expect(GOVERNANCE_PUBLIC_SALE_ROUNDS.some((r) => r.id.startsWith("norm_batch_"))).toBe(true);
    expect(GOVERNANCE_PUBLIC_SALE_ROUNDS.some((r) => r.id.includes("round_"))).toBe(false);
  });
});
