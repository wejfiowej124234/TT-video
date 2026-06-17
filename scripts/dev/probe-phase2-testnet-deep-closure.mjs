#!/usr/bin/env node
/**
 * TT-PHASE2-TESTNET-CLOSURE-GOVERNANCE-STANDARD · Deep Closure Addendum probe
 * 顺序：D1→D24（固定 · §9–§13）
 *
 *   node scripts/dev/probe-phase2-testnet-deep-closure.mjs --evid-dir <dir> [--api <url>]
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const args = process.argv.slice(2);
function arg(name, def = '') {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : def;
}

const evidDir = arg('--evid-dir', '.');
const api = arg('--api', 'https://tt-api-staging.fly.dev').replace(/\/$/, '');
const root = process.cwd();

function readJson(p) {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

function readText(p) {
  try {
    return fs.readFileSync(p, 'utf8');
  } catch {
    return null;
  }
}

function latestDir(baseRel, prefix) {
  const base = path.join(root, baseRel);
  if (!fs.existsSync(base)) return null;
  const hits = fs
    .readdirSync(base)
    .filter((d) => {
      if (prefix && !d.startsWith(prefix)) return false;
      try {
        return fs.statSync(path.join(base, d)).isDirectory();
      } catch {
        return false;
      }
    })
    .sort()
    .reverse();
  return hits[0] ? path.join(base, hits[0]) : null;
}

function grepFile(filePath, pattern) {
  const t = readText(filePath);
  if (!t) return false;
  return t.includes(pattern);
}

function grepDir(dir, pattern, maxDepth = 2) {
  if (!dir || !fs.existsSync(dir)) return false;
  const walk = (d, depth) => {
    if (depth > maxDepth) return false;
    for (const name of fs.readdirSync(d)) {
      const p = path.join(d, name);
      let st;
      try {
        st = fs.statSync(p);
      } catch {
        continue;
      }
      if (st.isFile() && grepFile(p, pattern)) return true;
      if (st.isDirectory() && walk(p, depth + 1)) return true;
    }
    return false;
  };
  return walk(dir, 0);
}

function metaChainId(meta) {
  if (!meta || meta.error) return null;
  const cid =
    meta.chain_id ??
    meta.chain?.chain_id ??
    meta.chain?.contracts?.chain_id_configured ??
    null;
  if (cid === null || cid === undefined) return null;
  return Number(cid);
}

function fileExists(p) {
  try {
    return fs.statSync(p).isFile();
  } catch {
    return false;
  }
}

/** @returns {{ status: 'PASS'|'PARTIAL'|'OPEN', gaps: string[], notes: string[] }} */
function mk(status, gaps = [], notes = []) {
  return { status, gaps, notes };
}

function evalTnP010GraduationGate() {
  const r = spawnSync(
    'node',
    [path.join(root, 'scripts/dev/lib/tn-p1-010-graduation-gate.mjs'), '--root', root, '--status-only'],
    { encoding: 'utf8' },
  );
  try {
    return JSON.parse((r.stdout || '').trim() || '{}');
  } catch {
    return { pass: false, state: 'no', note: 'tn-p1-010 graduation gate probe failed' };
  }
}

// —— D1 · 新增功能反查 ——
function probeD1() {
  const closed = [
    {
      id: 'ADM-U01',
      dir: latestDir('evidence/GO_staging_admin_rbac_matrix', 'run_'),
      markers: ['TT_ADM_U01_EVIDENCE: PASS'],
      report: true,
    },
    {
      id: 'ADM-U02',
      dir: latestDir('evidence/GO_staging_admin_adm_u02', 'run_'),
      markers: ['TT_ADM_U02_STAGING_EVIDENCE: PASS'],
      report: true,
    },
    {
      id: 'TN-P1-002',
      dir: latestDir('evidence/GO_phase2_testnet_perfect_validation', 'tn-p1-002-'),
      markers: ['TT_TN_P1_002_PROVIDER_ONBOARDING_EVIDENCE: PASS'],
      report: true,
    },
    {
      id: 'TN-P1-003',
      dir: latestDir('evidence/GO_phase2_testnet_perfect_validation', 'tn-p1-003-'),
      markers: ['TT_TN_P1_003_ACQUISITION_EVIDENCE: PASS'],
      report: true,
    },
    {
      id: 'TN-P1-004',
      dir: latestDir('evidence/GO_phase2_testnet_perfect_validation', 'tn-p1-004-'),
      markers: ['TT_TN_P1_004_STEWARD_STAKE_EVIDENCE: PASS'],
      report: true,
    },
    {
      id: 'TN-P1-005',
      dir: latestDir('evidence/GO_phase2_testnet_perfect_validation', 'tn-p1-005-'),
      markers: ['TT_SMOKE_ONBOARDING_TESTNET: OK', 'TT_TN_P1_005'],
      report: false,
      fallbackDirs: ['evidence/GO_phase2_onboarding_testnet'],
    },
    {
      id: 'TN-P1-006',
      dir: latestDir('evidence/GO_phase2_testnet_perfect_validation', 'tn-p1-006-'),
      markers: ['TT_TN_P1_006_ESCROW_EVIDENCE: PASS'],
      report: true,
    },
    {
      id: 'TN-P1-007/008',
      dir: latestDir('evidence/GO_phase2_testnet_perfect_validation', 'tn-p1-007-008-'),
      markers: ['TT_TN_P1_007_008_HAT_EVIDENCE: PASS'],
      report: true,
    },
    {
      id: 'TN-P1-010',
      dir: latestDir('evidence/GO_phase2_testnet_perfect_validation', 'tn-p1-010-indexer-reconcile-'),
      markers: ['TT_TN_P1_010_INDEXER_RECONCILE_EVIDENCE: PASS'],
      report: true,
    },
  ];
  const openP1 = [];
  if (!fileExists(path.join(root, 'evidence/P2FC_SOAK_72H_STAGING/COMPLETED.json'))) {
    openP1.push({ id: 'TN-P1-009', note: 'P2FC 72h soak · COMPLETED.json missing' });
  }

  const gaps = [];
  const notes = [];
  for (const f of closed) {
    let dir = f.dir;
    if (!dir && f.fallbackDirs) {
      for (const rel of f.fallbackDirs) {
        dir = latestDir(rel, null) || (fs.existsSync(path.join(root, rel)) ? path.join(root, rel) : null);
        if (dir) break;
      }
    }
    if (!dir) {
      gaps.push(`${f.id}: evidence dir missing`);
      continue;
    }
    const report = path.join(dir, 'report.json');
    let markerOk = f.markers.some((m) => grepDir(dir, m));
    if (!markerOk && f.id === 'ADM-U01') {
      markerOk = grepDir(path.join(root, 'evidence/GO_staging_admin_rbac_matrix'), 'TT_ADM_U01_EVIDENCE: PASS');
    }
    if (!markerOk) gaps.push(`${f.id}: PASS marker not found in ${dir}`);
    if (f.report && !fileExists(report)) gaps.push(`${f.id}: report.json missing`);
    else notes.push(`${f.id}: ${path.relative(root, dir)}`);
  }
  const soakCompleted = fileExists(path.join(root, 'evidence/P2FC_SOAK_72H_STAGING/COMPLETED.json'));
  const tn010Gate = evalTnP010GraduationGate();
  try {
    fs.mkdirSync(evidDir, { recursive: true });
    fs.writeFileSync(
      path.join(evidDir, 'probe-tn-p1-010-graduation-gate.json'),
      JSON.stringify(tn010Gate, null, 2) + '\n',
    );
  } catch {
    /* best-effort */
  }
  if (soakCompleted && !tn010Gate.pass) {
    gaps.push(`TN-P1-010 graduation gate: ${tn010Gate.note}`);
  } else if (tn010Gate.pass) {
    notes.push(`TN-P1-010 graduation gate: ${tn010Gate.note}`);
  }
  for (const o of openP1) {
    gaps.push(`${o.id}: ${o.note}`);
  }
  const soakOnly =
    gaps.length > 0 && gaps.every((g) => g.startsWith('TN-P1-009') || g.includes('P2FC 72h soak'));
  const status =
    gaps.length === 0 ? 'PASS' : soakOnly ? 'PARTIAL' : gaps.some((g) => g.startsWith('TN-P1-009')) ? 'OPEN' : 'PARTIAL';
  return mk(status, gaps, notes);
}

