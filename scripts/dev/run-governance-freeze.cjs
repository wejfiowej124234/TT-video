#!/usr/bin/env node
/**
 * Governance Freeze — lock governance layer structure (status refresh still allowed).
 *
 * Records SHA256 anchors for frozen registries, generators, and evidence layout.
 * Does NOT block Web3 Freeze or Mainnet deploy gates.
 *
 *   node scripts/dev/run-governance-freeze.cjs
 */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { gitHead } = require('./lib/phase3-prerequisite-review-lib.cjs');

const ROOT = path.join(__dirname, '../..');
const STAMP = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const EVID_ROOT = path.join(ROOT, 'evidence/GO_production_readiness/governance-freeze');
const RUN_DIR = path.join(EVID_ROOT, `freeze-${STAMP}`);

const FROZEN_FILES = [
  'registry/governance-freeze.v1.yaml',
  'registry/production-governance-principles.v1.yaml',
  'registry/production-go-four-gate-framework.v1.yaml',
  'registry/phase3-deployment-prerequisite-review.v1.yaml',
  'registry/mainnet-deployment-package.v1.yaml',
  'registry/web3-three-phase-closure-discipline.v1.yaml',
  'registry/phase2-staging-sepolia-production-validation.v1.yaml',
  'scripts/dev/gen-production-readiness-book.cjs',
  'scripts/dev/lib/mainnet-deployment-readiness-rollups.cjs',
  'scripts/dev/prepare-mainnet-deployment-package-prep.cjs',
  'scripts/dev/generate-mainnet-deployment-package.cjs',
  'scripts/dev/refresh-governance-status.cjs',
  'docs/runbook/GOVERNANCE-FREEZE-V1.md',
  'docs/runbook/PRODUCTION-GOVERNANCE-PRINCIPLES-V1.md',
  'docs/runbook/PRODUCTION-GO-FOUR-GATE-FRAMEWORK.md',
  'docs/runbook/MAINNET-DEPLOYMENT-PACKAGE-V1.md',
];

const TEMPLATE_ROOT = 'docs/runbook/templates/mainnet-package';

function sha256File(rel) {
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) return null;
  return crypto.createHash('sha256').update(fs.readFileSync(abs)).digest('hex');
}

function listTemplateFiles() {
  const abs = path.join(ROOT, TEMPLATE_ROOT);
  if (!fs.existsSync(abs)) return [];
  const out = [];
  const walk = (rel) => {
    for (const ent of fs.readdirSync(path.join(abs, rel), { withFileTypes: true })) {
      const sub = rel ? `${rel}/${ent.name}` : ent.name;
      if (ent.isDirectory()) walk(sub);
      else out.push(`${TEMPLATE_ROOT}/${sub}`.replace(/\\/g, '/'));
    }
  };
  walk('');
  return out.sort();
}

