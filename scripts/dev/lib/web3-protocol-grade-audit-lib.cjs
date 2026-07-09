/**
 * Protocol-grade audit framework loader + cross-validation helpers.
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '../../..');
const FRAMEWORK_PATH = path.join(ROOT, 'registry/web3-protocol-grade-audit-framework.v1.yaml');

function runPythonYamlToJson(yamlPath) {
  const code = `
import json, yaml
from pathlib import Path
print(json.dumps(yaml.safe_load(Path(${JSON.stringify(yamlPath)}).read_text(encoding='utf-8'))))
`;
  const r = spawnSync('python', ['-c', code], { cwd: ROOT, encoding: 'utf8' });
  if (r.status !== 0) {
    throw new Error(`yaml_load_failed: ${(r.stderr || r.stdout || '').trim()}`);
  }
  return JSON.parse(r.stdout);
}

function loadFramework() {
  if (!fs.existsSync(FRAMEWORK_PATH)) {
    throw new Error(`missing framework: ${FRAMEWORK_PATH}`);
  }
  return runPythonYamlToJson(FRAMEWORK_PATH);
}

function readSafe(rel) {
  try {
    return fs.readFileSync(path.join(ROOT, rel), 'utf8');
  } catch {
    return '';
  }
}

function exists(rel) {
  return fs.existsSync(path.join(ROOT, rel));
}

function sourceContains(rel, patterns) {
  const txt = readSafe(rel);
  return patterns.every((p) => (typeof p === 'string' ? txt.includes(p) : p.test(txt)));
}

function fnHasModifier(sourceRel, fnName, modifiers) {
  const txt = readSafe(sourceRel);
  const fnRx = new RegExp(`function\\s+${fnName}\\s*\\([^)]*\\)[^{]*\\{`, 's');
  const m = txt.match(fnRx);
  if (!m) return { found: false, has: false };
  const head = m[0];
  return { found: true, has: modifiers.some((mod) => head.includes(mod)) };
}

function checkEscrowReleaseCaller() {
  const rel = 'contracts/src/Escrow.sol';
  const txt = readSafe(rel);
  const releaseBlock = txt.match(/function release\(\) external \{[\s\S]*?\n    \}/);
  if (!releaseBlock) return { verified: false, note: 'release() not found' };
  const hasTraveler = /OnlyTraveler|msg\.sender != traveler/.test(releaseBlock[0]);
  const hasGuide = /msg\.sender != guide|OnlyGuide/.test(releaseBlock[0]);
  return {
    verified: true,
    restricted: hasTraveler || hasGuide,
    caller_model: hasTraveler ? 'traveler' : hasGuide ? 'guide' : 'public_anyone',
    note: hasTraveler || hasGuide ? 'caller restricted in source' : 'UNVERIFIED — release() has no caller guard',
  };
}

/** Mainnet path — EscrowV2 bilateral gate (Layer B). Sepolia V1 legacy may remain unrestricted. */
function checkEscrowV2BilateralGate() {
  const rel = 'contracts/src/EscrowV2.sol';
  const txt = readSafe(rel);
  if (!txt) return { verified: false, bilateral_gate: false, path: rel };
  const bilateralGate =
    /travelerServiceConfirmed/.test(txt) &&
    /guideServiceConfirmed/.test(txt) &&
    /ServiceNotComplete/.test(txt) &&
    /function release\(\) external override/.test(txt);
  return {
    verified: true,
    bilateral_gate: bilateralGate,
    path: rel,
    note: bilateralGate
      ? 'EscrowV2 — permissionless release AFTER bilateral service complete'
      : 'EscrowV2 bilateral gate not verified in source',
  };
}

