#!/usr/bin/env node
/**
 * G1 Reality Verification — five truth sources (staging identity · call graph · G1 gate state).
 * G1 Formal already PASS — this layer prevents drift before G2/G3.
 */
const fs = require('fs');
const path = require('path');
const { evaluateProductionRuntimeIdentity, writeIdentityEvidence } = require('./lib/production-runtime-identity-guard.cjs');
const { runCallGraphAudit, writeCallGraphEvidence } = require('./lib/runtime-truth-call-graph.cjs');
const { buildSixWayTruth, releaseTrainStep, loadReleaseTrainConfig, TRUTH_SOURCES } = require('./lib/reality-verification-truths.cjs');

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
    console.error('Usage: --evidence-dir evidence/GO_production_readiness/g1-reality-verification/<stamp>');
    process.exit(1);
  }

  const base = path.isAbsolute(evidenceDir) ? evidenceDir : path.join(ROOT, evidenceDir);
  const evidRel = path.relative(ROOT, base).replace(/\\/g, '/');
  const regYaml = fs.readFileSync(REG_MATRIX, 'utf8');
  const rtConfig = loadReleaseTrainConfig();
  const g1Config = rtConfig.gates.G1;

  const g1GatePass = /TT_PRODUCTION_READINESS_G1_GATE: PASS/.test(regYaml);
  const callGraph = runCallGraphAudit({ anchorFilter: g1Config.call_graph_anchors });
  writeCallGraphEvidence(path.join(base, 'call-graph-truth.json'), callGraph, { stamp: path.basename(base), gate: 'G1' });

  const stagingIdentity = evaluateProductionRuntimeIdentity(
    path.join(base, 'production-runtime-identity'),
    { profile: 'staging' }
  );
  writeIdentityEvidence(path.join(base, 'production-runtime-identity'), stagingIdentity, {
    stamp: path.basename(base),
    gate: 'G1',
    profile: 'staging',
  });

  const allVerified = g1GatePass && callGraph.pass && stagingIdentity.pass;

  const sixWay = buildSixWayTruth({
    evidenceDir: base,
    registryPaths: [
      'registry/release-train-reality-verification.v1.json',
      'registry/runtime-identity-ssot.v1.json',
      'registry/configuration-truth-ssot.v1.json',
    ],
    configurationPass: null,
    runtimeChecksPass: g1GatePass && stagingIdentity.pass,
    callGraphPass: callGraph.pass,
    identityPass: null,
    findingsVerified: allVerified,
  });

  const signoff = {
    review_id: 'G1-REALITY-VERIFICATION',
    stamp: path.basename(base),
    release_train: releaseTrainStep('G1', allVerified, false, null, null),
    machine_keys: {
      TT_G1_REALITY_VERIFICATION: allVerified ? 'COMPLETE' : 'IN_PROGRESS',
      TT_PRODUCTION_READINESS_G1_GATE: g1GatePass ? 'PASS' : 'IN_PROGRESS',
    },
    truth_sources: TRUTH_SOURCES,
    six_way: sixWay,
    call_graph: { pass: callGraph.pass, evidence: `${evidRel}/call-graph-truth.json` },
    staging_runtime_identity: stagingIdentity,
    honest_boundary:
      'G1 Verification uses staging/local identity · TT_PRODUCTION_RUNTIME_IDENTITY (production) enforced at G2/G3',
  };

  fs.writeFileSync(path.join(base, 'g1-reality-verification-signoff.json'), `${JSON.stringify(signoff, null, 2)}\n`);

  console.log('G1 Reality Verification');
  console.log(`G1 Gate (matrix): ${g1GatePass ? 'PASS' : 'NOT PASS'}`);
  console.log(`Call Graph: ${callGraph.pass ? 'PASS' : 'FAIL'}`);
  console.log(`Staging Identity: ${stagingIdentity.pass ? 'PASS' : 'FAIL'}`);
  console.log(`Six-way consistent: ${sixWay.consistent}`);

  process.exit(allVerified ? 0 : 1);
}

main();
