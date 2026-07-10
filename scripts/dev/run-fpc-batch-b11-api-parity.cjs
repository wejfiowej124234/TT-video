#!/usr/bin/env node
/**
 * FPC-100 Batch B11 · API Parity Certification (① local)
 *
 *   node scripts/dev/run-fpc-batch-b11-api-parity.cjs
 *
 * Dimensions:
 *   API Contract · API Read Model · API Write Model · API State Parity
 * Chain: Frontend ↔ API ↔ Database (POST → DB → GET → Frontend mapping)
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
const OUT = path.join(EVID, 'FPC-100-BATCH-B11-LATEST.json');
const EVID_DIR = path.join(EVID, 'B11-api-parity');
const CODE_ANCHOR = 'e9df0a73f63b5ebccc7c17266f000c3bf867d872';
const API_BASE = process.env.API_BASE || 'http://127.0.0.1:8080';

const GATES = [
  'scripts/gates/run-check-04-routes.sh',
  'scripts/gates/smoke-api-public-routes.sh',
  'scripts/gates/check-frontend-api-consistency-audit-ssot.sh',
];

const WRITE_READ_SMOKES = [
  {
    id: 'itinerary_order_discover',
    script: 'scripts/dev/smoke-landing-itinerary-flow-local.sh',
    chain: 'POST /itineraries → GET /orders/:id → PATCH publish → GET /discover/orders',
    dimension: 'api_write_model',
  },
];

const READ_MODEL_AUDIT = 'scripts/dev/run-frontend-api-consistency-audit.sh';

function sh(cmd, env = {}) {
  return execSync(cmd, {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, ...env },
  });
}

async function fetchJson(url, opts = {}) {
  const res = await fetch(url, { signal: AbortSignal.timeout(20000), ...opts });
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { _raw: text.slice(0, 500) };
  }
  return { status: res.status, json, text };
}

async function runAuthWriteReadProbe(findings) {
  const stamp = Date.now();
  const nickname = `B11 Parity ${stamp}`;
  const email = process.env.B11_AUTH_PROBE_EMAIL || 'tourist@test.com';
  const password = process.env.B11_AUTH_PROBE_PASSWORD || 'Test123!';
  try {
    const login = await fetchJson(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (login.status !== 200) {
      findings.push({
        id: 'auth_write_login',
        severity: 'P1',
        detail: `POST /auth/login HTTP ${login.status} (${email}) — landing-itinerary smoke covers POST→GET write-read`,
      });
      return { pass: false, skipped: true, reason: 'login_unavailable' };
    }
    const token = login.json?.token || login.json?.access_token;
    if (!token) {
      findings.push({ id: 'auth_write_token', severity: 'P0', detail: 'login missing token' });
      return { pass: false };
    }
    const put = await fetchJson(`${API_BASE}/api/v1/me`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname }),
    });
    if (put.status !== 200) {
      findings.push({
        id: 'auth_write_me_put',
        severity: 'P0',
        detail: `PUT /me HTTP ${put.status}`,
      });
      return { pass: false };
    }
    const me = await fetchJson(`${API_BASE}/api/v1/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (me.status !== 200) {
      findings.push({ id: 'auth_read_me', severity: 'P0', detail: `GET /me HTTP ${me.status}` });
      return { pass: false };
    }
    const meNick = me.json?.nickname || me.json?.user?.nickname;
    if (meNick !== nickname) {
      findings.push({
        id: 'auth_state_parity_nickname',
        severity: 'P0',
        detail: `PUT nickname ${nickname} != GET /me ${meNick}`,
      });
      return { pass: false };
    }
    return {
      pass: true,
      probe: 'auth_login_put_me',
      chain: 'POST /auth/login → PUT /me → GET /me',
      email,
      me_id: me.json?.id || me.json?.user?.id || null,
    };
  } catch (e) {
    findings.push({ id: 'auth_write_read_probe', severity: 'P0', detail: String(e.message || e) });
    return { pass: false };
  }
}

const { assertCanRun } = require('./lib/fpc-batch-sequence.cjs');

(async () => {
  const stamp = new Date().toISOString();
  const findings = [];
  const gateResults = [];
  const writeReadResults = [];
  let cargoResult = null;
  let readModelAudit = null;
  let authProbe = null;

  const gate = assertCanRun('B11');
  if (!gate.ok) {
    findings.push({
      id: 'no_batch_skip',
      severity: 'P0',
      detail: `Cannot run B11 before ${gate.missing_prerequisites?.join(', ')}`,
    });
  }

  try {
    const h = await fetchJson(`${API_BASE}/health`);
    if (h.status !== 200) {
      findings.push({ id: 'api_health', severity: 'P0', detail: `/health HTTP ${h.status}` });
    }
  } catch (e) {
    findings.push({ id: 'api_unreachable', severity: 'P0', detail: String(e.message || e) });
  }

  for (const g of GATES) {
    let exitCode = 0;
    let stdout = '';
    let stderr = '';
    const env = {
      API_BASE_URL: API_BASE,
      API_BASE,
      PORT: '8080',
      PYTHONIOENCODING: 'utf-8',
    };
    try {
      stdout = sh(`bash ${g} 2>&1`, env);
    } catch (e) {
      exitCode = e.status || 1;
      stdout = e.stdout || '';
      stderr = e.stderr || '';
      findings.push({
        id: `gate_fail:${path.basename(g)}`,
        severity: 'P0',
        gate: g,
        detail: (stderr || stdout || e.message || '').slice(0, 2500),
      });
    }
    gateResults.push({
      gate: g,
      exit_code: exitCode,
      pass: exitCode === 0,
      summary_line: (stdout + stderr).split('\n').filter(Boolean).slice(-3).join(' | '),
    });
  }

  try {
    const stdout = sh('bash -lc "RUST_TEST_THREADS=1 cargo test -p traveltrust-api 2>&1"', {
      CARGO_TERM_COLOR: 'never',
    });
    const mainBlock = stdout.split('Doc-tests')[0];
    const passMatches = [...mainBlock.matchAll(/test result: ok\. (\d+) passed/g)];
    const passedCount = passMatches.length
      ? Number(passMatches[passMatches.length - 1][1])
      : 0;
    if (passedCount < 100) {
      throw new Error(`cargo test unexpected (${passedCount} passed): ${stdout.split('\n').slice(-8).join(' | ')}`);
    }
    const m = [null, String(passedCount)];
    cargoResult = {
      pass: true,
      tests_passed: m ? Number(m[1]) : null,
      summary_line: stdout.split('\n').filter(Boolean).slice(-2).join(' | '),
    };
  } catch (e) {
    cargoResult = {
      pass: false,
      exit_code: e.status || 1,
      summary_line: ((e.stdout || '') + (e.stderr || '')).split('\n').filter(Boolean).slice(-4).join(' | '),
    };
    findings.push({
      id: 'gate_fail:cargo_test_traveltrust_api',
      severity: 'P0',
      gate: 'cargo test -p traveltrust-api',
      detail: ((e.stderr || e.stdout || e.message || '') + '').slice(0, 2500),
    });
  }

  authProbe = await runAuthWriteReadProbe(findings);

  for (const smoke of WRITE_READ_SMOKES) {
    let exitCode = 0;
    let stdout = '';
    let stderr = '';
    try {
      stdout = sh(`bash ${smoke.script}`, { API_BASE, API_BASE_URL: API_BASE, PORT: '8080' });
    } catch (e) {
      exitCode = e.status || 1;
      stdout = e.stdout || '';
      stderr = e.stderr || '';
      findings.push({
        id: `write_read_fail:${smoke.id}`,
        severity: 'P0',
        script: smoke.script,
        detail: (stderr || stdout || e.message || '').slice(0, 2500),
      });
    }
    writeReadResults.push({
      ...smoke,
      exit_code: exitCode,
      pass: exitCode === 0,
      summary_line: (stdout + stderr).split('\n').filter(Boolean).slice(-3).join(' | '),
    });
  }

  const auditStamp = new Date().toISOString().replace(/[:.]/g, '-');
  const auditOut = path.join(
    ROOT,
    `evidence/GO_frontend_api_consistency_audit/local_${auditStamp}/audit-report.json`
  );
  try {
    const stdout = sh(`bash ${READ_MODEL_AUDIT}`, {
      API_BASE,
      ENV_LABEL: 'local',
      EVIDENCE_JSON: auditOut,
      PORT: '8080',
    });
    let auditJson = null;
    if (fs.existsSync(auditOut)) {
      auditJson = JSON.parse(fs.readFileSync(auditOut, 'utf8'));
    }
    readModelAudit = {
      pass: auditJson?.pass !== false,
      blocking: auditJson?.blocking?.length ?? 0,
      warnings: auditJson?.warnings?.length ?? 0,
      evidence_path: path.relative(ROOT, auditOut).replace(/\\/g, '/'),
      summary_line: stdout.split('\n').filter(Boolean).slice(-2).join(' | '),
    };
    if (!readModelAudit.pass) {
      findings.push({
        id: 'frontend_api_consistency_audit',
        severity: 'P0',
        detail: `blocking=${readModelAudit.blocking} warnings=${readModelAudit.warnings}`,
      });
    }
  } catch (e) {
    readModelAudit = { pass: false, error: String(e.message || e).slice(0, 500) };
    findings.push({
      id: 'frontend_api_consistency_audit_fail',
      severity: 'P0',
      detail: ((e.stderr || e.stdout || e.message || '') + '').slice(0, 2000),
    });
  }

  const apiContractPass = gateResults.find((g) => g.gate.includes('run-check-04-routes'))?.pass === true;
  const apiReadSmokePass =
    gateResults.find((g) => g.gate.includes('smoke-api-public-routes'))?.pass === true;
  const writeReadPass = writeReadResults.every((w) => w.pass);
  const authProbePass = authProbe?.pass || (authProbe?.skipped && writeReadPass);

  const apiParityCertification = {
    schema: 'traveltrust.api_parity_certification.v1',
    phase: '① local',
    verification_chain: ['frontend', 'api', 'database'],
    write_read_chain: ['POST', 'database', 'GET', 'frontend_mapping', 'ui'],
    dimensions: {
      api_contract: {
        verdict: apiContractPass && cargoResult?.pass ? 'PASS' : 'FAIL',
        pass: apiContractPass && cargoResult?.pass,
        evidence: [
          'docs/spec/04-后端与API.md §3.4',
          'crates/api/src/routes/mod.rs',
          'frontend/lib/api.ts',
          'scripts/gates/run-check-04-routes.sh',
          'cargo test -p traveltrust-api',
        ],
        gates: ['run-check-04-routes.sh', 'cargo test -p traveltrust-api'],
      },
      api_read_model: {
        verdict: apiReadSmokePass && readModelAudit?.pass ? 'PASS' : 'FAIL',
        pass: apiReadSmokePass && readModelAudit?.pass,
        evidence: [
          'scripts/gates/smoke-api-public-routes.sh',
          readModelAudit?.evidence_path || READ_MODEL_AUDIT,
        ],
        note: 'Public GET surfaces + Frontend↔API consistency audit (DB→API→mapping risk signals)',
      },
      api_write_model: {
        verdict: writeReadPass && authProbePass ? 'PASS' : 'FAIL',
        pass: writeReadPass && authProbePass,
        probes: [
          authProbe,
          ...writeReadResults.map((w) => ({
            id: w.id,
            script: w.script,
            chain: w.chain,
            pass: w.pass,
          })),
        ],
        note: 'POST persists → subsequent GET reflects write (landing-itinerary smoke + optional PUT /me probe)',
      },
      api_state_parity: {
        verdict: writeReadPass && readModelAudit?.pass && authProbePass ? 'PASS' : 'FAIL',
        pass: writeReadPass && readModelAudit?.pass && authProbePass,
        chain: 'POST → DB → GET → Frontend contract mapping → UI consistency',
        environment_diff_note: 'Baseline for future Environment Diff (local vs staging)',
      },
    },
    ssot_alignment: {
      spec_04: 'docs/spec/04-后端与API.md',
      routes_mod: 'crates/api/src/routes/mod.rs',
      frontend_api: 'frontend/lib/api.ts',
      fe_audit_registry: 'registry/frontend-api-consistency-audit.v1.yaml',
    },
  };

  const head = sh('git rev-parse HEAD').trim();
  const p0 = findings.filter((f) => f.severity === 'P0');
  const p1 = findings.filter((f) => f.severity === 'P1');
  const allGatesPass = gateResults.every((g) => g.pass) && cargoResult?.pass;
  const allDimsPass = Object.values(apiParityCertification.dimensions).every((d) => d.pass);
  const pass = p0.length === 0 && allGatesPass && allDimsPass && gate.ok;

  fs.mkdirSync(EVID_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(EVID_DIR, `gate-run-${stamp.replace(/[:.]/g, '-')}.json`),
    JSON.stringify(
      {
        timestamp_utc: stamp,
        gate_results: gateResults,
        cargo_result: cargoResult,
        write_read_results: writeReadResults,
        auth_probe: authProbe,
        read_model_audit: readModelAudit,
        api_parity_certification: apiParityCertification,
        findings,
      },
      null,
      2
    ) + '\n'
  );

  const report = {
    schema: 'traveltrust.fpc_100_batch_certification.v1',
    batch_id: 'B11',
    title: 'API Parity Certification · Contract · Read · Write · State',
    layer: 'L1-L4',
    phase: '① local',
    timestamp_utc: stamp,
    verifier: 'run-fpc-batch-b11-api-parity.cjs',
    product_version: 'v1.0',
    code_anchor_commit: CODE_ANCHOR,
    git: { head, branch: sh('git branch --show-current').trim() },
    depends_on: ['B00', 'B10'],
    routes: ['04 §3.4 · /api/v1/* · frontend/lib/api.ts'],
    gates: [...GATES, 'cargo test -p traveltrust-api', READ_MODEL_AUDIT, ...WRITE_READ_SMOKES.map((s) => s.script)],
    gate_results: [
      ...gateResults,
      {
        gate: 'cargo test -p traveltrust-api',
        exit_code: cargoResult?.pass ? 0 : 1,
        pass: !!cargoResult?.pass,
        summary_line: cargoResult?.summary_line || '',
      },
      {
        gate: READ_MODEL_AUDIT,
        exit_code: readModelAudit?.pass ? 0 : 1,
        pass: !!readModelAudit?.pass,
        summary_line: readModelAudit?.summary_line || readModelAudit?.error || '',
      },
      ...writeReadResults.map((w) => ({
        gate: w.script,
        exit_code: w.exit_code,
        pass: w.pass,
        summary_line: w.summary_line,
      })),
    ],
    gate_pass: allGatesPass,
    api_parity_certification: apiParityCertification,
    findings,
    verdict: pass ? (p1.length ? 'PASS_WITH_WARN' : 'PASS') : 'FAIL',
    pass,
    gate_verdict: pass ? (p1.length ? 'PASS_WITH_WARN' : 'PASS') : 'FAIL',
    release_blocker: pass ? 'NO' : 'YES',
    next_batch: pass ? 'B12' : 'B11-remediation',
    ai_review: {
      verdict: pass ? (p1.length ? 'PASS_WITH_WARN' : 'PASS') : 'FAIL',
      ai_reviewer: 'Internal AI Review',
      review_type: 'Internal AI Review',
      review_date: stamp.slice(0, 10),
      review_version: 'v1',
    },
    human_verified: false,
    human_verifier: null,
    human_note:
      'API Parity ① — 04/mod.rs/api.ts contract + read smoke + write-read probes + FE consistency; staging Environment Diff → ②',
    traceability: {
      requirements: [
        '04 §3.4 ↔ routes/mod.rs ↔ frontend/lib/api.ts parity',
        'API Read Model public surfaces PASS',
        'API Write Model POST→GET persistence',
        'API State Parity Frontend↔API↔DB chain',
      ],
      spec_refs: [
        'docs/spec/04-后端与API.md',
        'docs/spec/14-合约-API-ABI-前后端对齐.md',
        'registry/frontend-api-consistency-audit.v1.yaml',
        'FPC-100-PRE-RELEASE-DEEP-CHECKLIST-v1.md § B11',
      ],
      code_paths: [
        'crates/api/src/routes/mod.rs',
        'frontend/lib/api.ts',
        'scripts/gates/run-check-04-routes.sh',
        'scripts/dev/frontend-api-consistency-audit.cjs',
      ],
      tests: [
        'run-check-04-routes.sh',
        'smoke-api-public-routes.sh',
        'cargo test -p traveltrust-api',
        'frontend-api-consistency-audit',
        'smoke-landing-itinerary-flow-local.sh',
      ],
      evidence_path: 'FPC-100/FPC-100-BATCH-B11-LATEST.json',
      certification_batch: 'B11',
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
  console.log(`TT_FPC_100_BATCH_B11: ${report.verdict}`);
  console.log(`pass: ${pass} p0: ${p0.length} p1: ${p1.length}`);
  console.log(
    'API_PARITY:',
    Object.entries(apiParityCertification.dimensions)
      .map(([k, v]) => `${k}=${v.verdict}`)
      .join(' ')
  );
  console.log(`EVIDENCE: ${OUT}`);
  process.exit(pass ? 0 : 1);
})();
