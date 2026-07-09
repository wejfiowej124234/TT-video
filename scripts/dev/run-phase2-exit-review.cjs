#!/usr/bin/env node
/**
 * Phase ②-F · Exit Review — all sub-tracks ②-A…②-E before Web3 Freeze + Package.
 *
 * Phase ② total: Staging / Sepolia Production Validation
 * Web3 is ②-D only — NOT Phase ② total name.
 *
 *   node scripts/dev/run-phase2-exit-review.cjs
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '../..');
const STAMP = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const EVID_ROOT = path.join(ROOT, 'evidence/GO_production_readiness/phase2-exit-review');
const RUN_DIR = path.join(EVID_ROOT, `review-${STAMP}`);

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

function runNode(label, rel) {
  const r = spawnSync(process.execPath, [path.join(__dirname, rel)], {
    cwd: ROOT,
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });
  return { label, ok: r.status === 0, status: r.status };
}

function main() {
  mkdirp(RUN_DIR);

  const steps = [];
  steps.push(runNode('phase2_master', 'run-phase2-production-validation.cjs'));
  steps.push(runNode('sepolia_lifecycle_2d', 'run-sepolia-full-web3-lifecycle-validation.cjs'));
  steps.push(runNode('web3_system_closure', 'run-web3-system-closure.cjs'));
  steps.push(runNode('protocol_grade', 'run-web3-protocol-grade-audit.cjs'));
  steps.push(runNode('escrow_settlement', 'run-escrow-settlement-authorization-audit.cjs'));

  const lifecycle = readJson('evidence/GO_production_readiness/sepolia-full-web3-lifecycle/SEPOLIA-FULL-WEB3-LIFECYCLE-VALIDATION-LATEST.json');
  const closure = readJson('evidence/GO_production_readiness/web3-system-audit/WEB3-SYSTEM-CLOSURE-LATEST.json');
  const pg = readJson('evidence/GO_production_readiness/web3-protocol-grade-audit/WEB3-PROTOCOL-GRADE-AUDIT-LATEST.json');
  const esc = readJson('evidence/GO_production_readiness/escrow-settlement-authorization/ESCROW-SETTLEMENT-AUTHORIZATION-AUDIT-LATEST.json');
  const cert = readJson('evidence/GO_ttg_cert/CERT-EXECUTION-INDEX-LATEST.json');

  const certSigned = cert?.signed_count ?? 0;
  const certTotal = cert?.total_certs ?? 12;

  const phase2Master = readJson('evidence/GO_production_readiness/phase2-production-validation/PHASE2-PRODUCTION-VALIDATION-LATEST.json');
  const rbac = readJson('evidence/GO_production_readiness/web3-system-audit/RBAC-D3-CLOSURE-LATEST.json');

  const checks = [
    {
      id: '2A-WEBSITE-PRODUCT-UAT',
      sub_track: '2A',
      pass: phase2Master?.sub_tracks?.find((t) => t.id === '2A')?.pass === true,
      detail: phase2Master?.sub_tracks?.find((t) => t.id === '2A')?.detail || 'Website · UI/UX · multi-identity UAT pending',
    },
    {
      id: '2B-ADMIN-OPS-UAT',
      sub_track: '2B',
      pass: phase2Master?.sub_tracks?.find((t) => t.id === '2B')?.pass === true,
      detail: phase2Master?.sub_tracks?.find((t) => t.id === '2B')?.detail || 'Admin · moderation · ops UAT pending',
    },
    {
      id: '2C-DATA-CMS-COS',
      sub_track: '2C',
      pass: phase2Master?.sub_tracks?.find((t) => t.id === '2C')?.pass === true,
      detail: phase2Master?.sub_tracks?.find((t) => t.id === '2C')?.detail || 'CMS/COS/data governance pending',
    },
    {
      id: '2D-WEB3-LIFECYCLE',
      sub_track: '2D',
      pass: lifecycle?.verdict === 'SEPOLIA_FULL_WEB3_LIFECYCLE_PASS',
      detail: lifecycle?.verdict || 'missing',
    },
    {
      id: '2D-RULE-PH2-001',
      sub_track: '2D',
      pass: lifecycle?.verdict === 'SEPOLIA_FULL_WEB3_LIFECYCLE_PASS',
      detail: 'Every mainnet Web3 feature has Sepolia E2E evidence',
    },
    {
      id: '2D-WEB3-SYSTEM-CLOSURE',
      sub_track: '2D',
      pass: closure?.verdict === 'WEB3_SYSTEM_CLOSURE_PASS',
      detail: closure?.verdict || 'missing',
    },
    {
      id: '2D-PROTOCOL-GRADE-P0',
      sub_track: '2D',
      pass: (pg?.summary?.blockers_p0 ?? pg?.p0 ?? 99) === 0,
      detail: pg?.verdict || 'missing',
    },
    {
      id: '2D-ESCROW-SETTLEMENT',
      sub_track: '2D',
      pass: esc?.verdict === 'ESCROW_SETTLEMENT_MODEL_ALIGNED' && (esc?.summary?.gaps_p0 ?? 99) === 0,
      detail: esc?.verdict || 'missing',
    },
    {
      id: '2D-TTG-CERT-8-12',
      sub_track: '2D',
      pass: certSigned >= 12,
      detail: `Cert ${certSigned}/${certTotal}`,
    },
    {
      id: '2E-SECURITY-RBAC',
      sub_track: '2E',
      pass: (pg?.summary?.blockers_p0 ?? 99) === 0 && rbac?.verdict === 'RBAC_D3_CLOSURE_PASS',
      detail: `Protocol-Grade P0 · RBAC=${rbac?.verdict || 'pending'}`,
    },
    {
      id: 'CROSS-BUSINESS-LOGIC-AUDIT',
      sub_track: '2D',
      pass: fs.existsSync(path.join(ROOT, 'evidence/GO_production_readiness/sepolia-full-web3-lifecycle/BUSINESS-LOGIC-AUDIT-LATEST.md')),
      detail: 'Web3 business logic audit (②-D)',
    },
    {
      id: 'CROSS-USER-JOURNEY-AUDIT',
      sub_track: '2D',
      pass: fs.existsSync(path.join(ROOT, 'evidence/GO_production_readiness/sepolia-full-web3-lifecycle/USER-JOURNEY-AUDIT-LATEST.md')),
      detail: 'Multi-identity user journey audit',
    },
  ];

  const passCount = checks.filter((c) => c.pass).length;
  const allPass = checks.every((c) => c.pass);

  let verdict = 'PHASE2_EXIT_REVIEW_BLOCKED';
  if (allPass) verdict = 'PHASE2_EXIT_REVIEW_PASS';
  else if (passCount >= 5) verdict = 'PHASE2_EXIT_REVIEW_IN_PROGRESS';

  const report = {
    schema: 'traveltrust.phase2_exit_review_report.v1',
    recorded_utc: new Date().toISOString(),
    stamp: STAMP,
    run_dir: path.relative(ROOT, RUN_DIR).replace(/\\/g, '/'),
    verdict,
    purpose: 'Phase ②-F Exit Review — all sub-tracks ②-A…②-E before Web3 Freeze',
    phase_2_total_name: 'Staging / Sepolia Production Validation',
    parent_ssot: 'registry/phase2-staging-sepolia-production-validation.v1.yaml',
    next_stage_on_pass: 'run-phase3-deployment-prerequisite-review.cjs → run-web3-freeze.cjs → generate-mainnet-deployment-package.cjs',
    forbidden_shortcut: {
      id: 'RULE-DEPLOY-001',
      statement: 'Do NOT swap testnet params to mainnet — generate Mainnet Deployment Package first',
    },
    checks,
    summary: { pass: passCount, total: checks.length },
    steps,
    freeze_on_pass: {
      code: 'Tag/commit freeze after Owner signoff',
      registry: 'registry/protocol-convergence-deployments.v1.yaml mainnet block',
      evidence: 'evidence/GO_production_readiness/sepolia-full-web3-lifecycle/',
    },
  };

  const json = JSON.stringify(report, null, 2);
  fs.writeFileSync(path.join(RUN_DIR, 'PHASE2-EXIT-REVIEW-LATEST.json'), json);
  fs.writeFileSync(path.join(EVID_ROOT, 'PHASE2-EXIT-REVIEW-LATEST.json'), json);

  const md = `# Phase ②-F · Exit Review

**Phase ② total:** Staging / Sepolia Production Validation  
**Verdict:** \`${verdict}\`  
**Checks:** ${passCount}/${checks.length}

## Sub-tracks reviewed

- ②-A Website & Product UAT
- ②-B Admin / Operations UAT
- ②-C Data Governance / CMS / COS
- ②-D Web3 Lifecycle Validation
- ②-E Security / RBAC / Monitoring

## Checks

${checks.map((c) => `- [${c.pass ? 'x' : ' '}] **${c.id}** (${c.sub_track}) — ${c.detail}`).join('\n')}

## On PASS

1. \`node scripts/dev/run-phase3-deployment-prerequisite-review.cjs\` — Phase ③ Deployment Prerequisite Review (10 Reviews)
2. \`node scripts/dev/run-web3-freeze.cjs\` — freeze Contracts · Registry · ABI · etc.
3. \`node scripts/dev/generate-mainnet-deployment-package.cjs\`
4. Phase ③ Wave deployment from \`MANIFEST/manifest.json\` (NOT param swap)
`;
  fs.writeFileSync(path.join(RUN_DIR, 'PHASE2-EXIT-REVIEW-LATEST.md'), md);
  fs.writeFileSync(path.join(EVID_ROOT, 'PHASE2-EXIT-REVIEW-LATEST.md'), md);

  console.log(JSON.stringify({ verdict, passCount, total: checks.length }, null, 2));
  process.exit(verdict === 'PHASE2_EXIT_REVIEW_BLOCKED' ? 1 : 0);
}

main();
