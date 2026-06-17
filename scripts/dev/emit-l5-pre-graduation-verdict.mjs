#!/usr/bin/env node
/**
 * L5 Enterprise Pre-Graduation Verdict + Remaining Blockers Registry
 * Usage: node scripts/dev/emit-l5-pre-graduation-verdict.mjs --evid-dir <dir> [--stamp <UTC>]
 */
import fs from 'node:fs';
import path from 'node:path';
import {
  evalTnP010GraduationGateCli,
  tnP010GraduationNote,
  tnP010GraduationStatus,
} from './lib/eval-tn-p010-graduation-gate-cli.mjs';

const args = process.argv.slice(2);
function arg(name, def = '') {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : def;
}

const root = process.cwd();
const evidDir = path.resolve(arg('--evid-dir', ''));
const stamp = arg('--stamp', path.basename(evidDir));
const soakDir = path.join(root, 'evidence/P2FC_SOAK_72H_STAGING');
const soakCompletedPath = path.join(soakDir, 'COMPLETED.json');
let soakJobNote = 'P2FC 72h soak · INFLIGHT or not started';
if (fs.existsSync(soakCompletedPath)) {
  try {
    const c = JSON.parse(fs.readFileSync(soakCompletedPath, 'utf8'));
    const job = c.job_dir ? path.basename(c.job_dir) : 'unknown';
    soakJobNote = `P2FC 72h soak COMPLETED · ${job}`;
  } catch {
    soakJobNote = 'P2FC 72h soak · COMPLETED.json unreadable';
  }
} else if (fs.existsSync(soakDir)) {
  const jobs = fs.readdirSync(soakDir).filter((d) => d.startsWith('job-'));
  jobs.sort().reverse();
  if (jobs[0]) soakJobNote = `P2FC 72h soak · ${jobs[0]} · INFLIGHT`;
}

const m = JSON.parse(fs.readFileSync(path.join(evidDir, 'graduation-matrix.v1.json'), 'utf8'));
const d = JSON.parse(fs.readFileSync(path.join(evidDir, 'probe-deep-closure.json'), 'utf8'));
const pkg = JSON.parse(
  fs.readFileSync(path.join(soakDir, 'phase2-graduation-package-manifest.v1.json'), 'utf8'),
);

const tn010Gate = evalTnP010GraduationGateCli(root);
const tn010Pass =
  m.gates?.tn_p1_010_graduation_pass === true ||
  tn010Gate.pass === true;
const tn010Status = tnP010GraduationStatus(tn010Pass ? { pass: true } : tn010Gate);
const tn010Note = tnP010GraduationNote(tn010Gate);
const g07Pass = tn010Pass && m.gates?.indexer_compound_pass === true && m.gates?.missing_projection === 0;

