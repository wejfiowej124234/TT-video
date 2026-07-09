#!/usr/bin/env node
/**
 * Single Official Public Catalog Policy (SOPCP) · audit.
 * Alias: Single Official Baseline (SOB) — same semantics.
 *
 * Scope: Public Catalog surfaces ONLY (GET /guides, market listings, campaigns, …).
 * NOT in scope: total row count in PostgreSQL — Archive/Draft/Test/Demo/Smoke/Historical
 * rows may remain in DB; they must not appear on Public Catalog.
 *
 *   STATE=evidence/GO_official_cold_start_dataset/<UTC>/state.json \
 *   OUT=evidence/GO_official_cold_start_dataset/<UTC>/single-official-baseline-audit.json \
 *   node scripts/dev/audit-single-official-baseline.cjs
 */
const fs = require('fs');
const path = require('path');
const { createClient } = require('./lib/official-cold-start-admin-client.cjs');
const {
  isCanonicalGuideId,
  isOfficialColdStartRow,
  isSmokeContent,
  isNonProductionOrigin,
  classifyPublicLeak,
} = require('./lib/smoke-data-heuristics.cjs');

const ROOT = path.join(__dirname, '../..');
const API = (process.env.API || process.env.API_BASE || 'https://tt-api-staging.fly.dev').replace(/\/$/, '');
const STATE_PATH = process.env.STATE || '';
const OUT = process.env.OUT || '';
const STAMP = process.env.SOB_STAMP || new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, 'Z');

const client = createClient(API);
const issues = [];
const duplicates = [];

function loadState() {
  if (!STATE_PATH || !fs.existsSync(STATE_PATH)) return null;
  return JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
}

function ocsSets(state) {
  const guides = new Set(Object.values(state?.guides || {}).map((v) => v.id).filter(Boolean));
  const provider = new Set(
    Object.entries(state?.listings || {})
      .filter(([k]) => k.startsWith('provider:'))
      .map(([, v]) => v.id)
      .filter(Boolean)
  );
  const acquisition = new Set(
    Object.entries(state?.listings || {})
      .filter(([k]) => k.startsWith('acquisition:'))
      .map(([, v]) => v.id)
      .filter(Boolean)
  );
  const listings = new Set([...provider, ...acquisition]);
  const officialGuides = new Set(Object.values(state?.official_guides || {}).map((v) => v.id).filter(Boolean));
  const campaigns = new Set(Object.values(state?.campaigns || {}).map((v) => v.id).filter(Boolean));
  const chainCities = {};
  for (const [key, v] of Object.entries(state?.guides || {})) {
    const chain = key.replace(/^guide:/, '');
    chainCities[chain] = v.city || chain;
  }
  return { guides, provider, acquisition, listings, officialGuides, campaigns, chainCities };
}

function issue(severity, id, surface, msg, detail = null) {
  issues.push({ severity, id, surface, msg, detail });
}

function dup(surface, kind, key, rows) {
  duplicates.push({ surface, kind, key, count: rows.length, ids: rows.map((r) => r.id) });
}

function classifyExtra(row, surface, ocs, opts) {
  if (surface === 'guides' && isCanonicalGuideId(row.id)) return 'CANONICAL_SHOWCASE';
  if (isNonProductionOrigin(row.data_origin)) return 'TEST_SEED';
  if (isSmokeContent(row)) return 'SMOKE_DEMO';
  if (isOfficialColdStartRow(row, opts)) return 'OCS';
  const leak = classifyPublicLeak(row, surface, opts);
  if (leak === 'EXPECTED_DIFFERENCE') return 'EXPECTED_DIFFERENCE';
  if (row.data_origin === 'production') return 'LEGACY_PRODUCTION';
  return 'UNKNOWN';
}