// —— D2 · 六角色负向矩阵 ——
function probeD2() {
  const gaps = [];
  const notes = [];
  const admDir = latestDir('evidence/GO_staging_admin_rbac_matrix', 'run_');
  if (!admDir) {
    gaps.push('ADM-U01 matrix evidence missing');
  } else {
    const matrix = readJson(path.join(admDir, 'matrix-api-results.json'));
    if (!matrix) gaps.push('ADM-U01 matrix-api-results.json missing');
    else {
      const body = JSON.stringify(matrix);
      if (!/deny|403|401|forbidden/i.test(body)) gaps.push('ADM-U01 matrix lacks deny probes');
      else notes.push('ADM-U01 deny matrix on file');
    }
  }
  const hatDir = latestDir('evidence/GO_phase2_testnet_perfect_validation', 'tn-p1-007-008-');
  if (!hatDir) {
    gaps.push('TN-P1-007/008 hat evidence missing');
  } else {
    const probeJson = path.join(hatDir, 'hat-matrix-probe/hat-matrix-probe.json');
    if (!fileExists(probeJson)) gaps.push('hat-matrix-probe.json missing');
    else if (!grepFile(path.join(hatDir, 'hat-matrix-probe.log'), 'TT_TN_P1_HAT_MATRIX_PROBE: PASS')) {
      gaps.push('hat-matrix-probe PASS marker missing');
    } else notes.push('HAT matrix probe PASS');
  }
  const status = gaps.length === 0 ? 'PASS' : 'OPEN';
  return mk(status, gaps, notes);
}

// —— D3 · 多身份污染测试 ——
function probeD3() {
  const gaps = [];
  const notes = [];
  const hatDir = latestDir('evidence/GO_phase2_testnet_perfect_validation', 'tn-p1-007-008-');
  if (!hatDir) {
    gaps.push('multi-identity evidence root missing');
  } else {
    const smokeLog = path.join(hatDir, 'multi-identity-smoke.log');
    if (!grepFile(smokeLog, 'smoke-multi-identity-closure: ALL PASS')) {
      gaps.push('multi-identity-smoke ALL PASS not found');
    } else notes.push('multi-identity smoke ALL PASS');
    const probe = readJson(path.join(hatDir, 'hat-matrix-probe/hat-matrix-probe.json'));
    if (probe && typeof probe === 'object') {
      const s = JSON.stringify(probe);
      if (!/merchant|steward|traveler|guide|moderator|admin/i.test(s)) {
        gaps.push('hat probe missing role cross-check payload');
      } else notes.push('hat probe includes multi-role payload');
    }
  }
  const status = gaps.length === 0 ? 'PASS' : 'OPEN';
  return mk(status, gaps, notes);
}

// —— D4 · DB/API/UI/链上/Indexer 五方对账 ——
function probeD4() {
  const gaps = [];
  const notes = [];
  const meta = readJson(path.join(evidDir, 'probe-meta.json'));
  const recon = readJson(path.join(evidDir, 'probe-indexer-reconcile.json'));
  if (!meta || meta.error) gaps.push('API /meta probe missing or failed');
  else {
    const cid = metaChainId(meta);
    if (cid !== 11155111) gaps.push(`meta chain_id not Sepolia: ${cid}`);
    else notes.push('API meta chain_id=11155111');
  }

  if (!recon || recon.error || recon.skipped) {
    gaps.push('indexer-reconcile live probe missing/skipped');
  } else {
    if (recon.reconcile_compound_pass !== true) gaps.push('reconcile compound_pass=false');
    const missing = recon?.orders_projection_reconcile_gate?.breakdown?.missing_projection;
    if (missing !== 0) gaps.push(`missing_projection=${missing}`);
    if (recon.reconcile_compound_pass === true && missing === 0) notes.push('five-way indexer reconcile clean');
  }

  const escrowDir = latestDir('evidence/GO_phase2_testnet_perfect_validation', 'tn-p1-006-');
  if (!escrowDir) gaps.push('TN-P1-006 chain escrow evidence missing (on-chain leg)');
  else notes.push('Escrow on-chain evidence on file');

  const uiDir = latestDir('evidence/phase2-human-acceptance-staging-sprint', null);
  if (!uiDir) gaps.push('human acceptance staging sprint evidence missing (UI leg)');
  else notes.push('Human acceptance UI sprint on file');

  const status =
    gaps.some((g) => g.includes('compound') || g.includes('missing_projection')) ? 'OPEN' : gaps.length === 0 ? 'PASS' : 'PARTIAL';
  return mk(status, gaps, notes);
}