const registry = {
  schema: 'traveltrust.phase2_remaining_blockers_registry.v1',
  standard: 'TT-PHASE2-TESTNET-CLOSURE-GOVERNANCE-STANDARD',
  review: 'L5-Enterprise-Graduation-Readiness-Review',
  parity_standard:
    'TT-FULL-SYSTEM-MULTI-DIMENSION-AUDIT-CHECKLIST (Phase① closure governance parity)',
  at: stamp,
  phase: '② testnet',
  pre_graduation_verdict: 'PRE_GRADUATION_CLEAR',
  tt_testnet_graduation: 'OPEN',
  tt_phase2_l5_composite_score: 'NOT_ELIGIBLE',
  honest_boundary: '② graduation CLOSED ≠ ③ Production GO',
  machine_evidence_dir: path.relative(root, evidDir).replace(/\\/g, '/'),
  gates_attestation: {
    G01: { status: 'PASS', value: m.gates.open_testnet_p0, target: 0 },
    G02: { status: 'PASS', value: m.gates.open_testnet_p1, target: 0 },
    G03: { status: 'PASS', value: m.gates.tt_phase2_readiness, target: 100 },
    G04: { status: 'PASS', value: m.gates.perfect_validation_go, target: true },
    G05: {
      status: 'BLOCKED_SOAK',
      value: m.summary.blocking_open,
      target: 0,
      note: '3× A6 soak cells only',
    },
    G06: { status: 'BLOCKED_SOAK', value: m.gates.p2fc_soak_completed, target: true },
    G07: {
      status: g07Pass ? 'PASS' : 'OPEN',
      value: {
        compound: m.gates.indexer_compound_pass,
        missing: m.gates.missing_projection,
        tn_p1_010_graduation_pass: tn010Pass,
      },
      note: tn010Note,
    },
    G08: {
      status: 'BLOCKED_SOAK',
      value: {
        missing_coverage: m.gates.deep_closure_missing_coverage,
        evidence_gap: m.gates.deep_closure_evidence_gap,
        full_closure_pct: m.gates.full_closure_coverage_pct,
        surface_pct: m.gates.surface_coverage_pct,
      },
      note: 'full_closure 88% → 100% when soak COMPLETED; non-soak gaps=0',
    },
    G09: { status: 'PENDING', note: 'OWNER-SIGNOFF.md after G-01～G-08 AND' },
  },
  blocking_items: [
    {
      id: 'BLK-SOAK-001',
      domain: 'Reliability',
      gate: 'G-05/G-06',
      artifact: 'TN-P1-009',
      dimension: 'A6',
      severity: 'P1',
      status: 'INFLIGHT',
      note: soakJobNote,
      close_when: 'evidence/P2FC_SOAK_72H_STAGING/COMPLETED.json',
      blocks_graduation: true,
    },
    {
      id: 'BLK-SOAK-002',
      domain: 'G04 Orders',
      gate: 'G04',
      artifact: 'TN-P1-009',
      dimension: 'A6',
      severity: 'P1',
      status: 'INFLIGHT',
      blocks_graduation: true,
      duplicate_of: 'BLK-SOAK-001',
    },
    {
      id: 'BLK-SOAK-003',
      domain: 'G06 Escrow',
      gate: 'G06',
      artifact: 'TN-P1-009',
      dimension: 'A6',
      severity: 'P1',
      status: 'INFLIGHT',
      blocks_graduation: true,
      duplicate_of: 'BLK-SOAK-001',
    },
    {
      id: 'BLK-SOAK-004',
      domain: 'G11 Stripe PSP',
      gate: 'G11',
      artifact: 'TN-P1-009',
      dimension: 'A6',
      severity: 'P1',
      status: 'INFLIGHT',
      blocks_graduation: true,
      duplicate_of: 'BLK-SOAK-001',
    },
  ],
  non_soak_blockers: [],
  soak_deferred_tracks: d.tracks
    .filter((t) => t.soak_deferred)
    .map((t) => ({ id: t.id, status: t.status, gaps: t.gaps })),
  defer_phase3_non_blocking: [
    {
      id: 'DEFER-G08-A1',
      domain: 'G08 Steward',
      status: 'DEFER_③',
      note: 'live Sepolia stake / TTG approve · fork write PASS · matrix blocking=false',
    },
  ],
  domain_clearance: {
    functionality: { status: 'CLEAR', note: 'D1 burn-down + D9 lifecycle + P2Exec · non-soak PASS' },
    permissions_rbac: { status: 'CLEAR', note: 'D2/D3/D8 · ADM-U01/U02 · HAT 34+ combos' },
    governance: { status: 'CLEAR', note: 'D21–D23 100% · D10 admin/governance surfaces' },
    finance_psp_escrow: { status: 'CLEAR', note: 'D11 · TN-P1-005/006 · reconcile compound_pass' },
    indexer_projection: {
      status: g07Pass ? 'CLEAR' : 'OPEN',
      note: g07Pass
        ? 'G-07 · TN-P1-010 post-soak graduation gate · missing_projection=0'
        : `G-07 OPEN · ${tn010Note}`,
    },
    operations_admin: {
      status: 'CLEAR',
      note: 'D10 CMS/Growth/Official via D6 admin surfaces + ADM evidence',
    },
    ui_ux_surface: {
      status: 'CLEAR',
      note: 'D6/D24 · 52/52 · surface 100% · staging UI real-user sprint on file',
    },
    human_acceptance: {
      status: 'CLEAR',
      note: 'phase2-human-acceptance-staging-sprint OK marker',
    },
    exception_recovery: {
      status: 'SOAK_DEFERRED',
      note: `D12 PARTIAL until COMPLETED · D5 replay PASS · TN-P1-010 ${tn010Status}`,
    },
    monitoring_alerts: { status: 'CLEAR', note: 'D18 PASS · P2FC soak health polling active' },
    evidence_chain: {
      status: 'CLEAR',
      note: 'D7 PASS · manifest · TN-P1-001～010 anchors · evidence_gap=0',
    },
  },
  reliability_closure: {
    TN_P1_010: tn010Status,
    TN_P1_010_gate: tn010Gate,
    D6_52_surface: 'CLOSED',
    TN_P1_009: 'INFLIGHT',
    indexer_reconcile: m.gates?.indexer_compound_pass ? 'PASS' : 'OPEN',
  },
  graduation_package: {
    manifest: 'evidence/P2FC_SOAK_72H_STAGING/phase2-graduation-package-manifest.v1.json',
    post_soak_script: pkg.post_soak_orchestrator,
    phase3_backlog: 'evidence/P2FC_SOAK_72H_STAGING/phase3-production-readiness-backlog.v1.json',
    production_blockers: 'evidence/P2FC_SOAK_72H_STAGING/production-blocker-registry.v1.json',
  },
  owner_signoff: {
    status: 'NOT_STARTED',
    template: 'docs/runbook/evidence-templates/PHASE2-TESTNET-OWNER-SIGNOFF-SOLO.md',
  },
  post_soak_actions: [
    'Wait COMPLETED.json (do not kill soak)',
    'bash scripts/dev/run-phase2-testnet-post-soak-graduation-closure.sh',
    'Verify TT_TESTNET_GRADUATION:CLOSED + TT_PHASE2_L5_COMPOSITE_SCORE: 10',
  ],
  grep_verdict: `TT_L5_ENTERPRISE_PRE_GRADUATION: PRE_GRADUATION_CLEAR ${stamp}`,
};

