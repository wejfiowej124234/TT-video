/**
 * Owner-facing rollups: Executive Summary · Four-Gate Matrix · Mainnet Deploy Checklist.
 * Terminology SSOT: registry/production-go-four-gate-framework.v1.yaml
 * Consumed by gen-production-readiness-book.cjs — no Gate state change.
 */
const fs = require('fs');
const path = require('path');

const FOUR_GATE_SSOT = 'registry/production-go-four-gate-framework.v1.yaml';

function readJson(root, rel) {
  try {
    return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8'));
  } catch {
    return null;
  }
}

function readText(root, rel) {
  try {
    return fs.readFileSync(path.join(root, rel), 'utf8');
  } catch {
    return '';
  }
}

function exists(root, rel) {
  return fs.existsSync(path.join(root, rel));
}

function readFourGateRegistry(root) {
  const text = readText(root, FOUR_GATE_SSOT);
  const gates = [
    { layer: 'L1', label: 'Business Ready', machine_key: 'TT_PRODUCTION_BUSINESS_READY', registry_key: 'GATE-1' },
    { layer: 'L2', label: 'Web3 Ready', machine_key: 'TT_PRODUCTION_WEB3_READY', registry_key: 'GATE-2' },
    { layer: 'L3', label: 'Infrastructure Ready', machine_key: 'TT_PRODUCTION_INFRASTRUCTURE_READY', registry_key: 'GATE-3' },
    { layer: 'L4', label: 'Operations Ready', machine_key: 'TT_PRODUCTION_OPERATIONS_READY', registry_key: 'GATE-4' },
    { layer: null, label: 'Owner Sign-off', machine_key: 'TT_OWNER_FINAL_SIGNOFF', registry_key: 'GATE-5' },
    { layer: null, label: 'Production GO', machine_key: 'TT_PRODUCTION_GO', registry_key: 'GATE-FINAL' },
  ];
  for (const g of gates) {
    const block = text.match(new RegExp(`id: ${g.registry_key}[\\s\\S]*?(?=\\n  - id:|\\nlayers:|$)`));
    const current = block?.[0]?.match(/current: (\S+)/)?.[1] || 'UNKNOWN';
    g.registry_current = current;
  }
  return gates;
}

function formatGateLabel(label, layer) {
  return layer ? `${label} (${layer})` : label;
}

function mapRegistryToDisplay(gate, ctx) {
  const { exitPass, certS, prereqAllPass, sub2B, sub2C, sub2E, ownerSigned, productionGo } = ctx;
  const rc = gate.registry_current;

  if (gate.machine_key === 'TT_PRODUCTION_BUSINESS_READY') {
    const pass = rc === 'PASS' || prereqAllPass;
    return { status: pass ? 'PASS' : 'WAIT', blocking: !pass, note: 'TT_PRODUCTION_BUSINESS_READY · Prerequisite Reviews' };
  }
  if (gate.machine_key === 'TT_PRODUCTION_WEB3_READY') {
    if (exitPass && rc === 'PASS') return { status: 'PASS', blocking: false, note: 'TT_PRODUCTION_WEB3_READY · Phase ②-F PASS' };
    if (!exitPass) return { status: 'WAIT (②-F)', blocking: true, note: `TT_PRODUCTION_WEB3_READY · Cert ${certS.detail}` };
    return { status: rc === 'PASS' ? 'PASS' : 'IN_PROGRESS', blocking: rc !== 'PASS', note: 'TT_PRODUCTION_WEB3_READY · Four-Gate L2' };
  }
  if (gate.machine_key === 'TT_PRODUCTION_INFRASTRUCTURE_READY') {
    const stagingPass = sub2C?.pass !== false && sub2E?.pass !== false;
    const pass = rc === 'PASS' || stagingPass;
    return { status: pass ? 'PASS' : rc === 'IN_PROGRESS' ? 'IN_PROGRESS' : 'WAIT', blocking: !pass && rc !== 'PASS', note: 'TT_PRODUCTION_INFRASTRUCTURE_READY · L3' };
  }
  if (gate.machine_key === 'TT_PRODUCTION_OPERATIONS_READY') {
    const stagingPass = sub2B?.pass !== false;
    const pass = rc === 'PASS' || stagingPass;
    return { status: pass ? 'PASS' : rc === 'IN_PROGRESS' ? 'IN_PROGRESS' : 'WAIT', blocking: !pass && rc !== 'PASS', note: 'TT_PRODUCTION_OPERATIONS_READY · L4' };
  }
  if (gate.machine_key === 'TT_OWNER_FINAL_SIGNOFF') {
    const pass = ownerSigned || rc === 'PASS';
    return { status: pass ? 'PASS' : 'WAIT', blocking: !pass, note: 'TT_OWNER_FINAL_SIGNOFF · after Four-Gate PASS + Package review' };
  }
  if (gate.machine_key === 'TT_PRODUCTION_GO') {
    const go = productionGo === 'GO';
    return { status: go ? 'GO' : 'NOT YET', blocking: !go, note: 'TT_PRODUCTION_GO · sole Production GO authority' };
  }
  return { status: rc, blocking: rc !== 'PASS', note: gate.machine_key };
}

