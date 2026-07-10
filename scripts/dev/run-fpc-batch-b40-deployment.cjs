#!/usr/bin/env node
/**
 * FPC-100 Batch B40 · Deployment Certification @ ② staging one-shot
 *
 *   TRAVELTRUST_FPC_B40_STAGING_OK=1 node scripts/dev/run-fpc-batch-b40-deployment.cjs
 *   TRAVELTRUST_FPC_B40_STAGING_OK=1 node scripts/dev/run-fpc-batch-b40-deployment.cjs --skip-deploy
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '../..');
const EVID = path.join(
  ROOT,
  'docs/spec/governance-token/evidence/phase3-production-entry-baseline/FPC-100'
);
const OUT = path.join(EVID, 'FPC-100-BATCH-B40-LATEST.json');
const EVID_DIR = path.join(EVID, 'B40-deployment');
const CHECKLIST_PATH = path.join(EVID_DIR, 'FPC-100-DEPLOYMENT-CHECKLIST-BASELINE.v1.json');

const checklist = JSON.parse(fs.readFileSync(CHECKLIST_PATH, 'utf8'));
const STAGING_API = process.env.STAGING_API || checklist.staging_endpoints?.api || 'https://tt-api-staging.fly.dev';
const STAGING_WEB = process.env.STAGING_WEB || checklist.staging_endpoints?.web || 'https://tt-web-staging.fly.dev';

const {
  loadAuthoritativeSha,
  verifyFrozenChainReadonly,
  probeRuntimeHealth,
  probeMetaSha,
  probeEnvironmentDiff,
  probeRegistryParity,
  probeRollbackDocumentation,
  runStagingInfraRecheck,
  classifyFindings,
} = require('./lib/fpc-deployment-probes.cjs');
const { assertCanRun, computeBurnDown, parseExecutionSequence } = require('./lib/fpc-batch-sequence.cjs');

function sh(cmd, cwd = ROOT, env = {}) {
  return execSync(cmd, {
    cwd,
    encoding: 'utf8',
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, ...env },
    timeout: 1_800_000,
  });
}

function verifyOwnerAuth(findings) {
  const ok = process.env.TRAVELTRUST_FPC_B40_STAGING_OK === '1';
  if (!ok) {
    findings.push({
      id: 'owner_auth_missing',
      severity: 'P0',
      classification: 'CONFIG_ISSUE',
      detail: 'Set TRAVELTRUST_FPC_B40_STAGING_OK=1',
    });
  }
  return { pass: ok, env: checklist.owner_auth_env };
}

function verifyLocalFinalFreeze(findings) {
  const p = path.join(EVID, 'FPC-100-LOCAL-FINAL-FREEZE-LATEST.json');
  if (!fs.existsSync(p)) {
    findings.push({
      id: 'local_final_freeze_missing',
      severity: 'P0',
      classification: 'REAL_DEFECT',
      detail: p,
    });
    return { pass: false };
  }
  const j = JSON.parse(fs.readFileSync(p, 'utf8'));
  let pass = j.pass === true && j.verdict === 'PASS';
  if (!pass) {
    try {
      sh('node scripts/dev/run-fpc-local-final-freeze-check.cjs', ROOT);
      const j2 = JSON.parse(fs.readFileSync(p, 'utf8'));
      pass = j2.pass === true && j2.verdict === 'PASS';
      if (pass) return { pass: true, evidence: j2, refreshed: true };
    } catch {
      /* fall through */
    }
    findings.push({
      id: 'local_final_freeze_not_pass',
      severity: 'P0',
      classification: 'REAL_DEFECT',
      detail: j.verdict,
    });
  }
  return { pass, evidence: j };
}

function runDeployFromAnchor(authoritativeSha, findings, skipDeploy) {
  if (skipDeploy) {
    const manifestPath = path.join(EVID_DIR, 'FPC-100-B40-DEPLOY-MANIFEST-LATEST.json');
    const manifest = fs.existsSync(manifestPath)
      ? JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
      : null;
    return {
      pass: manifest?.sha_match === true,
      skipped: true,
      reason: '--skip-deploy',
      manifest,
    };
  }
  try {
    sh('bash scripts/dev/run-fpc-b40-staging-deploy-from-anchor.sh', ROOT, {
      TRAVELTRUST_FPC_B40_STAGING_OK: '1',
      DEPLOY_GOVERNANCE_FORCE_RUNTIME: '1',
      DEPLOYMENT_STATE: 'sync',
      FPC_AUTHORITATIVE_GIT_SHA: authoritativeSha,
      TESTNET_FREEZE_OVERRIDE: process.env.TESTNET_FREEZE_OVERRIDE || '1',
    });
    const manifestPath = path.join(EVID_DIR, 'FPC-100-B40-DEPLOY-MANIFEST-LATEST.json');
    const manifest = fs.existsSync(manifestPath)
      ? JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
      : null;
    return { pass: true, skipped: false, manifest };
  } catch (e) {
    findings.push({
      id: 'staging_deploy_fail',
      severity: 'P0',
      classification: 'CONFIG_ISSUE',
      detail: `${e.stdout || ''}${e.stderr || ''}`.slice(0, 3000),
    });
    return { pass: false, skipped: false, detail: `${e.stdout || ''}${e.stderr || ''}`.slice(0, 1500) };
  }
}