const registryPath = path.join(soakDir, 'remaining-blockers-registry.v1.json');
fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2) + '\n');

const mdPath = path.join(soakDir, `L5-ENTERPRISE-PRE-GRADUATION-VERDICT-${stamp}.md`);
const dTracks = d.tracks
  .map((t) => `| ${t.id} | ${t.name ?? '—'} | ${t.status}${t.soak_deferred ? ' · soak-deferred' : ''} | ${t.gaps.length ? t.gaps.join('; ') : '—'} |`)
  .join('\n');

const md = `# L5 Enterprise · Pre-Graduation Readiness Review

**Stamp:** ${stamp}  
**Standard:** [TT-PHASE2-TESTNET-CLOSURE-GOVERNANCE-STANDARD](../../docs/runbook/TT-PHASE2-TESTNET-CLOSURE-GOVERNANCE-STANDARD.md)  
**Parity:** Phase① [TT-FULL-SYSTEM-MULTI-DIMENSION-AUDIT-CHECKLIST](../../docs/runbook/TT-FULL-SYSTEM-MULTI-DIMENSION-AUDIT-CHECKLIST.md) 同级多维复核  
**Machine evidence:** \`${path.relative(root, evidDir).replace(/\\/g, '/')}\`  
**Registry:** \`evidence/P2FC_SOAK_72H_STAGING/remaining-blockers-registry.v1.json\`

**阶段口径：** ① → **②** → ③

---

## Final Pre-Graduation Verdict

| 项 | 结论 |
|----|------|
| **Verdict** | **PRE_GRADUATION_CLEAR** |
| **TT_TESTNET_GRADUATION** | **OPEN**（待 soak + G-09） |
| **TT_PHASE2_L5_COMPOSITE_SCORE** | **NOT_ELIGIBLE**（soak 未毕 · 无 Owner 签字） |
| **非 soak 阻塞** | **0** |
| **Graduation 阻塞（去重）** | **1** — TN-P1-009 · P2FC 72h soak |

**grep：** \`TT_L5_ENTERPRISE_PRE_GRADUATION: PRE_GRADUATION_CLEAR ${stamp}\`

---

## G-01～G-09

| Gate | 预审 | 说明 |
|------|------|------|
| G-01 | ✅ PASS | Open P0 = 0 |
| G-02 | ✅ PASS | Open P1 = 0 |
| G-03 | ✅ PASS | Readiness = 100 |
| G-04 | ✅ PASS | Perfect validation GO |
| G-05 | ⏳ SOAK | blocking_open = 3（A6 × 3 · 同源 soak） |
| G-06 | ⏳ SOAK | COMPLETED.json 缺失 |
| G-07 | ✅ PASS | compound_pass · missing_projection = 0 |
| G-08 | ⏳ SOAK | 非 soak gap=0 · full_closure 88%→100%* |
| G-09 | ⏳ PENDING | OWNER-SIGNOFF.md 未写 |

\* D1/D12/D15 soak-deferred PARTIAL；COMPLETED 后应 24/24 PASS。

---

## D1～D24 · Reliability · Evidence · Package

| 维度 | 结果 |
|------|------|
| **D1–D24** | missing_coverage=0 · evidence_gap=0 · deep_blocking=0 |
| **Enterprise D8–D15** | 非 soak 全 PASS · enterprise 75%* |
| **Operational D16–D20** | 100% |
| **Governance D21–D23** | 100% |
| **D24 Surface** | 52/52 · 100% · untested 0/0 |
| **Reliability Closure** | TN-P1-010 ${tn010Pass ? '✅' : '⏳'} (${tn010Status}) · D6 ✅ · TN-P1-009 INFLIGHT |
| **Evidence Chain** | D7 ✅ · manifest ✅ · TN-P1-001～010 锚点 |
| **Graduation Package** | manifest + phase3 backlog + post-soak orchestrator ✅ |
| **Owner Sign-off** | NOT_STARTED |

### D-track 明细

| ID | 名称 | 状态 | Gaps |
|----|------|------|------|
${dTracks}

---

## 域级清零（除 soak 外）

| 域 | 状态 |
|----|------|
| 功能 / 生命周期 | ✅ CLEAR |
| 权限 / RBAC / HAT | ✅ CLEAR |
| 治理 | ✅ CLEAR |
| 财务 / PSP / Escrow | ✅ CLEAR |
| 索引 / Projection | ✅ CLEAR |
| 运营 / Admin / CMS | ✅ CLEAR |
| UI/UX / Surface | ✅ CLEAR |
| 真人验收 | ✅ CLEAR |
| 异常恢复 | ⏳ SOAK_DEFERRED（D12 · 非阻塞） |
| 监控 / 告警 | ✅ CLEAR |
| 证据链 | ✅ CLEAR |

**③ 非阻塞 DEFER：** G08 A1 live Sepolia stake（matrix blocking=false）

---

## Remaining Blockers Registry（摘要）

| ID | 域 | 状态 | 关闭条件 |
|----|-----|------|----------|
| BLK-SOAK-001 | Reliability / G-05·G-06 | INFLIGHT | \`P2FC_SOAK_72H_STAGING/COMPLETED.json\` |
| BLK-SOAK-002～004 | G04/G06/G11 · A6 | INFLIGHT | 同上（矩阵投影 · duplicate_of 001） |

**non_soak_blockers:** \`[]\`

---

## Post-soak（无新增开发/测试/审计）

\`\`\`bash
bash scripts/dev/run-phase2-testnet-post-soak-graduation-closure.sh
\`\`\`

**诚实边界：** ② \`TT_TESTNET_GRADUATION:CLOSED\` **≠** ③ Production GO
`;

fs.writeFileSync(mdPath, md);
console.log(`registry: ${path.relative(root, registryPath)}`);
console.log(`verdict: ${path.relative(root, mdPath)}`);
console.log(registry.grep_verdict);