// —— D5 · 恢复/重放/幂等/安全滥用 ——
async function probeD5() {
  const gaps = [];
  const notes = [];
  const sec = process.env.INTERNAL_API_SECRET || '';

  if (sec) {
    try {
      const r = await fetch(`${api}/api/v1/internal/indexer-replay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Internal-Api-Secret': sec },
        body: '{}',
        signal: AbortSignal.timeout(120_000),
      });
      const j = await r.json().catch(() => ({}));
      if (r.ok && (j.status === 'ok' || j.replay)) notes.push('indexer-replay endpoint executable');
      else gaps.push(`indexer-replay unexpected: http=${r.status}`);
      try {
        fs.mkdirSync(evidDir, { recursive: true });
        fs.writeFileSync(
          path.join(evidDir, 'probe-deep-closure-d5-replay.json'),
          JSON.stringify({ replay_ok: r.ok && (j.status === 'ok' || j.replay), http: r.status }, null, 2) + '\n',
        );
      } catch {
        /* best-effort */
      }
    } catch (e) {
      gaps.push(`indexer-replay fetch failed: ${e.message}`);
    }
  } else {
    gaps.push('INTERNAL_API_SECRET unset · replay probe skipped');
  }

  try {
    const r = await fetch(`${api}/api/v1/internal/indexer-tick`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
      signal: AbortSignal.timeout(15_000),
    });
    if (r.status === 401 || r.status === 403) notes.push('indexer-tick without secret denied');
    else gaps.push(`indexer-tick without secret not denied: http=${r.status}`);
  } catch (e) {
    gaps.push(`security abuse probe failed: ${e.message}`);
  }

  const status = gaps.some((g) => g.includes('compound') || g.includes('replay') || g.includes('not denied')) ? 'OPEN' : gaps.length === 0 ? 'PASS' : gaps.some((g) => g.includes('skipped')) ? 'PARTIAL' : 'OPEN';
  return mk(status === 'PARTIAL' && gaps.length === 1 && gaps[0].includes('skipped') ? 'PARTIAL' : status, gaps, notes);
}

// —— D6 · 长尾页面真人抽检 ——
function probeD6() {
  const gaps = [];
  const notes = [];
  const humanRoot = path.join(root, 'evidence/phase2-human-acceptance-staging-sprint');
  let humanOk = false;
  if (fs.existsSync(humanRoot)) {
    humanOk = grepDir(humanRoot, 'TT_PHASE2_HUMAN_ACCEPTANCE_STAGING_SPRINT: OK', 3);
  }
  if (humanOk) notes.push('phase2-human-acceptance-staging-sprint OK');
  else gaps.push('phase2-human-acceptance-staging-sprint PASS marker missing');

  const uiCandidates = [
    'frontend/evidence/GO_phase2_staging_ui_real_user_sprint',
    'evidence/GO_phase2_staging_ui_real_user',
    'evidence/GO_local_staging_ui_real_user',
    'evidence/phase2-staging-ui-real-user-sprint',
    'evidence/GO_phase2_onboarding_testnet',
  ];
  let uiOk = false;
  for (const rel of uiCandidates) {
    const p = path.join(root, rel);
    if (fs.existsSync(p)) {
      uiOk = true;
      notes.push(`${rel} on file`);
      break;
    }
  }
  if (!uiOk) gaps.push('staging-ui-real-user evidence missing (long-tail UI sample)');

  const d6Dir = latestDir('evidence/GO_phase2_testnet_perfect_validation', 'tn-p1-d6-reliability-surface-');
  const d6Manifest = d6Dir ? path.join(d6Dir, 'reliability-surface-manifest.json') : null;
  if (d6Manifest && fileExists(d6Manifest)) {
    notes.push('tn-p1-d6-reliability-surface manifest on file');
  } else gaps.push('D6 reliability 52-surface manifest missing');

  const hatDir = latestDir('evidence/GO_phase2_testnet_perfect_validation', 'tn-p1-007-008-');
  const hatLogOk =
    (d6Dir && fileExists(path.join(d6Dir, 'playwright-hat.log'))) ||
    (hatDir &&
      (fileExists(path.join(hatDir, 'playwright-hat.log')) ||
        fileExists(path.join(hatDir, 'hat-browser.log')) ||
        grepDir(hatDir, 'playwright', 2)));
  if (hatLogOk) notes.push('Playwright hat browser sample on file');
  else gaps.push('Playwright hat browser log missing');

  const status = gaps.length === 0 ? 'PASS' : gaps.length <= 1 ? 'PARTIAL' : 'OPEN';
  return mk(status, gaps, notes);
}

// —— D7 · 证据完整性审计 ——
function probeD7() {
  const required = [
    { label: 'ADM-U01', dir: latestDir('evidence/GO_staging_admin_rbac_matrix', 'run_'), report: false },
    { label: 'ADM-U02', dir: latestDir('evidence/GO_staging_admin_adm_u02', 'run_'), report: true },
    { label: 'TN-P1-002', dir: latestDir('evidence/GO_phase2_testnet_perfect_validation', 'tn-p1-002-'), report: true },
    { label: 'TN-P1-003', dir: latestDir('evidence/GO_phase2_testnet_perfect_validation', 'tn-p1-003-'), report: true },
    { label: 'TN-P1-004', dir: latestDir('evidence/GO_phase2_testnet_perfect_validation', 'tn-p1-004-'), report: true },
    { label: 'TN-P1-006', dir: latestDir('evidence/GO_phase2_testnet_perfect_validation', 'tn-p1-006-'), report: true },
    { label: 'TN-P1-007/008', dir: latestDir('evidence/GO_phase2_testnet_perfect_validation', 'tn-p1-007-008-'), report: true },
  ];

  const gaps = [];
  const notes = [];
  for (const r of required) {
    if (!r.dir) {
      gaps.push(`${r.label}: evidence dir missing`);
      continue;
    }
    if (r.report && !fileExists(path.join(r.dir, 'report.json'))) gaps.push(`${r.label}: report.json missing`);
    const hasRun = fs.readdirSync(r.dir).some((f) => f.startsWith('run-') || f === 'run.log');
    if (!hasRun) gaps.push(`${r.label}: run log missing`);
    else notes.push(`${r.label}: integrity OK`);
  }

  const manifest = latestDir('evidence/GO_phase2_testnet_perfect_validation', '202606');
  if (manifest && fileExists(path.join(manifest, 'testnet-perfect-validation-manifest.v1.json'))) {
    notes.push('testnet-perfect-validation-manifest.v1.json on file');
  } else {
    gaps.push('testnet-perfect-validation-manifest.v1.json missing');
  }

  const status = gaps.length === 0 ? 'PASS' : 'OPEN';
  return mk(status, gaps, notes);
}

function readEvidProbe(name) {
  return readJson(path.join(evidDir, name));
}

// —— D8 · 多身份角色组合爆炸矩阵 ——
function probeD8() {
  const gaps = [];
  const notes = [];
  const hatDir = latestDir('evidence/GO_phase2_testnet_perfect_validation', 'tn-p1-007-008-');
  const probeJson = hatDir ? readJson(path.join(hatDir, 'hat-matrix-probe/hat-matrix-probe.json')) : null;
  let comboCount = 0;
  if (probeJson) {
    const flat = JSON.stringify(probeJson);
    comboCount =
      (probeJson.results?.length ?? probeJson.probes?.length ?? probeJson.cases?.length ?? 0) ||
      (flat.match(/"status"\s*:\s*"(pass|PASS|ok)"/g)?.length ?? 0);
    if (comboCount >= 30) notes.push(`HAT combo probes ${comboCount}>=30`);
    else gaps.push(`HAT combo probes ${comboCount}<30 (target explosion matrix)`);
  } else gaps.push('hat-matrix-probe.json missing');

  const admDir = latestDir('evidence/GO_staging_admin_rbac_matrix', 'run_');
  const admMatrix = admDir ? readJson(path.join(admDir, 'matrix-api-results.json')) : null;
  if (admMatrix) {
    const n =
      admMatrix.results?.length ??
      admMatrix.probes?.length ??
      (Array.isArray(admMatrix) ? admMatrix.length : 0);
    if (n >= 90) notes.push(`Admin RBAC matrix ${n}>=90`);
    else gaps.push(`Admin RBAC matrix ${n}<90 (target 102)`);
  } else gaps.push('ADM-U01 matrix-api-results.json missing');

  const status = gaps.length === 0 ? 'PASS' : 'OPEN';
  return mk(status, gaps, notes);
}

// —— D9 · 全生命周期状态迁移 ——
function probeD9() {
  const gaps = [];
  const notes = [];
  const chains = [
    {
      id: 'TN-P1-003-acquisition',
      dir: latestDir('evidence/GO_phase2_testnet_perfect_validation', 'tn-p1-003-'),
      states: ['create', 'match', 'accept', 'escrow', 'complete'],
    },
    {
      id: 'TN-P1-006-escrow',
      dir: latestDir('evidence/GO_phase2_testnet_perfect_validation', 'tn-p1-006-'),
      states: ['create', 'fund', 'release', 'refund'],
    },
  ];
  for (const c of chains) {
    if (!c.dir) {
      gaps.push(`${c.id}: evidence missing`);
      continue;
    }
    const ok = c.states.every((s) => grepDir(c.dir, s, 3));
    if (ok) notes.push(`${c.id}: lifecycle states covered`);
    else gaps.push(`${c.id}: lifecycle state keywords incomplete`);
  }
  const execRoots = [
    latestDir('evidence/GO_phase2_testnet_perfect_validation', 'p2exec-'),
    path.join(root, 'frontend/evidence/GO_phase2_testnet_execution_sprint'),
    path.join(root, 'frontend/evidence/GO_phase2_web3_p2_003_b407_sprint'),
  ].filter(Boolean);
  let execOk = false;
  for (const dir of execRoots) {
    if (!fs.existsSync(dir)) continue;
    if (
      grepDir(dir, 'TT_PHASE2_TESTNET_EXECUTION_SPRINT', 2) ||
      grepDir(dir, 'TT_PHASE2_TESTNET_EXECUTION_SPRINT_EVIDENCE', 2) ||
      grepDir(dir, 'TT_PHASE2_TESTNET_EXECUTION_SPRINT_EVIDENCE: OK', 2) ||
      grepDir(dir, 'p2exec: OK', 2)
    ) {
      execOk = true;
      notes.push(`P2Exec chain evidence (${path.relative(root, dir)})`);
      break;
    }
  }
  if (!execOk && grepDir(path.join(root, 'evidence'), 'TT_PHASE2_TESTNET_EXECUTION_SPRINT: OK', 4)) {
    execOk = true;
    notes.push('P2Exec sprint PASS (nested evidence)');
  }
  if (!execOk) gaps.push('P2Exec execution sprint lifecycle evidence missing');
  const status = gaps.length === 0 ? 'PASS' : gaps.length <= 1 ? 'PARTIAL' : 'OPEN';
  return mk(status, gaps, notes);
}

// —— D10 · CMS/Growth/Governance/Admin 运营后台 ——
function probeD10() {
  const gaps = [];
  const notes = [];
  if (grepDir(path.join(root, 'evidence/GO_staging_admin_rbac_matrix'), 'TT_ADM_U01_EVIDENCE: PASS', 2)) {
    notes.push('ADM-U01 admin consoles PASS');
  } else gaps.push('ADM-U01 evidence PASS missing');
  const u02 = latestDir('evidence/GO_staging_admin_adm_u02', 'run_');
  if (u02 && grepDir(u02, 'TT_ADM_U02_STAGING_EVIDENCE: PASS', 2)) notes.push('ADM-U02 PASS');
  else gaps.push('ADM-U02 evidence PASS missing');

  const parityRoots = [
    'evidence/GO_staging_api_parity',
    'evidence/phase2-staging-api-parity-sprint',
    'evidence/GO_phase2_staging_api_parity',
  ];
  let parityOk = false;
  for (const rel of parityRoots) {
    const p = path.join(root, rel);
    if (fs.existsSync(p) && grepDir(p, 'parity', 3)) {
      parityOk = true;
      notes.push(`${rel} CMS/Growth/Official parity`);
      break;
    }
  }
  const d6Dir = latestDir('evidence/GO_phase2_testnet_perfect_validation', 'tn-p1-d6-reliability-surface-');
  const d6Manifest = d6Dir ? readJson(path.join(d6Dir, 'reliability-surface-manifest.json')) : null;
  const adminSurfaces = (d6Manifest?.surfaces || []).filter((s) => /^A-P/.test(s.id));
  if (!parityOk && adminSurfaces.length >= 6) {
    parityOk = true;
    notes.push(`D6 reliability admin surfaces ${adminSurfaces.length}/10 (CMS/Growth/Obs parity)`);
  }
  if (!parityOk) gaps.push('CMS/Growth/Official staging-api-parity evidence missing');

  const govDirs = [
    latestDir('evidence/GO_phase2_testnet_perfect_validation', 'governance-'),
    path.join(root, 'evidence/GO_local_governance_params_l5'),
    path.join(root, 'evidence/GO_local_identity_workspace'),
    path.join(root, 'frontend/evidence/GO_local_governance_params_l5'),
    path.join(root, 'frontend/evidence/GO_local_identity_workspace'),
  ];
  let govOk = false;
  for (const d of govDirs) {
    if (d && fs.existsSync(d)) {
      govOk = true;
      notes.push('Governance L5/params evidence on file');
      break;
    }
  }
  const stewardGov = (d6Manifest?.surfaces || []).filter((s) => /^S-P0[2345]/.test(s.id));
  if (!govOk && stewardGov.length >= 3) {
    govOk = true;
    notes.push(`D6 reliability governance surfaces ${stewardGov.map((s) => s.id).join(',')}`);
  }
  if (!govOk) gaps.push('Governance params/proposals staging evidence missing');

  const status = gaps.length === 0 ? 'PASS' : gaps.length <= 2 ? 'PARTIAL' : 'OPEN';
  return mk(status, gaps, notes);
}

// —— D11 · 订单/Escrow/FeeRouter/PSP 财务一致性 ——
function probeD11() {
  const gaps = [];
  const notes = [];
  const recon = readEvidProbe('probe-indexer-reconcile.json');
  const tn010Gate = evalTnP010GraduationGate();
  if (tn010Gate.pass) notes.push(`TN-P1-010 graduation gate: ${tn010Gate.note}`);
  else if (recon?.reconcile_compound_pass === true) notes.push('reconcile compound_pass (pre-graduation live)');
  else gaps.push(`reconcile/TN-P1-010: ${tn010Gate.note || 'compound_pass=false'}`);

  const missing = recon?.orders_projection_reconcile_gate?.breakdown?.missing_projection;
  if (missing === 0) notes.push('missing_projection=0');
  else if (!tn010Gate.pass) gaps.push(`missing_projection=${missing ?? 'unknown'}`);

  if (latestDir('evidence/GO_phase2_testnet_perfect_validation', 'tn-p1-006-')) {
    notes.push('TN-P1-006 Escrow financial leg');
  } else gaps.push('TN-P1-006 Escrow evidence missing');

  const stripeOk =
    grepDir(path.join(root, 'evidence'), 'TT_SMOKE_ONBOARDING_TESTNET: OK', 5) ||
    grepDir(path.join(root, 'evidence'), 'TN-P1-005', 4);
  if (stripeOk) notes.push('Stripe test PSP corridor');
  else gaps.push('TN-P1-005 Stripe PSP evidence missing');

  if (recon?.fee_router_observability || recon?.fee_router_balance_wei !== undefined) {
    notes.push('FeeRouter observability in reconcile');
  } else if (recon && !recon.error) {
    notes.push('FeeRouter observability partial (distribute ② defer OK)');
  }

  const status =
    !tn010Gate.pass && gaps.some((g) => g.includes('TN-P1-010') || g.includes('missing_projection'))
      ? 'OPEN'
      : gaps.length === 0
        ? 'PASS'
        : 'PARTIAL';
  return mk(status, gaps, notes);
}

// —— D12 · 异常运营恢复链路 ——
function probeD12() {
  const gaps = [];
  const notes = [];
  const soakPath = path.join(root, 'evidence/P2FC_SOAK_72H_STAGING/COMPLETED.json');
  if (fileExists(soakPath)) notes.push('P2FC COMPLETED.json');
  else if (fileExists(path.join(root, 'evidence/P2FC_SOAK_72H_STAGING/START.json'))) {
    notes.push('P2FC soak START (INFLIGHT)');
    gaps.push('TN-P1-009: P2FC 72h not COMPLETED');
  } else gaps.push('TN-P1-009: P2FC soak not started');

  const d5 = readEvidProbe('probe-deep-closure-d5-replay.json');
  if (d5?.replay_ok) notes.push('indexer-replay cached OK');
  else notes.push('indexer-replay see D5 live probe');

  if (fileExists(path.join(root, 'docs/runbook/TT-PHASE2-TESTNET-CLOSURE-GOVERNANCE-STANDARD.md'))) {
    notes.push('recovery runbook SSOT on file');
  }

  const soakOnly = gaps.length > 0 && gaps.every((g) => g.includes('TN-P1-009') || g.includes('P2FC'));
  const status = gaps.length === 0 ? 'PASS' : soakOnly ? 'PARTIAL' : gaps.some((g) => g.includes('TN-P1-009')) ? 'OPEN' : 'PARTIAL';
  return mk(status, gaps, notes);
}

// —— D13 · 国际化边界 ——
function probeD13() {
  const gaps = [];
  const notes = [];
  const i18nEvidence =
    grepDir(path.join(root, 'evidence'), 'test:i18n:ci', 5) ||
    grepDir(path.join(root, 'frontend/evidence'), 'i18n', 3);
  if (i18nEvidence) notes.push('i18n ci evidence referenced');
  else gaps.push('i18n:ci / frontend i18n evidence missing');

  const meta = readEvidProbe('probe-meta.json');
  if (meta && !meta.error) notes.push('/meta probe for locale-safe errors');
  else gaps.push('/meta probe missing');

  const status = gaps.length === 0 ? 'PASS' : gaps.length === 1 ? 'PARTIAL' : 'OPEN';
  return mk(status, gaps, notes);
}

// —— D14 · 安全攻击与重放防护 ——
async function probeD14() {
  const gaps = [];
  const notes = [];
  const meta = readEvidProbe('probe-meta.json');
  if (meta?.rate_limits || meta?.idempotency_cache) {
    notes.push('/meta rate_limits + idempotency_cache observable');
  } else if (meta && !meta.error) {
    gaps.push('/meta missing rate_limits or idempotency_cache');
  } else gaps.push('/meta probe missing');

  try {
    const r = await fetch(`${api}/api/v1/internal/indexer-reconcile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
      signal: AbortSignal.timeout(15_000),
    });
    if (r.status === 401 || r.status === 403) notes.push('indexer-reconcile without secret denied');
    else gaps.push(`indexer-reconcile without secret not denied: http=${r.status}`);
  } catch (e) {
    gaps.push(`reconcile abuse probe failed: ${e.message}`);
  }

  const status = gaps.length === 0 ? 'PASS' : 'OPEN';
  return mk(status, gaps, notes);
}

