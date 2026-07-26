#!/usr/bin/env node
/**
 * Batch-14 · L2 Runtime probe (Staging API)
 * Verifies /meta build SHA + admin users/orders/disputes meta.source
 *
 *   STAGING_ADMIN_EMAIL=… STAGING_ADMIN_PASSWORD=… node scripts/dev/probe-batch14-l2-runtime-staging.cjs
 */
const API = process.env.STAGING_API_BASE || "https://tt-api-staging.fly.dev";
const WEB = process.env.STAGING_WEB_BASE || "https://tt-web-staging.fly.dev";
const EMAIL = process.env.STAGING_ADMIN_EMAIL || process.env.TT_STAGING_SUPERADMIN_EMAIL || "";
const PASS = process.env.STAGING_ADMIN_PASSWORD || process.env.TT_STAGING_SUPERADMIN_PASSWORD || "";
const EXPECT_SHA_PREFIX = (process.env.TT_EXPECT_BAKE_SHA || "a6f481c3").slice(0, 8);

async function jfetch(url, opts = {}) {
  const res = await fetch(url, opts);
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = { _raw: text.slice(0, 200) };
  }
  return { status: res.status, body };
}

function sourceOf(body) {
  const meta = body?.meta?.source;
  const af = body?.applied_filters?.source;
  const items = body?.meta?.items_source;
  return { meta: meta ?? null, applied: af ?? null, items: items ?? null };
}

(async () => {
  const out = {
    machine: "TT_ADMIN_BATCH14_L2_RUNTIME_PROBE",
    stamp: new Date().toISOString(),
    patch: "PATCH-STG-019",
    tip_cite: "ea71c577",
    tip_immobile: true,
    hard_gate: "LOCKED",
    cutover: "LOCKED",
    production_go: "NO_GO",
    expect_sha_prefix: EXPECT_SHA_PREFIX,
  };

  const meta = await jfetch(`${API}/meta`);
  const gitSha = meta.body?.build?.git_sha || meta.body?.build?.gitSha || "";
  out.api_meta_http = meta.status;
  out.api_build_sha = gitSha;
  out.api_sha_matches_expect = typeof gitSha === "string" && gitSha.startsWith(EXPECT_SHA_PREFIX);
  out.database_connected = meta.body?.database?.connected ?? null;
  out.treasury_address = meta.body?.treasury_address ?? meta.body?.chain?.treasury_address ?? null;

  // Web bake cite (best-effort)
  try {
    const webHtml = await fetch(WEB);
    out.web_http = webHtml.status;
  } catch (e) {
    out.web_http_error = String(e.message || e);
  }

  if (!EMAIL || !PASS) {
    out.login = "SKIP_NO_CREDS";
    out.verdict = out.api_sha_matches_expect ? "API_SHA_OK_LOGIN_SKIPPED" : "API_SHA_MISMATCH_LOGIN_SKIPPED";
    console.log(JSON.stringify(out, null, 2));
    process.exit(out.api_sha_matches_expect ? 0 : 2);
  }

  let login = await jfetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASS }),
  });
  if (login.status === 404 || !(login.body?.token || login.body?.access_token || login.body?.session_token)) {
    const alt = await jfetch(`${API}/api/v1/auth/login`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: EMAIL, password: PASS }),
    });
    if (alt.body?.token || alt.body?.access_token || alt.body?.session_token || alt.status < login.status) {
      login = alt;
      out.login_path = "/api/v1/auth/login";
    } else {
      out.login_path = "/auth/login";
    }
  } else {
    out.login_path = "/auth/login";
  }
  out.login_http = login.status;
  const token = login.body?.token || login.body?.access_token || login.body?.session_token;
  if (!token) {
    out.login = "FAIL_NO_TOKEN";
    out.login_body_keys = Object.keys(login.body || {});
    out.verdict = "LOGIN_FAIL";
    console.log(JSON.stringify(out, null, 2));
    process.exit(2);
  }
  out.login = "PASS";
  out.role = login.body?.user?.role || login.body?.role || null;

  const headers = { authorization: `Bearer ${token}`, accept: "application/json" };
  const paths = [
    ["users", `${API}/api/v1/admin/users?limit=2`],
    ["orders", `${API}/api/v1/admin/orders?limit=2`],
    ["disputes", `${API}/api/v1/admin/disputes?limit=2`],
  ];
  out.lists = {};
  for (const [name, url] of paths) {
    const r = await jfetch(url, { headers });
    const src = sourceOf(r.body);
    out.lists[name] = {
      http: r.status,
      total: r.body?.total ?? null,
      item_count: Array.isArray(r.body?.items) ? r.body.items.length : null,
      source: src,
      postgres_ok:
        r.status === 200 &&
        src.meta === "postgres" &&
        src.items === "postgres" &&
        src.applied === "postgres",
    };
  }

  const allPg = ["users", "orders", "disputes"].every((k) => out.lists[k]?.postgres_ok);
  out.l2_runtime_align =
    out.api_sha_matches_expect && out.login === "PASS" && allPg ? "PASS" : "NEED_FIX";
  out.verdict = out.l2_runtime_align;
  console.log(JSON.stringify(out, null, 2));
  process.exit(out.l2_runtime_align === "PASS" ? 0 : 2);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
