#!/usr/bin/env node
/**
 * V65 Batch3 Cut B OD R012/R019 · Staging smoke (②)
 *
 * Owner Decision: REMOVE_TODO_DUPLICATE_KEEP_RECENT_ONLY
 *   R012 — Companion recent-only (no todo UL duplicate)
 *   R019 — Overview inbox-pending KPI removed (今日待办 sole pending)
 *
 * Auth: official-cold-start-admin-client → Cookie traveltrust_user_id + traveltrust_session_ok
 * Keep TT_PRODUCTION_GO=NO_GO. Staging only. No Production. No Cut C eng.
 * exit 0 PASS · 2 BLOCKED.
 *
 * Usage (repo root):
 *   node scripts/dev/run-v65-batch3-cut-b-od-r012-r019-staging-smoke.cjs
 *
 * Required:
 *   TT_CUT_B_OD_FE_EXPECT_SHA=<fe tip after Staging deploy>
 *
 * Optional:
 *   TT_CUT_B_OD_API_EXPECT_SHA=<api tip>  (default: keep eng-wave API tip)
 *   TT_CUT_B_OD_FE_SMOKE_STAMP=20260806T…
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
const EXPECT_SHA = String(process.env.TT_CUT_B_OD_FE_EXPECT_SHA || '').trim();
const EXPECT_API_SHA = String(
  process.env.TT_CUT_B_OD_API_EXPECT_SHA || '1915ec4da828e0139e90a85cd321415fdb6e53d9'
).trim();
const stamp =
  process.env.TT_CUT_B_OD_FE_SMOKE_STAMP ||
  new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
const outDir = path.join(ROOT, 'evidence', 'GO_v65_prod_003_batch3_cut_b_od_r012_r019', stamp);

const RESIDUALS = ['V65-PROD-003-B3-R012', 'V65-PROD-003-B3-R019'];

const MARKERS_REQUIRED = [
  'data-tt-admin-home-focus-companion-recent-only="od-r012"',
  'data-tt-admin-home-overview-pending-dedupe="od-r019"',
  'tt_admin_home_focus_companion_recent_only_od_r012',
];

const MARKERS_ABSENT = [
  'data-tt-admin-home-focus-companion-todos',
];

const LOCAL_CONTRACT_FILES = [
  'frontend/components/admin/AdminHomeFocusCompanion.tsx',
  'frontend/components/admin/AdminHomeSystemOverview.tsx',
  'frontend/lib/admin/adminHomeFocusCompanionTodoOnly.ts',
  'frontend/components/admin/adminHomeL5.contract.test.ts',
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
        'User-Agent': 'TravelTrust-V65-CutB-OD-R012-R019-Smoke/1.0',
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
    metaJson.git_sha ||
    metaJson.gitSha ||
    (build && (build.git_sha || build.gitSha)) ||
    metaJson.sha ||
    null
  );
}

function checkLocalSourceContract() {
  const notes = {};
  let ok = true;
  const missing = [];
  for (const rel of LOCAL_CONTRACT_FILES) {
    const p = path.join(ROOT, rel);
    if (!fs.existsSync(p)) {
      missing.push(rel);
      ok = false;
      continue;
    }
    const src = fs.readFileSync(p, 'utf8');
    notes[rel] = { bytes: src.length };
    if (rel.includes('AdminHomeFocusCompanion')) {
      notes.r012_companion =
        src.includes('data-tt-admin-home-focus-companion-recent-only="od-r012"') &&
        !src.includes('data-tt-admin-home-focus-companion-todos') &&
        src.includes('tt_admin_home_focus_companion_recent_only_od_r012');
      if (!notes.r012_companion) ok = false;
    }
    if (rel.includes('AdminHomeSystemOverview')) {
      notes.r019_overview = src.includes('data-tt-admin-home-overview-pending-dedupe="od-r019"');
      if (!notes.r019_overview) ok = false;
    }
    if (rel.includes('adminHomeFocusCompanionTodoOnly')) {
      notes.r012_lib = src.includes('tt_admin_home_focus_companion_recent_only_od_r012');
      if (!notes.r012_lib) ok = false;
    }
    if (rel.includes('adminHomeL5.contract')) {
      notes.r012_contract =
        src.includes('od-r012') && src.includes('od-r019') && !src.includes('focus-companion-todos');
      if (!notes.r012_contract) ok = false;
    }
  }
  return { ok, missing, notes };
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const checks = [];
  let blocked = false;

  const local = checkLocalSourceContract();
  checks.push({
    id: 'CUTB-OD-LOCAL-SOURCE-CONTRACT',
    pass: local.ok,
    detail: local,
  });
  if (!local.ok) blocked = true;

  if (!EXPECT_SHA) {
    checks.push({
      id: 'CUTB-OD-EXPECT-SHA-REQUIRED',
      pass: false,
      detail: { note: 'TT_CUT_B_OD_FE_EXPECT_SHA required (post-deploy tip).' },
    });
    blocked = true;
  }

  const meta = await fetchJson(`${API}/meta?t=${Date.now()}`);
  const apiTip = extractApiTip(meta.json);
  const apiTipMatch = !EXPECT_API_SHA || (Boolean(apiTip) && apiTip === EXPECT_API_SHA);
  checks.push({
    id: 'CUTB-OD-API-META',
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
    id: 'CUTB-OD-WEB-RELEASE-IDENTITY',
    pass: ri.status === 200 && Boolean(webTip) && tipMatch,
    detail: {
      status: ri.status,
      web_tip: webTip,
      expect_sha: EXPECT_SHA || null,
      tip_match: tipMatch,
      note: 'FE tip must equal post-deploy OD bake SHA.',
    },
  });
  if (!checks[checks.length - 1].pass) blocked = true;

  let auth = null;
  let authError = null;
  try {
    auth = await resolveAdminWebCookie();
  } catch (e) {
    authError = String(e && e.message ? e.message : e);
    blocked = true;
  }
  checks.push({
    id: 'CUTB-OD-ADMIN-SESSION',
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

  const probePaths = ['/admin'];
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
    id: 'CUTB-OD-ADMIN-HTML-PROBE',
    pass: adminOk,
    detail: { pageHits, chunk_count: chunkUrls.length },
  });
  if (!adminOk) blocked = true;

  const MAX_CHUNKS = Number(process.env.TT_CUT_B_OD_FE_MAX_CHUNKS || 200);
  chunkUrls.sort((a, b) => {
    const score = (u) =>
      /AdminHome|FocusCompanion|SystemOverview|admin.*home/i.test(u)
        ? 0
        : /chunks\/app\/admin/i.test(u)
          ? 1
          : 2;
    return score(a) - score(b);
  });
  chunkUrls = chunkUrls.slice(0, MAX_CHUNKS);

  const requiredHits = Object.fromEntries(MARKERS_REQUIRED.map((m) => [m, { found: false, samples: [] }]));
  const absentHits = Object.fromEntries(MARKERS_ABSENT.map((m) => [m, { found: false, samples: [] }]));
  let chunksScanned = 0;
  let chunksFailed = 0;

  for (const [p, body] of Object.entries(pageBodies)) {
    for (const m of MARKERS_REQUIRED) {
      if (body.includes(m)) {
        requiredHits[m].found = true;
        if (requiredHits[m].samples.length < 3) requiredHits[m].samples.push(`html:${p}`);
      }
    }
    for (const m of MARKERS_ABSENT) {
      if (body.includes(m)) {
        absentHits[m].found = true;
        if (absentHits[m].samples.length < 3) absentHits[m].samples.push(`html:${p}`);
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
      for (const m of MARKERS_REQUIRED) {
        if (c.body.includes(m)) {
          requiredHits[m].found = true;
          if (requiredHits[m].samples.length < 3) requiredHits[m].samples.push(url);
        }
      }
      for (const m of MARKERS_ABSENT) {
        if (c.body.includes(m)) {
          absentHits[m].found = true;
          if (absentHits[m].samples.length < 3) absentHits[m].samples.push(url);
        }
      }
      if (
        MARKERS_REQUIRED.every((m) => requiredHits[m].found) &&
        MARKERS_ABSENT.every((m) => !absentHits[m].found)
      ) {
        break;
      }
    } catch (_) {
      chunksFailed += 1;
    }
  }

  const requiredOk = MARKERS_REQUIRED.every((m) => requiredHits[m].found);
  const absentOk = MARKERS_ABSENT.every((m) => !absentHits[m].found);
  checks.push({
    id: 'CUTB-OD-MARKERS-RUNTIME',
    pass: requiredOk && absentOk,
    detail: {
      required: requiredHits,
      absent_must_not_appear: absentHits,
      chunks_scanned: chunksScanned,
      chunks_failed: chunksFailed,
      chunk_urls_capped: chunkUrls.length,
    },
  });
  if (!requiredOk || !absentOk) blocked = true;

  const residual_map = {
    'V65-PROD-003-B3-R012':
      requiredHits['data-tt-admin-home-focus-companion-recent-only="od-r012"'].found &&
      requiredHits['tt_admin_home_focus_companion_recent_only_od_r012'].found &&
      !absentHits['data-tt-admin-home-focus-companion-todos'].found,
    'V65-PROD-003-B3-R019':
      requiredHits['data-tt-admin-home-overview-pending-dedupe="od-r019"'].found,
  };
  const residualsClosed = RESIDUALS.every((id) => residual_map[id] === true);
  checks.push({
    id: 'CUTB-OD-RESIDUALS-CLOSED',
    pass: residualsClosed && tipMatch && !blocked,
    detail: { residual_map, residuals: RESIDUALS },
  });
  if (!residualsClosed) blocked = true;

  const verdict = blocked ? 'BLOCKED' : 'PASS';
  const report = {
    schema: 'traveltrust.v65_prod_003_batch3_cut_b_od_r012_r019.staging_smoke.v1',
    stamp,
    cut: 'B',
    track: 'OD_R012_R019_STAGING_RUNTIME',
    od_id: 'OD-B3-FOCUS-COMPANION',
    od_decision: 'REMOVE_TODO_DUPLICATE_KEEP_RECENT_ONLY',
    residuals: RESIDUALS,
    verdict,
    status: verdict === 'PASS' ? 'STAGING_RUNTIME_VERIFIED' : 'BLOCKED',
    staging_rc: verdict === 'PASS' ? 'PASS' : 'BLOCKED',
    fe_staging_tip: webTip,
    expect_fe_sha: EXPECT_SHA || null,
    api_tip: apiTip,
    expect_api_sha: EXPECT_API_SHA || null,
    tt_production_go: 'NO_GO',
    enterprise_l5_production_ready: false,
    web_base: WEB,
    api_base: API,
    checks,
    residual_map,
    markers_required: MARKERS_REQUIRED,
    markers_absent: MARKERS_ABSENT,
    honesty: {
      local_od_is_not_staging_rc: true,
      staging_rc_is_not_production_go: true,
      cut_b_full_closed_is_not_cut_c_eng: true,
      v65_prod_cand_20260802_frozen: true,
      web3_pin_orthogonal: 'PSG-REL-20260720-WEB3-CAND-V2',
      no_old_artifact_reuse: true,
      no_direct_production_edit: true,
    },
    cut_c: 'PREP_READY_DOCS_ONLY_NO_ENG',
  };

  fs.writeFileSync(path.join(outDir, 'STAGING-SMOKE.json'), JSON.stringify(report, null, 2) + '\n');
  fs.writeFileSync(path.join(outDir, 'stamp.txt'), stamp + '\n');
  fs.writeFileSync(
    path.join(outDir, 'README.md'),
    [
      '# V65 Cut B OD R012/R019 · Staging smoke',
      '',
      `- stamp: \`${stamp}\``,
      `- verdict: **${verdict}**`,
      `- OD: \`REMOVE_TODO_DUPLICATE_KEEP_RECENT_ONLY\``,
      `- FE tip: \`${webTip || 'n/a'}\``,
      `- API tip: \`${apiTip || 'n/a'}\``,
      `- TT_PRODUCTION_GO: **NO_GO**`,
      `- Cut C: PREP_READY_DOCS_ONLY_NO_ENG`,
      '',
    ].join('\n')
  );

  console.log(
    JSON.stringify(
      {
        stamp,
        verdict,
        outDir,
        fe_tip: webTip,
        api_tip: apiTip,
        residual_map,
      },
      null,
      2
    )
  );
  process.exit(verdict === 'PASS' ? 0 : 2);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
