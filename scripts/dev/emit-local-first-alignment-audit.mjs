#!/usr/bin/env node
/**
 * Local-First Alignment Audit · local repo = sole dev SSOT
 *
 *   node scripts/dev/emit-local-first-alignment-audit.mjs [--evidence-dir DIR]
 *   node scripts/dev/emit-local-first-alignment-audit.mjs --use-meta-cache   # dev only
 *
 * Emits: TT_LOCAL_FIRST_ALIGNMENT: 100_PERCENT_ALIGNED | NOT_100_PERCENT_ALIGNED
 * SSOT: docs/runbook/TT-LOCAL-FIRST-CONVERGENCE.md
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  evalTnP010GraduationGateCli,
  tnP010GraduationNote,
} from './lib/eval-tn-p010-graduation-gate-cli.mjs';

const root = process.cwd();
const stagingApi = (process.env.STAGING_API_BASE || 'https://tt-api-staging.fly.dev').replace(/\/$/, '');
const stagingWeb = (process.env.STAGING_WEB_BASE || 'https://tt-web-staging.fly.dev').replace(/\/$/, '');
const args = process.argv.slice(2);
function cliArg(name, def = '') {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : def;
}
const evidenceRunDir = cliArg('--evidence-dir', '');
const useMetaCache = args.includes('--use-meta-cache');

const stamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
const outBase = path.join(root, 'evidence/GO_phase2_testnet_graduation');
const outDir = evidenceRunDir || path.join(outBase, `local-first-alignment-audit-${stamp}`);

function sh(cmd, a) {
  return spawnSync(cmd, a, { cwd: root, encoding: 'utf8' });
}

function gitIsAncestor(ancestor, descendant) {
  if (!ancestor || !descendant) return false;
  return sh('git', ['merge-base', '--is-ancestor', ancestor, descendant]).status === 0;
}

const headSha = sh('git', ['rev-parse', 'HEAD']).stdout.trim();
const porcelain = sh('git', ['status', '--porcelain']).stdout.split('\n').filter(Boolean);
const ssotPath = (l) => l.slice(3).trim().replace(/^"|"$/g, '').split(' -> ').pop();

const CLOSURE_PATHS = [
  'scripts/dev/run-phase2-final-single-ssot-reconciliation.sh',
  'scripts/dev/run-local-first-alignment-closure.sh',
  'scripts/dev/emit-freeze-lift-execution-report.mjs',
  'scripts/dev/emit-local-first-alignment-audit.mjs',
  'scripts/dev/lib/staging-adm-u01-env.sh',
  'scripts/gates/run-admin-rbac-staging-matrix.py',
  'frontend/e2e/helpers/adminCapabilitiesSession.ts',
];

const DEPLOY_SSOT = ['crates/', 'frontend/', 'contracts/', 'registry/', 'deploy/'];
const EXEMPT_PREFIXES = ['docs/', 'evidence/', '.cursor/', 'frontend/evidence/'];

/** Phase③ WIP — isolated; must not count as Phase② deploy-path drift. */
const PHASE3_WIP_PREFIXES = [
  'contracts/script/',
  'contracts/src/GovernanceTreasury',
  'contracts/src/Ttg',
  'contracts/src/upgrade/',
  'contracts/test/Ttg',
  'contracts/test/RegionStewardStakePool',
  'frontend/app/governance/params/',
  'frontend/app/admin/growth/',
  'frontend/app/admin/official/',
  'crates/api/src/routes/itineraries/custom/',
  'crates/api/src/db/itinerary_drafts',
  'deploy/fly/tt-soak-watcher-staging/',
];

function isPhase3Wip(p) {
  return PHASE3_WIP_PREFIXES.some((x) => p === x.replace(/\/$/, '') || p.startsWith(x));
}

const closureDirty = CLOSURE_PATHS.filter((p) =>
  porcelain.some((l) => {
    const fp = ssotPath(l);
    return fp === p || fp.startsWith(`${p}/`);
  }),
);

