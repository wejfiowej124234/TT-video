#!/usr/bin/env node
/**
 * G1 Reality Audit — re-validate Master Matrix G1 blockers vs code, evidence, runtime.
 *
 *   node scripts/dev/validate-g1-reality-audit.cjs [--evidence-dir DIR]
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '../..');
const REG_PATH = path.join(ROOT, 'registry/production-readiness-master-matrix.v1.yaml');
const DEFECTS = path.join(ROOT, 'evidence/manual-uat/summary/defects-registry.json');
const SESSIONS = path.join(ROOT, 'evidence/manual-uat/sessions');

const RT_P0_CLOSED_UTC = '2026-07-04T01:15:00Z';
const STALE_SESSION = '20260630T142222Z';

function read(rel) {
  const p = path.join(ROOT, rel);
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null;
}

function readJson(rel) {
  const p = path.join(ROOT, rel);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function gapStatus(regText, id) {
  const re = new RegExp(`- id: ${id}\\r?\\n(?:    .+\\r?\\n)*?    status: ([A-Z_]+)`);
  const m = regText.match(re);
  return m ? m[1] : null;
}

function curlOk(url) {
  try {
    execSync(`curl -sf --max-time 5 "${url}"`, { stdio: 'pipe' });
    return true;
  } catch {
    return false;
  }
}

function latestLocalC1e2Session() {
  const p = path.join(SESSIONS, STALE_SESSION, 'SUMMARY.json');
  if (!fs.existsSync(p)) return null;
  const d = readJson(`evidence/manual-uat/sessions/${STALE_SESSION}/SUMMARY.json`);
  if (!d || d.track !== 'manual-uat-c1e2') return null;
  return d;
}

function openP0P1Defects() {
  const d = readJson('evidence/manual-uat/summary/defects-registry.json');
  if (!d) return null;
  return (d.defects || []).filter(
    (x) => x.status !== 'CLOSED' && x.status !== 'VERIFIED' && ['P0', 'P1'].includes(x.priority)
  );
}

function personaStats(items) {
  const out = {};
  for (const it of items || []) {
    const p = it.persona;
    if (!p) continue;
    out[p] = out[p] || { pass: 0, total: 0 };
    out[p].total += 1;
    if (it.ui_status === 'PASS') out[p].pass += 1;
  }
  return out;
}

function isTracked(rel) {
  try {
    const out = execSync(`git ls-files --error-unmatch "${rel.replace(/\\/g, '/')}"`, {
      cwd: ROOT,
      stdio: 'pipe',
    }).toString();
    return out.trim().length > 0;
  } catch {
    return false;
  }
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
          'evidence/GO_production_readiness/g1-reality-audit',
          process.env.AUDIT_STAMP || new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, 'Z')
        );

  const reg = read(REG_PATH) || '';
  const apiUp = curlOk('http://127.0.0.1:8080/health/ready');
  const feUp = curlOk('http://127.0.0.1:3012/');
  const openDefects = openP0P1Defects();
  const session = latestLocalC1e2Session();
  const sessionTracked = isTracked(`evidence/manual-uat/sessions/${STALE_SESSION}/SUMMARY.json`);
  const mt = session?.manual_test || {};
  const sessionAllPass = mt.pass === 27 && mt.total === 27 && (mt.fail || 0) === 0;
  const personas = personaStats(session?.checklist_items);

  const findings = [];

  // PRM-UAT-B001
  findings.push({
    id: 'PRM-UAT-B001',
    verdict: 'STILL_BLOCKS',
    reason:
      'No post–Runtime-Truth-P0 signed master UAT session in repo; 20260630 session predates RT-P0 and is untracked',
    action: 'Re-run bash scripts/dev/run-production-readiness-wave-1-1-g1.sh · commit sessions/<stamp>/',
  });

  // PRM-UAT-B002 / B003 — stale session not sufficient
  findings.push({
    id: 'PRM-UAT-B002',
    verdict: sessionAllPass && personas.C1?.pass === personas.C1?.total ? 'STALE_EVIDENCE_ONLY' : 'STILL_BLOCKS',
    reason: sessionAllPass
      ? `Local C1 ${personas.C1?.pass}/${personas.C1?.total} PASS in ${STALE_SESSION} but pre–RT-P0 · untracked=${!sessionTracked}`
      : 'C1 corridor unsigned',
    action: 'Re-walk C1 after RT-P0 · commit evidence',
  });

  findings.push({
    id: 'PRM-UAT-B003',
    verdict: sessionAllPass && personas.C2?.pass === personas.C2?.total ? 'STALE_EVIDENCE_ONLY' : 'STILL_BLOCKS',
    reason: 'C2/C4 merchant corridor needs fresh post–RT-P0 sign-off',
    action: 'Re-walk C2/C4 · commit evidence',
  });

  // PRM-UAT-B004 — ② staging
  findings.push({
    id: 'PRM-UAT-B004',
    verdict: 'STILL_BLOCKS',
    reason: 'Staging persona browser matrix (C1–C4, E2) ≠ local ① session · belongs to ②',
    action: 'Execute staging UAT after ② GO prerequisites · E1 skipped on staging',
  });

  // PRM-UAT-B005
  findings.push({
    id: 'PRM-UAT-B005',
    verdict: openDefects && openDefects.length === 0 ? 'CLOSE' : 'STILL_BLOCKS',
    reason:
      openDefects === null
        ? 'defects-registry missing'
        : openDefects.length === 0
          ? 'evidence/manual-uat/summary/defects-registry.json P0/P1 = 0 (in repo)'
          : `${openDefects.length} open P0/P1 defects`,
    action: openDefects?.length === 0 ? 'Close in Matrix — defect gate clear' : 'Clear defect register',
  });

  // PRM-UAT-B006
  findings.push({
    id: 'PRM-UAT-B006',
    verdict: apiUp && feUp ? 'CLOSE' : 'STILL_BLOCKS',
    reason: apiUp && feUp ? 'Local API :8080/ready + FE :3012 UP (probe now)' : 'Local stack down',
    action: apiUp && feUp ? 'Close — runtime preflight satisfied' : 'start_dev.sh / start-api-with-seed',
  });

  // PRM-MVAL-B001
  findings.push({
    id: 'PRM-MVAL-B001',
    verdict: 'STILL_BLOCKS',
    reason: 'Product mainline Manual UAT step not complete with committed post–RT-P0 evidence',
    action: 'Same as PRM-UAT-B001 wave 1.1 closure',
  });

  // PRM-MVAL-B002
  findings.push({
    id: 'PRM-MVAL-B002',
    verdict: openDefects && openDefects.length === 0 ? 'CLOSE' : 'STILL_BLOCKS',
    reason: 'Linked to defects-registry P0/P1 (same as PRM-UAT-B005)',
    action: openDefects?.length === 0 ? 'Close in Matrix' : 'Clear defects',
  });

  // PRM-MVAL-B003
  findings.push({
    id: 'PRM-MVAL-B003',
    verdict: 'STILL_BLOCKS',
    reason: 'PER not opened/passed — separate formal gate',
    action: 'TT-PRODUCTION-ENTRY-REVIEW after G1 UAT matrix green',
  });

  const toClose = findings.filter((f) => f.verdict === 'CLOSE').map((f) => f.id);
  const stillBlocks = findings.filter((f) => f.verdict === 'STILL_BLOCKS').map((f) => f.id);
  const stale = findings.filter((f) => f.verdict === 'STALE_EVIDENCE_ONLY').map((f) => f.id);

  fs.mkdirSync(EVID_DIR, { recursive: true });
  const signoff = {
    review_id: 'G1-REALITY-AUDIT-20260704',
    stamp: path.basename(EVID_DIR),
    machine_keys: {
      TT_G1_REALITY_AUDIT: 'COMPLETE',
      TT_PRODUCTION_READINESS_G1_GATE: 'IN_PROGRESS',
    },
    runtime_probe: { api_8080_ready: apiUp, frontend_3012: feUp, probed_utc: new Date().toISOString() },
    defects: { open_p0_p1: openDefects ? openDefects.length : null, registry: 'evidence/manual-uat/summary/defects-registry.json' },
    stale_local_session: {
      stamp: STALE_SESSION,
      all_pass_27: sessionAllPass,
      tracked_in_git: sessionTracked,
      predates_runtime_truth_p0: true,
      runtime_truth_p0_closed_utc: RT_P0_CLOSED_UTC,
    },
    matrix_actions: { close: toClose, remain_open: stillBlocks, stale_do_not_close: stale },
    findings,
    release_train: {
      route: 'B — G1 → G2 → G3',
      defer_p1: ['PRM-CI-D001', 'PRM-GUARD-D001', 'PRM-MIG-D001'],
    },
  };

  fs.writeFileSync(path.join(EVID_DIR, 'g1-reality-audit-signoff.json'), `${JSON.stringify(signoff, null, 2)}\n`);

  console.log('G1 Reality Audit');
  console.log('─'.repeat(60));
  for (const f of findings) {
    console.log(`${f.verdict.padEnd(20)} ${f.id} — ${f.reason}`);
  }
  console.log('─'.repeat(60));
  console.log(`Close in Matrix: ${toClose.join(', ') || 'none'}`);
  console.log(`Remain OPEN: ${stillBlocks.join(', ')}`);
  console.log(`Stale (do not auto-close): ${stale.join(', ') || 'none'}`);
  console.log(`Evidence: ${path.relative(ROOT, EVID_DIR)}`);
}

main();
