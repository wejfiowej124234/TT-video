/**
 * Production Retrospective — freeze V1 launch baseline after TT_PRODUCTION_GO: GO.
 * Release process only; no platform development.
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '../../..');
const REG_MATRIX = path.join(ROOT, 'registry/production-readiness-master-matrix.v1.yaml');
const REG_G3 = path.join(ROOT, 'registry/g3-production-domains.v1.json');

const PRODUCTION_MACHINE_KEYS = [
  'TT_PRODUCTION_READINESS_G1_GATE',
  'TT_PRODUCTION_READINESS_G2_GATE',
  'TT_PRODUCTION_READINESS_G3_GATE',
  'TT_G2_RETROSPECTIVE',
  'TT_G3_REALITY_VERIFICATION',
  'TT_WAVE3_FORMAL_ACCEPTANCE',
  'TT_PRODUCTION_GO',
  'TT_PRODUCTION_RETROSPECTIVE',
];

const EVIDENCE_ROOTS = [
  'evidence/GO_production_readiness/g3-production-network',
  'evidence/GO_production_readiness/g3-payment',
  'evidence/GO_production_readiness/g3-disaster-recovery',
  'evidence/GO_production_readiness/g3-monitoring',
  'evidence/GO_production_readiness/g3-cutover',
  'evidence/GO_production_readiness/production-go-decision',
  'evidence/GO_production_readiness/g2-retrospective',
  'evidence/GO_production_readiness/wave-2-g2',
  'evidence/GO_production_readiness/g3-reality-verification',
  'evidence/GO_production_readiness/wave-3-g3',
];

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

function collectEvidenceIndex() {
  const index = { roots: [], decision_package: null };
  for (const root of EVIDENCE_ROOTS) {
    const abs = path.join(ROOT, root);
    if (!fs.existsSync(abs)) continue;
    const stamps = fs
      .readdirSync(abs)
      .filter((d) => d !== 'latest' && fs.statSync(path.join(abs, d)).isDirectory())
      .sort();
    index.roots.push({ path: root, stamps, latest: stamps[stamps.length - 1] || null });
  }
  const goRoot = path.join(ROOT, 'evidence/GO_production_readiness/production-go-decision');
  if (fs.existsSync(goRoot)) {
    const stamps = fs
      .readdirSync(goRoot)
      .filter((d) => fs.existsSync(path.join(goRoot, d, 'production-go-decision-package.json')))
      .sort();
    if (stamps.length) {
      index.decision_package = `evidence/GO_production_readiness/production-go-decision/${stamps[stamps.length - 1]}/production-go-decision-package.json`;
    }
  }
  return index;
}

function buildLaunchTimeline(yaml, g3Reg) {
  return {
    g1_gate: machineKey(yaml, 'TT_PRODUCTION_READINESS_G1_GATE'),
    g2_gate: machineKey(yaml, 'TT_PRODUCTION_READINESS_G2_GATE'),
    g2_retrospective: machineKey(yaml, 'TT_G2_RETROSPECTIVE'),
    g3_gate: machineKey(yaml, 'TT_PRODUCTION_READINESS_G3_GATE'),
    production_go: machineKey(yaml, 'TT_PRODUCTION_GO'),
    g3_domains: g3Reg.domains.map((d) => ({ id: d.id, label: d.label, evidence_root: d.evidence_root })),
    note: 'Immutable V1 launch baseline — do not rewrite when developing V2+',
  };
}

function buildLessonsPlaceholder() {
  return [
    {
      id: 'LL-PROD-001',
      category: 'g3_scope',
      title: 'G3 six domains only',
      lesson: 'All cutover work maps to G3-01..G3-06; platform/architecture frozen.',
    },
    {
      id: 'LL-PROD-002',
      category: 'production_go',
      title: 'Decision Package sole authority',
      lesson: 'TT_PRODUCTION_GO set only via validate-production-go-decision-package.cjs after G1+G2+G3 PASS.',
    },
  ];
}

function generate({ evidenceDir, stamp }) {
  const yaml = fs.readFileSync(REG_MATRIX, 'utf8');
  const g3Reg = JSON.parse(fs.readFileSync(REG_G3, 'utf8'));
  const dir = path.join(ROOT, evidenceDir);
  fs.mkdirSync(dir, { recursive: true });

  const preflight = {
    TT_PRODUCTION_READINESS_G3_GATE: machineKey(yaml, 'TT_PRODUCTION_READINESS_G3_GATE'),
    TT_PRODUCTION_GO: machineKey(yaml, 'TT_PRODUCTION_GO'),
  };
  const preflightPass = preflight.TT_PRODUCTION_READINESS_G3_GATE === 'PASS' && preflight.TT_PRODUCTION_GO === 'GO';

  const keys = {};
  for (const k of PRODUCTION_MACHINE_KEYS) {
    keys[k] = machineKey(yaml, k);
  }
  keys.TT_PRODUCTION_RETROSPECTIVE = preflightPass ? 'COMPLETE' : 'IN_PROGRESS';

  const evidenceIndex = collectEvidenceIndex();
  const launchTimeline = buildLaunchTimeline(yaml, g3Reg);
  const lessons = buildLessonsPlaceholder();

  fs.writeFileSync(path.join(dir, 'production-evidence-index.json'), `${JSON.stringify(evidenceIndex, null, 2)}\n`);
  fs.writeFileSync(
    path.join(dir, 'production-machine-keys-snapshot.yaml'),
    `# Production Retrospective · ${stamp}\n\nmachine_keys:\n${Object.entries(keys)
      .map(([k, v]) => `  ${k}: ${v}`)
      .join('\n')}\n`
  );
  fs.copyFileSync(REG_MATRIX, path.join(dir, 'final-master-matrix-snapshot.yaml'));
  fs.writeFileSync(path.join(dir, 'launch-timeline.json'), `${JSON.stringify(launchTimeline, null, 2)}\n`);
  fs.writeFileSync(path.join(dir, 'lessons-learned.json'), `${JSON.stringify(lessons, null, 2)}\n`);
  fs.writeFileSync(
    path.join(dir, 'production-baseline.json'),
    `${JSON.stringify(
      {
        version: 'V1',
        stamp,
        commit: gitShortSha(),
        reproducible: true,
        g2_retrospective: 'evidence/GO_production_readiness/g2-retrospective/latest',
        decision_package: evidenceIndex.decision_package,
      },
      null,
      2
    )}\n`
  );

  const signoff = {
    schema: 'traveltrust.production_retrospective.v1',
    stamp,
    commit: gitShortSha(),
    purpose: 'Freeze immutable V1 Production launch baseline',
    preflight,
    machine_keys: { TT_PRODUCTION_RETROSPECTIVE: preflightPass ? 'COMPLETE' : 'IN_PROGRESS' },
    verdict: preflightPass ? 'PRODUCTION_RETROSPECTIVE_COMPLETE' : 'PRODUCTION_RETROSPECTIVE_BLOCKED',
    artifacts: {
      production_evidence_index: `${evidenceDir}/production-evidence-index.json`,
      machine_keys_snapshot: `${evidenceDir}/production-machine-keys-snapshot.yaml`,
      final_matrix_snapshot: `${evidenceDir}/final-master-matrix-snapshot.yaml`,
      launch_timeline: `${evidenceDir}/launch-timeline.json`,
      production_baseline: `${evidenceDir}/production-baseline.json`,
    },
  };

  fs.writeFileSync(path.join(dir, 'production-retrospective-signoff.json'), `${JSON.stringify(signoff, null, 2)}\n`);
  return { signoff, pass: preflightPass };
}

module.exports = { generate };
