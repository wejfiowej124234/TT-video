#!/usr/bin/env node
/**
 * FPC-100 Batch B02 · Five-main marketing corridor (UI freeze + data chain · ① local)
 *
 *   node scripts/dev/run-fpc-batch-b02-five-main.cjs
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '../..');
const EVID = path.join(
  ROOT,
  'docs/spec/governance-token/evidence/phase3-production-entry-baseline/FPC-100'
);
const OUT = path.join(EVID, 'FPC-100-BATCH-B02-LATEST.json');
const EVID_DIR = path.join(EVID, 'B02-five-main');
const CODE_ANCHOR = 'e9df0a73f63b5ebccc7c17266f000c3bf867d872';

const GATES = [
  'scripts/gates/five-main-routes-ui-antiregression-gate.sh',
  'scripts/dev/run-web3-itinerary-l5-green.sh',
];

function sh(cmd) {
  return execSync(cmd, { cwd: ROOT, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
}

const { assertCanRun } = require('./lib/fpc-batch-sequence.cjs');

(async () => {
  const stamp = new Date().toISOString();
  const findings = [];
  const gateResults = [];

  const gate = assertCanRun('B02');
  if (!gate.ok) {
    findings.push({
      id: 'no_batch_skip',
      severity: 'P0',
      detail: `Cannot run B02 before ${gate.missing_prerequisites?.join(', ')}`,
    });
  }

  for (const g of GATES) {
    let exitCode = 0;
    let stdout = '';
    let stderr = '';
    try {
      stdout = sh(`bash ${g}`);
    } catch (e) {
      exitCode = e.status || 1;
      stdout = e.stdout || '';
      stderr = e.stderr || '';
      findings.push({
        id: `gate_fail:${path.basename(g)}`,
        severity: 'P0',
        gate: g,
        detail: (stderr || stdout || e.message || '').slice(0, 800),
      });
    }
    gateResults.push({
      gate: g,
      exit_code: exitCode,
      pass: exitCode === 0,
      summary_line: (stdout + stderr).split('\n').filter(Boolean).slice(-3).join(' | '),
    });
  }

  const head = sh('git rev-parse HEAD').trim();
  const p0p1 = findings.filter((f) => f.severity === 'P0' || f.severity === 'P1');
  const allGatesPass = gateResults.every((g) => g.pass);
  const pass = p0p1.length === 0 && allGatesPass && gate.ok;

  fs.mkdirSync(EVID_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(EVID_DIR, `gate-run-${stamp.replace(/[:.]/g, '-')}.json`),
    JSON.stringify({ timestamp_utc: stamp, gate_results: gateResults, findings }, null, 2) + '\n'
  );

  const report = {
    schema: 'traveltrust.fpc_100_batch_certification.v1',
    batch_id: 'B02',
    title: 'Five-main marketing corridor (UI freeze + data chain)',
    layer: 'L1-L3',
    phase: '① local',
    timestamp_utc: stamp,
    verifier: 'run-fpc-batch-b02-five-main.cjs',
    product_version: 'v1.0',
    code_anchor_commit: CODE_ANCHOR,
    git: { head, branch: sh('git branch --show-current').trim() },
    depends_on: ['B01'],
    routes: ['/', '/traveltrust', '/market', '/did-rank', '/community/*'],
    gates: GATES,
    gate_results: gateResults,
    gate_pass: allGatesPass,
    findings,
    verdict: pass ? 'PASS' : 'FAIL',
    pass,
    release_blocker: pass ? 'NO' : 'YES',
    next_batch: pass ? 'B03' : 'B02-remediation',
    ai_review: {
      verdict: pass ? 'PASS' : 'FAIL',
      ai_reviewer: 'Internal AI Review',
      review_type: 'Internal AI Review',
      review_date: stamp.slice(0, 10),
      review_version: 'v1',
    },
    human_verified: false,
    human_verifier: null,
    human_note: 'Five-main UI freeze + landing/market data chain — ② staging cross-device bookmark SLA deferred',
    traceability: {
      requirements: [
        'FIVE-MAIN-ROUTES-PHASE1-FREEZE respected',
        'LANDING-MARKET-PAGES-CODE-SSOT data chain green',
      ],
      spec_refs: [
        'frontend/evidence/GO_local_marketing_front_closure/FIVE-MAIN-ROUTES-PHASE1-FREEZE.md',
        'frontend/evidence/GO_local_web3_pages_closure/LANDING-MARKET-PAGES-CODE-SSOT.md',
        'FPC-100-PRE-RELEASE-DEEP-CHECKLIST-v1.md § B02',
      ],
      code_paths: [
        'frontend/app/(home)/page.tsx',
        'frontend/components/landing/useLandingPage.ts',
        'frontend/lib/landingItinerarySession.ts',
        'frontend/components/market/useMarketPage.ts',
      ],
      tests: GATES.map((g) => path.basename(g)),
      evidence_path: 'FPC-100/FPC-100-BATCH-B02-LATEST.json',
      certification_batch: 'B02',
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
  console.log(`TT_FPC_100_BATCH_B02: ${report.verdict}`);
  console.log(`pass: ${pass} findings: ${p0p1.length}`);
  console.log(`EVIDENCE: ${OUT}`);
  process.exit(pass ? 0 : 1);
})();
