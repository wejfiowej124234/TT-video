import { describe, expect, it } from "vitest";
import {
  stewardGovernanceCompactTrackLines,
  stewardGovernanceDataSourceNoteKey,
  stewardPoolStatDisplay,
  stewardRewardsItemCount,
} from "./stewardWorkbenchGovernanceModel";

describe("stewardWorkbenchGovernanceModel", () => {
  it("formats pool stat from database row", () => {
    const row = stewardPoolStatDisplay({
      status: "ok",
      pool_balance: 125000,
      currency: "TTG",
      data_source: "database",
    });
    expect(row.value).toBe("125000");
    expect(row.currency).toBe("TTG");
    expect(row.isChainSsot).toBe(false);
  });

  it("counts reward items", () => {
    expect(stewardRewardsItemCount({ status: "ok", items: [{ id: "1" }, { id: "2" }] })).toBe(2);
    expect(stewardRewardsItemCount({ status: "ok", items: [] })).toBe(0);
  });

  it("maps data source to phase-honest note keys", () => {
    expect(
      stewardGovernanceDataSourceNoteKey(
        { status: "ok", data_source: "database" },
        { status: "ok", data_source: "database" },
      ),
    ).toBe("steward_workbench_data_note_database");
    expect(
      stewardGovernanceDataSourceNoteKey(
        { status: "ok", data_source: "chain_read", is_chain_ssot: true },
        null,
      ),
    ).toBe("steward_workbench_data_note_chain_read");
  });

  it("maps compact track lines from pool balance_lines_v1", () => {
    const lines = stewardGovernanceCompactTrackLines({
      status: "ok",
      balance_lines_v1: [
        { track_type: "A", source: "FeeRouter", balance: 100, currency: "TTG" },
        { track_type: "B", source: "RegionVault", balance: 50, currency: "USDC" },
      ],
    });
    expect(lines).toHaveLength(2);
    expect(lines[0]?.label).toBe("A · FeeRouter");
    expect(lines[0]?.value).toBe("100");
  });
});