(async () => {
  const stamp = new Date().toISOString();
  const skipDeploy = process.argv.includes('--skip-deploy');
  const governanceHead = sh('git rev-parse HEAD').trim();
  const findings = [];

  const gate = assertCanRun('B40');
  if (!gate.ok) {
    findings.push({
      id: 'batch_sequence_blocked',
      severity: 'P0',
      classification: 'REAL_DEFECT',
      detail: gate.reason || gate.missing_prerequisites?.join(','),
    });
  }

  const ownerAuth = verifyOwnerAuth(findings);
  const localFreeze = verifyLocalFinalFreeze(findings);
  const anchor = loadAuthoritativeSha();
  if (!anchor.sha || !/^[0-9a-f]{40}$/.test(anchor.sha)) {
    findings.push({
      id: 'authoritative_sha_missing',
      severity: 'P0',
      classification: 'REAL_DEFECT',
      detail: 'Could not load authoritative_immutable_head',
    });
  }

  const frozenChain = verifyFrozenChainReadonly(findings);

  const deployManifestPath = path.join(EVID_DIR, 'FPC-100-B40-DEPLOY-MANIFEST-LATEST.json');
  const rollbackPath = path.join(EVID_DIR, 'FPC-100-B40-ROLLBACK-LATEST.json');
  let deploy = { pass: false, skipped: skipDeploy };
  if (ownerAuth.pass && anchor.sha && !skipDeploy) {
    deploy = runDeployFromAnchor(anchor.sha, findings, false);
  } else if (skipDeploy) {
    deploy = runDeployFromAnchor(anchor.sha, findings, true);
    if (fs.existsSync(deployManifestPath)) {
      deploy.manifest = JSON.parse(fs.readFileSync(deployManifestPath, 'utf8'));
      deploy.pass = deploy.manifest?.sha_match === true;
    }
  }
  const rollbackEvidence = fs.existsSync(rollbackPath)
    ? JSON.parse(fs.readFileSync(rollbackPath, 'utf8'))
    : null;
  if (rollbackEvidence && !deploy.pass) {
    deploy.rollback = rollbackEvidence;
    findings.push({
      id: 'anchor_deploy_blocked_migration_drift',
      severity: 'P0',
      classification: rollbackEvidence.root_cause_classification || 'CONFIG_ISSUE',
      detail: rollbackEvidence.root_cause_detail,
      remediation: rollbackEvidence.remediation_owner,
    });
  }

  const health = await probeRuntimeHealth(STAGING_API, STAGING_WEB, findings);
  const meta = await probeMetaSha(STAGING_API, anchor.sha, findings);
  const envDiff = await probeEnvironmentDiff(STAGING_API, STAGING_WEB, anchor.sha, checklist, findings);
  const registryParity = probeRegistryParity(anchor.sha, meta, findings);
  const rollbackDoc = probeRollbackDocumentation(checklist, findings);
  const stagingRecheck = runStagingInfraRecheck(STAGING_API, findings);

  const classification = classifyFindings(findings);
  const p0 = findings.filter((f) => f.severity === 'P0');
  const p1 = findings.filter((f) => f.severity === 'P1');

  const deployPass = deploy.pass && (deploy.skipped ? meta.sha_match : true);
  const businessGatePass =
    gate.ok &&
    ownerAuth.pass &&
    localFreeze.pass &&
    frozenChain.pass &&
    deployPass &&
    health.pass &&
    meta.pass &&
    registryParity.pass &&
    stagingRecheck.pass;
  const qualityPass = rollbackDoc.pass && envDiff.pass && p0.length === 0 && p1.length === 0;
  const businessVerdict = businessGatePass ? 'PASS' : 'FAIL';
  const qualityVerdict = qualityPass ? 'PASS' : businessGatePass ? 'IN_PROGRESS' : 'FAIL';
  const overallVerdict =
    businessVerdict === 'PASS' && qualityVerdict === 'PASS'
      ? 'PASS'
      : businessVerdict === 'FAIL' || qualityVerdict === 'FAIL'
        ? 'FAIL'
        : 'IN_PROGRESS';
  const pass = overallVerdict === 'PASS';

  fs.mkdirSync(EVID_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(EVID_DIR, `gate-run-${stamp.replace(/[:.]/g, '-')}.json`),
    JSON.stringify(
      {
        timestamp_utc: stamp,
        phase: '② staging',
        authoritative_sha: anchor.sha,
        governance_head: governanceHead,
        owner_auth: ownerAuth,
        local_final_freeze: localFreeze,
        frozen_chain: frozenChain,
        deploy,
        health,
        meta,
        env_diff: envDiff,
        registry_parity: registryParity,
        rollback_doc: rollbackDoc,
        rollback_evidence: rollbackEvidence,
        staging_recheck: stagingRecheck,
        finding_classification: classification,
        findings,
      },
      null,
      2
    ) + '\n'
  );

  const burn = computeBurnDown(parseExecutionSequence());
  const report = {
    schema: 'traveltrust.fpc_100_batch_certification.v1',
    batch_id: 'B40',
    title: 'Deployment Certification (② staging · one-shot)',
    layer: 'deployment',
    phase: '② staging',
    timestamp_utc: stamp,
    verifier: 'run-fpc-batch-b40-deployment.cjs',
    product_version: 'v1.0',
    code_anchor_commit: anchor.sha,
    authoritative_immutable_head: anchor.sha,
    git: { head: governanceHead, branch: sh('git branch --show-current').trim() },
    depends_on: ['B00', 'B01'],
    owner_authorization: {
      env: 'TRAVELTRUST_FPC_B40_STAGING_OK=1',
      authorized: ownerAuth.pass,
    },
    local_final_freeze_ref: 'FPC-100-LOCAL-FINAL-FREEZE-LATEST.json',
    frozen_chain_readonly: frozenChain,
    staging_endpoints: { api: STAGING_API, web: STAGING_WEB },
    deploy_pipeline: deploy,
    runtime_health: health,
    meta_sha: meta,
    environment_diff: envDiff,
    registry_parity: registryParity,
    rollback_documentation: rollbackDoc,
    rollback_evidence: rollbackEvidence,
    fpc_staging_recheck: stagingRecheck,
    finding_classification: classification,
    gate_pass: businessGatePass,
    business_certification: { verdict: businessVerdict, gate_pass: businessGatePass },
    quality_supplement: {
      verdict: qualityVerdict,
      domains: ['Q10', 'Q14'],
    },
    overall_verdict: overallVerdict,
    findings,
    verdict: overallVerdict,
    pass,
    release_blocker: pass ? 'NO' : 'YES',
    next_batch: pass ? 'B41' : 'B40-remediation',
    phase_honesty: '② staging one-shot PASS ≠ ③ Production GO',
    ai_review: {
      verdict: pass ? 'PASS' : 'FAIL',
      ai_reviewer: 'Internal AI Review',
      review_type: 'Internal AI Review',
      review_date: stamp.slice(0, 10),
      review_version: 'v1',
    },
    human_verified: false,
    human_verifier: null,
    human_note: 'B40 ② — deploy from authoritative SHA · env diff · staging recheck; B21–B36 frozen unchanged',
    traceability: {
      requirements: [
        'Deploy → Health 200 → Meta SHA = authoritative anchor',
        'Environment diff + registry parity',
        'Rollback documentation probe',
        'staging_required_after_deploy recheck (B00/B01/B04/B21/B22 subset)',
        'B21–B36 certification_frozen read-only unchanged',
      ],
      spec_refs: [
        'FPC-100/B40-deployment/FPC-100-DEPLOYMENT-CHECKLIST-BASELINE.v1.json',
        'registry/full-production-certification-checklist.v1.yaml',
        'docs/runbook/FPC-100-PRE-RELEASE-EXECUTION-PLAN-v1.md',
      ],
      evidence_path: 'FPC-100/FPC-100-BATCH-B40-LATEST.json',
      certification_batch: 'B40',
      product_version: 'v1.0',
    },
    burn_down: burn,
  };

  if (pass) {
    const expiryDays = 30;
    report.certified_at_utc = stamp;
    report.expires_at_utc = new Date(Date.parse(stamp) + expiryDays * 86400000).toISOString();
    report.expiry_policy_days = expiryDays;
    report.certification_frozen = true;
    report.frozen_at_utc = stamp;
    report.frozen_git_sha = anchor.sha;
  }

  fs.writeFileSync(OUT, JSON.stringify(report, null, 2) + '\n');
  console.log(`TT_FPC_100_BATCH_B40: ${report.verdict}`);
  console.log(`anchor: ${anchor.sha}`);
  console.log(`staging_meta_sha: ${meta.staging_git_sha} match=${meta.sha_match}`);
  console.log(`classifications: ${JSON.stringify(classification)}`);
  console.log(`pass: ${pass} p0: ${p0.length} p1: ${p1.length}`);
  console.log(`BUSINESS: ${businessVerdict} QUALITY: ${qualityVerdict}`);
  console.log(`EVIDENCE: ${OUT}`);

  if (pass) {
    try {
      sh('node scripts/dev/refresh-fpc-100-release-dashboard.cjs', ROOT);
    } catch {
      /* best-effort */
    }
  }

  process.exit(pass ? 0 : 1);
})();
