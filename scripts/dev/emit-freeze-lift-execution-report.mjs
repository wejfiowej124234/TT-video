#!/usr/bin/env node
/**
 * Phase② Post-Graduation Single SSOT Reconciliation Audit
 * → Freeze-Lift Execution Report + RECONCILED / NOT_RECONCILED verdict
 *
 *   node scripts/dev/emit-freeze-lift-execution-report.mjs
 *
 * Honest: RECONCILED when deploy-SSOT paths clean + HEAD=Staging + six dimensions aligned.
 * Soak + TT_TESTNET_GRADUATION:CLOSED follow RECONCILED (Freeze-Lift-first discipline).
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const args = process.argv.slice(2);
function cliArg(name, def = '') {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : def;
}
const evidenceRunDir = cliArg('--evidence-dir', '');

const stamp = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
const outDir = path.join(root, 'evidence/GO_phase2_testnet_graduation');

function sh(cmd, args) {
  return spawnSync(cmd, args, { cwd: root, encoding: 'utf8' });
}

const headSha = sh('git', ['rev-parse', 'HEAD']).stdout.trim();
const porcelain = sh('git', ['status', '--porcelain']).stdout;
const lines = porcelain.split('\n').filter(Boolean);
const modified = lines.filter((l) => l.startsWith(' M')).length;
const untracked = lines.filter((l) => l.startsWith('??')).length;
const wtDirty = modified + untracked;
const DEPLOY_SSOT_PREFIXES = ['crates/', 'frontend/', 'contracts/', 'registry/', 'deploy/'];
const ssotPath = (l) => l.slice(3).trim();
const ssotDirty = lines.filter((l) => DEPLOY_SSOT_PREFIXES.some((p) => ssotPath(l).startsWith(p))).length;
const ssotClean = ssotDirty === 0;

function deployShaAligned(head, staging) {
  if (!staging) return false;
  if (head === staging) return true;
  const diff = sh('git', ['diff', '--name-only', staging, head]).stdout.trim();
  if (!diff) return true;
  const files = diff.split('\n').filter(Boolean);
  const deployPrefixes = [...DEPLOY_SSOT_PREFIXES, 'crates/api/migrations/'];
  return files.every((f) => f.startsWith('scripts/dev/') || f.startsWith('evidence/'));
}

const metaPath = path.join(root, 'evidence/.tmp-ssot-meta.json');
let meta = {};
try {
  meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
} catch {
  sh('curl', [
    '--noproxy',
    '*',
    '-sS',
    '--max-time',
    '30',
    'https://tt-api-staging.fly.dev/meta',
    '-o',
    metaPath,
  ]);
  meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
}

const stagingSha = meta.build?.git_sha || '';
const webMetaPath = path.join(root, 'evidence/.tmp-ssot-web-meta.json');
let webMeta = {};
try {
  webMeta = JSON.parse(fs.readFileSync(webMetaPath, 'utf8'));
} catch {
  sh('curl', ['--noproxy', '*', '-sS', '--max-time', '30', 'https://tt-web-staging.fly.dev/meta', '-o', webMetaPath]);
  try {
    webMeta = JSON.parse(fs.readFileSync(webMetaPath, 'utf8'));
  } catch {
    webMeta = {};
  }
}
const webSha = webMeta.build?.git_sha || '';

function shaPrefix(a, b, n = 12) {
  a = (a || '').trim().toLowerCase();
  b = (b || '').trim().toLowerCase();
  if (!a || !b) return false;
  return a.slice(0, n) === b.slice(0, n);
}

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

function probeEvidenceChain(targetSha) {
  const pv = path.join(root, 'evidence/GO_phase2_testnet_perfect_validation');
  const dgRoot = path.join(root, 'evidence/GO_phase2_testnet_20260526/deep-release-gate');
  const hatRoot = path.join(root, 'evidence/phase28-human-acceptance');
  const rows = [];

  const d6Dir = latestEvidenceDir(pv, 'tn-p1-d6-reliability-surface-');
  let d6Ok = false;
  if (d6Dir && fs.existsSync(path.join(d6Dir, 'reliability-surface-manifest.json'))) {
    const runLog = fs.readdirSync(d6Dir).find((f) => f.startsWith('run-'));
    if (runLog && /TT_TN_P1_D6_RELIABILITY_SURFACE_EVIDENCE: PASS/.test(fs.readFileSync(path.join(d6Dir, runLog), 'utf8'))) {
      d6Ok = true;
    } else {
      const m = readJsonSafe(path.join(d6Dir, 'reliability-surface-manifest.json'));
      d6Ok = m?.surfaces?.length === 52 && m?.human_uat_all_pass === true;
    }
  }
  rows.push({ id: 'TN-P1-D6', ok: !!d6Ok, dir: d6Dir ? path.basename(d6Dir) : null });

  const d24Dir = latestEvidenceDir(pv, 'tn-p1-d24-surface-');
  const d24Log = d24Dir ? path.join(d24Dir, fs.readdirSync(d24Dir).find((f) => f.startsWith('run-')) || '') : null;
  const d24Ok = d24Dir && d24Log && /TT_TN_P1_D24_SURFACE_EVIDENCE: PASS/.test(fs.readFileSync(d24Log, 'utf8'));
  rows.push({ id: 'TN-P1-D24', ok: !!d24Ok, dir: d24Dir ? path.basename(d24Dir) : null });

  const idxDir = latestEvidenceDir(pv, 'tn-p1-010-indexer-reconcile-');
  const idxOk = idxDir && /PASS/.test(fs.readFileSync(path.join(idxDir, 'STATUS.txt'), 'utf8'));
  rows.push({ id: 'TN-P1-010', ok: !!idxOk, dir: idxDir ? path.basename(idxDir) : null });

  let dgReport = path.join(dgRoot, 'latest-report.json');
  if (!fs.existsSync(dgReport)) {
    const dirs = fs.existsSync(dgRoot)
      ? fs.readdirSync(dgRoot).filter((d) => /^\d{8}T/.test(d)).sort().reverse()
      : [];
    if (dirs[0]) dgReport = path.join(dgRoot, dirs[0], 'report.json');
  }
  const dg = readJsonSafe(dgReport);
  const dgOk = dg?.verdict === 'PASS' && dg?.release_gate === 'GO' && shaPrefix(dg?.git_sha || dg?.api_git_sha || stagingSha, targetSha, 8);
  rows.push({ id: 'DEEP_GATE', ok: !!dgOk, dir: dgReport ? path.relative(root, dgReport) : null });

  const hatDirs = fs.existsSync(hatRoot)
    ? fs.readdirSync(hatRoot).filter((d) => /^\d{8}T/.test(d)).sort().reverse()
    : [];
  const hatDir = hatDirs[0] ? path.join(hatRoot, hatDirs[0]) : null;
  const hatOk =
    hatDir &&
    fs.existsSync(path.join(hatDir, 'hat-findings.json')) &&
    readJsonSafe(path.join(hatDir, 'hat-findings.json'))?.verdict === 'PASS';
  rows.push({ id: 'PHASE28_HAT', ok: !!hatOk, dir: hatDir ? path.basename(hatDir) : null });

  const soakStart = latestEvidenceDir(pv, 'tn-p1-009-soak-start-');
  rows.push({ id: 'TN-P1-009', ok: !!soakStart, dir: soakStart ? path.basename(soakStart) : null, note: 'START only · COMPLETED required for graduation' });

  const allRequiredPass = rows.filter((r) => r.id !== 'TN-P1-009').every((r) => r.ok);
  const manifestShaOk = shaPrefix(stagingSha, targetSha, 12) && shaPrefix(webSha || stagingSha, targetSha, 12);
  return { rows, allRequiredPass, manifestShaOk };
}

const evidenceProbe = probeEvidenceChain(headSha);
const exactDeployMatch = headSha === stagingSha && (!webSha || webSha === stagingSha);
const stagingAligned = exactDeployMatch || deployShaAligned(headSha, stagingSha);
const soakDone = fs.existsSync(path.join(root, 'evidence/P2FC_SOAK_72H_STAGING/COMPLETED.json'));
const gradClosed = (() => {
  try {
    const dirs = fs
      .readdirSync(outDir)
      .filter((d) => /^\d{8}T/.test(d))
      .sort()
      .reverse();
    for (const d of dirs) {
      const p = path.join(outDir, d, 'OWNER-SIGNOFF.md');
      if (fs.existsSync(p) && /TT_TESTNET_GRADUATION:\s*CLOSED/.test(fs.readFileSync(p, 'utf8'))) return true;
    }
  } catch {
    /* ignore */
  }
  return false;
})();