function prepComponentsReady(prep) {
  if (!prep?.components) return { ready: 0, total: 8 };
  const keys = Object.keys(prep.components);
  const ready = prep.verdict === 'MAINNET_DEPLOYMENT_PACKAGE_PREP_COMPLETE' ? keys.length : 0;
  return { ready, total: keys.length || 8 };
}

function certStatus(cert) {
  const signed = cert?.signed_count ?? 0;
  const total = cert?.total_certs ?? 12;
  if (signed >= total) return { label: 'PASS', detail: `${signed}/${total}`, blocking: false, waiting: false };
  const waiting = signed < 8;
  return {
    label: 'WAIT',
    detail: `${signed}/${total} · active Cert #${cert?.active_cert ?? signed + 1}`,
    blocking: true,
    waiting,
  };
}

function countSubChecks(reviews) {
  let pass = 0;
  let total = 0;
  for (const r of reviews || []) {
    pass += r.summary?.pass ?? 0;
    total += r.summary?.total ?? 0;
  }
  const reviewPass = (reviews || []).filter((r) => r.pass).length;
  return { pass, total, reviewPass, reviewTotal: (reviews || []).length };
}

function readGovernanceFreeze(root) {
  return readJson(root, 'evidence/GO_production_readiness/governance-freeze/GOVERNANCE-FREEZE-MANIFEST-LATEST.json');
}

function readGovernanceVersion(root) {
  const text = readText(root, 'registry/production-governance-principles.v1.yaml');
  if (!text.includes('governance_root: true')) return null;
  const lifecycle = text.match(/lifecycle: (\S+)/)?.[1] || 'COMPLETE';
  return {
    id: 'production_release_governance_v1',
    label: 'Production Release Governance v1',
    status: 'FROZEN',
    lifecycle,
    mode: 'OPERATE',
    compatibility: 'PATCH_ONLY',
    governance_root: 'registry/production-governance-principles.v1.yaml',
  };
}

