#!/usr/bin/env node
/**
 * G3 Reality Verification — mandatory Production Runtime Identity + call graph (G3 blockers TBD at cutover).
 */
const fs = require('fs');
const path = require('path');
const { evaluateProductionRuntimeIdentity } = require('./lib/production-runtime-identity-guard.cjs');
const { runCallGraphAudit, writeCallGraphEvidence } = require('./lib/runtime-truth-call-graph.cjs');
const {
  buildSixWayTruth,
  releaseTrainStep,
  loadReleaseTrainConfig,
  TRUTH_SOURCES,
} = require('./lib/reality-verification-truths.cjs');

const ROOT = path.join(__dirname, '../..');
const REG_MATRIX = path.join(ROOT, 'registry/production-readiness-master-matrix.v1.yaml');

function parseArgs() {
  const args = { evidenceDir: '' };
  for (let i = 2; i < process.argv.length; i++) {
    if (process.argv[i] === '--evidence-dir') args.evidenceDir = process.argv[++i];
  }
  return args;
}

function main() {
  const { evidenceDir } = parseArgs();
  if (!evidenceDir) {
    console.error('Usage: --evidence-dir evidence/GO_production_readiness/g3-reality-verification/<stamp>');
    process.exit(1);
  }

  const base = path.isAbsolute(evidenceDir) ? evidenceDir : path.join(ROOT, evidenceDir);
  const evidRel = path.relative(ROOT, base).replace(/\\/g, '/');
  const regYaml = fs.readFileSync(REG_MATRIX, 'utf8');
  const rtConfig = loadReleaseTrainConfig();

  const identityDir = path.join(base, 'production-runtime-identity');
  const identityEval = evaluateProductionRuntimeIdentity(identityDir, { profile: 'production' });
  const configPass = identityEval.configuration_truth?.pass === true;

  const callGraph = runCallGraphAudit({ anchorFilter: 'all' });
  writeCallGraphEvidence(path.join(base, 'call-graph-truth.json'), callGraph, {
    stamp: path.basename(base),
    gate: 'G3',
  });

  const g2Pass = /TT_PRODUCTION_READINESS_G2_GATE: PASS/.test(regYaml);
  const identityPass = identityEval.pass === true;
  const allVerified = identityPass && callGraph.pass && g2Pass && configPass;

  const sixWay = buildSixWayTruth({
    evidenceDir: base,
    registryPaths: [
      'registry/runtime-identity-ssot.v1.json',
      'registry/configuration-truth-ssot.v1.json',
      'registry/release-train-reality-verification.v1.json',
    ],
    configurationPass: configPass,
    runtimeChecksPass: identityPass && g2Pass,
    callGraphPass: callGraph.pass,
    identityPass,
    findingsVerified: allVerified,
  });

  const signoff = {
    review_id: 'G3-REALITY-VERIFICATION',
    stamp: path.basename(base),
    release_train: releaseTrainStep('G3', allVerified, true, identityPass, configPass),
    machine_keys: {
      TT_G3_REALITY_VERIFICATION: allVerified ? 'COMPLETE' : 'IN_PROGRESS',
      TT_WAVE3_FORMAL_ACCEPTANCE: allVerified ? 'READY' : 'BLOCKED',
      TT_PRODUCTION_READINESS_G3_GATE: allVerified ? 'PASS' : 'NOT_STARTED',
      TT_PRODUCTION_RUNTIME_IDENTITY: identityPass ? 'PASS' : 'FAIL',
      TT_CONFIGURATION_TRUTH: configPass ? 'PASS' : 'FAIL',
    },
    truth_sources: TRUTH_SOURCES,
    six_way: sixWay,
    production_runtime_identity: identityEval,
    prerequisite: { g2_gate_pass: g2Pass },
    honest_boundary: 'G3 Verification requires G2 PASS + TT_PRODUCTION_RUNTIME_IDENTITY PASS + full call graph',
  };

  fs.writeFileSync(path.join(base, 'g3-reality-verification-signoff.json'), `${JSON.stringify(signoff, null, 2)}\n`);

  console.log('G3 Reality Verification');
  console.log(`G2 prerequisite: ${g2Pass ? 'PASS' : 'NOT PASS'}`);
  console.log(`TT_PRODUCTION_RUNTIME_IDENTITY: ${identityPass ? 'PASS' : 'FAIL'}`);
  console.log(`Call Graph: ${callGraph.pass ? 'PASS' : 'FAIL'}`);
  console.log(`TT_CONFIGURATION_TRUTH: ${configPass ? 'PASS' : 'FAIL'}`);
  console.log(`Six-way consistent: ${sixWay.consistent}`);

  process.exit(allVerified ? 0 : 1);
}

main();