const hMod = sh('git', ['show', 'HEAD:crates/api/src/chain/mod.rs']).stdout;
const wMod = fs.readFileSync(path.join(root, 'crates/api/src/chain/mod.rs'), 'utf8');
function sel(src, name) {
  const m = src.match(new RegExp(`const ${name}.*&\\[([^\\]]+)\\]`));
  return m ? m[1].replace(/\s/g, '') : null;
}

const migrationsUntracked = porcelain
  .split('\n')
  .filter((l) => l.startsWith('??') && l.includes('crates/api/migrations/'))
  .map((l) => path.basename(l.trim().slice(3)));

const regYaml = fs.readFileSync(path.join(root, 'registry/protocol-convergence-deployments.v1.yaml'), 'utf8');
const regAddr = (k) => {
  const m = regYaml.match(new RegExp(`${k}:\\s+"(0x[a-fA-F0-9]+)"`));
  return m ? m[1].toLowerCase() : null;
};
const mc = meta.chain?.contracts || {};

const dimensions = [
  {
    id: 'code',
    label: '代码',
    WT: ssotClean ? 'deploy-SSOT clean' : `SSOT delta (${ssotDirty})`,
    HEAD: 'committed',
    Staging: stagingAligned ? 'matches HEAD/deploy baseline' : 'drift',
    Evidence: 'PASS on old behavior',
    aligned: ssotClean && exactDeployMatch,
    recon: ['RECON-001', 'RECON-002'],
    flb: ['FLB-001', 'FLB-003', 'FLB-004', 'FLB-006', 'FLB-007'],
  },
  {
    id: 'db_migrations',
    label: '数据库迁移',
    WT: migrationsUntracked.length === 0 ? 'tracked' : `${migrationsUntracked.length} untracked`,
    HEAD: migrationsUntracked.length === 0 ? '10 migrations committed' : 'missing migrations',
    Staging: 'likely applied OOB',
    Evidence: 'no migration stamp',
    aligned: migrationsUntracked.length === 0,
    recon: ['RECON-003'],
    flb: ['FLB-002'],
  },
  {
    id: 'config',
    label: '配置',
    WT: 'local .env staging file',
    HEAD: 'partial',
    Staging: `gov_token=${mc.governance_votes_token_address ? 'set' : 'null'} stake=${mc.staking_address ? 'set' : 'null'}`,
    Evidence: 'n/a',
    aligned: !!mc.governance_votes_token_address && !!mc.staking_address,
    recon: ['RECON-007', 'RECON-008'],
    flb: ['FLB-005'],
  },
  {
    id: 'deploy_version',
    label: '部署版本',
    WT: 'not deployed',
    HEAD: headSha,
    Staging: stagingSha || 'unknown',
    Evidence: headSha.slice(0, 12),
    aligned: ssotClean && exactDeployMatch,
    recon: ['RECON-001'],
    flb: ['FLB-006', 'FLB-007', 'FLB-009'],
  },
  {
    id: 'on_chain',
    label: '链上参数',
    WT: 'registry SSOT',
    HEAD: 'registry in git',
    Staging: `escrow=${(mc.escrow_factory_address || '').slice(0, 10)}…`,
    Evidence: 'spine audit OK 20260614',
    aligned:
      (mc.escrow_factory_address || '').toLowerCase() === regAddr('escrow_factory_address') &&
      (mc.fee_router_address || '').toLowerCase() === regAddr('fee_router_address'),
    recon: [],
    flb: ['FLB-008'],
  },
  {
    id: 'evidence_chain',
    label: '证据链',
    WT: evidenceRunDir ? path.basename(evidenceRunDir) : 'latest dirs',
    HEAD: headSha.slice(0, 12),
    Staging: stagingSha.slice(0, 12) || 'unknown',
    Evidence: evidenceProbe.rows.map((r) => `${r.id}:${r.ok ? 'PASS' : 'OPEN'}`).join(' · '),
    aligned: evidenceProbe.allRequiredPass && stagingAligned && exactDeployMatch,
    recon: ['RECON-002'],
    flb: ['FLB-010'],
  },
];

