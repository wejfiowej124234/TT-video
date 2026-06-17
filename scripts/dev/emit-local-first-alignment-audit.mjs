#!/usr/bin/env node
/**
 * Local-First Alignment Audit · WT = sole SSOT
 *
 *   node scripts/dev/emit-local-first-alignment-audit.mjs [--evidence-dir DIR]
 *
 * Emits: TT_LOCAL_FIRST_ALIGNMENT: 100_PERCENT_ALIGNED | NOT_100_PERCENT_ALIGNED
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  evalTnP010GraduationGateCli,
  tnP010GraduationNote,
  tnP010GraduationStatus,
} from './lib/eval-tn-p010-graduation-gate-cli.mjs';

const root = process.cwd();
const args = process.argv.slice(2);
function cliArg(name, def = '') {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : def;
}
const evidenceRunDir = cliArg('--evidence-dir', '');

const stamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
const outBase = path.join(root, 'evidence/GO_phase2_testnet_graduation');
const outDir = evidenceRunDir || path.join(outBase, `local-first-alignment-audit-${stamp}`);

function sh(cmd, a) {
  return spawnSync(cmd, a, { cwd: root, encoding: 'utf8' });
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

const closureDirty = CLOSURE_PATHS.filter((p) =>
  porcelain.some((l) => {
    const fp = ssotPath(l);
    return fp === p || fp.startsWith(`${p}/`);
  }),
);

const deployDirty = porcelain.filter((l) => DEPLOY_SSOT.some((p) => ssotPath(l).startsWith(p)));
const deployNonE2e = deployDirty.filter((l) => !ssotPath(l).startsWith('frontend/e2e/'));

const nonExemptDirty = porcelain.filter((l) => {
  const p = ssotPath(l);
  if (EXEMPT_PREFIXES.some((x) => p.startsWith(x))) return false;
  if (CLOSURE_PATHS.includes(p)) return false;
  return true;
});

const metaPath = path.join(root, 'evidence/.tmp-ssot-meta.json');
let meta = {};
try {
  meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
} catch {
  sh('curl', ['--noproxy', '*', '-sS', '--max-time', '30', 'https://tt-api-staging.fly.dev/meta', '-o', metaPath]);
  meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
}
const webMetaPath = path.join(root, 'evidence/.tmp-ssot-web-meta.json');
let webMeta = {};
try {
  webMeta = JSON.parse(fs.readFileSync(webMetaPath, 'utf8'));
} catch {
  sh('curl', ['--noproxy', '*', '-sS', '--max-time', '30', 'https://tt-web-staging.fly.dev/meta', '-o', webMetaPath]);
  webMeta = JSON.parse(fs.readFileSync(webMetaPath, 'utf8'));
}
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
const dgOk = dg?.verdict === 'PASS' && dg?.release_gate === 'GO' && (dg?.expect_git_sha || '') === headSha;
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
  ? fs.readdirSync(admRoot).filter((d) => d.startsWith('run_')).sort().reverse()
  : [];
let admOk = false;
if (admRuns[0]) {
  const rp = readJsonSafe(path.join(admRoot, admRuns[0], 'report.json'));
  admOk = rp?.release_gate === 'GO';
}

const gaps = [];
if (closureDirty.length) gaps.push({ id: 'GAP-CLOSURE-WT', sev: 'P0', items: closureDirty });
if (deployNonE2e.length) gaps.push({ id: 'GAP-DEPLOY-SSOT', sev: 'P0', count: deployNonE2e.length });
if (nonExemptDirty.length) {
  const tracked = nonExemptDirty.filter((l) => !l.startsWith('??'));
  if (tracked.length) gaps.push({ id: 'GAP-WT-TRACKED', sev: 'P0', count: tracked.length, sample: tracked.slice(0, 10).map(ssotPath) });
}
if (stagingSha !== headSha) gaps.push({ id: 'GAP-API-SHA', sev: 'P0', note: `api=${stagingSha.slice(0, 12)} head=${headSha.slice(0, 12)}` });
if (webSha !== headSha) gaps.push({ id: 'GAP-WEB-SHA', sev: 'P0', note: `web=${webSha.slice(0, 12)} head=${headSha.slice(0, 12)}` });
if (!dgOk) gaps.push({ id: 'GAP-DEEP-GATE', sev: 'P0', note: 'Deep gate not PASS/GO @ HEAD' });
if (!g04Ok) gaps.push({ id: 'GAP-DEEP-GATE-G04', sev: 'P0', note: 'G04 ADM-U01 not PASS inline' });
if (!admOk) gaps.push({ id: 'GAP-ADM-U01', sev: 'P0', note: 'GO_staging_admin_rbac_matrix latest not GO' });
if (!probes.D6 || !probes.D24 || !probes['TN-P1-010']) gaps.push({ id: 'GAP-EVIDENCE', sev: 'P0', note: `TN-P1-010/D24/D6 not all PASS @ HEAD · TN-P1-010: ${tnP010GraduationNote(tn010Gate)}` });
if (!hatOk) gaps.push({ id: 'GAP-HAT', sev: 'P0', note: 'Phase28 HAT not PASS' });

const p0 = gaps.filter((g) => g.sev === 'P0');
const aligned100 =
  p0.length === 0 &&
  closureDirty.length === 0 &&
  deployNonE2e.length === 0 &&
  stagingSha === headSha &&
  webSha === headSha &&
  dgOk &&
  g04Ok &&
  admOk &&
  probes.D6 &&
  probes.D24 &&
  probes['TN-P1-010'] &&
  hatOk;

const verdict = aligned100 ? '100_PERCENT_ALIGNED' : 'NOT_100_PERCENT_ALIGNED';

const report = {
  schema: 'traveltrust.local_first_alignment_audit.v1',
  at: stamp,
  head: headSha,
  staging_api_sha: stagingSha,
  staging_web_sha: webSha,
  verdict,
  tt_marker: `TT_LOCAL_FIRST_ALIGNMENT: ${verdict}`,
  gaps,
  probes: { ...probes, DEEP_GATE: dgOk, G04: g04Ok, ADM_U01: admOk, HAT: hatOk },
  wt: {
    porcelain_count: porcelain.length,
    closure_dirty: closureDirty,
    deploy_non_e2e_dirty: deployNonE2e.length,
    non_exempt_dirty: nonExemptDirty.length,
  },
};

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'audit.json'), JSON.stringify(report, null, 2) + '\n');
const md = [
  '# Local-First Alignment Audit',
  '',
  `**At:** ${stamp}`,
  `**HEAD:** \`${headSha}\``,
  `**Staging API:** \`${stagingSha}\``,
  `**Staging Web:** \`${webSha}\``,
  '',
  '```text',
  report.tt_marker,
  '```',
  '',
  p0.length ? `## P0 Gaps (${p0.length})` : '## P0 Gaps',
  '',
  ...(p0.length ? p0.map((g) => `- **${g.id}**: ${g.note || JSON.stringify(g.items || g.sample || g.count)}`) : ['- none']),
  '',
  '**Honest:** 100% ALIGNED required before formal 72h soak + Graduation CLOSED.',
].join('\n');
fs.writeFileSync(path.join(outDir, 'SUMMARY.md'), md + '\n');
console.log(report.tt_marker);
process.exit(aligned100 ? 0 : 2);
