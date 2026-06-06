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

describe("parseOrderChainSyncResponse meta anchors (702 / 703 / 705 / 706 / 707 / 708 / 709 / 710 / 711 / 712 / 713 / 714 / 715 / 716 / 717 / 718 / 719 / 720 / 721 / 722 / 723 / 724 / 725)", () => {
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
    expect([...CHAIN_SYNC_STATUS_VALUES]).toEqual(["pending", "confirmed", "unknown"]);
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
});
