#!/usr/bin/env node
/**
 * PSG Production Release Baseline — cite-only assembler (no Gate re-run).
 *
 * Emits:
 *   registry/psg-production-release-baseline-LATEST.v1.yaml
 *   evidence/GO_psg_foundation/release_baseline/<stamp>/RELEASE-BASELINE-MANIFEST.json
 *   evidence/GO_psg_foundation/release_baseline/RELEASE-BASELINE-LATEST.json
 *   docs/runbook/TT-PSG-PRODUCTION-RELEASE-BASELINE-LATEST.md
 *
 *   FREEZE_MANIFEST_ID=RC-FREEZE-20260717T094900Z \
 *     node scripts/dev/run-psg-production-release-baseline.cjs
 *
 * Does NOT create the git tag (Owner/agent runs git tag -a separately on freeze SHA).
 * Does NOT flip TT_PRODUCTION_GO. Does NOT re-run cert gates.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '../..');
const EXPECTED_FREEZE = process.env.FREEZE_MANIFEST_ID || 'RC-FREEZE-20260717T094900Z';
const TAG = process.env.RELEASE_BASELINE_TAG || 'v1.1.0-psg-go.20260717';
const STAMP = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');

const PATHS = {
  freeze: 'registry/psg-release-candidate-freeze-LATEST.v1.yaml',
  sequence: 'registry/psg-release-candidate-sequence.v1.yaml',
  matrix: 'registry/production-readiness-master-matrix.v1.yaml',
  prodCert: 'evidence/GO_psg_foundation/production_cert/PSG-PRODUCTION-CERT-LATEST.json',
  entry: 'evidence/GO_psg_foundation/production_entry_review/PSG-RC-PRODUCTION-ENTRY-LATEST.json',
  decision: 'evidence/GO_psg_foundation/production_go/OWNER-DECISION-PACKAGE-LATEST.json',
  checklist: 'evidence/GO_psg_foundation/production_go/OWNER-SIGNOFF-CHECKLIST-LATEST.md',
  perClear:
    'docs/spec/governance-token/evidence/phase3-production-entry-baseline/PER-EXIT-BLOCKERS/PER-EXIT-BLOCKERS-CLEAR-LATEST.json',
  goOpen: 'evidence/GO_psg_foundation/production_go/PSG-RC-PRODUCTION-GO-LATEST.json',
};

function fail(m) {
  console.error(`TT_PSG_RELEASE_BASELINE: FAIL ${m}`);
  process.exit(2);
}

function readText(rel) {
  const p = path.join(ROOT, rel);
  if (!fs.existsSync(p)) fail(`missing ${rel}`);
  return fs.readFileSync(p, 'utf8');
}

function readJson(rel) {
  return JSON.parse(readText(rel));
}

function yamlField(text, key) {
  const m = text.match(new RegExp(`(?:^|\\n)\\s*${key}:\\s*(\\S+)`, 'm'));
  return m ? m[1].replace(/^["']|["']$/g, '') : null;
}

function sha256File(rel) {
  const abs = path.join(ROOT, rel);
  const buf = fs.readFileSync(abs);
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function main() {
  const freezeYml = readText(PATHS.freeze);
  if (!/^status:\s*FROZEN/m.test(freezeYml)) fail('freeze not FROZEN');
  const freezeId = yamlField(freezeYml, 'freeze_manifest_id');
  if (freezeId !== EXPECTED_FREEZE) fail(`freeze_manifest_id=${freezeId} ≠ ${EXPECTED_FREEZE}`);
  const freezeGit = yamlField(freezeYml, 'git_sha');
  if (!freezeGit || freezeGit.length < 40) fail('freeze git_sha missing');

  const prod = readJson(PATHS.prodCert);
  if (prod.status !== 'PASS') fail(`TT_PSG_PRODUCTION_CERT=${prod.status}`);

  const decision = readJson(PATHS.decision);
  if (decision.owner_attestation?.decision !== 'GO') {
    fail(`owner_attestation.decision=${decision.owner_attestation?.decision || 'null'}`);
  }
  if (decision.freeze_manifest_id && decision.freeze_manifest_id !== EXPECTED_FREEZE) {
    fail('decision package freeze mismatch');
  }

  const matrixYml = readText(PATHS.matrix);
  const liveGo = yamlField(matrixYml, 'TT_PRODUCTION_GO');
  if (liveGo !== 'GO') fail(`TT_PRODUCTION_GO=${liveGo} (need GO before baseline)`);

  const entry = readJson(PATHS.entry);
  const perClear = readJson(PATHS.perClear);

  let tagPoints = null;
  try {
    tagPoints = execSync(`git rev-list -n1 ${TAG}`, { cwd: ROOT, encoding: 'utf8' }).trim();
  } catch {
    tagPoints = null;
  }

  const citedRels = [
    PATHS.freeze,
    PATHS.sequence,
    PATHS.matrix,
    PATHS.prodCert,
    PATHS.entry,
    PATHS.decision,
    PATHS.checklist,
    PATHS.perClear,
    PATHS.goOpen,
  ];

  const cited = citedRels.map((rel) => ({
    path: rel,
    sha256: sha256File(rel),
    bytes: fs.statSync(path.join(ROOT, rel)).size,
  }));

  const manifest = {
    schema: 'traveltrust.psg_production_release_baseline.v1',
    machine_key: 'TT_PSG_PRODUCTION_RELEASE_BASELINE',
    stamp_utc: STAMP,
    status: 'ACTIVE',
    tag: TAG,
    tag_created: Boolean(tagPoints),
    tag_points_at: tagPoints,
    freeze_manifest_id: freezeId,
    git_sha: freezeGit,
    tt_psg_production_cert: 'PASS',
    tt_production_go: 'GO',
    owner_attestation: {
      name: decision.owner_attestation?.name || null,
      decision: decision.owner_attestation?.decision || null,
      signed_utc: decision.owner_attestation?.signed_utc || null,
    },
    production_cert_stamp: prod.stamp_utc,
    step4_status: entry.status || null,
    discipline: {
      no_gate_rerun: true,
      dirty_worktree_excluded_from_tag: true,
      hotfix_from_tag_only: true,
      next_version_requires_new_freeze: true,
    },
    cited_artifacts: cited,
    honest_boundary:
      'Tag = certified code SHA (freeze). Governance GO/decision files may post-date the tag and are bound by this MANIFEST sha256 list. ≠ re-Cert. ≠ skip next Freeze.',
  };

  const evidDir = path.join(ROOT, 'evidence/GO_psg_foundation/release_baseline', STAMP);
  const evidLatestDir = path.join(ROOT, 'evidence/GO_psg_foundation/release_baseline');
  const perDir = path.join(
    ROOT,
    'docs/spec/governance-token/evidence/phase3-production-entry-baseline/PER-EXIT-BLOCKERS'
  );
  fs.mkdirSync(evidDir, { recursive: true });
  fs.mkdirSync(evidLatestDir, { recursive: true });
  fs.mkdirSync(perDir, { recursive: true });

  const manifestJson = `${JSON.stringify(manifest, null, 2)}\n`;
  fs.writeFileSync(path.join(evidDir, 'RELEASE-BASELINE-MANIFEST.json'), manifestJson);
  fs.writeFileSync(path.join(evidLatestDir, 'RELEASE-BASELINE-LATEST.json'), manifestJson);
  fs.writeFileSync(path.join(perDir, 'RELEASE-BASELINE-LATEST.json'), manifestJson);

  const registryYml = `# PSG Production Release Baseline (ACTIVE · sole Hotfix/Patch/next-version origin)
# Human: docs/runbook/TT-PSG-PRODUCTION-RELEASE-BASELINE-LATEST.md
# Assembler: scripts/dev/run-psg-production-release-baseline.cjs
schema: traveltrust.psg_production_release_baseline.v1
machine_key: TT_PSG_PRODUCTION_RELEASE_BASELINE
status: ACTIVE
stamp_utc: "${STAMP}"

baseline:
  tag: ${TAG}
  freeze_manifest_id: ${freezeId}
  git_sha: ${freezeGit}
  tt_psg_production_cert: PASS
  tt_production_go: GO
  production_cert_stamp: "${prod.stamp_utc || ''}"
  owner_decision: GO
  owner_signed_utc: "${decision.owner_attestation?.signed_utc || ''}"

evidence:
  manifest_stamp: ${STAMP}
  manifest: evidence/GO_psg_foundation/release_baseline/${STAMP}/RELEASE-BASELINE-MANIFEST.json
  latest: evidence/GO_psg_foundation/release_baseline/RELEASE-BASELINE-LATEST.json
  per_mirror: docs/spec/governance-token/evidence/phase3-production-entry-baseline/PER-EXIT-BLOCKERS/RELEASE-BASELINE-LATEST.json
  cited:
    - ${PATHS.freeze}
    - ${PATHS.prodCert}
    - ${PATHS.decision}
    - ${PATHS.entry}
    - ${PATHS.perClear}
    - ${PATHS.matrix}

evolution_rules:
  hotfix_patch:
    must_branch_from: ${TAG}
    or_sha: ${freezeGit}
    record_as: Baseline_Patch
    forbid: parallel_already_GO_narrative
  next_version_feature:
    must_branch_from: ${TAG}
    requires: new_freeze_manifest_id
    forbid: silent_retag_or_move_baseline_tag
  forbidden:
    - tagging_dirty_worktree_as_baseline
    - claiming_baseline_with_uncertified_sha
    - documentation_rewrite_as_new_GO
    - re_running_PASS_gates_to_mint_baseline

honest_boundary: >
  Tag is the certified code commit (freeze git_sha). Owner GO attestation and
  matrix TT_PRODUCTION_GO may be recorded after the tag; they are bound by the
  Evidence MANIFEST sha256 list. This baseline ≠ re-run Production Cert ≠ skip
  next RC Freeze.

machine_line: TT_PSG_PRODUCTION_RELEASE_BASELINE: ACTIVE tag=${TAG} sha=${freezeGit.slice(0, 12)}
`;

  fs.writeFileSync(path.join(ROOT, 'registry/psg-production-release-baseline-LATEST.v1.yaml'), registryYml);

  const note = `# TT · PSG Production Release Baseline（LATEST）

**Status:** \`ACTIVE\`  
**Stamp:** \`${STAMP}\`  
**Git Tag:** \`${TAG}\` → \`${freezeGit}\`  
**Freeze:** \`${freezeId}\`  
**TT_PSG_PRODUCTION_CERT:** \`PASS\`  
**TT_PRODUCTION_GO:** \`GO\`  
**Owner:** ${decision.owner_attestation?.name || '—'} · signed \`${decision.owner_attestation?.signed_utc || '—'}\`

## 含义

本基线是 **后续 Hotfix / Patch / 下一版本开发的唯一起点**。

| 层 | 真源 |
|----|------|
| 代码 | Annotated tag \`${TAG}\` = freeze SHA（**不含**脏工作区） |
| 治理 | [OWNER-DECISION-PACKAGE-LATEST.json](../../evidence/GO_psg_foundation/production_go/OWNER-DECISION-PACKAGE-LATEST.json) + Matrix \`TT_PRODUCTION_GO: GO\` |
| 机读指针 | [registry/psg-production-release-baseline-LATEST.v1.yaml](../../registry/psg-production-release-baseline-LATEST.v1.yaml) |
| 不可变清单 | [RELEASE-BASELINE-LATEST.json](../../evidence/GO_psg_foundation/release_baseline/RELEASE-BASELINE-LATEST.json) |

## 演进纪律

1. **Hotfix / Patch** — 从 \`${TAG}\`（或 SHA \`${freezeGit.slice(0, 12)}…\`）拉出；记为 **Baseline Patch**；禁止平行「已 GO」叙事。  
2. **下一版本 / Feature** — 新分支自该 Tag；须 **新** \`freeze_manifest_id\`（新 RC Freeze）；**禁止** 静默改写本 Tag。  
3. **禁止** 用脏工作区或未认证 SHA 冒充本基线；禁止用文档改写冒充新 GO；禁止为「造基线」重跑已 PASS Gate。

## 创建 Tag（若尚未存在）

\`\`\`bash
git tag -a ${TAG} ${freezeGit} -m "PSG Production Release Baseline · ${freezeId} · TT_PSG_PRODUCTION_CERT=PASS · TT_PRODUCTION_GO=GO"
git rev-list -n1 ${TAG}   # must equal ${freezeGit}
# Owner: git push origin ${TAG}   # 不自动 push
\`\`\`

## 互指

- Freeze: [psg-release-candidate-freeze-LATEST.v1.yaml](../../registry/psg-release-candidate-freeze-LATEST.v1.yaml)  
- Sequence: [psg-release-candidate-sequence.v1.yaml](../../registry/psg-release-candidate-sequence.v1.yaml)  
- Production Cert: [PSG-PRODUCTION-CERT-LATEST.json](../../evidence/GO_psg_foundation/production_cert/PSG-PRODUCTION-CERT-LATEST.json)  
- Owner Decision: [OWNER-DECISION-PACKAGE-LATEST.json](../../evidence/GO_psg_foundation/production_go/OWNER-DECISION-PACKAGE-LATEST.json)

**诚实边界：** Tag = 已认证代码提交；本基线 ≠ 再次 Production Cert ≠ 允许跳过下一版 Freeze。
`;

  fs.writeFileSync(path.join(ROOT, 'docs/runbook/TT-PSG-PRODUCTION-RELEASE-BASELINE-LATEST.md'), note);

  console.log(`TT_PSG_PRODUCTION_RELEASE_BASELINE: ACTIVE stamp=${STAMP}`);
  console.log(`tag_target: ${TAG} -> ${freezeGit}`);
  console.log(`registry: registry/psg-production-release-baseline-LATEST.v1.yaml`);
  console.log(`manifest: evidence/GO_psg_foundation/release_baseline/RELEASE-BASELINE-LATEST.json`);
  console.log(`note: docs/runbook/TT-PSG-PRODUCTION-RELEASE-BASELINE-LATEST.md`);
  if (!tagPoints) {
    console.log(`NOTE: git tag ${TAG} not present yet — create annotated tag on freeze SHA (no force)`);
  } else if (tagPoints !== freezeGit) {
    fail(`existing tag ${TAG} points at ${tagPoints} ≠ freeze ${freezeGit}`);
  } else {
    console.log(`tag_ok: ${TAG} already points at freeze SHA`);
  }
}

main();
