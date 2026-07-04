/**
 * Production Runtime Identity Guard — thin wrapper over RuntimeIdentity + Configuration Truth.
 * @deprecated Import RuntimeIdentity directly for new code.
 */
const path = require('path');
const { RuntimeIdentity, loadSsot } = require('./runtime-identity.cjs');
const { evaluateConfigurationTruth, writeConfigurationTruthEvidence } = require('./configuration-truth.cjs');

const ROOT = path.join(__dirname, '../../..');
const SSOT_PATH = path.join(ROOT, 'registry/runtime-identity-ssot.v1.json');

function loadIdentitySsot() {
  return loadSsot();
}

/** @deprecated use loadIdentitySsot */
function loadSsotLegacy() {
  return loadIdentitySsot();
}

function writeIdentityEvidence(outDir, evaluation, meta = {}) {
  const fs = require('fs');
  const base = path.isAbsolute(outDir) ? outDir : path.join(ROOT, outDir);
  fs.mkdirSync(base, { recursive: true });
  const payload = {
    review_id: 'PRODUCTION-RUNTIME-IDENTITY-GUARD',
    ssot: 'registry/runtime-identity-ssot.v1.json',
    configuration_truth_ssot: 'registry/configuration-truth-ssot.v1.json',
    ...meta,
    ...evaluation,
  };
  fs.writeFileSync(path.join(base, 'production-runtime-identity.json'), `${JSON.stringify(payload, null, 2)}\n`);
  return payload;
}

/**
 * Evaluate production runtime identity from probe evidence directory.
 */
function evaluateProductionRuntimeIdentity(evidenceDir, opts = {}) {
  const profileName = opts.profile || 'production';
  const base = path.isAbsolute(evidenceDir) ? evidenceDir : path.join(ROOT, evidenceDir);
  const identity = RuntimeIdentity.fromProbeEvidence(base);
  const guard =
    profileName === 'production'
      ? identity.evaluateProductionGuard()
      : {
          pass: identity.profile === profileName || (profileName === 'staging' && identity.isStaging()),
          profile: identity.profile,
          deployment_profile_meta: identity.deployment_profile_meta,
          checks: { deployment_profile_meta: identity.deployment_profile_meta === profileName },
          verdict: identity.deployment_profile_meta === profileName ? 'PASS' : 'FAIL',
          machine_key: 'TT_PRODUCTION_RUNTIME_IDENTITY',
        };

  let configurationTruth = null;
  if (profileName === 'production') {
    configurationTruth = evaluateConfigurationTruth(base, { targetProfile: 'production' });
    writeConfigurationTruthEvidence(base, configurationTruth, { stamp: path.basename(base) });
    guard.configuration_truth = configurationTruth;
    guard.pass = guard.pass && configurationTruth.pass;
    guard.verdict = guard.pass ? 'PASS' : 'FAIL';
  }

  const ssot = loadIdentitySsot();
  return {
    ...guard,
    matrix_gap_id: ssot.matrix_gap_id,
    meta_deployment_profile: identity.deployment_profile_meta,
    deployment_profile_raw: identity.deployment_profile_raw,
    public_content_profile: identity.public_content_profile,
    reason: guard.pass
      ? `Production Runtime Identity + Configuration Truth verified — deployment_profile=${identity.deployment_profile_meta}`
      : configurationTruth?.drifts?.length
        ? `Configuration Drift — ${configurationTruth.drifts[0].detail || configurationTruth.drifts[0].kind}`
        : `Production Runtime Identity FAIL — deployment_profile=${identity.deployment_profile_meta ?? 'null'}`,
  };
}

module.exports = {
  ROOT,
  SSOT_PATH,
  loadSsot: loadIdentitySsot,
  evaluateProductionRuntimeIdentity,
  writeIdentityEvidence,
};