function auditSurface(name, rows, ocsSet, surfaceKey, opts) {
  const extras = rows.filter((r) => !ocsSet.has(r.id));
  const missing = [...ocsSet].filter((id) => !rows.some((r) => r.id === id));
  const classified = extras.map((r) => ({
    id: r.id,
    label: r.label || r.city || r.title || r.payload?.title || '',
    data_origin: r.data_origin,
    classification: classifyExtra(r, surfaceKey, ocsSet, opts),
  }));

  if (extras.length) {
    issue('blocking', 'SOB_EXTRA', name, `${extras.length} non-OCS row(s) on public surface`, classified);
  }
  if (missing.length) {
    issue('major', 'SOB_MISSING', name, `${missing.length} OCS row(s) missing from public surface`, missing);
  }
  if (rows.length !== ocsSet.size && extras.length === 0 && missing.length === 0) {
    issue('major', 'SOB_COUNT', name, `count ${rows.length} != OCS ${ocsSet.size}`);
  }

  const cityKey = surfaceKey === 'guides' ? 'city' : null;
  if (cityKey) {
    const byCity = {};
    for (const r of rows) {
      const c = (r[cityKey] || '?').trim();
      if (!byCity[c]) byCity[c] = [];
      byCity[c].push(r);
    }
    for (const [c, rs] of Object.entries(byCity)) {
      if (rs.length > 1) dup(name, 'duplicate_city', c, rs);
    }
  }

  return { public_count: rows.length, ocs_expected: ocsSet.size, extras: classified, missing };
}

