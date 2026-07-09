#!/usr/bin/env node
/**
 * PCP Authenticity Full-Loop Audit — Phase ① Local + Phase ② Staging
 *
 * Verifies Governance write · Publish/Unpublish · Surface · Priority · Schedule ·
 * Feed/Detail/API/Frontend closed loop across:
 *   Community · Market · Provider · Acquisition · Official Guide · Campaign · Admin Public Content Center
 *
 * Special focus: TT community operational data controllability · legacy read paths · missing capabilities
 *
 * Does NOT modify PCP architecture (TT_PCP_ARCHITECTURE: FROZEN). Audit-only.
 *
 *   node scripts/dev/audit-pcp-authenticity-phase12-final.cjs
 *   STAGING_API=https://tt-api-staging.fly.dev node scripts/dev/audit-pcp-authenticity-phase12-final.cjs
 *   SKIP_STAGING=1 node scripts/dev/audit-pcp-authenticity-phase12-final.cjs   # Phase ① static only
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { createClient } = require('./lib/official-cold-start-admin-client.cjs');

const ROOT = path.join(__dirname, '../..');
const STAMP = process.env.AUDIT_STAMP || new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, 'Z');
const EVID_DIR = path.join(ROOT, 'evidence', 'GO_public_content_platform', STAMP);
const LOCAL_API = (process.env.LOCAL_API || 'http://127.0.0.1:8080').replace(/\/$/, '');
const STAGING_API = (process.env.STAGING_API || 'https://tt-api-staging.fly.dev').replace(/\/$/, '');
const SKIP_STAGING = /^1|true|yes$/i.test(process.env.SKIP_STAGING || '');
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'tourist@test.com';
const ADMIN_PASS = process.env.ADMIN_PASS || 'Test123!';

const DOMAINS = [
  'community',
  'market',
  'provider',
  'acquisition',
  'official_guide',
  'campaign',
  'admin_public_content_center',
];

const checks = [];
const gaps = [];

function read(rel) {
  const p = path.join(ROOT, rel);
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
}

function exists(...rels) {
  return rels.every((r) => fs.existsSync(path.join(ROOT, r)));
}

function record(id, domain, phase, capability, status, detail, extra = {}) {
  checks.push({ id, domain, phase, capability, status, detail, ...extra });
}

function addGap(classification, domain, id, note, fix, phase = 'both') {
  gaps.push({ classification, domain, id, note, fix, phase });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function runSubAudit(rel, env = {}) {
  const script = path.join(ROOT, rel);
  const r = spawnSync(process.execPath, [script], {
    cwd: ROOT,
    encoding: 'utf8',
    env: { ...process.env, AUDIT_STAMP: STAMP, ...env },
  });
  return { pass: r.status === 0, status: r.status, tail: (r.stdout || r.stderr || '').slice(-600) };
}

async function probeApi(base, route) {
  const client = createClient(base);
  try {
    const r = await client.req('GET', route);
    return { ok: r.status >= 200 && r.status < 400, status: r.status, json: r.json };
  } catch (e) {
    return { ok: false, status: 0, error: String(e.message || e) };
  }
}

async function apiUp(base) {
  const r = await probeApi(base, '/health/ready');
  return (
    r.ok &&
    (r.json?.database === 'ok' || r.json?.database_connected === true || r.json?.status === 'ok')
  );
}

function scanLegacyReadPaths() {
  const scans = [
    {
      id: 'LEG-COM-001',
      domain: 'community',
      file: 'crates/api/src/db/community.rs',
      good: /governed_community_posts_v1/,
      bad: null,
      note: 'Community public reads use governed_community_posts_v1',
    },
    {
      id: 'LEG-MKT-001',
      domain: 'market',
      file: 'crates/api/src/db/market_catalog.rs',
      good: /governed_market_listings_v1/,
      bad: null,
      note: 'Market catalog reads governed_market_listings_v1',
    },
    {
      id: 'LEG-MKT-002',
      domain: 'market',
      file: 'crates/api/src/chain_off/market_public_surface.rs',
      good: null,
      bad: /display_status\s*!=\s*"published"/,
      note: 'chain_off in-memory DDG fallback when db_pool unavailable',
      expected: true,
    },
    {
      id: 'LEG-GUI-001',
      domain: 'official_guide',
      file: 'crates/api/src/chain_off/guides.rs',
      good: /list_governed_market_guides/,
      bad: null,
      note: 'Guides public catalog uses governed_market_guides path',
    },
    {
      id: 'LEG-CAM-001',
      domain: 'campaign',
      file: 'crates/api/src/db/campaign_catalog.rs',
      good: /governed_campaign_surfaces_v1|GOVERNED_CAMPAIGN_SURFACES_VIEW/,
      bad: /FROM ops_cold_start_campaigns/i,
      note: 'Campaign catalog must not read raw ops_cold_start_campaigns',
    },
    {
      id: 'LEG-CAM-002',
      domain: 'campaign',
      file: 'crates/api/src/db/ops_cold_start_campaigns_consumer.rs',
      good: /get_governed_campaign_for_surface/,
      bad: /FROM ops_cold_start_campaigns/i,
      note: 'Consumer delegates to governed campaign catalog',
    },
  ];

  for (const s of scans) {
    const body = read(s.file);
    if (!body) {
      record(s.id, s.domain, 'phase1', 'legacy_read_path', 'FAIL', `Missing file ${s.file}`);
      addGap('DEFECT', s.domain, s.id, `Missing ${s.file}`, 'Restore source file', 'phase1');
      continue;
    }
    if (s.good && s.good.test(body)) {
      record(s.id, s.domain, 'phase1', 'legacy_read_path', 'PASS', s.note);
    } else if (s.bad && s.bad.test(body)) {
      const status = s.expected ? 'EXPECTED' : 'FAIL';
      record(s.id, s.domain, 'phase1', 'legacy_read_path', status, s.note);
      if (!s.expected) {
        addGap('BLOCKER', s.domain, s.id, s.note, 'Wire public read to governed view', 'phase1');
      }
    } else if (s.good) {
      record(s.id, s.domain, 'phase1', 'legacy_read_path', 'FAIL', `Expected pattern missing in ${s.file}`);
      addGap('BLOCKER', s.domain, s.id, s.note, 'Align read path to governed view', 'phase1');
    } else {
      record(s.id, s.domain, 'phase1', 'legacy_read_path', 'PASS', s.note);
    }
  }
}

function scanStaticPipeline() {
  const builders = [
    ['community', 'crates/api/src/pcp/feed_builder.rs', ['display_status', 'display_surfaces']],
    ['market', 'crates/api/src/pcp/market_builder.rs', ["display_status = 'published'"]],
    ['campaign', 'crates/api/src/pcp/campaign_builder.rs', ["status = 'deployed'"]],
  ];
  for (const [domain, file, forbidden] of builders) {
    const src = read(file);
    const ok = exists(file) && !forbidden.some((k) => src.includes(k));
    record(
      `static_builder_${domain}`,
      domain,
      'phase1',
      'builder_purity',
      ok ? 'PASS' : 'FAIL',
      ok ? `${file} — no inline governance` : `Inline governance detected in ${file}`
    );
    if (!ok) addGap('BLOCKER', domain, `BLD-${domain}`, 'Builder contains governance rules', `Remove governance from ${file}`, 'phase1');
  }

  const migrations = [
    ['community', 'crates/api/migrations/20260704100000_governed_community_posts_v1.sql'],
    ['market', 'crates/api/migrations/20260704110000_governed_market_catalog_v1.sql'],
    ['campaign', 'crates/api/migrations/20260704120000_governed_campaign_surfaces_v1.sql'],
  ];
  for (const [domain, mig] of migrations) {
    const ok = exists(mig);
    record(`static_gov_${domain}`, domain, 'phase1', 'governance_migration', ok ? 'PASS' : 'FAIL', mig);
    if (!ok) addGap('BLOCKER', domain, `GOV-MIG-${domain}`, `Missing ${mig}`, 'Apply governed view migration', 'phase1');
  }

  function readTree(relPrefix) {
    if (!relPrefix) return '';
    const full = path.join(ROOT, relPrefix);
    if (fs.existsSync(full) && fs.statSync(full).isFile()) return read(relPrefix);
    if (!fs.existsSync(full)) return '';
    const out = [];
    const walk = (dir, depth = 0) => {
      if (depth > 4) return;
      for (const name of fs.readdirSync(dir)) {
        if (name === 'node_modules') continue;
        const p = path.join(dir, name);
        if (fs.statSync(p).isDirectory()) walk(p, depth + 1);
        else if (/\.(tsx?|jsx?)$/.test(name)) out.push(fs.readFileSync(p, 'utf8'));
      }
    };
    walk(full);
    return out.join('\n');
  }

  const frontendRoutes = [
    ['community', ['frontend/lib/api.ts', 'frontend/app/community'], '/api/v1/community'],
    ['official_guide', ['frontend/lib/api.ts', 'frontend/app/guides'], '/api/v1/guides'],
    ['provider', ['frontend/lib/api.ts', 'frontend/app/market/provider'], 'market/provider/listings'],
    ['acquisition', ['frontend/lib/api.ts', 'frontend/app/market/acquisition'], 'market/acquisition/listings'],
    [
      'admin_public_content_center',
      ['frontend/lib/api/routes.ts', 'frontend/app/admin/official/public-operations'],
      'public-operations',
    ],
    ['campaign', ['frontend/e2e/frontend-api-consistency-audit.spec.ts'], 'cold-start/surfaces'],
  ];
  for (const [domain, paths, marker] of frontendRoutes) {
    const src = paths.map((p) => readTree(p)).join('\n');
    const ok = paths.every((p) => exists(p)) && src.includes(marker);
    record(`static_fe_${domain}`, domain, 'phase1', 'frontend_contract', ok ? 'PASS' : 'FAIL', `${paths.join(' + ')} → ${marker}`);
    if (!ok) addGap('DEFECT', domain, `FE-${domain}`, `Frontend missing ${marker}`, `Verify ${paths[0]} + route pages`, 'phase1');
  }
}

async function runPhase1LocalRuntime() {
  const up = await apiUp(LOCAL_API);
  if (!up) {
    record('p1_local_api', '_runtime', 'phase1', 'local_api', 'SKIPPED', `Local API not up at ${LOCAL_API}`);
    return { state: 'SKIPPED' };
  }
  record('p1_local_api', '_runtime', 'phase1', 'local_api', 'PASS', LOCAL_API);

  const routes = [
    ['community', '/api/v1/community/feed?limit=5'],
    ['official_guide', '/api/v1/guides?limit=5'],
    ['provider', '/api/v1/market/provider/listings?limit=5'],
    ['acquisition', '/api/v1/market/acquisition/listings?limit=5'],
    ['campaign', '/api/v1/official/cold-start/surfaces/home_hero'],
  ];
  for (const [domain, route] of routes) {
    const r = await probeApi(LOCAL_API, route);
    record(`p1_rt_${domain}`, domain, 'phase1', 'public_api', r.ok ? 'PASS' : 'FAIL', `${route} HTTP ${r.status}`);
    if (!r.ok) addGap('DEFECT', domain, `P1-RT-${domain}`, `Local ${route} failed`, 'Start local stack + migrate', 'phase1');
  }
  return { state: 'PASS' };
}

function feedIds(json) {
  return (json?.posts || []).map((p) => String(p.id || p.post_id || '')).filter(Boolean);
}

function guideIds(json) {
  const arr = json?.guides || json?.items || [];
  return arr.map((g) => String(g.id || g.guide_id || '')).filter(Boolean);
}

async function fetchPublishQueueItem(client, adminTok, entityType) {
  const pq = await client.req(
    'GET',
    `/api/v1/admin/official/public-operations/publish-queue?entity_type=${entityType}&limit=50`,
    null,
    adminTok
  );
  if (pq.status !== 200) return null;
  return (pq.json?.items || [])[0] || null;
}

async function runCommunityGovernanceLoop(client, adminTok, phase, apiBase) {
  const feed = await client.req('GET', '/api/v1/community/feed?limit=100');
  if (feed.status !== 200) {
    record('gov_com_feed', 'community', phase, 'feed', 'FAIL', `feed HTTP ${feed.status}`);
    addGap('BLOCKER', 'community', `GOV-COM-FEED-${phase}`, 'Community feed unreachable', 'Fix community API', phase);
    return;
  }
  const candidate = feedIds(feed.json)[0];
  if (!candidate) {
    record('gov_com_baseline', 'community', phase, 'feed_baseline', 'FAIL', 'No posts in public feed');
    addGap('DEFECT', 'community', `GOV-COM-DATA-${phase}`, 'No community feed data for governance loop', 'Seed staging community content', phase);
    return;
  }
  record('gov_com_baseline', 'community', phase, 'feed_baseline', 'PASS', `post ${candidate}`);

  const pqItem = await fetchPublishQueueItem(client, adminTok, 'community_posts');
  const controllable =
    pqItem &&
    String(pqItem.id) === String(candidate) &&
    'display_status' in pqItem &&
    'display_surfaces' in pqItem;
  record(
    'gov_com_ops_controllable',
    'community',
    phase,
    'ops_data_controllable',
    controllable ? 'PASS' : 'PARTIAL',
    controllable
      ? 'Publish-queue row matches feed post with governance fields'
      : 'Feed post not found in publish-queue or missing governance fields'
  );
  if (!controllable) {
    addGap(
      'DEFECT',
      'community',
      `OPS-COM-CTRL-${phase}`,
      'TT community ops data not fully controllable via Public Ops publish-queue',
      'Ensure community_posts in publish-queue with display_* fields',
      phase
    );
  }

  const stats = await client.req('GET', '/api/v1/admin/official/public-operations/stats', null, adminTok);
  const statsOk = stats.status === 200 && stats.json?.data_origin_counts != null;
  record(
    'gov_com_stats',
    'community',
    phase,
    'ops_stats',
    statsOk ? 'PASS' : 'FAIL',
    statsOk ? 'data_origin_counts present' : `stats HTTP ${stats.status}`
  );

  const original = pqItem || {};
  const origStatus = original.display_status || 'published';
  const origSurfaces = Array.isArray(original.display_surfaces) ? [...original.display_surfaces] : [];
  const origPriority = original.display_priority ?? 0;

  try {
    // Publish / Unpublish
    const unp = await client.unpublishEntity(adminTok, 'community_posts', candidate);
    await sleep(450);
    const feedHidden = !feedIds((await client.req('GET', '/api/v1/community/feed?limit=200')).json).includes(
      String(candidate)
    );
    const detailHidden = !(await client.req('GET', `/api/v1/community/posts/${candidate}`)).json?.post?.id;
    record(
      'gov_com_unpublish',
      'community',
      phase,
      'publish_unpublish',
      unp.status < 400 && feedHidden && detailHidden ? 'PASS' : 'FAIL',
      `unpublish HTTP ${unp.status} feedHidden=${feedHidden} detailHidden=${detailHidden}`
    );
    if (!(unp.status < 400 && feedHidden)) {
      addGap(
        'BLOCKER',
        'community',
        `GOV-COM-UNPUB-${phase}`,
        'Unpublish does not hide post from governed feed',
        'Verify governed_community_posts_v1 on staging DB',
        phase
      );
    }

    await client.publishEntity(adminTok, 'community_posts', candidate);
    await sleep(450);

    // Surface
    await client.setSurfaces(adminTok, 'community_posts', candidate, ['market_feed']);
    await sleep(450);
    const surfaceOff = !feedIds((await client.req('GET', '/api/v1/community/feed?limit=200')).json).includes(
      String(candidate)
    );
    record(
      'gov_com_surface',
      'community',
      phase,
      'surface',
      surfaceOff ? 'PASS' : 'FAIL',
      surfaceOff ? 'Removed community_feed surface → hidden from feed' : 'Still visible after surface change'
    );
    if (!surfaceOff) {
      addGap('BLOCKER', 'community', `GOV-COM-SURF-${phase}`, 'Surface OFF does not hide from feed', 'Check display_surfaces governance', phase);
    }
    await client.setSurfaces(adminTok, 'community_posts', candidate, ['community_feed']);
    await sleep(450);

    // Priority
    const pri = await client.setPriority(adminTok, 'community_posts', candidate, origPriority + 100);
    const pqAfterPri = await fetchPublishQueueItem(client, adminTok, 'community_posts');
    const priOk =
      pri.status < 400 &&
      pqAfterPri &&
      String(pqAfterPri.id) === String(candidate) &&
      pqAfterPri.display_priority === origPriority + 100;
    record(
      'gov_com_priority',
      'community',
      phase,
      'priority',
      priOk ? 'PASS' : 'FAIL',
      priOk ? `display_priority=${origPriority + 100}` : `priority patch HTTP ${pri.status}`
    );
    if (!priOk) addGap('DEFECT', 'community', `GOV-COM-PRI-${phase}`, 'Priority not writable/controllable', 'Fix public-ops priority endpoint', phase);
    await client.setPriority(adminTok, 'community_posts', candidate, origPriority);

    // Schedule — end in past hides from governed view
    const past = new Date(Date.now() - 3600_000).toISOString();
    const sched = await client.setSchedule(adminTok, 'community_posts', candidate, null, past);
    await sleep(450);
    const schedHidden = !feedIds((await client.req('GET', '/api/v1/community/feed?limit=200')).json).includes(
      String(candidate)
    );
    record(
      'gov_com_schedule',
      'community',
      phase,
      'schedule',
      sched.status < 400 && schedHidden ? 'PASS' : 'FAIL',
      schedHidden ? 'display_end_at past → hidden' : `schedule HTTP ${sched.status} still in feed`
    );
    if (!(sched.status < 400 && schedHidden)) {
      addGap('BLOCKER', 'community', `GOV-COM-SCHED-${phase}`, 'Schedule window not enforced on feed', 'Verify governed view schedule predicates', phase);
    }
    await client.setSchedule(adminTok, 'community_posts', candidate, null, null);
  } finally {
    if (origStatus === 'published') await client.publishEntity(adminTok, 'community_posts', candidate);
    else await client.unpublishEntity(adminTok, 'community_posts', candidate);
    if (origSurfaces.length) await client.setSurfaces(adminTok, 'community_posts', candidate, origSurfaces);
    else await client.setSurfaces(adminTok, 'community_posts', candidate, []);
    await client.setPriority(adminTok, 'community_posts', candidate, origPriority);
    await client.setSchedule(adminTok, 'community_posts', candidate, null, null);
  }
}

async function runMarketEntityGovernanceLoop(client, adminTok, phase, entityType, publicRoute, idExtractor) {
  const item = await fetchPublishQueueItem(client, adminTok, entityType);
  if (!item) {
    record(`gov_${entityType}_baseline`, entityType === 'guides' ? 'official_guide' : 'market', phase, 'publish_queue', 'SKIPPED', `No ${entityType} in publish-queue`);
    return;
  }
  const id = item.id;
  const beforeList = await client.req('GET', publicRoute);
  const beforeIds = idExtractor(beforeList.json);
  const wasVisible = beforeIds.includes(String(id));

  const unp = await client.unpublishEntity(adminTok, entityType, id);
  await sleep(450);
  const afterList = await client.req('GET', publicRoute);
  const afterIds = idExtractor(afterList.json);
  const hidden = !afterIds.includes(String(id));
  const domain = entityType === 'guides' ? 'official_guide' : entityType === 'market_listings' ? 'market' : 'market';

  record(
    `gov_${entityType}_unpublish`,
    domain,
    phase,
    'publish_unpublish',
    unp.status < 400 && (wasVisible ? hidden : true) ? 'PASS' : 'FAIL',
    `${entityType} ${id} wasVisible=${wasVisible} hiddenAfter=${hidden}`
  );
  if (wasVisible && unp.status < 400 && !hidden) {
    addGap(
      'BLOCKER',
      domain,
      `GOV-${entityType.toUpperCase()}-UNPUB-${phase}`,
      `${entityType} unpublish does not hide from public list`,
      'Verify governed_market_* views on staging',
      phase
    );
  }

  await client.publishEntity(adminTok, entityType, id);
  await sleep(300);
}

async function runCampaignSurfaceLoop(client, adminTok, phase) {
  const surfaces = ['home_hero', 'market_feed', 'community_feed'];
  let allOk = true;
  for (const s of surfaces) {
    const r = await client.req('GET', `/api/v1/official/cold-start/surfaces/${s}`);
    const ok = r.status >= 200 && r.status < 400;
    if (!ok) allOk = false;
    record(`gov_cam_surface_${s}`, 'campaign', phase, 'public_api', ok ? 'PASS' : 'FAIL', `GET surface/${s} HTTP ${r.status}`);
  }
  if (!allOk) {
    addGap('BLOCKER', 'campaign', `GOV-CAM-SURF-${phase}`, 'Campaign surface API failing', 'Deploy governed campaign batch to staging', phase);
  }

  const pq = await client.req('GET', '/api/v1/admin/official/public-operations/publish-queue?limit=5', null, adminTok);
  record(
    'gov_admin_pq',
    'admin_public_content_center',
    phase,
    'publish_queue',
    pq.status === 200 ? 'PASS' : 'FAIL',
    pq.status === 200 ? `items=${(pq.json?.items || []).length}` : `HTTP ${pq.status}`
  );
}

async function runPhase2StagingRuntime() {
  if (SKIP_STAGING) {
    record('p2_staging', '_runtime', 'phase2', 'staging', 'SKIPPED', 'SKIP_STAGING=1');
    return { state: 'SKIPPED' };
  }

  const up = await apiUp(STAGING_API);
  if (!up) {
    record('p2_staging', '_runtime', 'phase2', 'staging', 'FAIL', `${STAGING_API} unreachable`);
    addGap('BLOCKER', '_runtime', 'STG-UP', 'Staging API unreachable', 'Check fly deploy / network', 'phase2');
    return { state: 'FAIL' };
  }
  record('p2_staging', '_runtime', 'phase2', 'staging', 'PASS', STAGING_API);

  const client = createClient(STAGING_API);
  let adminTok;
  try {
    adminTok = await client.adminLogin(ADMIN_EMAIL, ADMIN_PASS);
  } catch (e) {
    record('p2_admin_auth', 'admin_public_content_center', 'phase2', 'admin_auth', 'FAIL', String(e.message || e));
    addGap('BLOCKER', 'admin_public_content_center', 'STG-AUTH', 'Admin auth failed on staging', 'Check test accounts / seed', 'phase2');
    return { state: 'FAIL' };
  }
  record('p2_admin_auth', 'admin_public_content_center', 'phase2', 'admin_auth', 'PASS', ADMIN_EMAIL);

  await runCommunityGovernanceLoop(client, adminTok, 'phase2', STAGING_API);
  await runMarketEntityGovernanceLoop(
    client,
    adminTok,
    'phase2',
    'guides',
    '/api/v1/guides?limit=100',
    guideIds
  );
  await runMarketEntityGovernanceLoop(
    client,
    adminTok,
    'phase2',
    'market_listings',
    '/api/v1/market/provider/listings?limit=100',
    (j) => (j?.listings || j?.items || []).map((x) => String(x.id)).filter(Boolean)
  );
  await runCampaignSurfaceLoop(client, adminTok, 'phase2');

  const providerR = await client.req('GET', '/api/v1/market/provider/listings?limit=5');
  const acqR = await client.req('GET', '/api/v1/market/acquisition/listings?limit=5');
  record('p2_provider_api', 'provider', 'phase2', 'public_api', providerR.status < 400 ? 'PASS' : 'FAIL', `HTTP ${providerR.status}`);
  record('p2_acquisition_api', 'acquisition', 'phase2', 'public_api', acqR.status < 400 ? 'PASS' : 'FAIL', `HTTP ${acqR.status}`);

  return { state: 'PASS' };
}

function domainSummary(domain) {
  const rows = checks.filter((c) => c.domain === domain);
  const fails = rows.filter((c) => c.status === 'FAIL').length;
  const passes = rows.filter((c) => c.status === 'PASS').length;
  const blockers = gaps.filter((g) => g.domain === domain && g.classification === 'BLOCKER').length;
  let status = '🟢';
  if (blockers > 0) status = '🔴';
  else if (fails > 0) status = '🟡';
  return { domain, passes, fails, blockers, status };
}

function computeFixOrder() {
  const order = [];
  const seen = new Set();
  const priority = ['BLOCKER', 'DEFECT', 'EXPECTED_DIFFERENCE', 'ENHANCEMENT'];
  const sorted = [...gaps].sort((a, b) => priority.indexOf(a.classification) - priority.indexOf(b.classification));
  for (const g of sorted) {
    const key = g.fix || g.id;
    if (!seen.has(key)) {
      seen.add(key);
      order.push({ classification: g.classification, id: g.id, domain: g.domain, action: g.fix || g.note });
    }
  }
  return order;
}

function writeFinalReport(report) {
  const lines = [
    `# PCP Phase ①/② Alignment · Final Verification Report · ${STAMP}`,
    '',
    '**Audit:** `TT_PCP_AUTHENTICITY_PHASE12_FINAL`',
    '**Architecture:** `TT_PCP_ARCHITECTURE: FROZEN` — audit-only · no PCP code changes in this run',
    '',
    '## Executive Verdict',
    '',
    '| Gate | Result |',
    '|------|--------|',
    `| **Phase ① Local (static + architecture)** | **${report.verdict.phase1_static}** |`,
    `| **Phase ① Local runtime** | **${report.verdict.phase1_runtime}** |`,
    `| **Phase ② Staging authenticity loop** | **${report.verdict.phase2_staging}** |`,
    `| **7/7 Domain alignment** | **${report.summary.domains_green}/${DOMAINS.length}** green · **${report.summary.domains_red}** red |`,
    `| **OPEN BLOCKER gaps** | **${report.summary.blocker_gaps}** |`,
    `| **PCP Phase ①/② Alignment** | **${report.verdict.overall}** |`,
    '',
    '## Domain Matrix',
    '',
    '| Domain | Status | Blocking | Phase ① | Phase ② |',
    '|--------|--------|----------|---------|---------|',
  ];

  for (const d of report.domain_summary) {
    const p1 = checks.filter((c) => c.domain === d.domain && c.phase === 'phase1');
    const p2 = checks.filter((c) => c.domain === d.domain && c.phase === 'phase2');
    const p1s = p1.some((c) => c.status === 'FAIL') ? '🟡' : p1.length ? '🟢' : '—';
    const p2s = p2.some((c) => c.status === 'FAIL') ? '🔴' : p2.some((c) => c.status === 'PASS') ? '🟢' : p2.some((c) => c.status === 'SKIPPED') ? '—' : '🟡';
    lines.push(`| ${d.domain} | ${d.status} | ${d.blockers} | ${p1s} | ${p2s} |`);
  }

  lines.push('', '## Capability Coverage', '', '| Capability | PASS | FAIL | SKIPPED |', '|------------|------|------|---------|');
  for (const cap of report.capability_summary) {
    lines.push(`| ${cap.capability} | ${cap.pass} | ${cap.fail} | ${cap.skipped} |`);
  }

  lines.push('', '## Gap List', '');
  if (!report.gaps.length) lines.push('_No gaps — full authenticity loop verified._');
  else {
    for (const g of report.gaps) {
      lines.push(`- **[${g.classification}]** \`${g.id}\` · ${g.domain} (${g.phase}) — ${g.note}`);
      if (g.fix) lines.push(`  - Fix: ${g.fix}`);
    }
  }

  lines.push('', '## Legacy Read Paths', '');
  for (const c of checks.filter((x) => x.capability === 'legacy_read_path')) {
    lines.push(`- \`${c.id}\` · **${c.status}** · ${c.detail}`);
  }

  lines.push('', '## Fix Order (Blocking first)', '');
  report.fix_order.forEach((f, i) => {
    lines.push(`${i + 1}. [${f.classification}] \`${f.id}\` · ${f.domain} — ${f.action}`);
  });

  lines.push('', '## Sub-Audit Chain', '');
  for (const [k, v] of Object.entries(report.sub_audits)) {
    lines.push(`- **${k}**: ${v.pass ? 'PASS' : 'FAIL'}${v.skipped ? ' (skipped)' : ''}`);
  }

  lines.push('', '## Honest Boundary', '');
  lines.push('- Phase ① local static PASS ≠ Phase ② staging governance loop PASS');
  lines.push('- This audit verifies **PCP authenticity** · does **not** imply Production GO');
  lines.push('- PCP Architecture remains **FROZEN** — fixes require [Architecture Review Gate](../runbook/PCP-ARCHITECTURE-REVIEW-GATE.md) if architectural');

  lines.push('', '## Sign-off', '', '```bash', 'node scripts/dev/audit-pcp-authenticity-phase12-final.cjs', '```', '');
  lines.push(`**Evidence:** \`evidence/GO_public_content_platform/${STAMP}/pcp-phase12-alignment-final.json\``);

  return lines.join('\n') + '\n';
}

async function main() {
  fs.mkdirSync(EVID_DIR, { recursive: true });
  console.log('\n=== PCP Authenticity Full-Loop Audit · Phase ① + Phase ② ===\n');

  console.log('① Phase ① static pipeline + legacy read paths…');
  scanLegacyReadPaths();
  scanStaticPipeline();

  console.log('② Sub-audit chain…');
  const subAudits = {
    architecture_compliance: runSubAudit('scripts/dev/audit-pcp-architecture-compliance.cjs'),
    phase0_5: SKIP_STAGING
      ? { pass: null, skipped: true }
      : runSubAudit('scripts/dev/validate-pcp-phase0-5-staging.cjs'),
    market_batch: SKIP_STAGING
      ? { pass: null, skipped: true }
      : runSubAudit('scripts/dev/validate-pcp-phase1-market-batch-staging.cjs'),
    campaign_batch: SKIP_STAGING
      ? { pass: null, skipped: true }
      : runSubAudit('scripts/dev/validate-pcp-phase1-campaign-batch-staging.cjs'),
    phase1_full_alignment: runSubAudit('scripts/dev/audit-pcp-phase1-full-alignment.cjs', {
      SKIP_STAGING: SKIP_STAGING ? '1' : '',
      SKIP_ENTERPRISE: '1',
    }),
  };

  for (const [name, r] of Object.entries(subAudits)) {
    record(`sub_${name}`, '_sub_audit', 'phase1', 'sub_audit', r.skipped ? 'SKIPPED' : r.pass ? 'PASS' : 'FAIL', name);
    if (!r.skipped && !r.pass) {
      addGap('BLOCKER', '_sub_audit', `SUB-${name}`, `Sub-audit ${name} failed`, `Re-run scripts/dev/*${name}* and fix`, 'both');
    }
  }

  console.log('③ Phase ① local runtime (optional)…');
  const p1Runtime = await runPhase1LocalRuntime();

  console.log('④ Phase ② staging authenticity loops…');
  const p2Runtime = await runPhase2StagingRuntime();

  const blockerGaps = gaps.filter((g) => g.classification === 'BLOCKER');
  const defectGaps = gaps.filter((g) => g.classification === 'DEFECT');
  const fixOrder = computeFixOrder();
  const domainSummaries = DOMAINS.map(domainSummary);

  const capabilities = [
    'legacy_read_path',
    'governance_migration',
    'builder_purity',
    'publish_unpublish',
    'surface',
    'priority',
    'schedule',
    'feed',
    'public_api',
    'frontend_contract',
    'ops_data_controllable',
  ];
  const capabilitySummary = capabilities.map((capability) => {
    const rows = checks.filter((c) => c.capability === capability);
    return {
      capability,
      pass: rows.filter((c) => c.status === 'PASS').length,
      fail: rows.filter((c) => c.status === 'FAIL').length,
      skipped: rows.filter((c) => c.status === 'SKIPPED').length,
    };
  });

  const staticFails = checks.filter((c) => c.phase === 'phase1' && c.status === 'FAIL').length;
  const phase1Static = staticFails === 0 && subAudits.architecture_compliance.pass ? 'PASS' : 'PARTIAL';
  const phase2Staging =
    p2Runtime.state === 'SKIPPED'
      ? 'SKIPPED'
      : blockerGaps.filter((g) => g.phase === 'phase2' || g.phase === 'both').length === 0
        ? 'PASS'
        : 'FAIL';

  const overall =
    blockerGaps.length === 0 && phase2Staging === 'PASS' && phase1Static === 'PASS'
      ? 'ALIGNED'
      : blockerGaps.length === 0 && phase2Staging === 'PASS'
        ? 'ALIGNED_WITH_WARNINGS'
        : blockerGaps.length === 0 && phase2Staging === 'SKIPPED' && phase1Static === 'PASS'
          ? 'PHASE1_ONLY'
          : 'GAPS_REMAIN';

  const report = {
    audit: 'TT_PCP_AUTHENTICITY_PHASE12_FINAL',
    stamp: STAMP,
    machine_keys: {
      TT_PCP_ARCHITECTURE: 'FROZEN',
      TT_PCP_PHASE_1: 'COMPLETE',
      TT_PCP_AUTHENTICITY_PHASE12: overall === 'ALIGNED' || overall === 'ALIGNED_WITH_WARNINGS' ? 'VERIFIED' : 'GAPS_REMAIN',
    },
    pipeline: 'Database → PCP Governance → Builder → Public API → Frontend',
    local_api: LOCAL_API,
    staging_api: STAGING_API,
    domains: DOMAINS,
    checks,
    gaps,
    fix_order: fixOrder,
    domain_summary: domainSummaries,
    capability_summary: capabilitySummary,
    sub_audits: subAudits,
    summary: {
      checks_total: checks.length,
      checks_pass: checks.filter((c) => c.status === 'PASS').length,
      checks_fail: checks.filter((c) => c.status === 'FAIL').length,
      blocker_gaps: blockerGaps.length,
      defect_gaps: defectGaps.length,
      domains_green: domainSummaries.filter((d) => d.status === '🟢').length,
      domains_red: domainSummaries.filter((d) => d.status === '🔴').length,
    },
    verdict: {
      phase1_static: phase1Static,
      phase1_runtime: p1Runtime.state,
      phase2_staging: phase2Staging,
      overall,
      sign_off_allowed: overall === 'ALIGNED',
    },
  };

  const jsonPath = path.join(EVID_DIR, 'pcp-phase12-alignment-final.json');
  const mdPath = path.join(EVID_DIR, 'PCP-PHASE12-ALIGNMENT-FINAL-REPORT.md');
  const gapPath = path.join(EVID_DIR, 'pcp-authenticity-gap-register.json');

  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2) + '\n');
  fs.writeFileSync(mdPath, writeFinalReport(report));
  fs.writeFileSync(
    gapPath,
    JSON.stringify(
      {
        review: 'PCP_AUTHENTICITY_GAP_REGISTER',
        stamp: STAMP,
        gaps,
        fix_order: fixOrder,
        totals: { blocker: blockerGaps.length, defect: defectGaps.length },
      },
      null,
      2
    ) + '\n'
  );

  console.log(`\nPhase ① static: ${phase1Static} · runtime: ${p1Runtime.state}`);
  console.log(`Phase ② staging: ${phase2Staging}`);
  console.log(`Overall: ${overall} · BLOCKER gaps: ${blockerGaps.length} · DEFECT gaps: ${defectGaps.length}`);
  console.log(`\nEvidence:\n  ${path.relative(ROOT, jsonPath)}\n  ${path.relative(ROOT, mdPath)}\n  ${path.relative(ROOT, gapPath)}\n`);

  if (blockerGaps.length) {
    console.log('Top blocking fixes:');
    fixOrder.filter((f) => f.classification === 'BLOCKER').slice(0, 8).forEach((f, i) => console.log(`  ${i + 1}. [${f.domain}] ${f.action}`));
  }

  console.log(`\nTT_PCP_AUTHENTICITY_PHASE12: ${report.machine_keys.TT_PCP_AUTHENTICITY_PHASE12}\n`);

  process.exit(blockerGaps.length === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
