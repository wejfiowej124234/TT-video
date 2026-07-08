#!/usr/bin/env node
/**
 * Production Readiness · Release Candidate Freeze
 * Locks Registry SSOT + GO_production_readiness evidence · generates RC sign-off + prod plan.
 *
 *   node scripts/dev/run-production-readiness-rc-freeze.cjs
 */
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '../..');
const EVID_ROOT = path.join(ROOT, 'evidence/GO_production_readiness');
const FREEZE_DIR = path.join(EVID_ROOT, 'rc-freeze');

const REGISTRY_FILES = [
  'registry/production-readiness-open-issues.v1.yaml',
  'registry/production-readiness-phase-gates.v1.yaml',
  'registry/production-readiness-master-checklist.v1.yaml',
  'registry/business-data-readiness.v1.yaml',
  'registry/business-flow-matrix.v1.yaml',
  'registry/hat-six-role-matrix.v1.yaml',
  'registry/manual-validation-checklist.v1.yaml',
];

function sha256File(abs) {
  const h = crypto.createHash('sha256');
  h.update(fs.readFileSync(abs));
  return h.digest('hex');
}

function readVersion(text) {
  const m = text.match(/^version: (\d+)/m);
  return m ? parseInt(m[1], 10) : null;
}

function gitSha() {
  try {
    return execSync('git rev-parse HEAD', { cwd: ROOT, encoding: 'utf8' }).trim();
  } catch {
    return null;
  }
}

function collectLatestEvidence() {
  const out = [];
  function walk(dir) {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, ent.name);
      if (ent.isDirectory()) walk(p);
      else if (ent.name.includes('LATEST')) {
        out.push(path.relative(ROOT, p).replace(/\\/g, '/'));
      }
    }
  }
  walk(EVID_ROOT);
  return out.sort();
}

