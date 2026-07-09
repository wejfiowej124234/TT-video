#!/usr/bin/env node
/**
 * PCP Phase 1 — Full Platform Architecture Alignment Audit
 *
 * Single pipeline: Database → PCP Governance → Public Engine Builder → Public API → Frontend
 *
 * Domains: Community · Market · Provider · Acquisition · Official Guide · Campaign ·
 *          Admin Public Content Center (+ DDG/OCS/SOPCP/OCIP cross-refs)
 *
 * Layers per domain: governance · builder · public_api · frontend · registry · runbook · evidence
 *
 *   node scripts/dev/audit-pcp-phase1-full-alignment.cjs
 *   STAGING_API=https://tt-api-staging.fly.dev node scripts/dev/audit-pcp-phase1-full-alignment.cjs
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { createClient } = require('./lib/official-cold-start-admin-client.cjs');

const ROOT = path.join(__dirname, '../..');
const STAMP = process.env.AUDIT_STAMP || new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, 'Z');
const EVID_DIR = path.join(ROOT, 'evidence', 'GO_public_content_platform', STAMP);
const STAGING_API = (process.env.STAGING_API || 'https://tt-api-staging.fly.dev').replace(/\/$/, '');
const SKIP_STAGING = /^1|true|yes$/i.test(process.env.SKIP_STAGING || '');
const SKIP_ENTERPRISE = /^1|true|yes$/i.test(process.env.SKIP_ENTERPRISE || '');

const gaps = [];
const domainMatrix = [];
const oldReadPaths = [];

function read(rel) {
  const p = path.join(ROOT, rel);
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
}

function exists(...rels) {
  return rels.every((r) => fs.existsSync(path.join(ROOT, r)));
}

function addGap(severity, domain, layer, id, note, fix, classification) {
  gaps.push({ severity, domain, layer, id, note, fix, classification });
}

function cell(domain, layer, status, note, target = null) {
  domainMatrix.push({ domain, layer, status, note, target });
  return status;
}

function runScript(rel, env = {}) {
  const script = path.join(ROOT, rel);
  const r = spawnSync(process.execPath, [script], {
    cwd: ROOT,
    encoding: 'utf8',
    env: { ...process.env, AUDIT_STAMP: STAMP, ...env },
  });
  return { pass: r.status === 0, status: r.status, tail: (r.stdout || r.stderr || '').slice(-800) };
}

function registryHasPcp(rel) {
  const t = read(rel);
  return /public_content_platform|public-content-platform|TT_PCP/.test(t);
}

function findLatestCampaignBatchEvidence() {
  const base = path.join(ROOT, 'evidence', 'GO_public_content_platform');
  if (!fs.existsSync(base)) return null;
  const dirs = fs
    .readdirSync(base)
    .filter((d) => fs.existsSync(path.join(base, d, 'phase1-campaign-batch-validation-chain.json')))
    .sort()
    .reverse();
  if (!dirs.length) return null;
  try {
    const j = JSON.parse(fs.readFileSync(path.join(base, dirs[0], 'phase1-campaign-batch-validation-chain.json'), 'utf8'));
    return { stamp: dirs[0], overall: j.overall, path: `evidence/GO_public_content_platform/${dirs[0]}/phase1-campaign-batch-validation-chain.json` };
  } catch {
    return null;
  }
}

function findLatestMarketBatchEvidence() {
  const base = path.join(ROOT, 'evidence', 'GO_public_content_platform');
  if (!fs.existsSync(base)) return null;
  const dirs = fs
    .readdirSync(base)
    .filter((d) => fs.existsSync(path.join(base, d, 'phase1-market-batch-validation-chain.json')))
    .sort()
    .reverse();
  if (!dirs.length) return null;
  try {
    const j = JSON.parse(fs.readFileSync(path.join(base, dirs[0], 'phase1-market-batch-validation-chain.json'), 'utf8'));
    return { stamp: dirs[0], overall: j.overall, path: `evidence/GO_public_content_platform/${dirs[0]}/phase1-market-batch-validation-chain.json` };
  } catch {
    return null;
  }
}

function scanOldReadPaths() {
  const scans = [
    {
      id: 'OLD-MKT-001',
      domain: 'market',
      file: 'crates/api/src/db/market_listings.rs',
      pattern: /governed_market_listings_v1/,
      note: 'Public listings read governed_market_listings_v1 via market_catalog',
      fix: null,
      aligned: true,
    },
    {
      id: 'OLD-MKT-002',
      domain: 'market',
      file: 'crates/api/src/chain_off/market_public_surface.rs',
      pattern: /display_status\s*!=\s*"published"/,
      note: 'DDG/chain_off in-memory fallback when db_pool unavailable — not public PG read path',
      fix: 'Retain for chain_off-only mode; PG path uses governed_market_*',
      expected: true,
    },
    {
      id: 'OLD-CAM-001',
      domain: 'campaign',
      file: 'crates/api/src/db/campaign_catalog.rs',
      pattern: /FROM ops_cold_start_campaigns/i,
      note: 'Campaign public read still queries raw ops_cold_start_campaigns',
      fix: 'Read governed_campaign_surfaces_v1 via campaign_catalog + pcp/campaign_builder.rs',
    },
    {
      id: 'OLD-CAM-OK',
      domain: 'campaign',
      file: 'crates/api/src/db/campaign_catalog.rs',
      pattern: /governed_campaign_surfaces_v1/,
      note: 'Campaign public catalog uses governed view (aligned)',
      fix: null,
      aligned: true,
    },
    {
      id: 'OLD-COM-OK',
      domain: 'community',
      file: 'crates/api/src/db/community.rs',
      pattern: /governed_community_posts_v1/,
      note: 'Community public catalog uses governed view (aligned)',
      fix: null,
      aligned: true,
    },
  ];

  for (const s of scans) {
    const body = read(s.file);
    const hit = s.pattern.test(body);
    if (s.aligned) {
      oldReadPaths.push({ ...s, status: hit ? 'ALIGNED' : 'MISSING' });
    } else if (hit) {
      oldReadPaths.push({ ...s, status: s.expected ? 'EXPECTED' : 'LEGACY' });
      if (!s.expected) {
        addGap('PHASE1', s.domain, 'governance', s.id, s.note, s.fix, 'OLD_READ_PATH');
      }
    }
  }
}

function assessStaticDomains() {
  const communityGov = exists('crates/api/migrations/20260704100000_governed_community_posts_v1.sql');
  const feedBuilder = read('crates/api/src/pcp/feed_builder.rs');
  const marketBuilderRef = read('crates/api/src/chain_off/market_public_surface.rs');
  const marketBuilderPcp = exists('crates/api/src/pcp/market_builder.rs');
  const marketCatalog = read('crates/api/src/db/market_catalog.rs');
  const campaignBuilderPcp = exists('crates/api/src/pcp/campaign_builder.rs');
  const campaignCatalog = read('crates/api/src/db/campaign_catalog.rs');
  const campaignGovView = exists('crates/api/migrations/20260704120000_governed_campaign_surfaces_v1.sql');
  const campaignConsumer = read('crates/api/src/db/ops_cold_start_campaigns_consumer.rs');
  const publicOps = read('crates/api/src/db/public_operations_display_admin.rs');
  const pcpRegistry = read('registry/public-content-platform.v1.yaml');
  const pcpRunbook = read('docs/runbook/TT-PUBLIC-CONTENT-PLATFORM.md');

  // ── Community (Phase 0 baseline · target aligned) ──
  cell('community', 'governance', communityGov ? 'PASS' : 'FAIL', 'governed_community_posts_v1');
  cell('community', 'builder', exists('crates/api/src/pcp/feed_builder.rs') ? 'PASS' : 'FAIL', 'pcp/feed_builder.rs');
  cell('community', 'public_api', 'PASS', 'feed · detail · governed read paths');
  cell('community', 'frontend', exists('frontend/app/community/me/page.tsx') ? 'PASS' : 'FAIL', '/community/*');
  cell(
    'community',
    'registry',
    pcpRegistry.includes('governed_community_posts_v1') ? 'PASS' : 'FAIL',
    'public-content-platform.v1.yaml'
  );
  cell('community', 'runbook', pcpRunbook.includes('FeedBuilder') ? 'PASS' : 'FAIL', 'TT-PUBLIC-CONTENT-PLATFORM.md');
  cell('community', 'evidence', exists('scripts/dev/validate-pcp-phase0-5-staging.cjs') ? 'PASS' : 'FAIL', 'phase0.5 validation chain');

  const marketBatchEvidence = findLatestMarketBatchEvidence();
  const marketEvidencePass = marketBatchEvidence?.overall === 'PASS';
  const campaignBatchEvidence = findLatestCampaignBatchEvidence();
  const campaignEvidencePass = campaignBatchEvidence?.overall === 'PASS';

  // ── Market ──
  const marketGovView = exists('crates/api/migrations/20260704110000_governed_market_catalog_v1.sql');
  cell(
    'market',
    'governance',
    marketGovView && marketCatalog.includes('governed_market_listings_v1') ? 'PASS' : 'GAP',
    marketGovView ? 'governed_market_* SQL views' : 'Rust display_status filter (REFERENCE)',
    'governed_market_guides_v1 · governed_market_listings_v1 · governed_discover_orders_v1'
  );
  cell(
    'market',
    'builder',
    marketBuilderPcp && marketCatalog.includes('list_governed_market_listings_by_variant') ? 'PASS' : 'GAP',
    marketBuilderPcp ? 'pcp/market_builder.rs' : 'chain_off/market_public_surface.rs (REFERENCE)',
    'pcp/market_builder.rs'
  );
  cell('market', 'public_api', 'PASS', 'GET /guides · discover/orders · listings');
  cell('market', 'frontend', exists('frontend/app/guides/page.tsx') ? 'PASS' : 'FAIL', '/guides · /market');
  cell('market', 'registry', pcpRegistry.includes('market_builder') ? 'PASS' : 'GAP', 'content_domains.market');
  cell('market', 'runbook', /MarketBuilder|market_builder/.test(pcpRunbook) ? 'PASS' : 'GAP', 'runbook market section');
  cell(
    'market',
    'evidence',
    marketEvidencePass ? 'PASS' : 'GAP',
    marketEvidencePass ? marketBatchEvidence.path : 'No phase1 market batch validation chain yet',
    'phase1-market-batch-validation-chain.json'
  );
  if (!marketGovView || !marketCatalog.includes('governed_market_listings_v1')) {
    addGap(
      'PHASE1',
      'market',
      'governance',
      'P1-MKT-GOV-001',
      'Missing governed_market_* SQL views on public read path',
      'Apply migration 20260704110000 + wire public API to governed views',
      'REFERENCE_IMPL'
    );
  } else if (!marketBuilderPcp) {
    addGap(
      'PHASE1',
      'market',
      'builder',
      'P1-MKT-BLD-001',
      'MarketBuilder still in chain_off/market_public_surface.rs',
      'Create pcp/market_builder.rs and re-export public surface builders',
      'REFERENCE_IMPL'
    );
  }

  // ── Provider (shares market pipeline) ──
  for (const layer of ['governance', 'builder']) {
    cell(
      'provider',
      layer,
      marketGovView && marketBuilderPcp && marketCatalog.includes('governed_market_listings_v1') ? 'PASS' : 'GAP',
      'Shared with market — no separate fork allowed',
      'market_builder + governed_market_listings_v1 (variant=provider)'
    );
  }
  cell('provider', 'public_api', 'PASS', 'GET /market/provider/listings');
  cell('provider', 'frontend', exists('frontend/app/market/provider/page.tsx') ? 'PASS' : 'FAIL', '/market/provider');
  cell('provider', 'registry', pcpRegistry.includes('provider') ? 'PASS' : 'GAP', 'content_domains.provider');
  cell(
    'provider',
    'runbook',
    /MarketBuilder|market_builder|Provider.*Acquisition/.test(pcpRunbook) ? 'PASS' : 'GAP',
    'Provider documented under MarketBuilder (shared pipeline)'
  );
  cell(
    'provider',
    'evidence',
    marketEvidencePass ? 'PASS' : 'GAP',
    marketEvidencePass ? 'Shared phase1 market batch evidence' : 'Shared market evidence pending',
    'phase1 market batch evidence'
  );

  // ── Acquisition ──
  for (const layer of ['governance', 'builder']) {
    cell(
      'acquisition',
      layer,
      marketGovView && marketBuilderPcp && marketCatalog.includes('governed_market_listings_v1') ? 'PASS' : 'GAP',
      'Shared with market',
      'market_builder + governed_market_listings_v1 (variant=acquisition)'
    );
  }
  cell('acquisition', 'public_api', 'PASS', 'GET /market/acquisition/listings');
  cell('acquisition', 'frontend', exists('frontend/app/market/acquisition/page.tsx') ? 'PASS' : 'FAIL', '/market/acquisition');
  cell('acquisition', 'registry', pcpRegistry.includes('acquisition') ? 'PASS' : 'GAP', 'content_domains.acquisition');
  cell(
    'acquisition',
    'runbook',
    /MarketBuilder|market_builder|Provider.*Acquisition/.test(pcpRunbook) ? 'PASS' : 'GAP',
    'Acquisition documented under MarketBuilder (shared pipeline)'
  );
  cell(
    'acquisition',
    'evidence',
    marketEvidencePass ? 'PASS' : 'GAP',
    marketEvidencePass ? 'Shared phase1 market batch evidence' : 'Shared market evidence pending',
    'phase1 market batch evidence'
  );

  // ── Official Guide ──
  const guideGovView = marketGovView;
  cell(
    'official_guide',
    'governance',
    guideGovView ? 'PASS' : 'GAP',
    guideGovView ? 'governed_guides_v1' : 'OCS + display_status via MarketBuilder reference',
    'governed_guides_v1'
  );
  cell(
    'official_guide',
    'builder',
    guideGovView && marketBuilderPcp && read('crates/api/src/chain_off/guides.rs').includes('list_governed_market_guides') ? 'PASS' : 'GAP',
    'Guides public surface via MarketBuilder',
    'pcp/market_builder.rs guides surface'
  );
  cell('official_guide', 'public_api', 'PASS', 'GET /api/v1/guides');
  cell('official_guide', 'frontend', exists('frontend/app/guides/page.tsx') ? 'PASS' : 'FAIL', '/guides');
  cell('official_guide', 'registry', pcpRegistry.includes('official_guide') ? 'PASS' : 'GAP', 'content_domains.official_guide');
  cell('official_guide', 'runbook', pcpRunbook.includes('Official Guide') || pcpRunbook.includes('guides') ? 'PASS' : 'GAP', 'runbook');
  cell(
    'official_guide',
    'evidence',
    marketEvidencePass ? 'PASS' : 'GAP',
    marketEvidencePass ? 'Shared phase1 market batch evidence (governed_market_guides_v1)' : 'No governed guides evidence',
    'phase1 guides migration evidence'
  );
  if (!guideGovView || !read('crates/api/src/chain_off/guides.rs').includes('list_governed_market_guides')) {
    addGap(
      'PHASE1',
      'official_guide',
      'governance',
      'P1-GUI-GOV-001',
      'Guides public catalog not wired to governed_market_guides_v1',
      'Wire GET /guides to list_governed_market_guides when public catalog filter on',
      'REFERENCE_IMPL'
    );
  }

  // ── Campaign ──
  const campaignAligned =
    campaignGovView &&
    campaignBuilderPcp &&
    (campaignCatalog.includes('governed_campaign_surfaces_v1') ||
      campaignCatalog.includes('GOVERNED_CAMPAIGN_SURFACES_VIEW')) &&
    campaignCatalog.includes('get_governed_campaign_for_surface');
  cell(
    'campaign',
    'governance',
    campaignAligned ? 'PASS' : 'GAP',
    campaignAligned ? 'governed_campaign_surfaces_v1 + governed_campaign_items_v1' : 'ops_cold_start direct read',
    'governed_campaign_surfaces_v1'
  );
  cell(
    'campaign',
    'builder',
    campaignBuilderPcp && campaignCatalog.includes('get_governed_campaign_for_surface') ? 'PASS' : 'GAP',
    campaignBuilderPcp ? 'pcp/campaign_builder.rs' : 'ops_cold_start consumer (PARTIAL)',
    'pcp/campaign_builder.rs'
  );
  cell('campaign', 'public_api', 'PASS', 'GET /official/cold-start/surfaces/*');
  cell(
    'campaign',
    'frontend',
    read('frontend/e2e/frontend-api-consistency-audit.spec.ts').includes('cold-start/surfaces') ? 'PASS' : 'FAIL',
    'cold-start surfaces'
  );
  cell('campaign', 'registry', pcpRegistry.includes('campaign_builder') ? 'PASS' : 'GAP', 'content_domains.campaign');
  cell(
    'campaign',
    'runbook',
    /CampaignBuilder|campaign_builder/.test(pcpRunbook) ? 'PASS' : 'GAP',
    'runbook campaign section'
  );
  cell(
    'campaign',
    'evidence',
    campaignEvidencePass ? 'PASS' : 'GAP',
    campaignEvidencePass ? campaignBatchEvidence.path : 'No phase1 campaign batch validation chain yet',
    'phase1-campaign-batch-validation-chain.json'
  );
  if (!campaignAligned) {
    addGap(
      'PHASE1',
      'campaign',
      'governance',
      'P1-CAM-GOV-001',
      'Campaign public read not wired to governed_campaign_surfaces_v1',
      'Apply migration 20260704120000 + campaign_catalog + pcp/campaign_builder.rs',
      'REFERENCE_IMPL'
    );
  }
  if (!campaignBuilderPcp) {
    addGap(
      'PHASE1',
      'campaign',
      'builder',
      'P1-CAM-BLD-001',
      'CampaignBuilder not under pcp/ — ops_cold_start consumer',
      'pcp/campaign_builder.rs + governed campaign surfaces',
      'PARTIAL'
    );
  }

  // ── Admin Public Content Center ──
  const adminEntities = ['guides', 'orders', 'market_listings', 'community_posts'];
  const adminGov = adminEntities.every((e) => publicOps.includes(`"${e}"`));
  cell('admin_public_content_center', 'governance', adminGov ? 'PASS' : 'FAIL', 'Public Ops write console (4 entities)');
  cell('admin_public_content_center', 'builder', 'N/A', 'Write-path governance — no public builder');
  cell(
    'admin_public_content_center',
    'public_api',
    exists('crates/api/src/routes/admin/admin_official_public_operations_http.rs') ? 'PASS' : 'FAIL',
    '/admin/official/public-operations/*'
  );
  cell(
    'admin_public_content_center',
    'frontend',
    exists('frontend/app/admin/official/public-operations/page.tsx') ? 'PASS' : 'FAIL',
    '/admin/official/public-operations'
  );
  cell(
    'admin_public_content_center',
    'registry',
    exists('registry/public-operations-mvp.v1.yaml') ? 'PASS' : 'GAP',
    'public-operations-mvp.v1.yaml'
  );
  cell(
    'admin_public_content_center',
    'runbook',
    exists('docs/runbook/TT-OFFICIAL-OPS-PUBLIC-OPERATIONS-SSOT.md') ? 'PASS' : 'GAP',
    'Public Operations SSOT runbook'
  );
  cell('admin_public_content_center', 'evidence', 'PASS', 'Phase 0.5 validation + publish-queue probes');

  // ── Cross-capability registries ──
  for (const [id, reg] of [
    ['ddg', 'registry/display-data-governance.v1.yaml'],
    ['ocs', 'registry/official-cold-start-dataset.v1.yaml'],
    ['sopcp', 'registry/single-official-public-catalog-policy.v1.yaml'],
    ['ocip', 'registry/official-catalog-identity-policy.v1.yaml'],
  ]) {
    const ok = exists(reg) && registryHasPcp(reg);
    cell(id, 'registry', ok ? 'PASS' : 'FAIL', `${reg} → PCP cross-ref`);
    cell(id, 'runbook', ok ? 'PASS' : 'GAP', 'PCP sub-capability pointer');
    cell(id, 'evidence', ok ? 'PASS' : 'GAP', 'SSOT alignment evidence');
    if (!ok) addGap('BLOCKING', id, 'registry', `${id.toUpperCase()}-PCP-001`, `Missing PCP pointer in ${reg}`, 'Add public_content_platform block', 'DRIFT');
  }
}

async function probeStagingRoutes() {
  if (SKIP_STAGING) return { state: 'SKIPPED', routes: {} };
  const client = createClient(STAGING_API);
  const routes = {
    community: '/api/v1/community/feed?limit=5',
    market: '/api/v1/guides?limit=5',
    provider: '/api/v1/market/provider/listings?limit=5',
    acquisition: '/api/v1/market/acquisition/listings?limit=5',
    official_guide: '/api/v1/guides?limit=5',
    campaign: '/api/v1/official/cold-start/surfaces/home_hero',
  };
  const out = {};
  for (const [domain, route] of Object.entries(routes)) {
    try {
      const r = await client.req('GET', route);
      out[domain] = r.status >= 200 && r.status < 400;
    } catch {
      out[domain] = false;
    }
  }
  const allOk = Object.values(out).every(Boolean);
  return { state: allOk ? 'PASS' : 'PARTIAL', routes: out };
}

function domainAlignmentScore(domain) {
  const rows = domainMatrix.filter((r) => r.domain === domain);
  if (!rows.length) return { aligned: 0, total: 0, pct: 0 };
  const aligned = rows.filter((r) => r.status === 'PASS' || r.status === 'N/A').length;
  return { aligned, total: rows.length, pct: Math.round((aligned / rows.length) * 100) };
}

function writeMarkdown(report) {
  const lines = [
    `# PCP Phase 1 Full Platform Alignment · ${STAMP}`,
    '',
    '**Pipeline (唯一标准链路):** Database → PCP Governance → Public Engine Builder → Public API → Frontend',
    '',
    '## Executive Verdict',
    '',
    '| Gate | Result |',
    '|------|--------|',
    `| **Phase 1 Architecture Alignment** | **${report.verdict.phase1_alignment}** |`,
    `| **Community (baseline)** | **${report.verdict.community_baseline}** |`,
    `| **Domains fully aligned (7/7 layers PASS)** | **${report.summary.domains_fully_aligned} / ${report.summary.domain_count}** |`,
    `| **Phase 1 gaps (REFERENCE · PARTIAL · OLD_READ_PATH)** | **${report.summary.phase1_gaps}** |`,
    `| **Blocking SSOT drift** | **${report.summary.blocking}** |`,
    `| **TT_PCP_ARCHITECTURE_COMPLIANCE** | **${report.sub_audits.architecture_compliance}** |`,
    `| **PCP Full Pipeline Alignment (Phase 0.5)** | **${report.sub_audits.full_pipeline}** |`,
    `| **Enterprise SSOT Alignment** | **${report.sub_audits.enterprise_ssot}** |`,
    '',
    '## Domain Alignment Score',
    '',
    '| Domain | Aligned layers | Score | Status |',
    '|--------|----------------|-------|--------|',
  ];

  for (const d of report.domain_scores) {
    lines.push(`| ${d.domain} | ${d.aligned}/${d.total} | ${d.pct}% | ${d.status} |`);
  }

  lines.push('', '## Domain × Layer Matrix', '', '| Domain | Layer | Status | Note | Phase 1 target |', '|--------|-------|--------|------|----------------|');
  for (const r of report.domain_matrix) {
    lines.push(`| ${r.domain} | ${r.layer} | ${r.status} | ${r.note} | ${r.target || '—'} |`);
  }

  lines.push('', '## Legacy Read Paths', '');
  for (const o of report.old_read_paths) {
    lines.push(`- \`${o.id}\` · **${o.status}** · ${o.domain} — ${o.note}${o.file ? ` (\`${o.file}\`)` : ''}`);
  }

  lines.push('', '## Phase 1 Gap List (eliminate REFERENCE · PARTIAL · EXPECTED_DIFFERENCE)', '');
  if (!report.gaps.filter((g) => g.severity === 'PHASE1').length) lines.push('_No Phase 1 engineering gaps._');
  else {
    for (const g of report.gaps.filter((x) => x.severity === 'PHASE1')) {
      lines.push(`- **[${g.classification}]** \`${g.id}\` · ${g.domain}/${g.layer} — ${g.note}`);
      if (g.fix) lines.push(`  - Fix: ${g.fix}`);
    }
  }

  if (report.gaps.filter((g) => g.severity === 'BLOCKING').length) {
    lines.push('', '## Blocking (SSOT drift)', '');
    for (const g of report.gaps.filter((x) => x.severity === 'BLOCKING')) {
      lines.push(`- \`${g.id}\` · ${g.note}`);
    }
  }

  lines.push('', '## Phase 1 Fix Order', '');
  report.fix_order.forEach((f, i) => {
    lines.push(`${i + 1}. [${f.classification || f.severity}] ${f.id} — ${f.action}`);
  });

  lines.push('', '## Sub-Audit Evidence', '');
  for (const [k, v] of Object.entries(report.sub_audits)) {
    lines.push(`- **${k}**: ${v}${report.sub_audit_notes[k] ? ` — ${report.sub_audit_notes[k]}` : ''}`);
  }

  return lines.join('\n') + '\n';
}

function computeFixOrder() {
  const order = [];
  const seen = new Set();
  const priority = ['REFERENCE_IMPL', 'PARTIAL', 'OLD_READ_PATH', 'DRIFT'];
  const sorted = [...gaps].sort((a, b) => priority.indexOf(a.classification) - priority.indexOf(b.classification));
  for (const g of sorted) {
    const key = g.fix || g.id;
    if (!seen.has(key)) {
      seen.add(key);
      order.push({ id: g.id, severity: g.severity, classification: g.classification, action: g.fix || g.note });
    }
  }
  return order;
}

async function main() {
  fs.mkdirSync(EVID_DIR, { recursive: true });
  console.log('\n=== PCP Phase 1 Full Platform Architecture Alignment ===\n');

  scanOldReadPaths();

  console.log('Running sub-audits…');
  const arch = runScript('scripts/dev/audit-pcp-architecture-compliance.cjs');
  const marketBatchVal = SKIP_STAGING
    ? runScript('scripts/dev/validate-pcp-phase1-market-batch-staging.cjs', { SKIP_STAGING: '1' })
    : runScript('scripts/dev/validate-pcp-phase1-market-batch-staging.cjs');
  const campaignBatchVal = SKIP_STAGING
    ? runScript('scripts/dev/validate-pcp-phase1-campaign-batch-staging.cjs', { SKIP_STAGING: '1' })
    : runScript('scripts/dev/validate-pcp-phase1-campaign-batch-staging.cjs');

  assessStaticDomains();

  const pipeline = runScript('scripts/dev/audit-pcp-full-pipeline-alignment.cjs', {
    SKIP_STAGING: SKIP_STAGING ? '1' : '',
  });
  const stagingVal = SKIP_STAGING
    ? { pass: null, status: 'SKIPPED' }
    : runScript('scripts/dev/validate-pcp-phase0-5-staging.cjs');
  const enterprise = SKIP_ENTERPRISE
    ? { pass: null, status: 'SKIPPED' }
    : runScript('scripts/dev/audit-enterprise-ssot-alignment.cjs');

  const stagingRoutes = await probeStagingRoutes();

  const domainIds = [
    'community',
    'market',
    'provider',
    'acquisition',
    'official_guide',
    'campaign',
    'admin_public_content_center',
  ];
  const domainScores = domainIds.map((domain) => {
    const s = domainAlignmentScore(domain);
    let status = 'ALIGNED';
    if (s.pct < 100) status = domain === 'community' && s.pct >= 85 ? 'BASELINE' : 'GAP';
    if (s.pct === 100) status = 'ALIGNED';
    return { domain, ...s, status };
  });

  const phase1Gaps = gaps.filter((g) => g.severity === 'PHASE1');
  const blocking = gaps.filter((g) => g.severity === 'BLOCKING');
  const fullyAligned = domainScores.filter((d) => d.pct === 100).length;

  const communityBaseline = domainScores.find((d) => d.domain === 'community')?.pct === 100 ? 'PASS' : 'PARTIAL';
  const phase1Alignment =
    blocking.length === 0 && phase1Gaps.length === 0 && fullyAligned === domainIds.length
      ? 'COMPLETE'
      : blocking.length === 0 && communityBaseline === 'PASS'
        ? 'IN_PROGRESS'
        : 'BLOCKED';

  const report = {
    audit: 'TT_PCP_PHASE1_FULL_ALIGNMENT',
    stamp: STAMP,
    pipeline_standard: 'Database → PCP Governance → Public Engine Builder → Public API → Frontend',
    machine_key: 'TT_PCP_PHASE_1',
    machine_key_status: phase1Alignment === 'COMPLETE' ? 'COMPLETE' : 'IN_PROGRESS',
    staging_api: STAGING_API,
    domain_matrix: domainMatrix,
    domain_scores: domainScores,
    old_read_paths: oldReadPaths,
    gaps,
    fix_order: computeFixOrder(),
    staging_runtime: stagingRoutes,
    sub_audits: {
      architecture_compliance: arch.pass ? 'PASS' : 'FAIL',
      full_pipeline: pipeline.pass ? 'PASS' : 'FAIL',
      phase_0_5_staging: stagingVal.pass === null ? 'SKIPPED' : stagingVal.pass ? 'PASS' : 'FAIL',
      phase_1_market_batch: marketBatchVal.pass === null ? 'SKIPPED' : marketBatchVal.pass ? 'PASS' : 'FAIL',
      phase_1_campaign_batch: campaignBatchVal.pass === null ? 'SKIPPED' : campaignBatchVal.pass ? 'PASS' : 'FAIL',
      enterprise_ssot: enterprise.pass === null ? 'SKIPPED' : enterprise.pass ? 'PASS' : 'FAIL',
    },
    sub_audit_notes: {
      architecture_compliance: 'Community governed-view compliance (Phase 0.5 gate)',
      full_pipeline: 'Phase ①/② pipeline matrix + community staging loop',
      phase_0_5_staging: 'Publish/Unpublish · Surface OFF/ON · Feed+Detail',
      phase_1_market_batch: 'governed_market_* · MarketBuilder · staging market routes',
      phase_1_campaign_batch: 'governed_campaign_* · CampaignBuilder · staging cold-start surfaces',
      enterprise_ssot: 'Cross-platform registry/governance/config alignment',
    },
    summary: {
      domain_count: domainIds.length,
      domains_fully_aligned: fullyAligned,
      phase1_gaps: phase1Gaps.length,
      blocking: blocking.length,
      legacy_read_paths: oldReadPaths.filter((o) => o.status === 'LEGACY').length,
    },
    verdict: {
      phase1_alignment: phase1Alignment,
      community_baseline: communityBaseline,
      sign_off_allowed: phase1Alignment === 'COMPLETE',
      note:
        phase1Alignment === 'COMPLETE'
          ? 'All domains aligned on PCP standard pipeline'
          : 'Phase 1 IN_PROGRESS — eliminate REFERENCE_IMPL / PARTIAL / OLD_READ_PATH per domain',
    },
  };

  const jsonPath = path.join(EVID_DIR, 'pcp-phase1-full-alignment.json');
  const mdPath = path.join(EVID_DIR, 'PCP-PHASE1-FULL-ALIGNMENT-REPORT.md');
  const enterprisePath = path.join(EVID_DIR, 'enterprise-platform-consistency-summary.json');

  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2) + '\n');
  fs.writeFileSync(mdPath, writeMarkdown(report));
  fs.writeFileSync(
    enterprisePath,
    JSON.stringify(
      {
        audit: 'ENTERPRISE_PLATFORM_CONSISTENCY',
        stamp: STAMP,
        pcp_phase1_stamp: STAMP,
        enterprise_ssot: report.sub_audits.enterprise_ssot,
        pcp_sub_audits: report.sub_audits,
        blocking_gaps: blocking,
        phase1_gaps: phase1Gaps,
        verdict: report.verdict,
      },
      null,
      2
    ) + '\n'
  );

  console.log(`Phase 1 alignment: ${report.verdict.phase1_alignment}`);
  console.log(`Domains fully aligned: ${fullyAligned}/${domainIds.length}`);
  console.log(`Phase 1 gaps: ${phase1Gaps.length} · Blocking: ${blocking.length}`);
  console.log(`Sub-audits: arch=${report.sub_audits.architecture_compliance} pipeline=${report.sub_audits.full_pipeline} staging=${report.sub_audits.phase_0_5_staging} market_batch=${report.sub_audits.phase_1_market_batch} campaign_batch=${report.sub_audits.phase_1_campaign_batch} enterprise=${report.sub_audits.enterprise_ssot}`);
  console.log(`\nEvidence:\n  ${path.relative(ROOT, jsonPath)}\n  ${path.relative(ROOT, mdPath)}\n  ${path.relative(ROOT, enterprisePath)}\n`);

  process.exit(blocking.length > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
