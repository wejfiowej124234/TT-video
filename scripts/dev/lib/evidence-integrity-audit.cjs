/**
 * Evidence Integrity Audit — Release Train pre-Formal consistency check.
 * Not a new platform capability; validates Matrix ↔ Evidence ↔ Sign-off alignment.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../../..');
const REG_MATRIX = path.join(ROOT, 'registry/production-readiness-master-matrix.v1.yaml');

const G2_BLOCKERS = ['PRM-SEC-B001', 'PRM-SEC-B002', 'PRM-PER-B001', 'PRM-MON-B001'];

const REPRO_MARKERS = {
  'PRM-SEC-B001': ['internal-route-matrix.json', 'meta-summary.txt'],
  'PRM-SEC-B002': ['prod/meta-build.json', 'fly-env-redacted.txt'],
  'PRM-PER-B001': ['perf-summary.json'],
  'PRM-MON-B001': ['probes.txt'],
};

function readJson(p) {
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

function parseGaps(yaml) {
  const gaps = [];
  const parts = yaml.split(/\r?\n  - id: PRM-/);
  for (const sec of parts.slice(1)) {
    const id = `PRM-${sec.split(/\r?\n/)[0].replace(/:$/, '')}`;
    const block = `  - id: ${id}\n${sec}`;
    const field = (name) => {
      const m = block.match(new RegExp(`    ${name}: ([^\\n]+)`));
      return m ? m[1].trim().replace(/^"|"$/g, '') : null;
    };
    gaps.push({
      id,
      domain: field('domain'),
      go_gate: field('go_gate'),
      classification: field('classification'),
      status: field('status'),
      closed_evidence: field('closed_evidence'),
      evidence: field('evidence'),
      audit_layer: field('audit_layer'),
    });
  }
  return gaps;
}

function machineKey(yaml, key) {
  const m = yaml.match(new RegExp(`${key}: ([A-Z_0-9]+)`));
  return m ? m[1] : null;
}

function isRepoEvidencePath(p) {
  if (!p) return false;
  return (
    p.startsWith('evidence/') ||
    p.startsWith('frontend/evidence/') ||
    p.includes('GO_production_readiness') ||
    p.includes('GO_platform_capability')
  );
}

function evidenceDirExists(rel) {
  if (!rel) return false;
  return fs.existsSync(path.join(ROOT, rel.replace(/\\/g, '/')));
}

function findLatestVerificationSignoff() {
  const base = path.join(ROOT, 'evidence/GO_production_readiness/g2-reality-verification');
  if (!fs.existsSync(base)) return null;
  const stamps = fs
    .readdirSync(base)
    .filter((d) => fs.existsSync(path.join(base, d, 'g2-reality-verification-signoff.json')))
    .sort();
  if (!stamps.length) return null;
  const stamp = stamps[stamps.length - 1];
  return {
    stamp,
    rel: `evidence/GO_production_readiness/g2-reality-verification/${stamp}`,
    signoff: readJson(path.join(base, stamp, 'g2-reality-verification-signoff.json')),
  };
}

function reproCheck(gapId, evidenceRel) {
  const markers = REPRO_MARKERS[gapId];
  if (!markers) return { reproducible: null, missing: [] };
  const base = path.join(ROOT, evidenceRel);
  const missing = markers.filter((f) => !fs.existsSync(path.join(base, f)));
  return { reproducible: missing.length === 0, missing };
}

/**
 * @param {{ gate?: string, verificationSignoffRel?: string }} opts
 */
