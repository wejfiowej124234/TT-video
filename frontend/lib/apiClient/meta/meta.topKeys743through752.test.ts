/**
 * GET /meta — 743–752 域 `*_top_keys` 序（与 `meta.topKeys753through761.test` 互补）
 */
import { describe, it, expect } from "vitest";
import {
  ITINERARIES_META_TOP_KEYS,
  ORDERS_META_TOP_KEYS,
  DISCOVER_META_TOP_KEYS,
  PRODUCT_COUNTRIES_META_TOP_KEYS,
  DID_RANK_META_TOP_KEYS,
  PRODUCT_ROLES_META_TOP_KEYS,
  AUTH_REGISTRATION_META_TOP_KEYS,
  AUTH_META_TOP_KEYS,
  SEED_TEST_ACCOUNTS_META_TOP_KEYS,
  GUIDES_META_TOP_KEYS,
} from ".";

describe("ITINERARIES_META_TOP_KEYS (743)", () => {
  it("matches health_meta ITINERARIES_META_TOP_KEYS / GET /meta itineraries.itineraries_top_keys order", () => {
    expect([...ITINERARIES_META_TOP_KEYS]).toEqual([
      "strict_db_write",
      "dual_write_order",
      "rule",
      "itineraries_top_keys",
      "itineraries_top_keys_contract_743",
    ]);
  });
});

describe("ORDERS_META_TOP_KEYS (744)", () => {
  it("matches health_meta ORDERS_META_TOP_KEYS / GET /meta orders.orders_top_keys order", () => {
    expect([...ORDERS_META_TOP_KEYS]).toEqual([
      "strict_db_write",
      "dual_write_order",
      "rule",
      "list_pagination",
      "fee_route_country_ssot",
      "deadline_rating_observability",
      "order_mock_pay_enabled",
      "orders_top_keys",
      "orders_top_keys_contract_744",
    ]);
  });
});

describe("DISCOVER_META_TOP_KEYS (745)", () => {
  it("matches health_meta DISCOVER_META_TOP_KEYS / GET /meta discover.discover_top_keys order", () => {
    expect([...DISCOVER_META_TOP_KEYS]).toEqual([
      "strict_db_write",
      "dual_write_order",
      "rule",
      "orders_pagination",
      "discover_top_keys",
      "discover_top_keys_contract_745",
    ]);
  });
});

describe("PRODUCT_COUNTRIES_META_TOP_KEYS (746)", () => {
  it("matches health_meta PRODUCT_COUNTRIES_META_TOP_KEYS / GET /meta product_countries.product_countries_top_keys order", () => {
    expect([...PRODUCT_COUNTRIES_META_TOP_KEYS]).toEqual([
      "strict_db_write",
      "dual_write_order",
      "rule",
      "iso3166_alpha2",
      "name_zh",
      "product_countries_top_keys",
      "product_countries_top_keys_contract_746",
    ]);
  });
});

describe("DID_RANK_META_TOP_KEYS (747)", () => {
  it("matches health_meta DID_RANK_META_TOP_KEYS / GET /meta did_rank.did_rank_top_keys order", () => {
    expect([...DID_RANK_META_TOP_KEYS]).toEqual([
      "strict_db_write",
      "dual_write_order",
      "rule",
      "chain_off_mounted",
      "chain_off_db_pool",
      "guides_community_penalty_exclusion",
      "did_rank_top_keys",
      "did_rank_top_keys_contract_747",
    ]);
  });
});

describe("PRODUCT_ROLES_META_TOP_KEYS (748)", () => {
  it("matches health_meta PRODUCT_ROLES_META_TOP_KEYS / GET /meta product_roles.product_roles_top_keys order", () => {
    expect([...PRODUCT_ROLES_META_TOP_KEYS]).toEqual([
      "strict_db_write",
      "dual_write_order",
      "rule",
      "users_role_stored",
      "me_public_role_mapping",
      "protocol_roles_target_87",
      "provider_in_users_role",
      "region_steward_in_users_role",
      "product_roles_top_keys",
      "product_roles_top_keys_contract_748",
    ]);
  });
});

describe("AUTH_REGISTRATION_META_TOP_KEYS (749)", () => {
  it("matches health_meta AUTH_REGISTRATION_META_TOP_KEYS / GET /meta auth.registration.auth_registration_top_keys order", () => {
    expect([...AUTH_REGISTRATION_META_TOP_KEYS]).toEqual([
      "strict_db_write",
      "dual_write_order",
      "rule",
      "self_serve_roles_allowed",
      "request_role_aliases",
      "default_role",
      "invalid_role_error_key",
      "arbitrator_seed_env",
      "guide_via_separate_flow_only",
      "auth_registration_top_keys",
      "auth_registration_top_keys_contract_749",
    ]);
  });
});

describe("AUTH_META_TOP_KEYS (750)", () => {
  it("matches health_meta AUTH_META_TOP_KEYS / GET /meta auth.auth_top_keys order", () => {
    expect([...AUTH_META_TOP_KEYS]).toEqual([
      "strict_db_write",
      "registration",
      "rule",
      "auth_top_keys",
      "auth_top_keys_contract_750",
    ]);
  });
});

describe("SEED_TEST_ACCOUNTS_META_TOP_KEYS (751)", () => {
  it("matches health_meta SEED_TEST_ACCOUNTS_META_TOP_KEYS / GET /meta seed_test_accounts order", () => {
    expect([...SEED_TEST_ACCOUNTS_META_TOP_KEYS]).toEqual([
      "strict_db_write",
      "rule",
      "seed_test_accounts_top_keys",
      "seed_test_accounts_top_keys_contract_751",
    ]);
  });
});

describe("GUIDES_META_TOP_KEYS (752)", () => {
  it("matches health_meta GUIDES_META_TOP_KEYS / GET /meta guides order", () => {
    expect([...GUIDES_META_TOP_KEYS]).toEqual([
      "strict_db_write",
      "rule",
      "guides_top_keys",
      "guides_top_keys_contract_752",
    ]);
  });
});
