#!/usr/bin/env node
/**
 * Phase ② · Staging / Sepolia Production Validation — master orchestrator
 *
 * Aggregates sub-tracks ②-A … ②-F. Web3 is ②-D only — NOT the Phase ② total name.
 *
 *   node scripts/dev/run-phase2-production-validation.cjs
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '../..');
const REGISTRY = path.join(ROOT, 'registry/phase2-staging-sepolia-production-validation.v1.yaml');
const STAMP = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const EVID_ROOT = path.join(ROOT, 'evidence/GO_production_readiness/phase2-production-validation');
const RUN_DIR = path.join(EVID_ROOT, `validation-${STAMP}`);

function mkdirp(p) {
  fs.mkdirSync(p, { recursive: true });
}

function readJson(rel) {
  try {
    return JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
  } catch {
    return null;
  }
}

function exists(rel) {
  return fs.existsSync(path.join(ROOT, rel));
}

function assess2A() {
  const layerA = readJson('evidence/GO_production_readiness/escrow-bilateral-layer-a/ESCROW-BILATERAL-LAYER-A-EVIDENCE-LATEST.json');
  const uat = readJson('evidence/GO_production_readiness/phase2-production-validation/UAT-SIGNOFF-LATEST.json');
  const pass = uat?.verdict === 'PHASE2_WEBSITE_PRODUCT_UAT_PASS' && layerA?.verdict === 'LAYER_A_EVIDENCE_PASS';
  return {
    id: '2A',
    name: 'Website & Product UAT',
    pass,
    status: pass ? 'PASS' : uat || exists('registry/phase2-testnet-surface-coverage-registry.v1.yaml') ? 'IN_PROGRESS' : 'TARGET',
    detail: pass ? 'UAT signoff + Layer A PASS' : 'Surface coverage + multi-identity UAT — signoff pending',
  };
}

function assess2B() {
  const rbac = readJson('evidence/GO_production_readiness/web3-system-audit/RBAC-D3-CLOSURE-LATEST.json');
  const admin = readJson('evidence/GO_production_readiness/operations-dashboard/ADMIN-UAT-SIGNOFF-LATEST.json');
  const rbacPass =
    rbac?.verdict === 'RBAC_D3_CLOSURE_PASS' || rbac?.verdict === 'RBAC_D3_PRODUCTION_BOUNDARY_CLOSED';
  const pass = admin?.verdict === 'PHASE2_ADMIN_OPS_UAT_PASS' && rbacPass;
  return {
    id: '2B',
    name: 'Admin / Operations UAT',
    pass,
    status: pass ? 'PASS' : admin || rbac ? 'IN_PROGRESS' : 'IN_PROGRESS',
    detail: pass ? 'Admin UAT signoff + RBAC D3 closed' : 'Admin console · RBAC matrix · ops UAT pending',
  };
}

function assess2C() {
  const cms = readJson('evidence/GO_production_readiness/operations-dashboard/CMS-COS-VALIDATION-LATEST.json');
  const pass = cms?.verdict === 'PHASE2_CMS_COS_VALIDATION_PASS';
  return {
    id: '2C',
    name: 'Data Governance / CMS / COS Validation',
    pass,
    status: pass ? 'PASS' : cms ? 'IN_PROGRESS' : 'TARGET',
    detail: pass ? 'CMS/COS validation PASS' : cms?.note || 'CMS/COS/data governance validation not yet recorded',
  };
}

function assess2D() {
  const lifecycle = readJson('evidence/GO_production_readiness/sepolia-full-web3-lifecycle/SEPOLIA-FULL-WEB3-LIFECYCLE-VALIDATION-LATEST.json');
  const pass = lifecycle?.verdict === 'SEPOLIA_FULL_WEB3_LIFECYCLE_PASS';
  return {
    id: '2D',
    name: 'Web3 Lifecycle Validation',
    pass,
    status: pass ? 'PASS' : lifecycle?.verdict === 'SEPOLIA_FULL_WEB3_LIFECYCLE_IN_PROGRESS' ? 'IN_PROGRESS' : 'IN_PROGRESS',
    detail: lifecycle?.verdict || 'run run-sepolia-full-web3-lifecycle-validation.cjs',
    orchestrator: 'scripts/dev/run-sepolia-full-web3-lifecycle-validation.cjs',
  };
}

function assess2E() {
  const pg = readJson('evidence/GO_production_readiness/web3-protocol-grade-audit/WEB3-PROTOCOL-GRADE-AUDIT-LATEST.json');
  const rbac = readJson('evidence/GO_production_readiness/web3-system-audit/RBAC-D3-CLOSURE-LATEST.json');
  const p0 = (pg?.summary?.blockers_p0 ?? pg?.p0 ?? 99) === 0;
  const rbacPass = rbac?.verdict === 'RBAC_D3_CLOSURE_PASS' || rbac?.verdict === 'RBAC_D3_PRODUCTION_BOUNDARY_CLOSED';
  return {
    id: '2E',
    name: 'Security / RBAC / Monitoring',
    pass: p0 && rbacPass,
    status: p0 && rbacPass ? 'PASS' : 'IN_PROGRESS',
    detail: `Protocol-Grade P0=${pg?.summary?.blockers_p0 ?? '?'} · RBAC=${rbac?.verdict || 'pending'}`,
  };
}

function assess2F() {
  const er = readJson('evidence/GO_production_readiness/phase2-exit-review/PHASE2-EXIT-REVIEW-LATEST.json');
  const pass = er?.verdict === 'PHASE2_EXIT_REVIEW_PASS';
  return {
    id: '2F',
    name: 'Exit Review',
    pass,
    status: pass ? 'PASS' : er?.verdict || 'NOT_STARTED',
    detail: er?.verdict || 'blocked until ②-A…②-E pass',
    orchestrator: 'scripts/dev/run-phase2-exit-review.cjs',
  };
}

function main() {
  mkdirp(RUN_DIR);

  spawnSync(process.execPath, [path.join(__dirname, 'run-sepolia-full-web3-lifecycle-validation.cjs')], {
    cwd: ROOT,
    encoding: 'utf8',
  });

  const subTracks = [assess2A(), assess2B(), assess2C(), assess2D(), assess2E(), assess2F()];
  const passCount = subTracks.filter((t) => t.pass).length;
  const coreReady = subTracks.filter((t) => ['2A', '2B', '2C', '2D', '2E'].includes(t.id)).every((t) => t.pass);

  let verdict = 'PHASE2_STAGING_SEPOLIA_PRODUCTION_VALIDATION_IN_PROGRESS';
  if (subTracks.find((t) => t.id === '2F')?.pass) verdict = 'PHASE2_STAGING_SEPOLIA_PRODUCTION_VALIDATION_PASS';
  else if (passCount === 0) verdict = 'PHASE2_STAGING_SEPOLIA_PRODUCTION_VALIDATION_BLOCKED';

  const report = {
    schema: 'traveltrust.phase2_production_validation_report.v1',
    recorded_utc: new Date().toISOString(),
    stamp: STAMP,
    phase: 2,
    display_name: 'Staging / Sepolia Production Validation',
    note: 'Web3 Lifecycle Validation (②-D) is one sub-track — NOT the Phase ② total name',
    verdict,
    sub_tracks: subTracks,
    summary: { pass: passCount, total: subTracks.length, core_ready_for_exit_review: coreReady },
    registry: 'registry/phase2-staging-sepolia-production-validation.v1.yaml',
    next_on_pass: 'run-phase2-exit-review.cjs → run-web3-freeze.cjs → generate-mainnet-deployment-package.cjs',
  };

  const json = JSON.stringify(report, null, 2);
  fs.writeFileSync(path.join(RUN_DIR, 'PHASE2-PRODUCTION-VALIDATION-LATEST.json'), json);
  fs.writeFileSync(path.join(EVID_ROOT, 'PHASE2-PRODUCTION-VALIDATION-LATEST.json'), json);

  const md = `# Phase ② · Staging / Sepolia Production Validation

**Verdict:** \`${verdict}\`  
**Sub-tracks PASS:** ${passCount}/${subTracks.length}

| ID | Sub-track | Status | Detail |
|----|-----------|--------|--------|
${subTracks.map((t) => `| ②-${t.id.slice(1)} | ${t.name} | ${t.pass ? '✅' : '⬜'} | ${t.detail} |`).join('\n')}

**Note:** Web3 is ②-D only — not the Phase ② total name.
`;
  fs.writeFileSync(path.join(RUN_DIR, 'PHASE2-PRODUCTION-VALIDATION-LATEST.md'), md);
  fs.writeFileSync(path.join(EVID_ROOT, 'PHASE2-PRODUCTION-VALIDATION-LATEST.md'), md);

  console.log(JSON.stringify(report.summary, null, 2));
  console.log(JSON.stringify({ verdict, sub_tracks: subTracks.map((t) => ({ id: t.id, pass: t.pass })) }, null, 2));
  process.exit(verdict === 'PHASE2_STAGING_SEPOLIA_PRODUCTION_VALIDATION_BLOCKED' ? 1 : 0);
}

main();
