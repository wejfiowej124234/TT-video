#!/usr/bin/env node
/**
 * Executive Dashboard · PI3 · Release Pipeline gate consistency audit.
 * Rule: INTERIM_GO / WAITING_OWNER / IN_PROGRESS / PENDING must NOT count as CLOSED.
 *
 *   node scripts/dev/audit-executive-dashboard-gate-consistency.cjs
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');

function readText(rel) {
  return fs.readFileSync(path.join(ROOT, rel), 'utf8');
}

function parsePi3ReleaseGates(yaml) {
  const block = yaml.split('pi3_release_gates:')[1]?.split('production_readiness_gates:')[0] ?? '';
  const gates = [];
  for (const chunk of block.split('- id: ').slice(1)) {
    const id = chunk.split('\n')[0].trim();
    const status = chunk.match(/      status: (\S+)/)?.[1];
    if (id && status) gates.push({ id, status });
  }
  return gates;
}

function parseRollup(yaml) {
  const closed = Number(yaml.match(/rollup:\s*\n    closed:\s*(\d+)/)?.[1]);
  const interim = Number(yaml.match(/rollup:\s*\n    closed:\s*\d+\s*\n    interim:\s*(\d+)/)?.[1]);
  const open = Number(yaml.match(/rollup:\s*\n    closed:\s*\d+\s*\n    interim:\s*\d+\s*\n    open:\s*(\d+)/)?.[1]);
  return { closed, interim, open };
}

function parsePi3GateStatus(pi3Yaml, id) {
  if (id === 'PI3-005' || id === 'PI3-006') {
    const d = pi3Yaml.match(new RegExp(`${id}:\\s*\\n\\s*gate_status:\\s*(\\w+)`));
    return d?.[1];
  }
  const item = pi3Yaml.match(new RegExp(`${id}:[\\s\\S]*?gate_status:\\s*(\\w+)`));
  return item?.[1];
}

const CLOSED = new Set(['CLOSED']);
const INTERIM = new Set(['INTERIM_GO']);
const OPEN = new Set(['WAITING_OWNER', 'IN_PROGRESS', 'PENDING', 'OPEN']);

function rollup(gates) {
  let closed = 0;
  let interim = 0;
  let open = 0;
  for (const g of gates) {
    if (g.status === 'OPTIONAL') continue;
    if (CLOSED.has(g.status)) closed++;
    else if (INTERIM.has(g.status)) interim++;
    else if (OPEN.has(g.status)) open++;
    else throw new Error(`unknown gate status: ${g.id}=${g.status}`);
  }
  return { closed, interim, open };
}

const blockers = [];
const dashYaml = readText('registry/executive-dashboard.v1.yaml');
const pi3Yaml = readText('registry/phase3-production-infrastructure.v1.yaml');
const pipeYaml = readText('registry/release-pipeline.v1.yaml');

const pi3Gates = parsePi3ReleaseGates(dashYaml);
const computed = rollup(pi3Gates);
const declared = parseRollup(dashYaml);

for (const k of ['closed', 'interim', 'open']) {
  if (declared[k] !== computed[k]) {
    blockers.push({ code: 'ROLLUP_MISMATCH', field: k, declared: declared[k], computed: computed[k] });
  }
}

const pi3Map = {
  'PI3-001': 'CLOSED',
  'PI3-002': 'INTERIM_GO',
  'PI3-003': 'WAITING_OWNER',
  'PI3-004': 'INTERIM_GO',
  'PI3-005': 'OPTIONAL',
  'PI3-006': 'PENDING',
};

for (const [id, expected] of Object.entries(pi3Map)) {
  const regStatus = parsePi3GateStatus(pi3Yaml, id);
  if (regStatus !== expected) {
    blockers.push({ code: 'PI3_GATE_STATUS_MISMATCH', id, registry: regStatus, expected });
  }
}

for (const g of pi3Gates) {
  const expected = pi3Map[g.id];
  if (expected && g.status !== expected) {
    blockers.push({ code: 'DASHBOARD_GATE_MISMATCH', id: g.id, dashboard: g.status, expected });
  }
}

const optBlock = dashYaml.match(/p2_optional_gates:[\s\S]*?- id: PI3-005[\s\S]*?status: (\w+)/);
if (optBlock?.[1] !== 'OPTIONAL') {
  blockers.push({ code: 'DASHBOARD_OPTIONAL_GATE_MISMATCH', status: optBlock?.[1] });
}

const dashDecision =
  dashYaml.match(/TT_RELEASE_DECISION:\s*(\w+)/)?.[1] ??
  dashYaml.match(/release_decision:\s*(\w+)/)?.[1];
const pipeDecision = pipeYaml.match(/release_decision:\s*(\w+)/)?.[1];
if (dashDecision !== pipeDecision) {
  blockers.push({ code: 'RELEASE_DECISION_MISMATCH', dashboard: dashDecision, pipeline: pipeDecision });
}
if (dashDecision !== 'NO_GO' && (computed.interim > 0 || computed.open > 0)) {
  blockers.push({ code: 'OPEN_GATES_BUT_NOT_NO_GO', decision: dashDecision, computed });
}

const p0Section = pipeYaml.match(/p0_release_blockers:[\s\S]*?(?=\n  p1_|$)/)?.[0] ?? '';
if (/mainnet|PI3-005/i.test(p0Section)) {
  blockers.push({ code: 'MAINNET_IN_P0_BLOCKERS' });
}

if (!dashYaml.includes('forbid_interim_as_closed: true')) {
  blockers.push({ code: 'MISSING_FORBID_INTERIM_AS_CLOSED_FLAG' });
}

const evidStamp = '20260703T093000Z';
const outDir = path.join(ROOT, 'evidence/GO_executive_dashboard_gate_consistency', evidStamp);
fs.mkdirSync(outDir, { recursive: true });

const report = {
  schema: 'traveltrust.executive_dashboard_gate_consistency.v1',
  stamp: evidStamp,
  verdict: blockers.length === 0 ? 'PASS' : 'FAIL',
  blocking_count: blockers.length,
  rollup_computed: computed,
  rollup_declared: declared,
  release_decision: dashDecision,
  pi3_gates: pi3Gates,
  blockers,
  rules_enforced: [
    'INTERIM_GO not counted as CLOSED',
    'WAITING_OWNER IN_PROGRESS PENDING count as OPEN',
    'PI3-005 OPTIONAL excluded from release rollup',
    'Mainnet not in P0 blockers',
  ],
};

const outPath = path.join(outDir, 'gate-consistency-audit.json');
fs.writeFileSync(outPath, JSON.stringify(report, null, 2) + '\n');

console.log('VERDICT', report.verdict);
console.log('blocking_count', report.blocking_count);
console.log('rollup', JSON.stringify(computed));
console.log('evidence', path.relative(ROOT, outPath));
process.exit(blockers.length === 0 ? 0 : 1);
