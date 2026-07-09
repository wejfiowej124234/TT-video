#!/usr/bin/env node
/**
 * PCP · Governed-View CI Enforcement Pre-check (Phase 1 Freeze window)
 *
 * Static readiness audit before wiring CI gates in Phase 2.
 * Does NOT fail freeze sign-off for missing GitHub workflow — records PRECHECK gaps.
 *
 *   node scripts/dev/audit-pcp-governed-view-ci-enforcement-precheck.cjs
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../..');
const STAMP = process.env.AUDIT_STAMP || new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, 'Z');
const EVID_DIR = path.join(ROOT, 'evidence', 'GO_public_content_platform', STAMP);

const checks = [];

function read(rel) {
  const p = path.join(ROOT, rel);
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
}

function exists(rel) {
  return fs.existsSync(path.join(ROOT, rel));
}

function record(id, label, status, detail, extra = {}) {
  checks.push({ id, label, status, detail, ...extra });
}

function scanNoRawPublicTableRead(id, label, file, rawPattern, governedToken) {
  const body = read(file);
  if (!body) {
    record(id, label, 'FAIL', `Missing file ${file}`);
    return;
  }
  const hasGoverned = body.includes(governedToken);
  const hasRaw = rawPattern.test(body);
  if (hasGoverned && !hasRaw) {
    record(id, label, 'PASS', `${file} uses governed read path`);
  } else if (hasGoverned && hasRaw) {
    record(id, label, 'WARN', `${file} mixes governed + raw reads (review before CI gate)`);
  } else {
    record(id, label, 'FAIL', `${file} missing ${governedToken}`);
  }
}

function main() {
  fs.mkdirSync(EVID_DIR, { recursive: true });

  const migrations = [
    ['gov_community', '20260704100000_governed_community_posts_v1.sql'],
    ['gov_market', '20260704110000_governed_market_catalog_v1.sql'],
    ['gov_campaign', '20260704120000_governed_campaign_surfaces_v1.sql'],
  ];
  for (const [id, mig] of migrations) {
    const rel = `crates/api/migrations/${mig}`;
    record(id, `Migration ${mig}`, exists(rel) ? 'PASS' : 'FAIL', rel);
  }

  const builders = [
    ['builder_feed', 'crates/api/src/pcp/feed_builder.rs'],
    ['builder_market', 'crates/api/src/pcp/market_builder.rs'],
    ['builder_campaign', 'crates/api/src/pcp/campaign_builder.rs'],
  ];
  for (const [id, rel] of builders) {
    record(id, `Builder ${path.basename(rel)}`, exists(rel) ? 'PASS' : 'FAIL', rel);
  }

  const phase2Blocked = [
    ['no_search_builder', 'crates/api/src/pcp/search_builder.rs'],
    ['no_recommendation_builder', 'crates/api/src/pcp/recommendation_builder.rs'],
  ];
  for (const [id, rel] of phase2Blocked) {
    record(
      id,
      `Phase 1 freeze — ${path.basename(rel)} must not exist yet`,
      !exists(rel) ? 'PASS' : 'FAIL',
      exists(rel) ? `${rel} present — defer to Phase 2` : 'Not present (correct during freeze)'
    );
  }

  scanNoRawPublicTableRead(
    'community_public_read',
    'Community public catalog',
    'crates/api/src/db/community.rs',
    /FROM community_posts/i,
    'governed_community_posts_v1'
  );
  scanNoRawPublicTableRead(
    'market_public_read',
    'Market public catalog',
    'crates/api/src/db/market_catalog.rs',
    /FROM market_listings/i,
    'GOVERNED_MARKET'
  );
  scanNoRawPublicTableRead(
    'campaign_public_read',
    'Campaign public catalog',
    'crates/api/src/db/campaign_catalog.rs',
    /FROM ops_cold_start_campaigns/i,
    'GOVERNED_CAMPAIGN'
  );

  const wfDir = path.join(ROOT, '.github/workflows');
  let ciWorkflowHit = false;
  if (fs.existsSync(wfDir)) {
    for (const f of fs.readdirSync(wfDir)) {
      const t = read(path.join('.github/workflows', f));
      if (/governed.view|TT_PCP|pcp-phase1|architecture-compliance/i.test(t)) {
        ciWorkflowHit = true;
        break;
      }
    }
  }
  record(
    'ci_workflow_governed_view_gate',
    'GitHub Actions governed-view enforcement workflow',
    ciWorkflowHit ? 'PASS' : 'PRECHECK',
    ciWorkflowHit
      ? 'Workflow references PCP/governed-view gate'
      : 'No CI workflow yet — Phase 2 wiring item (pre-check only, non-blocking for freeze)'
  );

  record(
    'ci_local_gate_scripts',
    'Local gate scripts available for CI wiring',
    exists('scripts/dev/audit-pcp-architecture-compliance.cjs') &&
      exists('scripts/dev/audit-pcp-phase1-full-alignment.cjs')
      ? 'PASS'
      : 'FAIL',
    'audit-pcp-architecture-compliance.cjs + audit-pcp-phase1-full-alignment.cjs'
  );

  const blocking = checks.filter((c) => c.status === 'FAIL');
  const precheck = checks.filter((c) => c.status === 'PRECHECK');
  const overall = blocking.length === 0 ? 'PASS' : 'FAIL';

  const report = {
    audit: 'TT_PCP_GOVERNED_VIEW_CI_ENFORCEMENT_PRECHECK',
    stamp: STAMP,
    phase: 'phase_1_freeze_regression_window',
    overall,
    ci_enforcement_ready: blocking.length === 0 && precheck.length === 0,
    ci_enforcement_precheck_only: precheck.length > 0,
    note:
      precheck.length > 0
        ? 'Static builders/migrations PASS — CI workflow wiring deferred to Phase 2'
        : 'All pre-check items PASS including CI workflow',
    checks,
    summary: {
      pass: checks.filter((c) => c.status === 'PASS').length,
      warn: checks.filter((c) => c.status === 'WARN').length,
      precheck: precheck.length,
      fail: blocking.length,
    },
  };

  const outPath = path.join(EVID_DIR, 'pcp-governed-view-ci-enforcement-precheck.json');
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2) + '\n');

  console.log(`\n=== PCP Governed-View CI Pre-check · ${overall} ===\n`);
  for (const c of checks) {
    console.log(`  [${c.status.padEnd(7)}] ${c.label}`);
    if (c.status !== 'PASS') console.log(`           ${c.detail}`);
  }
  console.log(`\nEvidence: ${path.relative(ROOT, outPath)}\n`);

  process.exit(blocking.length === 0 ? 0 : 1);
}

main();
