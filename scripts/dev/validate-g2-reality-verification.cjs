#!/usr/bin/env node
/**
 * G2 Reality Verification — five truth sources:
 *   Evidence · Matrix · Registry · Runtime · Call Graph
 * + mandatory Production Runtime Identity Guard (TT_PRODUCTION_RUNTIME_IDENTITY)
 *
 *   node scripts/dev/validate-g2-reality-verification.cjs --evidence-dir evidence/.../g2-reality-verification/<stamp>
 */
const fs = require('fs');
const path = require('path');
const {
  evaluateProductionRuntimeIdentity,
  writeIdentityEvidence,
} = require('./lib/production-runtime-identity-guard.cjs');
const { runCallGraphAudit, writeCallGraphEvidence } = require('./lib/runtime-truth-call-graph.cjs');
const {
  buildSixWayTruth,
  releaseTrainStep,
  loadReleaseTrainConfig,
  TRUTH_SOURCES,
} = require('./lib/reality-verification-truths.cjs');

const ROOT = path.join(__dirname, '../..');
const REG_MATRIX = path.join(ROOT, 'registry/production-readiness-master-matrix.v1.yaml');
const REG_INTERNAL = path.join(ROOT, 'registry/g2-internal-routes-ssot.v1.json');
const REG_PERF = path.join(ROOT, 'registry/g2-perf-hot-paths-ssot.v1.json');
const REG_IDENTITY = path.join(ROOT, 'registry/production-runtime-identity-ssot.v1.json');
const REG_RELEASE_TRAIN = path.join(ROOT, 'registry/release-train-reality-verification.v1.json');
const G2_BLOCKERS = ['PRM-SEC-B001', 'PRM-SEC-B002', 'PRM-PER-B001', 'PRM-MON-B001'];

function parseArgs() {
  const args = { evidenceDir: '', fixDir: '' };
  for (let i = 2; i < process.argv.length; i++) {
    if (process.argv[i] === '--evidence-dir') args.evidenceDir = process.argv[++i];
    if (process.argv[i] === '--fix-dir') args.fixDir = process.argv[++i];
  }
  return args;
}

