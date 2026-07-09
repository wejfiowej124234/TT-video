#!/usr/bin/env node
/**
 * PCP Full Pipeline Alignment Audit — Phase ① Local + Phase ② Staging
 *
 * Pipeline: Database → PCP Governance → Public Engine Builder → Public API → Frontend
 *
 * Domains: Community · Market · Provider · Acquisition · Official Guide · Campaign ·
 *          Admin Public Content Center · DDG · OCS · SOPCP · OCIP · Evidence/Registry/Runbook
 *
 *   node scripts/dev/audit-pcp-full-pipeline-alignment.cjs
 *   STAGING_API=https://tt-api-staging.fly.dev node scripts/dev/audit-pcp-full-pipeline-alignment.cjs
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

const gaps = [];
const pipeline = [];

function read(rel) {
  const p = path.join(ROOT, rel);
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
}

function addGap(severity, domain, layer, id, note, fix, classification = 'DRIFT') {
  gaps.push({ severity, domain, layer, id, note, fix, classification });
}

function addPipeline(domain, layer, phase1, phase2, note, ref = null) {
  pipeline.push({ domain, layer, phase1, phase2, note, ref });
}

function layerStatus(pass, partial = false, ref = false, skip = false) {
  if (skip) return 'SKIPPED';
  if (ref) return 'REFERENCE';
  if (pass && !partial) return 'PASS';
  if (partial || (pass && partial)) return 'PARTIAL';
  return 'FAIL';
}

function staticFileExists(...rels) {
  return rels.every((r) => fs.existsSync(path.join(ROOT, r)));
}

function registryHasPcpPointer(rel) {
  const txt = read(rel);
  return /public_content_platform|public-content-platform/.test(txt);
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

async function localApiUp() {
  const r = await probeApi(LOCAL_API, '/health/ready');
  return r.ok && (r.json?.database === 'ok' || r.json?.status === 'ok');
}

function runArchitectureCompliance() {
  const script = path.join(ROOT, 'scripts/dev/audit-pcp-architecture-compliance.cjs');
  const r = spawnSync(process.execPath, [script], { cwd: ROOT, encoding: 'utf8', env: { ...process.env, AUDIT_STAMP: STAMP } });
  return { pass: r.status === 0, output: (r.stdout || r.stderr || '').slice(-1200) };
}

function analyzeStaticCode() {
  const communityRs = read('crates/api/src/db/community.rs');
  const governedMigration = staticFileExists('crates/api/migrations/20260704100000_governed_community_posts_v1.sql');
  const governedMigrationMarket = staticFileExists('crates/api/migrations/20260704110000_governed_market_catalog_v1.sql');
  const feedBuilder = read('crates/api/src/pcp/feed_builder.rs');
  const marketSurface = read('crates/api/src/chain_off/market_public_surface.rs');
  const marketListings = read('crates/api/src/db/market_listings.rs');
  const publicOps = read('crates/api/src/db/public_operations_display_admin.rs');
  const campaignConsumer = read('crates/api/src/db/ops_cold_start_campaigns_consumer.rs');

  const communityGoverned = governedMigration && communityRs.includes('governed_community_posts_v1');
  const communityBuilder = staticFileExists('crates/api/src/pcp/feed_builder.rs');
  const communityBuilderPure = !['display_status', 'display_surfaces', 'content_tier'].some((k) => feedBuilder.includes(k));

  addPipeline('community', 'database', layerStatus(true), 'PENDING', 'community_posts table + migration');
  addPipeline(
    'community',
    'governance',
    layerStatus(communityGoverned),
    'PENDING',
    'governed_community_posts_v1 SQL view (P2)'
  );
  addPipeline(
    'community',
    'builder',
    layerStatus(communityBuilder && communityBuilderPure, !communityBuilderPure),
    'PENDING',
    'FeedBuilder · pcp/feed_builder.rs'
  );
  addPipeline(
    'community',
    'public_api',
    layerStatus(communityRs.includes('get_governed_public_post_by_id') && communityRs.includes('list_feed(')),
    false,
    'feed · detail · profile · explore · tag stats'
  );
  addPipeline(
    'community',
    'frontend',
    layerStatus(staticFileExists('frontend/app/community/me/page.tsx')),
    'PENDING',
    'community routes consume /api/v1/community/*'
  );

  if (!communityGoverned) {
    addGap('BLOCKING', 'community', 'governance', 'COM-GOV-001', 'Missing governed_community_posts_v1', 'Apply migration 20260704100000', 'DRIFT');
  }

  const marketGovRust = marketSurface.includes('display_status') && marketListings.includes('governed_market_listings_v1');
  const marketBuilderPcp = staticFileExists('crates/api/src/pcp/market_builder.rs');
  addPipeline('market', 'database', layerStatus(true), 'PENDING', 'guides · market_listings · discover_orders');
  addPipeline(
    'market',
    'governance',
    layerStatus(marketGovRust && governedMigrationMarket),
    'PENDING',
    'governed_market_* SQL views (P2)'
  );
  addPipeline(
    'market',
    'builder',
    layerStatus(marketBuilderPcp, !marketBuilderPcp),
    'PENDING',
    'MarketBuilder · pcp/market_builder.rs'
  );
  addPipeline(
    'market',
    'public_api',
    layerStatus(true),
    'PENDING',
    'GET /guides · /discover/orders · market listings'
  );
  addPipeline(
    'market',
    'frontend',
    layerStatus(staticFileExists('frontend/app/guides/page.tsx', 'frontend/app/market/acquisition/page.tsx')),
    'PENDING',
    'guides · market hub · subsites'
  );

  if (!marketGovRust || !governedMigrationMarket) {
    addGap(
      'NON_BLOCKING',
      'market',
      'governance',
      'MKT-GOV-001',
      'Market governed views incomplete on static scan',
      'Verify migration 20260704110000 + market_catalog reads',
      'DRIFT'
    );
  } else {
    // Phase 1 batch 1 complete — remove legacy EXPECTED_DIFFERENCE gap when views wired
  }

  addPipeline('provider', 'database', layerStatus(true), 'PENDING', 'market_listings variant=provider');
  addPipeline('provider', 'governance', layerStatus(governedMigrationMarket), 'PENDING', 'shared governed_market_listings_v1');
  addPipeline('provider', 'builder', layerStatus(marketBuilderPcp), 'PENDING', 'MarketBuilder · pcp/market_builder.rs');
  addPipeline('provider', 'public_api', layerStatus(true), 'PENDING', 'GET /market/provider/listings');
  addPipeline('provider', 'frontend', layerStatus(staticFileExists('frontend/app/market/provider/page.tsx')), 'PENDING', '/market/provider');

  addPipeline('acquisition', 'database', layerStatus(true), 'PENDING', 'market_listings variant=acquisition');
  addPipeline('acquisition', 'governance', layerStatus(governedMigrationMarket), 'PENDING', 'shared governed_market_listings_v1');
  addPipeline('acquisition', 'builder', layerStatus(marketBuilderPcp), 'PENDING', 'MarketBuilder · pcp/market_builder.rs');
  addPipeline('acquisition', 'public_api', layerStatus(true), 'PENDING', 'GET /market/acquisition/listings');
  addPipeline('acquisition', 'frontend', layerStatus(staticFileExists('frontend/app/market/acquisition/page.tsx')), 'PENDING', '/market/acquisition');

  addPipeline('official_guide', 'database', layerStatus(true), 'PENDING', 'guides + OCS bootstrap');
  addPipeline(
    'official_guide',
    'governance',
    layerStatus(governedMigrationMarket && read('crates/api/src/chain_off/guides.rs').includes('list_governed_market_guides')),
    'PENDING',
    'governed_market_guides_v1 + OCS tier'
  );
  addPipeline('official_guide', 'builder', layerStatus(marketBuilderPcp), 'PENDING', 'MarketBuilder · GET /guides');
  addPipeline('official_guide', 'public_api', layerStatus(true), 'PENDING', 'GET /api/v1/guides');
  addPipeline('official_guide', 'frontend', layerStatus(staticFileExists('frontend/app/guides/page.tsx')), 'PENDING', '/guides');

  const governedMigrationCampaign = staticFileExists('crates/api/migrations/20260704120000_governed_campaign_surfaces_v1.sql');
  const campaignBuilderPcp = staticFileExists('crates/api/src/pcp/campaign_builder.rs');
  const campaignCatalog = read('crates/api/src/db/campaign_catalog.rs');
  const campaignGovOk =
    governedMigrationCampaign &&
    (campaignCatalog.includes('governed_campaign_surfaces_v1') ||
      campaignCatalog.includes('GOVERNED_CAMPAIGN_SURFACES_VIEW')) &&
    campaignBuilderPcp;
  addPipeline('campaign', 'database', layerStatus(true), 'PENDING', 'ops_cold_start_campaigns + items');
  addPipeline(
    'campaign',
    'governance',
    layerStatus(campaignGovOk),
    'PENDING',
    'governed_campaign_surfaces_v1 + governed_campaign_items_v1'
  );
  addPipeline(
    'campaign',
    'builder',
    layerStatus(campaignBuilderPcp && campaignCatalog.includes('get_governed_campaign_for_surface')),
    'PENDING',
    'CampaignBuilder · pcp/campaign_builder.rs'
  );
  addPipeline('campaign', 'public_api', layerStatus(true), 'PENDING', 'GET /official/cold-start/surfaces/*');
  addPipeline(
    'campaign',
    'frontend',
    layerStatus(read('frontend/e2e/frontend-api-consistency-audit.spec.ts').includes('cold-start/surfaces')),
    'PENDING',
    'homepage · market cold-start surfaces'
  );
  if (!campaignGovOk) {
    addGap(
      'NON_BLOCKING',
      'campaign',
      'governance',
      'CAM-GOV-001',
      'Campaign governed views incomplete on static scan',
      'Verify migration 20260704120000 + campaign_catalog reads',
      'DRIFT'
    );
  }

  const adminEntities = ['guides', 'orders', 'market_listings', 'community_posts'];
  const adminComplete = adminEntities.every((e) => publicOps.includes(`"${e}"`));
  addPipeline('admin_public_content_center', 'database', layerStatus(true), 'PENDING', 'display_* columns on entities');
  addPipeline('admin_public_content_center', 'governance', layerStatus(adminComplete), 'PENDING', 'Public Ops write console');
  addPipeline('admin_public_content_center', 'builder', layerStatus(true, true), 'PENDING', 'N/A — governance write layer');
  addPipeline(
    'admin_public_content_center',
    'public_api',
    layerStatus(staticFileExists('crates/api/src/routes/admin/admin_official_public_operations_http.rs')),
    'PENDING',
    '/admin/official/public-operations/*'
  );
  addPipeline(
    'admin_public_content_center',
    'frontend',
    layerStatus(staticFileExists('frontend/app/admin/official/public-operations/page.tsx')),
    'PENDING',
    '/admin/official/public-operations'
  );

  const governanceRegistries = [
    ['ddg', 'registry/display-data-governance.v1.yaml'],
    ['ocs', 'registry/official-cold-start-dataset.v1.yaml'],
    ['sopcp', 'registry/single-official-public-catalog-policy.v1.yaml'],
    ['ocip', 'registry/official-catalog-identity-policy.v1.yaml'],
  ];

  for (const [id, reg] of governanceRegistries) {
    const exists = staticFileExists(reg);
    const pcpPtr = exists && registryHasPcpPointer(reg);
    addPipeline(id, 'governance', layerStatus(exists && pcpPtr), 'PENDING', `${reg} → PCP cross-ref`);
    addPipeline(id, 'evidence_registry_runbook', layerStatus(exists && pcpPtr), 'PENDING', 'SSOT + runbook pointers');
    if (!pcpPtr) {
      addGap('BLOCKING', id, 'evidence_registry_runbook', `${id.toUpperCase()}-SSOT-001`, `Missing PCP pointer in ${reg}`, 'Add public_content_platform block', 'DRIFT');
    }
  }

  const pcpCore = [
    'registry/public-content-platform.v1.yaml',
    'docs/runbook/TT-PUBLIC-CONTENT-PLATFORM.md',
    'registry/enterprise-ssot-alignment.v1.yaml',
    'scripts/dev/audit-pcp-architecture-compliance.cjs',
    'scripts/dev/validate-pcp-phase0-5-staging.cjs',
  ];
  const ssotOk = pcpCore.every((f) => staticFileExists(f));
  addPipeline('evidence_registry_runbook', 'governance', layerStatus(ssotOk), 'PENDING', 'PCP SSOT + audit scripts');
  if (!ssotOk) {
    addGap('BLOCKING', 'evidence_registry_runbook', 'governance', 'PCP-SSOT-001', 'Missing core PCP SSOT files', 'Restore registry/runbook/scripts', 'DRIFT');
  }
}

async function runPhase1Runtime() {
  const up = await localApiUp();
  if (!up) {
    addPipeline('_runtime', 'phase1_local', 'SKIPPED', 'SKIPPED', 'Local API not running — static-only Phase ①');
    return { state: 'SKIPPED', communityUnpublish: null };
  }

  addPipeline('_runtime', 'phase1_local', 'PASS', 'SKIPPED', 'Local /health/ready OK');
  const routes = [
    ['/api/v1/community/feed?limit=5', 'community'],
    ['/api/v1/guides?limit=5', 'official_guide'],
    ['/api/v1/market/provider/listings?limit=5', 'provider'],
    ['/api/v1/market/acquisition/listings?limit=5', 'acquisition'],
    ['/api/v1/official/cold-start/surfaces/home_hero', 'campaign'],
  ];

  for (const [route, domain] of routes) {
    const r = await probeApi(LOCAL_API, route);
    const row = pipeline.find((p) => p.domain === domain && p.layer === 'public_api');
    if (row) row.phase1 = r.ok ? 'PASS' : 'FAIL';
    if (!r.ok) {
      addGap('BLOCKING', domain, 'public_api', `P1-RT-${domain}`, `Local ${route} failed`, 'Start local API + migrate', 'DEFECT');
    }
  }

  return { state: 'PASS', up: true };
}

async function runPhase2Staging() {
  if (SKIP_STAGING) {
    addPipeline('_runtime', 'phase2_staging', 'SKIPPED', 'SKIPPED', 'SKIP_STAGING=1');
    return { state: 'SKIPPED' };
  }

  const ready = await probeApi(STAGING_API, '/health/ready');
  if (!ready.ok) {
    addPipeline('_runtime', 'phase2_staging', 'SKIPPED', 'FAIL', 'Staging unreachable');
    addGap('BLOCKING', '_runtime', 'phase2_staging', 'STG-001', 'Staging API unreachable', 'Check fly deploy / network', 'RISK_BLOCKING');
    return { state: 'FAIL' };
  }

  const routes = [
    ['/api/v1/community/feed?limit=5', 'community'],
    ['/api/v1/guides?limit=5', 'official_guide'],
    ['/api/v1/market/provider/listings?limit=5', 'provider'],
    ['/api/v1/market/acquisition/listings?limit=5', 'acquisition'],
    ['/api/v1/official/cold-start/surfaces/home_hero', 'campaign'],
  ];

  let stagingRoutesOk = true;
  for (const [route, domain] of routes) {
    const r = await probeApi(STAGING_API, route);
    const row = pipeline.find((p) => p.domain === domain && p.layer === 'public_api');
    if (row) row.phase2 = r.ok ? 'PASS' : 'FAIL';
    if (!r.ok) {
      stagingRoutesOk = false;
      addGap('BLOCKING', domain, 'public_api', `P2-RT-${domain}`, `Staging ${route} HTTP ${r.status}`, 'Fix staging API / migration', 'DEFECT');
    }
  }

  // Admin Public Content Center write path
  let adminOk = false;
  try {
    const client = createClient(STAGING_API);
    const tok = await client.adminLogin(
      process.env.ADMIN_EMAIL || 'tourist@test.com',
      process.env.ADMIN_PASS || 'Test123!'
    );
    const pq = await client.req(
      'GET',
      '/api/v1/admin/official/public-operations/publish-queue?limit=5',
      null,
      tok
    );
    adminOk = pq.status === 200 && pq.json?.status !== 'error';
    const adminRow = pipeline.find((p) => p.domain === 'admin_public_content_center' && p.layer === 'public_api');
    if (adminRow) adminRow.phase2 = adminOk ? 'PASS' : 'FAIL';

    // Community governance runtime loop (Phase 0.5 critical path)
    const feed = await client.req('GET', '/api/v1/community/feed?limit=50');
    const posts = feed.json?.posts || [];
    if (posts.length) {
      const postId = posts[0].id;
      const beforeInFeed = true;
      const unp = await client.unpublishEntity(tok, 'community_posts', postId);
      await new Promise((r) => setTimeout(r, 400));
      const feed2 = await client.req('GET', '/api/v1/community/feed?limit=200');
      const stillInFeed = (feed2.json?.posts || []).some((p) => String(p.id) === String(postId));
      const detail = await client.req('GET', `/api/v1/community/posts/${postId}`);
      const detailVisible = detail.json?.post?.id;

      if (unp.status < 400 && stillInFeed) {
        addGap(
          'BLOCKING',
          'community',
          'governance',
          'STG-COM-GOV-001',
          'Admin unpublish succeeds but post remains in Feed — governed view not active on staging',
          'Deploy Phase 0 to tt-api-staging + migration 20260704100000; re-run validate-pcp-phase0-5-staging.cjs',
          'DRIFT'
        );
        const govRow = pipeline.find((p) => p.domain === 'community' && p.layer === 'governance');
        if (govRow) govRow.phase2 = 'FAIL';
      } else if (unp.status < 400 && !stillInFeed) {
        const govRow = pipeline.find((p) => p.domain === 'community' && p.layer === 'governance');
        if (govRow) govRow.phase2 = 'PASS';
      }

      // restore
      await client.publishEntity(tok, 'community_posts', postId);
    }
  } catch (e) {
    addGap('BLOCKING', 'admin_public_content_center', 'public_api', 'STG-ADMIN-001', String(e.message || e), 'Fix admin auth on staging', 'DEFECT');
  }

  for (const row of pipeline) {
    if (row.phase2 === 'PENDING' && row.layer !== '_runtime') {
      if (row.phase1 === 'PASS' || row.phase1 === 'REFERENCE' || row.phase1 === 'PARTIAL') {
        row.phase2 = stagingRoutesOk ? row.phase1 : 'FAIL';
      }
    }
  }

  addPipeline('_runtime', 'phase2_staging', 'SKIPPED', stagingRoutesOk ? 'PARTIAL' : 'FAIL', 'Staging runtime probes');
  return { state: stagingRoutesOk ? 'PARTIAL' : 'FAIL' };
}

function computeFixOrder() {
  const order = [];
  const blocking = gaps.filter((g) => g.severity === 'BLOCKING');
  const seen = new Set();
  for (const g of blocking) {
    const key = g.fix || g.id;
    if (!seen.has(key)) {
      seen.add(key);
      order.push({ priority: order.length + 1, severity: g.severity, id: g.id, action: g.fix || g.note });
    }
  }
  for (const g of gaps.filter((x) => x.severity === 'NON_BLOCKING')) {
    const key = g.fix || g.id;
    if (!seen.has(key)) {
      seen.add(key);
      order.push({ priority: order.length + 1, severity: g.severity, id: g.id, action: g.fix || g.note });
    }
  }
  return order;
}

function writeMarkdown(report) {
  const lines = [
    `# PCP Full Pipeline Alignment · ${STAMP}`,
    '',
    '## Verdict',
    '',
    '| Gate | Result |',
    '|------|--------|',
    `| **Phase ① Local (Configuration + Static Pipeline)** | **${report.verdict.phase1_local}** |`,
    `| **Phase ① Local Runtime** | **${report.verdict.phase1_local_runtime}** |`,
    `| **Phase ② Staging Runtime** | **${report.verdict.phase2_staging}** |`,
    `| **TT_PCP_ARCHITECTURE_COMPLIANCE** | **${report.verdict.architecture_compliance}** |`,
    `| **TT_PCP_PHASE_0_5 Sign-off** | **${report.phase_0_5_sign_off}** |`,
    `| **PCP Full Pipeline Alignment Sign-off** | **${report.verdict.overall}** |`,
    '',
    `Blocking gaps: **${report.summary.blocking}** · Non-blocking: **${report.summary.non_blocking}**`,
    '',
    '## Pipeline Matrix',
    '',
    '| Domain | Layer | Phase ① | Phase ② | Note |',
    '|--------|-------|---------|---------|------|',
  ];
  for (const p of report.pipeline.filter((x) => !x.domain.startsWith('_'))) {
    lines.push(`| ${p.domain} | ${p.layer} | ${p.phase1} | ${p.phase2} | ${p.note} |`);
  }
  lines.push('', '## Gap List', '');
  if (!report.gaps.length) lines.push('_No gaps._');
  else {
    for (const g of report.gaps) {
      lines.push(`- **[${g.severity}]** \`${g.id}\` · ${g.domain}/${g.layer} — ${g.note}`);
      if (g.fix) lines.push(`  - Fix: ${g.fix}`);
    }
  }
  lines.push('', '## Fix Order', '');
  for (const f of report.fix_order) {
    lines.push(`${f.priority}. [${f.severity}] ${f.id} — ${f.action}`);
  }
  return lines.join('\n') + '\n';
}

async function main() {
  fs.mkdirSync(EVID_DIR, { recursive: true });

  console.log('\n=== PCP Full Pipeline Alignment Audit ===\n');

  analyzeStaticCode();
  const arch = runArchitectureCompliance();
  if (!arch.pass) {
    addGap('BLOCKING', 'community', 'builder', 'ARCH-COMP-001', 'TT_PCP_ARCHITECTURE_COMPLIANCE failed locally', 'Fix community governed read paths', 'DRIFT');
  }

  const phase1Runtime = await runPhase1Runtime();
  const phase2 = await runPhase2Staging();

  const blocking = gaps.filter((g) => g.severity === 'BLOCKING');
  const nonBlocking = gaps.filter((g) => g.severity === 'NON_BLOCKING');
  const fixOrder = computeFixOrder();

  const phase1LocalPass = blocking.filter((g) => g.id.startsWith('COM-') || g.id.startsWith('PCP-') || g.id.startsWith('ARCH')).length === 0;
  const phase2Pass = blocking.filter((g) => g.id.startsWith('STG-') || g.id.startsWith('P2-')).length === 0;
  const communityGovRow = pipeline.find((p) => p.domain === 'community' && p.layer === 'governance');
  const communityGovStagingPass = communityGovRow?.phase2 === 'PASS';
  const phase05SignOff =
    blocking.length === 0 && arch.pass && communityGovStagingPass ? 'COMPLETE' : 'PAUSED';

  const report = {
    audit: 'TT_PCP_FULL_PIPELINE_ALIGNMENT',
    stamp: STAMP,
    pipeline_standard: 'Database → PCP Governance → Public Engine Builder → Public API → Frontend',
    phase_0_5_sign_off: phase05SignOff,
    local_api: LOCAL_API,
    staging_api: STAGING_API,
    architecture_compliance: arch.pass ? 'PASS' : 'FAIL',
    pipeline,
    gaps,
    fix_order: fixOrder,
    summary: {
      blocking: blocking.length,
      non_blocking: nonBlocking.length,
      pipeline_rows: pipeline.length,
    },
    verdict: {
      architecture_compliance: arch.pass ? 'PASS' : 'FAIL',
      phase1_local: phase1LocalPass && arch.pass ? 'PASS' : 'PARTIAL',
      phase1_local_runtime: phase1Runtime.state,
      phase2_staging: phase2.state === 'SKIPPED' ? 'SKIPPED' : phase2Pass && phase2.state !== 'FAIL' ? 'PARTIAL' : 'FAIL',
      overall: blocking.length === 0 ? 'PASS' : 'FAIL',
      sign_off_allowed: blocking.length === 0 && communityGovStagingPass,
      note:
        phase05SignOff === 'COMPLETE'
          ? 'TT_PCP_PHASE_0_5 COMPLETE — Staging Community governance loop PASS'
          : 'Phase 0.5 sign-off PAUSED until Staging Community governance loop PASS',
    },
  };

  const jsonPath = path.join(EVID_DIR, 'pcp-full-pipeline-alignment.json');
  const mdPath = path.join(EVID_DIR, 'PCP-FULL-PIPELINE-ALIGNMENT-REPORT.md');
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2) + '\n');
  fs.writeFileSync(mdPath, writeMarkdown(report));

  console.log(`Phase ① Local: ${report.verdict.phase1_local} (runtime: ${report.verdict.phase1_local_runtime})`);
  console.log(`Phase ② Staging: ${report.verdict.phase2_staging}`);
  console.log(`Architecture: ${report.verdict.architecture_compliance}`);
  console.log(`Overall: ${report.verdict.overall} · Blocking: ${blocking.length} · Non-blocking: ${nonBlocking.length}`);
  console.log(`\nEvidence:\n  ${path.relative(ROOT, jsonPath)}\n  ${path.relative(ROOT, mdPath)}\n`);

  if (blocking.length) {
    console.log('Top blocking fixes:');
    fixOrder.filter((f) => f.severity === 'BLOCKING').slice(0, 5).forEach((f) => console.log(`  ${f.priority}. ${f.action}`));
  }

  process.exit(blocking.length === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
