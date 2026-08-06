#!/usr/bin/env node
/**
 * V65 Batch3 Cut B Eng-Wave · FE honesty Staging smoke (②)
 *
 * Closes residuals (Cut B misc P2 engineering priority):
 *   R010 — Approvals pending review CTA marker
 *   R014 — Guides L5 filter bar + nowrap
 *   R021 — Guides status select (no data_origin free-text)
 *   R044 — Onboarding review-strip discoverability
 *   R057 — OpsPlaneAuthHints on AdminListFetchError
 *
 * R031 = Residual SSOT honesty (docs) after this PASS — not a FE marker gate.
 *
 * Auth: official-cold-start-admin-client → Cookie traveltrust_user_id + traveltrust_session_ok
 * Keep TT_PRODUCTION_GO=NO_GO. No Production deploy. Do not start Cut C until Cut B exit.
 * exit 0 PASS · 2 BLOCKED.
 *
 * Usage (repo root):
 *   node scripts/dev/run-v65-batch3-cut-b-eng-wave-staging-smoke.cjs
 *
 * Optional:
 *   TT_CUT_B_ENG_WAVE_FE_EXPECT_SHA=<fe tip after deploy>
 *   TT_CUT_B_ENG_WAVE_API_EXPECT_SHA=<api tip after deploy>  (optional fail-closed)
 *   TT_CUT_B_ENG_WAVE_FE_SMOKE_STAMP=20260806T…
 */
'use strict';

const fs = require('fs');
const path = require('path');
const {
  createClient,
  resolveAdminCredentials,
} = require('./lib/official-cold-start-admin-client.cjs');

const ROOT = path.resolve(__dirname, '../..');
const API = String(process.env.TT_STAGING_API_BASE || 'https://tt-api-staging.fly.dev').replace(
  /\/$/,
  ''
);
const WEB = String(process.env.TT_STAGING_WEB_BASE || 'https://tt-web-staging.fly.dev').replace(
  /\/$/,
  ''
);
const EXPECT_SHA = String(process.env.TT_CUT_B_ENG_WAVE_FE_EXPECT_SHA || '').trim();
const EXPECT_API_SHA = String(process.env.TT_CUT_B_ENG_WAVE_API_EXPECT_SHA || '').trim();
const stamp =
  process.env.TT_CUT_B_ENG_WAVE_FE_SMOKE_STAMP ||
  new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
const outDir = path.join(ROOT, 'evidence', 'GO_v65_prod_003_batch3_cut_b_eng_wave', stamp);

const RESIDUALS = [
  'V65-PROD-003-B3-R010',
  'V65-PROD-003-B3-R014',
  'V65-PROD-003-B3-R021',
  'V65-PROD-003-B3-R044',
  'V65-PROD-003-B3-R057',
];

const MARKERS = [
  'data-tt-admin-approvals-review-cta',
  'data-tt-admin-enterprise-guides-filter-bar',
  'data-tt-admin-enterprise-guides-table-nowrap',
  'data-tt-admin-enterprise-guides-status-select',
  'data-tt-admin-onboarding-review-strip',
  'data-tt-admin-list-fetch-auth-hints',
  'data-tt-ops-plane-auth-hint',
];

const LOCAL_CONTRACT_FILES = [
  'frontend/lib/admin/adminEnterpriseHardeningContract.ts',
  'frontend/app/admin/guides/AdminGuidesPageMain.tsx',
  'frontend/app/admin/guides/adminGuidesPageModel.ts',
  'frontend/app/admin/approvals/AdminApprovalsTableSection.tsx',
  'frontend/app/admin/onboarding/AdminOnboardingHubPageMain.tsx',
  'frontend/components/admin/AdminListFetchError.tsx',
  'frontend/components/admin/ops/OpsPlaneAuthHints.tsx',
  'frontend/lib/api/routesAdminCore.ts',
  'crates/api/src/routes/admin/query_types.rs',
];

async function fetchText(url, timeoutMs = 45000, headers = {}) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: ac.signal,
      redirect: 'manual',
      headers: {
        Accept: 'text/html,application/xhtml+xml,application/json,*/*',
        'Cache-Control': 'no-cache',
        'User-Agent': 'TravelTrust-V65-CutB-EngWave-FE-Smoke/1.0',
        ...headers,
      },
    });
    const body = await res.text();
    return {
      status: res.status,
      body,
      location: res.headers.get('location') || null,
    };
  } finally {
    clearTimeout(t);
  }
}