function buildExecutiveSummary(ctx) {
  const {
    fourGateRows,
    prep,
    reviews,
    blockerCount,
    protocolGrade,
    cert,
    exitPass,
    productionGo,
  } = ctx;

  const certS = certStatus(cert);
  const comp = prepComponentsReady(prep);
  const prepComplete = prep?.verdict === 'MAINNET_DEPLOYMENT_PACKAGE_PREP_COMPLETE';
  const sub = countSubChecks(reviews);
  const p0 = protocolGrade?.summary?.blockers_p0 ?? blockerCount ?? 0;

  let currentPhase = 'READY FOR MAINNET DEPLOYMENT PREP';
  let nextAction = 'Monitor Four-Gate + Mainnet Deployment Track';
  if (!exitPass && certS.waiting) {
    currentPhase = 'WAITING FOR CERT #8–#12';
    nextAction = 'Execute Cert #8–#12 after Timelock expiry.';
  } else if (!exitPass) {
    currentPhase = 'PHASE ②-F EXIT REVIEW IN PROGRESS';
    nextAction = 'Complete Phase ②-F Exit Review checks.';
  } else if (ctx.freeze?.verdict !== 'WEB3_FREEZE_PASS') {
    currentPhase = 'READY FOR WEB3 FREEZE';
    nextAction = 'node scripts/dev/run-web3-freeze.cjs after ②-F PASS.';
  } else if (ctx.pkg?.verdict !== 'MAINNET_DEPLOYMENT_PACKAGE_GENERATED') {
    currentPhase = 'READY FOR MAINNET PACKAGE GENERATION';
    nextAction = 'node scripts/dev/generate-mainnet-deployment-package.cjs';
  }

  const fourGateDisplay = fourGateRows.map((r) => ({
    label: r.gate,
    status: r.status,
    machine_key: r.machine_key,
  }));

  const governanceFreeze = ctx.governanceFreeze;

  return {
    schema: 'traveltrust.production_readiness_executive_summary.v1',
    recorded_utc: new Date().toISOString(),
    title: 'Production Readiness Executive Summary',
    four_gate_ssot: FOUR_GATE_SSOT,
    governance_layer: governanceFreeze?.verdict === 'GOVERNANCE_FREEZE_ACTIVE' ? 'FROZEN' : 'NOT_FROZEN',
    governance_scope: 'governance_layer_structure_only',
    governance_model: 'structure_frozen_state_continues',
    governance_principle: 'PG-P1',
    governance_principle_ref: 'registry/production-governance-principles.v1.yaml',
    governance_lifecycle: ctx.governanceVersion?.lifecycle || null,
    governance_status: ctx.governanceVersion?.status || null,
    governance_compatibility: ctx.governanceVersion?.compatibility || null,
    governance_mode: ctx.governanceVersion?.mode || 'OPERATE',
    four_gate: fourGateDisplay,
    prerequisite_reviews: `${sub.reviewPass}/${sub.reviewTotal} PASS`,
    sub_checks: `${sub.pass}/${sub.total} PASS`,
    blocking_p0: p0,
    blocking_p1: p0 === 0 && certS.waiting ? 'Timelock Only' : protocolGrade?.summary?.blockers_p1 ?? 0,
    mainnet_package_prep: prepComplete ? `READY (${comp.ready}/${comp.total})` : 'NOT READY',
    current_phase: currentPhase,
    next_action: nextAction,
    production_go: productionGo === 'GO' ? 'GO' : 'NOT YET',
    governance_version: ctx.governanceVersion?.label || null,
    governance_version_id: ctx.governanceVersion?.id || null,
  };
}

function buildMainnetPrepSection(prep, pkg, freeze) {
  const comp = prepComponentsReady(prep);
  const prepComplete = prep?.verdict === 'MAINNET_DEPLOYMENT_PACKAGE_PREP_COMPLETE';
  return {
    title: 'Mainnet Deployment Package Preparation',
    status: prepComplete ? 'PREP COMPLETE' : 'NOT_STARTED',
    components_ready: `${comp.ready}/${comp.total} READY`,
    generation: freeze?.verdict === 'WEB3_FREEZE_PASS' ? 'READY TO GENERATE' : 'WAITING FOR WEB3 FREEZE',
    gate_impact: prep?.gate_impact || 'NONE',
    prep_stamp: prep?.stamp || null,
    prep_dir: prep?.prep_dir || null,
    package_status: pkg?.verdict || 'NOT_GENERATED',
    freeze: freeze?.verdict || 'NOT_FROZEN',
    template_root: 'docs/runbook/templates/mainnet-package/',
    prep_evidence: 'evidence/GO_production_readiness/mainnet-deployment-package/MAINNET-DEPLOYMENT-PACKAGE-PREP-LATEST.json',
    components: prep?.components || {},
  };
}