(async () => {
  const state = loadState();
  if (!state) {
    issue('blocking', 'STATE', 'meta', 'missing state.json');
    process.exit(1);
  }
  const ocs = ocsSets(state);
  const opts = { ocsGuideIds: ocs.guides, ocsListingIds: ocs.listings };

  let c3GuideId = process.env.C3_GUIDE_ID || '';
  if (!c3GuideId) {
    try {
      const c3Tok = await client.userLogin(process.env.C3_EMAIL || 'guide@test.com', process.env.C3_PASS || 'Test123!');
      const me = await client.req('GET', '/api/v1/me', null, c3Tok);
      c3GuideId = me.json.user?.guide_id || me.json.guide_id || '';
    } catch {
      /* optional */
    }
  }
  opts.c3GuideId = c3GuideId;

  const adminTok = await client.adminLogin(process.env.ADMIN_EMAIL || 'tourist@test.com', process.env.ADMIN_PASS || 'Test123!');

  const guidesR = await client.req('GET', '/api/v1/guides?limit=500');
  const guideRows = guidesR.json.items || guidesR.json.guides || [];
  const provR = await client.req('GET', '/api/v1/market/provider/listings?limit=500');
  const provRows = provR.json.items || provR.json.listings || [];
  const acqR = await client.req('GET', '/api/v1/market/acquisition/listings?limit=500');
  const acqRows = acqR.json.items || acqR.json.listings || [];
  const ogR = await client.req('GET', '/api/v1/admin/official/guides?limit=500', null, adminTok);
  const ogRows = (ogR.json.items || ogR.json.guides || []).filter(
    (r) => r.status === 'published' || r.publish_status === 'published' || !r.status
  );
  const campR = await client.req('GET', '/api/v1/admin/official/public-operations/campaigns?limit=100', null, adminTok);
  const campAll = campR.json.items || [];
  const campDeployed = campAll.filter((c) => c.publish_status === 'published' || c.status === 'deployed');
  const coldHero = await client.req('GET', '/api/v1/official/cold-start/surfaces/home_hero');

  const surfaces = {
    guides: auditSurface('guides_public', guideRows, ocs.guides, 'guides', opts),
    provider: auditSurface('provider_public', provRows, ocs.provider, 'provider', opts),
    acquisition: auditSurface('acquisition_public', acqRows, ocs.acquisition, 'acquisition', opts),
    official_guides: auditSurface('official_guides_admin', ogRows, ocs.officialGuides, 'official_guides', opts),
    campaigns: auditSurface('campaigns_deployed', campDeployed, ocs.campaigns, 'campaigns', opts),
  };

  const publishQueue = {};
  for (const et of ['guides', 'market_listings']) {
    const q = await client.req(
      'GET',
      `/api/v1/admin/official/public-operations/publish-queue?entity_type=${et}&limit=500`,
      null,
      adminTok
    );
    const published = (q.json.items || []).filter((x) => x.display_status === 'published');
    const ocsSet = et === 'guides' ? ocs.guides : ocs.listings;
    const nonOcs = published.filter((r) => !ocsSet.has(r.id));
    publishQueue[et] = {
      published: published.length,
      non_ocs: nonOcs.map((r) => ({
        id: r.id,
        label: r.label,
        data_origin: r.data_origin,
        classification: classifyExtra(r, et === 'guides' ? 'guides' : 'provider', ocsSet, opts),
      })),
    };
    if (nonOcs.length) {
      issue('blocking', 'SOB_PQ_EXTRA', `publish_queue_${et}`, `${nonOcs.length} non-OCS published`, publishQueue[et].non_ocs);
    }
  }

  if (c3GuideId && guideRows.some((g) => g.id === c3GuideId)) {
    issue('blocking', 'SOB_C3_LEAK', 'guides_public', 'C3 test guide visible on public catalog (post-OCS baseline)', c3GuideId);
  }

  const blocking = issues.filter((i) => i.severity === 'blocking').length;
  const verdict = blocking === 0 && duplicates.length === 0 ? 'PASS' : 'FAIL';

  const remediation = [];
  for (const i of issues) {
    if (i.id === 'SOB_EXTRA' || i.id === 'SOB_PQ_EXTRA') {
      for (const row of i.detail || []) {
        if (row.classification === 'EXPECTED_DIFFERENCE') continue;
        remediation.push({
          action: 'unpublish',
          surface: i.surface,
          id: row.id,
          label: row.label,
          reason: row.classification,
        });
      }
    }
  }

  const payload = {
    schema: 'traveltrust.single_official_public_catalog_audit.v1',
    policy: 'single_official_public_catalog_policy',
    policy_registry: 'registry/single-official-public-catalog-policy.v1.yaml',
    alias: ['SOB', 'SOPCP'],
    stamp: STAMP,
    recorded_at: new Date().toISOString(),
    api: API,
    state_path: STATE_PATH,
    verdict,
    scope: {
      in_scope: 'public_catalog_consumer_and_published_admin_surfaces',
      out_of_scope: 'database_total_entity_count',
      db_retention: 'archive_draft_test_demo_smoke_historical_may_remain_unpublished',
    },
    expected_difference: {
      c3_on_public_guides: false,
      note: 'Post-OCS staging: C3 retained for login/联调 only; not on public catalog (TRAVELTRUST_SEED_GUIDE_PUBLIC_MARKET=0)',
    },
    surfaces,
    publish_queue: publishQueue,
    cold_start_home_hero: { status: coldHero.status, ok: coldHero.status === 200 },
    duplicate_inventory: duplicates,
    issues,
    remediation_plan: remediation,
    summary: {
      blocking: issues.filter((i) => i.severity === 'blocking').length,
      major: issues.filter((i) => i.severity === 'major').length,
      duplicate_groups: duplicates.length,
      remediation_actions: remediation.length,
    },
  };

  if (OUT) {
    fs.mkdirSync(path.dirname(OUT), { recursive: true });
    fs.writeFileSync(OUT, JSON.stringify(payload, null, 2) + '\n');
  }

  console.log(`SOB_AUDIT_VERDICT: ${verdict} blocking=${payload.summary.blocking} dup=${duplicates.length} remediate=${remediation.length}`);
  for (const d of duplicates) console.log(`  DUP ${d.surface} ${d.key} x${d.count}`);
  for (const r of remediation) console.log(`  FIX ${r.action} ${r.surface} ${r.id} (${r.reason})`);

  if (verdict === 'FAIL') process.exit(1);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
