/**
 * GET /meta（健康与版本等）
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiUrl, routes } from "../api";
import {
  CHAIN_META_TOP_KEYS,
  CHAIN_CONTRACTS_META_TOP_KEYS,
  DUAL_WRITE_META_TOP_KEYS,
  FINALITY_DISCIPLINE_META_TOP_KEYS,
  ADMIN_EXPORTS_META_TOP_KEYS,
  CHARGEBACK_POLICY_META_TOP_KEYS,
  AUTHORITY_META_TOP_KEYS,
  PAUSE_META_TOP_KEYS,
  EVIDENCE_META_TOP_KEYS,
  ORDER_MESSAGES_META_TOP_KEYS,
  REVIEWS_META_TOP_KEYS,
  DISPUTE_OPEN_META_TOP_KEYS,
  DISPUTE_RESOLVE_META_TOP_KEYS,
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
  IDEMPOTENCY_CACHE_META_TOP_KEYS,
  DEFAULTS_META_TOP_KEYS,
  OUTBOX_META_TOP_KEYS,
  RATE_LIMITS_META_TOP_KEYS,
  GUIDE_UPLOAD_META_TOP_KEYS,
  META_CHAIN_RULE_762_GUIDE_UPLOAD_CLAUSE,
  META_CHAIN_RULE_763_ROOT_SERVICE_API_VERSION_CLAUSE,
  META_CHAIN_RULE_765_BUILD_META_ROOT_THIRD_KEY_CLAUSE,
  META_CHAIN_RULE_766_CHAIN_META_ROOT_FOURTH_KEY_CLAUSE,
  META_CHAIN_RULE_767_RATE_LIMITS_META_ROOT_FIFTH_KEY_CLAUSE,
  META_CHAIN_RULE_768_DATABASE_CONNECTED_META_ROOT_SIXTH_KEY_CLAUSE,
  META_CHAIN_RULE_769_DATABASE_META_ROOT_SEVENTH_KEY_CLAUSE,
  META_CHAIN_RULE_770_DUAL_WRITE_META_ROOT_EIGHTH_KEY_CLAUSE,
  META_CHAIN_RULE_771_STRICT_MODE_META_ROOT_NINTH_KEY_CLAUSE,
  META_CHAIN_RULE_772_SSOT_VERSION_META_ROOT_TENTH_KEY_CLAUSE,
  META_CHAIN_RULE_773_ADMIN_EXPORTS_META_ROOT_TWELFTH_KEY_CLAUSE,
  META_CHAIN_RULE_774_CHARGEBACK_POLICY_META_ROOT_THIRTEENTH_KEY_CLAUSE,
  META_CHAIN_RULE_775_FINALITY_N_META_ROOT_FOURTEENTH_KEY_CLAUSE,
  META_CHAIN_RULE_776_INDEXER_META_ROOT_FIFTEENTH_KEY_CLAUSE,
  META_CHAIN_RULE_777_AUTHORITY_META_ROOT_SIXTEENTH_KEY_CLAUSE,
  META_CHAIN_RULE_778_PAUSE_META_ROOT_SEVENTEENTH_KEY_CLAUSE,
  META_CHAIN_RULE_779_EVIDENCE_META_ROOT_EIGHTEENTH_KEY_CLAUSE,
  META_CHAIN_RULE_780_ORDER_MESSAGES_META_ROOT_NINETEENTH_KEY_CLAUSE,
  META_CHAIN_RULE_781_REVIEWS_META_ROOT_TWENTIETH_KEY_CLAUSE,
  META_CHAIN_RULE_782_DISPUTE_OPEN_META_ROOT_TWENTY_FIRST_KEY_CLAUSE,
  META_CHAIN_RULE_783_DISPUTE_RESOLVE_META_ROOT_TWENTY_SECOND_KEY_CLAUSE,
  META_CHAIN_RULE_784_ITINERARIES_META_ROOT_TWENTY_THIRD_KEY_CLAUSE,
  META_CHAIN_RULE_785_ORDERS_META_ROOT_TWENTY_FOURTH_KEY_CLAUSE,
  META_CHAIN_RULE_786_DISCOVER_META_ROOT_TWENTY_FIFTH_KEY_CLAUSE,
  META_CHAIN_RULE_787_PRODUCT_COUNTRIES_META_ROOT_TWENTY_SIXTH_KEY_CLAUSE,
  META_CHAIN_RULE_788_DID_RANK_META_ROOT_TWENTY_SEVENTH_KEY_CLAUSE,
  META_CHAIN_RULE_789_PRODUCT_ROLES_META_ROOT_TWENTY_EIGHTH_KEY_CLAUSE,
  META_CHAIN_RULE_790_AUTH_META_ROOT_TWENTY_NINTH_KEY_CLAUSE,
  META_CHAIN_RULE_791_SEED_TEST_ACCOUNTS_META_ROOT_THIRTIETH_KEY_CLAUSE,
  META_CHAIN_RULE_792_GUIDES_META_ROOT_THIRTY_FIRST_KEY_CLAUSE,
  META_CHAIN_RULE_793_IDEMPOTENCY_CACHE_META_ROOT_THIRTY_SECOND_KEY_CLAUSE,
  META_CHAIN_RULE_794_DEFAULTS_META_ROOT_THIRTY_THIRD_KEY_CLAUSE,
  META_CHAIN_RULE_795_OUTBOX_META_ROOT_THIRTY_FOURTH_KEY_CLAUSE,
  META_CHAIN_RULE_796_META_TOP_KEYS_META_ROOT_THIRTY_FIFTH_KEY_CLAUSE,
  META_CHAIN_RULE_797_META_TOP_KEYS_CONTRACT_META_ROOT_THIRTY_SIXTH_KEY_CLAUSE,
  META_CHAIN_RULE_798_META_TOP_KEYS_TRIPLE_THIRTY_SIX_SYNERGY_CLAUSE,
  META_CHAIN_RULE_799_META_TOP_KEYS_728_ADJACENT_DUAL_ANCHOR_CLOSURE_CLAUSE,
  META_CHAIN_RULE_800_799_CLOSURE_CHAIN729_AND_766_SERIES_CLAUSE,
  META_CHAIN_RULE_801_800_CHAIN_CONTRACTS_759_TRIPLE_WITH_799_766_729_CLAUSE,
  META_CHAIN_RULE_802_801_CONTRACTS_RULE_759_EMBED_QUAD_CLAUSE,
  META_CHAIN_RULE_803_802_800_766_CHAIN_META_SIX_WAY_CLOSURE_CLAUSE,
  META_CHAIN_RULE_804_803_CHAIN_ID_RULE_PREAMBLE_SEVEN_WAY_CLAUSE,
  META_CHAIN_RULE_805_804_CONTRACTS_CHAIN_META_SECOND_KEY_EIGHT_WAY_CLAUSE,
  META_CHAIN_RULE_806_805_CHAIN_RULE_CHAIN_META_THIRD_KEY_NINE_WAY_CLAUSE,
  SSOT_META_TOP_KEYS,
  INDEXER_META_TOP_KEYS,
  INDEXER_MEMORY_META_TOP_KEYS,
  INDEXER_CHECKPOINT_META_TOP_KEYS,
  META_BUILD_TOP_KEYS,
  META_ROOT_TOP_KEYS,
  DATABASE_META_TOP_KEYS,
  STRICT_MODE_META_TOP_KEYS,
  getMeta,
  getMetaBuild,
  readAuthRegistrationFromMeta,
  readMetaBuild,
  readMetaBuildRoot,
  readProductRolesFromMeta,
} from "./meta";

function mockTextResponse(ok: boolean, body: unknown, status?: number) {
  const st = status ?? (ok ? 200 : 500);
  return {
    ok,
    status: st,
    text: async () => JSON.stringify(body),
  };
}

describe("getMeta", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
  afterEach(() => vi.restoreAllMocks());

  it("GETs meta with x-request-id", async () => {
    const body = { status: "ok", version: "1.0.0", chain_id: 137 };
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockTextResponse(true, body));
    const out = await getMeta();
    expect(out).toMatchObject({ status: "ok", version: "1.0.0", chain_id: 137 });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      apiUrl(routes.meta),
      expect.objectContaining({
        headers: expect.objectContaining({ "x-request-id": expect.any(String) }),
      })
    );
  });

  it("parses api-shaped /meta including build (130 / 04 §7.10)", async () => {
    const body = {
      service: "traveltrust-api",
      api_version: "0.1.0",
      build: {
        git_sha: "abc123def",
        deployed_at: "2026-03-29T12:00:00Z",
        rule: "120/140",
      },
    };
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockTextResponse(true, body));
    const out = await getMeta();
    expect(readMetaBuild(out)).toEqual({
      git_sha: "abc123def",
      deployed_at: "2026-03-29T12:00:00Z",
    });
  });

  it("parses api-shaped /meta.product_roles (690/691/692)", async () => {
    const pr = {
      users_role_stored: [
        "admin",
        "arbitrator",
        "guide",
        "provider",
        "region_steward",
        "super_admin",
        "tourist",
      ],
      me_public_role_mapping: { tourist: "traveler" },
      protocol_roles_target_87: ["traveler", "guide", "provider", "region_steward"],
      provider_in_users_role: true,
      region_steward_in_users_role: true,
      rule: "87 §1.2 vs users.role — see 07 §六 6.4",
    };
    const body = { service: "traveltrust-api", product_roles: pr };
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockTextResponse(true, body));
    const out = await getMeta();
    expect(readProductRolesFromMeta(out)).toEqual(pr);
  });

  it("parses api-shaped /meta.auth.registration (694/697/749)", async () => {
    const expected = {
      self_serve_roles_allowed: ["provider", "region_steward", "tourist", "traveler"],
      request_role_aliases: {},
      default_role: "tourist",
      invalid_role_error_key: "invalid_registration_role",
      arbitrator_seed_env: "P3_SEED_ARBITRATOR_EMAIL",
      guide_via_separate_flow_only: true,
      rule: "694/697/749: POST /auth/register …",
    };
    const registration = {
      strict_db_write: false,
      dual_write_order: "read-only",
      ...expected,
      auth_registration_top_keys: [...AUTH_REGISTRATION_META_TOP_KEYS],
      auth_registration_top_keys_contract_749: "749 …",
    };
    const body = {
      service: "traveltrust-api",
      auth: { strict_db_write: false, registration, rule: "register: …" },
    };
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockTextResponse(true, body));
    const out = await getMeta();
    expect(readAuthRegistrationFromMeta(out)).toEqual(expected);
  });

  it("readMetaBuild returns null when build absent or invalid", () => {
    expect(readMetaBuild({})).toBeNull();
    expect(readMetaBuild({ build: null })).toBeNull();
    expect(readMetaBuild({ build: { deployed_at: null } })).toBeNull();
    expect(readMetaBuild({ build: { git_sha: "x", deployed_at: 1 } })).toBeNull();
  });

  it("readMetaBuild accepts null deployed_at", () => {
    expect(
      readMetaBuild({
        build: { git_sha: "unknown", deployed_at: null, rule: "r" },
      })
    ).toEqual({ git_sha: "unknown", deployed_at: null });
  });

  it("rejects on envelope error", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { status: "error", error: "unavailable" })
    );
    await expect(getMeta()).rejects.toThrow();
  });
});

describe("readAuthRegistrationFromMeta", () => {
  it("returns null when auth.registration missing or invalid", () => {
    expect(readAuthRegistrationFromMeta({})).toBeNull();
    expect(readAuthRegistrationFromMeta({ auth: {} })).toBeNull();
    expect(
      readAuthRegistrationFromMeta({
        auth: { registration: { self_serve_roles_allowed: "x" } },
      })
    ).toBeNull();
    expect(
      readAuthRegistrationFromMeta({
        auth: {
          registration: {
            self_serve_roles_allowed: ["provider", "region_steward", "tourist", "traveler"],
            request_role_aliases: { traveler: 1 },
            default_role: "tourist",
            invalid_role_error_key: "invalid_registration_role",
            arbitrator_seed_env: "P3_SEED_ARBITRATOR_EMAIL",
            guide_via_separate_flow_only: true,
            rule: "r",
          },
        },
      })
    ).toBeNull();
  });
});

describe("readProductRolesFromMeta", () => {
  it("returns null when product_roles missing or invalid", () => {
    expect(readProductRolesFromMeta({})).toBeNull();
    expect(readProductRolesFromMeta({ product_roles: null })).toBeNull();
    expect(readProductRolesFromMeta({ product_roles: [] })).toBeNull();
    expect(
      readProductRolesFromMeta({
        product_roles: {
          users_role_stored: "x",
          me_public_role_mapping: {},
          protocol_roles_target_87: [],
          provider_in_users_role: false,
          region_steward_in_users_role: false,
          rule: "r",
        },
      })
    ).toBeNull();
  });

  it("parses full product_roles object", () => {
    const pr = {
      users_role_stored: ["tourist"],
      me_public_role_mapping: { tourist: "traveler" },
      protocol_roles_target_87: ["traveler", "guide"],
      provider_in_users_role: true,
      region_steward_in_users_role: false,
      rule: "ok",
    };
    expect(readProductRolesFromMeta({ product_roles: pr })).toEqual(pr);
  });
});

describe("readMetaBuildRoot", () => {
  it("parses GET /meta/build root like nested .build", () => {
    expect(
      readMetaBuildRoot({
        git_sha: "abc",
        deployed_at: "2026-01-01T00:00:00Z",
        rule: "120/140",
      })
    ).toEqual({ git_sha: "abc", deployed_at: "2026-01-01T00:00:00Z" });
    expect(readMetaBuildRoot({ git_sha: "x", deployed_at: null, rule: "r" })).toEqual({
      git_sha: "x",
      deployed_at: null,
    });
    expect(readMetaBuildRoot({ rule: "only" })).toBeNull();
  });
});

describe("getMetaBuild", () => {
  beforeEach(() => vi.stubGlobal("fetch", vi.fn()));
  afterEach(() => vi.restoreAllMocks());

  it("GETs /meta/build with x-request-id and returns MetaBuildInfo", async () => {
    const body = { git_sha: "deadbeef", deployed_at: null, rule: "120/140" };
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(mockTextResponse(true, body));
    const out = await getMetaBuild();
    expect(out).toEqual({ git_sha: "deadbeef", deployed_at: null });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      apiUrl(routes.metaBuild),
      expect.objectContaining({
        headers: expect.objectContaining({ "x-request-id": expect.any(String) }),
      })
    );
  });

  it("throws meta_build_invalid when body lacks git_sha", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      mockTextResponse(true, { deployed_at: null, rule: "r" })
    );
    await expect(getMetaBuild()).rejects.toThrow("meta_build_invalid");
  });
});

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
      "registry_address",
      "escrow_factory_address",
      "region_steward_stake_pool_address",
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

describe("META_CHAIN_RULE_762_GUIDE_UPLOAD_CLAUSE (762)", () => {
  it("anchors chain.rule cross-link to 761 guide_upload keys", () => {
    expect(META_CHAIN_RULE_762_GUIDE_UPLOAD_CLAUSE).toContain("762");
    expect(META_CHAIN_RULE_762_GUIDE_UPLOAD_CLAUSE).toContain("guide_upload_top_keys_contract_761");
    expect(META_CHAIN_RULE_762_GUIDE_UPLOAD_CLAUSE).toContain("GUIDE_UPLOAD_META_TOP_KEYS");
  });
});

describe("META_CHAIN_RULE_765_BUILD_META_ROOT_THIRD_KEY_CLAUSE (765)", () => {
  it("anchors chain.rule cross-link to build 730 and META_ROOT_TOP_KEYS third key and 728", () => {
    expect(META_CHAIN_RULE_765_BUILD_META_ROOT_THIRD_KEY_CLAUSE).toContain("765");
    expect(META_CHAIN_RULE_765_BUILD_META_ROOT_THIRD_KEY_CLAUSE).toContain("build_top_keys_contract_730");
    expect(META_CHAIN_RULE_765_BUILD_META_ROOT_THIRD_KEY_CLAUSE).toContain("META_BUILD_TOP_KEYS");
    expect(META_CHAIN_RULE_765_BUILD_META_ROOT_THIRD_KEY_CLAUSE).toContain("META_ROOT_TOP_KEYS");
    expect(META_CHAIN_RULE_765_BUILD_META_ROOT_THIRD_KEY_CLAUSE).toContain("728");
  });
});

describe("META_CHAIN_RULE_766_CHAIN_META_ROOT_FOURTH_KEY_CLAUSE (766)", () => {
  it("anchors chain.rule cross-link to chain 729 and META_ROOT_TOP_KEYS fourth key and 728", () => {
    expect(META_CHAIN_RULE_766_CHAIN_META_ROOT_FOURTH_KEY_CLAUSE).toContain("766");
    expect(META_CHAIN_RULE_766_CHAIN_META_ROOT_FOURTH_KEY_CLAUSE).toContain("chain_top_keys_contract_729");
    expect(META_CHAIN_RULE_766_CHAIN_META_ROOT_FOURTH_KEY_CLAUSE).toContain("CHAIN_META_TOP_KEYS");
    expect(META_CHAIN_RULE_766_CHAIN_META_ROOT_FOURTH_KEY_CLAUSE).toContain("META_ROOT_TOP_KEYS");
    expect(META_CHAIN_RULE_766_CHAIN_META_ROOT_FOURTH_KEY_CLAUSE).toContain("728");
  });
});

describe("META_CHAIN_RULE_768_DATABASE_CONNECTED_META_ROOT_SIXTH_KEY_CLAUSE (768)", () => {
  it("embeds 768 + database_connected + DATABASE_META_TOP_KEYS + META_ROOT_TOP_KEYS + 728", () => {
    expect(META_CHAIN_RULE_768_DATABASE_CONNECTED_META_ROOT_SIXTH_KEY_CLAUSE).toContain("768");
    expect(META_CHAIN_RULE_768_DATABASE_CONNECTED_META_ROOT_SIXTH_KEY_CLAUSE).toContain(
      "database_connected",
    );
    expect(META_CHAIN_RULE_768_DATABASE_CONNECTED_META_ROOT_SIXTH_KEY_CLAUSE).toContain(
      "database.connected",
    );
    expect(META_CHAIN_RULE_768_DATABASE_CONNECTED_META_ROOT_SIXTH_KEY_CLAUSE).toContain(
      "DATABASE_META_TOP_KEYS",
    );
    expect(META_CHAIN_RULE_768_DATABASE_CONNECTED_META_ROOT_SIXTH_KEY_CLAUSE).toContain("connected");
    expect(META_CHAIN_RULE_768_DATABASE_CONNECTED_META_ROOT_SIXTH_KEY_CLAUSE).toContain(
      "META_ROOT_TOP_KEYS",
    );
    expect(META_CHAIN_RULE_768_DATABASE_CONNECTED_META_ROOT_SIXTH_KEY_CLAUSE).toContain("728");
  });
});

describe("META_CHAIN_RULE_769_DATABASE_META_ROOT_SEVENTH_KEY_CLAUSE (769)", () => {
  it("embeds 769 + database object + database_top_keys + DATABASE_META_TOP_KEYS + META_ROOT_TOP_KEYS + 728", () => {
    expect(META_CHAIN_RULE_769_DATABASE_META_ROOT_SEVENTH_KEY_CLAUSE).toContain("769");
    expect(META_CHAIN_RULE_769_DATABASE_META_ROOT_SEVENTH_KEY_CLAUSE).toContain("database_top_keys");
    expect(META_CHAIN_RULE_769_DATABASE_META_ROOT_SEVENTH_KEY_CLAUSE).toContain(
      "database_top_keys_contract_760",
    );
    expect(META_CHAIN_RULE_769_DATABASE_META_ROOT_SEVENTH_KEY_CLAUSE).toContain(
      "DATABASE_META_TOP_KEYS",
    );
    expect(META_CHAIN_RULE_769_DATABASE_META_ROOT_SEVENTH_KEY_CLAUSE).toContain("META_ROOT_TOP_KEYS");
    expect(META_CHAIN_RULE_769_DATABASE_META_ROOT_SEVENTH_KEY_CLAUSE).toContain("database");
    expect(META_CHAIN_RULE_769_DATABASE_META_ROOT_SEVENTH_KEY_CLAUSE).toContain("728");
  });
});

describe("META_CHAIN_RULE_770_DUAL_WRITE_META_ROOT_EIGHTH_KEY_CLAUSE (770)", () => {
  it("embeds 770 + dual_write object + dual_write_top_keys + DUAL_WRITE_META_TOP_KEYS + META_ROOT_TOP_KEYS + 728", () => {
    expect(META_CHAIN_RULE_770_DUAL_WRITE_META_ROOT_EIGHTH_KEY_CLAUSE).toContain("770");
    expect(META_CHAIN_RULE_770_DUAL_WRITE_META_ROOT_EIGHTH_KEY_CLAUSE).toContain("dual_write_top_keys");
    expect(META_CHAIN_RULE_770_DUAL_WRITE_META_ROOT_EIGHTH_KEY_CLAUSE).toContain(
      "dual_write_top_keys_contract_732",
    );
    expect(META_CHAIN_RULE_770_DUAL_WRITE_META_ROOT_EIGHTH_KEY_CLAUSE).toContain(
      "DUAL_WRITE_META_TOP_KEYS",
    );
    expect(META_CHAIN_RULE_770_DUAL_WRITE_META_ROOT_EIGHTH_KEY_CLAUSE).toContain("META_ROOT_TOP_KEYS");
    expect(META_CHAIN_RULE_770_DUAL_WRITE_META_ROOT_EIGHTH_KEY_CLAUSE).toContain("dual_write");
    expect(META_CHAIN_RULE_770_DUAL_WRITE_META_ROOT_EIGHTH_KEY_CLAUSE).toContain("728");
  });
});

describe("META_CHAIN_RULE_771_STRICT_MODE_META_ROOT_NINTH_KEY_CLAUSE (771)", () => {
  it("embeds 771 + strict_mode object + strict_mode_top_keys + STRICT_MODE_META_TOP_KEYS + META_ROOT_TOP_KEYS + 728", () => {
    expect(META_CHAIN_RULE_771_STRICT_MODE_META_ROOT_NINTH_KEY_CLAUSE).toContain("771");
    expect(META_CHAIN_RULE_771_STRICT_MODE_META_ROOT_NINTH_KEY_CLAUSE).toContain("strict_mode_top_keys");
    expect(META_CHAIN_RULE_771_STRICT_MODE_META_ROOT_NINTH_KEY_CLAUSE).toContain(
      "strict_mode_top_keys_contract_731",
    );
    expect(META_CHAIN_RULE_771_STRICT_MODE_META_ROOT_NINTH_KEY_CLAUSE).toContain(
      "STRICT_MODE_META_TOP_KEYS",
    );
    expect(META_CHAIN_RULE_771_STRICT_MODE_META_ROOT_NINTH_KEY_CLAUSE).toContain("META_ROOT_TOP_KEYS");
    expect(META_CHAIN_RULE_771_STRICT_MODE_META_ROOT_NINTH_KEY_CLAUSE).toContain("strict_mode");
    expect(META_CHAIN_RULE_771_STRICT_MODE_META_ROOT_NINTH_KEY_CLAUSE).toContain("728");
  });
});

describe("META_CHAIN_RULE_772_SSOT_VERSION_META_ROOT_TENTH_KEY_CLAUSE (772)", () => {
  it("embeds 772 + ssot_version + strict_mode.rule + 733 ssot + SSOT_META_TOP_KEYS + META_ROOT_TOP_KEYS + 728", () => {
    expect(META_CHAIN_RULE_772_SSOT_VERSION_META_ROOT_TENTH_KEY_CLAUSE).toContain("772");
    expect(META_CHAIN_RULE_772_SSOT_VERSION_META_ROOT_TENTH_KEY_CLAUSE).toContain("ssot_version");
    expect(META_CHAIN_RULE_772_SSOT_VERSION_META_ROOT_TENTH_KEY_CLAUSE).toContain("strict_mode.rule");
    expect(META_CHAIN_RULE_772_SSOT_VERSION_META_ROOT_TENTH_KEY_CLAUSE).toContain("733");
    expect(META_CHAIN_RULE_772_SSOT_VERSION_META_ROOT_TENTH_KEY_CLAUSE).toContain("ssot_top_keys_contract_733");
    expect(META_CHAIN_RULE_772_SSOT_VERSION_META_ROOT_TENTH_KEY_CLAUSE).toContain("SSOT_META_TOP_KEYS");
    expect(META_CHAIN_RULE_772_SSOT_VERSION_META_ROOT_TENTH_KEY_CLAUSE).toContain("META_ROOT_TOP_KEYS");
    expect(META_CHAIN_RULE_772_SSOT_VERSION_META_ROOT_TENTH_KEY_CLAUSE).toContain("728");
  });
});

describe("META_CHAIN_RULE_773_ADMIN_EXPORTS_META_ROOT_TWELFTH_KEY_CLAUSE (773)", () => {
  it("embeds 773 + admin_exports + 734 + ADMIN_EXPORTS_META_TOP_KEYS + META_ROOT_TOP_KEYS twelfth key + 728", () => {
    expect(META_CHAIN_RULE_773_ADMIN_EXPORTS_META_ROOT_TWELFTH_KEY_CLAUSE).toContain("773");
    expect(META_CHAIN_RULE_773_ADMIN_EXPORTS_META_ROOT_TWELFTH_KEY_CLAUSE).toContain("admin_exports");
    expect(META_CHAIN_RULE_773_ADMIN_EXPORTS_META_ROOT_TWELFTH_KEY_CLAUSE).toContain(
      "admin_exports_top_keys_contract_734",
    );
    expect(META_CHAIN_RULE_773_ADMIN_EXPORTS_META_ROOT_TWELFTH_KEY_CLAUSE).toContain(
      "ADMIN_EXPORTS_META_TOP_KEYS",
    );
    expect(META_CHAIN_RULE_773_ADMIN_EXPORTS_META_ROOT_TWELFTH_KEY_CLAUSE).toContain("META_ROOT_TOP_KEYS");
    expect(META_CHAIN_RULE_773_ADMIN_EXPORTS_META_ROOT_TWELFTH_KEY_CLAUSE).toContain("728");
  });
});

describe("META_CHAIN_RULE_774_CHARGEBACK_POLICY_META_ROOT_THIRTEENTH_KEY_CLAUSE (774)", () => {
  it("embeds 774 + chargeback_policy + 735 + CHARGEBACK_POLICY_META_TOP_KEYS + META_ROOT_TOP_KEYS thirteenth key + 728", () => {
    expect(META_CHAIN_RULE_774_CHARGEBACK_POLICY_META_ROOT_THIRTEENTH_KEY_CLAUSE).toContain("774");
    expect(META_CHAIN_RULE_774_CHARGEBACK_POLICY_META_ROOT_THIRTEENTH_KEY_CLAUSE).toContain("chargeback_policy");
    expect(META_CHAIN_RULE_774_CHARGEBACK_POLICY_META_ROOT_THIRTEENTH_KEY_CLAUSE).toContain(
      "chargeback_policy_top_keys_contract_735",
    );
    expect(META_CHAIN_RULE_774_CHARGEBACK_POLICY_META_ROOT_THIRTEENTH_KEY_CLAUSE).toContain(
      "CHARGEBACK_POLICY_META_TOP_KEYS",
    );
    expect(META_CHAIN_RULE_774_CHARGEBACK_POLICY_META_ROOT_THIRTEENTH_KEY_CLAUSE).toContain("META_ROOT_TOP_KEYS");
    expect(META_CHAIN_RULE_774_CHARGEBACK_POLICY_META_ROOT_THIRTEENTH_KEY_CLAUSE).toContain("728");
  });
});

describe("META_CHAIN_RULE_775_FINALITY_N_META_ROOT_FOURTEENTH_KEY_CLAUSE (775)", () => {
  it("embeds 775 + finality_n + FINALITY_N + indexer.finality_n + META_ROOT_TOP_KEYS fourteenth key + 728", () => {
    expect(META_CHAIN_RULE_775_FINALITY_N_META_ROOT_FOURTEENTH_KEY_CLAUSE).toContain("775");
    expect(META_CHAIN_RULE_775_FINALITY_N_META_ROOT_FOURTEENTH_KEY_CLAUSE).toContain("finality_n");
    expect(META_CHAIN_RULE_775_FINALITY_N_META_ROOT_FOURTEENTH_KEY_CLAUSE).toContain("FINALITY_N");
    expect(META_CHAIN_RULE_775_FINALITY_N_META_ROOT_FOURTEENTH_KEY_CLAUSE).toContain("GET /meta.indexer.finality_n");
    expect(META_CHAIN_RULE_775_FINALITY_N_META_ROOT_FOURTEENTH_KEY_CLAUSE).toContain("META_ROOT_TOP_KEYS");
    expect(META_CHAIN_RULE_775_FINALITY_N_META_ROOT_FOURTEENTH_KEY_CLAUSE).toContain("728");
  });
});

describe("META_CHAIN_RULE_776_INDEXER_META_ROOT_FIFTEENTH_KEY_CLAUSE (776)", () => {
  it("embeds 776 + indexer + 727 contracts + INDEXER_META_TOP_KEYS + META_ROOT_TOP_KEYS fifteenth key + 728", () => {
    expect(META_CHAIN_RULE_776_INDEXER_META_ROOT_FIFTEENTH_KEY_CLAUSE).toContain("776");
    expect(META_CHAIN_RULE_776_INDEXER_META_ROOT_FIFTEENTH_KEY_CLAUSE).toContain("indexer_top_keys");
    expect(META_CHAIN_RULE_776_INDEXER_META_ROOT_FIFTEENTH_KEY_CLAUSE).toContain("indexer_top_keys_contract_727");
    expect(META_CHAIN_RULE_776_INDEXER_META_ROOT_FIFTEENTH_KEY_CLAUSE).toContain("INDEXER_META_TOP_KEYS");
    expect(META_CHAIN_RULE_776_INDEXER_META_ROOT_FIFTEENTH_KEY_CLAUSE).toContain("META_ROOT_TOP_KEYS");
    expect(META_CHAIN_RULE_776_INDEXER_META_ROOT_FIFTEENTH_KEY_CLAUSE).toContain("728");
  });
});

describe("META_CHAIN_RULE_777_AUTHORITY_META_ROOT_SIXTEENTH_KEY_CLAUSE (777)", () => {
  it("embeds 777 + authority + 736 contracts + AUTHORITY_META_TOP_KEYS + META_ROOT_TOP_KEYS sixteenth key + 728", () => {
    expect(META_CHAIN_RULE_777_AUTHORITY_META_ROOT_SIXTEENTH_KEY_CLAUSE).toContain("777");
    expect(META_CHAIN_RULE_777_AUTHORITY_META_ROOT_SIXTEENTH_KEY_CLAUSE).toContain("authority_top_keys");
    expect(META_CHAIN_RULE_777_AUTHORITY_META_ROOT_SIXTEENTH_KEY_CLAUSE).toContain("authority_top_keys_contract_736");
    expect(META_CHAIN_RULE_777_AUTHORITY_META_ROOT_SIXTEENTH_KEY_CLAUSE).toContain("AUTHORITY_META_TOP_KEYS");
    expect(META_CHAIN_RULE_777_AUTHORITY_META_ROOT_SIXTEENTH_KEY_CLAUSE).toContain("META_ROOT_TOP_KEYS");
    expect(META_CHAIN_RULE_777_AUTHORITY_META_ROOT_SIXTEENTH_KEY_CLAUSE).toContain("728");
  });
});

describe("META_CHAIN_RULE_778_PAUSE_META_ROOT_SEVENTEENTH_KEY_CLAUSE (778)", () => {
  it("embeds 778 + pause + 737 contracts + PAUSE_META_TOP_KEYS + META_ROOT_TOP_KEYS seventeenth key + 728", () => {
    expect(META_CHAIN_RULE_778_PAUSE_META_ROOT_SEVENTEENTH_KEY_CLAUSE).toContain("778");
    expect(META_CHAIN_RULE_778_PAUSE_META_ROOT_SEVENTEENTH_KEY_CLAUSE).toContain("pause_top_keys");
    expect(META_CHAIN_RULE_778_PAUSE_META_ROOT_SEVENTEENTH_KEY_CLAUSE).toContain("pause_top_keys_contract_737");
    expect(META_CHAIN_RULE_778_PAUSE_META_ROOT_SEVENTEENTH_KEY_CLAUSE).toContain("PAUSE_META_TOP_KEYS");
    expect(META_CHAIN_RULE_778_PAUSE_META_ROOT_SEVENTEENTH_KEY_CLAUSE).toContain("META_ROOT_TOP_KEYS");
    expect(META_CHAIN_RULE_778_PAUSE_META_ROOT_SEVENTEENTH_KEY_CLAUSE).toContain("728");
  });
});

describe("META_CHAIN_RULE_779_EVIDENCE_META_ROOT_EIGHTEENTH_KEY_CLAUSE (779)", () => {
  it("embeds 779 + evidence + 738 contracts + EVIDENCE_META_TOP_KEYS + META_ROOT_TOP_KEYS eighteenth key + 728", () => {
    expect(META_CHAIN_RULE_779_EVIDENCE_META_ROOT_EIGHTEENTH_KEY_CLAUSE).toContain("779");
    expect(META_CHAIN_RULE_779_EVIDENCE_META_ROOT_EIGHTEENTH_KEY_CLAUSE).toContain("evidence_top_keys");
    expect(META_CHAIN_RULE_779_EVIDENCE_META_ROOT_EIGHTEENTH_KEY_CLAUSE).toContain("evidence_top_keys_contract_738");
    expect(META_CHAIN_RULE_779_EVIDENCE_META_ROOT_EIGHTEENTH_KEY_CLAUSE).toContain("EVIDENCE_META_TOP_KEYS");
    expect(META_CHAIN_RULE_779_EVIDENCE_META_ROOT_EIGHTEENTH_KEY_CLAUSE).toContain("META_ROOT_TOP_KEYS");
    expect(META_CHAIN_RULE_779_EVIDENCE_META_ROOT_EIGHTEENTH_KEY_CLAUSE).toContain("728");
  });
});

describe("META_CHAIN_RULE_780_ORDER_MESSAGES_META_ROOT_NINETEENTH_KEY_CLAUSE (780)", () => {
  it("embeds 780 + order_messages + 739 contracts + ORDER_MESSAGES_META_TOP_KEYS + META_ROOT_TOP_KEYS nineteenth key + 728", () => {
    expect(META_CHAIN_RULE_780_ORDER_MESSAGES_META_ROOT_NINETEENTH_KEY_CLAUSE).toContain("780");
    expect(META_CHAIN_RULE_780_ORDER_MESSAGES_META_ROOT_NINETEENTH_KEY_CLAUSE).toContain("order_messages_top_keys");
    expect(META_CHAIN_RULE_780_ORDER_MESSAGES_META_ROOT_NINETEENTH_KEY_CLAUSE).toContain("order_messages_top_keys_contract_739");
    expect(META_CHAIN_RULE_780_ORDER_MESSAGES_META_ROOT_NINETEENTH_KEY_CLAUSE).toContain("ORDER_MESSAGES_META_TOP_KEYS");
    expect(META_CHAIN_RULE_780_ORDER_MESSAGES_META_ROOT_NINETEENTH_KEY_CLAUSE).toContain("META_ROOT_TOP_KEYS");
    expect(META_CHAIN_RULE_780_ORDER_MESSAGES_META_ROOT_NINETEENTH_KEY_CLAUSE).toContain("728");
  });
});

describe("META_CHAIN_RULE_781_REVIEWS_META_ROOT_TWENTIETH_KEY_CLAUSE (781)", () => {
  it("embeds 781 + reviews + 740 contracts + REVIEWS_META_TOP_KEYS + META_ROOT_TOP_KEYS twentieth key + 728", () => {
    expect(META_CHAIN_RULE_781_REVIEWS_META_ROOT_TWENTIETH_KEY_CLAUSE).toContain("781");
    expect(META_CHAIN_RULE_781_REVIEWS_META_ROOT_TWENTIETH_KEY_CLAUSE).toContain("reviews_top_keys");
    expect(META_CHAIN_RULE_781_REVIEWS_META_ROOT_TWENTIETH_KEY_CLAUSE).toContain("reviews_top_keys_contract_740");
    expect(META_CHAIN_RULE_781_REVIEWS_META_ROOT_TWENTIETH_KEY_CLAUSE).toContain("REVIEWS_META_TOP_KEYS");
    expect(META_CHAIN_RULE_781_REVIEWS_META_ROOT_TWENTIETH_KEY_CLAUSE).toContain("META_ROOT_TOP_KEYS");
    expect(META_CHAIN_RULE_781_REVIEWS_META_ROOT_TWENTIETH_KEY_CLAUSE).toContain("728");
  });
});

describe("META_CHAIN_RULE_782_DISPUTE_OPEN_META_ROOT_TWENTY_FIRST_KEY_CLAUSE (782)", () => {
  it("embeds 782 + dispute_open + 741 contracts + DISPUTE_OPEN_META_TOP_KEYS + META_ROOT_TOP_KEYS twenty-first key + 728", () => {
    expect(META_CHAIN_RULE_782_DISPUTE_OPEN_META_ROOT_TWENTY_FIRST_KEY_CLAUSE).toContain("782");
    expect(META_CHAIN_RULE_782_DISPUTE_OPEN_META_ROOT_TWENTY_FIRST_KEY_CLAUSE).toContain("dispute_open_top_keys");
    expect(META_CHAIN_RULE_782_DISPUTE_OPEN_META_ROOT_TWENTY_FIRST_KEY_CLAUSE).toContain("dispute_open_top_keys_contract_741");
    expect(META_CHAIN_RULE_782_DISPUTE_OPEN_META_ROOT_TWENTY_FIRST_KEY_CLAUSE).toContain("DISPUTE_OPEN_META_TOP_KEYS");
    expect(META_CHAIN_RULE_782_DISPUTE_OPEN_META_ROOT_TWENTY_FIRST_KEY_CLAUSE).toContain("META_ROOT_TOP_KEYS");
    expect(META_CHAIN_RULE_782_DISPUTE_OPEN_META_ROOT_TWENTY_FIRST_KEY_CLAUSE).toContain("728");
  });
});

describe("META_CHAIN_RULE_783_DISPUTE_RESOLVE_META_ROOT_TWENTY_SECOND_KEY_CLAUSE (783)", () => {
  it("embeds 783 + dispute_resolve + 742 contracts + DISPUTE_RESOLVE_META_TOP_KEYS + META_ROOT_TOP_KEYS twenty-second key + 728", () => {
    expect(META_CHAIN_RULE_783_DISPUTE_RESOLVE_META_ROOT_TWENTY_SECOND_KEY_CLAUSE).toContain("783");
    expect(META_CHAIN_RULE_783_DISPUTE_RESOLVE_META_ROOT_TWENTY_SECOND_KEY_CLAUSE).toContain(
      "dispute_resolve_top_keys",
    );
    expect(META_CHAIN_RULE_783_DISPUTE_RESOLVE_META_ROOT_TWENTY_SECOND_KEY_CLAUSE).toContain(
      "dispute_resolve_top_keys_contract_742",
    );
    expect(META_CHAIN_RULE_783_DISPUTE_RESOLVE_META_ROOT_TWENTY_SECOND_KEY_CLAUSE).toContain(
      "DISPUTE_RESOLVE_META_TOP_KEYS",
    );
    expect(META_CHAIN_RULE_783_DISPUTE_RESOLVE_META_ROOT_TWENTY_SECOND_KEY_CLAUSE).toContain("META_ROOT_TOP_KEYS");
    expect(META_CHAIN_RULE_783_DISPUTE_RESOLVE_META_ROOT_TWENTY_SECOND_KEY_CLAUSE).toContain("728");
  });
});

describe("META_CHAIN_RULE_784_ITINERARIES_META_ROOT_TWENTY_THIRD_KEY_CLAUSE (784)", () => {
  it("embeds 784 + itineraries + 743 contracts + ITINERARIES_META_TOP_KEYS + META_ROOT_TOP_KEYS twenty-third key + 728", () => {
    expect(META_CHAIN_RULE_784_ITINERARIES_META_ROOT_TWENTY_THIRD_KEY_CLAUSE).toContain("784");
    expect(META_CHAIN_RULE_784_ITINERARIES_META_ROOT_TWENTY_THIRD_KEY_CLAUSE).toContain("itineraries_top_keys");
    expect(META_CHAIN_RULE_784_ITINERARIES_META_ROOT_TWENTY_THIRD_KEY_CLAUSE).toContain(
      "itineraries_top_keys_contract_743",
    );
    expect(META_CHAIN_RULE_784_ITINERARIES_META_ROOT_TWENTY_THIRD_KEY_CLAUSE).toContain(
      "ITINERARIES_META_TOP_KEYS",
    );
    expect(META_CHAIN_RULE_784_ITINERARIES_META_ROOT_TWENTY_THIRD_KEY_CLAUSE).toContain("META_ROOT_TOP_KEYS");
    expect(META_CHAIN_RULE_784_ITINERARIES_META_ROOT_TWENTY_THIRD_KEY_CLAUSE).toContain("728");
  });
});

describe("META_CHAIN_RULE_785_ORDERS_META_ROOT_TWENTY_FOURTH_KEY_CLAUSE (785)", () => {
  it("embeds 785 + orders + 744 contracts + ORDERS_META_TOP_KEYS + META_ROOT_TOP_KEYS twenty-fourth key + 728", () => {
    expect(META_CHAIN_RULE_785_ORDERS_META_ROOT_TWENTY_FOURTH_KEY_CLAUSE).toContain("785");
    expect(META_CHAIN_RULE_785_ORDERS_META_ROOT_TWENTY_FOURTH_KEY_CLAUSE).toContain("orders_top_keys");
    expect(META_CHAIN_RULE_785_ORDERS_META_ROOT_TWENTY_FOURTH_KEY_CLAUSE).toContain(
      "orders_top_keys_contract_744",
    );
    expect(META_CHAIN_RULE_785_ORDERS_META_ROOT_TWENTY_FOURTH_KEY_CLAUSE).toContain("ORDERS_META_TOP_KEYS");
    expect(META_CHAIN_RULE_785_ORDERS_META_ROOT_TWENTY_FOURTH_KEY_CLAUSE).toContain("META_ROOT_TOP_KEYS");
    expect(META_CHAIN_RULE_785_ORDERS_META_ROOT_TWENTY_FOURTH_KEY_CLAUSE).toContain("728");
  });
});

describe("META_CHAIN_RULE_786_DISCOVER_META_ROOT_TWENTY_FIFTH_KEY_CLAUSE (786)", () => {
  it("embeds 786 + discover + 745 contracts + DISCOVER_META_TOP_KEYS + META_ROOT_TOP_KEYS twenty-fifth key + 728", () => {
    expect(META_CHAIN_RULE_786_DISCOVER_META_ROOT_TWENTY_FIFTH_KEY_CLAUSE).toContain("786");
    expect(META_CHAIN_RULE_786_DISCOVER_META_ROOT_TWENTY_FIFTH_KEY_CLAUSE).toContain("discover_top_keys");
    expect(META_CHAIN_RULE_786_DISCOVER_META_ROOT_TWENTY_FIFTH_KEY_CLAUSE).toContain(
      "discover_top_keys_contract_745",
    );
    expect(META_CHAIN_RULE_786_DISCOVER_META_ROOT_TWENTY_FIFTH_KEY_CLAUSE).toContain("DISCOVER_META_TOP_KEYS");
    expect(META_CHAIN_RULE_786_DISCOVER_META_ROOT_TWENTY_FIFTH_KEY_CLAUSE).toContain("META_ROOT_TOP_KEYS");
    expect(META_CHAIN_RULE_786_DISCOVER_META_ROOT_TWENTY_FIFTH_KEY_CLAUSE).toContain("728");
  });
});

describe("META_CHAIN_RULE_787_PRODUCT_COUNTRIES_META_ROOT_TWENTY_SIXTH_KEY_CLAUSE (787)", () => {
  it("embeds 787 + product_countries + 746 contracts + PRODUCT_COUNTRIES_META_TOP_KEYS + META_ROOT_TOP_KEYS twenty-sixth key + 728", () => {
    expect(META_CHAIN_RULE_787_PRODUCT_COUNTRIES_META_ROOT_TWENTY_SIXTH_KEY_CLAUSE).toContain("787");
    expect(META_CHAIN_RULE_787_PRODUCT_COUNTRIES_META_ROOT_TWENTY_SIXTH_KEY_CLAUSE).toContain(
      "product_countries_top_keys",
    );
    expect(META_CHAIN_RULE_787_PRODUCT_COUNTRIES_META_ROOT_TWENTY_SIXTH_KEY_CLAUSE).toContain(
      "product_countries_top_keys_contract_746",
    );
    expect(META_CHAIN_RULE_787_PRODUCT_COUNTRIES_META_ROOT_TWENTY_SIXTH_KEY_CLAUSE).toContain(
      "PRODUCT_COUNTRIES_META_TOP_KEYS",
    );
    expect(META_CHAIN_RULE_787_PRODUCT_COUNTRIES_META_ROOT_TWENTY_SIXTH_KEY_CLAUSE).toContain("META_ROOT_TOP_KEYS");
    expect(META_CHAIN_RULE_787_PRODUCT_COUNTRIES_META_ROOT_TWENTY_SIXTH_KEY_CLAUSE).toContain("728");
  });
});

describe("META_CHAIN_RULE_788_DID_RANK_META_ROOT_TWENTY_SEVENTH_KEY_CLAUSE (788)", () => {
  it("embeds 788 + did_rank + 747 contracts + DID_RANK_META_TOP_KEYS + META_ROOT_TOP_KEYS twenty-seventh key + 728", () => {
    expect(META_CHAIN_RULE_788_DID_RANK_META_ROOT_TWENTY_SEVENTH_KEY_CLAUSE).toContain("788");
    expect(META_CHAIN_RULE_788_DID_RANK_META_ROOT_TWENTY_SEVENTH_KEY_CLAUSE).toContain("did_rank_top_keys");
    expect(META_CHAIN_RULE_788_DID_RANK_META_ROOT_TWENTY_SEVENTH_KEY_CLAUSE).toContain(
      "did_rank_top_keys_contract_747",
    );
    expect(META_CHAIN_RULE_788_DID_RANK_META_ROOT_TWENTY_SEVENTH_KEY_CLAUSE).toContain("DID_RANK_META_TOP_KEYS");
    expect(META_CHAIN_RULE_788_DID_RANK_META_ROOT_TWENTY_SEVENTH_KEY_CLAUSE).toContain("META_ROOT_TOP_KEYS");
    expect(META_CHAIN_RULE_788_DID_RANK_META_ROOT_TWENTY_SEVENTH_KEY_CLAUSE).toContain("728");
  });
});

describe("META_CHAIN_RULE_789_PRODUCT_ROLES_META_ROOT_TWENTY_EIGHTH_KEY_CLAUSE (789)", () => {
  it("embeds 789 + product_roles + 748 contracts + PRODUCT_ROLES_META_TOP_KEYS + META_ROOT_TOP_KEYS twenty-eighth key + 728", () => {
    expect(META_CHAIN_RULE_789_PRODUCT_ROLES_META_ROOT_TWENTY_EIGHTH_KEY_CLAUSE).toContain("789");
    expect(META_CHAIN_RULE_789_PRODUCT_ROLES_META_ROOT_TWENTY_EIGHTH_KEY_CLAUSE).toContain(
      "product_roles_top_keys",
    );
    expect(META_CHAIN_RULE_789_PRODUCT_ROLES_META_ROOT_TWENTY_EIGHTH_KEY_CLAUSE).toContain(
      "product_roles_top_keys_contract_748",
    );
    expect(META_CHAIN_RULE_789_PRODUCT_ROLES_META_ROOT_TWENTY_EIGHTH_KEY_CLAUSE).toContain(
      "PRODUCT_ROLES_META_TOP_KEYS",
    );
    expect(META_CHAIN_RULE_789_PRODUCT_ROLES_META_ROOT_TWENTY_EIGHTH_KEY_CLAUSE).toContain("META_ROOT_TOP_KEYS");
    expect(META_CHAIN_RULE_789_PRODUCT_ROLES_META_ROOT_TWENTY_EIGHTH_KEY_CLAUSE).toContain("728");
  });
});

describe("META_CHAIN_RULE_790_AUTH_META_ROOT_TWENTY_NINTH_KEY_CLAUSE (790)", () => {
  it("embeds 790 + auth + 750 contracts + AUTH_META_TOP_KEYS + META_ROOT_TOP_KEYS twenty-ninth key + 728", () => {
    expect(META_CHAIN_RULE_790_AUTH_META_ROOT_TWENTY_NINTH_KEY_CLAUSE).toContain("790");
    expect(META_CHAIN_RULE_790_AUTH_META_ROOT_TWENTY_NINTH_KEY_CLAUSE).toContain("auth_top_keys");
    expect(META_CHAIN_RULE_790_AUTH_META_ROOT_TWENTY_NINTH_KEY_CLAUSE).toContain(
      "auth_top_keys_contract_750",
    );
    expect(META_CHAIN_RULE_790_AUTH_META_ROOT_TWENTY_NINTH_KEY_CLAUSE).toContain("AUTH_META_TOP_KEYS");
    expect(META_CHAIN_RULE_790_AUTH_META_ROOT_TWENTY_NINTH_KEY_CLAUSE).toContain("META_ROOT_TOP_KEYS");
    expect(META_CHAIN_RULE_790_AUTH_META_ROOT_TWENTY_NINTH_KEY_CLAUSE).toContain("728");
  });
});

describe("META_CHAIN_RULE_791_SEED_TEST_ACCOUNTS_META_ROOT_THIRTIETH_KEY_CLAUSE (791)", () => {
  it("embeds 791 + seed_test_accounts + 751 contracts + SEED_TEST_ACCOUNTS_META_TOP_KEYS + META_ROOT_TOP_KEYS thirtieth key + 728", () => {
    expect(META_CHAIN_RULE_791_SEED_TEST_ACCOUNTS_META_ROOT_THIRTIETH_KEY_CLAUSE).toContain("791");
    expect(META_CHAIN_RULE_791_SEED_TEST_ACCOUNTS_META_ROOT_THIRTIETH_KEY_CLAUSE).toContain(
      "seed_test_accounts_top_keys",
    );
    expect(META_CHAIN_RULE_791_SEED_TEST_ACCOUNTS_META_ROOT_THIRTIETH_KEY_CLAUSE).toContain(
      "seed_test_accounts_top_keys_contract_751",
    );
    expect(META_CHAIN_RULE_791_SEED_TEST_ACCOUNTS_META_ROOT_THIRTIETH_KEY_CLAUSE).toContain(
      "SEED_TEST_ACCOUNTS_META_TOP_KEYS",
    );
    expect(META_CHAIN_RULE_791_SEED_TEST_ACCOUNTS_META_ROOT_THIRTIETH_KEY_CLAUSE).toContain(
      "META_ROOT_TOP_KEYS",
    );
    expect(META_CHAIN_RULE_791_SEED_TEST_ACCOUNTS_META_ROOT_THIRTIETH_KEY_CLAUSE).toContain("728");
  });
});

describe("META_CHAIN_RULE_792_GUIDES_META_ROOT_THIRTY_FIRST_KEY_CLAUSE (792)", () => {
  it("embeds 792 + guides + 752 contracts + GUIDES_META_TOP_KEYS + META_ROOT_TOP_KEYS thirty-first key + 728", () => {
    expect(META_CHAIN_RULE_792_GUIDES_META_ROOT_THIRTY_FIRST_KEY_CLAUSE).toContain("792");
    expect(META_CHAIN_RULE_792_GUIDES_META_ROOT_THIRTY_FIRST_KEY_CLAUSE).toContain("guides_top_keys");
    expect(META_CHAIN_RULE_792_GUIDES_META_ROOT_THIRTY_FIRST_KEY_CLAUSE).toContain(
      "guides_top_keys_contract_752",
    );
    expect(META_CHAIN_RULE_792_GUIDES_META_ROOT_THIRTY_FIRST_KEY_CLAUSE).toContain("GUIDES_META_TOP_KEYS");
    expect(META_CHAIN_RULE_792_GUIDES_META_ROOT_THIRTY_FIRST_KEY_CLAUSE).toContain("META_ROOT_TOP_KEYS");
    expect(META_CHAIN_RULE_792_GUIDES_META_ROOT_THIRTY_FIRST_KEY_CLAUSE).toContain("728");
  });
});

describe("META_CHAIN_RULE_793_IDEMPOTENCY_CACHE_META_ROOT_THIRTY_SECOND_KEY_CLAUSE (793)", () => {
  it("embeds 793 + idempotency_cache + 753 contracts + IDEMPOTENCY_CACHE_META_TOP_KEYS + META_ROOT_TOP_KEYS thirty-second key + 728", () => {
    expect(META_CHAIN_RULE_793_IDEMPOTENCY_CACHE_META_ROOT_THIRTY_SECOND_KEY_CLAUSE).toContain("793");
    expect(META_CHAIN_RULE_793_IDEMPOTENCY_CACHE_META_ROOT_THIRTY_SECOND_KEY_CLAUSE).toContain(
      "idempotency_cache_top_keys",
    );
    expect(META_CHAIN_RULE_793_IDEMPOTENCY_CACHE_META_ROOT_THIRTY_SECOND_KEY_CLAUSE).toContain(
      "idempotency_cache_top_keys_contract_753",
    );
    expect(META_CHAIN_RULE_793_IDEMPOTENCY_CACHE_META_ROOT_THIRTY_SECOND_KEY_CLAUSE).toContain(
      "IDEMPOTENCY_CACHE_META_TOP_KEYS",
    );
    expect(META_CHAIN_RULE_793_IDEMPOTENCY_CACHE_META_ROOT_THIRTY_SECOND_KEY_CLAUSE).toContain("META_ROOT_TOP_KEYS");
    expect(META_CHAIN_RULE_793_IDEMPOTENCY_CACHE_META_ROOT_THIRTY_SECOND_KEY_CLAUSE).toContain("728");
  });
});

describe("META_CHAIN_RULE_794_DEFAULTS_META_ROOT_THIRTY_THIRD_KEY_CLAUSE (794)", () => {
  it("embeds 794 + defaults + 754 contracts + DEFAULTS_META_TOP_KEYS + META_ROOT_TOP_KEYS thirty-third key + 728", () => {
    expect(META_CHAIN_RULE_794_DEFAULTS_META_ROOT_THIRTY_THIRD_KEY_CLAUSE).toContain("794");
    expect(META_CHAIN_RULE_794_DEFAULTS_META_ROOT_THIRTY_THIRD_KEY_CLAUSE).toContain("defaults_top_keys");
    expect(META_CHAIN_RULE_794_DEFAULTS_META_ROOT_THIRTY_THIRD_KEY_CLAUSE).toContain(
      "defaults_top_keys_contract_754",
    );
    expect(META_CHAIN_RULE_794_DEFAULTS_META_ROOT_THIRTY_THIRD_KEY_CLAUSE).toContain("DEFAULTS_META_TOP_KEYS");
    expect(META_CHAIN_RULE_794_DEFAULTS_META_ROOT_THIRTY_THIRD_KEY_CLAUSE).toContain("META_ROOT_TOP_KEYS");
    expect(META_CHAIN_RULE_794_DEFAULTS_META_ROOT_THIRTY_THIRD_KEY_CLAUSE).toContain("728");
  });
});

describe("META_CHAIN_RULE_795_OUTBOX_META_ROOT_THIRTY_FOURTH_KEY_CLAUSE (795)", () => {
  it("embeds 795 + outbox + 755 contracts + OUTBOX_META_TOP_KEYS + META_ROOT_TOP_KEYS thirty-fourth key + 728", () => {
    expect(META_CHAIN_RULE_795_OUTBOX_META_ROOT_THIRTY_FOURTH_KEY_CLAUSE).toContain("795");
    expect(META_CHAIN_RULE_795_OUTBOX_META_ROOT_THIRTY_FOURTH_KEY_CLAUSE).toContain("outbox_top_keys");
    expect(META_CHAIN_RULE_795_OUTBOX_META_ROOT_THIRTY_FOURTH_KEY_CLAUSE).toContain(
      "outbox_top_keys_contract_755",
    );
    expect(META_CHAIN_RULE_795_OUTBOX_META_ROOT_THIRTY_FOURTH_KEY_CLAUSE).toContain("OUTBOX_META_TOP_KEYS");
    expect(META_CHAIN_RULE_795_OUTBOX_META_ROOT_THIRTY_FOURTH_KEY_CLAUSE).toContain("META_ROOT_TOP_KEYS");
    expect(META_CHAIN_RULE_795_OUTBOX_META_ROOT_THIRTY_FOURTH_KEY_CLAUSE).toContain("728");
  });
});

describe("META_CHAIN_RULE_796_META_TOP_KEYS_META_ROOT_THIRTY_FIFTH_KEY_CLAUSE (796)", () => {
  it("embeds 796 + meta_top_keys array + meta_top_keys_contract_728 + META_ROOT_TOP_KEYS thirty-fifth key + 728", () => {
    expect(META_ROOT_TOP_KEYS[34]).toBe("meta_top_keys");
    expect(META_CHAIN_RULE_796_META_TOP_KEYS_META_ROOT_THIRTY_FIFTH_KEY_CLAUSE).toContain("796");
    expect(META_CHAIN_RULE_796_META_TOP_KEYS_META_ROOT_THIRTY_FIFTH_KEY_CLAUSE).toContain("meta_top_keys");
    expect(META_CHAIN_RULE_796_META_TOP_KEYS_META_ROOT_THIRTY_FIFTH_KEY_CLAUSE).toContain(
      "meta_top_keys_contract_728",
    );
    expect(META_CHAIN_RULE_796_META_TOP_KEYS_META_ROOT_THIRTY_FIFTH_KEY_CLAUSE).toContain("META_ROOT_TOP_KEYS");
    expect(META_CHAIN_RULE_796_META_TOP_KEYS_META_ROOT_THIRTY_FIFTH_KEY_CLAUSE).toContain("728");
  });
});

describe("META_CHAIN_RULE_797_META_TOP_KEYS_CONTRACT_META_ROOT_THIRTY_SIXTH_KEY_CLAUSE (797)", () => {
  it("embeds 797 + meta_top_keys_contract_728 + META_ROOT_TOP_KEYS thirty-sixth key + 728 contract + thirty-fifth meta_top_keys", () => {
    expect(META_ROOT_TOP_KEYS[35]).toBe("meta_top_keys_contract_728");
    expect(META_CHAIN_RULE_797_META_TOP_KEYS_CONTRACT_META_ROOT_THIRTY_SIXTH_KEY_CLAUSE).toContain("797");
    expect(META_CHAIN_RULE_797_META_TOP_KEYS_CONTRACT_META_ROOT_THIRTY_SIXTH_KEY_CLAUSE).toContain(
      "meta_top_keys_contract_728",
    );
    expect(META_CHAIN_RULE_797_META_TOP_KEYS_CONTRACT_META_ROOT_THIRTY_SIXTH_KEY_CLAUSE).toContain(
      "META_ROOT_TOP_KEYS",
    );
    expect(META_CHAIN_RULE_797_META_TOP_KEYS_CONTRACT_META_ROOT_THIRTY_SIXTH_KEY_CLAUSE).toContain("728");
    expect(META_CHAIN_RULE_797_META_TOP_KEYS_CONTRACT_META_ROOT_THIRTY_SIXTH_KEY_CLAUSE).toContain("meta_top_keys");
  });
});

describe("META_CHAIN_RULE_798_META_TOP_KEYS_TRIPLE_THIRTY_SIX_SYNERGY_CLAUSE (798)", () => {
  it("embeds 798 + thirty-six + meta_top_keys JSON + contract + 796/797/728 chain", () => {
    expect(META_ROOT_TOP_KEYS.length).toBe(36);
    expect(META_CHAIN_RULE_798_META_TOP_KEYS_TRIPLE_THIRTY_SIX_SYNERGY_CLAUSE).toContain("798");
    expect(META_CHAIN_RULE_798_META_TOP_KEYS_TRIPLE_THIRTY_SIX_SYNERGY_CLAUSE).toContain("三十六");
    expect(META_CHAIN_RULE_798_META_TOP_KEYS_TRIPLE_THIRTY_SIX_SYNERGY_CLAUSE).toContain("meta_top_keys");
    expect(META_CHAIN_RULE_798_META_TOP_KEYS_TRIPLE_THIRTY_SIX_SYNERGY_CLAUSE).toContain("META_ROOT_TOP_KEYS");
    expect(META_CHAIN_RULE_798_META_TOP_KEYS_TRIPLE_THIRTY_SIX_SYNERGY_CLAUSE).toContain("meta_top_keys_contract_728");
    expect(META_CHAIN_RULE_798_META_TOP_KEYS_TRIPLE_THIRTY_SIX_SYNERGY_CLAUSE).toContain("796");
    expect(META_CHAIN_RULE_798_META_TOP_KEYS_TRIPLE_THIRTY_SIX_SYNERGY_CLAUSE).toContain("797");
    expect(META_CHAIN_RULE_798_META_TOP_KEYS_TRIPLE_THIRTY_SIX_SYNERGY_CLAUSE).toContain("728");
  });
});

describe("META_CHAIN_RULE_799_META_TOP_KEYS_728_ADJACENT_DUAL_ANCHOR_CLOSURE_CLAUSE (799)", () => {
  it("embeds 799 + 798 + 728 adjacent lock + dual anchor thirty-six keys", () => {
    expect(META_ROOT_TOP_KEYS.length).toBe(36);
    expect(META_CHAIN_RULE_799_META_TOP_KEYS_728_ADJACENT_DUAL_ANCHOR_CLOSURE_CLAUSE).toContain("799");
    expect(META_CHAIN_RULE_799_META_TOP_KEYS_728_ADJACENT_DUAL_ANCHOR_CLOSURE_CLAUSE).toContain("798");
    expect(META_CHAIN_RULE_799_META_TOP_KEYS_728_ADJACENT_DUAL_ANCHOR_CLOSURE_CLAUSE).toContain("728");
    expect(META_CHAIN_RULE_799_META_TOP_KEYS_728_ADJACENT_DUAL_ANCHOR_CLOSURE_CLAUSE).toContain("meta_top_keys");
    expect(META_CHAIN_RULE_799_META_TOP_KEYS_728_ADJACENT_DUAL_ANCHOR_CLOSURE_CLAUSE).toContain("META_ROOT_TOP_KEYS");
    expect(META_CHAIN_RULE_799_META_TOP_KEYS_728_ADJACENT_DUAL_ANCHOR_CLOSURE_CLAUSE).toContain(
      "meta_top_keys_contract_728",
    );
  });
});

describe("META_CHAIN_RULE_800_799_CLOSURE_CHAIN729_AND_766_SERIES_CLAUSE (800)", () => {
  it("embeds 800 + 799 + 729 chain five-key + META_ROOT_TOP_KEYS fourth chain + 766", () => {
    expect(META_ROOT_TOP_KEYS.length).toBe(36);
    expect(META_ROOT_TOP_KEYS[3]).toBe("chain");
    expect(META_CHAIN_RULE_800_799_CLOSURE_CHAIN729_AND_766_SERIES_CLAUSE).toContain("800");
    expect(META_CHAIN_RULE_800_799_CLOSURE_CHAIN729_AND_766_SERIES_CLAUSE).toContain("799");
    expect(META_CHAIN_RULE_800_799_CLOSURE_CHAIN729_AND_766_SERIES_CLAUSE).toContain("729");
    expect(META_CHAIN_RULE_800_799_CLOSURE_CHAIN729_AND_766_SERIES_CLAUSE).toContain("766");
    expect(META_CHAIN_RULE_800_799_CLOSURE_CHAIN729_AND_766_SERIES_CLAUSE).toContain("CHAIN_META_TOP_KEYS");
    expect(META_CHAIN_RULE_800_799_CLOSURE_CHAIN729_AND_766_SERIES_CLAUSE).toContain("META_ROOT_TOP_KEYS");
  });
});

describe("META_CHAIN_RULE_801_800_CHAIN_CONTRACTS_759_TRIPLE_WITH_799_766_729_CLAUSE (801)", () => {
  it("embeds 801 + 800 + 759 contracts ten-key + 799 + 766/729 chain subtree triple proof", () => {
    expect(META_CHAIN_RULE_801_800_CHAIN_CONTRACTS_759_TRIPLE_WITH_799_766_729_CLAUSE).toBe(
      "801：800 串联与 GET /meta chain.contracts 非 null 时 759 chain_contracts_top_keys / chain_contracts_top_keys_contract_759 及 CHAIN_CONTRACTS_META_TOP_KEYS 十键机读同源，与 799 双锚闭环及 766/729 chain 子树三向互证",
    );
    expect(META_CHAIN_RULE_801_800_CHAIN_CONTRACTS_759_TRIPLE_WITH_799_766_729_CLAUSE).toContain("801");
    expect(META_CHAIN_RULE_801_800_CHAIN_CONTRACTS_759_TRIPLE_WITH_799_766_729_CLAUSE).toContain("800");
    expect(META_CHAIN_RULE_801_800_CHAIN_CONTRACTS_759_TRIPLE_WITH_799_766_729_CLAUSE).toContain("759");
    expect(META_CHAIN_RULE_801_800_CHAIN_CONTRACTS_759_TRIPLE_WITH_799_766_729_CLAUSE).toContain("799");
    expect(META_CHAIN_RULE_801_800_CHAIN_CONTRACTS_759_TRIPLE_WITH_799_766_729_CLAUSE).toContain("766");
    expect(META_CHAIN_RULE_801_800_CHAIN_CONTRACTS_759_TRIPLE_WITH_799_766_729_CLAUSE).toContain("729");
    expect(META_CHAIN_RULE_801_800_CHAIN_CONTRACTS_759_TRIPLE_WITH_799_766_729_CLAUSE).toContain(
      "CHAIN_CONTRACTS_META_TOP_KEYS",
    );
    expect(META_CHAIN_RULE_801_800_CHAIN_CONTRACTS_759_TRIPLE_WITH_799_766_729_CLAUSE).toContain(
      "chain_contracts_top_keys_contract_759",
    );
  });

  it("orders 798/799/800/801/802/803/804/805/806 before 728 tail in chain.rule (parity with crates/api health_meta)", () => {
    const chr = [
      META_CHAIN_RULE_798_META_TOP_KEYS_TRIPLE_THIRTY_SIX_SYNERGY_CLAUSE,
      META_CHAIN_RULE_799_META_TOP_KEYS_728_ADJACENT_DUAL_ANCHOR_CLOSURE_CLAUSE,
      META_CHAIN_RULE_800_799_CLOSURE_CHAIN729_AND_766_SERIES_CLAUSE,
      META_CHAIN_RULE_801_800_CHAIN_CONTRACTS_759_TRIPLE_WITH_799_766_729_CLAUSE,
      META_CHAIN_RULE_802_801_CONTRACTS_RULE_759_EMBED_QUAD_CLAUSE,
      META_CHAIN_RULE_803_802_800_766_CHAIN_META_SIX_WAY_CLOSURE_CLAUSE,
      META_CHAIN_RULE_804_803_CHAIN_ID_RULE_PREAMBLE_SEVEN_WAY_CLAUSE,
      META_CHAIN_RULE_805_804_CONTRACTS_CHAIN_META_SECOND_KEY_EIGHT_WAY_CLAUSE,
      META_CHAIN_RULE_806_805_CHAIN_RULE_CHAIN_META_THIRD_KEY_NINE_WAY_CLAUSE,
      "728 GET /meta 根级 meta_top_keys / meta_top_keys_contract_728 与 META_ROOT_TOP_KEYS 三十六键顺序同源",
    ].join("；");
    const p798 = chr.indexOf("798：");
    const p799 = chr.indexOf("799：");
    const p800 = chr.indexOf("800：");
    const p801 = chr.indexOf("801：");
    const p802 = chr.indexOf("802：");
    const p803 = chr.indexOf("803：");
    const p804 = chr.indexOf("804：");
    const p805 = chr.indexOf("805：");
    const p806 = chr.indexOf("806：");
    const p728Tail = chr.indexOf("728 GET /meta 根级 meta_top_keys");
    expect(p798).toBeGreaterThanOrEqual(0);
    expect(p799).toBeGreaterThanOrEqual(0);
    expect(p800).toBeGreaterThanOrEqual(0);
    expect(p801).toBeGreaterThanOrEqual(0);
    expect(p802).toBeGreaterThanOrEqual(0);
    expect(p803).toBeGreaterThanOrEqual(0);
    expect(p804).toBeGreaterThanOrEqual(0);
    expect(p805).toBeGreaterThanOrEqual(0);
    expect(p806).toBeGreaterThanOrEqual(0);
    expect(p728Tail).toBeGreaterThanOrEqual(0);
    expect(
      p798 < p799 &&
        p799 < p800 &&
        p800 < p801 &&
        p801 < p802 &&
        p802 < p803 &&
        p803 < p804 &&
        p804 < p805 &&
        p805 < p806 &&
        p806 < p728Tail,
    ).toBe(true);
  });
});

describe("META_CHAIN_RULE_802_801_CONTRACTS_RULE_759_EMBED_QUAD_CLAUSE (802)", () => {
  it("matches health_meta chain.rule 802 clause byte-for-byte", () => {
    expect(META_CHAIN_RULE_802_801_CONTRACTS_RULE_759_EMBED_QUAD_CLAUSE).toBe(
      "802：801 串联与 GET /meta chain.contracts 非 null 时 contracts.rule 嵌入之 759 句与根级 chain.rule 759 及 801 十键机读核心同源，与 chain_contracts_top_keys / chain_contracts_top_keys_contract_759 / CHAIN_CONTRACTS_META_TOP_KEYS 及 801 四向互证",
    );
    expect(META_CHAIN_RULE_802_801_CONTRACTS_RULE_759_EMBED_QUAD_CLAUSE).toContain("802");
    expect(META_CHAIN_RULE_802_801_CONTRACTS_RULE_759_EMBED_QUAD_CLAUSE).toContain("801");
    expect(META_CHAIN_RULE_802_801_CONTRACTS_RULE_759_EMBED_QUAD_CLAUSE).toContain("contracts.rule");
    expect(META_CHAIN_RULE_802_801_CONTRACTS_RULE_759_EMBED_QUAD_CLAUSE).toContain("759");
    expect(META_CHAIN_RULE_802_801_CONTRACTS_RULE_759_EMBED_QUAD_CLAUSE).toContain(
      "chain_contracts_top_keys_contract_759",
    );
    expect(META_CHAIN_RULE_802_801_CONTRACTS_RULE_759_EMBED_QUAD_CLAUSE).toContain(
      "CHAIN_CONTRACTS_META_TOP_KEYS",
    );
  });
});

describe("META_CHAIN_RULE_803_802_800_766_CHAIN_META_SIX_WAY_CLOSURE_CLAUSE (803)", () => {
  it("matches health_meta chain.rule 803 clause byte-for-byte", () => {
    expect(META_CHAIN_RULE_803_802_800_766_CHAIN_META_SIX_WAY_CLOSURE_CLAUSE).toBe(
      "803：802 串联与 800 及 766 GET /meta chain 对象 chain_top_keys / chain_top_keys_contract_729 / CHAIN_META_TOP_KEYS 五键机读同源，与 799 双锚经 729、801、759、802 contracts.rule 根级 chain.rule 759 嵌入形成五向链读闭环，与 META_ROOT_TOP_KEYS 第四键 chain 及 728 meta_top_keys 机读六向互证",
    );
    expect(META_CHAIN_RULE_803_802_800_766_CHAIN_META_SIX_WAY_CLOSURE_CLAUSE).toContain("803");
    expect(META_CHAIN_RULE_803_802_800_766_CHAIN_META_SIX_WAY_CLOSURE_CLAUSE).toContain("802");
    expect(META_CHAIN_RULE_803_802_800_766_CHAIN_META_SIX_WAY_CLOSURE_CLAUSE).toContain("800");
    expect(META_CHAIN_RULE_803_802_800_766_CHAIN_META_SIX_WAY_CLOSURE_CLAUSE).toContain("766");
    expect(META_CHAIN_RULE_803_802_800_766_CHAIN_META_SIX_WAY_CLOSURE_CLAUSE).toContain("CHAIN_META_TOP_KEYS");
    expect(META_CHAIN_RULE_803_802_800_766_CHAIN_META_SIX_WAY_CLOSURE_CLAUSE).toContain("META_ROOT_TOP_KEYS");
  });
});

describe("META_CHAIN_RULE_804_803_CHAIN_ID_RULE_PREAMBLE_SEVEN_WAY_CLAUSE (804)", () => {
  it("matches health_meta chain.rule 804 clause byte-for-byte", () => {
    expect(META_CHAIN_RULE_804_803_CHAIN_ID_RULE_PREAMBLE_SEVEN_WAY_CLAUSE).toBe(
      "804：803 六向互证与 GET /meta chain.chain_id 及根级 chain.rule 文首与 intents EIP-712 domain、前端 NEXT_PUBLIC_CHAIN_ID 应对齐及 contracts 见 ChainConfig 机读同源，七向收束 803 链读至 CHAIN_META_TOP_KEYS 首键 chain_id 部署观测锚，与 chain_top_keys / chain_top_keys_contract_729 及 803 七向互证",
    );
    expect(META_CHAIN_RULE_804_803_CHAIN_ID_RULE_PREAMBLE_SEVEN_WAY_CLAUSE).toContain("804");
    expect(META_CHAIN_RULE_804_803_CHAIN_ID_RULE_PREAMBLE_SEVEN_WAY_CLAUSE).toContain("803");
    expect(META_CHAIN_RULE_804_803_CHAIN_ID_RULE_PREAMBLE_SEVEN_WAY_CLAUSE).toContain("chain.chain_id");
    expect(META_CHAIN_RULE_804_803_CHAIN_ID_RULE_PREAMBLE_SEVEN_WAY_CLAUSE).toContain("CHAIN_META_TOP_KEYS");
    expect(META_CHAIN_RULE_804_803_CHAIN_ID_RULE_PREAMBLE_SEVEN_WAY_CLAUSE).toContain("chain_id");
  });
});

describe("META_CHAIN_RULE_806_805_CHAIN_RULE_CHAIN_META_THIRD_KEY_NINE_WAY_CLAUSE (806)", () => {
  it("matches health_meta chain.rule 806 clause byte-for-byte", () => {
    expect(META_CHAIN_RULE_806_805_CHAIN_RULE_CHAIN_META_THIRD_KEY_NINE_WAY_CLAUSE).toBe(
      "806：805 八向互证与 GET /meta chain.rule 及 CHAIN_META_TOP_KEYS 第三键 rule 机读同源，九向收束 805 链读至根级 chain.rule 文首与 intents EIP-712 domain、NEXT_PUBLIC_CHAIN_ID、ChainConfig、759 句及 contracts.rule 759 嵌入与 801 三向 802 四向 803 六向 804 七向 805 八向串联，与 chain_top_keys / chain_top_keys_contract_729 及 805 九向互证",
    );
    expect(META_CHAIN_RULE_806_805_CHAIN_RULE_CHAIN_META_THIRD_KEY_NINE_WAY_CLAUSE).toContain("806");
    expect(META_CHAIN_RULE_806_805_CHAIN_RULE_CHAIN_META_THIRD_KEY_NINE_WAY_CLAUSE).toContain("805");
    expect(META_CHAIN_RULE_806_805_CHAIN_RULE_CHAIN_META_THIRD_KEY_NINE_WAY_CLAUSE).toContain("CHAIN_META_TOP_KEYS");
    expect(META_CHAIN_RULE_806_805_CHAIN_RULE_CHAIN_META_THIRD_KEY_NINE_WAY_CLAUSE).toContain("第三键");
  });
});

describe("META_CHAIN_RULE_805_804_CONTRACTS_CHAIN_META_SECOND_KEY_EIGHT_WAY_CLAUSE (805)", () => {
  it("matches health_meta chain.rule 805 clause byte-for-byte", () => {
    expect(META_CHAIN_RULE_805_804_CONTRACTS_CHAIN_META_SECOND_KEY_EIGHT_WAY_CLAUSE).toBe(
      "805：804 七向互证与 GET /meta chain.contracts 及 CHAIN_META_TOP_KEYS 第二键 contracts 机读同源，八向收束 804 链读至 contracts 部署观测锚与 chain_contracts_top_keys / chain_contracts_top_keys_contract_759 / CHAIN_CONTRACTS_META_TOP_KEYS 十键及 801 三向 802 四向 803 六向串联，与 chain_top_keys / chain_top_keys_contract_729 及 804 八向互证",
    );
    expect(META_CHAIN_RULE_805_804_CONTRACTS_CHAIN_META_SECOND_KEY_EIGHT_WAY_CLAUSE).toContain("805");
    expect(META_CHAIN_RULE_805_804_CONTRACTS_CHAIN_META_SECOND_KEY_EIGHT_WAY_CLAUSE).toContain("804");
    expect(META_CHAIN_RULE_805_804_CONTRACTS_CHAIN_META_SECOND_KEY_EIGHT_WAY_CLAUSE).toContain("chain.contracts");
    expect(META_CHAIN_RULE_805_804_CONTRACTS_CHAIN_META_SECOND_KEY_EIGHT_WAY_CLAUSE).toContain("CHAIN_META_TOP_KEYS");
    expect(META_CHAIN_RULE_805_804_CONTRACTS_CHAIN_META_SECOND_KEY_EIGHT_WAY_CLAUSE).toContain(
      "CHAIN_CONTRACTS_META_TOP_KEYS",
    );
  });
});

describe("META_CHAIN_RULE_767_RATE_LIMITS_META_ROOT_FIFTH_KEY_CLAUSE (767)", () => {
  it("anchors chain.rule cross-link to rate_limits 756 and META_ROOT_TOP_KEYS fifth key and 728", () => {
    expect(META_CHAIN_RULE_767_RATE_LIMITS_META_ROOT_FIFTH_KEY_CLAUSE).toContain("767");
    expect(META_CHAIN_RULE_767_RATE_LIMITS_META_ROOT_FIFTH_KEY_CLAUSE).toContain(
      "rate_limits_top_keys_contract_756",
    );
    expect(META_CHAIN_RULE_767_RATE_LIMITS_META_ROOT_FIFTH_KEY_CLAUSE).toContain(
      "RATE_LIMITS_META_TOP_KEYS",
    );
    expect(META_CHAIN_RULE_767_RATE_LIMITS_META_ROOT_FIFTH_KEY_CLAUSE).toContain("META_ROOT_TOP_KEYS");
    expect(META_CHAIN_RULE_767_RATE_LIMITS_META_ROOT_FIFTH_KEY_CLAUSE).toContain("728");
  });
});

describe("META_CHAIN_RULE_763_ROOT_SERVICE_API_VERSION_CLAUSE (763)", () => {
  it("anchors chain.rule cross-link to root service/api_version and 728", () => {
    expect(META_CHAIN_RULE_763_ROOT_SERVICE_API_VERSION_CLAUSE).toContain("763");
    expect(META_CHAIN_RULE_763_ROOT_SERVICE_API_VERSION_CLAUSE).toContain("traveltrust-api");
    expect(META_CHAIN_RULE_763_ROOT_SERVICE_API_VERSION_CLAUSE).toContain("META_ROOT_TOP_KEYS");
  });
});