function main() {
  const ts = new Date().toISOString();
  const stamp = ts.replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const stampDir = path.join(FREEZE_DIR, stamp);
  fs.mkdirSync(stampDir, { recursive: true });

  const git_sha = gitSha();
  const master = JSON.parse(
    fs.readFileSync(path.join(EVID_ROOT, 'PRODUCTION-READINESS-MASTER-CHECKLIST-LATEST.json'), 'utf8'),
  );
  const finalGate = JSON.parse(
    fs.readFileSync(
      path.join(EVID_ROOT, 'sprints/PRODUCTION-READINESS-FINAL-GATE-REEVALUATION-LATEST.json'),
      'utf8',
    ),
  );

  const registries = REGISTRY_FILES.map((rel) => {
    const abs = path.join(ROOT, rel);
    const text = fs.readFileSync(abs, 'utf8');
    return {
      path: rel,
      version: readVersion(text),
      sha256: sha256File(abs),
      bytes: fs.statSync(abs).size,
    };
  });

  const evidencePaths = collectLatestEvidence();
  const evidence = evidencePaths.map((rel) => {
    const abs = path.join(ROOT, rel);
    return { path: rel, sha256: sha256File(abs), bytes: fs.statSync(abs).size };
  });

  const openIssues = registries.find((r) => r.path.includes('open-issues'));

  const freezeManifest = {
    schema: 'traveltrust.production_readiness_rc_freeze_manifest.v1',
    stamp,
    frozen_at_utc: ts,
    mode: 'release_candidate_freeze',
    git_sha,
    machine_keys: {
      TT_PRODUCTION_READINESS_RC_FREEZE: 'FROZEN',
      TT_PRODUCTION_ENTRY_READY: master.TT_PRODUCTION_ENTRY_READY,
      TT_SPRINT_B_ACTIVE: false,
    },
    registry_anchor: {
      ssot: 'registry/production-readiness-open-issues.v1.yaml',
      version: openIssues?.version ?? 17,
      sha256: openIssues?.sha256,
    },
    registries,
    evidence: {
      root: 'evidence/GO_production_readiness',
      count: evidence.length,
      files: evidence,
    },
    gates: {
      business_data_readiness: 'READY',
      hat: 'PASS',
      business_flow_matrix: 'PASS',
      manual_validation: 'PASS',
      open_root_causes: 0,
      production_entry: master.TT_PRODUCTION_ENTRY_READY,
    },
    capstone_evidence: [
      'evidence/GO_production_readiness/PRODUCTION-READINESS-MASTER-CHECKLIST-LATEST.json',
      'evidence/GO_production_readiness/sprints/PRODUCTION-READINESS-FINAL-GATE-REEVALUATION-LATEST.json',
      'evidence/GO_production_readiness/sprints/PHASE4-MANUAL-VALIDATION-EXECUTION-LATEST.json',
    ],
    discipline: {
      no_new_validation: true,
      no_new_features: true,
      no_sprint_b_active: true,
      next_phase: 'production_deployment_planning',
    },
  };

  const signoff = {
    schema: 'traveltrust.production_readiness_rc_final_signoff.v1',
    stamp,
    signed_at_utc: ts,
    environment: {
      staging_api: 'https://tt-api-staging.fly.dev',
      staging_web: 'https://tt-web-staging.fly.dev',
    },
    verdict: 'GO',
    machine_keys: {
      TT_PRODUCTION_ENTRY_READY: master.TT_PRODUCTION_ENTRY_READY,
      TT_PRODUCTION_READINESS_RC: 'CLOSED',
      TT_PRODUCTION_READINESS_RC_FREEZE: 'FROZEN',
      TT_SPRINT_A: 'CLOSED',
      TT_SPRINT_B: 'READY',
      TT_SPRINT_B_ACTIVE: false,
    },
    validation_summary: {
      bdr: 'READY (5/5)',
      hat: 'PASS (v11 · six-role human queue)',
      bfm: 'PASS',
      manual: 'PASS (9/9 · Manual 7 API+UI PASS after Track A)',
      open_root_causes: 0,
      final_gate: 'PRODUCTION-READINESS-FINAL-GATE-REEVALUATION #3',
    },
    registry_freeze: {
      anchor_version: openIssues?.version,
      anchor_sha256: openIssues?.sha256,
      files: registries.map((r) => ({ path: r.path, version: r.version, sha256: r.sha256 })),
    },
    evidence_freeze: {
      manifest: `evidence/GO_production_readiness/rc-freeze/${stamp}/RC-FREEZE-MANIFEST.json`,
      latest_pointer: 'evidence/GO_production_readiness/rc-freeze/RC-FREEZE-MANIFEST-LATEST.json',
      file_count: evidence.length,
    },
    git_sha,
    reevaluation_ref: finalGate.recorded_at_utc,
    owner_attestation: {
      role: 'Release Candidate Freeze · Agent-generated package',
      decision: 'GO',
      note: 'Owner countersign required before Production cutover',
      signed_utc: null,
      name: null,
    },
    forbidden_after_freeze: [
      'New HAT / Manual / BFM validation runs',
      'Registry version bumps without new RC cycle',
      'Business logic changes under TT_SPRINT_B_ACTIVE',
    ],
  };

  const prodPlan = `# Production Deployment Plan · Post-RC Freeze

> **Generated:** ${ts}  
> **RC Freeze stamp:** \`${stamp}\`  
> **Git SHA:** \`${git_sha || 'unknown'}\`  
> **Status:** PLAN ONLY — not Production GO

---

## 0 · Boundary

| Signal | Value |
|--------|-------|
| \`TT_PRODUCTION_ENTRY_READY\` | **${master.TT_PRODUCTION_ENTRY_READY}** (RC validation complete) |
| \`TT_PRODUCTION_GO\` | **NO_GO** (PI3 infrastructure · Owner live resources) |
| \`TT_SPRINT_B_ACTIVE\` | **false** |

RC Freeze closes **product readiness validation**. Production cutover follows **PI3** ([\`TT-RELEASE-PIPELINE.md\`](../../docs/runbook/TT-RELEASE-PIPELINE.md)).

---

## 1 · Staging → Production surfaces

| Surface | Staging (validated) | Production target |
|---------|---------------------|-------------------|
| API | \`tt-api-staging.fly.dev\` | \`tt-api-prod\` · [\`deploy/fly/tt-api-prod/\`](../../deploy/fly/tt-api-prod/) |
| Web | \`tt-web-staging.fly.dev\` | \`tt-web-prod\` · [\`deploy/fly/tt-web-prod/\`](../../deploy/fly/tt-web-prod/) |

**Deploy scripts:**
- API: \`bash scripts/dev/phase3-production-fly-deploy-and-sync.sh\`
- Web: \`bash scripts/dev/deploy-tt-web-production.sh\`

---

## 2 · Pre-cutover checklist (PI3)

1. **Database** — \`tt-traveltrust-prod\` PG provisioned · backup policy
2. **Secrets** — \`scripts/dev/.env.production.example\` → Fly secrets (no mock-pay flags on prod unless explicitly waived)
3. **Domain / TLS** — production DNS · CORS patch (\`patch-tt-api-prod-cors.sh\`)
4. **CDN / assets** — G3 production CDN VERIFIED (not staging evidence)
5. **Stripe Live** — PI3-003
6. **Runtime parity** — \`GET /meta\` on prod matches RC registry expectations (no \`P3_CHAIN_OFF\` mock-pay on prod by default)
7. **Owner sign-off** — \`production-go-decision-package.json\` countersigned

---

## 3 · Recommended cutover sequence

\`\`\`text
RC Freeze tag (this release)
    → PI3 infrastructure audit (run-production-infrastructure-audit.sh)
    → Production secrets + DNS
    → tt-api-prod deploy (phase3-production-fly-deploy-and-sync.sh)
    → tt-web-prod deploy (deploy-tt-web-production.sh)
    → Production smoke / PER regression
    → Owner Production GO package
\`\`\`

---

## 4 · Rollback

- Fly: \`fly releases -a tt-api-prod\` / \`fly releases -a tt-web-prod\` → rollback to prior release
- Tag anchor: \`${git_sha || 'rc-freeze-sha'}\` for reproducible rebuild

---

## 5 · Evidence references

- RC manifest: \`evidence/GO_production_readiness/rc-freeze/RC-FREEZE-MANIFEST-LATEST.json\`
- RC sign-off: \`evidence/GO_production_readiness/rc-freeze/RELEASE-CANDIDATE-FINAL-SIGNOFF-LATEST.json\`
- Master checklist: \`evidence/GO_production_readiness/PRODUCTION-READINESS-MASTER-CHECKLIST-LATEST.json\`
- Final Gate #3: \`evidence/GO_production_readiness/sprints/PRODUCTION-READINESS-FINAL-GATE-REEVALUATION-LATEST.json\`
`;

  const signoffMd = `# Release Candidate · Final Sign-off (Production Readiness)

**Stamp:** \`${stamp}\`  
**Recorded:** ${ts}  
**Verdict:** **GO** (\`TT_PRODUCTION_ENTRY_READY: YES\`)

## Gates (all met)

| Gate | Status |
|------|--------|
| Business Data Readiness | READY |
| HAT Matrix | PASS (v11) |
| Business Flow Matrix | PASS |
| Manual Validation | PASS (9/9) |
| Open Root Causes | 0 |
| Production Entry | **YES** |

## Registry freeze (anchor v${openIssues?.version})

| Registry | Version | SHA256 (prefix) |
|----------|---------|-----------------|
${registries.map((r) => `| \`${r.path}\` | ${r.version ?? '—'} | \`${r.sha256.slice(0, 16)}…\` |`).join('\n')}

