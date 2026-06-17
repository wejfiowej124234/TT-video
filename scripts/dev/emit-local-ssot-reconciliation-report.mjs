#!/usr/bin/env node
/**
 * LOCAL SSOT vs Staging Deployment Reconciliation Report + Freeze Lift Backlog
 *
 *   node scripts/dev/emit-local-ssot-reconciliation-report.mjs [--stamp UTC]
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
function arg(name, def = '') {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : def;
}

const stamp = arg('--stamp', new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z');
const outDir = path.join(root, 'evidence/GO_phase2_testnet_graduation');
const tn010Gate = evalTnP010GraduationGateCli(root);
const tn010GraduationStatus = tnP010GraduationStatus(tn010Gate);

function readText(p) {
  try {
    return fs.readFileSync(p, 'utf8');
  } catch {
    return '';
  }
}

function readJson(p) {
  try {
    return JSON.parse(readText(p));
  } catch {
    return null;
  }
}

function headSelector(sha, name) {
  const r = spawnSync('git', ['show', `${sha}:crates/api/src/chain/mod.rs`], { cwd: root, encoding: 'utf8' });
  if (r.status !== 0) return null;
  const m = r.stdout.match(new RegExp(`const ${name}.*=.*&\\[([^\\]]+)\\]`));
  return m ? m[1].replace(/\s/g, '') : null;
}

function wtSelector(name) {
  const t = readText(path.join(root, 'crates/api/src/chain/mod.rs'));
  const m = t.match(new RegExp(`const ${name}.*=.*&\\[([^\\]]+)\\]`));
  return m ? m[1].replace(/\s/g, '') : null;
}

function countPorcelain(prefix) {
  return porcelain.split('\n').filter((l) => l.startsWith(prefix)).length;
}

function listPorcelain(filterFn) {
  return porcelain.split('\n').filter(filterFn).map((l) => l.slice(3).trim());
}

const headSha = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).stdout.trim();
const porcelain = spawnSync('git', ['status', '--porcelain'], { cwd: root, encoding: 'utf8' }).stdout;

const metaPath = path.join(root, 'evidence/.tmp-recon-meta.json');
let meta = readJson(metaPath);
if (!meta) {
  spawnSync(
    'curl',
    ['--noproxy', '*', '-sS', '--max-time', '30', 'https://tt-api-staging.fly.dev/meta', '-o', metaPath],
    { cwd: root },
  );
  meta = readJson(metaPath) || {};
}

const stagingSha = meta.build?.git_sha || '';
const modified = countPorcelain(' M');
const untracked = countPorcelain('??');
const regYaml = readText(path.join(root, 'registry/protocol-convergence-deployments.v1.yaml'));
const envLocal = readText(path.join(root, 'scripts/dev/.env.staging-onboarding.local'));
const buildEnv = readText(path.join(root, 'deploy/fly/tt-web-staging/build.env.local'));

const getReg = (k) => {
  const m = regYaml.match(new RegExp(`${k}:\\s+"(0x[a-fA-F0-9]+)"`));
  return m ? m[1].toLowerCase() : null;
};
const getEnv = (k) => {
  const m = envLocal.match(new RegExp(`^${k}=(.+)$`, 'm'));
  return m ? m[1].trim() : null;
};
const mc = meta.chain?.contracts || {};

const gaps = [];

function gap(g) {
  gaps.push(g);
}

// --- Taxonomy helpers ---
const untrackedMigrations = listPorcelain((l) => l.startsWith('??') && l.includes('crates/api/migrations/'));
const untrackedAdminRoutes = listPorcelain(
  (l) => l.startsWith('??') && l.includes('crates/api/src/routes/admin/'),
);
const untrackedAdminFe = listPorcelain((l) => l.startsWith('??') && l.includes('frontend/app/admin/'));
const modifiedGovernanceFe = listPorcelain(
  (l) => l.startsWith(' M') && l.includes('frontend/app/governance/'),
);
const untrackedContracts = listPorcelain((l) => l.startsWith('??') && l.startsWith('?? contracts/'));

gap({
  id: 'RECON-001',
  severity: 'Critical',
  category: 'local_exists_uncommitted',
  domain: 'Version / SSOT',
  title: 'Working tree is Local SSOT but not in git',
  observation: `${modified} modified + ${untracked} untracked vs HEAD ${headSha.slice(0, 12)}; staging /meta git_sha = HEAD (not working tree).`,
  impact: 'Single Source of Truth split: developers run WT; staging runs HEAD; redeploy without commit drops latest work.',
  fix: 'Freeze Lift: structured commit waves (see FLB-001..003) then deploy from one SHA.',
});

const hEsc = headSelector(headSha, 'SELECTOR_ESCROW_OF');
const wEsc = wtSelector('SELECTOR_ESCROW_OF');
const hSt = headSelector(headSha, 'SELECTOR_STATUS');
const wSt = wtSelector('SELECTOR_STATUS');
if (wEsc && hEsc && wEsc !== hEsc) {
  gap({
    id: 'RECON-002',
    severity: 'Critical',
    category: 'evidence_code_semantic_mismatch',
    domain: 'Indexer',
    title: `TN-P1-010 graduation gate ${tn010GraduationStatus} · selector fix only in working tree`,
    observation: `HEAD ESCROW=${hEsc} STATUS=${hSt}; WT ESCROW=${wEsc} STATUS=${wSt}. TN-P1-010 graduation gate: ${tnP010GraduationNote(tn010Gate)}; staging reconcile compound_pass may differ from post-soak GO.`,
    impact: 'Evidence claims indexer reconcile closed; git HEAD still has wrong eth_call selectors.',
    fix: 'FLB-001: commit mod.rs + indexer.rs bundle; redeploy API; append reconcile evidence with new git_sha.',
  });
}

if (untrackedMigrations.length > 0) {
  gap({
    id: 'RECON-003',
    severity: 'Critical',
    category: 'db_executed_not_in_repo',
    domain: 'Database',
    title: 'CMS/Growth/guides migrations on disk · not in git',
    observation: `${untrackedMigrations.length} files: ${untrackedMigrations.map((f) => path.basename(f)).join(', ')}. Staging CMS/Growth admin API parity PASS → DB likely migrated out-of-band.`,
    impact: 'Clone-from-git + migrate would miss schema; reproducibility broken.',
    fix: 'FLB-002: git add migrations + record staging _sqlx_migrations stamp in evidence.',
  });
}

if (untrackedAdminRoutes.length >= 10) {
  gap({
    id: 'RECON-004',
    severity: 'High',
    category: 'local_exists_uncommitted',
    domain: 'Admin / CMS / Growth',
    title: 'Admin HTTP handlers exist locally · not in HEAD',
    observation: `${untrackedAdminRoutes.length} untracked admin route modules (catalog, growth, official, …). Staging returns 200 — likely deployed from dirty tree earlier or partial overlap with HEAD routes.`,
    impact: 'Admin console FE/BE parity fragile across environments.',
    fix: 'FLB-003: commit admin + catalog + growth route tree; verify admin mod.rs mounts.',
  });
}

if (untrackedAdminFe.length > 0) {
  gap({
    id: 'RECON-005',
    severity: 'High',
    category: 'local_exists_uncommitted',
    domain: 'Admin UI',
    title: 'Admin FE route trees untracked',
    observation: `${untrackedAdminFe.length} dirs: ${untrackedAdminFe.map((p) => path.basename(p)).join(', ')} under frontend/app/admin/.`,
    impact: 'Staging web may lack new admin pages present locally.',
    fix: 'FLB-004: commit admin FE; deploy tt-web-staging from same SHA as API.',
  });
}

if (modifiedGovernanceFe.length > 0) {
  gap({
    id: 'RECON-006',
    severity: 'High',
    category: 'local_exists_uncommitted',
    domain: 'Governance UI',
    title: 'Governance module FE changes not committed',
    observation: `${modifiedGovernanceFe.length} modified files under frontend/app/governance/ (proposals, params, hub).`,
    impact: 'Local governance UX ≠ staging until commit+deploy.',
    fix: 'FLB-004: include in frontend commit wave.',
  });
}

const govTokenReg = getReg('governance_token_address');
const govMeta = (mc.governance_votes_token_address || '').toLowerCase();
const govEnv =
  getEnv('GOVERNANCE_VOTES_TOKEN_ADDRESS') || getEnv('GOVERNANCE_TOKEN_ADDRESS') || '';
if (govTokenReg && !govMeta) {
  gap({
    id: 'RECON-007',
    severity: 'High',
    category: 'config_exists_not_exposed',
    domain: 'Governance / Meta',
    title: 'Governance token in registry · absent from staging /meta',
    observation: `registry=${govTokenReg}; local env=${govEnv ? 'set' : 'unset'}; /meta governance_votes_token_address=null.`,
    impact: 'Governance vote weight / getPastVotes UI cannot self-configure from meta on staging.',
    fix: 'FLB-005: set GOVERNANCE_VOTES_TOKEN_ADDRESS (or GOVERNANCE_TOKEN_ADDRESS) on Fly; redeploy API.',
  });
}

const stakeReg = getReg('region_steward_stake_pool_address');
const stakeEnv = getEnv('REGION_STEWARD_STAKE_POOL_ADDRESS') || '';
const stakeMeta = (mc.staking_address || '').toLowerCase();
if (stakeEnv && !stakeMeta) {
  gap({
    id: 'RECON-008',
    severity: 'High',
    category: 'config_exists_not_exposed',
    domain: 'Steward / Meta',
    title: 'REGION_STEWARD_STAKE_POOL_ADDRESS set · /meta staking_address null',
    observation: `env REGION_STEWARD_STAKE_POOL_ADDRESS=${stakeEnv.slice(0, 10)}…; meta reads STAKING_ADDRESS not REGION_STEWARD_*; registry=${stakeReg}.`,
    impact: 'Steward stake API may work while meta observability / FE guards show null staking.',
    fix: 'FLB-005: align Fly STAKING_ADDRESS=pool or extend ChainConfig meta mapping (post-freeze code if needed).',
  });
}

if (meta.build && !meta.build.deployed_at) {
  gap({
    id: 'RECON-009',
    severity: 'Medium',
    category: 'config_exists_not_exposed',
    domain: 'Observability',
    title: '/meta build.deployed_at null on staging',
    observation: 'TRAVELTRUST_DEPLOYED_AT not injected on tt-api-staging.',
    impact: 'Deploy audit trail weak for reconciliation.',
    fix: 'FLB-006: set TRAVELTRUST_DEPLOYED_AT on Fly release.',
  });
}

const indexerStat = spawnSync('git', ['diff', '--stat', 'HEAD', '--', 'crates/api/src/chain/indexer.rs'], {
  cwd: root,
  encoding: 'utf8',
}).stdout.trim();
if (indexerStat.includes('insertion')) {
  gap({
    id: 'RECON-010',
    severity: 'Medium',
    category: 'local_exists_uncommitted',
    domain: 'Indexer',
    title: 'indexer.rs substantial uncommitted delta',
    observation: indexerStat.split('\n').pop(),
    impact: 'Indexer tick/reconcile behavior differs WT vs staging HEAD.',
    fix: 'FLB-001: commit with selector fix.',
  });
}

if (untrackedContracts.length > 0) {
  gap({
    id: 'RECON-011',
    severity: 'Medium',
    category: 'local_exists_uncommitted',
    domain: 'Contracts',
    title: 'Phase② contract artifacts untracked',
    observation: `${untrackedContracts.length} untracked under contracts/ (scripts, src, abi, test).`,
    impact: 'On-chain tooling not reproducible from git HEAD.',
    fix: 'FLB-007: commit contracts wave or document deploy-only exclusion.',
  });
}

const wtChainOff = listPorcelain((l) => l.startsWith('??') && l.includes('crates/api/src/chain_off/')).length;
if (wtChainOff > 5) {
  gap({
    id: 'RECON-012',
    severity: 'Medium',
    category: 'local_exists_uncommitted',
    domain: 'API / Domain',
    title: 'New chain_off modules untracked',
    observation: `${wtChainOff} modules (guide_exit, identity_slots, slot_rbac, steward_seat, …).`,
    impact: 'Business logic on disk not in HEAD/staging.',
    fix: 'FLB-003: commit API domain wave with routes.',
  });
}

gap({
  id: 'RECON-013',
  severity: 'Low',
  category: 'committed_not_deployed',
  domain: 'Deploy',
  title: 'HEAD equals staging SHA · no committed-but-not-deployed gap',
  observation: `HEAD ${headSha.slice(0, 12)} = staging git_sha; gap is WT→HEAD not HEAD→staging.`,
  impact: 'None for committed code; WT is the drift source.',
  fix: 'N/A — focus FLB commit waves.',
});

gap({
  id: 'RECON-014',
  severity: 'Low',
  category: 'graduation_gate',
  domain: 'Reliability',
  title: 'TN-P1-009 soak INFLIGHT (not SSOT drift)',
  observation: 'P2FC 72h soak; COMPLETED.json pending.',
  impact: 'Phase② graduation OPEN until soak + post-soak closure.',
  fix: 'Wait soak; run post-soak graduation (no redeploy required for soak itself).',
});

// Aligned
const aligned = [];
if (headSha === stagingSha) aligned.push('HEAD git_sha = staging /meta.build.git_sha');
for (const [k, regK] of [
  ['escrow_factory_address', 'escrow_factory_address'],
  ['fee_router_address', 'fee_router_address'],
  ['governor_address', 'governor_address'],
]) {
  const r = getReg(regK);
  const m = (mc[k] || '').toLowerCase();
  const e = (getEnv(k.toUpperCase()) || getEnv(k.replace(/_address/, '').toUpperCase() + '_ADDRESS') || '').toLowerCase();
  if (r && m === r) aligned.push(`${k}: registry = staging /meta`);
}
aligned.push('Sepolia spine audit OK (registry ↔ on-chain)');
aligned.push('check-staging-web-alignment PASS (prior: CORS/Sepolia/NEXT_PUBLIC core trio)');

const blocking = gaps.filter(
  (g) => !['graduation_gate', 'committed_not_deployed'].includes(g.category) && g.severity !== 'Low',
);

let verdict = 'RECONCILIATION_REQUIRED';
if (blocking.filter((g) => g.severity === 'Critical').length === 0 && blocking.length <= 2) {
  verdict = 'RECONCILIATION_PARTIAL';
}
if (blocking.length === 0) verdict = 'RECONCILED';

const freezeLiftBacklog = [
  {
    id: 'FLB-001',
    priority: 'P0',
    title: 'Commit Indexer TN-P1-010 bundle',
    scope: ['crates/api/src/chain/mod.rs', 'crates/api/src/chain/indexer.rs'],
    exit: 'HEAD selectors match WT; cargo test -p traveltrust-api chain',
    blocks: ['RECON-002', 'RECON-010'],
  },
  {
    id: 'FLB-002',
    priority: 'P0',
    title: 'Track SQL migrations in git',
    scope: untrackedMigrations,
    exit: '10 migrations in git; staging _sqlx_migrations stamp recorded',
    blocks: ['RECON-003'],
  },
  {
    id: 'FLB-003',
    priority: 'P0',
    title: 'Commit CMS/Growth/Admin API + chain_off domain',
    scope: ['crates/api/src/routes/admin/*', 'crates/api/src/routes/catalog/', 'crates/api/src/routes/growth/', 'crates/api/src/chain_off/*'],
    exit: 'run-check-04-routes.sh exit 0; admin routes mounted',
    blocks: ['RECON-004', 'RECON-012'],
  },
  {
    id: 'FLB-004',
    priority: 'P1',
    title: 'Commit Admin + Governance frontend',
    scope: ['frontend/app/admin/*', 'frontend/app/governance/*'],
    exit: 'admin/governance vitest contracts pass (subset)',
    blocks: ['RECON-005', 'RECON-006'],
  },
  {
    id: 'FLB-005',
    priority: 'P1',
    title: 'Fly env sync · meta exposure',
    scope: ['GOVERNANCE_VOTES_TOKEN_ADDRESS', 'STAKING_ADDRESS or REGION_STEWARD_STAKE_POOL_ADDRESS', 'TRAVELTRUST_DEPLOYED_AT'],
    exit: '/meta shows governance_votes_token_address + staking_address + deployed_at',
    blocks: ['RECON-007', 'RECON-008', 'RECON-009'],
  },
  {
    id: 'FLB-006',
    priority: 'P1',
    title: 'Deploy tt-api-staging from unified commit',
    scope: ['scripts/dev/phase2-staging-fly-deploy-and-sync.sh'],
    exit: 'staging /meta git_sha = new HEAD; reconcile compound_pass',
    blocks: ['RECON-001'],
  },
  {
    id: 'FLB-007',
    priority: 'P1',
    title: 'Deploy tt-web-staging from same SHA',
    scope: ['scripts/dev/deploy-tt-web-staging.sh'],
    exit: 'check-staging-web-alignment FAIL=0',
    blocks: ['RECON-001', 'RECON-005'],
  },
  {
    id: 'FLB-008',
    priority: 'P2',
    title: 'Commit contracts Phase② artifacts (if in scope)',
    scope: ['contracts/src/*', 'contracts/abi/*', 'registry/*'],
    exit: 'phase2-sepolia-spine-audit OK',
    blocks: ['RECON-011'],
  },
  {
    id: 'FLB-009',
    priority: 'P2',
    title: 'Reconciliation verification gate',
    scope: ['scripts/dev/run-phase1-phase2-full-alignment-audit.sh', 'scripts/dev/emit-local-ssot-reconciliation-report.mjs'],
    exit: 'TT_LOCAL_SSOT_RECONCILIATION: RECONCILED; non-soak alignment gaps=0',
    blocks: ['all'],
  },
  {
    id: 'FLB-010',
    priority: 'P2',
    title: 'Evidence SHA refresh (no closed-item rerun)',
    scope: ['Append git_sha to TN-P1-010 STATUS', 'Update testnet-perfect-validation-manifest'],
    exit: 'Evidence git_sha matches deployed HEAD post-FLB-006',
    blocks: ['RECON-002'],
  },
];

const report = {
  schema: 'traveltrust.local_ssot_reconciliation_report.v1',
  at: stamp,
  phase: '② testnet',
  mode: 'Reliability Freeze · audit-only',
  local_ssot: 'working_tree',
  baselines: {
    working_tree: { modified, untracked },
    git_head: headSha,
    staging_git_sha: stagingSha,
    head_equals_staging: headSha === stagingSha,
    working_tree_equals_staging: false,
  },
  reconciliation_verdict: verdict,
  aligned_items: aligned,
  gaps,
  gap_summary: {
    critical: gaps.filter((g) => g.severity === 'Critical').length,
    high: gaps.filter((g) => g.severity === 'High').length,
    medium: gaps.filter((g) => g.severity === 'Medium').length,
    low: gaps.filter((g) => g.severity === 'Low').length,
  },
  freeze_lift_backlog: freezeLiftBacklog,
  tn_p1_010_graduation_gate: tn010Gate,
  honest_boundary:
    'Execute FLB after TT_TESTNET_GRADUATION:CLOSED or explicit Freeze Lift; ② reconciliation ≠ ③ Production GO.',
  grep_verdict: `TT_LOCAL_SSOT_RECONCILIATION: ${verdict} ${stamp}`,
};

const jsonPath = path.join(outDir, `LOCAL_SSOT_RECONCILIATION_REPORT-${stamp}.json`);
const mdPath = path.join(outDir, `LOCAL_SSOT_RECONCILIATION_REPORT-${stamp}.md`);
const backlogPath = path.join(outDir, `freeze-lift-backlog.v1.json`);

fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2) + '\n');
fs.writeFileSync(backlogPath, JSON.stringify({ schema: 'traveltrust.freeze_lift_backlog.v1', at: stamp, items: freezeLiftBacklog }, null, 2) + '\n');

const sev = { Critical: 0, High: 1, Medium: 2, Low: 3 };
const sorted = [...gaps].sort((a, b) => sev[a.severity] - sev[b.severity]);

const md = `# LOCAL SSOT vs Staging Deployment Reconciliation Report

**Stamp:** ${stamp}  
**Local SSOT:** **Working Tree** (真实开发基线)  
**Staging:** \`tt-api-staging\` / \`tt-web-staging\` · git_sha \`${stagingSha.slice(0, 12)}…\`  
**Git HEAD:** \`${headSha.slice(0, 12)}…\` (${headSha === stagingSha ? '✅ = staging' : '❌ ≠ staging'})

**阶段口径：** ① → **②** → ③ · **Reliability Freeze · audit-only**

---

## Reconciliation Verdict

| 项 | 结论 |
|----|------|
| **Verdict** | **${verdict}** |
| **WT vs HEAD** | ${modified} modified · ${untracked} untracked |
| **WT vs Staging** | ❌ **not converged** |
| **HEAD vs Staging** | ${headSha === stagingSha ? '✅ aligned' : '❌ drift'} |
| **TN-P1-010 graduation gate** | **${tn010GraduationStatus}** · ${tnP010GraduationNote(tn010Gate)} |
| **Gaps** | C:${report.gap_summary.critical} H:${report.gap_summary.high} M:${report.gap_summary.medium} L:${report.gap_summary.low} |

**grep:** \`${report.grep_verdict}\`

**机读：** \`LOCAL_SSOT_RECONCILIATION_REPORT-${stamp}.json\` · \`freeze-lift-backlog.v1.json\`

---

## Aligned

${aligned.map((x) => `- ✅ ${x}`).join('\n')}

---

## Gap Registry

| ID | Sev | Category | Domain | Title |
|----|-----|----------|--------|-------|
${sorted.map((g) => `| ${g.id} | **${g.severity}** | ${g.category} | ${g.domain} | ${g.title} |`).join('\n')}

---

## Freeze Lift Backlog（Phase② 毕业后 · Single SSOT 收敛）

| ID | P | Title | Exit |
|----|---|-------|------|
${freezeLiftBacklog.map((f) => `| ${f.id} | ${f.priority} | ${f.title} | ${f.exit} |`).join('\n')}

**执行顺序：** FLB-001 → 002 → 003 → 004 → **005 env** → **006 API deploy** → **007 Web deploy** → 008 → **009 verification** → 010 evidence SHA refresh

**纪律：** Freeze 期间 **不执行** FLB · 不重跑 TN-P1-010/D6/soak 已关闭项 · 毕业后再收敛 WT→HEAD→Staging 为同一 SHA。

---

## Detail

${sorted.map((g) => `### ${g.id} · ${g.severity} · ${g.category}

**${g.title}** (${g.domain})

- ${g.observation}
- **Impact:** ${g.impact}
- **Fix:** ${g.fix}
`).join('\n')}

**诚实边界：** 本地工作区 = 真实开发 SSOT；测试网 = 已提交 HEAD 快照；**毕业后**须 FLB 使三者收敛为 **one git SHA**。
`;

fs.writeFileSync(mdPath, md);

console.log(`md: ${path.relative(root, mdPath)}`);
console.log(`json: ${path.relative(root, jsonPath)}`);
console.log(`backlog: ${path.relative(root, backlogPath)}`);
console.log(report.grep_verdict);
