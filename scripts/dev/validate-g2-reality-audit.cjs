#!/usr/bin/env node
/**
 * G2 Reality Audit — re-validate Master Matrix G2 blockers vs code, runtime, evidence.
 * Sources of truth: code · runtime probes · committed evidence only (not stale docs/matrix claims).
 *
 *   node scripts/dev/validate-g2-reality-audit.cjs [--evidence-dir DIR]
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { RuntimeIdentity } = require('./lib/runtime-identity.cjs');

const ROOT = path.join(__dirname, '../..');
const REG_PATH = path.join(ROOT, 'registry/production-readiness-master-matrix.v1.yaml');
const STAGING_API = (process.env.STAGING_API_BASE || 'https://tt-api-staging.fly.dev').replace(/\/$/, '');

const G2_BLOCKERS = ['PRM-SEC-B001', 'PRM-SEC-B002', 'PRM-PER-B001', 'PRM-MON-B001'];

function read(rel) {
  const p = path.isAbsolute(rel) ? rel : path.join(ROOT, rel);
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null;
}

function exists(rel) {
  return fs.existsSync(path.join(ROOT, rel));
}

function gapBlock(reg, id) {
  const marker = `  - id: ${id}`;
  const start = reg.indexOf(marker);
  if (start < 0) return '';
  const tail = reg.slice(start + marker.length);
  const nextRel = tail.search(/\r?\n  - id: PRM-/);
  const end = nextRel >= 0 ? start + marker.length + nextRel : reg.length;
  return reg.slice(start, end);
}

function gapStatus(reg, id) {
  const block = gapBlock(reg, id);
  const m = block.match(/    status: ([A-Z_]+)/);
  return m ? m[1] : null;
}

function curlJson(url, opts = {}) {
  try {
    const method = opts.method || 'GET';
    const extra = opts.method === 'POST' ? '-X POST' : '';
    const out = execSync(`curl -sS --max-time ${opts.timeout || 20} ${extra} "${url}"`, {
      stdio: 'pipe',
      encoding: 'utf8',
    });
    return JSON.parse(out);
  } catch {
    return null;
  }
}

function curlStatus(url, opts = {}) {
  try {
    const method = opts.method || 'GET';
    const extra = opts.method === 'POST' ? '-X POST' : '';
    const code = execSync(
      `curl -sS -o /dev/null -w "%{http_code}" --max-time ${opts.timeout || 15} ${extra} "${url}"`,
      { stdio: 'pipe', encoding: 'utf8' }
    ).trim();
    return code;
  } catch {
    return '000';
  }
}

function implementationChecks() {
  const router = read('crates/api/src/router.rs') || '';
  const auth = read('crates/api/src/routes/auth.rs') || '';
  const middleware = read('crates/api/src/middleware/auth_pause_metrics/mod.rs') || '';
  const market = read('crates/api/src/chain_off/market_public_surface.rs') || '';
  const prodExample = read('scripts/dev/.env.production.example') || '';
  return {
    internal_api_gate_in_router: router.includes('internal_api_secret_gate_layer'),
    seed_route_guard: auth.includes('seed_test_accounts_disabled'),
    seed_demo_profile_gates:
      market.includes('RuntimeIdentity::current') || market.includes('runtime_identity::'),
    prod_seed_policy_doc: prodExample.includes('SEED_TEST_ACCOUNTS=0') && prodExample.includes('INTERNAL_API_SECRET'),
    internal_gate_layer: middleware.includes('internal_api_secret_gate_layer'),
    prometheus_rules_script: exists('scripts/gates/check-ops-monitoring-prometheus-examples.sh'),
    c8_monitoring_smoke: exists('scripts/dev/smoke-community-c8-staging-monitoring.sh'),
    runtime_identity_guard: exists('scripts/dev/lib/runtime-identity.cjs'),
    production_identity_guard: exists('scripts/dev/lib/production-runtime-identity-guard.cjs'),
    go_audit_evidence: exists(
      'evidence/GO_phase2_testnet_20260526/phase3-production-prep/go-audit-20260607T073403Z/audit.log'
    ),
    c8_evidence_dir: exists('evidence/GO_phase2_testnet_20260526/community/C8/monitoring-check.log'),
    prod_fly_manifest: exists('deploy/fly/tt-api-prod/fly.toml'),
    runtime_identity_resolver: typeof RuntimeIdentity.current === 'function',
    cutover_runbook: exists('docs/runbook/PRODUCTION-CUTOVER-RUNBOOK-SEPOLIA-SCOPE.md'),
  };
}

function stagingRuntimeProbe() {
  const build = curlJson(`${STAGING_API}/meta/build`);
  const meta = curlJson(`${STAGING_API}/meta`);
  const internalNoSecret = curlStatus(`${STAGING_API}/api/v1/internal/indexer-tick`, {
    method: 'POST',
  });
  const seedWhenDisabled = curlStatus(`${STAGING_API}/auth/seed-test-accounts`, { method: 'POST' });
  const sm = meta?.strict_mode || {};
  return {
    api_reachable: !!build,
    deployment_profile: build?.deployment_profile || null,
    git_sha: build?.git_sha || null,
    internal_api_secret_configured: sm.internal_api_secret_configured === true,
    internal_route_without_secret_http: internalNoSecret,
    seed_endpoint_http: seedWhenDisabled,
    probed_utc: new Date().toISOString(),
  };
}

function main() {
  const args = process.argv.slice(2);
  const evidIdx = args.indexOf('--evidence-dir');
  const EVID_DIR =
    evidIdx >= 0 && args[evidIdx + 1]
      ? path.isAbsolute(args[evidIdx + 1])
        ? args[evidIdx + 1]
        : path.join(ROOT, args[evidIdx + 1])
      : path.join(
          ROOT,
          'evidence/GO_production_readiness/g2-reality-audit',
          process.env.AUDIT_STAMP || new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, 'Z')
        );

  const reg = read('registry/production-readiness-master-matrix.v1.yaml') || '';
  const impl = implementationChecks();
  const staging = stagingRuntimeProbe();
  const findings = [];

  // PRM-SEC-B001
  const secB001Impl =
    impl.internal_api_gate_in_router &&
    impl.internal_gate_layer &&
    impl.prod_seed_policy_doc &&
    impl.prod_fly_manifest;
  const secB001StagingRuntime =
    staging.api_reachable &&
    staging.internal_api_secret_configured &&
    staging.internal_route_without_secret_http === '403';
  findings.push({
    id: 'PRM-SEC-B001',
    verdict: 'STILL_BLOCKS',
    matrix_status_before: gapStatus(reg, 'PRM-SEC-B001'),
    implementation: secB001Impl ? 'SATISFIED' : 'GAP',
    runtime_staging: secB001StagingRuntime ? 'VERIFIED' : 'UNVERIFIED',
    prod_cutover: 'NOT_VERIFIED',
    reason:
      'Internal API gate implemented + staging runtime 403 without secret · prod Fly secrets / prod-base hygiene audit not re-run in this review',
    action: 'Wave 2: fly secrets parity + POST /internal/* 403 on prod base · evidence in g2 wave package',
    evidence: [
      'crates/api/src/router.rs',
      'crates/api/src/middleware/auth_pause_metrics/mod.rs',
      'deploy/fly/tt-api-prod/fly.toml',
      'scripts/dev/run-phase3-production-go-audit.sh',
    ],
  });

  // PRM-SEC-B002
  const secB002Policy =
    impl.seed_route_guard &&
    impl.seed_demo_profile_gates &&
    impl.prod_seed_policy_doc &&
    impl.cutover_runbook;
  findings.push({
    id: 'PRM-SEC-B002',
    verdict: 'STILL_BLOCKS',
    matrix_status_before: gapStatus(reg, 'PRM-SEC-B002'),
    implementation: secB002Policy ? 'SATISFIED' : 'GAP',
    runtime_staging:
      staging.deployment_profile === 'staging'
        ? 'EXPECTED_SEED_ENABLED_②'
        : staging.api_reachable
          ? 'PROBE_ONLY'
          : 'UNVERIFIED',
    prod_cutover: 'NOT_VERIFIED',
    reason:
      'Prod seed policy documented + code gates exist · staging seed ON is expected ② · prod SEED=0 fly audit not verified here',
    action: 'Wave 2: verify tt-api-prod SEED_TEST_ACCOUNTS=0 + POST /auth/seed-test-accounts → 403 on prod',
    evidence: [
      'scripts/dev/.env.production.example',
      'crates/api/src/routes/auth.rs',
      'crates/api/src/chain_off/market_public_surface.rs',
      'docs/runbook/PRODUCTION-CUTOVER-RUNBOOK-SEPOLIA-SCOPE.md',
    ],
  });

  // PRM-PER-B001 — matrix drift: falsely CLOSED without evidence
  const perMatrixStatus = gapStatus(reg, 'PRM-PER-B001');
  const perBlock = gapBlock(reg, 'PRM-PER-B001');
  const hasClosedEvidence = /closed_evidence:\s*\S/.test(perBlock);
  const falselyClosed = perMatrixStatus === 'CLOSED' && !hasClosedEvidence;
  findings.push({
    id: 'PRM-PER-B001',
    verdict: falselyClosed ? 'REOPEN' : 'STILL_BLOCKS',
    matrix_status_before: perMatrixStatus,
    implementation: 'NOT_SATISFIED',
    runtime_staging: 'N/A',
    prod_cutover: 'NOT_VERIFIED',
    reason: falselyClosed
        ? 'Matrix falsely CLOSED without closed_evidence · no prod perf/SLO artifact in repo'
        : 'No production-environment performance / SLO evidence committed',
    action: 'Wave 2: prod load smoke or documented SLO baseline on prod bases · commit evidence',
    evidence: ['docs/runbook/FINAL-SYSTEM-AUDIT-REPORT.md', 'docs/runbook/PRODUCTION-READINESS-REPORT.md'],
  });

  // PRM-MON-B001
  const monImpl = impl.c8_monitoring_smoke && impl.prometheus_rules_script && impl.c8_evidence_dir;
  findings.push({
    id: 'PRM-MON-B001',
    verdict: 'STILL_BLOCKS',
    matrix_status_before: gapStatus(reg, 'PRM-MON-B001'),
    implementation: monImpl ? 'PARTIAL_②' : 'GAP',
    runtime_staging: impl.c8_evidence_dir ? 'C8_EVIDENCE_IN_REPO' : 'MISSING',
    prod_cutover: 'NOT_VERIFIED',
    reason:
      '② C8 staging monitoring smoke + prometheus rules script exist · ≠ prod synthetic probes / on-call cutover verified',
    action: 'Wave 2: prod synthetic monitoring green + on-call path evidence · not reuse C8 alone',
    evidence: [
      'evidence/GO_phase2_testnet_20260526/community/C8/',
      'scripts/dev/smoke-community-c8-staging-monitoring.sh',
      'scripts/gates/check-ops-monitoring-prometheus-examples.sh',
    ],
  });

  const toClose = findings.filter((f) => f.verdict === 'CLOSE').map((f) => f.id);
  const toReopen = findings.filter((f) => f.verdict === 'REOPEN').map((f) => f.id);
  const stillBlocks = findings.filter((f) => f.verdict === 'STILL_BLOCKS').map((f) => f.id);

  fs.mkdirSync(EVID_DIR, { recursive: true });
  const signoff = {
    review_id: 'G2-REALITY-AUDIT-20260704',
    stamp: path.basename(EVID_DIR),
    machine_keys: {
      TT_G2_REALITY_AUDIT: 'COMPLETE',
      TT_PRODUCTION_READINESS_G2_GATE: 'IN_PROGRESS',
      TT_PRODUCTION_GO: 'NO_GO',
    },
    g1_prerequisite: {
      TT_PRODUCTION_READINESS_G1_GATE: reg.match(/TT_PRODUCTION_READINESS_G1_GATE: (\w+)/)?.[1] || 'UNKNOWN',
      session: 'evidence/manual-uat/sessions/20260704T012909Z',
    },
    implementation_checks: impl,
    staging_runtime_probe: staging,
    matrix_actions: { close: toClose, reopen: toReopen, remain_open: stillBlocks },
    findings,
    release_train: {
      route: 'B — G1 PASS → G2 → G3',
      g2_blockers_total: G2_BLOCKERS.length,
      auto_closed: toClose.length,
      reopened: toReopen.length,
      remain_open: stillBlocks.length,
    },
    honest_boundary:
      'G2 Reality Audit closes only false/stale blockers · ② staging evidence ≠ ③ prod cutover · G2 PASS still requires Wave 2 formal acceptance',
  };

  fs.writeFileSync(path.join(EVID_DIR, 'g2-reality-audit-signoff.json'), `${JSON.stringify(signoff, null, 2)}\n`);

  console.log('G2 Reality Audit');
  console.log('─'.repeat(70));
  for (const f of findings) {
    console.log(`${f.verdict.padEnd(16)} ${f.id} — ${f.reason.slice(0, 90)}…`);
  }
  console.log('─'.repeat(70));
  console.log(`Close: ${toClose.join(', ') || 'none'}`);
  console.log(`Reopen: ${toReopen.join(', ') || 'none'}`);
  console.log(`Remain OPEN: ${stillBlocks.join(', ')}`);
  console.log(`Staging internal 403: ${staging.internal_route_without_secret_http}`);
  console.log(`Evidence: ${path.relative(ROOT, EVID_DIR)}`);
}

main();
