#!/usr/bin/env node
/**
 * PI3 Production Infrastructure Prep Ledger (002→001→003→004)
 * Execution prep HOLD is expected until Owner supplies prod domain/secrets.
 */
const fs = require('fs');
const path = require('path');

const ROOT = process.env.ROOT || path.resolve(__dirname, '../..');
const STAMP = process.env.STAMP || new Date().toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
const OUT = process.env.EVIDENCE_DIR || path.join(ROOT, 'evidence/GO_phase2_testnet_20260526/phase3-production-prep', `pi3-infra-prep-${STAMP}`);

function latestExec(prefix) {
  const base = path.join(ROOT, 'evidence/GO_phase2_testnet_20260526/phase3-production-prep');
  if (!fs.existsSync(base)) return null;
  const dirs = fs.readdirSync(base).filter((d) => d.startsWith(prefix)).sort();
  if (!dirs.length) return null;
  const p = path.join(base, dirs[dirs.length - 1], 'summary.json');
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : null;
}

const items = [
  { id: 'PI3-002', sprint: '151', summary: latestExec('pi3-002-exec-') },
  { id: 'PI3-001', sprint: '152', summary: latestExec('pi3-001-exec-') },
  { id: 'PI3-003', sprint: '153', summary: latestExec('pi3-003-exec-') },
  { id: 'PI3-004', sprint: '154', summary: latestExec('pi3-004-exec-') },
];

const rows = items.map((it) => ({
  id: it.id,
  sprint: it.sprint,
  verdict: it.summary?.verdict || 'NOT_RUN',
  execution_prep: it.summary?.verdict?.match(/^PI3-\d{3}_(HOLD|GO)$/) ? 'COMPLETE' : 'MISSING',
  owner_live_closure: it.summary?.verdict?.endsWith('_GO') ? 'CLOSED' : 'OPEN',
}));

const ledger = {
  schema: 'traveltrust.pi3_production_infrastructure_prep_ledger.v1',
  stamp: STAMP,
  generated_at_utc: new Date().toISOString(),
  scope: 'PRODUCTION_SCOPE_SEPOLIA',
  dependency_order: ['PI3-002', 'PI3-001', 'PI3-003', 'PI3-004'],
  deferred: ['PI3-005', 'PI3-006'],
  machine_keys: {
    TT_PI3_PRODUCTION_INFRA_PREP: 'ACTIVE',
    TT_PRODUCTION_CAPABILITY: 'IN_PROGRESS',
    TT_RELEASE_DECISION: 'NO_GO',
  },
  summary: {
    execution_prep_complete: rows.every((r) => r.execution_prep === 'COMPLETE'),
    owner_live_open: rows.filter((r) => r.owner_live_closure === 'OPEN').length,
    items: rows,
  },
  owner_checklist: 'docs/runbook/PI3-OWNER-MINIMAL-CONFIG-CHECKLIST.md',
  runbook: 'docs/runbook/TT-PI3-PRODUCTION-INFRASTRUCTURE-PREP.md',
};

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'pi3-prep-ledger.json'), JSON.stringify(ledger, null, 2) + '\n');

const md = `# PI3 Production Infrastructure Prep Ledger

**Stamp:** ${STAMP}

| ID | Verdict | Execution prep | Owner live |
|----|---------|----------------|------------|
${rows.map((r) => `| ${r.id} | ${r.verdict} | ${r.execution_prep} | ${r.owner_live_closure} |`).join('\n')}

**Deferred:** PI3-005 (Mainnet scope) · PI3-006 (Go-Live) — after Owner closes 002–004 live.
`;
fs.writeFileSync(path.join(OUT, 'PI3-PREP-LEDGER.md'), md);

console.log(JSON.stringify(ledger.summary, null, 2));