// —— D15 · 真实运营日模拟 ——
function probeD15() {
  const gaps = [];
  const notes = [];
  const soakDone = fileExists(path.join(root, 'evidence/P2FC_SOAK_72H_STAGING/COMPLETED.json'));
  if (soakDone) notes.push('P2FC 72h wall-clock COMPLETED');
  else gaps.push('P2FC 72h COMPLETED missing (ops-day soak)');

  const humanOk = grepDir(path.join(root, 'evidence/phase2-human-acceptance-staging-sprint'), 'TT_PHASE2_HUMAN_ACCEPTANCE_STAGING_SPRINT: OK', 3);
  if (humanOk) notes.push('human acceptance ops-day script');
  else gaps.push('phase2-human-acceptance staging sprint missing');

  let execOk = grepDir(path.join(root, 'evidence'), 'TT_PHASE2_TESTNET_EXECUTION_SPRINT: OK', 5);
  if (!execOk) {
    execOk =
      grepDir(path.join(root, 'frontend/evidence/GO_phase2_testnet_execution_sprint'), 'TT_PHASE2_TESTNET_EXECUTION_SPRINT_EVIDENCE: OK', 4) ||
      grepDir(path.join(root, 'frontend/evidence/GO_phase2_web3_p2_003_b407_sprint'), 'p2exec: OK', 3);
  }
  if (execOk) notes.push('10-step execution sprint');
  else gaps.push('smoke-phase2-testnet-execution-sprint evidence missing');

  const soakOnly =
    gaps.length > 0 && gaps.every((g) => g.includes('P2FC 72h COMPLETED') || g.includes('ops-day soak'));
  const status = gaps.length === 0 ? 'PASS' : soakOnly ? 'PARTIAL' : 'OPEN';
  return mk(status, gaps, notes);
}

