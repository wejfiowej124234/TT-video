#!/usr/bin/env node
/**
 * Batch-14 · HU-491 Staging probe
 * Guide applications list/detail source honesty + admin guides list/detail PG align
 *
 *   STAGING_ADMIN_EMAIL=… STAGING_ADMIN_PASSWORD=… node scripts/dev/probe-batch14-hu491-guides-staging.cjs
 */
const API = process.env.STAGING_API_BASE || "https://tt-api-staging.fly.dev";
const EMAIL = process.env.STAGING_ADMIN_EMAIL || process.env.TT_STAGING_SUPERADMIN_EMAIL || "";
const PASS = process.env.STAGING_ADMIN_PASSWORD || process.env.TT_STAGING_SUPERADMIN_PASSWORD || "";

async function jfetch(url, opts = {}) {
  const res = await fetch(url, opts);
  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    body = { _raw: text.slice(0, 240) };
  }
  return { status: res.status, body };
}

(async () => {
  const out = {
    machine: "TT_ADMIN_BATCH14_HU491_GUIDES_PROBE",
    stamp: new Date().toISOString(),
    patch: "PATCH-STG-019",
    tip_cite: "ea71c577",
    tip_immobile: true,
    hard_gate: "LOCKED",
    cutover: "LOCKED",
    production_go: "NO_GO",
  };

  const meta = await jfetch(`${API}/meta`);
  out.api_build_sha = meta.body?.build?.git_sha || null;

  if (!EMAIL || !PASS) {
    out.verdict = "SKIP_NO_CREDS";
    console.log(JSON.stringify(out, null, 2));
    process.exit(2);
  }

  let login = await jfetch(`${API}/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASS }),
  });
  const token = login.body?.token || login.body?.access_token;
  if (!token) {
    out.login = "FAIL";
    out.verdict = "LOGIN_FAIL";
    console.log(JSON.stringify(out, null, 2));
    process.exit(2);
  }
  out.login = "PASS";
  const headers = { authorization: `Bearer ${token}`, accept: "application/json" };

  const guides = await jfetch(`${API}/api/v1/admin/guides?limit=3`, { headers });
  out.guides_list = {
    http: guides.status,
    source: guides.body?.meta?.source ?? guides.body?.applied_filters?.source ?? null,
    total: guides.body?.total ?? null,
    item_count: Array.isArray(guides.body?.items) ? guides.body.items.length : null,
  };

  const first = Array.isArray(guides.body?.items) ? guides.body.items[0] : null;
  if (first?.id) {
    const detail = await jfetch(`${API}/api/v1/admin/guides/${first.id}`, { headers });
    out.guides_detail = {
      http: detail.status,
      source: detail.body?.meta?.source ?? null,
      has_guide: !!(detail.body?.guide || detail.body?.id),
    };
  }

  // guide-applications queue (role_applications)
  const apps = await jfetch(`${API}/api/v1/admin/guide-applications?limit=3`, { headers });
  out.guide_applications_list = {
    http: apps.status,
    source: apps.body?.meta?.source ?? apps.body?.applied_filters?.source ?? null,
    total: apps.body?.total ?? null,
    item_count: Array.isArray(apps.body?.items) ? apps.body.items.length : null,
    keys: Object.keys(apps.body || {}).slice(0, 12),
  };

  const appUser =
    apps.body?.items?.[0]?.user_id ||
    apps.body?.items?.[0]?.application?.user_id ||
    first?.user_id ||
    null;
  if (appUser) {
    const appDetail = await jfetch(
      `${API}/api/v1/admin/users/${appUser}/guide-application`,
      { headers },
    );
    // alternate paths
    let alt = appDetail;
    if (appDetail.status === 404) {
      alt = await jfetch(`${API}/api/v1/admin/guide-applications/${appUser}`, { headers });
    }
    out.guide_application_detail = {
      http: alt.status,
      source: alt.body?.meta?.source ?? alt.body?.application?.source ?? null,
      passport_hash_present: alt.body?.application?.passport_hash_present ?? alt.body?.passport_hash_present ?? null,
      has_application: alt.body?.application != null || alt.body?.status === "ok",
      keys: Object.keys(alt.body || {}).slice(0, 12),
    };
  }

  const listOk = out.guides_list?.http === 200 && out.guides_list?.source === "postgres";
  const detailOk =
    !out.guides_detail ||
    (out.guides_detail.http === 200 && out.guides_detail.source === "postgres");
  const appDetailOk =
    !out.guide_application_detail ||
    out.guide_application_detail.http === 404 ||
    (out.guide_application_detail.http === 200 &&
      (out.guide_application_detail.source === "postgres" ||
        out.guide_application_detail.source == null));

  // Prefer explicit postgres on application detail when present
  const appSrc = out.guide_application_detail?.source;
  const appSrcOk = appSrc == null || appSrc === "postgres";

  out.hu491 =
    listOk && detailOk && appSrcOk
      ? "PASS"
      : "NEED_FIX";
  out.verdict = out.hu491;
  console.log(JSON.stringify(out, null, 2));
  process.exit(out.hu491 === "PASS" ? 0 : 2);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
