import { describe, expect, it } from "vitest";
import {
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

  it("public rounds fit inside public 20% bucket", () => {
    const total = GOVERNANCE_PUBLIC_SALE_ROUNDS.reduce((s, r) => s + r.ttgUnits, 0);
    expect(total).toBe(GOVERNANCE_PUBLIC_SALE_TOTAL.ttgUnits);
    expect(GOVERNANCE_PUBLIC_SALE_TOTAL.ttgUnits).toBe(2_000_000);
  });
});