function requiredFile(rel) {
  return fileExists(path.join(root, rel));
}

// —— D16 · Runbook 完整性审计 ——
function probeD16() {
  const gaps = [];
  const notes = [];
  const required = [
    'docs/go-live-checklist.md',
    'docs/runbook/README.md',
    'docs/runbook/PHASE2-START-CHECKLIST.md',
    'docs/runbook/TT-PHASE2-TESTNET-CLOSURE-GOVERNANCE-STANDARD.md',
    'docs/runbook/TESTNET-PERFECT-VALIDATION-REPORT.md',
    'docs/runbook/TT-9618-onboarding-local-testnet.md',
    'docs/runbook/PRODUCTION-INFRASTRUCTURE-AUDIT-REPORT.md',
    'docs/runbook/PHASE2-REPOSITORY-STATUS.md',
    'scripts/dev/run-production-infrastructure-audit.sh',
    'scripts/dev/phase2-staging-fly-deploy-and-sync.sh',
  ];
  for (const f of required) {
    if (requiredFile(f)) notes.push(`${f} OK`);
    else gaps.push(`runbook/script missing: ${f}`);
  }
  const runbookDir = path.join(root, 'docs/runbook');
  if (fs.existsSync(runbookDir)) {
    const ttCount = fs.readdirSync(runbookDir).filter((n) => n.startsWith('TT-') && n.endsWith('.md')).length;
    if (ttCount >= 40) notes.push(`docs/runbook TT-* count=${ttCount}`);
    else gaps.push(`docs/runbook TT-* count ${ttCount}<40`);
  } else gaps.push('docs/runbook missing');

  const status = gaps.length === 0 ? 'PASS' : gaps.length <= 2 ? 'PARTIAL' : 'OPEN';
  return mk(status, gaps, notes);
}