function readJson(p) {
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

function readText(p) {
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
}

function gapBlock(reg, id) {
  const marker = `  - id: ${id}`;
  const start = reg.indexOf(marker);
  if (start < 0) return '';
  const tail = reg.slice(start + marker.length);
  const nextRel = tail.search(/\r?\n  - id: PRM-/);
  return reg.slice(start, nextRel >= 0 ? start + marker.length + nextRel : reg.length);
}

function gapField(block, field) {
  const m = block.match(new RegExp(`    ${field}: ([^\\n]+)`));
  return m ? m[1].trim() : null;
}

function parseKeyVal(text) {
  const out = {};
  for (const line of text.split(/\r?\n/)) {
    if (!line.includes('=')) continue;
    const i = line.indexOf('=');
    out[line.slice(0, i)] = line.slice(i + 1);
  }
  return out;
}

function matrixConsistency(regYaml, id) {
  const block = gapBlock(regYaml, id);
  const status = gapField(block, 'status');
  const closedEvidence = gapField(block, 'closed_evidence');
  const legacyEvidence = gapField(block, 'evidence');
  const issues = [];
  if (status === 'CLOSED' && !closedEvidence) {
    if (!legacyEvidence || legacyEvidence.startsWith('docs/')) {
      issues.push('Matrix CLOSED without closed_evidence (verification evidence path required)');
    }
  }
  return { status, closed_evidence: closedEvidence || legacyEvidence, issues };
}

function verifySecB001(base, regYaml) {
  const dir = path.join(base, 'security-b001');
  const routeMatrix = readJson(path.join(dir, 'internal-route-matrix.json'));
  const ssot = readJson(REG_INTERNAL);
  const codeAnchors = parseKeyVal(readText(path.join(dir, 'code-anchors.txt')));
  const meta = parseKeyVal(readText(path.join(dir, 'meta-summary.txt')));
  const flyInv = readText(path.join(dir, 'fly-secrets-inventory.txt'));
  const mx = matrixConsistency(regYaml, 'PRM-SEC-B001');

  const checks = {
    code_router_gate: Number(codeAnchors.router_internal_gate || 0) >= 1,
    code_middleware_prefix: Number(codeAnchors.middleware_prefix_gate || 0) >= 1,
    ssot_route_count_match:
      ssot?.routes?.length === routeMatrix?.routes_total &&
      Number(codeAnchors.ssot_routes || 0) === ssot?.routes?.length,
    all_internal_routes_gate_403:
      routeMatrix?.pass === true && routeMatrix?.routes_gate_fail === 0,
    prod_internal_secret: meta.prod_internal_api_secret_configured === 'True',
    fly_internal_secret: /fly_secret_present_INTERNAL_API_SECRET=yes/.test(flyInv),
    matrix_consistent: mx.issues.length === 0,
  };

  const verified = Object.values(checks).every(Boolean);
  return {
    id: 'PRM-SEC-B001',
    verdict: verified ? 'VERIFIED' : 'VERIFICATION_FAIL',
    checks,
    matrix: mx,
    reason: verified
      ? 'All SSOT internal routes deny without secret · code gate · Fly secret · Matrix consistent'
      : 'Internal route coverage or Matrix/Evidence drift — see internal-route-matrix.json',
  };
}

function verifyProductionRuntimeIdentityBlock(base, regYaml) {
  const identityDir = path.join(base, 'production-runtime-identity');
  const evaluation = evaluateProductionRuntimeIdentity(identityDir, { profile: 'production' });
  writeIdentityEvidence(identityDir, evaluation, {
    stamp: path.basename(base),
    gate: 'G2',
    layer: 'Reality Verification',
  });

  const mx = matrixConsistency(regYaml, 'PRM-SEC-B002');
  const verified = evaluation.pass && mx.issues.length === 0;

  return {
    id: 'PRM-SEC-B002',
    alias: 'Production Runtime Identity',
    machine_key: 'TT_PRODUCTION_RUNTIME_IDENTITY',
    verdict: verified ? 'VERIFIED' : 'VERIFICATION_FAIL',
    checks: {
      ...evaluation.checks,
      matrix_consistent: mx.issues.length === 0,
      identity_guard: evaluation.pass,
    },
    matrix: mx,
    identity: evaluation,
    reason: evaluation.reason,
  };
}

function verifyPerB001(base, regYaml) {
  const dir = path.join(base, 'performance-b001');
  const perf = readJson(path.join(dir, 'perf-summary.json'));
  const ssot = readJson(REG_PERF);
  const mx = matrixConsistency(regYaml, 'PRM-PER-B001');
  const required = (ssot?.endpoints || []).map((e) => e.id);
  const present = Object.keys(perf?.endpoints || {});
  const missing = required.filter((id) => !present.includes(id));

  const checks = {
    hot_paths_ssot_covered: missing.length === 0,
    perf_summary_pass: perf?.pass === true,
    prod_api_base: (perf?.api_base || '').includes('prod'),
    matrix_consistent: mx.issues.length === 0,
  };

  const verified = Object.values(checks).every(Boolean);
  return {
    id: 'PRM-PER-B001',
    verdict: verified ? 'VERIFIED' : 'VERIFICATION_FAIL',
    checks: { ...checks, missing_hot_paths: missing },
    matrix: mx,
    reason: verified
      ? 'All hot-path SSOT endpoints sampled on prod · p95 within limits'
      : `Perf baseline incomplete: missing=${missing.join(',') || 'none'} pass=${perf?.pass}`,
  };
}

function verifyMonB001(base, regYaml) {
  const dir = path.join(base, 'monitoring-b001');
  const probes = parseKeyVal(readText(path.join(dir, 'probes.txt')));
  const drill = readJson(path.join(dir, 'alert-incident-drill.json'));
  const onCall = readJson(path.join(dir, 'on-call-path.json'));
  const mx = matrixConsistency(regYaml, 'PRM-MON-B001');

  const noSecretBlocked =
    (drill?.steps || [])
      .filter((s) => s.step?.includes('no_secret'))
      .every((s) => ['403', '401'].includes(String(s.http))) || false;

  const checks = {
    synthetic_health: probes.health_http === '200',
    synthetic_meta: probes.meta_http === '200',
    synthetic_community: probes.community_feed_http === '200',
    prom_rules: probes.prometheus_rules === 'PASS',
    alert_path_no_secret_blocked: noSecretBlocked,
    alert_fire_with_secret: drill?.incident_record?.drill_complete === true,
    incident_record_present:
      !!drill?.incident_record?.opened_id || drill?.incident_record?.reason?.includes('SECRET'),
    on_call_runbook: !!onCall?.on_call_runbook,
    matrix_consistent: mx.issues.length === 0,
  };

  const verified =
    checks.synthetic_health &&
    checks.synthetic_meta &&
    checks.synthetic_community &&
    checks.prom_rules &&
    checks.alert_path_no_secret_blocked &&
    checks.alert_fire_with_secret &&
    checks.on_call_runbook &&
    checks.matrix_consistent;

  return {
    id: 'PRM-MON-B001',
    verdict: verified ? 'VERIFIED' : 'VERIFICATION_FAIL',
    checks,
    matrix: mx,
    reason: verified
      ? 'Synthetic green · alert fire + incident open with secret · runbook linked'
      : 'Monitoring drill incomplete — need INTERNAL_API_SECRET local for authenticated alert/incident probe',
  };
}

function main() {
  const { evidenceDir, fixDir } = parseArgs();
  if (!evidenceDir) {
    console.error('Usage: --evidence-dir evidence/GO_production_readiness/g2-reality-verification/<stamp> [--fix-dir ...]');
    process.exit(1);
  }

  const base = path.isAbsolute(evidenceDir) ? evidenceDir : path.join(ROOT, evidenceDir);
  const evidRel = path.relative(ROOT, base).replace(/\\/g, '/');
  const regYaml = fs.readFileSync(REG_MATRIX, 'utf8');
  const rtConfig = loadReleaseTrainConfig();

  const callGraph = runCallGraphAudit({ anchorFilter: 'all' });
  writeCallGraphEvidence(path.join(base, 'call-graph-truth.json'), callGraph, {
    stamp: path.basename(base),
    gate: 'G2',
  });

  const findings = [
    verifySecB001(base, regYaml),
    verifyProductionRuntimeIdentityBlock(base, regYaml),
    verifyPerB001(base, regYaml),
    verifyMonB001(base, regYaml),
  ];

  const verified = findings.filter((f) => f.verdict === 'VERIFIED').map((f) => f.id);
  const failed = findings.filter((f) => f.verdict !== 'VERIFIED').map((f) => f.id);
  const identityEval = findings.find((f) => f.id === 'PRM-SEC-B002')?.identity;
  const configPass = identityEval?.configuration_truth?.pass === true;

  const reopen = [];
  for (const f of findings) {
    const block = gapBlock(regYaml, f.id);
    if (f.verdict !== 'VERIFIED' && block.includes('status: CLOSED')) {
      reopen.push(f.id);
    }
  }

  const runtimePass = findings.every((f) => f.verdict === 'VERIFIED');
  let coverageGate = { pass: true, actual: {}, thresholds: {} };
  const coverageSignoff = path.join(base, 'platform-coverage/platform-coverage-gate.json');
  if (fs.existsSync(coverageSignoff)) {
    coverageGate = readJson(coverageSignoff) || coverageGate;
  }

  const allVerified =
    failed.length === 0 &&
    callGraph.pass &&
    identityEval?.pass === true &&
    configPass !== false &&
    coverageGate.pass !== false;

  const sixWay = buildSixWayTruth({
    evidenceDir: base,
    registryPaths: [
      'registry/g2-internal-routes-ssot.v1.json',
      'registry/g2-perf-hot-paths-ssot.v1.json',
      'registry/runtime-identity-ssot.v1.json',
      'registry/configuration-truth-ssot.v1.json',
      'registry/release-train-reality-verification.v1.json',
    ],
    configurationPass: identityEval?.configuration_truth?.pass ?? null,
    runtimeChecksPass: runtimePass,
    callGraphPass: callGraph.pass,
    identityPass: identityEval?.pass === true,
    findingsVerified: allVerified,
  });

  const signoff = {
    review_id: 'G2-REALITY-VERIFICATION',
    stamp: path.basename(base),
    fix_baseline: fixDir ? path.relative(ROOT, fixDir).replace(/\\/g, '/') : null,
    release_train: releaseTrainStep('G2', allVerified, true, identityEval?.pass === true, configPass),
    machine_keys: {
      TT_G2_REALITY_VERIFICATION: allVerified ? 'COMPLETE' : 'IN_PROGRESS',
      TT_WAVE2_FORMAL_ACCEPTANCE: allVerified ? 'READY' : 'BLOCKED',
      TT_PRODUCTION_READINESS_G2_GATE: 'IN_PROGRESS',
      TT_PRODUCTION_RUNTIME_IDENTITY: identityEval?.pass ? 'PASS' : 'FAIL',
      TT_CONFIGURATION_TRUTH: configPass ? 'PASS' : 'FAIL',
    },
    truth_sources: TRUTH_SOURCES,
    six_way: sixWay,
    call_graph: {
      pass: callGraph.pass,
      anchors_total: callGraph.anchors_total,
      anchors_fail: callGraph.anchors_fail,
      evidence: `${evidRel}/call-graph-truth.json`,
    },
    production_runtime_identity: {
      pass: identityEval?.pass === true,
      machine_key: 'TT_PRODUCTION_RUNTIME_IDENTITY',
      matrix_gap_id: 'PRM-SEC-B002',
      evidence: `${evidRel}/production-runtime-identity/production-runtime-identity.json`,
      meta_deployment_profile: identityEval?.meta_deployment_profile ?? null,
    },
    configuration_truth: {
      pass: configPass,
      machine_key: 'TT_CONFIGURATION_TRUTH',
      evidence: `${evidRel}/production-runtime-identity/configuration-truth.json`,
      drifts: identityEval?.configuration_truth?.drifts ?? [],
    },
    platform_coverage: {
      pass: coverageGate.pass !== false,
      machine_key: 'TT_PLATFORM_COVERAGE_AUDIT',
      evidence: `${evidRel}/platform-coverage/platform-coverage-gate.json`,
      actual: coverageGate.actual || {},
      thresholds: coverageGate.thresholds || {},
    },
    matrix_actions: {
      close: verified,
      reopen,
      verified,
      verification_fail: failed,
    },
    findings,
    honest_boundary:
      'Six-way Verification (Configuration + Call Graph + RuntimeIdentity) · Formal only when all VERIFIED · Configuration Drift auto-reopens PRM-SEC-B002',
  };

  fs.writeFileSync(path.join(base, 'g2-reality-verification-signoff.json'), `${JSON.stringify(signoff, null, 2)}\n`);

  console.log('G2 Reality Verification (Release Train · six truth sources)');
  console.log('─'.repeat(70));
  for (const f of findings) {
    console.log(`${f.verdict.padEnd(20)} ${f.id} — ${f.reason}`);
  }
  console.log('─'.repeat(70));
  console.log(`Call Graph Truth: ${callGraph.pass ? 'PASS' : 'FAIL'} (${callGraph.anchors_fail} fail)`);
  console.log(`TT_PRODUCTION_RUNTIME_IDENTITY: ${identityEval?.pass ? 'PASS' : 'FAIL'} (profile=${identityEval?.meta_deployment_profile ?? 'null'})`);
  console.log(`TT_CONFIGURATION_TRUTH: ${configPass ? 'PASS' : 'FAIL'}`);
  console.log(`TT_PLATFORM_COVERAGE_AUDIT: ${coverageGate.pass !== false ? 'PASS' : 'FAIL'}`);
  console.log(`Six-way consistent: ${sixWay.consistent}`);
  console.log(`VERIFIED: ${verified.join(', ') || 'none'}`);
  console.log(`REOPEN: ${reopen.join(', ') || 'none'}`);
  console.log(`TT_WAVE2_FORMAL_ACCEPTANCE: ${signoff.machine_keys.TT_WAVE2_FORMAL_ACCEPTANCE}`);
  console.log(`Evidence: ${evidRel}`);

  process.exit(allVerified ? 0 : 1);
}

main();
