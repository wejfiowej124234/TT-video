#!/usr/bin/env node
/**
 * FPC-100 Batch B04 · Market · guides · catalog · DDG (① local)
 *
 *   node scripts/dev/run-fpc-batch-b04-market-ddg.cjs
 *
 * Requires: API @ 8080 (TRAVELTRUST_PUBLIC_CATALOG_SURFACE=1 when seeded)
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
const OUT = path.join(EVID, 'FPC-100-BATCH-B04-LATEST.json');
const EVID_DIR = path.join(EVID, 'B04-market-ddg');
const PARITY_JSON = path.join(
  ROOT,
  'docs/spec/governance-token/evidence/phase3-production-entry-baseline/PER-WAVE-C-MARKET-GUIDE-PARITY-LATEST.json'
);
const CODE_ANCHOR = 'e9df0a73f63b5ebccc7c17266f000c3bf867d872';

const GATES = [
  'scripts/gates/vertical-slice-01-guides-catalog.sh',
  'scripts/gates/vertical-slice-03-market-hub-public-smoke.sh',
  'scripts/gates/check-display-data-governance-ssot.sh',
  'scripts/dev/run-market-guide-catalog-parity.sh',
];

function sh(cmd, env = {}) {
  return execSync(cmd, {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, ...env },
  });
}

const { assertCanRun } = require('./lib/fpc-batch-sequence.cjs');

(async () => {
  const stamp = new Date().toISOString();
  const findings = [];
  const gateResults = [];

  const gate = assertCanRun('B04');
  if (!gate.ok) {
    findings.push({
      id: 'no_batch_skip',
      severity: 'P0',
      detail: `Cannot run B04 before ${gate.missing_prerequisites?.join(', ')}`,
    });
  }

  for (const g of GATES) {
    let exitCode = 0;
    let stdout = '';
    let stderr = '';
    try {
      stdout = sh(`bash ${g}`, { API_BASE: 'http://127.0.0.1:8080', BASE: 'http://127.0.0.1:8080' });
    } catch (e) {
      exitCode = e.status || 1;
      stdout = e.stdout || '';
      stderr = e.stderr || '';
      findings.push({
        id: `gate_fail:${path.basename(g)}`,
        severity: 'P0',
        gate: g,
        detail: (stderr || stdout || e.message || '').slice(0, 1500),
      });
    }
    gateResults.push({
      gate: g,
      exit_code: exitCode,
      pass: exitCode === 0,
      summary_line: (stdout + stderr).split('\n').filter(Boolean).slice(-5).join(' | '),
    });
  }

  let parity = null;
  if (fs.existsSync(PARITY_JSON)) {
    parity = JSON.parse(fs.readFileSync(PARITY_JSON, 'utf8'));
    if (!parity.pass) {
      for (const f of parity.failures || []) {
        findings.push({ id: 'catalog_parity', severity: 'P0', detail: String(f) });
      }
    }
    if ((parity.all_guides?.trust_gate_fixture_count || 0) > 0) {
      findings.push({
        id: 'trust_gate_leak',
        severity: 'P0',
        detail: `trust-gate fixtures in public guides: ${parity.all_guides.trust_gate_fixture_count}`,
      });
    }
    const dupes = parity.hangzhou?.duplicate_display_labels || parity.all_guides?.duplicate_display_labels || [];
    if (dupes.length > 0) {
      findings.push({
        id: 'duplicate_display_labels',
        severity: 'P1',
        detail: JSON.stringify(dupes.slice(0, 5)),
      });
    }
  } else {
    findings.push({ id: 'parity_json_missing', severity: 'P0', detail: PARITY_JSON });
  }

  const head = sh('git rev-parse HEAD').trim();
  const p0p1 = findings.filter((f) => f.severity === 'P0' || f.severity === 'P1');
  const allGatesPass = gateResults.every((g) => g.pass);
  const pass = p0p1.length === 0 && allGatesPass && gate.ok && parity?.pass !== false;

  fs.mkdirSync(EVID_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(EVID_DIR, `gate-run-${stamp.replace(/[:.]/g, '-')}.json`),
    JSON.stringify({ timestamp_utc: stamp, gate_results: gateResults, parity, findings }, null, 2) + '\n'
  );
  if (parity && fs.existsSync(PARITY_JSON)) {
    fs.copyFileSync(PARITY_JSON, path.join(EVID_DIR, 'PER-WAVE-C-MARKET-GUIDE-PARITY-LATEST.json'));
  }

  const report = {
    schema: 'traveltrust.fpc_100_batch_certification.v1',
    batch_id: 'B04',
    title: 'Market · guides · catalog · DDG',
    layer: 'L1-L3',
    phase: '① local',
    timestamp_utc: stamp,
    verifier: 'run-fpc-batch-b04-market-ddg.cjs',
    product_version: 'v1.0',
    code_anchor_commit: CODE_ANCHOR,
    git: { head, branch: sh('git branch --show-current').trim() },
    depends_on: ['B01', 'B03'],
    routes: ['/market', '/market/*', '/discover'],
    gates: GATES,
    gate_results: gateResults,
    gate_pass: allGatesPass,
    catalog_parity: parity
      ? {
          path: 'PER-WAVE-C-MARKET-GUIDE-PARITY-LATEST.json',
          pass: parity.pass,
          api_guide_count: parity.all_guides?.api_count,
          trust_gate_fixture_count: parity.all_guides?.trust_gate_fixture_count,
          hangzhou_count: parity.hangzhou?.api_count,
          duplicate_display_labels: parity.hangzhou?.duplicate_display_labels?.length || 0,
        }
      : null,
    ddg_ssot: {
      registry: 'registry/display-data-governance.v1.yaml',
      policy: 'registry/single-official-public-catalog-policy.v1.yaml',
      gate: 'check-display-data-governance-ssot.sh',
    },
    findings,
    verdict: pass ? 'PASS' : 'FAIL',
    pass,
    release_blocker: pass ? 'NO' : 'YES',
    next_batch: pass ? 'B05' : 'B04-remediation',
    ai_review: {
      verdict: pass ? 'PASS' : 'FAIL',
      ai_reviewer: 'Internal AI Review',
      review_type: 'Internal AI Review',
      review_date: stamp.slice(0, 10),
      review_version: 'v1',
    },
    human_verified: false,
    human_verifier: null,
    human_note: 'Public catalog DB→API→projection parity; DDG lifecycle — ② staging cross-check deferred',
    traceability: {
      requirements: [
        'Public guide list filtered per market_public_surface',
        'No demo/trust-gate labels in consumer catalog',
        'DDG registry surfaces PASS',
        'API guide count parity (CI-10)',
      ],
      spec_refs: [
        'registry/display-data-governance.v1.yaml',
        'registry/single-official-public-catalog-policy.v1.yaml',
        'crates/api/src/chain_off/market_public_surface.rs',
        'FPC-100-PRE-RELEASE-DEEP-CHECKLIST-v1.md § B04',
      ],
      code_paths: [
        'scripts/dev/run-market-guide-catalog-parity.cjs',
        'scripts/gates/vertical-slice-01-guides-catalog.sh',
        'scripts/gates/vertical-slice-03-market-hub-public-smoke.sh',
      ],
      tests: GATES.map((g) => path.basename(g)),
      evidence_path: 'FPC-100/FPC-100-BATCH-B04-LATEST.json',
      certification_batch: 'B04',
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
  console.log(`TT_FPC_100_BATCH_B04: ${report.verdict}`);
  console.log(`pass: ${pass} findings: ${p0p1.length}`);
  console.log(`EVIDENCE: ${OUT}`);
  process.exit(pass ? 0 : 1);
})();