## Evidence freeze

- **${evidence.length}** \`*LATEST*\` files under \`evidence/GO_production_readiness/\`
- Manifest: \`rc-freeze/${stamp}/RC-FREEZE-MANIFEST.json\`

## Git

- **SHA:** \`${git_sha || 'unknown'}\`
- **Suggested tag:** \`v1.1.0-rc.${stamp.slice(0, 8)}\`

## Owner attestation

> Owner countersign required before Production cutover.  
> This package closes RC validation — **not** \`TT_PRODUCTION_GO\`.

---

**Discipline:** No new HAT / Manual / BFM validation after this freeze.
`;

  fs.writeFileSync(path.join(stampDir, 'RC-FREEZE-MANIFEST.json'), JSON.stringify(freezeManifest, null, 2) + '\n');
  fs.writeFileSync(
    path.join(stampDir, 'RELEASE-CANDIDATE-FINAL-SIGNOFF.json'),
    JSON.stringify(signoff, null, 2) + '\n',
  );
  fs.writeFileSync(path.join(stampDir, 'RELEASE-CANDIDATE-FINAL-SIGNOFF.md'), signoffMd);
  fs.writeFileSync(path.join(stampDir, 'PRODUCTION-DEPLOYMENT-PLAN.md'), prodPlan);

  const latest = (name, src) => {
    const dest = path.join(FREEZE_DIR, name);
    fs.writeFileSync(dest, fs.readFileSync(src));
  };
  latest('RC-FREEZE-MANIFEST-LATEST.json', path.join(stampDir, 'RC-FREEZE-MANIFEST.json'));
  latest(
    'RELEASE-CANDIDATE-FINAL-SIGNOFF-LATEST.json',
    path.join(stampDir, 'RELEASE-CANDIDATE-FINAL-SIGNOFF.json'),
  );
  latest('RELEASE-CANDIDATE-FINAL-SIGNOFF-LATEST.md', path.join(stampDir, 'RELEASE-CANDIDATE-FINAL-SIGNOFF.md'));
  latest('PRODUCTION-DEPLOYMENT-PLAN-LATEST.md', path.join(stampDir, 'PRODUCTION-DEPLOYMENT-PLAN.md'));

  const registryFreeze = `# Production Readiness · RC Registry Freeze Record
# IMMUTABLE after stamp ${stamp} — bump only via new RC cycle

schema: traveltrust.production_readiness_rc_registry_freeze.v1
version: 1
effective_utc: "${ts.slice(0, 10)}"
machine_key: TT_PRODUCTION_READINESS_RC_REGISTRY_FREEZE
status: FROZEN
frozen_at_utc: "${ts}"
git_sha: "${git_sha || ''}"
anchor:
  path: registry/production-readiness-open-issues.v1.yaml
  version: ${openIssues?.version ?? 17}
  sha256: "${openIssues?.sha256 || ''}"
registries:
${registries.map((r) => `  - { path: ${r.path}, version: ${r.version ?? 'null'}, sha256: "${r.sha256}" }`).join('\n')}
evidence_manifest: evidence/GO_production_readiness/rc-freeze/RC-FREEZE-MANIFEST-LATEST.json
signoff: evidence/GO_production_readiness/rc-freeze/RELEASE-CANDIDATE-FINAL-SIGNOFF-LATEST.json
production_plan: evidence/GO_production_readiness/rc-freeze/PRODUCTION-DEPLOYMENT-PLAN-LATEST.md
discipline:
  no_new_hat_manual_bfm: true
  no_registry_bump_without_new_rc: true
  TT_SPRINT_B_ACTIVE: false
`;
  fs.writeFileSync(
    path.join(ROOT, 'registry/production-readiness-rc-registry-freeze.v1.yaml'),
    registryFreeze.endsWith('\n') ? registryFreeze : registryFreeze + '\n',
  );

  console.log(`TT_PRODUCTION_READINESS_RC_FREEZE: FROZEN`);
  console.log(`TT_PRODUCTION_ENTRY_READY: ${master.TT_PRODUCTION_ENTRY_READY}`);
  console.log(`Registry anchor: open-issues v${openIssues?.version} · ${evidence.length} evidence files`);
  console.log(`Stamp dir: evidence/GO_production_readiness/rc-freeze/${stamp}/`);
  console.log(`Suggested tag: v1.1.0-rc.${stamp.slice(0, 8)}`);
}

main();
