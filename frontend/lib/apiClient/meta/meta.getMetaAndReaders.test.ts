/**
 * GET /meta（健康与版本等）— fetch 与 readers
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiUrl, routes } from "../../api";
import {
  AUTH_REGISTRATION_META_TOP_KEYS,
  getMeta,
  getMetaBuild,
  readAuthRegistrationFromMeta,
  readMetaBuild,
  readMetaBuildRoot,
  readProductRolesFromMeta,
} from ".";
import { mockTextResponse } from "./meta.testHelpers";

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

  it("returns dev fallback when fetch fails in development", async () => {
    const prev = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new Error("Failed to fetch"));
    const out = await getMeta();
    expect(out._dev_fallback).toBe(true);
    expect(readMetaBuild(out)).toEqual({ git_sha: "dev-fallback", deployed_at: null });
    process.env.NODE_ENV = prev;
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
