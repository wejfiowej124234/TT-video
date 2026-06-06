import { describe, expect, it } from "vitest";
import { CHAIN_SYNC_STATUS_VALUES, parseOrderChainSyncResponse } from "./types";
import { ORDER_CHAIN_SYNC_MINIMAL_BODY_NOTE } from "./types.chainSync.testConstants";

describe("parseOrderChainSyncResponse · checkpoint / finality / status / note (709～714)", () => {
  it("parses chain_sync.checkpoint block_number and log_index (710)", () => {
    const raw = {
      status: "ok",
      chain_sync: {
        status: "unknown",
        finality_n: 12,
        checkpoint: { block_number: 42, log_index: 7 },
        event_log_snapshot_absent_reason: "projection_backend_unavailable",
      },
    };
    const got = parseOrderChainSyncResponse(raw);
    expect(got?.checkpointBlock).toBe(42);
    expect(got?.checkpointLog).toBe(7);
  });

  it("parses chain_sync.finality_n into finalityN for meta同源对读 (711)", () => {
    const raw = {
      status: "ok",
      chain_sync: {
        status: "pending",
        finality_n: 15,
        checkpoint: { block_number: 1, log_index: 0 },
        event_log_snapshot_absent_reason: "no_row",
      },
    };
    const got = parseOrderChainSyncResponse(raw);
    expect(got?.finalityN).toBe(15);
  });

  it("accepts syncStatus pending|confirmed|unknown per meta status_values (713 / 719)", () => {
    for (const st of CHAIN_SYNC_STATUS_VALUES) {
      const raw = {
        status: "ok",
        chain_sync: {
          status: st,
          finality_n: 12,
          checkpoint: { block_number: 0, log_index: 0, source: "startup_snapshot" },
        },
      };
      expect(parseOrderChainSyncResponse(raw)?.syncStatus).toBe(st);
    }
  });

  it("minimal non-chain_off root note matches 714 stable sentence (meta minimal_body_note_stable)", () => {
    const raw = {
      status: "ok",
      note: ORDER_CHAIN_SYNC_MINIMAL_BODY_NOTE,
      chain_sync: {
        status: "unknown",
        finality_n: 12,
        checkpoint: { block_number: 0, log_index: 0 },
        event_log_snapshot_absent_reason: "projection_backend_unavailable",
      },
    };
    expect(parseOrderChainSyncResponse(raw)?.chainSyncNote).toBe(
      ORDER_CHAIN_SYNC_MINIMAL_BODY_NOTE
    );
  });

  it("parses chain_sync.checkpoint.source into checkpointSource for meta 同源 (712)", () => {
    const raw = {
      status: "ok",
      chain_sync: {
        status: "unknown",
        finality_n: 12,
        checkpoint: {
          block_number: 40,
          log_index: 2,
          source: " startup_snapshot ",
        },
        event_log_snapshot_absent_reason: "projection_backend_unavailable",
      },
    };
    const got = parseOrderChainSyncResponse(raw);
    expect(got?.checkpointSource).toBe("startup_snapshot");
    expect(got?.checkpointBlock).toBe(40);
    expect(got?.checkpointLog).toBe(2);
  });
});
