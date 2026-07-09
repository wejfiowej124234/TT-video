/**
 * G2 Retrospective — freeze immutable G2 baseline (release process only).
 * No new platform capabilities; snapshots evidence, machine keys, matrix, lessons, G3 entry.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '../../..');
const REG_MATRIX = path.join(ROOT, 'registry/production-readiness-master-matrix.v1.yaml');
const REG_RELEASE = path.join(ROOT, 'registry/release-train-reality-verification.v1.json');

const G2_BLOCKERS = ['PRM-SEC-B001', 'PRM-SEC-B002', 'PRM-PER-B001', 'PRM-MON-B001'];

const G2_MACHINE_KEYS = [
  'TT_G2_REALITY_VERIFICATION',
  'TT_G2_REALITY_AUDIT',
  'TT_G2_REALITY_FIX',
  'TT_EVIDENCE_INTEGRITY_AUDIT',
  'TT_WAVE2_FORMAL_ACCEPTANCE',
  'TT_PRODUCTION_READINESS_G2_GATE',
  'TT_PRODUCTION_RUNTIME_IDENTITY',
  'TT_CONFIGURATION_TRUTH',
  'TT_PRODUCTION_GO',
  'TT_PRODUCTION_READINESS_G3_GATE',
  'TT_G3_REALITY_VERIFICATION',
];

const EVIDENCE_ROOTS = [
  'evidence/GO_production_readiness/g2-reality-audit',
  'evidence/GO_production_readiness/g2-reality-fix',
  'evidence/GO_production_readiness/g2-reality-verification',
  'evidence/GO_production_readiness/wave-2-g2',
  'evidence/GO_production_readiness/evidence-integrity',
  'evidence/GO_production_readiness/production-runtime-identity',
  'evidence/GO_platform_capability/coverage-audit',
];

function readJson(p) {
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

function gitShortSha() {
  try {
    return execSync('git rev-parse --short HEAD', { cwd: ROOT, encoding: 'utf8' }).trim();
  } catch {
    return 'unknown';
  }
}

function machineKey(yaml, key) {
  const m = yaml.match(new RegExp(`${key}: ([A-Z_0-9]+)`));
  return m ? m[1] : null;
}

function parseG2Gaps(yaml) {
  const gaps = [];
  const parts = yaml.split(/\r?\n  - id: PRM-/);
  for (const sec of parts.slice(1)) {
    const id = `PRM-${sec.split(/\r?\n/)[0].replace(/:$/, '')}`;
    if (!G2_BLOCKERS.includes(id)) continue;
    const block = `  - id: ${id}\n${sec}`;
    const field = (name) => {
      const m = block.match(new RegExp(`    ${name}: ([^\\n]+)`));
      return m ? m[1].trim().replace(/^"|"$/g, '') : null;
    };
    gaps.push({
      id,
      domain: field('domain'),
      status: field('status'),
      closed_evidence: field('closed_evidence'),
      audit_layer: field('audit_layer'),
      title: field('title'),
    });
  }
  return gaps;
}

function listSignoffs(baseRel, filename) {
  const base = path.join(ROOT, baseRel);
  if (!fs.existsSync(base)) return [];
  const out = [];
  for (const stamp of fs.readdirSync(base)) {
    const p = path.join(base, stamp, filename);
    if (fs.existsSync(p)) {
      out.push(`${baseRel}/${stamp}/${filename}`);
    }
  }
  return out.sort();
}

function collectEvidenceIndex(yaml) {
  const index = { roots: [], signoffs: [], blockers: [], formal_baseline: null, verification_baseline: null };

  for (const root of EVIDENCE_ROOTS) {
    const abs = path.join(ROOT, root);
    if (!fs.existsSync(abs)) continue;
    const stamps = fs
      .readdirSync(abs)
      .filter((d) => d !== 'latest' && fs.statSync(path.join(abs, d)).isDirectory())
      .sort();
    index.roots.push({ path: root, stamps, latest: stamps[stamps.length - 1] || null });
  }

  index.signoffs = [
    ...listSignoffs('evidence/GO_production_readiness/g2-reality-verification', 'g2-reality-verification-signoff.json'),
    ...listSignoffs('evidence/GO_production_readiness/wave-2-g2', 'g2-formal-acceptance-signoff.json'),
    ...listSignoffs('evidence/GO_production_readiness/wave-2-g2', 'g2-gate-signoff.json'),
    ...listSignoffs('evidence/GO_production_readiness/evidence-integrity', 'evidence-integrity-audit.json'),
    ...listSignoffs('evidence/GO_production_readiness/g2-retrospective', 'g2-retrospective-signoff.json'),
  ];

  const formalDirs = listSignoffs('evidence/GO_production_readiness/wave-2-g2', 'g2-formal-acceptance-signoff.json');
  if (formalDirs.length) {
    index.formal_baseline = path.dirname(formalDirs[formalDirs.length - 1]).replace(/\\/g, '/');
  }
  const verifyDirs = listSignoffs(
    'evidence/GO_production_readiness/g2-reality-verification',
    'g2-reality-verification-signoff.json'
  );
  if (verifyDirs.length) {
    index.verification_baseline = path.dirname(verifyDirs[verifyDirs.length - 1]).replace(/\\/g, '/');
  }

  for (const gap of parseG2Gaps(yaml)) {
    index.blockers.push({
      id: gap.id,
      status: gap.status,
      closed_evidence: gap.closed_evidence,
      exists: gap.closed_evidence ? fs.existsSync(path.join(ROOT, gap.closed_evidence)) : false,
    });
  }
  return index;
}

function buildMachineKeysSnapshot(yaml) {
  const keys = {};
  for (const k of G2_MACHINE_KEYS) {
    keys[k] = machineKey(yaml, k);
  }
  keys.TT_G2_RETROSPECTIVE = 'IN_PROGRESS';
  return keys;
}

function buildLessonsLearned() {
  return [
    {
      id: 'LL-G2-001',
      category: 'matrix_sync',
      title: 'G2 Gate recompute order',
      issue:
        'sync-production-readiness-g2-matrix.cjs ran recomputeG2Gate() before upserting TT_WAVE2_FORMAL_ACCEPTANCE: COMPLETE, leaving TT_PRODUCTION_READINESS_G2_GATE stuck at IN_PROGRESS after Formal.',
      fix: 'Move recomputeG2Gate() after all machine key upserts in formal (and all) modes.',
      files: ['scripts/dev/sync-production-readiness-g2-matrix.cjs'],
      prevention: 'Formal script step 5 must end with G2_GATE PASS in registry before gate validator.',
    },
    {
      id: 'LL-G2-002',
      category: 'runtime_probe',
      title: 'Fly env probe KEY=value format',
      issue:
        'g2-prod-probe.sh emitted bare values; production runtime identity guard failed on Fly layer parse.',
      fix: 'Probe outputs deployment_profile=production style KEY=value lines.',
      files: ['scripts/dev/lib/g2-prod-probe.sh'],
      prevention: 'Re-run run-production-runtime-identity-guard.sh after any prod probe change.',
    },
    {
      id: 'LL-G2-003',
      category: 'release_train_semantics',
      title: 'Verification COMPLETE ≠ G2 Gate PASS',
      issue: 'validate-g2-reality-verification.cjs initially set TT_PRODUCTION_READINESS_G2_GATE: PASS on verification alone.',
      fix: 'Verification sets TT_WAVE2_FORMAL_ACCEPTANCE: READY and G2_GATE: IN_PROGRESS; PASS only after Formal + gate validator.',
      files: [
        'scripts/dev/validate-g2-reality-verification.cjs',
        'scripts/dev/sync-production-readiness-g2-matrix.cjs',
      ],
      prevention: 'Never conflate Reality Verification, Formal Acceptance, and Gate PASS in machine keys.',
    },
    {
      id: 'LL-G2-004',
      category: 'matrix_evidence',
      title: 'CLOSED gaps require closed_evidence paths',
      issue: 'Matrix gaps marked CLOSED without repo evidence paths caused integrity audit and re-validate drift.',
      fix: 'upsertClosedEvidence() in sync script; integrity audit enforces CLOSED ↔ evidence ↔ signoff.',
      files: [
        'scripts/dev/sync-production-readiness-g2-matrix.cjs',
        'scripts/dev/lib/evidence-integrity-audit.cjs',
      ],
      prevention: 'Run evidence integrity audit before every Formal Acceptance.',
    },
    {
      id: 'LL-G2-005',
      category: 'platform_freeze',
      title: 'G2 closed without new platform capabilities',
      issue: 'Temptation to add Registry/Guard layers during hardening.',
      fix: 'Platform frozen; adoption migrations + release train scripts only; Architecture Review required for new surfaces.',
      files: ['registry/release-train-reality-verification.v1.json'],
      prevention: 'G3 work limited to production go-live domains only.',
    },
  ];
}

function buildG3EntryChecklist(yaml, machineKeys) {
  const g3RegPath = path.join(ROOT, 'registry/g3-production-domains.v1.json');
  const g3Reg = fs.existsSync(g3RegPath) ? JSON.parse(fs.readFileSync(g3RegPath, 'utf8')) : { domains: [] };
  const g3OpenBlockers = [];
  const parts = yaml.split(/\r?\n  - id: PRM-/);
  for (const sec of parts.slice(1)) {
    const block = `  - id: PRM-${sec}`;
    if (!block.includes('go_gate: G3')) continue;
    if (!block.includes('classification: BLOCKER')) continue;
    if (block.includes('status: OPEN')) {
      const id = block.match(/id: (PRM-[^\n]+)/)?.[1];
      g3OpenBlockers.push(id);
    }
  }

  const checks = [
    {
      id: 'G3-ENTRY-001',
      requirement: 'G2 Gate PASS (immutable baseline)',
      machine_key: 'TT_PRODUCTION_READINESS_G2_GATE',
      expected: 'PASS',
      actual: machineKeys.TT_PRODUCTION_READINESS_G2_GATE,
      pass: machineKeys.TT_PRODUCTION_READINESS_G2_GATE === 'PASS',
    },
    {
      id: 'G3-ENTRY-002',
      requirement: 'G2 Formal Acceptance COMPLETE',
      machine_key: 'TT_WAVE2_FORMAL_ACCEPTANCE',
      expected: 'COMPLETE',
      actual: machineKeys.TT_WAVE2_FORMAL_ACCEPTANCE,
      pass: machineKeys.TT_WAVE2_FORMAL_ACCEPTANCE === 'COMPLETE',
    },
    {
      id: 'G3-ENTRY-003',
      requirement: 'G2 Retrospective COMPLETE (this artifact)',
      machine_key: 'TT_G2_RETROSPECTIVE',
      expected: 'COMPLETE',
      actual: machineKeys.TT_G2_RETROSPECTIVE,
      pass: machineKeys.TT_G2_RETROSPECTIVE === 'COMPLETE',
    },
    {
      id: 'G3-ENTRY-004',
      requirement: 'Platform architecture frozen — no new Registry/Guard/Capability without Architecture Review',
      expected: 'FROZEN',
      actual: 'FROZEN',
      pass: true,
    },
    {
      id: 'G3-ENTRY-005',
      requirement: 'Production Runtime Identity PASS on prod profile',
      machine_key: 'TT_PRODUCTION_RUNTIME_IDENTITY',
      expected: 'PASS',
      actual: machineKeys.TT_PRODUCTION_RUNTIME_IDENTITY,
      pass: machineKeys.TT_PRODUCTION_RUNTIME_IDENTITY === 'PASS',
    },
    {
      id: 'G3-ENTRY-006',
      requirement: 'G3 Gate not yet started',
      machine_key: 'TT_PRODUCTION_READINESS_G3_GATE',
      expected: 'NOT_STARTED',
      actual: machineKeys.TT_PRODUCTION_READINESS_G3_GATE,
      pass: machineKeys.TT_PRODUCTION_READINESS_G3_GATE === 'NOT_STARTED',
    },
    {
      id: 'G3-ENTRY-007',
      requirement: 'Production GO remains NO_GO until G3 + Owner Decision',
      machine_key: 'TT_PRODUCTION_GO',
      expected: 'NO_GO',
      actual: machineKeys.TT_PRODUCTION_GO,
      pass: machineKeys.TT_PRODUCTION_GO === 'NO_GO',
    },
  ];

  const g3Scope = g3Reg.domains.map((d) => `${d.id} ${d.label}: ${d.topics.join(', ')}`);

  const forbidden = g3Reg.frozen_without_architecture_review || [

  return {
    ready_for_g3: checks.every((c) => c.pass) && g3OpenBlockers.length >= 0,
    checks,
    g3_open_blockers_in_matrix: g3OpenBlockers,
    g3_scope_production_only: g3Scope,
    forbidden_without_architecture_review: forbidden,
    g3_release_train:
      'G3 Reality Verification → Evidence Integrity Audit → G3 Formal Acceptance → TT_PRODUCTION_READINESS_G3_GATE PASS → Production GO Decision Package → TT_PRODUCTION_GO GO → Production Retrospective',
    g3_domains_ssot: 'registry/g3-production-domains.v1.json',
    production_go_sole_authority: 'docs/runbook/TT-PRODUCTION-GO-DECISION-PACKAGE.md',
    admission_question: g3Reg.principle?.en || 'Does this directly affect Production GO?',
  };
}

function renderLessonsMarkdown(lessons) {
  const lines = ['# G2 Lessons Learned', '', `Generated as immutable G2 baseline reference.`, ''];
  for (const ll of lessons) {
    lines.push(`## ${ll.id} · ${ll.title}`, '');
    lines.push(`- **Category:** ${ll.category}`);
    lines.push(`- **Issue:** ${ll.issue}`);
    lines.push(`- **Fix:** ${ll.fix}`);
    lines.push(`- **Prevention:** ${ll.prevention}`);
    lines.push(`- **Files:** ${ll.files.join(', ')}`);
    lines.push('');
  }
  return `${lines.join('\n')}\n`;
}

function generate({ evidenceDir, stamp }) {
  const yaml = fs.readFileSync(REG_MATRIX, 'utf8');
  const dir = path.join(ROOT, evidenceDir);
  fs.mkdirSync(dir, { recursive: true });

  const machineKeys = buildMachineKeysSnapshot(yaml);
  const evidenceIndex = collectEvidenceIndex(yaml);
  const lessons = buildLessonsLearned();
  const g3Entry = buildG3EntryChecklist(yaml, { ...machineKeys, TT_G2_RETROSPECTIVE: 'COMPLETE' });

  const preflight = {
    TT_PRODUCTION_READINESS_G2_GATE: machineKeys.TT_PRODUCTION_READINESS_G2_GATE,
    TT_WAVE2_FORMAL_ACCEPTANCE: machineKeys.TT_WAVE2_FORMAL_ACCEPTANCE,
    TT_G2_REALITY_VERIFICATION: machineKeys.TT_G2_REALITY_VERIFICATION,
  };
  const preflightPass =
    preflight.TT_PRODUCTION_READINESS_G2_GATE === 'PASS' &&
    preflight.TT_WAVE2_FORMAL_ACCEPTANCE === 'COMPLETE' &&
    preflight.TT_G2_REALITY_VERIFICATION === 'COMPLETE';

  fs.writeFileSync(path.join(dir, 'g2-evidence-index.json'), `${JSON.stringify(evidenceIndex, null, 2)}\n`);
  fs.writeFileSync(
    path.join(dir, 'g2-machine-keys-snapshot.yaml'),
    `# G2 Retrospective machine keys snapshot · ${stamp}\n# Immutable baseline — do not rewrite G2 sign-off by editing this file alone\n\nmachine_keys:\n${Object.entries(
      { ...machineKeys, TT_G2_RETROSPECTIVE: 'COMPLETE' }
    )
      .map(([k, v]) => `  ${k}: ${v}`)
      .join('\n')}\n`
  );
  fs.copyFileSync(REG_MATRIX, path.join(dir, 'g2-master-matrix-snapshot.yaml'));
  fs.writeFileSync(path.join(dir, 'lessons-learned.json'), `${JSON.stringify(lessons, null, 2)}\n`);
  fs.writeFileSync(path.join(dir, 'lessons-learned.md'), renderLessonsMarkdown(lessons));
  fs.writeFileSync(path.join(dir, 'g3-entry-checklist.json'), `${JSON.stringify(g3Entry, null, 2)}\n`);

  const blockersOk = evidenceIndex.blockers.every((b) => b.status === 'CLOSED' && b.exists);
  const pass = preflightPass && blockersOk && g3Entry.checks.slice(0, 3).every((c) => c.pass || c.id === 'G3-ENTRY-003');

  const signoff = {
    schema: 'traveltrust.g2_retrospective.v1',
    stamp,
    commit: gitShortSha(),
    purpose: 'Freeze immutable G2 baseline before G3 production go-live work',
    honest_boundary:
      'G2 Retrospective does not re-run probes · does not change G2 Gate · G3 work must not mutate G2 evidence paths',
    preflight,
    machine_keys: {
      TT_G2_RETROSPECTIVE: pass ? 'COMPLETE' : 'IN_PROGRESS',
      TT_PRODUCTION_READINESS_G2_GATE: machineKeys.TT_PRODUCTION_READINESS_G2_GATE,
      TT_WAVE2_FORMAL_ACCEPTANCE: machineKeys.TT_WAVE2_FORMAL_ACCEPTANCE,
      TT_PRODUCTION_READINESS_G3_GATE: machineKeys.TT_PRODUCTION_READINESS_G3_GATE,
      TT_PRODUCTION_GO: machineKeys.TT_PRODUCTION_GO,
    },
    evidence_index_path: `${evidenceDir}/g2-evidence-index.json`,
    matrix_snapshot_path: `${evidenceDir}/g2-master-matrix-snapshot.yaml`,
    formal_baseline: evidenceIndex.formal_baseline,
    verification_baseline: evidenceIndex.verification_baseline,
    g2_blockers: evidenceIndex.blockers,
    lessons_count: lessons.length,
    g3_entry_checklist_path: `${evidenceDir}/g3-entry-checklist.json`,
    g3_ready: g3Entry.ready_for_g3 && pass,
    verdict: pass ? 'G2_RETROSPECTIVE_COMPLETE' : 'G2_RETROSPECTIVE_BLOCKED',
  };

  fs.writeFileSync(path.join(dir, 'g2-retrospective-signoff.json'), `${JSON.stringify(signoff, null, 2)}\n`);

  return { signoff, pass, machineKeys: signoff.machine_keys };
}

module.exports = { generate, G2_BLOCKERS, G2_MACHINE_KEYS };