const deployDirty = porcelain.filter((l) => DEPLOY_SSOT.some((p) => ssotPath(l).startsWith(p)));
const deployNonE2e = deployDirty.filter((l) => !ssotPath(l).startsWith('frontend/e2e/'));
const deployPhase3 = deployNonE2e.filter((l) => isPhase3Wip(ssotPath(l)));
const deployPhase2Uncommitted = deployNonE2e.filter((l) => !isPhase3Wip(ssotPath(l)));

const nonExemptDirty = porcelain.filter((l) => {
  const p = ssotPath(l);
  if (EXEMPT_PREFIXES.some((x) => p.startsWith(x))) return false;
  if (CLOSURE_PATHS.includes(p)) return false;
  return true;
});

const metaPath = path.join(root, 'evidence/.tmp-ssot-meta.json');
const webMetaPath = path.join(root, 'evidence/.tmp-ssot-web-meta.json');

function fetchMeta(url, outPath) {
  const r = sh('curl', ['--noproxy', '*', '-sS', '--max-time', '45', url, '-o', outPath]);
  if (r.status !== 0) return {};
  try {
    return JSON.parse(fs.readFileSync(outPath, 'utf8'));
  } catch {
    return {};
  }
}

function loadMetaCached(outPath, url) {
  if (useMetaCache && fs.existsSync(outPath)) {
    try {
      return JSON.parse(fs.readFileSync(outPath, 'utf8'));
    } catch {
      /* refresh */
    }
  }
  return fetchMeta(url, outPath);
}

const meta = loadMetaCached(metaPath, `${stagingApi}/meta`);
const webMeta = loadMetaCached(webMetaPath, `${stagingWeb}/meta`);
const stagingSha = meta.build?.git_sha || '';
const webSha = webMeta.build?.git_sha || '';

function latestEvidenceDir(base, prefix) {
  try {
    const hits = fs
      .readdirSync(base)
      .filter((d) => d.startsWith(prefix))
      .sort()
      .reverse();
    return hits[0] ? path.join(base, hits[0]) : null;
  } catch {
    return null;
  }
}

