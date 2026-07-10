/**
 * FPC B24 · R-002 / 93 matrix regression probes (① local)
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function loadChecklist(checklistPath) {
  return JSON.parse(fs.readFileSync(checklistPath, 'utf8'));
}

function sh(cmd, cwd, env = {}) {
  return execSync(cmd, {
    cwd,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, ...env },
    timeout: env.FPC_GATE_TIMEOUT_MS ? Number(env.FPC_GATE_TIMEOUT_MS) : 600_000,
  });
}

function extractAnchorsFromGenR002(root) {
  const py = fs.readFileSync(path.join(root, 'scripts/gen-r002-iss007-prereport.py'), 'utf8');
  const filters = [];
  const re = /"matrix_93_cargo_filter":\s*\(\s*\n\s*"([^"]+)"/g;
  let m;
  while ((m = re.exec(py)) !== null) filters.push(m[1]);
  return filters;
}

function cargoListsFilter(root, filter) {
  try {
    const out = sh(`cargo test -p traveltrust-api -- --list ${filter}`, root, {
      FPC_GATE_TIMEOUT_MS: '180000',
    });
    return out.includes(filter);
  } catch {
    return false;
  }
}

function runMatrixWiringChecks(root, checklist, findings) {
  const checks = [];
  const routesMod = fs.readFileSync(path.join(root, 'crates/api/src/routes/mod.rs'), 'utf8');
  const ordersMod = fs.readFileSync(
    path.join(root, 'crates/api/src/routes/orders/tests/mod.rs'),
    'utf8'
  );
  const communityMod = fs.readFileSync(
    path.join(root, 'crates/api/src/routes/community/mod.rs'),
    'utf8'
  );
  const mainRs = fs.readFileSync(path.join(root, 'crates/api/src/main.rs'), 'utf8');

  for (const rel of checklist.required_test_mod_paths || []) {
    const needle = rel.replace(/\\/g, '/');
    const inRoutes = routesMod.includes(needle);
    const inOrders = ordersMod.includes(needle);
    const inCommunity = communityMod.includes(needle);
    const wired = inRoutes || inOrders || inCommunity;
    if (!wired) {
      findings.push({
        id: `unwired_test_mod:${rel}`,
        severity: 'P0',
        detail: `${rel} not #[path] wired in routes/orders/community mod.rs`,
      });
    }
    checks.push({
      id: `wiring:${path.basename(rel, '/mod.rs')}`,
      domain: 'routes_test_module_wiring',
      pass: wired,
      path: rel,
    });
  }

  const idemOk = mainRs.includes('mod idempotency_http_contract_tests');
  if (!idemOk) {
    findings.push({
      id: 'unwired_idempotency_http_contract_tests',
      severity: 'P1',
      detail: 'B-IDM-001 anchor module missing from main.rs',
    });
  }
  checks.push({
    id: 'wiring:idempotency_http_contract',
    domain: 'routes_test_module_wiring',
    pass: idemOk,
  });

  return checks;
}

function runAnchorCargoParity(root, checklist, findings) {
  const filters = extractAnchorsFromGenR002(root);
  const checks = [];
  let missing = 0;
  for (const f of filters) {
    const listed = cargoListsFilter(root, f);
    if (!listed) {
      missing += 1;
      findings.push({
        id: `anchor_not_in_cargo_list:${f.slice(0, 48)}`,
        severity: 'P0',
        detail: `cargo test --list missing filter ${f}`,
      });
    }
    checks.push({
      id: `cargo_list:${f.slice(0, 40)}`,
      domain: 'matrix_93_cargo_filter_ssot',
      pass: listed,
      filter: f,
    });
  }
  const countOk = filters.length === (checklist.anchor_count || 43);
  if (!countOk) {
    findings.push({
      id: 'anchor_count_drift',
      severity: 'P1',
      detail: `gen-r002 filters=${filters.length} checklist=${checklist.anchor_count}`,
    });
  }
  checks.push({
    id: 'gen_r002_anchor_count',
    domain: 'gen_r002_anchor_parity',
    pass: countOk && missing === 0,
    expected: checklist.anchor_count,
    parsed: filters.length,
    missing_list: missing,
  });
  return checks;
}

function runReportGateSemantics(root, checklist, findings) {
  const rel = checklist.report_json_ssot || 'evidence/GO_local_r002_verify/r002_iss007_prereport/report.json';
  const abs = path.join(root, rel);
  const checks = [];
  if (!fs.existsSync(abs)) {
    findings.push({ id: 'report_json_missing', severity: 'P0', detail: rel });
    return [{ id: 'r002_report_present', domain: 'r002_report_release_gate', pass: false }];
  }
  const report = JSON.parse(fs.readFileSync(abs, 'utf8'));
  const gate = report.release_gate || report.summary?.release_gate;
  const reason = report.release_gate_reason || report.summary?.release_gate_reason || '';
  const summary = report.summary || {};
  const passN = summary.PASS ?? summary.pass ?? 0;
  const failN = summary.FAIL ?? summary.fail ?? 0;
  const notRun = summary.NOT_RUN ?? summary.not_run ?? 0;

  const allowed = checklist.false_go_policy?.allowed_release_gates || ['PARTIAL_GO', 'GO'];
  const gateOk = allowed.includes(gate) && gate !== 'NO_GO';
  if (!gateOk) {
    findings.push({
      id: 'release_gate_no_go',
      severity: 'P0',
      detail: `release_gate=${gate} summary=${JSON.stringify(summary)}`,
    });
  }
  if (!reason || String(reason).trim().length < 8) {
    findings.push({
      id: 'release_gate_reason_missing',
      severity: 'P1',
      detail: 'report.json missing release_gate_reason',
    });
  }
  if (failN > 0) {
    findings.push({
      id: 'anchor_failures_in_report',
      severity: 'P0',
      detail: `FAIL=${failN} PASS=${passN} NOT_RUN=${notRun}`,
    });
  }
  if (process.env.DATABASE_URL && notRun > 0) {
    findings.push({
      id: 'anchor_not_run_with_db',
      severity: 'P0',
      detail: `NOT_RUN=${notRun} with DATABASE_URL set`,
    });
  }

  checks.push({
    id: 'r002_release_gate',
    domain: 'r002_report_release_gate',
    pass: gateOk && failN === 0 && (!process.env.DATABASE_URL || notRun === 0),
    release_gate: gate,
    release_gate_reason: reason,
    summary,
  });

  const readme = path.join(root, checklist.r002_readme || 'evidence/GO_local_r002_verify/README.md');
  let falseGoOk = true;
  if (fs.existsSync(readme)) {
    const text = fs.readFileSync(readme, 'utf8');
    falseGoOk =
      text.includes('PARTIAL_GO') &&
      (text.includes('--require-go') || text.includes('require-go')) &&
      text.includes('ISS-007');
  }
  if (!falseGoOk) {
    findings.push({
      id: 'false_go_readme_drift',
      severity: 'P1',
      detail: 'README missing ISS-007 / --require-go guard text',
    });
  }
  checks.push({
    id: 'false_go_guard_readme',
    domain: 'false_go_guard',
    pass: falseGoOk,
  });

  if (gate === 'PARTIAL_GO' && passN === (checklist.anchor_count || 43)) {
    checks.push({
      id: 'partial_go_narrow_slice_expected',
      domain: 'false_go_guard',
      pass: true,
      note: '43/43 PASS with PARTIAL_GO is valid ISS-007 narrow slice at ①',
    });
  }

  return checks;
}

function runStaticSsotChecks(root, checklist, findings) {
  const checks = [];
  const spec93 = path.join(root, 'docs/spec/93-全站功能验证矩阵-域别回归清单.md');
  const r002 = path.join(root, 'docs/spec/R-002-回归执行闭环与发布准入.md');
  for (const [id, p] of [
    ['ssot_93_matrix', spec93],
    ['ssot_r002', r002],
    ['ssot_gen_r002', path.join(root, 'scripts/gen-r002-iss007-prereport.py')],
  ]) {
    const pass = fs.existsSync(p);
    if (!pass) findings.push({ id: `missing:${id}`, severity: 'P1', detail: p });
    checks.push({ id, domain: '04_route_contract_drift', pass, path: p });
  }
  const routes04 = path.join(root, 'scripts/check-04-routes-contract.sh');
  if (fs.existsSync(routes04)) {
    checks.push({ id: 'ssot_04_routes_script', domain: '04_route_contract_drift', pass: true });
  }
  return checks;
}

module.exports = {
  loadChecklist,
  runMatrixWiringChecks,
  runAnchorCargoParity,
  runReportGateSemantics,
  runStaticSsotChecks,
};