// —— D17 · 灾难恢复与故障演练 ——
function probeD17() {
  const gaps = [];
  const notes = [];
  if (requiredFile('scripts/dev/run-phase3-fly-release-rollback-drill.sh')) {
    notes.push('rollback drill script on file');
  } else gaps.push('run-phase3-fly-release-rollback-drill.sh missing');

  const drEvidence =
    grepDir(path.join(root, 'evidence'), 'rollback-drill', 6) ||
    grepDir(path.join(root, 'evidence'), 'db-restore-drill', 6) ||
    grepDir(path.join(root, 'evidence'), 'disaster_recovery_matrix', 6);
  if (drEvidence) notes.push('staging DR drill evidence on file');
  else gaps.push('rollback/db-restore drill evidence missing');

  if (grepDir(path.join(root, 'docs/runbook'), 'Staging DR', 2) || requiredFile('docs/runbook/PRODUCTION-INFRASTRUCTURE-AUDIT-REPORT.md')) {
    notes.push('DR matrix runbook SSOT');
  } else gaps.push('PRODUCTION-INFRASTRUCTURE-AUDIT DR section missing');

  if (requiredFile('scripts/dev/run-phase3-db-restore-drill-prod.sh') || grepDir(path.join(root, 'scripts'), 'db-restore-drill', 3)) {
    notes.push('db-restore drill script path');
  } else gaps.push('db-restore drill script missing');

  const status = gaps.length === 0 ? 'PASS' : gaps.length <= 1 ? 'PARTIAL' : 'OPEN';
  return mk(status, gaps, notes);
}

// —— D18 · 监控与告警覆盖率 ——
function probeD18() {
  const gaps = [];
  const notes = [];
  const health = readEvidProbe('probe-health.json');
  if (health?.http_code === '200' || health?.http_code === 200) notes.push('/health 200');
  else gaps.push(`/health not 200: ${health?.http_code ?? 'missing'}`);

  const meta = readEvidProbe('probe-meta.json');
  if (meta && !meta.error) {
    const obs = [
      meta.indexer,
      meta.evidence,
      meta.pause,
      meta.build,
      meta.database_connected !== undefined ? true : null,
    ].filter(Boolean);
    if (obs.length >= 3) notes.push('/meta observability anchors >=3');
    else gaps.push('/meta observability anchors incomplete');
  } else gaps.push('/meta probe missing');

  const b480 = requiredFile('docs/runbook/TT-B480-PROD-FAULT-SLO-ACCEPTANCE-001.md');
  const infra = requiredFile('docs/runbook/PRODUCTION-INFRASTRUCTURE-AUDIT-REPORT.md');
  if (b480 || infra) notes.push('fault/SLO or infra audit runbook');
  else gaps.push('monitoring/SLO runbook missing');

  if (grepDir(path.join(root, 'docs/spec'), 'admin/observability', 2)) {
    notes.push('Admin observability route SSOT');
  } else gaps.push('Admin observability spec reference missing');

  const status = gaps.length === 0 ? 'PASS' : gaps.length <= 1 ? 'PARTIAL' : 'OPEN';
  return mk(status, gaps, notes);
}

// —— D19 · 发布/回滚/热修变更管理 ——
function probeD19() {
  const gaps = [];
  const notes = [];
  const deployScript = 'scripts/dev/phase2-staging-fly-deploy-and-sync.sh';
  if (requiredFile(deployScript)) {
    const t = readText(path.join(root, deployScript));
    if (t?.includes('TESTNET_FREEZE_OVERRIDE')) notes.push('TESTNET_FREEZE_OVERRIDE discipline');
    else gaps.push('deploy script missing TESTNET_FREEZE_OVERRIDE gate');
  } else gaps.push(`${deployScript} missing`);

  if (requiredFile('deploy/fly/tt-api-staging/fly.toml')) notes.push('tt-api-staging fly.toml');
  else gaps.push('tt-api-staging fly.toml missing');

  if (requiredFile('scripts/dev/run-phase3-fly-release-rollback-drill.sh')) notes.push('rollback drill entry');
  else gaps.push('rollback drill script missing');

  const rollbackEv = grepDir(path.join(root, 'evidence'), 'rollback-drill', 5);
  if (rollbackEv) notes.push('rollback drill evidence archived');
  else gaps.push('rollback drill evidence not archived');

  const status = gaps.length === 0 ? 'PASS' : gaps.length <= 1 ? 'PARTIAL' : 'OPEN';
  return mk(status, gaps, notes);
}

// —— D20 · Production Readiness Review 多维签审 ——
function probeD20() {
  const gaps = [];
  const notes = [];
  const dimensions = [
    { id: 'function', check: () => requiredFile('docs/runbook/TESTNET-PERFECT-VALIDATION-REPORT.md') },
    { id: 'permission', check: () => grepDir(path.join(root, 'evidence/GO_staging_admin_rbac_matrix'), 'TT_ADM_U01', 2) },
    { id: 'data', check: () => latestDir('evidence/GO_phase2_testnet_perfect_validation', 'tn-p1-007-008-') },
    { id: 'financial', check: () => latestDir('evidence/GO_phase2_testnet_perfect_validation', 'tn-p1-006-') },
    { id: 'security', check: () => readEvidProbe('probe-deep-closure-d5-replay.json') || readEvidProbe('probe-meta.json') },
    { id: 'operations', check: () => requiredFile('docs/runbook/PRODUCTION-INFRASTRUCTURE-AUDIT-REPORT.md') },
    { id: 'recovery', check: () => grepDir(path.join(root, 'evidence'), 'rollback-drill', 5) },
    { id: 'monitoring', check: () => readEvidProbe('probe-health.json') },
    { id: 'release', check: () => requiredFile('docs/go-live-checklist.md') },
  ];
  for (const d of dimensions) {
    if (d.check()) notes.push(`PRR dim ${d.id}: OK`);
    else gaps.push(`PRR dim ${d.id}: missing`);
  }

  const requested = grepDir(path.join(root, 'evidence'), 'TT_PHASE3_PRODUCTION_READINESS_REVIEW: REQUESTED', 6);
  const holdOnly =
    !requested && grepDir(path.join(root, 'evidence'), 'TT_PHASE3_PRODUCTION_READINESS_REVIEW: HOLD', 6);
  if (requested) notes.push('TT_PHASE3_PRODUCTION_READINESS_REVIEW: REQUESTED');
  else if (holdOnly) gaps.push('PRR status HOLD — need REQUESTED after ② full PASS');
  else gaps.push('TT_PHASE3_PRODUCTION_READINESS_REVIEW marker missing');

  if (requiredFile('docs/runbook/PRODUCTION-GO-DECISION-PACKAGE.md')) notes.push('PRODUCTION-GO-DECISION-PACKAGE on file');
  else gaps.push('PRODUCTION-GO-DECISION-PACKAGE missing');

  const status = gaps.length === 0 ? 'PASS' : 'OPEN';
  return mk(status, gaps, notes);
}