function main() {
  fs.mkdirSync(RUN_DIR, { recursive: true });

  const fileAnchors = {};
  for (const rel of FROZEN_FILES) {
    fileAnchors[rel] = { sha256: sha256File(rel), present: fs.existsSync(path.join(ROOT, rel)) };
  }

  const prepTemplates = {};
  for (const rel of listTemplateFiles()) {
    prepTemplates[rel] = sha256File(rel);
  }

  const manifest = {
    schema: 'traveltrust.governance_freeze_manifest.v1',
    recorded_utc: new Date().toISOString(),
    stamp: STAMP,
    run_dir: path.relative(ROOT, RUN_DIR).replace(/\\/g, '/'),
    verdict: 'GOVERNANCE_FREEZE_ACTIVE',
    machine_key: 'TT_GOVERNANCE_FREEZE',
    scope: 'governance_layer_structure_only',
    model: 'structure_frozen_state_continues',
    definition_en:
      'Governance Freeze freezes release governance structure, schemas, templates, and process definitions. '
      + 'It does not freeze runtime state, evidence updates, certification progress, or deployment execution.',
    structure_frozen: [
      'release_runbooks_and_process_definitions',
      'registry_schema_and_machine_key_naming',
      'production_readiness_book_layout',
      'gate_definitions_and_review_categories',
      'evidence_directory_tree',
      'prep_package_template_structure',
    ],
    state_continues: [
      'bug_fixes_during_cert_or_validation',
      'cert_execution_and_results',
      'dashboard_status_values',
      'evidence_content_and_latest_pointers',
      'readiness_book_status_refresh',
      'web3_freeze_and_mainnet_package_generation',
      'owner_signoff_shadow_launch_wave_deployment',
    ],
    update_types: {
      structure_update: { post_governance_freeze: 'FORBIDDEN' },
      state_update: { post_governance_freeze: 'ALLOWED' },
      execution: { post_governance_freeze: 'ALLOWED' },
    },
    principle_1: {
      id: 'PG-P1',
      title: 'Structure Frozen · State Continues',
      ssot: 'registry/production-governance-principles.v1.yaml',
    },
    governance_version: {
      id: 'production_release_governance_v1',
      label: 'Production Release Governance v1',
      status: 'FROZEN',
      lifecycle: 'COMPLETE',
      mode: 'OPERATE',
      compatibility: 'PATCH_ONLY',
      governance_root: 'registry/production-governance-principles.v1.yaml',
    },
    git_head: gitHead(),
    phase_transition: {
      from: 'build_release_governance_system',
      to: 'execute_release_system_per_frozen_process',
      substantive_blocker: 'PHASE2_EXIT_REVIEW_PASS via Cert #8–#12',
    },
    frozen_scope_summary: [
      'Four-Gate Framework',
      'Production Readiness Book structure',
      'Executive Summary',
      'Deployment Readiness Matrix',
      'Owner Checklist',
      'PREP Package structure (8 components)',
      'Registry field naming (listed registries)',
      'Evidence directory structure (GO_production_readiness)',
    ],
    file_anchors: fileAnchors,
    prep_template_anchors: prepTemplates,
    evidence_layout: {
      book: 'evidence/GO_production_readiness/production-readiness-book/',
      prerequisite: 'evidence/GO_production_readiness/phase3-deployment-prerequisite-review/',
      mainnet_prep: 'evidence/GO_production_readiness/mainnet-deployment-package/',
      governance_freeze: 'evidence/GO_production_readiness/governance-freeze/',
    },
    timelock_period_allowed: [
      'Wait for Timelock expiry',
      'node scripts/dev/refresh-governance-status.cjs',
      'Cert #8–#12 execution',
      'Evidence LATEST updates from cert / validation',
    ],
    timelock_period_forbidden: [
      'New governance docs or PREP templates',
      'Book / Matrix / Checklist structural changes',
      'New Review categories or Gate frameworks',
      'Registry machine_key renames',
    ],
    unfreeze_exceptions: ['CERT_STATE_REFRESH', 'MAINNET_DRILL_DEFECT', 'AUDIT_MANDATORY', 'INCIDENT_RETROSPECTIVE'],
    status_refresh_only: 'scripts/dev/refresh-governance-status.cjs',
    registry_ssot: 'registry/governance-freeze.v1.yaml',
    runbook: 'docs/runbook/GOVERNANCE-FREEZE-V1.md',
  };

  const json = `${JSON.stringify(manifest, null, 2)}\n`;
  fs.writeFileSync(path.join(RUN_DIR, 'GOVERNANCE-FREEZE-MANIFEST.json'), json);
  fs.writeFileSync(path.join(EVID_ROOT, 'GOVERNANCE-FREEZE-MANIFEST-LATEST.json'), json);

  const md = `# Governance Freeze Manifest

**Verdict:** \`GOVERNANCE_FREEZE_ACTIVE\` · **Structure Frozen · State Continues**  
**Scope:** governance-layer structure only — NOT project-wide freeze  
**Stamp:** ${STAMP}  
**Phase:** build release system → **execute per frozen process**

> Governance Freeze freezes release governance structure, schemas, templates, and process definitions. It does not freeze runtime state, evidence updates, certification progress, or deployment execution.

## Structure frozen

${manifest.frozen_scope_summary.map((s) => `- ${s}`).join('\n')}

## Timelock period

**Allowed:** status refresh · Cert execution · evidence LATEST updates  
**Forbidden:** new governance structure · PREP templates · Book/Matrix restructure

## Status sync (no structural changes)

\`\`\`bash
node scripts/dev/refresh-governance-status.cjs
\`\`\`

## Post-Timelock execution chain

Cert #8–#12 → ②-F PASS → Web3 Freeze → Generate Package → Owner Sign-off → Shadow Launch → Wave 1
`;
  fs.writeFileSync(path.join(RUN_DIR, 'GOVERNANCE-FREEZE-MANIFEST.md'), md);
  fs.writeFileSync(path.join(EVID_ROOT, 'GOVERNANCE-FREEZE-MANIFEST-LATEST.md'), md);

  console.log(JSON.stringify({
    verdict: manifest.verdict,
    stamp: STAMP,
    frozen_files: Object.keys(fileAnchors).filter((k) => fileAnchors[k].present).length,
    prep_templates: Object.keys(prepTemplates).length,
    status_refresh: manifest.status_refresh_only,
  }, null, 2));
}

main();
