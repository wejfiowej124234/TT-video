/**
 * GET /meta — 753–756 / 761 域 `*_top_keys` 序（与 `meta.topKeys743through752.test` 互补）
 */
import { describe, it, expect } from "vitest";
import {
  IDEMPOTENCY_CACHE_META_TOP_KEYS,
  DEFAULTS_META_TOP_KEYS,
  OUTBOX_META_TOP_KEYS,
  RATE_LIMITS_META_TOP_KEYS,
  GUIDE_UPLOAD_META_TOP_KEYS,
} from ".";

describe("IDEMPOTENCY_CACHE_META_TOP_KEYS (753)", () => {
  it("matches health_meta IDEMPOTENCY_CACHE_META_TOP_KEYS / GET /meta idempotency_cache order", () => {
    expect([...IDEMPOTENCY_CACHE_META_TOP_KEYS]).toEqual([
      "memory_max_entries",
      "db_projection",
      "rule",
      "idempotency_cache_top_keys",
      "idempotency_cache_top_keys_contract_753",
    ]);
  });
});

describe("DEFAULTS_META_TOP_KEYS (754)", () => {
  it("matches health_meta DEFAULTS_META_TOP_KEYS / GET /meta defaults order", () => {
    expect([...DEFAULTS_META_TOP_KEYS]).toEqual([
      "request_timeout_secs",
      "request_body_limit_bytes",
      "idempotency_cache_max",
      "rule",
      "defaults_top_keys",
      "defaults_top_keys_contract_754",
    ]);
  });
});

describe("OUTBOX_META_TOP_KEYS (755)", () => {
  it("matches health_meta OUTBOX_META_TOP_KEYS / GET /meta outbox order", () => {
    expect([...OUTBOX_META_TOP_KEYS]).toEqual([
      "dir",
      "worker_enabled",
      "lease_secs",
      "poll_ms",
      "max_attempts",
      "rule",
      "outbox_top_keys",
      "outbox_top_keys_contract_755",
    ]);
  });
});

describe("RATE_LIMITS_META_TOP_KEYS (756)", () => {
  it("matches health_meta RATE_LIMITS_META_TOP_KEYS / GET /meta rate_limits order", () => {
    expect([...RATE_LIMITS_META_TOP_KEYS]).toEqual([
      "window_seconds",
      "api_requests_per_minute_per_client",
      "api_limit_disabled",
      "critical_writes_per_minute_per_client",
      "critical_limit_disabled",
      "evidence_posts_per_minute_per_order_user",
      "evidence_limit_disabled",
      "review_submits_per_minute_per_order_reviewer",
      "review_limit_disabled",
      "review_low_score_min_comment_chars",
      "review_low_score_rule_disabled",
      "guide_upload",
      "rule",
      "rate_limits_top_keys",
      "rate_limits_top_keys_contract_756",
    ]);
  });
});

describe("GUIDE_UPLOAD_META_TOP_KEYS (761)", () => {
  it("matches rate_limit GUIDE_UPLOAD_META_TOP_KEYS / GET /meta rate_limits.guide_upload order", () => {
    expect([...GUIDE_UPLOAD_META_TOP_KEYS]).toEqual([
      "max_per_window",
      "window_seconds",
      "rule",
      "guide_upload_top_keys",
      "guide_upload_top_keys_contract_761",
    ]);
  });
});
