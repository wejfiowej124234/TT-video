/**
 * GET /meta — 738–742 `*_top_keys` 序（与 `meta.topKeys733through737.test` 互补）
 */
import { describe, it, expect } from "vitest";
import {
  EVIDENCE_META_TOP_KEYS,
  ORDER_MESSAGES_META_TOP_KEYS,
  REVIEWS_META_TOP_KEYS,
  DISPUTE_OPEN_META_TOP_KEYS,
  DISPUTE_RESOLVE_META_TOP_KEYS,
} from ".";

describe("EVIDENCE_META_TOP_KEYS (738)", () => {
  it("matches health_meta EVIDENCE_META_TOP_KEYS / GET /meta evidence.evidence_top_keys order", () => {
    expect([...EVIDENCE_META_TOP_KEYS]).toEqual([
      "timestamp_policy",
      "time_state_path",
      "receipt_signature",
      "rollback_detection",
      "strict_db_write",
      "dual_write_order",
      "rule",
      "evidence_top_keys",
      "evidence_top_keys_contract_738",
    ]);
  });
});

describe("ORDER_MESSAGES_META_TOP_KEYS (739)", () => {
  it("matches health_meta ORDER_MESSAGES_META_TOP_KEYS / GET /meta order_messages.order_messages_top_keys order", () => {
    expect([...ORDER_MESSAGES_META_TOP_KEYS]).toEqual([
      "chain_off_mounted",
      "strict_db_write",
      "dual_write_order",
      "http_rule",
      "rule",
      "order_messages_top_keys",
      "order_messages_top_keys_contract_739",
    ]);
  });
});

describe("REVIEWS_META_TOP_KEYS (740)", () => {
  it("matches health_meta REVIEWS_META_TOP_KEYS / GET /meta reviews.reviews_top_keys order", () => {
    expect([...REVIEWS_META_TOP_KEYS]).toEqual([
      "strict_db_write",
      "dual_write_order",
      "rule",
      "reviews_top_keys",
      "reviews_top_keys_contract_740",
    ]);
  });
});

describe("DISPUTE_OPEN_META_TOP_KEYS (741)", () => {
  it("matches health_meta DISPUTE_OPEN_META_TOP_KEYS / GET /meta dispute_open.dispute_open_top_keys order", () => {
    expect([...DISPUTE_OPEN_META_TOP_KEYS]).toEqual([
      "strict_db_write",
      "dual_write_order",
      "rule",
      "dispute_open_top_keys",
      "dispute_open_top_keys_contract_741",
    ]);
  });
});

describe("DISPUTE_RESOLVE_META_TOP_KEYS (742)", () => {
  it("matches health_meta DISPUTE_RESOLVE_META_TOP_KEYS / GET /meta dispute_resolve.dispute_resolve_top_keys order", () => {
    expect([...DISPUTE_RESOLVE_META_TOP_KEYS]).toEqual([
      "strict_db_write",
      "dual_write_order",
      "rule",
      "dispute_resolve_top_keys",
      "dispute_resolve_top_keys_contract_742",
    ]);
  });
});
