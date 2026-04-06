import { describe, expect, it } from "vitest";
import {
  CHAIN_SYNC_CHECKPOINT_SOURCE_VALUES,
  CHAIN_SYNC_CHECKPOINT_TOP_KEYS,
  CHAIN_SYNC_EVENT_LOG_SNAPSHOT_TOP_KEYS,
  CHAIN_SYNC_LAST_EVENT_TOP_KEYS,
  CHAIN_SYNC_REQUIRED_TOP_KEYS,
  CHAIN_SYNC_ROUTE_PATH_TEMPLATE,
  CHAIN_SYNC_EVENT_LOG_SNAPSHOT_ABSENT_REASONS,
  CHAIN_SYNC_STATUS_HANDLER_CODE,
  CHAIN_SYNC_STATUS_METHOD_AND_PATH,
  CHAIN_SYNC_STATUS_VALUES,
  CHAIN_SYNC_SUCCESS_ENVELOPE_STATUS,
  ORDER_CHAIN_SYNC_STATUS_META_TOP_KEYS,
  parseOrderChainSyncResponse,
} from "./types";

/** 与 `crates/api` `CHAIN_SYNC_MINIMAL_BODY_NOTE` / `GET /meta` `minimal_body_note_stable` 对读（714）。 */
const ORDER_CHAIN_SYNC_MINIMAL_BODY_NOTE =
  "minimal runtime snapshot when order projection backend is unavailable";

describe("parseOrderChainSyncResponse (702 / 703 / 705 / 706 / 707 / 708 / 709 / 710 / 711 / 712 / 713 / 714 / 715 / 716 / 717 / 718 / 719 / 720 / 721 / 722 / 723 / 724 / 725)", () => {
  it("exposes 717 route + method_path literals aligned with orders + GET /meta", () => {
    expect(CHAIN_SYNC_ROUTE_PATH_TEMPLATE).toBe("/api/v1/orders/:id/chain-sync-status");
    expect(CHAIN_SYNC_STATUS_METHOD_AND_PATH).toBe(
      `GET ${CHAIN_SYNC_ROUTE_PATH_TEMPLATE}`
    );
  });

  it("exposes 718 handler code anchor aligned with orders::CHAIN_SYNC_STATUS_HANDLER_CODE + GET /meta code", () => {
    expect(CHAIN_SYNC_STATUS_HANDLER_CODE).toBe(
      "crates/api/src/routes/orders/mod.rs get_order_chain_sync_status"
    );
    expect(CHAIN_SYNC_STATUS_HANDLER_CODE).toContain("orders/mod.rs");
    expect(CHAIN_SYNC_STATUS_HANDLER_CODE).toContain("get_order_chain_sync_status");
  });

  it("exposes 719 CHAIN_SYNC_STATUS_VALUES aligned with orders::CHAIN_SYNC_STATUS_VALUES + GET /meta status_values", () => {
    expect([...CHAIN_SYNC_STATUS_VALUES]).toEqual([
      "pending",
      "confirmed",
      "unknown",
    ]);
  });

  it("exposes 720 CHAIN_SYNC_EVENT_LOG_SNAPSHOT_ABSENT_REASONS aligned with orders + GET /meta absent_reason_values", () => {
    expect([...CHAIN_SYNC_EVENT_LOG_SNAPSHOT_ABSENT_REASONS]).toEqual([
      "no_database",
      "no_chain_context",
      "no_row",
      "read_failed",
      "projection_backend_unavailable",
    ]);
  });

  it("exposes 721 CHAIN_SYNC_LAST_EVENT_TOP_KEYS aligned with orders + GET /meta last_event_top_keys", () => {
    expect([...CHAIN_SYNC_LAST_EVENT_TOP_KEYS]).toEqual([
      "state",
      "updated_at",
      "escrow_address",
    ]);
  });

  it("exposes 722 CHAIN_SYNC_EVENT_LOG_SNAPSHOT_TOP_KEYS aligned with db::EVENT_LOG_SNAPSHOT_JSON_TOP_KEYS + GET /meta event_log_snapshot_top_keys", () => {
    expect([...CHAIN_SYNC_EVENT_LOG_SNAPSHOT_TOP_KEYS]).toEqual([
      "finality_n_used",
      "block_number",
      "log_index",
      "event_type",
      "tx_hash",
      "block_hash",
    ]);
  });

  it("exposes 723 CHAIN_SYNC_CHECKPOINT_TOP_KEYS aligned with orders + GET /meta checkpoint_top_keys", () => {
    expect([...CHAIN_SYNC_CHECKPOINT_TOP_KEYS]).toEqual([
      "block_number",
      "log_index",
      "source",
    ]);
  });

  it("exposes 724 CHAIN_SYNC_CHECKPOINT_SOURCE_VALUES aligned with orders + GET /meta checkpoint_source_values", () => {
    expect([...CHAIN_SYNC_CHECKPOINT_SOURCE_VALUES]).toEqual(["runtime", "startup_snapshot"]);
  });

  it("exposes 725 ORDER_CHAIN_SYNC_STATUS_META_TOP_KEYS aligned with orders + GET /meta order_chain_sync_status_top_keys", () => {
    expect([...ORDER_CHAIN_SYNC_STATUS_META_TOP_KEYS]).toEqual([
      "method_path",
      "method_path_contract_717",
      "status_values",
      "status_values_contract_719",
      "absent_reason_values",
      "absent_reason_values_contract_720",
      "code",
      "code_contract_718",
      "event_log_snapshot_top_keys",
      "event_log_snapshot_keys_contract_722",
      "optional_event_log_snapshot",
      "optional_event_log_snapshot_absent_reason",
      "last_event_top_keys",
      "last_event_keys_contract_721",
      "checkpoint_top_keys",
      "checkpoint_keys_contract_723",
      "checkpoint_source_values",
      "checkpoint_source_values_contract_724",
      "optional_last_event",
      "success_body_order_id",
      "success_body_envelope_status",
      "chain_sync_required_top_keys",
      "minimal_body_requester",
      "minimal_body_chain_sync_status_unknown",
      "chain_sync_checkpoint",
      "chain_sync_finality_n",
      "chain_sync_checkpoint_source",
      "chain_sync_status_enum",
      "minimal_body_note_stable",
      "order_chain_sync_status_top_keys",
      "order_chain_sync_status_top_keys_contract_725",
      "rule",
    ]);
  });

  it("exposes CHAIN_SYNC_REQUIRED_TOP_KEYS aligned with orders CHAIN_SYNC_REQUIRED_TOP_KEYS / meta 716", () => {
    expect([...CHAIN_SYNC_REQUIRED_TOP_KEYS]).toEqual([
      "status",
      "finality_n",
      "checkpoint",
      "last_event",
    ]);
  });

  it("returns null when root envelope status is not ok (715)", () => {
    const raw = {
      status: "error",
      chain_sync: {
        status: "pending",
        finality_n: 12,
        checkpoint: { block_number: 0, log_index: 0 },
      },
    };
    expect(parseOrderChainSyncResponse(raw)).toBeNull();
  });

  it("requires root envelope status ok literal to parse (715)", () => {
    const raw = {
      status: CHAIN_SYNC_SUCCESS_ENVELOPE_STATUS,
      chain_sync: {
        status: "pending",
        finality_n: 12,
        checkpoint: { block_number: 0, log_index: 0 },
      },
    };
    expect(parseOrderChainSyncResponse(raw)?.syncStatus).toBe("pending");
  });

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