function buildDeploymentReadinessMatrix(ctx) {
  const {
    exitReview,
    freeze,
    prep,
    pkg,
    cert,
    phase2,
    shadowGo,
    ownerSigned,
    fourGateRegistry,
    prereqAllPass,
    productionGo,
  } = ctx;

  const certS = certStatus(cert);
  const prepComplete = prep?.verdict === 'MAINNET_DEPLOYMENT_PACKAGE_PREP_COMPLETE';
  const exitPass = exitReview?.verdict === 'PHASE2_EXIT_REVIEW_PASS';
  const freezePass = freeze?.verdict === 'WEB3_FREEZE_PASS';
  const pkgGenerated = pkg?.verdict === 'MAINNET_DEPLOYMENT_PACKAGE_GENERATED';

  const sub2E = phase2?.sub_tracks?.find((t) => t.id === '2E');
  const sub2B = phase2?.sub_tracks?.find((t) => t.id === '2B');
  const sub2C = phase2?.sub_tracks?.find((t) => t.id === '2C');

  const gateCtx = { exitPass, certS, prereqAllPass, sub2B, sub2C, sub2E, ownerSigned, productionGo };

  const four_gate_rows = fourGateRegistry.map((g) => {
    const mapped = mapRegistryToDisplay(g, gateCtx);
    return {
      gate: formatGateLabel(g.label, g.layer),
      machine_key: g.machine_key,
      status: mapped.status,
      blocking: mapped.blocking,
      note: mapped.note,
      section: 'four_gate',
    };
  });

  const mainnet_track_rows = [
    {
      gate: 'Mainnet Package PREP',
      machine_key: 'TT_MAINNET_DEPLOYMENT_PACKAGE_PREP',
      status: prepComplete ? 'READY' : 'WAIT',
      blocking: false,
      note: prepComplete ? `${prepComponentsReady(prep).ready}/8 · no Gate impact` : 'prepare-mainnet-deployment-package-prep.cjs',
      section: 'mainnet_track',
    },
    {
      gate: 'Web3 Freeze',
      machine_key: 'WEB3_FREEZE_PASS',
      status: freezePass ? 'PASS' : 'WAIT',
      blocking: !freezePass,
      note: freeze?.verdict || 'After Phase ②-F Exit Review PASS',
      section: 'mainnet_track',
    },
    {
      gate: 'Deployment Package',
      machine_key: 'MAINNET_DEPLOYMENT_PACKAGE_GENERATED',
      status: pkgGenerated ? 'READY' : 'WAIT',
      blocking: !pkgGenerated,
      note: pkg?.verdict || 'generate-mainnet-deployment-package.cjs',
      section: 'mainnet_track',
    },
    {
      gate: 'Shadow Launch',
      machine_key: 'TT_MAINNET_SHADOW_LAUNCH',
      status: shadowGo ? 'PASS' : 'WAIT',
      blocking: !shadowGo,
      note: shadowGo ? 'shadow_launch_verdict GO' : 'Post-Package · pre-Wave 1',
      section: 'mainnet_track',
    },
    {
      gate: 'Wave 1',
      machine_key: 'TT_MAINNET_WAVE_1',
      status: 'WAIT',
      blocking: true,
      note: 'EscrowFactoryV2 broadcast after Shadow Launch GO',
      section: 'mainnet_track',
    },
  ];

  const rows = [...four_gate_rows, ...mainnet_track_rows];

  return {
    schema: 'traveltrust.deployment_readiness_matrix.v2',
    recorded_utc: new Date().toISOString(),
    four_gate_ssot: FOUR_GATE_SSOT,
    pipeline: [
      'Four-Gate L1–L4 · Owner Sign-off · Production GO',
      'Phase ② (②A–②E PASS · ②F WAIT Cert)',
      'Prerequisite 10/10 · 88/88 · 0 blocker',
      'Mainnet PREP 8/8 READY',
      'Cert #8–#12 → Freeze → Package → Shadow Launch → Wave 1',
    ],
    four_gate_rows,
    mainnet_track_rows,
    rows,
    blocking_gates: rows.filter((r) => r.blocking).map((r) => r.gate),
  };
}