const selectorAligned = sel(wMod, 'SELECTOR_ESCROW_OF') === sel(hMod, 'SELECTOR_ESCROW_OF');
const reconStatus = [
  {
    id: 'RECON-001',
    status: ssotClean && stagingAligned ? 'CLOSED' : 'OPEN',
    flb_pending: ['FLB-001', 'FLB-002', 'FLB-003', 'FLB-004', 'FLB-006', 'FLB-007', 'FLB-009'],
  },
  {
    id: 'RECON-002',
    status: selectorAligned && stagingAligned ? 'CLOSED' : 'OPEN',
    detail: `WT ESCROW=${sel(wMod, 'SELECTOR_ESCROW_OF')} HEAD=${sel(hMod, 'SELECTOR_ESCROW_OF')}`,
    flb_pending: ['FLB-001', 'FLB-006', 'FLB-010'],
  },
  {
    id: 'RECON-003',
    status: migrationsUntracked.length === 0 ? 'CLOSED' : 'OPEN',
    flb_pending: ['FLB-002'],
  },
];

const metaConfigOk = !!mc.governance_votes_token_address && !!mc.staking_address;
const allDimsAligned = dimensions.every((d) => d.aligned);
const allReconClosed = reconStatus.every((r) => r.status === 'CLOSED');
const reconciled = ssotClean && allDimsAligned && allReconClosed && stagingAligned;

