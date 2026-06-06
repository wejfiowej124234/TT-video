import { describe, expect, it } from "vitest";
import { parseOrderChainSyncResponse } from "./types";

describe("parseOrderChainSyncResponse · event_log_snapshot (702 / 703)", () => {
  it("parses event_log_snapshot tx_hash and block_hash when present", () => {
    const raw = {
      status: "ok",
      chain_sync: {
        status: "confirmed",
        finality_n: 12,
        checkpoint: { block_number: 1, log_index: 0 },
        event_log_snapshot: {
          finality_n_used: 12,
          block_number: 100,
          log_index: 3,
          event_type: "Paid",
          tx_hash: "0xabcd",
          block_hash: "0xef01",
        },
      },
    };
    const got = parseOrderChainSyncResponse(raw);
    expect(got?.eventLogSnapshot?.tx_hash).toBe("0xabcd");
    expect(got?.eventLogSnapshot?.block_hash).toBe("0xef01");
  });

  it("omits empty tx_hash / block_hash", () => {
    const raw = {
      status: "ok",
      chain_sync: {
        status: "pending",
        finality_n: 12,
        checkpoint: { block_number: 0, log_index: 0 },
        event_log_snapshot: {
          finality_n_used: 12,
          block_number: 1,
          log_index: 0,
          event_type: "EscrowCreated",
          tx_hash: "  ",
          block_hash: null,
        },
      },
    };
    const got = parseOrderChainSyncResponse(raw);
    expect(got?.eventLogSnapshot?.tx_hash).toBeUndefined();
    expect(got?.eventLogSnapshot?.block_hash).toBeUndefined();
  });

  it("parses event_log_snapshot_absent_reason when no snapshot (703)", () => {
    const raw = {
      status: "ok",
      chain_sync: {
        status: "pending",
        finality_n: 12,
        checkpoint: { block_number: 0, log_index: 0 },
        event_log_snapshot_absent_reason: "no_row",
      },
    };
    const got = parseOrderChainSyncResponse(raw);
    expect(got?.eventLogSnapshot).toBeUndefined();
    expect(got?.eventLogSnapshotAbsentReason).toBe("no_row");
  });

  it("ignores absent_reason when snapshot is present (703)", () => {
    const raw = {
      status: "ok",
      chain_sync: {
        status: "confirmed",
        finality_n: 12,
        checkpoint: { block_number: 1, log_index: 0 },
        event_log_snapshot_absent_reason: "no_row",
        event_log_snapshot: {
          finality_n_used: 12,
          block_number: 10,
          log_index: 1,
          event_type: "Paid",
        },
      },
    };
    const got = parseOrderChainSyncResponse(raw);
    expect(got?.eventLogSnapshot?.event_type).toBe("Paid");
    expect(got?.eventLogSnapshotAbsentReason).toBeUndefined();
  });
});
