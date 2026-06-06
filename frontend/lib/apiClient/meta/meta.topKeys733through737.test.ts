/**
 * GET /meta — 733–737 `*_top_keys` 序（与 `meta.topKeys738through742.test` 互补）
 */
import { describe, it, expect } from "vitest";
import {
  SSOT_META_TOP_KEYS,
  ADMIN_EXPORTS_META_TOP_KEYS,
  CHARGEBACK_POLICY_META_TOP_KEYS,
  AUTHORITY_META_TOP_KEYS,
  PAUSE_META_TOP_KEYS,
} from ".";

describe("SSOT_META_TOP_KEYS (733)", () => {
  it("matches health_meta SSOT_META_TOP_KEYS / GET /meta ssot.ssot_top_keys order", () => {
    expect([...SSOT_META_TOP_KEYS]).toEqual([
      "expected_sha256",
      "computed_sha256",
      "match",
      "file",
      "rule",
      "ssot_top_keys",
      "ssot_top_keys_contract_733",
    ]);
  });
});

describe("ADMIN_EXPORTS_META_TOP_KEYS (734)", () => {
  it("matches health_meta ADMIN_EXPORTS_META_TOP_KEYS / GET /meta admin_exports.admin_exports_top_keys order", () => {
    expect([...ADMIN_EXPORTS_META_TOP_KEYS]).toEqual([
      "reconcile_ed25519_public_key_hex",
      "reconcile_ed25519_response_header",
      "rule",
      "admin_exports_top_keys",
      "admin_exports_top_keys_contract_734",
    ]);
  });
});

describe("CHARGEBACK_POLICY_META_TOP_KEYS (735)", () => {
  it("matches health_meta CHARGEBACK_POLICY_META_TOP_KEYS / GET /meta chargeback_policy.chargeback_policy_top_keys order", () => {
    expect([...CHARGEBACK_POLICY_META_TOP_KEYS]).toEqual([
      "value",
      "rule",
      "chargeback_policy_top_keys",
      "chargeback_policy_top_keys_contract_735",
    ]);
  });
});

describe("AUTHORITY_META_TOP_KEYS (736)", () => {
  it("matches health_meta AUTHORITY_META_TOP_KEYS / GET /meta authority.authority_top_keys order", () => {
    expect([...AUTHORITY_META_TOP_KEYS]).toEqual([
      "source",
      "degraded_mode",
      "rule",
      "authority_top_keys",
      "authority_top_keys_contract_736",
    ]);
  });
});

describe("PAUSE_META_TOP_KEYS (737)", () => {
  it("matches health_meta PAUSE_META_TOP_KEYS / GET /meta pause.pause_top_keys order", () => {
    expect([...PAUSE_META_TOP_KEYS]).toEqual([
      "enabled",
      "api_allowlist",
      "rule",
      "pause_top_keys",
      "pause_top_keys_contract_737",
    ]);
  });
});