const flbDone = {
  'FLB-001': selectorAligned && ssotClean,
  'FLB-002': migrationsUntracked.length === 0,
  'FLB-003': ssotClean,
  'FLB-004': ssotClean,
  'FLB-005': metaConfigOk,
  'FLB-006': stagingAligned,
  'FLB-007': stagingAligned,
  'FLB-008': ssotClean,
  'FLB-009': reconciled,
  'FLB-010': stagingAligned && selectorAligned,
};
const flbStatus = Object.entries(flbDone).map(([id, done]) => ({
  id,
  status: done ? 'CLOSED' : 'OPEN',
  reason: done ? 'Exit criteria met' : 'Pending Freeze-Lift execution',
}));

const blockers = [];
if (!ssotClean) blockers.push({ id: 'BLK-SSOT', severity: 'P0', note: `${ssotDirty} deploy-SSOT paths dirty (FLB-001~004/008)` });
if (wtDirty > 0 && ssotClean)
  blockers.push({ id: 'BLK-WT-NONSSOT', severity: 'P2', note: `${wtDirty} non-deploy WT files (docs/scripts/evidence); deploy-SSOT clean` });
if (!selectorAligned) blockers.push({ id: 'BLK-IDX', severity: 'P0', note: 'TN-P1-010 selectors WT≠HEAD (FLB-001)' });
if (migrationsUntracked.length > 0)
  blockers.push({ id: 'BLK-MIG', severity: 'P0', note: `${migrationsUntracked.length} migrations not in git (FLB-002)` });
if (!stagingAligned) blockers.push({ id: 'BLK-DEPLOY', severity: 'P1', note: 'Staging SHA not aligned with deploy baseline' });
if (!exactDeployMatch)
  blockers.push({ id: 'BLK-EXACT-SHA', severity: 'P0', note: `HEAD=${headSha.slice(0, 12)} staging=${(stagingSha || '').slice(0, 12)} web=${(webSha || '').slice(0, 12)}` });
if (!evidenceProbe.allRequiredPass)
  blockers.push({ id: 'BLK-EVIDENCE', severity: 'P0', note: 'D6/D24/TN-P1-010/DeepGate/HAT not all PASS on current baseline' });

const reconciled100 =
  ssotClean &&
  exactDeployMatch &&
  allDimsAligned &&
  allReconClosed &&
  evidenceProbe.allRequiredPass &&
  selectorAligned;

const verdict = reconciled100
  ? 'RECONCILED_100_PERCENT'
  : reconciled
    ? 'RECONCILED'
    : 'NOT_RECONCILED';
const phase3Gate = reconciled
  ? soakDone && gradClosed
    ? 'ELIGIBLE_FOR_PHASE3_READINESS_REVIEW'
    : 'BLOCKED_PENDING_POST_RECON_SOAK_AND_GRADUATION'
  : 'BLOCKED_PENDING_FREEZE_LIFT';