function checkReentrancyPosture(contractRel) {
  const txt = readSafe(contractRel);
  const hasGuard = /ReentrancyGuard|nonReentrant/.test(txt);
  const cei = /status\s*=/.test(txt) && /\.transfer\(/.test(txt);
  return { hasGuard, ceiPattern: cei, posture: hasGuard ? 'guard' : cei ? 'cei_partial' : 'unverified' };
}

function validateFundLifecycleStep(step, escrowRelease, escrowV2) {
  const issues = [];
  if (step.id === 'FL-02') {
    if (escrowV2?.bilateral_gate) {
      return issues;
    }
    const hasAttestation =
      escrowRelease.restricted === false &&
      /service_confirmed|travelerConfirmed|releaseAllowed|CompletionRegistry/i.test(readSafe('contracts/src/Escrow.sol'));
    if (!hasAttestation) {
      issues.push({
        severity: 'P1',
        code: 'FL-BILATERAL-GAP',
        note: 'Bilateral Confirmation Settlement Model not implemented — release() @ Funded without service-complete gate (EscrowV2 missing or incomplete)',
      });
    }
  } else if (Array.isArray(step.caller_allowed)) {
    const unv = step.caller_allowed.some((c) => /UNVERIFIED/i.test(String(c)));
    if (unv) {
      issues.push({ severity: 'P1', code: 'FL-CALLER-UNVERIFIED', note: `${step.id} caller_allowed contains UNVERIFIED` });
    }
  }
  return issues;
}

function validateAttackSurfaceEntry(entry, contractSource) {
  const results = [];
  for (const atk of entry.attacks || []) {
    let proof = 'UNVERIFIED';
    if (entry.contract === 'Escrow') {
      if (atk.id === 'ASM-ESC-02') {
        proof = sourceContains(contractSource, ['status != Status.Funded', 'InvalidState']) ? 'SOURCE' : 'UNVERIFIED';
      }
      if (atk.id === 'ASM-ESC-03') {
        const rel = checkEscrowReleaseCaller();
        const v2 = checkEscrowV2BilateralGate();
        proof = rel.restricted || v2.bilateral_gate ? 'SOURCE' : 'BLOCKED';
      }
      if (atk.id === 'ASM-ESC-04') {
        proof = sourceContains(contractSource, ['onlyFactory', 'AlreadyInitialized']) ? 'SOURCE' : 'UNVERIFIED';
      }
      if (atk.id === 'ASM-ESC-01') {
        const r = checkReentrancyPosture(contractSource);
        proof = r.hasGuard ? 'TEST_OR_GUARD' : r.ceiPattern ? 'CEI_PARTIAL' : 'UNVERIFIED';
      }
    }
    if (entry.contract === 'FeeRouter') {
      if (atk.id === 'ASM-FR-01') {
        proof = sourceContains(contractSource, ['onlyOwner', 'OnlyOwner']) ? 'SOURCE' : 'UNVERIFIED';
      }
    }
    if (entry.contract === 'GovernanceTreasuryP4Cap') {
      if (atk.id === 'ASM-TR-02') {
        proof = sourceContains(contractSource, ['onlySpender']) ? 'SOURCE' : 'UNVERIFIED';
      }
    }
    results.push({ ...atk, proof_status: proof, blocked: proof === 'BLOCKED' || proof === 'UNVERIFIED' });
  }
  return results;
}

function validateRoleStateMachine(roleKey, role, stateMachineDoc) {
  const governanceMachineCodes = new Set([
    'steward_application',
    'steward_seat',
    'steward_exit',
    'country_jurisdiction',
    'country_pool_redemption',
    'country_pool_net_profit_settlement',
  ]);
  if (!governanceMachineCodes.has(role.machine_code)) {
    return {
      role: role.machine_code || roleKey,
      missing_states: [],
      ok: true,
      note: 'non-governance domain — 350 / RBAC / wallet SSOT',
    };
  }
  const missing = [];
  for (const st of role.states || []) {
    if (!st.id) continue;
    if (!stateMachineDoc.includes(st.id)) {
      missing.push(st.id);
    }
  }
  return { role: role.machine_code || roleKey, missing_states: missing, ok: missing.length === 0 };
}

function validateEconomicInvariant(inv) {
  const issues = [];
  if (inv.id === 'ECO-01') {
    const ok =
      sourceContains('contracts/src/TtgGovFreezeConstants.sol', ['TTG_TOTAL_SUPPLY_UNITS = 10_000_000 ether']) &&
      sourceContains('contracts/src/GovernanceVotesToken.sol', ['mint']);
    if (!ok) issues.push('TTG supply cap cross-check fail');
  }
  if (inv.id === 'ECO-02') {
    if (!sourceContains('contracts/src/Escrow.sol', ['guideAmount + travelerRefund + platformFee != totalAmount'])) {
      issues.push('Escrow conservation check missing');
    }
  }
  if (inv.id === 'ECO-03') {
    if (!sourceContains('contracts/src/FeeRouter.sol', ['_bpsCountry = 4500'])) {
      issues.push('FeeRouter default BPS missing');
    }
  }
  return { id: inv.id, ok: issues.length === 0, issues };
}

function countDrillStatus(drill) {
  const notRun = drill.filter((d) => d.status === 'NOT_RUN').length;
  return { total: drill.length, not_run: notRun, pass: drill.length - notRun };
}

module.exports = {
  ROOT,
  FRAMEWORK_PATH,
  loadFramework,
  readSafe,
  exists,
  sourceContains,
  fnHasModifier,
  checkEscrowReleaseCaller,
  checkEscrowV2BilateralGate,
  checkReentrancyPosture,
  validateFundLifecycleStep,
  validateAttackSurfaceEntry,
  validateRoleStateMachine,
  validateEconomicInvariant,
  countDrillStatus,
};
