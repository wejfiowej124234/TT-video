/**
 * GET /meta — 726·727·757·758·728 `*_top_keys` 序（与 `meta.topKeys729through732.test` 互补）
 */
import { describe, it, expect } from "vitest";
import {
  FINALITY_DISCIPLINE_META_TOP_KEYS,
  INDEXER_META_TOP_KEYS,
  INDEXER_MEMORY_META_TOP_KEYS,
  INDEXER_CHECKPOINT_META_TOP_KEYS,
  META_ROOT_TOP_KEYS,
} from ".";

describe("FINALITY_DISCIPLINE_META_TOP_KEYS (726)", () => {
  it("matches health_meta FINALITY_DISCIPLINE_META_TOP_KEYS / GET /meta finality_discipline_top_keys order", () => {
    expect([...FINALITY_DISCIPLINE_META_TOP_KEYS]).toEqual([
      "tick_logs_upper_bound",
      "postgres_event_log_has_finality_n_used",
      "order_chain_sync_status",
      "chain_tip_not_in_meta",
      "chain_tip_hint",
      "finality_discipline_top_keys",
      "finality_discipline_top_keys_contract_726",
    ]);
  });
});

describe("INDEXER_META_TOP_KEYS (727)", () => {
  it("matches health_meta INDEXER_META_TOP_KEYS / GET /meta indexer_top_keys order", () => {
    expect([...INDEXER_META_TOP_KEYS]).toEqual([
      "state_path",
      "checkpoint",
      "last_seen_finality_n",
      "replay_required",
      "lag_blocks",
      "lag_max_blocks",
      "reorg_detected",
      "finality_n",
      "memory",
      "finality_discipline",
      "rule",
      "indexer_top_keys",
      "indexer_top_keys_contract_727",
    ]);
  });
});

describe("INDEXER_MEMORY_META_TOP_KEYS (757)", () => {
  it("matches health_meta INDEXER_MEMORY_META_TOP_KEYS / GET /meta indexer.memory order", () => {
    expect([...INDEXER_MEMORY_META_TOP_KEYS]).toEqual([
      "available",
      "last_block",
      "last_log_index",
      "last_block_hash_prefix",
      "events_cached",
      "rule",
      "indexer_memory_top_keys",
      "indexer_memory_top_keys_contract_757",
    ]);
  });
});

describe("INDEXER_CHECKPOINT_META_TOP_KEYS (758)", () => {
  it("matches health_meta INDEXER_CHECKPOINT_META_TOP_KEYS / GET /meta indexer.checkpoint order", () => {
    expect([...INDEXER_CHECKPOINT_META_TOP_KEYS]).toEqual([
      "block_number",
      "log_index",
      "source",
      "rule",
      "indexer_checkpoint_top_keys",
      "indexer_checkpoint_top_keys_contract_758",
    ]);
  });
});

describe("META_ROOT_TOP_KEYS (728)", () => {
  it("matches health_meta META_ROOT_TOP_KEYS / GET /meta meta_top_keys order", () => {
    expect([...META_ROOT_TOP_KEYS]).toEqual([
      "service",
      "api_version",
      "build",
      "chain",
      "rate_limits",
      "database_connected",
      "database",
      "dual_write",
      "strict_mode",
      "ssot_version",
      "ssot",
      "admin_exports",
      "chargeback_policy",
      "finality_n",
      "indexer",
      "authority",
      "pause",
      "evidence",
      "order_messages",
      "reviews",
      "dispute_open",
      "dispute_resolve",
      "itineraries",
      "orders",
      "discover",
      "product_countries",
      "did_rank",
      "product_roles",
      "auth",
      "seed_test_accounts",
      "guides",
      "idempotency_cache",
      "defaults",
      "outbox",
      "meta_top_keys",
      "meta_top_keys_contract_728",
    ]);
  });
});