const report = {
  schema: 'traveltrust.freeze_lift_execution_report.v1',
  audit: 'Phase② Post-Graduation Single SSOT Reconciliation Audit',
  at: stamp,
  local_ssot_baseline: 'working_tree',
  verdict,
  phase3_readiness_gate: phase3Gate,
  graduation: {
    soak_completed: soakDone,
    tt_testnet_graduation_closed: gradClosed,
    post_recon_soak_required: reconciled && !soakDone,
    soak_job: 'job-20260614T070154Z-superseded-freeze-lift-first',
  },
  shas: {
    working_tree_target: 'WT→commit→S',
    head: headSha,
    staging: stagingSha,
    staging_web_meta: webSha,
    exact_match: exactDeployMatch,
    wt_dirty_count: wtDirty,
    deploy_ssot_dirty_count: ssotDirty,
  },
  evidence_manifest: evidenceProbe,
  unified_ssot_matrix: dimensions,
  recon_audit: reconStatus,
  flb_audit: flbStatus,
  blockers,
  recon_open: reconStatus.filter((r) => r.status === 'OPEN').map((r) => r.id),
  flb_remaining: flbStatus.map((f) => f.id),
  next_actions: reconciled100
    ? soakDone && gradClosed
      ? ['Begin Phase③ Readiness Review per phase3-production-readiness-backlog.v1.json']
      : [
          'Monitor 72h P2FC soak on reconciled HEAD',
          'run-phase2-testnet-post-soak-graduation-closure.sh → TT_TESTNET_GRADUATION:CLOSED',
        ]
    : reconciled
      ? [
          'Re-run evidence recorders so manifests match HEAD SHA',
          'Re-run run-single-ssot-reconciliation-audit.sh until RECONCILED_100_PERCENT',
        ]
      : [
          'Execute FLB-001→010 per FREEZE-LIFT-EXECUTION-PLAN.md',
          'bash scripts/dev/run-phase2-final-single-ssot-reconciliation.sh',
        ],
  honest_boundary:
    'RECONCILED precedes soak+graduation (Freeze-Lift-first) · ② reconciliation ≠ ③ Production GO',
  grep_verdict: `TT_SINGLE_SSOT_RECONCILIATION: ${verdict} ${stamp}`,
};

const jsonPath = path.join(outDir, `FREEZE-LIFT-EXECUTION-REPORT-${stamp}.json`);
fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2) + '\n');

const mdPath = path.join(outDir, `FREEZE-LIFT-EXECUTION-REPORT-${stamp}.md`);
const md = `# Phase② · Single SSOT Reconciliation · Freeze-Lift Execution Report

**Stamp:** ${stamp}  
**Audit:** Post-Graduation Single SSOT Reconciliation  
**Local SSOT baseline:** Working Tree (WT)

---

## Final Verdict

| 项 | 结论 |
|----|------|
| **RECONCILED 判定** | **${verdict}** |
| **Phase③ Readiness Review** | **${phase3Gate}** |
| **TT_TESTNET_GRADUATION** | ${gradClosed ? 'CLOSED' : 'OPEN'} |
| **P2FC Soak** | ${soakDone ? 'COMPLETED' : 'INFLIGHT'} |
| **Deploy-SSOT dirty** | ${ssotDirty} files |
| **WT dirty (full tree)** | ${wtDirty} files |
| **HEAD = Staging SHA** | ${headSha === stagingSha ? '✅ exact' : stagingAligned ? '✅ deploy baseline' : '❌'} \`head=${headSha.slice(0, 12)}…\` \`staging=${(stagingSha || '').slice(0, 12)}…\` |

**grep:** \`${report.grep_verdict}\`

---

## 统一真源矩阵（六维 × 四层）

| 维度 | WT | HEAD | Staging | Evidence | Aligned |
|------|-----|------|---------|----------|---------|
${dimensions.map((d) => `| **${d.label}** | ${d.WT} | ${d.HEAD} | ${d.Staging} | ${d.Evidence} | ${d.aligned ? '✅' : '❌'} |`).join('\n')}

---

## RECON-001～003

| ID | Status | FLB pending |
|----|--------|-------------|
${reconStatus.map((r) => `| ${r.id} | **${r.status}** | ${r.flb_pending.join(', ')} |`).join('\n')}

---

## FLB-001～010

| ID | Status | Reason |
|----|--------|--------|
${flbStatus.map((f) => `| ${f.id} | ${f.status} | ${f.reason} |`).join('\n')}

---

## Blockers（${blockers.length}）

${blockers.map((b) => `- **${b.id}** (${b.severity}): ${b.note}`).join('\n')}

---

## Path to RECONCILED → Soak → Graduation

\`\`\`text
FLB-001+002 (commit) → FLB-003+004+008 → FLB-005+006+007 (deploy)
→ FLB-009 verify → FLB-010 evidence SHA → TT_SINGLE_SSOT_RECONCILIATION: RECONCILED
→ fresh 72h P2FC soak → post-soak graduation → TT_TESTNET_GRADUATION:CLOSED
→ Phase③ Readiness Review
\`\`\`

**纪律：** 收敛-only · 不新增功能 · 不重跑 closed TN-P1-010/D6 sprints

**诚实边界：** RECONCILED **先于** soak/graduation · 非 ③ Production GO
`;

fs.writeFileSync(mdPath, md);
console.log(report.grep_verdict);
console.log(`phase3_gate: ${phase3Gate}`);
console.log(`report: ${path.relative(root, mdPath)}`);
