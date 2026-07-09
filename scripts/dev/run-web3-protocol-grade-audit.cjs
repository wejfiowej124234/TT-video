#!/usr/bin/env node
/**
 * Web3 Protocol-Grade Audit — 15 dimensions · cross-validation only.
 *
 *   node scripts/dev/run-web3-protocol-grade-audit.cjs
 *
 * Outputs: evidence/GO_production_readiness/web3-protocol-grade-audit/
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const {
  ROOT,
  loadFramework,
  readSafe,
  exists,
  sourceContains,
  checkEscrowReleaseCaller,
  checkEscrowV2BilateralGate,
  validateFundLifecycleStep,
  validateAttackSurfaceEntry,
  validateRoleStateMachine,
  validateEconomicInvariant,
  countDrillStatus,
} = require('./lib/web3-protocol-grade-audit-lib.cjs');
const { loadMasterMap } = require('./lib/web3-system-master-map.cjs');

const STAMP = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const EVID_ROOT = path.join(ROOT, 'evidence/GO_production_readiness/web3-protocol-grade-audit');
const RUN_DIR = path.join(EVID_ROOT, `audit-${STAMP}`);

const BLOCKERS = [];
const DIMENSIONS = {};

function mkdirp(p) {
  fs.mkdirSync(p, { recursive: true });
}

function addBlocker(priority, id, dimension, title, fix, paths = []) {
  BLOCKERS.push({ priority, id, dimension, title, fix, paths, status: 'OPEN' });
}

function writeBoth(name, content) {
  fs.writeFileSync(path.join(RUN_DIR, name), content, 'utf8');
  fs.writeFileSync(path.join(EVID_ROOT, name.replace(/audit-\d.+\//, '').replace(/^audit-[^/]+\//, '')), content, 'utf8');
}

function runCmd(cmd, args) {
  return spawnSync(cmd, args, { cwd: ROOT, encoding: 'utf8' });
}

function renderFundLifecycleMd(steps, escrowRelease, stepResults) {
  const lines = [
    '# Fund Lifecycle Audit',
    '',
    `**Recorded:** ${new Date().toISOString()}`,
    `**Principle:** Every step — who can call · who cannot · rollback · pause · deadlock`,
    '',
    '| Step | Track | Flow | Caller | Pause | Rollback | Deadlock | Status |',
    '|------|-------|------|--------|-------|----------|----------|--------|',
  ];
  for (const s of steps) {
    const issues = stepResults.filter((r) => r.stepId === s.id);
    const status = issues.some((i) => i.severity === 'P0') ? 'BLOCKED' : issues.length ? 'UNVERIFIED' : 'PASS';
    const caller = Array.isArray(s.caller_allowed) ? s.caller_allowed.join(', ') : s.caller_allowed;
    lines.push(
      `| ${s.id} | ${s.track} | ${s.step} | ${caller} | ${s.pause || '—'} | ${s.rollback || '—'} | ${s.deadlock_risk?.slice(0, 40) || '—'}… | **${status}** |`,
    );
  }
  lines.push('', '## Escrow.release caller cross-validation', '', '```json', JSON.stringify(escrowRelease, null, 2), '```', '');
  if (!escrowRelease.restricted) {
    lines.push(
      '> **Blocker:** `Escrow.release()` has no `onlyTraveler`/`onlyGuide` in source. Must document relayer model or add on-chain guard before mainnet.',
      '',
    );
  }
  return `${lines.join('\n')}\n`;
}

function renderRoleStateMachineMd(roles, validations) {
  const lines = [
    '# Role State Machine Audit',
    '',
    `**Recorded:** ${new Date().toISOString()}`,
    '',
  ];
  for (const roleKey of Object.keys(roles)) {
    const role = roles[roleKey];
    const val = validations.find((v) => v.role === role.machine_code || v.role === roleKey);
    lines.push(`## ${roleKey}`, '', `- **machine_code:** \`${role.machine_code}\``, `- **SSOT:** ${role.ssot}`, '');
    lines.push('| State | Allowed | Forbidden | Anomaly |', '|-------|---------|-----------|---------|');
    for (const st of role.states || []) {
      lines.push(
        `| \`${st.id}\` | ${(st.allowed || []).join(', ')} | ${(st.forbidden || []).join(', ')} | ${st.anomaly || '—'} |`,
      );
    }
    lines.push('', `- **SSOT cross-check:** ${val?.ok ? 'PASS' : `MISSING: ${(val?.missing_states || []).join(', ')}`}`, '');
  }
  return `${lines.join('\n')}\n`;
}

function renderPoolLifecycleMd(pools) {
  const lines = [
    '# Pool Lifecycle Audit',
    '',
    `**Recorded:** ${new Date().toISOString()}`,
    '',
    '| Pool | Contract | Funds In | Funds Out | Can Move | Cannot Move | Pause |',
    '|------|----------|----------|-----------|----------|-------------|-------|',
  ];
  for (const p of pools) {
    lines.push(
      `| ${p.id} | ${p.contract} | ${(p.funds_in || []).join(' · ')} | ${(p.funds_out || []).join(' · ')} | ${(p.movers_allowed || []).join(' · ')} | ${(p.movers_denied || []).join(' · ')} | ${p.pause || '—'} |`,
    );
  }
  return `${lines.join('\n')}\n`;
}

function renderAttackSurfaceMd(matrix, results) {
  const lines = [
    '# Attack Surface Matrix',
    '',
    `**Recorded:** ${new Date().toISOString()}`,
    '',
  ];
  for (const entry of matrix) {
    lines.push(`## ${entry.contract}`, '', '| ID | Vector | Proof | Status |', '|----|--------|-------|--------|');
    const atkResults = results.filter((r) => r.contract === entry.contract);
    for (const a of atkResults) {
      const st = a.blocked ? '**UNVERIFIED**' : a.proof_status;
      lines.push(`| ${a.id} | ${a.vector} | ${a.proof_required} | ${st} |`);
    }
    lines.push('');
  }
  return `${lines.join('\n')}\n`;
}

function renderPermissionMd(tree) {
  function walk(nodes, depth = 0) {
    const out = [];
    for (const n of nodes) {
      out.push(`${'  '.repeat(depth)}- **${n.role}** (\`${n.id}\`) — ${n.scope || ''}`);
      if (n.denies?.length) out.push(`${'  '.repeat(depth)}  - *Denies:* ${n.denies.join(', ')}`);
      if (n.children?.length) out.push(...walk(n.children, depth + 1));
    }
    return out;
  }
  return `# Web3 Permission Matrix\n\n**Recorded:** ${new Date().toISOString()}\n\n## On-chain + off-chain tree\n\n${walk(tree).join('\n')}\n\n## API RBAC\n\nSeparate tree: \`registry/admin-rbac-permissions.v1.yaml\` — **must not** grant Timelock execute or treasury spend.\n`;
}

function renderUpgradeMd(matrix) {
  const lines = [
    '# Upgrade Matrix',
    '',
    `**Recorded:** ${new Date().toISOString()}`,
    '',
  ];
  for (const u of matrix) {
    lines.push(`## ${u.contract}`, '', `- **Path:** ${(u.path || []).join(' → ')}`, `- **Rollback:** ${u.rollback}`, `- **Verify:** ${(u.verify || []).join(', ')}`, `- **Evidence:** ${u.evidence}`, '');
  }
  return `${lines.join('\n')}\n`;
}

function renderEconomicMd(model, invResults) {
  const lines = [
    '# Economic Model Audit',
    '',
    `**Recorded:** ${new Date().toISOString()}`,
    '',
    '## Supply invariants',
    '',
    '| ID | Check | Status | Issues |',
    '|----|-------|--------|--------|',
  ];
  for (const inv of model.supply_invariants || []) {
    const r = invResults.find((x) => x.id === inv.id);
    lines.push(`| ${inv.id} | ${inv.check} | ${r?.ok ? 'PASS' : 'FAIL'} | ${(r?.issues || []).join('; ') || '—'} |`);
  }
  lines.push('', '## Flow graph (cycle / arbitrage)', '', '| From | To | Cycle risk |', '|------|-----|------------|');
  for (const f of model.flow_graph || []) {
    lines.push(`| ${f.from} | ${f.to}${f.to2 ? ' → ' + f.to2 : ''} | ${f.cycle_risk} |`);
  }
  lines.push('', '## Arbitrage checks', '');
  for (const a of model.arbitrage_checks || []) {
    lines.push(`- **${a.id}** ${a.scenario}: ${a.mitigation} — \`${a.status}\``);
  }
  return `${lines.join('\n')}\n`;
}

function renderDrillMd(drill, stats) {
  const lines = [
    '# Mainnet Deployment Drill',
    '',
    `**Recorded:** ${new Date().toISOString()}`,
    `**Dry run progress:** ${stats.total - stats.not_run}/${stats.total} steps evidenced`,
    '',
    '| ID | Phase | Action | Evidence | Status |',
    '|----|-------|--------|----------|--------|',
  ];
  for (const d of drill) {
    lines.push(`| ${d.id} | ${d.phase} | ${d.action} | ${d.evidence_required} | **${d.status}** |`);
  }
  lines.push('', '> Mainnet drill **NOT_RUN** is expected until scope selection + controlled broadcast.', '');
  return `${lines.join('\n')}\n`;
}

function renderResponsibilityMd(matrix) {
  const lines = [
    '# Responsibility Matrix',
    '',
    `**Recorded:** ${new Date().toISOString()}`,
    '',
    '| Module | Product | Security | Contract | Backend | Finance | Ops |',
    '|--------|---------|----------|----------|---------|---------|-----|',
  ];
  for (const r of matrix) {
    lines.push(
      `| ${r.module} | ${r.product?.slice(0, 30) || '—'} | ${r.security?.slice(0, 30) || '—'} | ${r.contract?.slice(0, 30) || '—'} | ${r.backend?.slice(0, 30) || '—'} | ${r.finance?.slice(0, 30) || '—'} | ${r.ops?.slice(0, 30) || '—'} |`,
    );
  }
  return `${lines.join('\n')}\n`;
}

function renderProtocolLifecycleMd(lifecycle, phases) {
  const lines = [
    '# Protocol Lifecycle Audit',
    '',
    `**Recorded:** ${new Date().toISOString()}`,
    `**Phases:** ${phases.join(' → ')}`,
    '',
    '| Module | Design | Implement | Deploy | Verify | Operate | Upgrade | Emergency | Archive |',
    '|--------|--------|-----------|--------|--------|---------|---------|-----------|---------|',
  ];
  for (const m of lifecycle) {
    lines.push(
      `| ${m.module} | ${m.Design} | ${m.Implement} | ${m.Deploy} | ${m.Verify} | ${m.Operate} | ${m.Upgrade} | ${m.Emergency} | ${m.Archive} |`,
    );
  }
  return `${lines.join('\n')}\n`;
}

function renderBlockersMd(manifest) {
  const lines = [
    '# Web3 Protocol-Grade Audit — Blockers',
    '',
    `**Recorded:** ${manifest.recorded_utc}`,
    `**Verdict:** \`${manifest.verdict}\``,
    '',
    `| Priority | Count |`,
    `|----------|-------|`,
    `| P0 | ${manifest.summary.blockers_p0} |`,
    `| P1 | ${manifest.summary.blockers_p1} |`,
    `| P2 | ${manifest.summary.blockers_p2} |`,
    '',
  ];
  for (const p of ['P0', 'P1', 'P2']) {
    const items = manifest.blockers.filter((b) => b.priority === p);
    if (!items.length) continue;
    lines.push(`## ${p}`, '');
    for (const b of items) {
      lines.push(`### ${b.id} — ${b.title}`, '', `- **Dimension:** ${b.dimension}`, `- **Fix:** ${b.fix}`, '');
    }
  }
  return `${lines.join('\n')}\n`;
}

function readJsonSafe(p) {
  try {
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

async function main() {
  mkdirp(RUN_DIR);
  const fw = loadFramework();
  const stateMachineDoc = readSafe('docs/spec/governance-token/state-machine.v1.md');
  const escrowRelease = checkEscrowReleaseCaller();
  const escrowV2 = checkEscrowV2BilateralGate();

  // ── D01 Contract Security ──
  const secRun = runCmd('python', ['scripts/dev/gen-p2fc-web3-system-security-audit.py']);
  const secLatest = exists('evidence/GO_production_readiness/web3-system-security/P2FC-WEB3-SYSTEM-SECURITY-AUDIT-LATEST.json')
    ? JSON.parse(readSafe('evidence/GO_production_readiness/web3-system-security/P2FC-WEB3-SYSTEM-SECURITY-AUDIT-LATEST.json') || '{}')
    : {};
  DIMENSIONS.D01_contract_security = {
    security_audit_exit: secRun.status,
    verdict: secLatest.verdict || (secRun.status === 0 ? 'PASS' : 'UNKNOWN'),
    rbac_bypass: secLatest.p0_rbac_bypass_isolation,
  };
  if (secRun.status !== 0 && !secLatest.verdict) {
    addBlocker('P1', 'PG-P1-001', 'D01', 'Security audit script did not PASS', 'Run gen-p2fc-web3-system-security-audit.py', ['scripts/dev/gen-p2fc-web3-system-security-audit.py']);
  }

  // ── D02 Upgradeability ──
  const g24 = runCmd('bash', ['scripts/gates/check-g24-p-upgrade-01-proxy-architecture.sh']);
  DIMENSIONS.D02_upgradeability = { g24Pass: g24.status === 0 };
  if (g24.status !== 0) {
    addBlocker('P0', 'PG-P0-001', 'D02', 'G24 proxy architecture FAIL', 'Fix G24 before mainnet', ['registry/g24-p-upgrade-01-contract-posture.v1.yaml']);
  }

  // ── D03 Storage Layout ──
  const storageTests = [
    'contracts/test/TtgGovFreezeV1ProxyArchitecture.t.sol',
    'contracts/test/RegionStewardStakePoolProxyBootstrap.t.sol',
  ];
  const storageOk = storageTests.every(exists);
  DIMENSIONS.D03_storage_layout = { tests_present: storageOk, files: storageTests };
  if (!storageOk) {
    addBlocker('P1', 'PG-P1-002', 'D03', 'Proxy storage layout tests missing', 'Restore proxy bootstrap tests', storageTests);
  }

  // ── D04 Governance + D05 Treasury ──
  const certIdx = readJsonSafe(path.join(ROOT, 'evidence/GO_ttg_cert/CERT-EXECUTION-INDEX-LATEST.json'));
  const certReg = readSafe('registry/ttg-governance-cert-gates.v1.yaml');
  const certMatch = certReg.match(/signoffs_completed:\s*(\d+)/);
  const certTotal = certReg.match(/total_certs:\s*(\d+)/);
  const certDone = certIdx?.signed_count ?? (certMatch ? Number(certMatch[1]) : 7);
  const certN = certIdx?.total_certs ?? (certTotal ? Number(certTotal[1]) : 12);
  DIMENSIONS.D04_governance = { cert_signoffs: certDone, cert_total: certN };
  DIMENSIONS.D05_treasury = { cert8_pending: certDone < 8 };
  if (certDone < certN) {
    addBlocker('P1', 'PG-P1-003', 'D04', `TTG Cert ${certDone}/${certN} — governance lifecycle incomplete`, 'Complete Cert #8–12 on Sepolia then mainnet replay', ['registry/ttg-governance-cert-gates.v1.yaml']);
  }

  // ── D06 Fund Lifecycle ──
  const stepResults = [];
  for (const step of fw.fund_lifecycle_flows || []) {
    const issues = validateFundLifecycleStep(step, escrowRelease, escrowV2);
    for (const iss of issues) {
      stepResults.push({ stepId: step.id, ...iss });
      if (iss.severity === 'P0') {
        addBlocker('P0', `PG-P0-FL-${step.id}`, 'D06', `${step.id}: ${iss.note}`, 'Cross-validate caller model in SSOT + source', [step.source_ref]);
      } else if (iss.code === 'FL-CALLER-UNVERIFIED' || iss.code === 'FL-BILATERAL-GAP') {
        addBlocker('P1', `PG-P1-FL-${step.id}`, 'D06', `${step.id}: ${iss.note}`, 'Implement Bilateral Confirmation Settlement Model — see escrow-settlement-authorization audit', [step.source_ref, 'evidence/GO_production_readiness/escrow-settlement-authorization/'].filter(Boolean));
      }
    }
  }
  DIMENSIONS.D06_fund_lifecycle = {
    steps: (fw.fund_lifecycle_flows || []).length,
    unverified: stepResults.filter((s) => s.code === 'FL-CALLER-UNVERIFIED').length,
    escrow_release: escrowRelease,
    escrow_v2_bilateral: escrowV2,
  };

  // ── D07 Business Logic ──
  const dualOk =
    sourceContains('docs/spec/governance-token/fund-flow-ssot.v1.md', ['R3 · Escrow', 'R4 · Fee']) &&
    sourceContains('docs/runbook/WEB3-SYSTEM-MASTER-MAP-V1.md', ['D-4555']);
  DIMENSIONS.D07_business_logic = { dual_track_documented: dualOk };
  if (!dualOk) {
    addBlocker('P1', 'PG-P1-004', 'D07', 'D-4555-A/B SSOT cross-check incomplete', 'Align fund-flow + master map', ['docs/spec/governance-token/fund-flow-ssot.v1.md']);
  }

  // ── D08 Economic Model ──
  const invResults = (fw.economic_model?.supply_invariants || []).map(validateEconomicInvariant);
  const ecoFail = invResults.filter((r) => !r.ok);
  DIMENSIONS.D08_economic_model = { invariants: invResults, arbitrage_open: (fw.economic_model?.arbitrage_checks || []).filter((a) => /REQUIRES/.test(a.status)).length };
  for (const a of fw.economic_model?.arbitrage_checks || []) {
    if (/REQUIRES/.test(a.status)) {
      const ecoEvidence = readJsonSafe(path.join(ROOT, 'evidence/GO_production_readiness/web3-protocol-grade-audit/ECO-ARB-PHASE2-EVIDENCE-LATEST.json'));
      const item = (ecoEvidence?.items || []).find((i) => i.id === a.id);
      if (item?.pass) continue;
      addBlocker('P1', `PG-P1-ECO-${a.id}`, 'D08', `Economic arbitrage path ${a.id} not evidenced`, a.mitigation, ['docs/spec/governance-token/protocol-ssot.v1.yaml']);
    }
  }

  // ── D09 Role State Machine ──
  const roleValidations = [];
  for (const [key, role] of Object.entries(fw.role_state_machines || {})) {
    roleValidations.push(validateRoleStateMachine(key, role, stateMachineDoc));
  }
  const roleMissing = roleValidations.filter((v) => !v.ok && v.missing_states.length);
  DIMENSIONS.D09_role_state_machine = { roles: Object.keys(fw.role_state_machines || {}).length, ssot_missing: roleMissing.length };
  if (roleMissing.length) {
    addBlocker('P2', 'PG-P2-001', 'D09', 'Some steward states not in state-machine.v1.md', 'Sync state-machine SSOT or framework yaml', ['docs/spec/governance-token/state-machine.v1.md']);
  }

  // ── D10 Permission Matrix ──
  const permsOk = exists('registry/admin-rbac-permissions.v1.yaml') && exists('registry/web3-system-master-map.v1.yaml');
  DIMENSIONS.D10_permission_matrix = { registry_present: permsOk, tree_nodes: (fw.permission_tree || []).length };

  // ── Escrow settlement authorization audit ──
  const escRun = runCmd(process.execPath, ['scripts/dev/run-escrow-settlement-authorization-audit.cjs']);
  const escLatest = readJsonSafe(path.join(ROOT, 'evidence/GO_production_readiness/escrow-settlement-authorization/ESCROW-SETTLEMENT-AUTHORIZATION-AUDIT-LATEST.json'));
  DIMENSIONS.escrow_settlement = {
    exit_code: escRun.status,
    verdict: escLatest?.verdict,
    target_model: escLatest?.target_model,
    gaps_p0: escLatest?.summary?.gaps_p0,
  };
  if ((escLatest?.summary?.gaps_p0 ?? 1) > 0) {
    addBlocker('P0', 'PG-P0-ESC', 'D07/D16', 'Escrow Bilateral Settlement Model not aligned — Business Logic Gap', 'See ESCROW-BILATERAL-SETTLEMENT-ARCHITECTURE-PROPOSAL-LATEST.md', ['evidence/GO_production_readiness/escrow-settlement-authorization/']);
  }

  // ── D16 Protocol Intent Verification ──
  const designIntent = fw.design_intent || {};
  const intentResults = [];
  for (const [mod, spec] of Object.entries(designIntent)) {
    for (const [fn, intent] of Object.entries(spec.functions || {})) {
      const st = intent.status || intent.verdict_until_evidence;
      intentResults.push({ module: mod, function: fn, status: st, why: intent.why || intent.why_target });
      if (/GAP|BLOCKED/i.test(String(st))) {
        addBlocker('P1', `PG-P1-INTENT-${mod}-${fn}`.replace(/\W/g, '_'), 'D16', `${mod}.${fn} Design Intent ${st} — ${intent.why_target ? 'target documented' : 'why missing'}`, 'Close Escrow settlement gap or Owner signoff Design Intent PASS', ['registry/web3-protocol-grade-audit-framework.v1.yaml#design_intent']);
      }
    }
  }
  DIMENSIONS.D16_protocol_intent_verification = { entries: intentResults.length, gaps: intentResults.filter((i) => /GAP|BLOCKED/i.test(String(i.status))).length };

  // ── CountryPool deep audit ──
  const cpAudit = fw.country_pool_audit || {};
  const cpUnverified = (cpAudit.flows || []).filter((f) => !f.verified).length;
  DIMENSIONS.country_pool_audit = { flows: (cpAudit.flows || []).length, unverified: cpUnverified, mainnet_blocker: cpAudit.mainnet_blocker };
  if (cpUnverified > 2) {
    addBlocker('P1', 'PG-P1-CP', 'D08/D07', `CountryPool ${cpUnverified} flow steps unverified — largest business complexity`, 'Complete CP-04..06 + GAP-99-03', [cpAudit.gaps_ref].filter(Boolean));
  }

  // ── Primary Market economic (UI DEFER) ──
  const pmAudit = fw.primary_market_economic_audit || {};
  const pmInvOk = (pmAudit.invariants || []).every((inv) => {
    if (inv.id === 'PM-ECO-01') return sourceContains('contracts/src/TtgGovFreezeConstants.sol', ['TTG_TOTAL_SUPPLY_UNITS']);
    if (inv.id === 'PM-ECO-02') return exists('contracts/src/TtgPrimaryMarketV1.sol');
    if (inv.id === 'PM-ECO-03') return exists('contracts/src/TtgSeatConcentrationRegistry.sol');
    return false;
  });
  DIMENSIONS.primary_market_economic = { ui_defer: pmAudit.ui_status, invariants_ok: pmInvOk, status: pmAudit.status };

  // ── D11 Attack Surface ──
  const attackResults = [];
  for (const entry of fw.attack_surface_matrix || []) {
    const src = `contracts/src/${entry.contract}.sol`;
    const alt = entry.contract === 'TimelockUpgradeableProxy' ? 'contracts/src/upgrade/TimelockUpgradeableProxy.sol' : src;
    const rel = exists(alt) ? alt : src;
    const res = validateAttackSurfaceEntry(entry, rel);
    attackResults.push(...res.map((r) => ({ contract: entry.contract, ...r })));
    for (const r of res) {
      if (r.blocked && r.id === 'ASM-ESC-03') {
        addBlocker('P1', 'PG-P1-006', 'D11', 'Escrow unauthorized release — attack surface UNVERIFIED', 'Prove relayer model or restrict caller', [rel]);
      }
    }
  }
  const asmUnverified = attackResults.filter((r) => r.proof_status === 'UNVERIFIED').length;
  DIMENSIONS.D11_attack_surface = { vectors: attackResults.length, unverified: asmUnverified };

  // ── D12 Deployment Drill (extended mainnet full drill) ──
  const drillStats = countDrillStatus(fw.mainnet_full_deployment_drill || fw.deployment_drill || []);
  DIMENSIONS.D12_deployment_drill = drillStats;
  if (drillStats.not_run === drillStats.total) {
    addBlocker('P1', 'PG-P1-007', 'D12', `Mainnet deployment drill not executed (0/${drillStats.total})`, 'Run shadow launch + full drill per TT-MAINNET', ['evidence/mainnet_shadow_launch/']);
  }

  // ── D13 Ops / Monitoring ──
  const opsOk = exists('crates/api/src/chain/indexer.rs') && exists('frontend/app/admin/governance/');
  DIMENSIONS.D13_operations_monitoring = { indexer: exists('crates/api/src/chain/indexer.rs'), admin_governance_ui: exists('frontend/app/admin/governance/') };
  if (!opsOk) {
    addBlocker('P2', 'PG-P2-002', 'D13', 'Ops monitoring paths incomplete', 'Verify indexer + admin governance panels', ['crates/api/src/chain/indexer.rs']);
  }

  // ── D14 Incident / DR ──
  const drOk = exists('docs/runbook/TTG-GOVERNANCE-OPERATIONAL-READINESS-PROGRAM.md');
  DIMENSIONS.D14_incident_dr = { gorp_doc: drOk, cert_dr_pending: certDone < 11 };
  if (certDone < 11) {
    addBlocker('P1', 'PG-P1-008', 'D14', 'DR/GORP Cert evidence incomplete', 'Complete Cert #10–12', ['docs/runbook/TTG-GOVERNANCE-OPERATIONAL-READINESS-PROGRAM.md']);
  }

  // ── D15 Responsibility ──
  const respComplete = (fw.responsibility_matrix || []).every((r) => r.product && r.security && r.contract);
  DIMENSIONS.D15_responsibility_matrix = { modules: (fw.responsibility_matrix || []).length, complete: respComplete };

  // ── Master map parity ──
  let mmVerdict = 'UNKNOWN';
  try {
    const mmRun = runCmd(process.execPath, ['scripts/dev/check-web3-system-master-map-parity.cjs']);
    mmVerdict = mmRun.status === 0 ? 'PASS' : 'FAIL';
  } catch {
    mmVerdict = 'ERROR';
  }
  DIMENSIONS.master_map_parity = mmVerdict;

  // ── Verdict ──
  const p0 = BLOCKERS.filter((b) => b.priority === 'P0').length;
  const p1 = BLOCKERS.filter((b) => b.priority === 'P1').length;
  const p2 = BLOCKERS.filter((b) => b.priority === 'P2').length;
  let verdict = 'WEB3_PROTOCOL_GRADE_PASS';
  if (p0 > 0) verdict = 'WEB3_PROTOCOL_GRADE_BLOCKED';
  else if (p1 > 0) verdict = 'WEB3_PROTOCOL_GRADE_IN_PROGRESS';

  const manifest = {
    schema: 'traveltrust.web3_protocol_grade_audit.v1',
    audit_name: 'Web3 Protocol-Grade Audit (16 Dimensions)',
    recorded_utc: new Date().toISOString(),
    run_dir: path.relative(ROOT, RUN_DIR).replace(/\\/g, '/'),
    audit_principle: fw.audit_principle,
    verdict,
    summary: {
      dimensions: 16,
      blockers_p0: p0,
      blockers_p1: p1,
      blockers_p2: p2,
      fund_lifecycle_steps: (fw.fund_lifecycle_flows || []).length,
      attack_vectors: attackResults.length,
      attack_unverified: asmUnverified,
      deployment_drill_not_run: drillStats.not_run,
    },
    dimensions: DIMENSIONS,
    blockers: BLOCKERS,
    discipline: { business_code_modified: false, audit_only: true },
    references: {
      framework: 'registry/web3-protocol-grade-audit-framework.v1.yaml',
      master_map: 'registry/web3-system-master-map.v1.yaml',
      mainnet_gate: 'registry/web3-mainnet-production-readiness-gate.v1.yaml',
    },
  };

  // ── Write artifacts ──
  const write = (name, content) => {
    fs.writeFileSync(path.join(RUN_DIR, name), content, 'utf8');
    fs.writeFileSync(path.join(EVID_ROOT, name), content, 'utf8');
  };

  write('WEB3-PROTOCOL-GRADE-AUDIT-LATEST.json', `${JSON.stringify(manifest, null, 2)}\n`);
  write('PROTOCOL-GRADE-BLOCKERS-LATEST.md', renderBlockersMd(manifest));
  write('FUND-LIFECYCLE-AUDIT-LATEST.md', renderFundLifecycleMd(fw.fund_lifecycle_flows, escrowRelease, stepResults));
  write('ROLE-STATE-MACHINE-AUDIT-LATEST.md', renderRoleStateMachineMd(fw.role_state_machines, roleValidations));
  write('POOL-LIFECYCLE-AUDIT-LATEST.md', renderPoolLifecycleMd(fw.pool_lifecycles));
  write('ATTACK-SURFACE-MATRIX-LATEST.md', renderAttackSurfaceMd(fw.attack_surface_matrix, attackResults));
  write('PERMISSION-MATRIX-LATEST.md', renderPermissionMd(fw.permission_tree));
  write('UPGRADE-MATRIX-LATEST.md', renderUpgradeMd(fw.upgrade_matrix));
  write('ECONOMIC-MODEL-AUDIT-LATEST.md', renderEconomicMd(fw.economic_model, invResults));
  write('DEPLOYMENT-DRILL-LATEST.md', renderDrillMd(fw.mainnet_full_deployment_drill || fw.deployment_drill, drillStats));
  write('COUNTRY-POOL-AUDIT-LATEST.md', `# CountryPool Audit (D-4555-B)\n\n**Recorded:** ${new Date().toISOString()}\n\n| Step | Contract | Math | Verified |\n|------|----------|------|----------|\n${(fw.country_pool_audit?.flows || []).map((f) => `| ${f.id} | ${f.contract || '—'} | ${f.math || f.step} | ${f.verified ? 'PARTIAL' : 'TARGET'} |`).join('\n')}\n\n**Mainnet blocker:** ${fw.country_pool_audit?.mainnet_blocker || 'GAP-99-03'}\n`);
  write('PRIMARY-MARKET-ECONOMIC-AUDIT-LATEST.md', `# Primary Market Economic Audit (UI DEFER)\n\n**UI:** ${fw.primary_market_economic_audit?.ui_status}\n\n${(fw.primary_market_economic_audit?.flow_graph || []).map((s) => `- ${s}`).join('\n')}\n`);
  write('PROTOCOL-INTENT-VERIFICATION-LATEST.md', `# Protocol Intent Verification (D16)\n\n${intentResults.map((i) => `## ${i.module}.${i.function}\n\n- **Status:** ${i.status}\n- **Why:** ${i.why || '—'}\n`).join('\n')}\n`);
  write('RESPONSIBILITY-MATRIX-LATEST.md', renderResponsibilityMd(fw.responsibility_matrix));
  write('PROTOCOL-LIFECYCLE-AUDIT-LATEST.md', renderProtocolLifecycleMd(fw.protocol_lifecycle, fw.protocol_lifecycle_phases));

  console.log(JSON.stringify({ verdict, p0, p1, p2, evidence: path.relative(ROOT, EVID_ROOT).replace(/\\/g, '/') }, null, 2));
  process.exit(p0 > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