// —— D21 · Governance 提案/投票/委托链 ——
function probeD21() {
  const gaps = [];
  const notes = [];
  if (grepDir(path.join(root, 'frontend/evidence/GO_local_identity_workspace'), 'governance', 2) ||
      requiredFile('scripts/dev/smoke-governance-proposals-l5-local.sh')) {
    notes.push('governance proposals L5 smoke SSOT');
  } else gaps.push('governance proposals smoke/runbook missing');

  if (latestDir('evidence/GO_phase2_testnet_perfect_validation', 'tn-p1-004-')) {
    notes.push('TN-P1-004 steward stake evidence');
  } else gaps.push('TN-P1-004 steward stake missing');

  if (grepDir(path.join(root, 'evidence'), 'proposal', 5) || grepDir(path.join(root, 'frontend'), 'GovernanceProposal', 4)) {
    notes.push('proposal UI/API references in evidence or frontend');
  } else gaps.push('proposal vote/delegate coverage missing');

  const status = gaps.length === 0 ? 'PASS' : gaps.length <= 1 ? 'PARTIAL' : 'OPEN';
  return mk(status, gaps, notes);
}

// —— D22 · Governance 参数/质押/链上观测 ——
function probeD22() {
  const gaps = [];
  const notes = [];
  if (requiredFile('scripts/dev/smoke-governance-params-l5-local.sh')) notes.push('governance params L5 smoke');
  else gaps.push('smoke-governance-params-l5 missing');

  const meta = readEvidProbe('probe-meta.json');
  if (meta?.governance || meta?.chain?.contracts?.governor_address) {
    notes.push('/meta governance contracts observable');
  } else if (meta && !meta.error) gaps.push('/meta governance block missing');
  else gaps.push('/meta probe missing for governance chain SSOT');

  if (grepDir(path.join(root, 'docs/runbook'), 'Timelock', 2)) notes.push('Timelock runbook reference');
  else gaps.push('Timelock/governor runbook reference missing');

  const status = gaps.length === 0 ? 'PASS' : gaps.length <= 1 ? 'PARTIAL' : 'OPEN';
  return mk(status, gaps, notes);
}

// —— D23 · Governance 权限边界与主理人走廊 ——
function probeD23() {
  const gaps = [];
  const notes = [];
  if (requiredFile('scripts/dev/smoke-steward-workbench-l5-local.sh')) notes.push('steward workbench L5 smoke');
  else gaps.push('steward workbench smoke missing');

  const hatDir = latestDir('evidence/GO_phase2_testnet_perfect_validation', 'tn-p1-007-008-');
  if (hatDir && grepDir(hatDir, 'steward', 3)) notes.push('HAT steward corridor in TN-P1-007/008');
  else gaps.push('steward hat corridor evidence missing');

  if (grepDir(path.join(root, 'docs/spec'), 'region_steward', 2) || grepDir(path.join(root, 'frontend/app/governance'), 'steward_workbench', 3)) {
    notes.push('steward vs admin IA boundary SSOT');
  } else gaps.push('governance permission boundary SSOT missing');

  const status = gaps.length === 0 ? 'PASS' : 'OPEN';
  return mk(status, gaps, notes);
}

// —— D24 · Full Surface Coverage Audit ——
function probeD24() {
  const gaps = [];
  const notes = [];
  const matrixPath = path.join(evidDir, 'surface-coverage-matrix.v1.json');
  const matrix = readJson(matrixPath);
  if (!matrix) {
    gaps.push('surface-coverage-matrix.v1.json missing — run gen-phase2-testnet-surface-coverage-matrix.mjs');
    return mk('OPEN', gaps, notes);
  }

  const s = matrix.summary || {};
  if (s.surface_coverage_pct === 100) notes.push('surface_coverage_pct=100');
  else gaps.push(`surface_coverage_pct=${s.surface_coverage_pct ?? 'unknown'} (target 100)`);

  if (s.untested_ui_element === 0) notes.push('untested_ui_element=0');
  else gaps.push(`untested_ui_element=${s.untested_ui_element ?? 'unknown'}`);

  if (s.untested_user_action === 0) notes.push('untested_user_action=0');
  else gaps.push(`untested_user_action=${s.untested_user_action ?? 'unknown'}`);

  const humanFail = (matrix.surfaces || []).filter((r) => r.human_uat !== 'PASS');
  if (humanFail.length === 0) notes.push('human_uat_all_pass');
  else gaps.push(`human_uat not PASS: ${humanFail.length} (target 0)`);

  const excFail = (matrix.surfaces || []).filter((r) => r.exception_path_verified !== 'PASS');
  if (excFail.length === 0) notes.push('exception_path_verified_all_pass');
  else gaps.push(`exception_path_verified not PASS: ${excFail.length} (target 0)`);

  if (!requiredFile('registry/phase2-testnet-surface-coverage-registry.v1.yaml')) {
    gaps.push('surface coverage registry YAML missing');
  } else notes.push('registry/phase2-testnet-surface-coverage-registry.v1.yaml on file');

  const openSurfaces = (matrix.surfaces || []).filter((r) => r.status !== 'PASS');
  if (openSurfaces.length > 0 && openSurfaces.length <= 5) {
    notes.push(`open surfaces sample: ${openSurfaces.map((x) => x.id).join(', ')}`);
  }

  const status = gaps.length === 0 ? 'PASS' : 'OPEN';
  return mk(status, gaps, notes);
}