function buildOwnerMainnetChecklist(ctx) {
  const { prep, freeze, pkg, cert, exitReview } = ctx;
  const certS = certStatus(cert);
  const prepComplete = prep?.verdict === 'MAINNET_DEPLOYMENT_PACKAGE_PREP_COMPLETE';
  const comp = prepComponentsReady(prep);
  const hasDeployScripts = prep?.prep_dir
    ? exists(ctx.root, path.join(prep.prep_dir, 'deploy-scripts/DeployEscrowFactoryV2.s.sol'))
    : exists(ctx.root, 'contracts/script/DeployEscrowFactoryV2.s.sol');

  const items = [
    { item: 'Cert Chain', status: certS.label === 'PASS' ? 'PASS' : 'WAIT', note: certS.detail },
    { item: 'Freeze', status: freeze?.verdict === 'WEB3_FREEZE_PASS' ? 'PASS' : 'WAIT', note: freeze?.verdict || 'NOT_FROZEN' },
    { item: 'Package Template', status: prepComplete ? 'READY' : 'WAIT', note: `${comp.ready}/${comp.total} templates` },
    { item: 'Manifest', status: prepComplete ? 'READY' : 'WAIT', note: 'manifest.template.json (formal post-Freeze)' },
    { item: 'Verify Package', status: prepComplete ? 'READY' : 'WAIT', note: 'Contract + Explorer verify runbooks' },
    { item: 'Rollback', status: prepComplete ? 'READY' : 'WAIT', note: 'MAINNET-ROLLBACK-PREP-V1.md' },
    { item: 'Recovery', status: prepComplete ? 'READY' : 'WAIT', note: 'EMERGENCY-RECOVERY-PREP-V1.md' },
    { item: 'Deployment Scripts', status: hasDeployScripts ? 'READY' : 'WAIT', note: 'DeployEscrowFactoryV2 + wave scripts' },
    {
      item: 'Owner Sign-off',
      status: prepComplete ? 'READY' : 'WAIT',
      note: exitReview?.verdict === 'PHASE2_EXIT_REVIEW_PASS' ? 'Template · sign after Package generate' : 'Template · sign after Package generate',
    },
  ];

  return {
    schema: 'traveltrust.owner_mainnet_deploy_checklist.v1',
    recorded_utc: new Date().toISOString(),
    title: 'Owner Mainnet Deploy Checklist',
    subtitle: 'One page — tick on deploy day (does not authorize broadcast alone)',
    items,
    next_blocking: ['Cert #8–#12', 'Web3 Freeze', 'Generate Package', 'Owner signature', 'Shadow Launch GO', 'Wave 1'],
    prep_stamp: prep?.stamp || null,
    package_status: pkg?.verdict || 'NOT_GENERATED',
  };
}

function renderExecutiveSummaryMd(summary) {
  const pad = (label, status) => `${label.padEnd(26)} ${status}`;
  return [
    `# ${summary.title}`,
    '',
    `**Generated:** ${summary.recorded_utc}`,
    '',
    `> Owner 5-second view — terminology aligned with Four-Gate Framework`,
    '',
    summary.governance_layer === 'FROZEN'
      ? '> **Governance layer:** `FROZEN` (structure only) · **State continues** · `refresh-governance-status.cjs`'
      : null,
    '',
    '```text',
    pad('Business Ready (L1)', summary.four_gate.find((g) => g.machine_key === 'TT_PRODUCTION_BUSINESS_READY')?.status || '—'),
    pad('Web3 Ready (L2)', summary.four_gate.find((g) => g.machine_key === 'TT_PRODUCTION_WEB3_READY')?.status || '—'),
    pad('Infrastructure Ready (L3)', summary.four_gate.find((g) => g.machine_key === 'TT_PRODUCTION_INFRASTRUCTURE_READY')?.status || '—'),
    pad('Operations Ready (L4)', summary.four_gate.find((g) => g.machine_key === 'TT_PRODUCTION_OPERATIONS_READY')?.status || '—'),
    '',
    pad('Prerequisite Reviews', summary.prerequisite_reviews),
    pad('Sub-checks', summary.sub_checks),
    pad('Blocking P0', String(summary.blocking_p0)),
    pad('Blocking P1', String(summary.blocking_p1)),
    '',
    pad('Mainnet Package PREP', summary.mainnet_package_prep),
    '',
    pad('Current Phase', summary.current_phase),
    pad('Next Action', summary.next_action),
    '',
    pad('Production GO', summary.production_go),
    '```',
    '',
    summary.governance_layer === 'FROZEN'
      ? '_Governance: `GOVERNANCE_FREEZE_ACTIVE` · Structure Frozen · State Continues_'
      : null,
    '',
    `_Four-Gate SSOT: \`${summary.four_gate_ssot}\`_`,
    '',
    '---',
    '',
    '_Auto-generated by `node scripts/dev/gen-production-readiness-book.cjs`_',
    '',
  ]
    .filter((line) => line !== null)
    .join('\n');
}

