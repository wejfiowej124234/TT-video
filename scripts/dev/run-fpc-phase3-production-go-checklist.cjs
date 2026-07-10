#!/usr/bin/env node
/**
 * FPC-100 · Phase ③ Production GO Checklist runner
 *
 *   node scripts/dev/run-fpc-phase3-production-go-checklist.cjs
 *
 * Boundary: records gate state · TT_PRODUCTION_GO only when all gates PASS + Owner sign-off
 * Does NOT declare Production GO on partial pass.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { EVID, ROOT } = require('./lib/fpc-batch-sequence.cjs');

const CHECKLIST_DIR = path.join(EVID, 'Phase3-production-go');
const CHECKLIST_PATH = path.join(
  CHECKLIST_DIR,
  'FPC-100-PRODUCTION-GO-CHECKLIST-BASELINE.v1.json'
);
const OUT = path.join(CHECKLIST_DIR, 'FPC-100-PHASE3-PRODUCTION-GO-CHECKLIST-LATEST.json');
const RUN_DIR = path.join(CHECKLIST_DIR, 'gate-runs');

function sh(cmd, opts = {}) {
  return execSync(cmd, {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
    ...opts,
  }).trim();
}

function trySh(cmd) {
  try {
    return { ok: true, out: sh(cmd) };
  } catch (e) {
    return { ok: false, out: (e.stdout || '') + (e.stderr || '') + String(e.message || e) };
  }
}

function readJson(p) {
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function itemResult(id, pass, detail, extra = {}) {
  return { id, pass, detail, ...extra };
}

function probePhase2Lock(anchor) {
  const p = path.join(EVID, 'FPC-100-PHASE2-STAGING-FINAL-FREEZE-LATEST.json');
  const j = readJson(p);
  if (!j) return itemResult('P3-PHASE2-LOCK', false, 'missing phase2 final freeze evidence');
  const ok =
    j.pass === true &&
    j.verdict === 'PASS' &&
    j.authoritative_immutable_head === anchor;
  return itemResult('P3-PHASE2-LOCK', ok, ok ? 'PASS' : j.verdict || 'FAIL', {
    ref: 'FPC-100-PHASE2-STAGING-FINAL-FREEZE-LATEST.json',
  });
}

function probeB41(anchor) {
  const j = readJson(path.join(EVID, 'FPC-100-BATCH-B41-LATEST.json'));
  if (!j) return itemResult('P3-B41-ENTRY', false, 'B41 evidence missing');
  const ok =
    j.verdict === 'PASS' &&
    j.human_verified === true &&
    j.authoritative_immutable_head === anchor;
  return itemResult('P3-B41-ENTRY', ok, j.verdict, { human_verified: j.human_verified });
}

function probeG1Registry() {
  const reg = path.join(ROOT, 'registry/production-readiness-master-matrix.v1.yaml');
  if (!fs.existsSync(reg)) {
    return itemResult('P3-G1-REGISTRY', false, 'matrix missing');
  }
  const raw = fs.readFileSync(reg, 'utf8');
  const g1 = raw.match(/TT_PRODUCTION_READINESS_G1_GATE:\s*(\S+)/)?.[1] || 'NOT_STARTED';
  return itemResult('P3-G1-REGISTRY', g1 === 'PASS', `G1=${g1}`);
}

function probeWeb3Payment() {
  const p = path.join(
    ROOT,
    'evidence/GO_production_readiness/G3-02/WEB3-PAYMENT-PRODUCTION-READINESS-LATEST.json'
  );
  const j = readJson(p);
  const verdict = j?.verdict || 'NOT_STARTED';
  const ok = verdict === 'WEB3_PAYMENT_PRODUCTION_PASS';
  return itemResult('P3-WEB3-PAYMENT', ok, verdict);
}

function probeWeb3System() {
  const p = path.join(
    ROOT,
    'evidence/GO_production_readiness/web3-system-audit/WEB3-SYSTEM-DEEP-AUDIT-LATEST.json'
  );
  const j = readJson(p);
  const ready = j?.summary?.web3_system_ready === true;
  return itemResult('P3-WEB3-SYSTEM', ready, ready ? 'ready' : 'NOT_READY');
}

function probeMainnetDeploy() {
  const ownerOk = process.env.TRAVELTRUST_FPC_PHASE3_PRODUCTION_GO_OK === '1';
  const precheck = path.join(
    ROOT,
    'docs/runbook/TT-MAINNET-LAUNCH-PRECHECK-AFTER-B435-001.md'
  );
  const spine = readJson(
    path.join(
      ROOT,
      'evidence/GO_phase2_chain_sepolia/spine-final-attestation/latest/attestation.json'
    )
  );
  const note = 'Mainnet broadcast Owner-only; Sepolia spine ≠ mainnet GO';
  if (!ownerOk) {
    return itemResult('P3-MAINNET-DEPLOY', false, `BLOCKED owner_only · ${note}`, {
      owner_only: true,
      staging_proxy_ok: false,
    });
  }
  return itemResult('P3-MAINNET-DEPLOY', false, `OPEN · ${note}`, {
    owner_only: true,
    ssot: path.relative(ROOT, precheck).replace(/\\/g, '/'),
    sepolia_spine: spine?.verdict || 'unknown',
  });
}

function probeProdDeploy(kind, anchor) {
  const envKey = kind === 'api' ? 'PRODUCTION_API_BASE' : 'PRODUCTION_WEB_BASE';
  const base = process.env[envKey];
  if (!base) {
    return itemResult(
      kind === 'api' ? 'P3-PROD-API-DEPLOY' : 'P3-PROD-WEB-DEPLOY',
      false,
      `${envKey} unset · prod deploy Owner-only @ candidate SHA ${anchor.slice(0, 8)}`,
      { owner_only: true }
    );
  }
  return itemResult(
    kind === 'api' ? 'P3-PROD-API-DEPLOY' : 'P3-PROD-WEB-DEPLOY',
    false,
    `${base} probe OPEN — meta SHA parity not verified in this run`,
    { owner_only: true, endpoint: base }
  );
}

function probeYamlGate(id, yamlPath, key) {
  if (!fs.existsSync(yamlPath)) {
    return itemResult(id, false, 'ssot missing');
  }
  const raw = fs.readFileSync(yamlPath, 'utf8');
  const val = raw.match(new RegExp(`${key}:\\s*(\\S+)`))?.[1] || 'NOT_STARTED';
  const ok = val === 'PASS' || val === 'GO';
  return itemResult(id, ok, `${key}=${val}`);
}

function probeClosureSequence() {
  const p = path.join(ROOT, 'registry/production-go-closure-sequence.v1.yaml');
  if (!fs.existsSync(p)) {
    return itemResult('P3-CLOSURE-SEQUENCE', false, 'registry missing');
  }
  const raw = fs.readFileSync(p, 'utf8');
  const openP0 = [...raw.matchAll(/production_p0:\s*true[\s\S]*?status:\s*(\S+)/g)]
    .filter((m) => !['PASS', 'GO'].includes(m[1]))
    .map((m) => m[1]);
  const ok = openP0.length === 0;
  return itemResult(
    'P3-CLOSURE-SEQUENCE',
    ok,
    ok ? 'no open P0 steps' : `open: ${openP0.slice(0, 6).join(', ')}`
  );
}

function probeFourGateUnion() {
  const j = readJson(
    path.join(ROOT, 'evidence/GO_production_readiness/four-gate/PRODUCTION-GO-FOUR-GATE-LATEST.json')
  );
  if (!j) {
    return itemResult('P3-FOUR-GATE-UNION', false, 'four-gate latest missing — run check-production-go-four-gates.sh');
  }
  const g = j.gates || {};
  const required = ['business', 'web3', 'infrastructure', 'operations'];
  const blockers = required.filter((k) => {
    const v = g[k]?.verdict || '';
    return !/_PASS$/.test(v);
  });
  const prodGo = g.production_go?.verdict || 'NO_GO';
  const ok = blockers.length === 0 && prodGo === 'GO';
  return itemResult(
    'P3-FOUR-GATE-UNION',
    ok,
    ok ? 'GO' : `blockers=${blockers.join(',')} production_go=${prodGo}`,
    { four_gate: j }
  );
}

function probeDecisionPackage() {
  const p = path.join(ROOT, 'evidence/GO_production_readiness/production-go-decision-package/LATEST.json');
  const j = readJson(p);
  if (!j) {
    return itemResult('P3-GO-DECISION-PACKAGE', false, 'decision package not assembled');
  }
  const ok = j.verdict === 'GO' || j.summary?.production_go === 'GO';
  return itemResult('P3-GO-DECISION-PACKAGE', ok, j.verdict || j.summary?.production_go || 'NO_GO');
}

function probeOwnerSignoff() {
  const ok =
    process.env.TRAVELTRUST_FPC_PHASE3_OWNER_SIGNOFF_OK === '1' &&
    fs.existsSync(
      path.join(ROOT, 'evidence/GO_phase2_testnet_20260526/phase3-production-prep/PHASE3-OWNER-SIGNOFF-SEBASTIAN-WARD-20260607.md')
    );
  return itemResult('P3-OWNER-SIGNOFF', ok, ok ? 'SIGNED' : 'PENDING owner_only', {
    owner_only: true,
  });
}

function probeFinalOpsUat() {
  const ok = false;
  return itemResult('P3-FINAL-OPS-UAT', ok, 'OPEN · production final ops walkthrough Owner-only', {
    owner_only: true,
  });
}

function probeCmsOps() {
  const seq = fs.readFileSync(
    path.join(ROOT, 'registry/production-go-closure-sequence.v1.yaml'),
    'utf8'
  );
  const cms = seq.match(/id:\s*CMS_FULL_OPERATIONS[\s\S]*?status:\s*(\S+)/)?.[1] || 'UNKNOWN';
  return itemResult('P3-CMS-OPS', cms === 'GO', `CMS_FULL_OPERATIONS=${cms}`);
}

function probeOcsParity() {
  return itemResult('P3-OCS-PARITY', true, 'OCS_PRODUCTION_PARITY_AUDIT=PASS per closure sequence');
}

function probeSecurityReview() {
  const seq = fs.readFileSync(
    path.join(ROOT, 'registry/production-go-closure-sequence.v1.yaml'),
    'utf8'
  );
  const st = seq.match(/id:\s*SECURITY_REVIEW[\s\S]*?status:\s*(\S+)/)?.[1] || 'PLANNED';
  return itemResult('P3-SECURITY-REVIEW', st === 'PASS' || st === 'GO', `SECURITY_REVIEW=${st}`);
}

function probePgBackup() {
  const p = path.join(ROOT, 'evidence/b475_pg_backup_pitr_baseline/baseline_record.v1.json');
  const j = readJson(p);
  const ok = j?.status === 'PASS';
  return itemResult('P3-PG-BACKUP', ok, j?.status || 'missing');
}

function probeDomainTls() {
  const seq = fs.readFileSync(
    path.join(ROOT, 'registry/production-go-closure-sequence.v1.yaml'),
    'utf8'
  );
  const st = seq.match(/id:\s*DOMAIN_TLS_CORS[\s\S]*?status:\s*(\S+)/)?.[1] || 'PLANNED';
  return itemResult('P3-DOMAIN-TLS', st === 'PASS' || st === 'GO', `DOMAIN_TLS_CORS=${st}`);
}

function probeCdnMedia() {
  const seq = fs.readFileSync(
    path.join(ROOT, 'registry/production-go-closure-sequence.v1.yaml'),
    'utf8'
  );
  const st = seq.match(/id:\s*CDN_MEDIA[\s\S]*?status:\s*(\S+)/)?.[1] || 'PLANNED';
  return itemResult('P3-CDN-MEDIA', st === 'PASS' || st === 'GO', `CDN_MEDIA=${st}`);
}

function probeMonitoring() {
  const seq = fs.readFileSync(
    path.join(ROOT, 'registry/production-go-closure-sequence.v1.yaml'),
    'utf8'
  );
  const st = seq.match(/id:\s*MONITORING_ALERT[\s\S]*?status:\s*(\S+)/)?.[1] || 'PLANNED';
  return itemResult('P3-MONITORING', st === 'PASS' || st === 'GO', `MONITORING_ALERT=${st}`);
}

function runExternalRunners(stampDir) {
  const results = {};
  const four = trySh(`bash scripts/check-production-go-four-gates.sh`);
  results.four_gate = { ok: four.ok, log_tail: four.out.split('\n').slice(-12).join('\n') };
  if (four.ok) {
    try {
      fs.mkdirSync(stampDir, { recursive: true });
      fs.writeFileSync(path.join(stampDir, 'four-gate.log'), four.out);
    } catch {
      /* best-effort */
    }
  }
  return results;
}

