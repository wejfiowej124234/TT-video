/**
 * GET /meta — 729·759·760·730·731·732 `*_top_keys` 序（与 `meta.topKeys726through728.test` 互补）
 */
import { describe, it, expect } from "vitest";
import {
  DATABASE_META_TOP_KEYS,
  CHAIN_META_TOP_KEYS,
  CHAIN_CONTRACTS_META_TOP_KEYS,
  META_BUILD_TOP_KEYS,
  STRICT_MODE_META_TOP_KEYS,
  DUAL_WRITE_META_TOP_KEYS,
} from ".";

describe("DATABASE_META_TOP_KEYS (760)", () => {
  it("matches health_meta DATABASE_META_TOP_KEYS / GET /meta database_top_keys order", () => {
    expect([...DATABASE_META_TOP_KEYS]).toEqual([
      "connected",
      "rule",
      "database_top_keys",
      "database_top_keys_contract_760",
    ]);
  });
});

describe("CHAIN_META_TOP_KEYS (729)", () => {
  it("matches health_meta CHAIN_META_TOP_KEYS / GET /meta chain.chain_top_keys order", () => {
    expect([...CHAIN_META_TOP_KEYS]).toEqual([
      "chain_id",
      "contracts",
      "rule",
      "chain_top_keys",
      "chain_top_keys_contract_729",
    ]);
  });
});

describe("CHAIN_CONTRACTS_META_TOP_KEYS (759)", () => {
  it("matches health_meta CHAIN_CONTRACTS_META_TOP_KEYS / GET /meta chain.contracts order when object", () => {
    expect([...CHAIN_CONTRACTS_META_TOP_KEYS]).toEqual([
      "guide_staking_address",
      "staking_provider_address",
      "governor_address",
      "timelock_address",
      "governance_token_address",
      "fee_router_address",
      "treasury_address",
      "rule",
      "chain_contracts_top_keys",
      "chain_contracts_top_keys_contract_759",
    ]);
  });
});

describe("META_BUILD_TOP_KEYS (730)", () => {
  it("matches health_meta META_BUILD_TOP_KEYS / GET /meta build.build_top_keys order", () => {
    expect([...META_BUILD_TOP_KEYS]).toEqual([
      "git_sha",
      "deployed_at",
      "rule",
      "build_top_keys",
      "build_top_keys_contract_730",
    ]);
  });
});

describe("STRICT_MODE_META_TOP_KEYS (731)", () => {
  it("matches health_meta STRICT_MODE_META_TOP_KEYS / GET /meta strict_mode.strict_mode_top_keys order", () => {
    expect([...STRICT_MODE_META_TOP_KEYS]).toEqual([
      "strict_ssot",
      "require_idempotency_key",
      "strict_session_gate",
      "internal_api_secret_configured",
      "rule",
      "strict_mode_top_keys",
      "strict_mode_top_keys_contract_731",
    ]);
  });
});

describe("DUAL_WRITE_META_TOP_KEYS (732)", () => {
  it("matches health_meta DUAL_WRITE_META_TOP_KEYS / GET /meta dual_write.dual_write_top_keys order", () => {
    expect([...DUAL_WRITE_META_TOP_KEYS]).toEqual([
      "failure_policy",
      "strict_db_write_any",
      "rule",
      "dual_write_top_keys",
      "dual_write_top_keys_contract_732",
    ]);
  });
});