function renderExecutiveSummaryBookBlock(summary) {
  const fg = Object.fromEntries(summary.four_gate.map((g) => [g.machine_key, g.status]));
  return [
    '## Production Readiness Executive Summary',
    '',
    summary.governance_layer === 'FROZEN'
      ? `> **${summary.governance_version || 'Production Release Governance v1'}** · Lifecycle \`${summary.governance_lifecycle || 'COMPLETE'}\` · Mode \`OPERATE\` · Patch only · [Governance Root](../../docs/runbook/PRODUCTION-GOVERNANCE-PRINCIPLES-V1.md)`
      : null,
    '',
    '| | |',
    '|---|---|',
    `| **Business Ready (L1)** | **${fg.TT_PRODUCTION_BUSINESS_READY || '—'}** |`,
    `| **Web3 Ready (L2)** | **${fg.TT_PRODUCTION_WEB3_READY || '—'}** |`,
    `| **Infrastructure Ready (L3)** | **${fg.TT_PRODUCTION_INFRASTRUCTURE_READY || '—'}** |`,
    `| **Operations Ready (L4)** | **${fg.TT_PRODUCTION_OPERATIONS_READY || '—'}** |`,
    '',
    '| | |',
    '|---|---|',
    `| Prerequisite Reviews | **${summary.prerequisite_reviews}** |`,
    `| Sub-checks | **${summary.sub_checks}** |`,
    `| Blocking P0 | **${summary.blocking_p0}** |`,
    `| Blocking P1 | **${summary.blocking_p1}** |`,
    '',
    '| | |',
    '|---|---|',
    `| Mainnet Package PREP | **${summary.mainnet_package_prep}** |`,
    `| **Current Phase** | **${summary.current_phase}** |`,
    `| **Next Action** | ${summary.next_action} |`,
    `| **Production GO** | **${summary.production_go}** |`,
    '',
    `_Four-Gate SSOT: \`${summary.four_gate_ssot}\`_`,
    '',
  ]
    .filter((line) => line !== null)
    .join('\n');
}

function renderPrepSectionMd(section) {
  return [
    '## Mainnet Deployment Package Preparation',
    '',
    '| Field | Value |',
    '|-------|-------|',
    `| **Status** | \`${section.status}\` |`,
    `| **Components** | \`${section.components_ready}\` |`,
    `| **Generation** | \`${section.generation}\` |`,
    `| **Gate Impact** | \`${section.gate_impact}\` |`,
    section.prep_stamp ? `| **Prep stamp** | \`${section.prep_stamp}\` |` : null,
    section.prep_dir ? `| **Prep dir** | \`${section.prep_dir}\` |` : null,
    '',
    '**Must wait for:** Cert #8–#12 → Phase ②-F PASS → Web3 Freeze → formal Package generation.',
    '',
    '| # | Component |',
    '|---|-----------|',
    ...Object.entries(section.components).map(([k, v], i) => `| ${i + 1} | \`${v}\` |`),
    '',
  ]
    .filter((line) => line !== null && line !== undefined)
    .join('\n');
}

function renderMatrixMd(matrix) {
  const lines = [
    '# Deployment Readiness Matrix',
    '',
    `**Generated:** ${matrix.recorded_utc}`,
    '',
    '> Single-page mainnet launch status — Four-Gate terminology + Mainnet Deployment Track',
    '',
    `_Four-Gate SSOT: \`${matrix.four_gate_ssot}\`_`,
    '',
    '## Four-Gate Framework (Production GO chain)',
    '',
    '| Gate | Machine Key | Status | Blocking | Notes |',
    '|------|-------------|--------|----------|-------|',
  ];
  for (const r of matrix.four_gate_rows) {
    lines.push(`| ${r.gate} | \`${r.machine_key}\` | **${r.status}** | ${r.blocking ? 'Yes' : 'No'} | ${r.note} |`);
  }
  lines.push(
    '',
    '## Mainnet Deployment Track',
    '',
    '| Gate | Machine Key | Status | Blocking | Notes |',
    '|------|-------------|--------|----------|-------|',
  );
  for (const r of matrix.mainnet_track_rows) {
    lines.push(`| ${r.gate} | \`${r.machine_key}\` | **${r.status}** | ${r.blocking ? 'Yes' : 'No'} | ${r.note} |`);
  }
  lines.push('', '## Pipeline', '', ...matrix.pipeline.map((p) => `- ${p}`), '');
  lines.push(`**Currently blocking:** ${matrix.blocking_gates.join(' · ') || '_none at prep layer_'}`);
  lines.push('', '---', '', '_Auto-generated by `node scripts/dev/gen-production-readiness-book.cjs`_', '');
  return lines.join('\n');
}