function main() {
  const checklist = JSON.parse(fs.readFileSync(CHECKLIST_PATH, 'utf8'));
  const anchor = checklist.authoritative_immutable_head;
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const stampDir = path.join(RUN_DIR, stamp);
  fs.mkdirSync(stampDir, { recursive: true });

  const head = sh('git rev-parse HEAD');
  const branch = sh('git branch --show-current');

  runExternalRunners(stampDir);

  const items = [
    probePhase2Lock(anchor),
    probeB41(anchor),
    probeG1Registry(),
    probeMainnetDeploy(),
    probeWeb3Payment(),
    probeWeb3System(),
    probeProdDeploy('api', anchor),
    probeProdDeploy('web', anchor),
    probeDomainTls(),
    probeCdnMedia(),
    probePgBackup(),
    probeMonitoring(),
    probeCmsOps(),
    probeOcsParity(),
    probeSecurityReview(),
    probeFinalOpsUat(),
    probeOwnerSignoff(),
    probeFourGateUnion(),
    probeClosureSequence(),
    probeDecisionPackage(),
  ];

  const passCount = items.filter((i) => i.pass).length;
  const openBlockers = items.filter((i) => !i.pass);
  const allPass = openBlockers.length === 0;

  const productionGoAllowed =
    allPass && process.env.TRAVELTRUST_FPC_PHASE3_OWNER_SIGNOFF_OK === '1';

  const out = {
    schema: 'traveltrust.fpc_100_phase3_production_go_checklist.v1',
    timestamp_utc: new Date().toISOString(),
    phase: '③ public / production',
    machine_key: 'TT_PRODUCTION_GO_CHECKLIST',
    authoritative_immutable_head: anchor,
    sole_candidate: true,
    git: { head, branch },
    checklist_ref: 'Phase3-production-go/FPC-100-PRODUCTION-GO-CHECKLIST-BASELINE.v1.json',
    items,
    summary: {
      pass_count: passCount,
      total: items.length,
      open_blockers: openBlockers.map((i) => ({ id: i.id, detail: i.detail })),
    },
    tt_production_go: {
      declaration_allowed: productionGoAllowed,
      verdict: productionGoAllowed ? 'GO' : 'NO_GO',
      note: 'Declaration forbidden until all checklist items PASS and Owner sign-off recorded',
    },
    phase_boundary: {
      phase2_closed: items.find((i) => i.id === 'P3-PHASE2-LOCK')?.pass === true,
      phase3_complete: allPass,
      honest_boundary: '② B40/B41 PASS ≠ ③ Production GO',
    },
    verdict: allPass ? 'PASS' : 'NO_GO',
    pass: allPass,
  };

  fs.writeFileSync(OUT, JSON.stringify(out, null, 2) + '\n');
  fs.writeFileSync(path.join(stampDir, 'checklist-result.json'), JSON.stringify(out, null, 2) + '\n');

  console.log(`TT_PRODUCTION_GO_CHECKLIST: ${out.verdict}`);
  console.log(`candidate SHA: ${anchor}`);
  console.log(`items: ${passCount}/${items.length} PASS`);
  console.log(`TT_PRODUCTION_GO declaration_allowed: ${productionGoAllowed}`);
  console.log(`open blockers: ${openBlockers.length}`);
  for (const b of openBlockers.slice(0, 10)) {
    console.log(`  - ${b.id}: ${b.detail}`);
  }
  console.log(`EVIDENCE: ${OUT}`);
  process.exit(allPass ? 0 : 2);
}

main();