const tracks = [
  { id: 'D1', order: 1, name: '新增功能反查', probe: probeD1 },
  { id: 'D2', order: 2, name: '六角色负向矩阵', probe: probeD2 },
  { id: 'D3', order: 3, name: '多身份污染测试', probe: probeD3 },
  { id: 'D4', order: 4, name: 'DB/API/UI/链上/Indexer 五方对账', probe: probeD4 },
  { id: 'D5', order: 5, name: '恢复/重放/幂等/安全滥用', probe: probeD5 },
  { id: 'D6', order: 6, name: '长尾页面真人抽检', probe: probeD6 },
  { id: 'D7', order: 7, name: '证据完整性审计', probe: probeD7 },
  { id: 'D8', order: 8, name: '多身份角色组合爆炸矩阵', probe: probeD8 },
  { id: 'D9', order: 9, name: '全生命周期状态迁移', probe: probeD9 },
  { id: 'D10', order: 10, name: 'CMS/Growth/Governance/Admin 运营后台', probe: probeD10 },
  { id: 'D11', order: 11, name: '订单/Escrow/FeeRouter/PSP 财务一致性', probe: probeD11 },
  { id: 'D12', order: 12, name: '异常运营恢复链路', probe: probeD12 },
  { id: 'D13', order: 13, name: '国际化边界', probe: probeD13 },
  { id: 'D14', order: 14, name: '安全攻击与重放防护', probe: probeD14 },
  { id: 'D15', order: 15, name: '真实运营日模拟', probe: probeD15 },
  { id: 'D16', order: 16, name: 'Runbook 完整性审计', probe: probeD16 },
  { id: 'D17', order: 17, name: '灾难恢复与故障演练', probe: probeD17 },
  { id: 'D18', order: 18, name: '监控与告警覆盖率', probe: probeD18 },
  { id: 'D19', order: 19, name: '发布/回滚/热修变更管理', probe: probeD19 },
  { id: 'D20', order: 20, name: 'Production Readiness Review 多维签审', probe: probeD20 },
  { id: 'D21', order: 21, name: 'Governance 提案/投票/委托链', probe: probeD21 },
  { id: 'D22', order: 22, name: 'Governance 参数/质押/链上观测', probe: probeD22 },
  { id: 'D23', order: 23, name: 'Governance 权限边界与主理人走廊', probe: probeD23 },
  { id: 'D24', order: 24, name: 'Full Surface Coverage Audit', probe: probeD24 },
];

async function main() {
  spawnSync(
    'node',
    [path.join(root, 'scripts/dev/gen-phase2-testnet-surface-coverage-matrix.mjs'), '--evid-dir', evidDir],
    { cwd: root, encoding: 'utf8' },
  );

  const results = [];
  for (const t of tracks) {
    const out = t.probe.constructor.name === 'AsyncFunction' ? await t.probe() : t.probe();
    results.push({
      id: t.id,
      order: t.order,
      name: t.name,
      status: out.status,
      gaps: out.gaps,
      notes: out.notes,
      soak_deferred:
        out.gaps.length > 0 &&
        out.gaps.every(
          (g) =>
            g.startsWith('TN-P1-009') ||
            g.includes('P2FC') ||
            g.includes('ops-day soak') ||
            g.includes('P2FC 72h COMPLETED'),
        ),
      blocking:
        out.status !== 'PASS' &&
        out.status !== 'DEFER_③' &&
        !(
          out.gaps.length > 0 &&
          out.gaps.every(
            (g) =>
              g.startsWith('TN-P1-009') ||
              g.includes('P2FC') ||
              g.includes('ops-day soak') ||
              g.includes('P2FC 72h COMPLETED'),
          )
        ),
    });
  }

  const soakDoneProbe = fileExists(path.join(root, 'evidence/P2FC_SOAK_72H_STAGING/COMPLETED.json'));
  const missingCoverage = results.filter((r) => {
    if (r.status === 'PASS') return false;
    if (!soakDoneProbe && r.soak_deferred) return false;
    return true;
  }).length;
  const evidenceGap = results.reduce((n, r) => {
    if (!soakDoneProbe && r.soak_deferred) return n;
    return n + r.gaps.length;
  }, 0);
  const deepBlocking = results.filter((r) => r.blocking).length;
  const enterpriseTracks = results.filter((r) => {
    const n = Number(r.id.slice(1));
    return n >= 8 && n <= 15;
  });
  const operationalTracks = results.filter((r) => {
    const n = Number(r.id.slice(1));
    return n >= 16 && n <= 20;
  });
  const governanceTracks = results.filter((r) => {
    const n = Number(r.id.slice(1));
    return n >= 21 && n <= 23;
  });
  const surfaceMatrix = readJson(path.join(evidDir, 'surface-coverage-matrix.v1.json'));
  const countsForClosure = (r) => {
    if (r.status === 'PASS') return true;
    if (!soakDoneProbe && r.soak_deferred) return true;
    return false;
  };
  const passCount = results.filter((r) => r.status === 'PASS').length;
  const effectivePassCount = results.filter(countsForClosure).length;

  const payload = {
    schema: 'traveltrust.phase2_testnet_deep_closure.v4',
    standard: 'TT-PHASE2-TESTNET-CLOSURE-GOVERNANCE-STANDARD',
    addendum: 'Deep + Enterprise + Operational + Governance + Full Surface',
    at: new Date().toISOString(),
    execution_order: 'D1→D24',
    tracks: results,
    enterprise_closure: {
      tracks: enterpriseTracks.map(({ id, name, status, gaps }) => ({ id, name, status, gap_count: gaps.length })),
      coverage_pct: Math.round((enterpriseTracks.filter((r) => r.status === 'PASS').length / enterpriseTracks.length) * 100),
      enterprise_pass: enterpriseTracks.filter((r) => r.status === 'PASS').length,
      enterprise_total: enterpriseTracks.length,
    },
    operational_readiness: {
      tracks: operationalTracks.map(({ id, name, status, gaps }) => ({ id, name, status, gap_count: gaps.length })),
      coverage_pct: Math.round((operationalTracks.filter((r) => r.status === 'PASS').length / operationalTracks.length) * 100),
      operational_pass: operationalTracks.filter((r) => r.status === 'PASS').length,
      operational_total: operationalTracks.length,
    },
    governance_closure: {
      tracks: governanceTracks.map(({ id, name, status, gaps }) => ({ id, name, status, gap_count: gaps.length })),
      coverage_pct: Math.round((governanceTracks.filter((r) => r.status === 'PASS').length / governanceTracks.length) * 100),
      governance_pass: governanceTracks.filter((r) => r.status === 'PASS').length,
      governance_total: governanceTracks.length,
    },
    full_surface_coverage: surfaceMatrix?.summary ?? null,
    summary: {
      pass: passCount,
      partial: results.filter((r) => r.status === 'PARTIAL').length,
      open: results.filter((r) => r.status === 'OPEN').length,
      tracks_total: results.length,
      missing_coverage: missingCoverage,
      evidence_gap: evidenceGap,
      deep_blocking: deepBlocking,
      enterprise_coverage_pct: Math.round((enterpriseTracks.filter((r) => r.status === 'PASS').length / enterpriseTracks.length) * 100),
      operational_readiness_pct: Math.round((operationalTracks.filter((r) => r.status === 'PASS').length / operationalTracks.length) * 100),
      governance_closure_pct: Math.round((governanceTracks.filter((r) => r.status === 'PASS').length / governanceTracks.length) * 100),
      full_closure_coverage_pct: Math.round((effectivePassCount / results.length) * 100),
      surface_coverage_pct: surfaceMatrix?.summary?.surface_coverage_pct ?? null,
      untested_ui_element: surfaceMatrix?.summary?.untested_ui_element ?? null,
      untested_user_action: surfaceMatrix?.summary?.untested_user_action ?? null,
    },
  };

  fs.mkdirSync(evidDir, { recursive: true });
  fs.writeFileSync(path.join(evidDir, 'probe-deep-closure.json'), JSON.stringify(payload, null, 2) + '\n');
  console.log(
    `deep-closure: missing_coverage=${missingCoverage} evidence_gap=${evidenceGap} deep_blocking=${deepBlocking}`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