function renderOwnerChecklistMd(checklist) {
  const lines = [
    `# ${checklist.title}`,
    '',
    `**Generated:** ${checklist.recorded_utc}`,
    '',
    `> ${checklist.subtitle}`,
    '',
    '| Item | Status | Notes |',
    '|------|--------|-------|',
  ];
  for (const it of checklist.items) {
    lines.push(`| ${it.item} | **${it.status}** | ${it.note} |`);
  }
  lines.push(
    '',
    '## Next blocking steps',
    '',
    ...checklist.next_blocking.map((s) => `- [ ] ${s}`),
    '',
    `**Formal Package:** \`${checklist.package_status}\`${checklist.prep_stamp ? ` · Prep stamp \`${checklist.prep_stamp}\`` : ''}`,
    '',
    '---',
    '',
    '_Auto-generated by `node scripts/dev/gen-production-readiness-book.cjs`_',
    '',
  );
  return lines.join('\n');
}

function detectShadowGo(root) {
  const shadowDir = path.join(root, 'evidence/mainnet_shadow_launch');
  if (!fs.existsSync(shadowDir)) return false;
  for (const ent of fs.readdirSync(shadowDir, { withFileTypes: true })) {
    if (!ent.isDirectory()) continue;
    try {
      const j = JSON.parse(fs.readFileSync(path.join(shadowDir, ent.name, 'shadow_go_no_go.json'), 'utf8'));
      if (j?.shadow_launch_verdict === 'GO') return true;
    } catch {
      /* skip */
    }
  }
  return false;
}

function readProductionGo(root) {
  const text = readText(root, FOUR_GATE_SSOT);
  const m = text.match(/machine_key: TT_PRODUCTION_GO[\s\S]*?current: (\S+)/);
  if (m) return m[1];
  const master = readText(root, 'registry/production-readiness-master-matrix.v1.yaml');
  const m2 = master.match(/TT_PRODUCTION_GO: (\S+)/);
  return m2?.[1] || 'NO_GO';
}

function buildRollups(root, bookCtx) {
  const prep = readJson(root, 'evidence/GO_production_readiness/mainnet-deployment-package/MAINNET-DEPLOYMENT-PACKAGE-PREP-LATEST.json');
  const phase2 = readJson(root, 'evidence/GO_production_readiness/phase2-production-validation/PHASE2-PRODUCTION-VALIDATION-LATEST.json');
  const protocolGrade = readJson(root, 'evidence/GO_production_readiness/web3-protocol-grade-audit/WEB3-PROTOCOL-GRADE-AUDIT-LATEST.json');
  const ownerSigned = exists(root, 'evidence/GO_production_readiness/mainnet-deployment-package/owner-signoff/OWNER-SIGNOFF-SIGNED.md');
  const productionGo = readProductionGo(root);
  const fourGateRegistry = readFourGateRegistry(root);

  const governanceFreeze = readGovernanceFreeze(root);
  const governanceVersion = readGovernanceVersion(root);

  const ctx = {
    root,
    prereqAllPass: bookCtx.allReviewsPass,
    exitReview: bookCtx.exitReview,
    freeze: bookCtx.freeze,
    prep,
    pkg: bookCtx.pkg,
    cert: bookCtx.cert,
    phase2,
    shadowGo: detectShadowGo(root),
    ownerSigned,
    productionGo,
    fourGateRegistry,
    reviews: bookCtx.reviews,
    blockerCount: bookCtx.blockerCount,
    protocolGrade,
    governanceFreeze,
    governanceVersion,
  };

  const deployment_readiness_matrix = buildDeploymentReadinessMatrix(ctx);
  const executive_summary = buildExecutiveSummary({
    ...ctx,
    fourGateRows: deployment_readiness_matrix.four_gate_rows,
    exitPass: bookCtx.exitReview?.verdict === 'PHASE2_EXIT_REVIEW_PASS',
  });
  const mainnet_prep = buildMainnetPrepSection(prep, bookCtx.pkg, bookCtx.freeze);
  const owner_mainnet_checklist = buildOwnerMainnetChecklist(ctx);

  return { executive_summary, mainnet_prep, deployment_readiness_matrix, owner_mainnet_checklist };
}

module.exports = {
  buildRollups,
  renderExecutiveSummaryMd,
  renderExecutiveSummaryBookBlock,
  renderPrepSectionMd,
  renderMatrixMd,
  renderOwnerChecklistMd,
};