async function fetchJson(url, timeoutMs = 45000) {
  const r = await fetchText(url, timeoutMs, { Accept: 'application/json' });
  let json = null;
  try {
    json = JSON.parse(r.body);
  } catch (_) {
    /* ignore */
  }
  return { status: r.status, json, body_len: (r.body || '').length };
}

async function resolveAdminWebCookie() {
  const creds = resolveAdminCredentials(null, null);
  const client = createClient(API);
  const session = await client.adminSession(creds.email, creds.password);
  const me = await client.req('GET', '/api/v1/me', null, session.token);
  let uid =
    (me.json &&
      (me.json.id ||
        me.json.user_id ||
        (me.json.user && (me.json.user.id || me.json.user.user_id)))) ||
    null;
  if (!uid) {
    const login = await client.req('POST', '/auth/login', {
      email: creds.email,
      password: creds.password,
    });
    uid =
      (login.json &&
        (login.json.user_id ||
          login.json.id ||
          (login.json.user && (login.json.user.id || login.json.user.user_id)))) ||
      null;
  }
  if (!uid) {
    throw new Error(
      `admin user_id unresolved (me.status=${me.status} keys=${Object.keys(me.json || {}).join(',')})`
    );
  }
  const cookie = `traveltrust_user_id=${encodeURIComponent(String(uid))}; traveltrust_session_ok=1`;
  return {
    email: session.email || creds.email,
    role: session.role || (me.json && me.json.role) || null,
    user_id: String(uid),
    cookie,
    token_prefix: String(session.token || '').slice(0, 12),
  };
}

