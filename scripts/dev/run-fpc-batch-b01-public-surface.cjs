#!/usr/bin/env node
/**
 * FPC-100 Batch B01 · Public Surface Parity (PER carry-forward · ① local)
 *
 *   node scripts/dev/run-fpc-batch-b01-public-surface.cjs
 *
 * Requires: WEB @ 3012 · API @ 8080 (same as PER Final Spot Check)
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '../..');
const EVID_BASE = path.join(
  ROOT,
  'docs/spec/governance-token/evidence/phase3-production-entry-baseline'
);
const EVID = path.join(EVID_BASE, 'FPC-100');
const OUT = path.join(EVID, 'FPC-100-BATCH-B01-LATEST.json');
const SPOT_JSON = path.join(EVID_BASE, 'PER-FINAL-SPOT-CHECK-LATEST.json');
const CODE_ANCHOR = 'e9df0a73f63b5ebccc7c17266f000c3bf867d872';

function sh(cmd) {
  return execSync(cmd, { cwd: ROOT, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
}

(async () => {
  const stamp = new Date().toISOString();
  const findings = [];

  const b00Path = path.join(EVID, 'FPC-100-BATCH-B00-LATEST.json');
  if (!fs.existsSync(b00Path)) {
    findings.push({ id: 'b00_missing', severity: 'P0', detail: 'B00 must PASS before B01' });
  } else {
    const b00 = JSON.parse(fs.readFileSync(b00Path, 'utf8'));
    if (!b00.pass) findings.push({ id: 'b00_not_pass', severity: 'P0', detail: 'B00 not PASS' });
  }

  let spotExit = 0;
  try {
    sh('bash scripts/dev/run-per-final-spot-check.sh');
  } catch (e) {
    spotExit = e.status || 1;
    findings.push({
      id: 'spot_check_script_fail',
      severity: 'P0',
      detail: e.stderr?.slice(0, 500) || String(e.message),
    });
  }

  let spot = null;
  if (fs.existsSync(SPOT_JSON)) {
    spot = JSON.parse(fs.readFileSync(SPOT_JSON, 'utf8'));
    if (spot.verdict !== 'PASS') {
      findings.push({
        id: 'spot_check_verdict',
        severity: 'P0',
        detail: `PER spot check verdict=${spot.verdict}`,
      });
    }
    if (spot.p0_p1?.length) {
      for (const h of spot.p0_p1) {
        findings.push({ id: h.id || 'pattern_hit', severity: h.severity || 'P1', route: h.route, detail: h.id });
      }
    }
  } else {
    findings.push({ id: 'spot_json_missing', severity: 'P0', detail: SPOT_JSON });
  }

  const head = sh('git rev-parse HEAD').trim();
  const p0p1 = findings.filter((f) => f.severity === 'P0' || f.severity === 'P1');
  const pass = p0p1.length === 0 && spotExit === 0 && spot?.verdict === 'PASS';

  const report = {
    schema: 'traveltrust.fpc_100_batch_certification.v1',
    batch_id: 'B01',
    title: 'Public Surface Parity (PER carry-forward)',
    layer: 'L4',
    phase: '① local',
    timestamp_utc: stamp,
    verifier: 'run-fpc-batch-b01-public-surface.cjs',
    product_version: 'v1.0',
    code_anchor_commit: CODE_ANCHOR,
    git: { head, branch: sh('git branch --show-current').trim() },
    depends_on: ['B00'],
    routes: ['/', '/traveltrust', '/market', '/help', '/trust', '/governance', '/traveltrust/announcements'],
    gates: [
      'scripts/gates/check-production-ui-hygiene-gate.sh',
      'scripts/gates/check-public-surface-audit-gate.sh',
      'scripts/dev/run-per-final-spot-check.sh',
    ],
    per_spot_check: spot
      ? {
          path: 'PER-FINAL-SPOT-CHECK-LATEST.json',
          verdict: spot.verdict,
          pages_checked: Object.keys(spot.pages || {}).length,
          p0_p1_count: (spot.p0_p1 || []).length,
        }
      : null,
    findings,
    verdict: pass ? 'PASS' : 'FAIL',
    pass,
    release_blocker: pass ? 'NO' : 'YES',
    next_batch: pass ? 'B02' : 'B01-remediation',
    ai_review: {
      verdict: pass ? 'PASS' : 'FAIL',
      ai_reviewer: 'Internal AI Review',
      review_type: 'Internal AI Review',
      review_date: stamp.slice(0, 10),
      review_version: 'v1',
    },
    human_verified: false,
    human_verifier: null,
    human_note: 'Public surface — human spot walk recommended before ② staging',
    traceability: {
      requirements: ['PER Round 1 Final Spot Check carry-forward', 'Public surface audit v1'],
      spec_refs: [
        'registry/traveltrust-public-surface-audit.v1.yaml',
        'FPC-100-PRE-RELEASE-DEEP-CHECKLIST-v1.md § B01',
      ],
      code_paths: [
        'scripts/dev/run-per-final-spot-check.cjs',
        'frontend/components/nav/ProductCrossNav.tsx',
      ],
      tests: [
        'check-production-ui-hygiene-gate.sh',
        'check-public-surface-audit-gate.sh',
        'run-per-final-spot-check.sh',
      ],
      evidence_path: 'FPC-100/FPC-100-BATCH-B01-LATEST.json',
      certification_batch: 'B01',
      product_version: 'v1.0',
    },
  };

  if (pass) {
    const expiryDays = 90;
    report.certified_at_utc = stamp;
    report.expires_at_utc = new Date(Date.parse(stamp) + expiryDays * 86400000).toISOString();
    report.expiry_policy_days = expiryDays;
    report.certification_frozen = true;
    report.frozen_at_utc = stamp;
    report.frozen_git_sha = head;
  }

  fs.mkdirSync(EVID, { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(report, null, 2) + '\n');
  console.log(`TT_FPC_100_BATCH_B01: ${report.verdict}`);
  console.log(`pass: ${pass} findings: ${p0p1.length}`);
  console.log(`EVIDENCE: ${OUT}`);
  process.exit(pass ? 0 : 1);
})();
