import { describe, expect, it } from "vitest";
import { parseOrderChainSyncResponse } from "./types";
import { ORDER_CHAIN_SYNC_MINIMAL_BODY_NOTE } from "./types.chainSync.testConstants";

describe("parseOrderChainSyncResponse · root fields / last_event (705～709)", () => {
  it("parses non-chain_off minimal body chain_sync.status unknown with projection_backend_unavailable (709)", () => {
    const raw = {
      status: "ok",
      order_id: "550e8400-e29b-41d4-a716-446655440000",
      note: ORDER_CHAIN_SYNC_MINIMAL_BODY_NOTE,
      requester: "660e8400-e29b-41d4-a716-446655440001",
      chain_sync: {
        status: "unknown",
        finality_n: 12,
        checkpoint: { block_number: 0, log_index: 0 },
        last_event: null,
        event_log_snapshot_absent_reason: "projection_backend_unavailable",
      },
    };
    const got = parseOrderChainSyncResponse(raw);
    expect(got?.syncStatus).toBe("unknown");
    expect(got?.eventLogSnapshotAbsentReason).toBe("projection_backend_unavailable");
    expect(got?.lastEvent).toBeUndefined();
  });

  it("parses root requester into chainSyncRequester (708)", () => {
    const rid = "660e8400-e29b-41d4-a716-446655440001";
    const raw = {
      status: "ok",
      order_id: "550e8400-e29b-41d4-a716-446655440000",
      requester: ` ${rid} `,
      note: "minimal",
      chain_sync: {
        status: "unknown",
        finality_n: 12,
        checkpoint: { block_number: 0, log_index: 0 },
        event_log_snapshot_absent_reason: "projection_backend_unavailable",
      },
    };
    const got = parseOrderChainSyncResponse(raw);
    expect(got?.chainSyncRequester).toBe(rid);
  });

  it("parses root order_id into chainSyncOrderId (707)", () => {
    const oid = "550e8400-e29b-41d4-a716-446655440000";
    const raw = {
      status: "ok",
      order_id: `  ${oid}  `,
      chain_sync: {
        status: "confirmed",
        finality_n: 12,
        checkpoint: { block_number: 1, log_index: 0 },
      },
    };
    const got = parseOrderChainSyncResponse(raw);
    expect(got?.chainSyncOrderId).toBe(oid);
  });

  it("parses chain_sync.last_event into lastEvent (706)", () => {
    const raw = {
      status: "ok",
      chain_sync: {
        status: "confirmed",
        finality_n: 12,
        checkpoint: { block_number: 1, log_index: 0 },
        last_event: {
          state: "Escrowed",
          updated_at: "2026-04-03T12:00:00Z",
          escrow_address: "0xabc",
        },
      },
    };
    const got = parseOrderChainSyncResponse(raw);
    expect(got?.lastEvent?.state).toBe("Escrowed");
    expect(got?.lastEvent?.updated_at).toBe("2026-04-03T12:00:00Z");
    expect(got?.lastEvent?.escrow_address).toBe("0xabc");
  });

  it("parses last_event with null escrow_address (706)", () => {
    const raw = {
      status: "ok",
      chain_sync: {
        status: "pending",
        finality_n: 12,
        checkpoint: { block_number: 0, log_index: 0 },
        last_event: {
          state: "Draft",
          updated_at: "2026-04-03T00:00:00Z",
          escrow_address: null,
        },
      },
    };
    const got = parseOrderChainSyncResponse(raw);
    expect(got?.lastEvent?.escrow_address).toBeNull();
  });

  it("parses root note into chainSyncNote (705)", () => {
    const raw = {
      status: "ok",
      note: "  minimal runtime snapshot  ",
      chain_sync: {
        status: "unknown",
        finality_n: 12,
        checkpoint: { block_number: 0, log_index: 0 },
        event_log_snapshot_absent_reason: "projection_backend_unavailable",
      },
    };
    const got = parseOrderChainSyncResponse(raw);
    expect(got?.chainSyncNote).toBe("minimal runtime snapshot");
    expect(got?.eventLogSnapshotAbsentReason).toBe("projection_backend_unavailable");
  });
});