function runEvidenceIntegrityAudit(opts = {}) {
  const gate = opts.gate || 'G2';
  const yaml = fs.readFileSync(REG_MATRIX, 'utf8');
  const gaps = parseGaps(yaml);
  const findings = [];

  let signoffBundle = null;
  if (opts.verificationSignoffRel) {
    const sp = path.join(ROOT, opts.verificationSignoffRel);
    signoffBundle = {
      rel: opts.verificationSignoffRel.replace(/\\/g, '/').replace(/\/g2-reality-verification-signoff\.json$/, ''),
      signoff: readJson(sp),
    };
  } else if (machineKey(yaml, 'TT_G2_REALITY_VERIFICATION') === 'COMPLETE') {
    signoffBundle = findLatestVerificationSignoff();
  }

  const scopeGaps = gaps.filter((g) => {
    if (gate === 'G2') {
      return g.go_gate === 'G2' && g.classification === 'BLOCKER';
    }
    return g.classification === 'BLOCKER';
  });

  for (const gap of scopeGaps) {
    if (gap.status === 'OPEN') {
      findings.push({
        id: gap.id,
        kind: 'open_blocker',
        severity: 'FAIL',
        detail: `${gap.id} still OPEN in Matrix`,
      });
      continue;
    }

    if (gap.status !== 'CLOSED') continue;

    const ev = gap.closed_evidence || gap.evidence;
    if (!gap.closed_evidence) {
      findings.push({
        id: gap.id,
        kind: 'closed_without_closed_evidence',
        severity: isRepoEvidencePath(gap.evidence) ? 'WARN' : 'FAIL',
        detail: `CLOSED without closed_evidence (legacy: ${gap.evidence || 'none'})`,
      });
    }

    if (!isRepoEvidencePath(ev)) {
      findings.push({
        id: gap.id,
        kind: 'non_repo_evidence',
        severity: gate === 'G2' ? 'FAIL' : 'WARN',
        detail: `Evidence is doc/reference only: ${ev || 'missing'}`,
      });
      continue;
    }

    if (!evidenceDirExists(gap.closed_evidence || ev)) {
      findings.push({
        id: gap.id,
        kind: 'missing_evidence_path',
        severity: 'FAIL',
        detail: `Path not on disk: ${gap.closed_evidence || ev}`,
      });
      continue;
    }

    const repro = reproCheck(gap.id, gap.closed_evidence || ev);
    if (repro.reproducible === false) {
      findings.push({
        id: gap.id,
        kind: 'repro_markers_missing',
        severity: 'FAIL',
        detail: `Evidence dir missing repro markers: ${repro.missing.join(', ')}`,
      });
    }
  }

  if (signoffBundle?.signoff) {
    const signoff = signoffBundle.signoff;
    const verified = (signoff.findings || [])
      .filter((f) => f.verdict === 'VERIFIED')
      .map((f) => f.id);
    const signoffRel = signoffBundle.rel;

    if (machineKey(yaml, 'TT_G2_REALITY_VERIFICATION') !== 'COMPLETE') {
      findings.push({
        id: 'SIGNOFF',
        kind: 'verification_not_complete',
        severity: 'FAIL',
        detail: 'TT_G2_REALITY_VERIFICATION is not COMPLETE while signoff present',
      });
    }

    for (const id of G2_BLOCKERS) {
      const gap = gaps.find((g) => g.id === id);
      if (verified.includes(id) && gap?.status !== 'CLOSED') {
        findings.push({
          id,
          kind: 'verified_but_matrix_open',
          severity: 'FAIL',
          detail: `${id} VERIFIED in signoff but Matrix status=${gap?.status}`,
        });
      }
      if (verified.includes(id) && gap?.closed_evidence && !gap.closed_evidence.includes(signoffRel.split('/').slice(-1)[0])) {
        findings.push({
          id,
          kind: 'signoff_stamp_drift',
          severity: 'WARN',
          detail: `${id} closed_evidence stamp may differ from latest verification ${signoffRel}`,
        });
      }
      if (verified.includes(id) && !gap?.closed_evidence) {
        findings.push({
          id,
          kind: 'verified_without_closed_evidence',
          severity: 'FAIL',
          detail: `${id} VERIFIED in signoff but Matrix has no closed_evidence`,
        });
      }
    }

    findings.push({
      id: 'SIGNOFF',
      kind: 'signoff_registry',
      severity: 'INFO',
      detail: `Verification signoff: ${signoffRel}/g2-reality-verification-signoff.json`,
    });
  } else if (gate === 'G2') {
    findings.push({
      id: 'SIGNOFF',
      kind: 'no_verification_signoff',
      severity: 'FAIL',
      detail: 'No g2-reality-verification-signoff.json found for cross-reference',
    });
  }

  const fails = findings.filter((f) => f.severity === 'FAIL');
  const warns = findings.filter((f) => f.severity === 'WARN');
  const pass = fails.length === 0;

  return {
    review_id: 'EVIDENCE-INTEGRITY-AUDIT',
    stamp: opts.stamp || new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, 'Z'),
    gate,
    machine_key: 'TT_EVIDENCE_INTEGRITY_AUDIT',
    matrix: 'registry/production-readiness-master-matrix.v1.yaml',
    verification_signoff: signoffBundle?.rel || opts.verificationSignoffRel || null,
    scope: gate === 'G2' ? 'go_gate:G2 BLOCKER gaps' : 'all BLOCKER gaps',
    gaps_scoped: scopeGaps.length,
    findings,
    fail_count: fails.length,
    warn_count: warns.length,
    pass,
    verdict: pass ? 'PASS' : 'FAIL',
    blocks_formal: !pass,
    reproduce_hint:
      'bash scripts/dev/run-reality-verification.sh --gate G2 · node scripts/dev/validate-evidence-integrity-audit.cjs --gate G2',
  };
}

function writeEvidenceIntegrityEvidence(outDir, summary) {
  const base = path.isAbsolute(outDir) ? outDir : path.join(ROOT, outDir);
  fs.mkdirSync(base, { recursive: true });
  fs.writeFileSync(path.join(base, 'evidence-integrity-audit.json'), `${JSON.stringify(summary, null, 2)}\n`);
  return base;
}

module.exports = {
  ROOT,
  runEvidenceIntegrityAudit,
  writeEvidenceIntegrityEvidence,
  parseGaps,
  findLatestVerificationSignoff,
};