function extractChunkUrls(html, base) {
  const urls = new Set();
  const re = /(?:src|href)=["']([^"']+_next\/static\/[^"']+\.js)["']/g;
  let m;
  while ((m = re.exec(html))) {
    const u = m[1];
    if (u.startsWith('http')) urls.add(u);
    else if (u.startsWith('/')) urls.add(base + u);
    else urls.add(base + '/' + u);
  }
  const re2 = /\/_next\/static\/[^"'\\\s]+\.js/g;
  while ((m = re2.exec(html))) {
    urls.add(base + m[0]);
  }
  return [...urls];
}

function extractWebTip(riJson) {
  if (!riJson || typeof riJson !== 'object') return null;
  return riJson.git_sha || riJson.gitSha || riJson.artifact_sha || riJson.sha || null;
}

function extractApiTip(metaJson) {
  if (!metaJson || typeof metaJson !== 'object') return null;
  const build = metaJson.build && typeof metaJson.build === 'object' ? metaJson.build : null;
  return (
    (build && (build.git_sha || build.gitSha || build.sha)) ||
    metaJson.git_sha ||
    metaJson.gitSha ||
    metaJson.sha ||
    null
  );
}

function checkLocalSourceContract() {
  const missing = [];
  const notes = {};
  for (const rel of LOCAL_CONTRACT_FILES) {
    const abs = path.join(ROOT, rel);
    if (!fs.existsSync(abs)) missing.push(rel);
  }
  let ok = missing.length === 0;

  const hardening = path.join(ROOT, 'frontend/lib/admin/adminEnterpriseHardeningContract.ts');
  if (fs.existsSync(hardening)) {
    const src = fs.readFileSync(hardening, 'utf8');
    notes.r014_markers =
      src.includes('guidesFilterBar') &&
      src.includes('guidesTableNowrap') &&
      src.includes('data-tt-admin-enterprise-guides-filter-bar');
    notes.r021_status_select =
      src.includes('guidesStatusSelect') &&
      src.includes('data-tt-admin-enterprise-guides-status-select');
    if (!notes.r014_markers || !notes.r021_status_select) ok = false;
  } else {
    ok = false;
  }

  const guidesMain = path.join(ROOT, 'frontend/app/admin/guides/AdminGuidesPageMain.tsx');
  if (fs.existsSync(guidesMain)) {
    const src = fs.readFileSync(guidesMain, 'utf8');
    notes.r014_main =
      src.includes('data-tt-admin-enterprise-guides-filter-bar') &&
      src.includes('data-tt-admin-enterprise-guides-table-nowrap');
    notes.r021_main = src.includes('data-tt-admin-enterprise-guides-status-select');
    if (!notes.r014_main || !notes.r021_main) ok = false;
  } else {
    ok = false;
  }

  const guidesModel = path.join(ROOT, 'frontend/app/admin/guides/adminGuidesPageModel.ts');
  if (fs.existsSync(guidesModel)) {
    const src = fs.readFileSync(guidesModel, 'utf8');
    notes.r021_no_data_origin = !/\bdata_origin\b/.test(src);
    if (!notes.r021_no_data_origin) ok = false;
  } else {
    ok = false;
  }

  const approvals = path.join(ROOT, 'frontend/app/admin/approvals/AdminApprovalsTableSection.tsx');
  if (fs.existsSync(approvals)) {
    const src = fs.readFileSync(approvals, 'utf8');
    notes.r010_cta = src.includes('data-tt-admin-approvals-review-cta');
    if (!notes.r010_cta) ok = false;
  } else {
    ok = false;
  }

  const onboarding = path.join(ROOT, 'frontend/app/admin/onboarding/AdminOnboardingHubPageMain.tsx');
  if (fs.existsSync(onboarding)) {
    const src = fs.readFileSync(onboarding, 'utf8');
    notes.r044_strip = src.includes('data-tt-admin-onboarding-review-strip');
    if (!notes.r044_strip) ok = false;
  } else {
    ok = false;
  }

  const listErr = path.join(ROOT, 'frontend/components/admin/AdminListFetchError.tsx');
  const hints = path.join(ROOT, 'frontend/components/admin/ops/OpsPlaneAuthHints.tsx');
  if (fs.existsSync(listErr) && fs.existsSync(hints)) {
    const listSrc = fs.readFileSync(listErr, 'utf8');
    const hintSrc = fs.readFileSync(hints, 'utf8');
    notes.r057 =
      listSrc.includes('data-tt-admin-list-fetch-auth-hints') &&
      listSrc.includes('OpsPlaneAuthHints') &&
      hintSrc.includes('data-tt-ops-plane-auth-hint');
    if (!notes.r057) ok = false;
  } else {
    ok = false;
  }

  const routes = path.join(ROOT, 'frontend/lib/api/routesAdminCore.ts');
  if (fs.existsSync(routes)) {
    const src = fs.readFileSync(routes, 'utf8');
    notes.r014_api_client =
      /city/.test(src) && /country_code/.test(src) && /guides/.test(src);
    if (!notes.r014_api_client) ok = false;
  } else {
    ok = false;
  }

  const qt = path.join(ROOT, 'crates/api/src/routes/admin/query_types.rs');
  if (fs.existsSync(qt)) {
    const src = fs.readFileSync(qt, 'utf8');
    notes.r014_api_query =
      src.includes('country_code') &&
      (/pub city/.test(src) || /city:/.test(src)) &&
      (/\bq\b/.test(src) || /pub q/.test(src));
    if (!notes.r014_api_query) ok = false;
  } else {
    ok = false;
  }

  return { ok, missing, notes };
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const checks = [];
  let blocked = false;

  const local = checkLocalSourceContract();
  checks.push({
    id: 'CUTB-EWG-LOCAL-SOURCE-CONTRACT',
    pass: local.ok,
    detail: local,
  });
  if (!local.ok) blocked = true;

  const meta = await fetchJson(`${API}/meta?t=${Date.now()}`);
  const apiTip = extractApiTip(meta.json);
  const apiTipMatch = !EXPECT_API_SHA || (Boolean(apiTip) && apiTip === EXPECT_API_SHA);
  checks.push({
    id: 'CUTB-EWG-API-META',
    pass: meta.status === 200 && Boolean(apiTip) && apiTipMatch,
    detail: {
      status: meta.status,
      api_tip: apiTip,
      expect_api_sha: EXPECT_API_SHA || null,
      api_tip_match: apiTipMatch,
    },
  });
  if (!checks[checks.length - 1].pass) blocked = true;

  const ri = await fetchJson(`${WEB}/api/release-identity?t=${Date.now()}`);
  const webTip = extractWebTip(ri.json);
  const tipMatch = Boolean(EXPECT_SHA) && Boolean(webTip) && webTip === EXPECT_SHA;
  checks.push({
    id: 'CUTB-EWG-WEB-RELEASE-IDENTITY',
    pass: ri.status === 200 && Boolean(webTip) && tipMatch,
    detail: {
      status: ri.status,
      web_tip: webTip,
      expect_sha: EXPECT_SHA || null,
      tip_match: tipMatch,
      note: 'FE tip must equal post-deploy bake SHA (TT_CUT_B_ENG_WAVE_FE_EXPECT_SHA required).',
    },
  });
  if (!checks[checks.length - 1].pass) blocked = true;

  const home = await fetchText(`${WEB}/`).catch((e) => ({
    status: 0,
    body: '',
    error: String(e && e.message ? e.message : e),
  }));
  checks.push({
    id: 'CUTB-EWG-WEB-HOME',
    pass: home.status === 200 && (home.body || '').length > 100,
    detail: { status: home.status, bytes: (home.body || '').length, error: home.error || null },
  });
  if (home.status !== 200) blocked = true;

  let auth = null;
  let authError = null;
  try {
    auth = await resolveAdminWebCookie();
  } catch (e) {
    authError = String(e && e.message ? e.message : e);
    blocked = true;
  }
  checks.push({
    id: 'CUTB-EWG-ADMIN-SESSION',
    pass: !!auth && !authError,
    detail: auth
      ? {
          email: auth.email,
          role: auth.role,
          user_id: auth.user_id,
          token_prefix: auth.token_prefix,
        }
      : { error: authError },
  });

  const probePaths = ['/admin/approvals', '/admin/guides', '/admin/onboarding', '/admin'];
  let chunkUrls = [];
  const pageHits = [];
  const pageBodies = {};
  const cookieHeaders = auth ? { Cookie: auth.cookie } : {};
  for (const p of probePaths) {
    const page = await fetchText(WEB + p, 45000, cookieHeaders).catch((e) => ({
      status: 0,
      body: '',
      error: String(e && e.message ? e.message : e),
    }));
    pageHits.push({
      path: p,
      status: page.status,
      bytes: (page.body || '').length,
      location: page.location || null,
      error: page.error || null,
    });
    if (page.status === 200 && page.body) {
      pageBodies[p] = page.body;
      for (const u of extractChunkUrls(page.body, WEB)) {
        if (!chunkUrls.includes(u)) chunkUrls.push(u);
      }
    }
  }
  const adminOk = pageHits.some((h) => h.status === 200);
  checks.push({
    id: 'CUTB-EWG-ADMIN-HTML-PROBE',
    pass: adminOk,
    detail: { pageHits, chunk_count: chunkUrls.length },
  });
  if (!adminOk) blocked = true;

  const MAX_CHUNKS = Number(process.env.TT_CUT_B_ENG_WAVE_FE_MAX_CHUNKS || 200);
  chunkUrls.sort((a, b) => {
    const score = (u) =>
      /approvals|guides|onboarding|AdminApprovals|AdminGuides|AdminOnboarding|AdminListFetch|OpsPlaneAuth/i.test(
        u
      )
        ? 0
        : /chunks\/app\/admin/i.test(u)
          ? 1
          : 2;
    return score(a) - score(b);
  });
  chunkUrls = chunkUrls.slice(0, MAX_CHUNKS);

  const markerHits = Object.fromEntries(MARKERS.map((m) => [m, { found: false, samples: [] }]));
  let chunksScanned = 0;
  let chunksFailed = 0;

  for (const [p, body] of Object.entries(pageBodies)) {
    for (const m of MARKERS) {
      if (body.includes(m)) {
        markerHits[m].found = true;
        if (markerHits[m].samples.length < 3) markerHits[m].samples.push(`html:${p}`);
      }
    }
  }

  for (const url of chunkUrls) {
    try {
      const c = await fetchText(url, 60000);
      if (c.status !== 200) {
        chunksFailed += 1;
        continue;
      }
      chunksScanned += 1;
      for (const m of MARKERS) {
        if (c.body.includes(m)) {
          markerHits[m].found = true;
          if (markerHits[m].samples.length < 3) markerHits[m].samples.push(url);
        }
      }
      if (MARKERS.every((m) => markerHits[m].found)) break;
    } catch (_) {
      chunksFailed += 1;
    }
  }

  const residual_map = {
    'V65-PROD-003-B3-R010': markerHits['data-tt-admin-approvals-review-cta'].found,
    'V65-PROD-003-B3-R014':
      markerHits['data-tt-admin-enterprise-guides-filter-bar'].found &&
      markerHits['data-tt-admin-enterprise-guides-table-nowrap'].found &&
      local.notes &&
      local.notes.r014_api_query === true,
    'V65-PROD-003-B3-R021':
      markerHits['data-tt-admin-enterprise-guides-status-select'].found &&
      local.notes &&
      local.notes.r021_no_data_origin === true,
    'V65-PROD-003-B3-R044': markerHits['data-tt-admin-onboarding-review-strip'].found,
    'V65-PROD-003-B3-R057':
      markerHits['data-tt-admin-list-fetch-auth-hints'].found &&
      markerHits['data-tt-ops-plane-auth-hint'].found,
  };

  const allResiduals = RESIDUALS.every((id) => residual_map[id]);
  checks.push({
    id: 'CUTB-EWG-FE-MARKERS',
    pass: allResiduals,
    residual_map,
    detail: {
      markers: markerHits,
      chunks_scanned: chunksScanned,
      chunks_failed: chunksFailed,
      chunk_urls_capped: chunkUrls.length,
    },
  });
  if (!allResiduals) blocked = true;

  const verdict = blocked ? 'BLOCKED' : 'PASS';
  const report = {
    schema: 'tt.v65.prod_003.batch3.cut_b_eng_wave.fe.staging_smoke.v1',
    stamp,
    hosts: { api: API, web: WEB },
    residuals: RESIDUALS,
    cut: 'CUT_B',
    track: 'CUT_B_ENG_WAVE',
    expect_fe_sha: EXPECT_SHA || null,
    expect_api_sha: EXPECT_API_SHA || null,
    web_tip: webTip,
    api_tip: apiTip,
    tip_match: tipMatch,
    api_tip_match: apiTipMatch,
    tt_production_go: 'NO_GO',
    enterprise_l5_production_ready: false,
    residual_map,
    verdict,
    checks,
    generated_at: new Date().toISOString(),
    honesty:
      'RUNTIME_VERIFIED Staging FE/API eng-wave PASS ≠ OWNER_VALIDATED ≠ full Cut B CLOSED (OD R012/R019 remain) ≠ Cut C product start ≠ Production GO. R031 = Residual SSOT honesty after PASS.',
    note:
      verdict === 'PASS'
        ? 'R010/R014/R021/R044/R057 Staging eng-wave PASS — eligible Residual Close + R031 honesty. Keep TT_PRODUCTION_GO=NO_GO. OD R012/R019 stay OPEN; do not Production deploy.'
        : 'Cut B eng-wave Staging BLOCKED — commit+deploy FE/API tip then re-run with TT_CUT_B_ENG_WAVE_FE_EXPECT_SHA / API_EXPECT_SHA.',
  };

  const reportPath = path.join(outDir, 'report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');
  const latestDir = path.join(ROOT, 'evidence', 'GO_v65_prod_003_batch3_cut_b_eng_wave');
  fs.mkdirSync(latestDir, { recursive: true });
  fs.writeFileSync(path.join(latestDir, 'LATEST.json'), JSON.stringify(report, null, 2) + '\n');
  fs.writeFileSync(
    path.join(latestDir, 'LATEST.md'),
    [
      `# V65 Batch3 Cut B Eng-Wave · Staging Smoke`,
      ``,
      `- **stamp:** \`${stamp}\``,
      `- **verdict:** \`${verdict}\``,
      `- **residuals:** R010 · R014 · R021 · R044 · R057 (R031 docs after PASS)`,
      `- **expect FE SHA:** \`${EXPECT_SHA || 'n/a'}\``,
      `- **Web tip:** \`${webTip || 'n/a'}\``,
      `- **API tip:** \`${apiTip || 'n/a'}\``,
      `- **tip_match:** \`${tipMatch}\``,
      `- **TT_PRODUCTION_GO:** NO_GO`,
      `- **report:** \`${reportPath.replace(/\\/g, '/')}\``,
      ``,
      report.note,
      ``,
      report.honesty,
      ``,
    ].join('\n')
  );

  console.log(
    JSON.stringify(
      {
        stamp,
        verdict,
        web_tip: webTip,
        api_tip: apiTip,
        tip_match: tipMatch,
        residual_map,
        report: reportPath,
      },
      null,
      2
    )
  );
  console.log(`TT_CUT_B_ENG_WAVE_FE_SMOKE_VERDICT: ${verdict}`);
  process.exit(blocked ? 2 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
