/**
 * Release Train · Reality Verification — six truth sources helper.
 *
 * Evidence · Matrix · Registry · Configuration · Runtime · Call Graph
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../../..');
const REG_MATRIX = path.join(ROOT, 'registry/production-readiness-master-matrix.v1.yaml');
const REG_RELEASE_TRAIN = path.join(ROOT, 'registry/release-train-reality-verification.v1.json');

const TRUTH_SOURCES = [
  'evidence',
  'matrix',
  'registry',
  'configuration',
  'runtime',
  'call_graph',
];

function loadReleaseTrainConfig() {
  return JSON.parse(fs.readFileSync(REG_RELEASE_TRAIN, 'utf8'));
}

function buildSixWayTruth(opts) {
  const {
    evidenceDir,
    registryPaths = [],
    configurationPass = null,
    runtimeChecksPass = false,
    callGraphPass = false,
    identityPass = null,
    findingsVerified = false,
  } = opts;

  const base = path.isAbsolute(evidenceDir) ? evidenceDir : path.join(ROOT, evidenceDir);
  const regYaml = fs.existsSync(REG_MATRIX) ? fs.readFileSync(REG_MATRIX, 'utf8') : '';

  const registryOk =
    registryPaths.length > 0 && registryPaths.every((p) => fs.existsSync(path.join(ROOT, p)));

  const configEvidence =
    fs.existsSync(path.join(base, 'configuration-truth.json')) ||
    fs.existsSync(path.join(base, 'production-runtime-identity/configuration-truth.json'));

  const sixWay = {
    evidence: fs.existsSync(base),
    matrix: regYaml.includes('TT_PRODUCTION_READINESS_MASTER_MATRIX: ACTIVE'),
    registry: registryOk,
    configuration:
      configurationPass === null ? (configEvidence ? null : false) : configurationPass === true,
    runtime: runtimeChecksPass,
    call_graph: callGraphPass,
    production_runtime_identity:
      identityPass === null ? null : identityPass === true ? 'PASS' : 'FAIL',
    consistent:
      findingsVerified &&
      registryOk &&
      runtimeChecksPass &&
      callGraphPass &&
      (configurationPass === null || configurationPass === true) &&
      (identityPass === null || identityPass === true),
  };

  return sixWay;
}

/** @deprecated use buildSixWayTruth */
function buildFiveWayTruth(opts) {
  return buildSixWayTruth(opts);
}

function releaseTrainStep(gate, allVerified, identityRequired, identityPass, configurationPass = null) {
  const blocked =
    !allVerified ||
    (identityRequired && identityPass !== true) ||
    (configurationPass !== null && configurationPass !== true);
  return {
    gate,
    step: 'Reality Verification',
    truth_sources: TRUTH_SOURCES,
    production_runtime_identity_guard: identityRequired ? 'required' : 'optional',
    configuration_truth: configurationPass === null ? 'optional' : 'required',
    next: blocked
      ? 'Reality Fix gaps + RuntimeIdentity/Configuration Truth then re-verify'
      : `${gate} Formal Acceptance`,
    formal_blocked: blocked,
  };
}

module.exports = {
  ROOT,
  REG_MATRIX,
  REG_RELEASE_TRAIN,
  TRUTH_SOURCES,
  loadReleaseTrainConfig,
  buildSixWayTruth,
  buildFiveWayTruth,
  releaseTrainStep,
};
