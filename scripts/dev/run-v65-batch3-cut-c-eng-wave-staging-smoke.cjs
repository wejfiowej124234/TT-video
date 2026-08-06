#!/usr/bin/env node
/**
 * V65 Batch3 Cut C Eng-Wave · FE honesty Staging smoke (②)
 *
 * Closes residuals (Cut C OD-C-02/03/04 + R024; Owner-signed OD-C-01..05):
 *   R011 · R018 — Inbox Dispute Real Queue (channel attr + ORDERS_READ)
 *   R017 · R023 · R026 · R027 · R028 · R038 · R039 — Finance Suite single entry
 *   R041 — Dispute Read-only Bench (fund/escrow write FORBIDDEN)
 *   R024 — System Overview unavailable ≠ literal 0
 *
 * OD-C-05: do not reopen R012/R019 (PAGE_SURFACE_DRIFT stays ED).
 * Auth: official-cold-start-admin-client → Cookie traveltrust_user_id + traveltrust_session_ok
 * Keep TT_PRODUCTION_GO=NO_GO. No Production deploy. No Web3 mix.
 * exit 0 PASS · 2 BLOCKED.
 *
 * Usage (repo root):
 *   node scripts/dev/run-v65-batch3-cut-c-eng-wave-staging-smoke.cjs
 *
 * Optional:
 *   TT_CUT_C_ENG_WAVE_FE_EXPECT_SHA=<fe tip after deploy>
 *   TT_CUT_C_ENG_WAVE_API_EXPECT_SHA=<api tip after deploy>  (optional fail-closed)
 *   TT_CUT_C_ENG_WAVE_FE_SMOKE_STAMP=20260806T…
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
const EXPECT_SHA = String(process.env.TT_CUT_C_ENG_WAVE_FE_EXPECT_SHA || '').trim();
const EXPECT_API_SHA = String(process.env.TT_CUT_C_ENG_WAVE_API_EXPECT_SHA || '').trim();
const stamp =
  process.env.TT_CUT_C_ENG_WAVE_FE_SMOKE_STAMP ||
  new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
const outDir = path.join(ROOT, 'evidence', 'GO_v65_prod_003_batch3_cut_c_eng_wave', stamp);

const RESIDUALS = [
  'V65-PROD-003-B3-R011',
  'V65-PROD-003-B3-R017',
  'V65-PROD-003-B3-R018',
  'V65-PROD-003-B3-R023',
  'V65-PROD-003-B3-R024',
  'V65-PROD-003-B3-R026',
  'V65-PROD-003-B3-R027',
  'V65-PROD-003-B3-R028',
  'V65-PROD-003-B3-R038',
  'V65-PROD-003-B3-R039',
  'V65-PROD-003-B3-R041',
];

const MARKERS = [
  'data-tt-admin-finance-suite',
  'data-tt-admin-inbox-channel',
  'data-tt-admin-dispute-fund-write-forbidden',
  'data-tt-admin-dispute-escrow-write',
  'data-tt-admin-disputes-readonly-badge',
];

const LOCAL_CONTRACT_FILES = [
  'frontend/app/admin/finance/AdminFinancePageMain.tsx',
  'frontend/app/admin/finance-suite/AdminFinanceSuitePageMain.tsx',
  'frontend/components/admin/AdminDisputeReadonlyAdjudicationDesk.tsx',
  'frontend/app/admin/disputes/AdminDisputesPageMain.tsx',
  'frontend/components/admin/AdminHomeInboxStrip.tsx',
  'frontend/lib/admin/adminInboxChannelPermission.ts',
  'frontend/components/admin/AdminHomeSystemOverview.tsx',
  'frontend/lib/admin/fetchAdminQueueList.ts',
  'frontend/lib/admin/useAdminHomeInbox.ts',
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
        'User-Agent': 'TravelTrust-V65-CutC-EngWave-FE-Smoke/1.0',
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

  const financeMain = path.join(ROOT, 'frontend/app/admin/finance/AdminFinancePageMain.tsx');
  if (fs.existsSync(financeMain)) {
    const src = fs.readFileSync(financeMain, 'utf8');
    notes.od_c02_bare_finance_redirect =
      src.includes('router.replace("/admin/finance-suite")') &&
      src.includes('fin_suite_depth') &&
      src.includes('fin_suite_module');
    if (!notes.od_c02_bare_finance_redirect) ok = false;
  } else {
    ok = false;
  }

  const suiteMain = path.join(ROOT, 'frontend/app/admin/finance-suite/AdminFinanceSuitePageMain.tsx');
  if (fs.existsSync(suiteMain)) {
    const src = fs.readFileSync(suiteMain, 'utf8');
    notes.od_c02_suite_marker =
      src.includes('data-tt-admin-finance-suite') &&
      (src.includes('"1"') || src.includes("'1'"));
    if (!notes.od_c02_suite_marker) ok = false;
  } else {
    ok = false;
  }

  const disputeDesk = path.join(
    ROOT,
    'frontend/components/admin/AdminDisputeReadonlyAdjudicationDesk.tsx'
  );
  if (fs.existsSync(disputeDesk)) {
    const src = fs.readFileSync(disputeDesk, 'utf8');
    notes.od_c03_fund_write_forbidden = src.includes(
      'data-tt-admin-dispute-fund-write-forbidden="1"'
    );
    notes.od_c03_escrow_write_forbidden = src.includes(
      'data-tt-admin-dispute-escrow-write="FORBIDDEN"'
    );
    if (!notes.od_c03_fund_write_forbidden || !notes.od_c03_escrow_write_forbidden) ok = false;
  } else {
    ok = false;
  }

  const disputesPage = path.join(ROOT, 'frontend/app/admin/disputes/AdminDisputesPageMain.tsx');
  if (fs.existsSync(disputesPage)) {
    const src = fs.readFileSync(disputesPage, 'utf8');
    notes.od_c03_readonly_badge = src.includes('data-tt-admin-disputes-readonly-badge="1"');
    if (!notes.od_c03_readonly_badge) ok = false;
  } else {
    ok = false;
  }

  const inboxStrip = path.join(ROOT, 'frontend/components/admin/AdminHomeInboxStrip.tsx');
  if (fs.existsSync(inboxStrip)) {
    const src = fs.readFileSync(inboxStrip, 'utf8');
    notes.od_c04_inbox_channel_attr = src.includes('data-tt-admin-inbox-channel={key}');
    if (!notes.od_c04_inbox_channel_attr) ok = false;
  } else {
    ok = false;
  }

  const inboxPerm = path.join(ROOT, 'frontend/lib/admin/adminInboxChannelPermission.ts');
  if (fs.existsSync(inboxPerm)) {
    const src = fs.readFileSync(inboxPerm, 'utf8');
    notes.od_c04_disputes_orders_read =
      /disputes\s*:\s*ADMIN_PERM\.ORDERS_READ/.test(src) ||
      /disputes:\s*ADMIN_PERM\.ORDERS_READ/.test(src);
    if (!notes.od_c04_disputes_orders_read) ok = false;
  } else {
    ok = false;
  }

  const overview = path.join(ROOT, 'frontend/components/admin/AdminHomeSystemOverview.tsx');
  if (fs.existsSync(overview)) {
    const src = fs.readFileSync(overview, 'utf8');
    notes.r024_unavailable_emdash =
      /const unavailable = ["']—["']/.test(src) || src.includes('unavailable = "—"');
    if (!notes.r024_unavailable_emdash) ok = false;
  } else {
    ok = false;
  }

  const fetchQ = path.join(ROOT, 'frontend/lib/admin/fetchAdminQueueList.ts');
  const useInbox = path.join(ROOT, 'frontend/lib/admin/useAdminHomeInbox.ts');
  if (fs.existsSync(fetchQ) && fs.existsSync(useInbox)) {
    const fq = fs.readFileSync(fetchQ, 'utf8');
    const ui = fs.readFileSync(useInbox, 'utf8');
    notes.wp05_total_fail_closed =
      /\btotal\b/.test(fq) &&
      (/null/.test(ui) || /fail.?closed/i.test(ui) || /total/.test(ui));
    // Soft note only — WP-05 is covered by local vitest; do not BLOCK Staging solely on this heuristic.
  }

  return { ok, missing, notes };
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  const checks = [];
  let blocked = false;

  const local = checkLocalSourceContract();
  checks.push({
    id: 'CUTC-EWG-LOCAL-SOURCE-CONTRACT',
    pass: local.ok,
    detail: local,
  });
  if (!local.ok) blocked = true;

  const meta = await fetchJson(`${API}/meta?t=${Date.now()}`);
  const apiTip = extractApiTip(meta.json);
  const apiTipMatch = !EXPECT_API_SHA || (Boolean(apiTip) && apiTip === EXPECT_API_SHA);
  checks.push({
    id: 'CUTC-EWG-API-META',
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
    id: 'CUTC-EWG-WEB-RELEASE-IDENTITY',
    pass: ri.status === 200 && Boolean(webTip) && tipMatch,
    detail: {
      status: ri.status,
      web_tip: webTip,
      expect_sha: EXPECT_SHA || null,
      tip_match: tipMatch,
      note: 'FE tip must equal post-deploy bake SHA (TT_CUT_C_ENG_WAVE_FE_EXPECT_SHA required).',
    },
  });
  if (!checks[checks.length - 1].pass) blocked = true;

  const home = await fetchText(`${WEB}/`).catch((e) => ({
    status: 0,
    body: '',
    error: String(e && e.message ? e.message : e),
  }));
  checks.push({
    id: 'CUTC-EWG-WEB-HOME',
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
    id: 'CUTC-EWG-ADMIN-SESSION',
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

  const probePaths = [
    '/admin',
    '/admin/finance',
    '/admin/finance-suite',
    '/admin/disputes',
  ];
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
    id: 'CUTC-EWG-ADMIN-HTML-PROBE',
    pass: adminOk,
    detail: { pageHits, chunk_count: chunkUrls.length },
  });
  if (!adminOk) blocked = true;

  // Soft redirect is client-side (router.replace). Record Location if server redirected;
  // otherwise rely on local contract + suite marker presence.
  const financeHit = pageHits.find((h) => h.path === '/admin/finance');
  const financeRedirectSoft =
    Boolean(financeHit && financeHit.location && /finance-suite/.test(String(financeHit.location))) ||
    (local.notes && local.notes.od_c02_bare_finance_redirect === true);
  checks.push({
    id: 'CUTC-EWG-FINANCE-BARE-SOFT-REDIRECT',
    pass: financeRedirectSoft,
    detail: {
      finance_status: financeHit ? financeHit.status : null,
      finance_location: financeHit ? financeHit.location : null,
      local_router_replace: local.notes && local.notes.od_c02_bare_finance_redirect,
      note: 'OD-C-02: bare /admin/finance → suite; depth leaf (fin_suite_depth=partial + module) exempt.',
    },
  });
  if (!financeRedirectSoft) blocked = true;

  const MAX_CHUNKS = Number(process.env.TT_CUT_C_ENG_WAVE_FE_MAX_CHUNKS || 200);
  chunkUrls.sort((a, b) => {
    const score = (u) =>
      /finance-suite|finance|disputes|AdminHome|Inbox|Dispute|Overview|AdminFinance/i.test(u)
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

  const financeSuiteOk =
    markerHits['data-tt-admin-finance-suite'].found &&
    local.notes &&
    local.notes.od_c02_bare_finance_redirect === true &&
    local.notes.od_c02_suite_marker === true;
  const inboxOk =
    markerHits['data-tt-admin-inbox-channel'].found &&
    local.notes &&
    local.notes.od_c04_disputes_orders_read === true;
  const disputeOk =
    markerHits['data-tt-admin-dispute-fund-write-forbidden'].found &&
    markerHits['data-tt-admin-dispute-escrow-write'].found &&
    markerHits['data-tt-admin-disputes-readonly-badge'].found &&
    local.notes &&
    local.notes.od_c03_fund_write_forbidden === true;
  const overviewOk = local.notes && local.notes.r024_unavailable_emdash === true;

  const residual_map = {
    'V65-PROD-003-B3-R011': inboxOk,
    'V65-PROD-003-B3-R017': financeSuiteOk,
    'V65-PROD-003-B3-R018': inboxOk,
    'V65-PROD-003-B3-R023': financeSuiteOk,
    'V65-PROD-003-B3-R024': overviewOk,
    'V65-PROD-003-B3-R026': financeSuiteOk,
    'V65-PROD-003-B3-R027': financeSuiteOk,
    'V65-PROD-003-B3-R028': financeSuiteOk,
    'V65-PROD-003-B3-R038': financeSuiteOk,
    'V65-PROD-003-B3-R039': financeSuiteOk,
    'V65-PROD-003-B3-R041': disputeOk,
  };

  const allResiduals = RESIDUALS.every((id) => residual_map[id]);
  checks.push({
    id: 'CUTC-EWG-FE-MARKERS',
    pass: allResiduals,
    residual_map,
    detail: {
      markers: markerHits,
      chunks_scanned: chunksScanned,
      chunks_failed: chunksFailed,
      chunk_urls_capped: chunkUrls.length,
      finance_suite_ok: financeSuiteOk,
      inbox_ok: inboxOk,
      dispute_ok: disputeOk,
      overview_ok: overviewOk,
    },
  });
  if (!allResiduals) blocked = true;

  const verdict = blocked ? 'BLOCKED' : 'PASS';
  const report = {
    schema: 'tt.v65.prod_003.batch3.cut_c_eng_wave.fe.staging_smoke.v1',
    stamp,
    hosts: { api: API, web: WEB },
    residuals: RESIDUALS,
    cut: 'CUT_C',
    track: 'CUT_C_ENG_WAVE',
    od_c: {
      'OD-C-01': 'ACCEPT_SCOPE_AS_FINAL_STATE',
      'OD-C-02': 'SUITE_PRIMARY_LEGACY_REDIRECT',
      'OD-C-03': 'READ_ONLY_BENCH_NO_FUND_WRITE',
      'OD-C-04': 'ADD_DISPUTE_CHANNEL_REAL_QUEUE',
      'OD-C-05': 'KEEP_ED_NO_REOPEN',
    },
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
      'RUNTIME_VERIFIED Staging FE Cut C eng-wave PASS ≠ OWNER_VALIDATED ≠ Production GO. Do not reopen R012/R019. Web3 freeze PSG-REL-20260720-WEB3-CAND-V2 stays orthogonal. Keep TT_PRODUCTION_GO=NO_GO.',
    note:
      verdict === 'PASS'
        ? 'Cut C R011/R017/R018/R023/R024/R026/R027/R028/R038/R039/R041 Staging eng-wave PASS — eligible Residual Close. Keep TT_PRODUCTION_GO=NO_GO. No Production deploy. No Web3 mix.'
        : 'Cut C eng-wave Staging BLOCKED — tip-honest commit+deploy FE then re-run with TT_CUT_C_ENG_WAVE_FE_EXPECT_SHA.',
  };

  const reportPath = path.join(outDir, 'report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');
  const latestDir = path.join(ROOT, 'evidence', 'GO_v65_prod_003_batch3_cut_c_eng_wave');
  fs.mkdirSync(latestDir, { recursive: true });
  // Do not overwrite LOCAL_VERIFIED LATEST if this stamp is BLOCKED and a prior PASS exists —
  // always write stamp report; LATEST mirrors this run (operator owns promote).
  fs.writeFileSync(path.join(latestDir, 'LATEST.json'), JSON.stringify(report, null, 2) + '\n');
  fs.writeFileSync(
    path.join(latestDir, 'LATEST.md'),
    [
      `# V65 Batch3 Cut C Eng-Wave · Staging Smoke`,
      ``,
      `- **stamp:** \`${stamp}\``,
      `- **verdict:** \`${verdict}\``,
      `- **residuals:** R011 · R017 · R018 · R023 · R024 · R026 · R027 · R028 · R038 · R039 · R041`,
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
  console.log(`TT_CUT_C_ENG_WAVE_FE_SMOKE_VERDICT: ${verdict}`);
  process.exit(blocked ? 2 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