function readJsonSafe(p) {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

const pv = path.join(root, 'evidence/GO_phase2_testnet_perfect_validation');
const probes = {};
function probeRunPass(dir, marker) {
  if (!dir) return false;
  const run = fs.readdirSync(dir).find((f) => f.startsWith('run-'));
  if (!run) return false;
  return marker.test(fs.readFileSync(path.join(dir, run), 'utf8'));
}
const d6Dir = latestEvidenceDir(pv, 'tn-p1-d6-reliability-surface-');
probes.D6 = probeRunPass(d6Dir, /TT_TN_P1_D6_RELIABILITY_SURFACE_EVIDENCE: PASS/);
const d24Dir = latestEvidenceDir(pv, 'tn-p1-d24-surface-');
probes.D24 = probeRunPass(d24Dir, /TT_TN_P1_D24_SURFACE_EVIDENCE: PASS/);
const tn010Gate = evalTnP010GraduationGateCli(root);
probes['TN-P1-010'] = tn010Gate.pass === true;
probes['TN-P1-010_gate'] = tn010Gate;

const dgRoot = path.join(root, 'evidence/GO_phase2_testnet_20260526/deep-release-gate');
let dg = readJsonSafe(path.join(dgRoot, 'latest-report.json'));
if (!dg) {
  const dirs = fs.existsSync(dgRoot)
    ? fs.readdirSync(dgRoot).filter((d) => /^\d{8}T/.test(d)).sort().reverse()
    : [];
  if (dirs[0]) dg = readJsonSafe(path.join(dgRoot, dirs[0], 'report.json'));
}
const dgExpectSha = dg?.expect_git_sha || '';
const dgOkBase = dg?.verdict === 'PASS' && dg?.release_gate === 'GO';
const dgOkAtHead = dgOkBase && dgExpectSha === headSha;
const dgOkAtStaging =
  dgOkBase && stagingSha && dgExpectSha === stagingSha && gitIsAncestor(stagingSha, headSha);
const dgOk = dgOkAtHead || dgOkAtStaging;
const g04 = dg?.gates?.find((g) => g.id === 'G04_ADMIN_RBAC');
const g04Ok = g04?.verdict === 'PASS' && !String(g04?.notes || '').includes('skipped');

const hatRoot = path.join(root, 'evidence/phase28-human-acceptance');
const hatDirs = fs.existsSync(hatRoot)
  ? fs.readdirSync(hatRoot).filter((d) => /^\d{8}T/.test(d)).sort().reverse()
  : [];
const hatOk =
  hatDirs[0] &&
  readJsonSafe(path.join(hatRoot, hatDirs[0], 'hat-findings.json'))?.verdict === 'PASS';

const admRoot = path.join(root, 'evidence/GO_staging_admin_rbac_matrix');
const admRuns = fs.existsSync(admRoot)
  ? fs.readdirSync(admRoot).filter((d) => d.startsWith('run_') || d.startsWith('adm_u01_')).sort().reverse()
  : [];
let admOk = false;
if (admRuns[0]) {
  const rp = readJsonSafe(path.join(admRoot, admRuns[0], 'report.json'));
  admOk = rp?.release_gate === 'GO';
}

const localAheadOfStaging =
  stagingSha &&
  headSha !== stagingSha &&
  gitIsAncestor(stagingSha, headSha);
const runtimeDrift =
  stagingSha &&
  headSha !== stagingSha &&
  !gitIsAncestor(stagingSha, headSha) &&
  !gitIsAncestor(headSha, stagingSha);

const gaps = [];
if (closureDirty.length) gaps.push({ id: 'GAP-CLOSURE-WT', sev: 'P0', items: closureDirty });
if (deployPhase2Uncommitted.length) {
  gaps.push({
    id: 'GAP-DEPLOY-SSOT',
    sev: 'P1',
    count: deployPhase2Uncommitted.length,
    sample: deployPhase2Uncommitted.slice(0, 8).map(ssotPath),
    note: 'Phase② deploy-path uncommitted — not staging runtime drift until S5 deploy',
  });
}
if (deployPhase3.length) {
  gaps.push({
    id: 'GAP-PHASE3-WIP-ISOLATED',
    sev: 'INFO',
    count: deployPhase3.length,
    note: 'Phase③ WIP in worktree — must stay isolated from Phase② deploy',
  });
}
if (nonExemptDirty.length) {
  const tracked = nonExemptDirty.filter((l) => !l.startsWith('??'));
  if (tracked.length) {
    gaps.push({
      id: 'GAP-WT-TRACKED',
      sev: 'P1',
      count: tracked.length,
      sample: tracked.slice(0, 10).map(ssotPath),
      note: 'scripts/docs tracked dirty — local convergence; ≠ staging runtime drift',
    });
  }
}
if (localAheadOfStaging) {
  gaps.push({
    id: 'GAP-LOCAL-AHEAD-UNDEPLOYED',
    sev: 'INFO',
    note: `head=${headSha.slice(0, 12)} staging=${stagingSha.slice(0, 12)} — Local First; bring at S5 deploy only`,
  });
} else if (runtimeDrift) {
  gaps.push({
    id: 'GAP-RUNTIME-DRIFT',
    sev: 'P0',
    note: `head=${headSha.slice(0, 12)} staging=${stagingSha.slice(0, 12)} — not ancestor/descendant`,
  });
} else if (stagingSha && headSha !== stagingSha) {
  gaps.push({
    id: 'GAP-API-SHA',
    sev: 'P0',
    note: `api=${stagingSha.slice(0, 12)} head=${headSha.slice(0, 12)}`,
  });
}
if (webSha && webSha !== stagingSha) {
  gaps.push({
    id: 'GAP-WEB-API-SHA',
    sev: 'P0',
    note: `web=${webSha.slice(0, 12)} api=${stagingSha.slice(0, 12)}`,
  });
}
if (!dgOk) gaps.push({ id: 'GAP-DEEP-GATE', sev: 'P0', note: 'Deep gate not PASS/GO @ HEAD or staging deployed SHA' });
if (!g04Ok) gaps.push({ id: 'GAP-DEEP-GATE-G04', sev: 'P0', note: 'G04 ADM-U01 not PASS inline' });
if (!admOk) gaps.push({ id: 'GAP-ADM-U01', sev: 'P1', note: 'GO_staging_admin_rbac_matrix latest not GO' });
if (!probes.D6 || !probes.D24 || !probes['TN-P1-010']) {
  gaps.push({
    id: 'GAP-EVIDENCE-HISTORICAL',
    sev: 'INFO',
    note: `TN-P1-010/D24/D6 historical gates · TN-P1-010: ${tnP010GraduationNote(tn010Gate)}`,
  });
}
if (!hatOk) gaps.push({ id: 'GAP-HAT', sev: 'P1', note: 'Phase28 HAT not PASS @ latest evidence' });

const p0 = gaps.filter((g) => g.sev === 'P0');
const aligned100 =
  p0.length === 0 &&
  closureDirty.length === 0 &&
  deployPhase2Uncommitted.length === 0 &&
  !runtimeDrift &&
  dgOk &&
  g04Ok &&
  admOk &&
  probes.D6 &&
  probes.D24 &&
  probes['TN-P1-010'] &&
  hatOk;

const verdict = aligned100 ? '100_PERCENT_ALIGNED' : 'NOT_100_PERCENT_ALIGNED';

const report = {
  schema: 'traveltrust.local_first_alignment_audit.v2',
  at: stamp,
  head: headSha,
  staging_api_sha: stagingSha,
  staging_web_sha: webSha,
  local_first: {
    local_ahead_undeployed: localAheadOfStaging,
    runtime_drift: runtimeDrift,
    phase3_wip_isolated_count: deployPhase3.length,
  },
  verdict,
  tt_marker: `TT_LOCAL_FIRST_ALIGNMENT: ${verdict}`,
  gaps,
  probes: { ...probes, DEEP_GATE: dgOk, G04: g04Ok, ADM_U01: admOk, HAT: hatOk },
  wt: {
    porcelain_count: porcelain.length,
    closure_dirty: closureDirty,
    deploy_phase2_uncommitted: deployPhase2Uncommitted.length,
    deploy_phase3_isolated: deployPhase3.length,
    non_exempt_dirty: nonExemptDirty.length,
  },
};

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'audit.json'), JSON.stringify(report, null, 2) + '\n');
const infoGaps = gaps.filter((g) => g.sev === 'INFO');
const p1Gaps = gaps.filter((g) => g.sev === 'P1');
const md = [
  '# Local-First Alignment Audit',
  '',
  `**At:** ${stamp}`,
  `**HEAD (dev SSOT):** \`${headSha}\``,
  `**Staging API runtime:** \`${stagingSha || 'n/a'}\``,
  `**Staging Web runtime:** \`${webSha || 'n/a'}\``,
  `**Local ahead undeployed:** ${localAheadOfStaging ? 'yes' : 'no'}`,
  `**Runtime drift:** ${runtimeDrift ? 'yes' : 'no'}`,
  '',
  '```text',
  report.tt_marker,
  '```',
  '',
  `## P0 Gaps (${p0.length})`,
  '',
  ...(p0.length ? p0.map((g) => `- **${g.id}**: ${g.note || JSON.stringify(g.items || g.sample || g.count)}`) : ['- none']),
  '',
  `## P1 / INFO (${p1Gaps.length + infoGaps.length})`,
  '',
  ...(p1Gaps.length + infoGaps.length
    ? [...p1Gaps, ...infoGaps].map(
        (g) => `- **${g.id}** (${g.sev}): ${g.note || JSON.stringify(g.items || g.sample || g.count)}`,
      )
    : ['- none']),
  '',
  '**SSOT:** [TT-LOCAL-FIRST-CONVERGENCE.md](../../docs/runbook/TT-LOCAL-FIRST-CONVERGENCE.md)',
  '',
  '**Honest:** WT / evidence gaps ≠ staging runtime drift when `local_ahead_undeployed=true`.',
].join('\n');
fs.writeFileSync(path.join(outDir, 'SUMMARY.md'), md + '\n');
console.log(report.tt_marker);
if (localAheadOfStaging && !runtimeDrift) {
  console.log('TT_LOCAL_FIRST_RUNTIME_DRIFT: NONE');
}
process.exit(aligned100 ? 0 : 2);
