#!/usr/bin/env node
/**
 * Production Readiness Master Matrix — gap review sign-off
 *
 * Validates registry/production-readiness-master-matrix.v1.yaml structure,
 * reconciles domain blocking counts vs OPEN BLOCKER gaps, writes evidence JSON.
 *
 * Does NOT modify PCP. Does NOT start Phase 2.
 *
 *   node scripts/dev/validate-production-readiness-master-matrix.cjs
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../..');
const REG_PATH = path.join(ROOT, 'registry/production-readiness-master-matrix.v1.yaml');
const STAMP = process.env.AUDIT_STAMP || new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, 'Z');
const EVID_DIR = path.join(ROOT, 'evidence', 'GO_production_readiness', STAMP);

const REQUIRED_DOCS = [
  'docs/runbook/TT-PRODUCTION-READINESS-MASTER-MATRIX.md',
  'docs/runbook/PRODUCTION-READINESS-MASTER-GAP-REPORT.md',
  'docs/runbook/TT-PRODUCTION-READINESS-PROGRAM.md',
  'registry/production-readiness-master-matrix.v1.yaml',
];

const REQUIRED_DOMAINS = [
  'security',
  'browser_uat',
  'manual_validation',
  'performance',
  'observability',
  'deployment',
  'domain_cdn',
  'stripe_live',
  'disaster_recovery',
  'monitoring',
];

const CLASSIFICATIONS = ['BLOCKER', 'DEFECT', 'EXPECTED_DIFFERENCE', 'ENHANCEMENT'];

const checks = [];

function record(id, label, status, detail) {
  checks.push({ id, label, status, detail });
}

function read(rel) {
  const p = path.join(ROOT, rel);
  return fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : null;
}

function parseSimpleYaml(text) {
  const doc = {
    machine_keys: {},
    domains: [],
    gaps: [],
    closure_plan: {},
    forbidden_until_production_go: [],
  };

  const lines = text.split('\n');
  let section = null;
  let currentDomain = null;
  let currentGap = null;
  let inMachineKeys = false;
  let inDomains = false;
  let inGaps = false;

  for (const raw of lines) {
    const line = raw.replace(/\r$/, '');
    if (line.startsWith('machine_keys:')) {
      inMachineKeys = true;
      inDomains = false;
      inGaps = false;
      continue;
    }
    if (line.startsWith('domains:')) {
      inMachineKeys = false;
      inDomains = true;
      inGaps = false;
      continue;
    }
    if (line.startsWith('gaps:')) {
      inMachineKeys = false;
      inDomains = false;
      inGaps = true;
      continue;
    }
    if (line.match(/^[a-z_]+:/) && !line.startsWith('  ')) {
      inMachineKeys = false;
      inDomains = false;
      inGaps = false;
    }

    const mk = line.match(/^  ([A-Z0-9_]+): (.+)$/);
    if (inMachineKeys && mk) {
      doc.machine_keys[mk[1]] = mk[2];
    }

    const domStart = line.match(/^  - id: (.+)$/);
    if (inDomains && domStart) {
      currentDomain = { id: domStart[1], blocking_count: null, status: null, label: null };
      doc.domains.push(currentDomain);
      continue;
    }
    if (inDomains && currentDomain) {
      const label = line.match(/^    label: (.+)$/);
      if (label) currentDomain.label = label[1];
      const status = line.match(/^    status: (.+)$/);
      if (status) currentDomain.status = status[1];
      const bc = line.match(/^    blocking_count: (\d+)$/);
      if (bc) currentDomain.blocking_count = Number(bc[1]);
    }

    const gapStart = line.match(/^  - id: (PRM-[A-Z0-9-]+)$/);
    if (inGaps && gapStart) {
      currentGap = { id: gapStart[1], classification: null, domain: null, status: 'OPEN' };
      doc.gaps.push(currentGap);
      continue;
    }
    if (inGaps && currentGap) {
      const cls = line.match(/^    classification: (.+)$/);
      if (cls) currentGap.classification = cls[1];
      const dom = line.match(/^    domain: (.+)$/);
      if (dom) currentGap.domain = dom[1];
      const st = line.match(/^    status: (.+)$/);
      if (st) currentGap.status = st[1];
    }
  }

  return doc;
}

function statusEmoji(status) {
  if (status === 'GREEN') return '🟢';
  if (status === 'RED') return '🔴';
  return '🟡';
}

function main() {
  for (const rel of REQUIRED_DOCS) {
    const content = read(rel);
    record(
      `doc_${rel.replace(/[^a-z0-9]+/gi, '_')}`,
      rel,
      content ? 'PASS' : 'FAIL',
      content ? 'present' : 'missing'
    );
  }

  if (!fs.existsSync(REG_PATH)) {
    console.error('FAIL: registry missing');
    process.exit(1);
  }

  const regText = fs.readFileSync(REG_PATH, 'utf8');
  const reg = parseSimpleYaml(regText);

  for (const key of ['TT_PRODUCTION_READINESS_MASTER_MATRIX', 'TT_PRODUCTION_READINESS_PROGRAM']) {
    record(
      `key_${key}`,
      key,
      reg.machine_keys[key] === 'ACTIVE' ? 'PASS' : 'FAIL',
      reg.machine_keys[key] || 'missing'
    );
  }
  for (const key of ['TT_PRODUCTION_READINESS_SOLE_EXECUTION_ENTRY', 'TT_RELEASE_TRAIN']) {
    const expected = key === 'TT_PRODUCTION_READINESS_SOLE_EXECUTION_ENTRY' ? 'ENFORCED' : 'ACTIVE';
    record(
      `key_${key}`,
      key,
      reg.machine_keys[key] === expected ? 'PASS' : 'FAIL',
      reg.machine_keys[key] || 'missing'
    );
  }

  record(
    'key_TT_PCP_ARCHITECTURE',
    'TT_PCP_ARCHITECTURE',
    reg.machine_keys.TT_PCP_ARCHITECTURE === 'FROZEN' ? 'PASS' : 'FAIL',
    reg.machine_keys.TT_PCP_ARCHITECTURE || 'missing'
  );

  record(
    'key_TT_PCP_PHASE_2',
    'TT_PCP_PHASE_2',
    reg.machine_keys.TT_PCP_PHASE_2 === 'NOT_STARTED' ? 'PASS' : 'FAIL',
    reg.machine_keys.TT_PCP_PHASE_2 || 'missing'
  );

  const domainIds = reg.domains.map((d) => d.id);
  for (const id of REQUIRED_DOMAINS) {
    record(
      `domain_${id}`,
      `domain ${id}`,
      domainIds.includes(id) ? 'PASS' : 'FAIL',
      domainIds.includes(id) ? 'registered' : 'missing'
    );
  }

  const openBlockers = reg.gaps.filter(
    (g) => g.classification === 'BLOCKER' && g.status === 'OPEN'
  );
  const openDefects = reg.gaps.filter(
    (g) => g.classification === 'DEFECT' && g.status === 'OPEN'
  );

  for (const cls of CLASSIFICATIONS) {
    const used = reg.gaps.some((g) => g.classification === cls);
    record(
      `class_${cls}`,
      `classification ${cls}`,
      used || cls === 'BLOCKER' ? 'PASS' : 'WARN',
      used ? 'in use' : 'no gaps'
    );
  }

  const blockingByDomain = {};
  for (const g of openBlockers) {
    blockingByDomain[g.domain] = (blockingByDomain[g.domain] || 0) + 1;
  }

  let reconcileFail = false;
  for (const d of reg.domains) {
    const computed = blockingByDomain[d.id] || 0;
    const ok = d.blocking_count === computed;
    if (!ok) reconcileFail = true;
    record(
      `reconcile_${d.id}`,
      `${d.label || d.id} blocking_count`,
      ok ? 'PASS' : 'FAIL',
      `matrix=${d.blocking_count} computed=${computed}`
    );
  }

  const matrixRows = reg.domains.map((d) => ({
    domain: d.label || d.id,
    status: statusEmoji(d.status),
    blocking: d.blocking_count,
    owner: 'You',
  }));

  fs.mkdirSync(EVID_DIR, { recursive: true });
  const signoff = {
    review_id: 'PRM-GAP-REVIEW-20260704',
    stamp: STAMP,
    machine_keys: {
      TT_PRODUCTION_READINESS_MASTER_MATRIX: 'ACTIVE',
      TT_PRODUCTION_READINESS_MASTER_GAP_REVIEW: 'COMPLETE',
      TT_PRODUCTION_GO: reg.machine_keys.TT_PRODUCTION_GO || 'NO_GO',
      TT_PCP_ARCHITECTURE: 'FROZEN',
      TT_PCP_PHASE_2: 'NOT_STARTED',
    },
    totals: {
      open_blocker: openBlockers.length,
      open_defect: openDefects.length,
      domains: reg.domains.length,
      gaps: reg.gaps.length,
    },
    matrix: matrixRows,
    checks,
    all_pass: checks.every((c) => c.status === 'PASS'),
  };

  fs.writeFileSync(
    path.join(EVID_DIR, 'master-gap-review-signoff.json'),
    `${JSON.stringify(signoff, null, 2)}\n`
  );

  console.log('Production Readiness Master Matrix validation');
  console.log('─'.repeat(60));
  for (const c of checks) {
    console.log(`${c.status.padEnd(5)} ${c.label} — ${c.detail}`);
  }
  console.log('─'.repeat(60));
  console.log('Master Matrix:');
  for (const r of matrixRows) {
    console.log(
      `  ${r.domain.padEnd(18)} ${r.status}  blocking=${String(r.blocking).padStart(2)}  owner=${r.owner}`
    );
  }
  console.log('─'.repeat(60));
  console.log(`OPEN BLOCKER: ${openBlockers.length} · OPEN DEFECT: ${openDefects.length}`);
  console.log(`Evidence: evidence/GO_production_readiness/${STAMP}/master-gap-review-signoff.json`);
  console.log(
    `TT_PRODUCTION_READINESS_MASTER_MATRIX: ACTIVE · TT_PRODUCTION_READINESS_MASTER_GAP_REVIEW: COMPLETE · TT_PRODUCTION_GO: ${signoff.machine_keys.TT_PRODUCTION_GO}`
  );

  if (!signoff.all_pass || reconcileFail) {
    process.exit(1);
  }
}

main();
