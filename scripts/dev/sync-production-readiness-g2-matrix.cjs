#!/usr/bin/env node
/**
 * Apply G2 matrix_actions from Reality Audit / Fix / Re-Audit signoffs.
 *
 *   node scripts/dev/sync-production-readiness-g2-matrix.cjs --signoff ... [--mode audit|fix|re-audit]
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../..');
const REG_PATH = path.join(ROOT, 'registry/production-readiness-master-matrix.v1.yaml');

const BLOCKER_EVIDENCE_DIR = {
  'PRM-SEC-B001': 'security-b001',
  'PRM-SEC-B002': 'security-b002',
  'PRM-PER-B001': 'performance-b001',
  'PRM-MON-B001': 'monitoring-b001',
};

function parseArgs() {
  const args = { signoff: '', evidenceDir: '', mode: 'audit' };
  for (let i = 2; i < process.argv.length; i++) {
    if (process.argv[i] === '--signoff') args.signoff = process.argv[++i];
    if (process.argv[i] === '--evidence-dir') args.evidenceDir = process.argv[++i];
    if (process.argv[i] === '--mode') args.mode = process.argv[++i];
  }
  return args;
}

function upsertClosedEvidence(yaml, gapId, evidencePath, auditLayer) {
  let out = yaml;
  const blockRe = new RegExp(`(  - id: ${gapId}[\\s\\S]*?    status: )OPEN`, 'm');
  if (blockRe.test(out)) {
    const closedUtc = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
    out = out.replace(blockRe, `$1CLOSED`);
    if (!out.match(new RegExp(`(  - id: ${gapId}[\\s\\S]*?)    closed_utc:`, 'm'))) {
      out = out.replace(
        new RegExp(`(  - id: ${gapId}\\r?\\n[\\s\\S]*?    status: CLOSED)`, 'm'),
        `$1\n    closed_utc: "${closedUtc}"`
      );
    }
  }
  if (auditLayer && !out.match(new RegExp(`(  - id: ${gapId}[\\s\\S]*?)    audit_layer:`, 'm'))) {
    out = out.replace(
      new RegExp(`(  - id: ${gapId}\\r?\\n[\\s\\S]*?    status: CLOSED\\r?\\n)`, 'm'),
      `$1    audit_layer: ${auditLayer}\n`
    );
  }
  if (out.match(new RegExp(`(  - id: ${gapId}[\\s\\S]*?)    closed_evidence:`, 'm'))) {
    return out.replace(
      new RegExp(`(  - id: ${gapId}[\\s\\S]*?    closed_evidence: )[^\\n]+`, 'm'),
      `$1${evidencePath}`
    );
  }
  if (out.match(new RegExp(`(  - id: ${gapId}[\\s\\S]*?)(    closure: [^\\n]+)`, 'm'))) {
    return out.replace(
      new RegExp(`(  - id: ${gapId}[\\s\\S]*?)(    closure: [^\\n]+)`, 'm'),
      `$1    closed_evidence: ${evidencePath}\n$2`
    );
  }
  return out.replace(
    new RegExp(`(  - id: ${gapId}[\\s\\S]*?    status: CLOSED\\r?\\n)`, 'm'),
    `$1    closed_evidence: ${evidencePath}\n`
  );
}

function closeGapInYaml(yaml, gapId, evidencePath, auditLayer) {
  return upsertClosedEvidence(yaml, gapId, evidencePath, auditLayer);
}

function gapBlock(yaml, gapId) {
  const marker = `  - id: ${gapId}`;
  const start = yaml.indexOf(marker);
  if (start < 0) return '';
  const tail = yaml.slice(start + marker.length);
  const nextRel = tail.search(/\r?\n  - id: PRM-/);
  return yaml.slice(start, nextRel >= 0 ? start + marker.length + nextRel : yaml.length);
}

function reopenGapInYaml(yaml, gapId, reasonPath) {
  const block = gapBlock(yaml, gapId);
  if (!block || !block.includes('status: CLOSED')) return yaml;
  const start = yaml.indexOf(`  - id: ${gapId}`);
  let replaced = block.replace(/    status: CLOSED/, '    status: OPEN');
  replaced = replaced.replace(/    closed_utc: "[^"]+"\r?\n/, '');
  replaced = replaced.replace(/    closed_evidence: [^\r\n]+\r?\n/, '');
  let out = yaml.slice(0, start) + replaced + yaml.slice(start + block.length);
  if (!gapBlock(out, gapId).includes('audit_note:')) {
    const openRe = new RegExp(`(  - id: ${gapId}\\r?\\n[\\s\\S]*?    status: OPEN\\r?\\n)`);
    out = out.replace(openRe, `$1    audit_note: Reopened by G2 Reality Verification — see ${reasonPath}\n`);
  }
  return out;
}

function recomputeDomainBlocking(yaml, domainId, goGateFilter) {
  let count = 0;
  const parts = yaml.split(/\r?\n  - id: PRM-/);
  for (const sec of parts.slice(1)) {
    const block = '  - id: PRM-' + sec;
    if (!block.includes(`domain: ${domainId}`)) continue;
    if (!block.includes('classification: BLOCKER')) continue;
    if (goGateFilter && !block.includes(`go_gate: ${goGateFilter}`)) continue;
    if (block.includes('status: OPEN')) count++;
  }
  const domRe = new RegExp(`(  - id: ${domainId}\\r?\\n[\\s\\S]*?    blocking_count: )\\d+`, 'm');
  const status = count === 0 ? 'GREEN' : 'YELLOW';
  return yaml
    .replace(domRe, `$1${count}`)
    .replace(
      new RegExp(`(  - id: ${domainId}\\r?\\n[\\s\\S]*?    status: )(?:GREEN|YELLOW|RED)`, 'm'),
      `$1${status}`
    );
}

function listDomainIds(yaml) {
  const ids = [];
  for (const m of yaml.matchAll(/^  - id: ([a-z_]+)\r?\n    label:/gm)) {
    ids.push(m[1]);
  }
  return ids;
}

function recomputeG2Gate(yaml) {
  let openG2 = 0;
  const parts = yaml.split(/\r?\n  - id: PRM-/);
  for (const sec of parts.slice(1)) {
    const block = '  - id: PRM-' + sec;
    if (!block.includes('go_gate: G2')) continue;
    if (!block.includes('classification: BLOCKER')) continue;
    if (block.includes('status: OPEN')) openG2++;
  }
  const formal = yaml.match(/TT_WAVE2_FORMAL_ACCEPTANCE: (\w+)/)?.[1] || 'BLOCKED';
  const formalDone = formal === 'COMPLETE' || formal === 'PASS';
  const status = openG2 === 0 && formalDone ? 'PASS' : 'IN_PROGRESS';
  yaml = yaml.replace(/TT_PRODUCTION_READINESS_G2_GATE: \w+/, `TT_PRODUCTION_READINESS_G2_GATE: ${status}`);
  yaml = yaml.replace(/(  G2:[\s\S]*?    status: )\w+/, `$1${status}`);
  yaml = yaml.replace(/(    open_blockers: )\d+(\r?\n    domains: \[security)/, `$1${openG2}$2`);
  return yaml;
}

function evidencePathForBlocker(signoffRel, signoffDirRel, gapId) {
  const sub = BLOCKER_EVIDENCE_DIR[gapId];
  if (!sub) return signoffRel;
  return `${signoffDirRel}/${sub}`;
}

function upsertMachineKey(yaml, key, value) {
  const re = new RegExp(`(${key}: )\\w+`);
  if (re.test(yaml)) return yaml.replace(re, `$1${value}`);
  return yaml.replace(/(machine_keys:\r?\n)/, `$1  ${key}: ${value}\n`);
}

function main() {
  const { signoff, evidenceDir, mode } = parseArgs();
  if (!signoff) {
    console.error('Usage: --signoff evidence/.../signoff.json [--mode audit|fix|re-audit|verification|formal]');
    process.exit(1);
  }
  const sp = path.isAbsolute(signoff) ? signoff : path.join(ROOT, signoff);
  const audit = JSON.parse(fs.readFileSync(sp, 'utf8'));
  const evidRel = path.relative(ROOT, sp).replace(/\\/g, '/');
  const evidDirRel = path.dirname(evidRel).replace(/\\/g, '/');
  const auditLayer =
    mode === 'fix'
      ? 'g2_reality_fix'
      : mode === 're-audit'
        ? 'g2_reality_re_audit'
        : mode === 'verification'
          ? 'g2_reality_verification'
          : mode === 'formal'
            ? 'g2_formal_acceptance'
            : 'g2_reality';

  let yaml = fs.readFileSync(REG_PATH, 'utf8');
  const report = { sync: 'G2_MATRIX_SYNC', mode, signoff: evidRel, applied: [] };

  const toClose = audit.matrix_actions?.close || audit.matrix_actions?.verified || [];
  for (const id of audit.matrix_actions?.reopen || []) {
    yaml = reopenGapInYaml(yaml, id, evidRel);
    report.applied.push({ id, action: 'REOPEN' });
  }
  for (const id of toClose) {
    if ((audit.matrix_actions?.reopen || []).includes(id)) continue;
    const evPath = evidencePathForBlocker(evidRel, evidDirRel, id);
    yaml = closeGapInYaml(yaml, id, evPath, auditLayer);
    report.applied.push({ id, action: 'CLOSE', evidence: evPath });
  }

  for (const dom of listDomainIds(yaml)) {
    const goGate = ['security', 'performance', 'monitoring'].includes(dom) ? 'G2' : null;
    yaml = recomputeDomainBlocking(yaml, dom, goGate);
  }

  if (mode === 'audit') {
    yaml = upsertMachineKey(yaml, 'TT_G2_REALITY_AUDIT', 'COMPLETE');
  }
  if (mode === 'fix' && audit.machine_keys?.TT_G2_REALITY_FIX) {
    yaml = upsertMachineKey(yaml, 'TT_G2_REALITY_FIX', audit.machine_keys.TT_G2_REALITY_FIX);
  }
  if (mode === 're-audit' && audit.machine_keys?.TT_G2_REALITY_RE_AUDIT) {
    yaml = upsertMachineKey(yaml, 'TT_G2_REALITY_RE_AUDIT', audit.machine_keys.TT_G2_REALITY_RE_AUDIT);
    if (audit.machine_keys.TT_WAVE2_FORMAL_ACCEPTANCE) {
      yaml = upsertMachineKey(yaml, 'TT_WAVE2_FORMAL_ACCEPTANCE', audit.machine_keys.TT_WAVE2_FORMAL_ACCEPTANCE);
    }
  }
  if (mode === 'verification' && audit.machine_keys?.TT_G2_REALITY_VERIFICATION) {
    yaml = upsertMachineKey(yaml, 'TT_G2_REALITY_VERIFICATION', audit.machine_keys.TT_G2_REALITY_VERIFICATION);
    if (audit.machine_keys.TT_WAVE2_FORMAL_ACCEPTANCE) {
      yaml = upsertMachineKey(yaml, 'TT_WAVE2_FORMAL_ACCEPTANCE', audit.machine_keys.TT_WAVE2_FORMAL_ACCEPTANCE);
    }
    if (audit.machine_keys.TT_PRODUCTION_RUNTIME_IDENTITY) {
      yaml = upsertMachineKey(
        yaml,
        'TT_PRODUCTION_RUNTIME_IDENTITY',
        audit.machine_keys.TT_PRODUCTION_RUNTIME_IDENTITY
      );
    }
    if (audit.machine_keys.TT_CONFIGURATION_TRUTH) {
      yaml = upsertMachineKey(yaml, 'TT_CONFIGURATION_TRUTH', audit.machine_keys.TT_CONFIGURATION_TRUTH);
    }
  }
  if (mode === 'formal' && audit.machine_keys?.TT_WAVE2_FORMAL_ACCEPTANCE) {
    yaml = upsertMachineKey(yaml, 'TT_WAVE2_FORMAL_ACCEPTANCE', audit.machine_keys.TT_WAVE2_FORMAL_ACCEPTANCE);
  }

  yaml = recomputeG2Gate(yaml);

  yaml = yaml.replace(/updated_utc: "[^"]+"/, `updated_utc: "${new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')}"`);

  fs.writeFileSync(REG_PATH, yaml);

  if (evidenceDir) {
    fs.mkdirSync(path.join(ROOT, evidenceDir), { recursive: true });
    fs.writeFileSync(path.join(ROOT, evidenceDir, 'matrix-sync.json'), `${JSON.stringify(report, null, 2)}\n`);
  }

  console.log(JSON.stringify(report, null, 2));
}

main();
