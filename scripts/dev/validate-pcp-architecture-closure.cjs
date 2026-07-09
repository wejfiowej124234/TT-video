#!/usr/bin/env node
/**
 * PCP Architecture Closure — final milestone sign-off
 *
 * Delivers:
 *   ① Four closure documents present
 *   ② Phase 1 Freeze regression still PASS (no drift)
 *   ③ TT_PCP_ARCHITECTURE: FROZEN stamped in registry + runbook
 *
 * Does NOT start Phase 2. Next gate: Production Readiness (separate).
 *
 *   node scripts/dev/validate-pcp-architecture-closure.cjs
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '../..');
const STAMP = process.env.AUDIT_STAMP || new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, 'Z');
const EVID_DIR = path.join(ROOT, 'evidence', 'GO_public_content_platform', STAMP);

const CLOSURE_DOCS = [
  {
    id: 'doc_architecture_final',
    rel: 'docs/runbook/PCP-ARCHITECTURE-FINAL.md',
    marker: 'TT_PCP_ARCHITECTURE: FROZEN',
  },
  {
    id: 'doc_migration_history',
    rel: 'docs/runbook/PCP-MIGRATION-HISTORY.md',
    marker: 'Architecture Closure',
  },
  {
    id: 'doc_capability_matrix',
    rel: 'docs/runbook/PCP-PLATFORM-CAPABILITY-MATRIX.md',
    marker: 'Capability Matrix',
  },
  {
    id: 'doc_developer_guide',
    rel: 'docs/runbook/PCP-DEVELOPER-GUIDE.md',
    marker: 'Builder Contract',
  },
];

const checks = [];

function record(id, label, status, detail) {
  checks.push({ id, label, status, detail });
}

function read(rel) {
  const p = path.join(ROOT, rel);
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '';
}

function isoFromStamp(stamp) {
  return stamp.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z/, '$1-$2-$3T$4:$5:$6Z');
}

function stampArchitectureFrozen(evidence) {
  const regPath = path.join(ROOT, 'registry/public-content-platform.v1.yaml');
  const runbookPath = path.join(ROOT, 'docs/runbook/TT-PUBLIC-CONTENT-PLATFORM.md');
  let reg = fs.readFileSync(regPath, 'utf8');

  if (!reg.includes('TT_PCP_ARCHITECTURE:')) {
    reg = reg.replace(
      'TT_PCP_PHASE_2: NOT_STARTED',
      'TT_PCP_PHASE_2: NOT_STARTED\n  TT_PCP_ARCHITECTURE: FROZEN\n  TT_PCP_ARCHITECTURE_CLOSURE: COMPLETE'
    );
  } else {
    reg = reg.replace(/TT_PCP_ARCHITECTURE: \w+/, 'TT_PCP_ARCHITECTURE: FROZEN');
    if (!reg.includes('TT_PCP_ARCHITECTURE_CLOSURE:')) {
      reg = reg.replace(/TT_PCP_ARCHITECTURE: FROZEN/, 'TT_PCP_ARCHITECTURE: FROZEN\n  TT_PCP_ARCHITECTURE_CLOSURE: COMPLETE');
    } else {
      reg = reg.replace(/TT_PCP_ARCHITECTURE_CLOSURE: \w+/, 'TT_PCP_ARCHITECTURE_CLOSURE: COMPLETE');
    }
  }
  reg = reg.replace(/updated_utc: "[^"]+"/, `updated_utc: "${isoFromStamp(STAMP)}"`);
  fs.writeFileSync(regPath, reg);

  let rb = fs.readFileSync(runbookPath, 'utf8');
  rb = rb.replace(
    /\*\*状态：\*\*[^\n]+/,
    '**状态：** **Architecture Closure COMPLETE** · `TT_PCP_ARCHITECTURE: FROZEN` · 2026-07-04'
  );
  if (!rb.includes('## Architecture Closure（**COMPLETE**')) {
    const anchor = '## Phase 1 Freeze / Regression Window';
    const section = `

---

## Architecture Closure（**COMPLETE** · ${STAMP}）

**机读键：** \`TT_PCP_ARCHITECTURE: FROZEN\` · \`TT_PCP_ARCHITECTURE_CLOSURE: COMPLETE\`

**程序节奏：**

\`\`\`text
Phase 1 COMPLETE → Architecture Closure (FROZEN) → Production Readiness → Phase 2 (Owner gate)
\`\`\`

**四份终稿（Architecture Closure 四件套）：**

| # | 文档 |
|---|------|
| ① | [PCP-ARCHITECTURE-FINAL.md](PCP-ARCHITECTURE-FINAL.md) |
| ② | [PCP-MIGRATION-HISTORY.md](PCP-MIGRATION-HISTORY.md) |
| ③ | [PCP-PLATFORM-CAPABILITY-MATRIX.md](PCP-PLATFORM-CAPABILITY-MATRIX.md) |
| ④ | [PCP-DEVELOPER-GUIDE.md](PCP-DEVELOPER-GUIDE.md) |

**冻结后变更：** 任何 Builder · Governance · Capability 修改 → **Architecture Review**（禁止 silent drift）。

**Phase 2：** \`NOT_STARTED\` — Owner 书面确认后方可启动 SearchBuilder / RecommendationBuilder。

**签收命令：** \`node scripts/dev/validate-pcp-architecture-closure.cjs\`

`;
    if (rb.includes(anchor)) {
      rb = rb.replace(anchor, section + anchor);
    }
  }
  fs.writeFileSync(runbookPath, rb);

  return { registry: regPath, runbook: runbookPath, evidence };
}

function main() {
  fs.mkdirSync(EVID_DIR, { recursive: true });
  console.log('\n=== PCP Architecture Closure ===\n');

  console.log('① Closure documents…');
  for (const doc of CLOSURE_DOCS) {
    const body = read(doc.rel);
    const ok = body.length > 0 && body.includes(doc.marker);
    record(doc.id, doc.rel, ok ? 'PASS' : 'FAIL', ok ? `contains "${doc.marker}"` : 'missing or incomplete');
  }

  console.log('② Phase 1 Freeze prerequisites…');
  const reg = read('registry/public-content-platform.v1.yaml');
  record(
    'prereq_phase1_freeze',
    'TT_PCP_PHASE_1_FREEZE: COMPLETE',
    /TT_PCP_PHASE_1_FREEZE: COMPLETE/.test(reg) ? 'PASS' : 'FAIL',
    'Run validate-pcp-phase1-freeze-regression.cjs first'
  );
  record(
    'prereq_phase2_not_started',
    'TT_PCP_PHASE_2: NOT_STARTED',
    /TT_PCP_PHASE_2: NOT_STARTED/.test(reg) ? 'PASS' : 'FAIL',
    'Phase 2 must remain NOT_STARTED at closure'
  );

  console.log('③ Regression stability (freeze chain)…');
  const freeze = spawnSync(process.execPath, [path.join(ROOT, 'scripts/dev/validate-pcp-phase1-freeze-regression.cjs')], {
    cwd: ROOT,
    encoding: 'utf8',
    env: { ...process.env, AUDIT_STAMP: STAMP },
  });
  record(
    'freeze_regression',
    'validate-pcp-phase1-freeze-regression.cjs',
    freeze.status === 0 ? 'PASS' : 'FAIL',
    freeze.status === 0 ? '7/7 stable' : (freeze.stdout || freeze.stderr || '').slice(-400)
  );

  const blocking = checks.filter((c) => c.status === 'FAIL');
  const signOffAllowed = blocking.length === 0;

  let ssotStamp = null;
  if (signOffAllowed) {
    ssotStamp = stampArchitectureFrozen({
      architecture_closure: `evidence/GO_public_content_platform/${STAMP}/pcp-architecture-closure-signoff.json`,
      closure_docs: CLOSURE_DOCS.map((d) => d.rel),
    });
  }

  const report = {
    validation: 'PCP_ARCHITECTURE_CLOSURE',
    stamp: STAMP,
    overall: signOffAllowed ? 'PASS' : 'FAIL',
    TT_PCP_ARCHITECTURE: signOffAllowed ? 'FROZEN' : 'PENDING',
    TT_PCP_ARCHITECTURE_CLOSURE: signOffAllowed ? 'COMPLETE' : 'IN_PROGRESS',
    TT_PCP_PHASE_2: 'NOT_STARTED',
    program_rhythm: [
      'Phase 1 COMPLETE',
      'Architecture Closure (FROZEN)',
      'Production Readiness (next gate)',
      'Phase 2 (Owner gate)',
    ],
    closure_documents: CLOSURE_DOCS.map((d) => d.rel),
    platform_split: {
      platform_a: ['Identity', 'Wallet', 'On-chain Governance', 'Settlement', 'RBAC'],
      platform_b: ['PCP Governance', 'Builder', 'Public Content', 'Evidence'],
    },
    sign_off_allowed: signOffAllowed,
    sign_off_note: signOffAllowed
      ? 'Architecture Closure complete — PCP architecture FROZEN; do not start Phase 2 without Owner sign-off'
      : 'Fix blocking items before stamping FROZEN',
    checks,
    ssot_stamp: ssotStamp,
  };

  const outPath = path.join(EVID_DIR, 'pcp-architecture-closure-signoff.json');
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2) + '\n');

  console.log(`\n=== Architecture Closure · ${report.overall} ===\n`);
  for (const c of checks) {
    console.log(`  [${c.status.padEnd(4)}] ${c.label}`);
  }
  console.log(`\n  TT_PCP_ARCHITECTURE: ${report.TT_PCP_ARCHITECTURE}`);
  console.log(`  TT_PCP_ARCHITECTURE_CLOSURE: ${report.TT_PCP_ARCHITECTURE_CLOSURE}`);
  console.log(`\nEvidence: ${path.relative(ROOT, outPath)}\n`);

  process.exit(signOffAllowed ? 0 : 1);
}

main();
