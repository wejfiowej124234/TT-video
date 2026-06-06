import { describe, it, expect } from "vitest";
import { COMMUNITY_ABUSE_429_CODES } from "../../communityApiMessageCodes";
import {
  parseResponse,
} from ".";

describe("parseResponse (Phase 4/5 API 契约)", () => {
  it("maps 401 login_required when error and message are aligned", async () => {
    const res = new Response(
      JSON.stringify({ error: "login_required", message: "login_required" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
    await expect(parseResponse(res)).rejects.toThrow("login_required");
  });

  it("maps 401 invalid_credentials to invalid_credentials (login page dedicated copy)", async () => {
    const res = new Response(
      JSON.stringify({ error: "invalid_credentials", message: "invalid_credentials" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
    await expect(parseResponse(res)).rejects.toThrow("invalid_credentials");
  });

  it("maps 401 invalid_credentials when only message carries the machine key", async () => {
    const res = new Response(JSON.stringify({ message: "invalid_credentials" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
    await expect(parseResponse(res)).rejects.toThrow("invalid_credentials");
  });

  it("maps 401 invalid_old_password to stable code (PUT /me/password; mapOrderWriteError i18n)", async () => {
    const res = new Response(
      JSON.stringify({
        error: "invalid_old_password",
        message: "old_password is incorrect",
      }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
    await expect(parseResponse(res)).rejects.toThrow("invalid_old_password");
  });

  it("maps 401 unauthorized (strict session gate) to login_required (same UX / catch path)", async () => {
    const res = new Response(
      JSON.stringify({
        error: "unauthorized",
        message: "unauthorized",
        detail: "需登录：请提供 X-User-Id 或 Authorization",
      }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
    await expect(parseResponse(res)).rejects.toThrow("login_required");
  });

  it("maps 400 discover/orders pagination errors to stable codes (error/message aligned)", async () => {
    const res = new Response(JSON.stringify({ error: "invalid_cursor", message: "invalid_cursor" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
    await expect(parseResponse(res)).rejects.toThrow("invalid_cursor");
  });

  it("maps 400 invalid_limit via error field even if message were missing", async () => {
    const res = new Response(JSON.stringify({ error: "invalid_limit" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
    await expect(parseResponse(res)).rejects.toThrow("invalid_limit");
  });

  it("maps 400 onboarding_entitlement_required to stable code (96-18 market publish gate)", async () => {
    const res = new Response(
      JSON.stringify({
        error: "onboarding_entitlement_required",
        message: "onboarding_entitlement_required",
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
    await expect(parseResponse(res)).rejects.toThrow("onboarding_entitlement_required");
  });

  it("maps 500 onboarding_entitlement_lookup_failed to stable code (96-18)", async () => {
    const res = new Response(
      JSON.stringify({
        error: "onboarding_entitlement_lookup_failed",
        message: "onboarding_entitlement_lookup_failed",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
    await expect(parseResponse(res)).rejects.toThrow("onboarding_entitlement_lookup_failed");
  });

  it("maps 413 file_too_large to stable code", async () => {
    const res = new Response(
      JSON.stringify({ error: "file_too_large", message: "file_too_large", max_bytes: 819200 }),
      { status: 413, headers: { "Content-Type": "application/json" } }
    );
    await expect(parseResponse(res)).rejects.toThrow("file_too_large|max_bytes=819200");
  });

  it("maps 400 community posts/upload-media parse errors to stable machine keys (04 / A4)", async () => {
    for (const code of [
      "empty_body",
      "unsupported_mime",
      "mime_body_mismatch",
      "missing_base64_payload",
      "invalid_base64",
      "invalid_file_type",
      "file_too_large",
      "invalid_payload",
    ]) {
      const res = new Response(
        JSON.stringify({ status: "error", error: code, message: code, max_bytes: 524288 }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
      await expect(parseResponse(res)).rejects.toThrow(code);
    }
  });

  it("maps 400/404 GET uploads/community-posts invalid_filename / not_found (no status envelope)", async () => {
    const badName = new Response(JSON.stringify({ error: "invalid_filename", message: "invalid_filename" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
    await expect(parseResponse(badName)).rejects.toThrow("invalid_filename");

    const missing = new Response(JSON.stringify({ error: "not_found", message: "not_found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
    await expect(parseResponse(missing)).rejects.toThrow("not_found");
  });

  it("maps 404 community post delete/patch not_found_or_forbidden envelope (posts.rs, 04)", async () => {
    const res = new Response(
      JSON.stringify({
        status: "error",
        error: "not_found_or_forbidden",
        message: "not_found_or_forbidden",
      }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
    await expect(parseResponse(res)).rejects.toThrow("not_found_or_forbidden");
  });

  it("maps 400 community post PATCH visibility_status_required / invalid_visibility_status (posts.rs, 04)", async () => {
    for (const code of ["visibility_status_required", "invalid_visibility_status"]) {
      const res = new Response(
        JSON.stringify({ status: "error", error: code, message: code }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
      await expect(parseResponse(res)).rejects.toThrow(code);
    }
  });

  it("maps 500 community posts/upload-media mkdir_failed / write_failed with aligned message (04)", async () => {
    const mkdir = new Response(
      JSON.stringify({
        status: "error",
        error: "mkdir_failed",
        message: "mkdir_failed",
        detail: "Permission denied (os error 13)",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
    await expect(parseResponse(mkdir)).rejects.toThrow("mkdir_failed");

    const write = new Response(
      JSON.stringify({
        status: "error",
        error: "write_failed",
        message: "write_failed",
        detail: "No space left on device",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
    await expect(parseResponse(write)).rejects.toThrow("write_failed");
  });

  it("maps 403 forbidden JSON without being overwritten by generic 403 copy", async () => {
    const res = new Response(JSON.stringify({ error: "forbidden", message: "forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
    await expect(parseResponse(res)).rejects.toThrow("forbidden");
  });

  it("maps 403 internal_api_forbidden to stable code", async () => {
    const res = new Response(
      JSON.stringify({
        error: "internal_api_forbidden",
        message: "internal_api_forbidden",
        detail: "INTERNAL_API_SECRET",
      }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
    await expect(parseResponse(res)).rejects.toThrow("internal_api_forbidden");
  });

  it("maps 403 internal_api_forbidden when only message carries the machine key", async () => {
    const res = new Response(JSON.stringify({ message: "internal_api_forbidden", detail: "strip-error-field" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
    await expect(parseResponse(res)).rejects.toThrow("internal_api_forbidden");
  });

  it("maps 403 seed_test_accounts_disabled to stable code", async () => {
    const res = new Response(
      JSON.stringify({ error: "seed_test_accounts_disabled", message: "seed_test_accounts_disabled" }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
    await expect(parseResponse(res)).rejects.toThrow("seed_test_accounts_disabled");
  });

  it("maps 403 trust_* gate codes to stable machine keys (90 / 04)", async () => {
    for (const code of [
      "trust_guide_pending_review",
      "trust_verification_pending",
      "trust_identity_restricted",
      "trust_risk_too_high",
    ]) {
      const res = new Response(JSON.stringify({ error: code, message: code }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
      await expect(parseResponse(res)).rejects.toThrow(code);
    }
  });

  it("maps 403 not_guide / not_tourist to stable machine keys (orders flow)", async () => {
    for (const code of ["not_guide", "not_tourist"]) {
      const res = new Response(JSON.stringify({ error: code, message: code }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
      await expect(parseResponse(res)).rejects.toThrow(code);
    }
  });

  it("maps 400 evidence content_hash_* / quote_hash errors to stable machine keys", async () => {
    for (const code of [
      "content_hash_required",
      "content_hash_too_long",
      "content_hash_must_be_hex",
      "quote_canonical_too_long",
      "invalid_quote_hash",
    ]) {
      const res = new Response(JSON.stringify({ error: code, message: code }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
      await expect(parseResponse(res)).rejects.toThrow(code);
    }
  });

  it("maps 503 chain_off_unavailable to stable code", async () => {
    const res = new Response(JSON.stringify({ error: "chain_off_unavailable", message: "chain_off_unavailable" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
    await expect(parseResponse(res)).rejects.toThrow("chain_off_unavailable");
  });

  it("maps 503 database_required (270 media) to stable code", async () => {
    const res = new Response(JSON.stringify({ error: "database_required", message: "database_required" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
    await expect(parseResponse(res)).rejects.toThrow("database_required");
  });

  it("maps 410 token_expired (media access) to stable code", async () => {
    const res = new Response(JSON.stringify({ error: "token_expired", message: "token_expired" }), {
      status: 410,
      headers: { "Content-Type": "application/json" },
    });
    await expect(parseResponse(res)).rejects.toThrow("token_expired");
  });
});
