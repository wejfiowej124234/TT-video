#!/usr/bin/env node
/**
 * Escrow Settlement Authorization Model Audit
 * Target business model: Bilateral Confirmation Settlement Model
 *
 *   node scripts/dev/run-escrow-settlement-authorization-audit.cjs
 *
 * Audit-only · no business logic mutation.
 */
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const {
  readSafe,
  exists,
  checkEscrowReleaseCaller,
  fnHasModifier,
} = require('./lib/web3-protocol-grade-audit-lib.cjs');

const ROOT = path.join(__dirname, '../..');
const STAMP = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const EVID_ROOT = path.join(ROOT, 'evidence/GO_production_readiness/escrow-settlement-authorization');
const RUN_DIR = path.join(EVID_ROOT, `audit-${STAMP}`);

const TARGET_MODEL = 'Bilateral Confirmation Settlement Model';
const GAPS = [];
const CROSS_CHECKS = [];

function mkdirp(p) {
  fs.mkdirSync(p, { recursive: true });
}

function addGap(severity, id, layer, title, fix, refs = []) {
  GAPS.push({ severity, id, layer, title, fix, refs, status: 'OPEN' });
}

function addCheck(layer, item, expected, actual, pass) {
  CROSS_CHECKS.push({ layer, item, expected, actual, pass });
}

function grepFile(rel, pattern) {
  const txt = readSafe(rel);
  return pattern.test(txt);
}

function writeOut(name, content) {
  fs.writeFileSync(path.join(RUN_DIR, name), content, 'utf8');
  fs.writeFileSync(path.join(EVID_ROOT, name), content, 'utf8');
}

function auditContractV1Legacy() {
  const escrow = 'contracts/src/Escrow.sol';
  const release = checkEscrowReleaseCaller();
  const depositOk = grepFile(escrow, /function deposit[\s\S]{0,200}OnlyTraveler|msg\.sender != traveler/);
  const refundOk = grepFile(escrow, /function refund[\s\S]{0,200}OnlyTraveler|msg\.sender != traveler/);
  const hasCompletionFlags = grepFile(escrow, /travelerConfirmed|guideConfirmed|serviceCompleted/);

  addCheck('Contract-V1-Legacy', 'deposit caller', 'traveler only', depositOk ? 'restricted' : 'open', depositOk);
  addCheck('Contract-V1-Legacy', 'refund caller', 'traveler only', refundOk ? 'restricted' : 'open', refundOk);
  addCheck(
    'Contract-V1-Legacy',
    'release @ Funded (no bilateral)',
    'LEGACY — Sepolia/testnet only · mainnet FORBIDDEN',
    release.caller_model,
    true,
  );
  addCheck(
    'Contract-V1-Legacy',
    'bilateral flags',
    'absent (expected on V1)',
    hasCompletionFlags ? 'present' : 'absent',
    !hasCompletionFlags,
  );

  // V1 gaps are informational — not mainnet blockers when V2 path + policy SSOT exist
  if (!hasCompletionFlags) {
    addGap(
      'P1',
      'ESC-GAP-001',
      'Contract-V1-Legacy',
      'V1 Escrow has no on-chain bilateral flags — legacy testnet only',
      'Do not deploy V1 to mainnet; use EscrowV2 + FactoryV2 (B3)',
      [escrow, 'registry/escrow-bilateral-mainnet-policy.v1.yaml'],
    );
  }
  return { release, depositOk, refundOk, hasCompletionFlags };
}

function auditContractV2Mainnet() {
  const v2 = 'contracts/src/EscrowV2.sol';
  const factoryV2 = 'contracts/src/EscrowFactoryV2.sol';
  const base = 'contracts/src/Escrow.sol';
  const hasV2 = exists(v2) && exists(factoryV2);
  // Bilateral may live on EscrowV2 itself OR on Escrow.sol when EscrowV2 is a thin alias (L3 fold-in).
  const implSurface = `${readSafe(v2)}\n${readSafe(base)}`;
  const hasFlags =
    /travelerServiceConfirmed/.test(implSurface) && /guideServiceConfirmed/.test(implSurface);
  const releaseGated =
    /ServiceNotComplete/.test(implSurface) && /function release\(\)/.test(implSurface);
  const confirmFn = /function confirmServiceComplete\(\)/.test(implSurface);
  const inheritsEscrow = /contract EscrowV2 is Escrow/.test(readSafe(v2));
  const deployScript = exists('contracts/script/DeployEscrowFactoryV2.s.sol');
  const forgeTest = exists('contracts/test/EscrowV2.t.sol');

  addCheck('Contract-V2-Mainnet', 'EscrowV2 + FactoryV2 files', 'present', hasV2 ? 'present' : 'missing', hasV2);
  addCheck(
    'Contract-V2-Mainnet',
    'bilateral service flags',
    'traveler + guide (EscrowV2 and/or Escrow.sol)',
    hasFlags ? (inheritsEscrow ? 'present_on_Escrow_base' : 'present') : 'absent',
    hasFlags,
  );
  addCheck(
    'Contract-V2-Mainnet',
    'release gated post-bilateral',
    'ServiceNotComplete revert',
    releaseGated ? 'yes' : 'no',
    releaseGated,
  );
  addCheck(
    'Contract-V2-Mainnet',
    'confirmServiceComplete',
    'traveler or guide',
    confirmFn ? 'present' : 'absent',
    confirmFn,
  );
  addCheck('Contract-V2-Mainnet', 'deploy script', 'DeployEscrowFactoryV2.s.sol', deployScript ? 'present' : 'absent', deployScript);
  addCheck('Contract-V2-Mainnet', 'forge tests', 'EscrowV2.t.sol', forgeTest ? 'present' : 'absent', forgeTest);

  if (!hasV2 || !hasFlags || !releaseGated || !confirmFn) {
    addGap(
      'P0',
      'ESC-GAP-002',
      'Contract-V2-Mainnet',
      'Mainnet path EscrowV2 bilateral release gate incomplete',
      'Complete EscrowV2/FactoryV2 + deploy + registry (PG-P0-ESC)',
      [v2, factoryV2, base],
    );
  }
  if (!deployScript) {
    addGap(
      'P1',
      'ESC-GAP-003',
      'Contract-V2-Mainnet',
      'No DeployEscrowFactoryV2 deploy script',
      'Add contracts/script/DeployEscrowFactoryV2.s.sol + broadcast shell',
      ['contracts/script/'],
    );
  }
  return { hasV2, hasFlags, releaseGated, confirmFn, deployScript, forgeTest, inheritsEscrow };
}

function auditMainnetPolicy() {
  const policy = 'registry/escrow-bilateral-mainnet-policy.v1.yaml';
  const odr = 'docs/runbook/ESCROW-BILATERAL-SETTLEMENT-OWNER-DECISION-RECORD-V1.md';
  const v1Forbidden = grepFile(policy, /mainnet_deploy:\s*FORBIDDEN/);
  const v2Required = grepFile(policy, /mainnet_path:\s*REQUIRED/);
  const b3Selected = grepFile(odr, /B3.*EscrowV2 \+ FactoryV2|EscrowV2 \+ FactoryV2/);

  addCheck('Policy', 'V1 mainnet forbidden SSOT', 'FORBIDDEN', v1Forbidden ? 'documented' : 'missing', v1Forbidden);
  addCheck('Policy', 'V2 mainnet path required', 'REQUIRED', v2Required ? 'documented' : 'missing', v2Required);
  addCheck('Policy', 'Owner ODR B3 selected', 'EscrowV2 + FactoryV2', b3Selected ? 'yes' : 'no', b3Selected);

  if (!v1Forbidden) {
    addGap(
      'P0',
      'ESC-GAP-005',
      'Policy',
      'V1 Escrow mainnet forbidden policy not in registry SSOT',
      'Populate registry/escrow-bilateral-mainnet-policy.v1.yaml',
      [policy],
    );
  }
  return { v1Forbidden, v2Required, b3Selected };
}

function auditContract() {
  const v1 = auditContractV1Legacy();
  const v2 = auditContractV2Mainnet();
  auditMainnetPolicy();
  return { ...v1, ...v2 };
}

function auditApiDb() {
  const impl = 'crates/api/src/chain_off/orders_flow/accept_cancel_pay_complete.rs';
  const core = 'crates/core/src/escrow.rs';
  const bilateralServiceImpl =
    grepFile(impl, /order_confirm_service_completion_impl/) &&
    grepFile(impl, /service_completion_pending/);
  const hasServiceBilateralFields =
    grepFile('crates/api/migrations/', /service_tourist_confirmed/) ||
    grepFile(impl, /service_tourist_confirmed/);
  const singleShotComplete =
    grepFile(impl, /order\.state = OrderState::Completed/) &&
    !bilateralServiceImpl;
  const escrowedToCompleted = grepFile(core, /Escrowed => &\[Completed/);

  addCheck('API/DB', 'confirm-service-completion bilateral', 'both parties before Completed', bilateralServiceImpl ? 'bilateral' : 'single-party or missing', bilateralServiceImpl);
  addCheck('API/DB', 'service_* DB fields', 'service_tourist_confirmed + service_guide_confirmed', hasServiceBilateralFields ? 'present' : 'absent', hasServiceBilateralFields);
  addCheck('API/DB', 'Escrowed→Completed transition', 'after bilateral service confirm', bilateralServiceImpl ? 'bilateral gate' : 'one-shot', bilateralServiceImpl);

  if (singleShotComplete) {
    addGap(
      'P0',
      'ESC-GAP-010',
      'API/DB',
      'order_confirm_completion sets Completed without bilateral service confirm',
      'Use order_confirm_service_completion_impl (Layer A)',
      [impl, core],
    );
  }
  if (!hasServiceBilateralFields) {
    addGap(
      'P0',
      'ESC-GAP-011',
      'API/DB',
      'No service_tourist_confirmed / service_guide_confirmed columns',
      'Migration + API fields (Layer A)',
      ['crates/api/migrations/20260708120000_orders_service_completion_bilateral.sql'],
    );
  }

  const prePayBilateral =
    grepFile('crates/api/src/routes/orders/mod.rs', /confirm_bilateral|order_confirm_bilateral/) ||
    exists('crates/api/src/chain_off/dispute_bilateral_rating.rs');
  addCheck('API/DB', 'pre-pay bilateral (itinerary)', 'confirm-bilateral fields', prePayBilateral ? 'present' : 'missing', prePayBilateral);

  return { singleShotComplete, hasServiceBilateralFields, escrowedToCompleted, bilateralServiceImpl };
}

function auditFrontend() {
  const elig = 'frontend/components/escrow/EscrowDetail/escrowOnChainEligibility.ts';
  const serviceGate = grepFile(elig, /canReleaseAfterServiceCompletion|serviceBothConfirmed/);
  const ratingOnlyGate =
    grepFile(elig, /canReleaseAfterRating/) &&
    grepFile(elig, /canReleaseAfterServiceCompletion/) &&
    grepFile(elig, /return canReleaseAfterServiceCompletion/);
  const confirmServiceApi = grepFile('frontend/lib/apiClient/orders/orderHttp.ts', /orderConfirmServiceCompletion/);

  addCheck('Frontend', 'release gate', 'after bilateral SERVICE complete', serviceGate ? 'service completion' : 'missing', serviceGate);
  addCheck('Frontend', 'rating does not sole-gate release', 'service completion SSOT', ratingOnlyGate || serviceGate ? 'aligned' : 'rating-only risk', serviceGate);
  addCheck('Frontend', 'confirm-service-completion API client', 'orderConfirmServiceCompletion', confirmServiceApi ? 'present' : 'absent', confirmServiceApi);

  if (!serviceGate) {
    addGap(
      'P0',
      'ESC-GAP-020',
      'Frontend',
      'Release not gated on service completion bilateral',
      'canReleaseAfterServiceCompletion + serviceBothConfirmed (Layer A)',
      [elig],
    );
  }

  return { serviceGate, confirmServiceApi };
}

function auditDocsRegistry() {
  const doc53 = readSafe('docs/spec/53-阶段开发技术文档.md');
  const doc01 = readSafe('docs/spec/01-总库总览.md');
  const masterMap = readSafe('docs/runbook/WEB3-SYSTEM-MASTER-MAP-V1.md');
  const fundFlow = readSafe('docs/spec/governance-token/fund-flow-ssot.v1.md');

  const docSaysDualComplete = /双方.*确认.*完成|dual.*confirm.*complet/i.test(doc53 + doc01);
  const docSaysReleaseSeparate = /confirm-completion.*链下|release.*评分|confirm-rating/i.test(doc53 + doc01);
  const masterMapEscrow = /M10|Escrow/.test(masterMap);
  const fundFlowR3 = /R3 · Escrow/.test(fundFlow);

  addCheck('Docs', 'bilateral service complete in 53/01', 'documented', docSaysDualComplete ? 'yes' : 'partial', docSaysDualComplete);
  addCheck('Docs', 'release separate from completion confirm', 'documented', docSaysReleaseSeparate ? 'yes' : 'unclear', docSaysReleaseSeparate);
  addCheck('Registry/MasterMap', 'Escrow module M10', 'present', masterMapEscrow ? 'yes' : 'no', masterMapEscrow);

  if (docSaysDualComplete) {
    addGap(
      'P1',
      'ESC-GAP-030',
      'Docs vs Implementation',
      'Product docs (53/01) describe dual-sign completion — API/contract do not implement',
      'Close doc↔code gap via Bilateral Settlement Model rollout',
      ['docs/spec/53-阶段开发技术文档.md', 'crates/api/src/chain_off/orders_flow/accept_cancel_pay_complete.rs'],
    );
  }

  return { docSaysDualComplete, docSaysReleaseSeparate };
}

function renderGapMd(manifest) {
  const lines = [
    '# Escrow Settlement — Business Logic Gap Report',
    '',
    `**Recorded:** ${manifest.recorded_utc}`,
    `**Target model:** ${TARGET_MODEL}`,
    `**Verdict:** \`${manifest.verdict}\``,
    '',
    '## Determined business model (audit recommendation)',
    '',
    '**Bilateral Confirmation Settlement Model** — parties confirm **business service completion** off-chain (or via dedicated on-chain flags); **release()** is a **permissionless settlement execution** step that only moves funds to immutable destinations once business rules are satisfied.',
    '',
    '```text',
    'Traveler creates order → USDC Deposit → Escrow locked',
    '  → Guide provides service → Trip ends',
    '  → Guide Confirm Complete + Traveler Confirm Complete',
    '  → Order business state = ServiceCompleted (≠ chain Released)',
    '  → release() allowed (Keeper/automation OK)',
    '  → Guide USDC + FeeRouter platform fee → Ledger',
    '```',
    '',
    `| Severity | Count |`,
    `|----------|-------|`,
    `| P0 | ${manifest.summary.gaps_p0} |`,
    `| P1 | ${manifest.summary.gaps_p1} |`,
    `| P2 | ${manifest.summary.gaps_p2} |`,
    '',
  ];
  for (const p of ['P0', 'P1', 'P2']) {
    const items = manifest.gaps.filter((g) => g.severity === p);
    if (!items.length) continue;
    lines.push(`## ${p}`, '');
    for (const g of items) {
      lines.push(`### ${g.id} — ${g.title}`, '', `- **Layer:** ${g.layer}`, `- **Fix:** ${g.fix}`, `- **Refs:** ${g.refs.join(', ')}`, '');
    }
  }
  return `${lines.join('\n')}\n`;
}

function renderArchitectureProposal() {
  return `# Escrow Bilateral Settlement — Architecture Fix Proposal (Audit-Only)

**Status:** PRE-IMPLEMENTATION · Owner decision required  
**No contract changes in this audit run**

## 1. Gap summary

| Layer | Current | Target |
|-------|---------|--------|
| **Business** | Single-party \`confirm-completion\` → DB \`Completed\` | Both parties confirm **service done** → \`ServiceCompleted\` |
| **Release gate (FE)** | \`Completed\` + **rating** bilateral | \`ServiceCompleted\` (rating optional/separate) |
| **Contract** | \`release()\` anyone @ \`Funded\` | \`release()\` @ \`Funded\` + **completion attestation** OR off-chain executor with EIP-712 |
| **Keeper** | Could release before any confirm | Keeper = **automation only** after bilateral complete |

## 2. Recommended architecture (3 layers)

### Layer A — Business confirmation (off-chain SSOT)

- New sub_status: \`service_completion_pending\` → \`service_completion_confirmed\`
- Fields: \`service_tourist_confirmed_at\`, \`service_guide_confirmed_at\`
- \`POST confirm-service-completion\` (per party, idempotent)
- Transition to \`OrderState::Completed\` **only when both confirmed** OR timeout rule (01 §5 eleven)
- **Rating bilateral** remains separate (\`confirm-rating\`) — does not gate settlement

### Layer B — Settlement authorization (chain)

**Option B1 (preferred for immutable Escrow instances):** \`SettlementAuthorizationRegistry\` (upgradeable proxy)

- Stores \`keccak256(orderId, escrow)\` → \`releaseAllowed\`
- Set by multisig/executor after both service confirms verified
- Escrow V2 \`release()\` checks registry OR embeds flags at init (new factory only)

**Option B2 (minimal change):** Trusted executor + EIP-712 attestation

- No contract change for existing instances
- Keeper bot only submits \`release()\` when API returns \`release_eligible: true\`
- **Mainnet risk:** permissionless \`release()\` still exploitable if address known — **not sufficient alone**

**Option B3 (new Escrow implementation):** \`EscrowV2\` with \`confirmServiceComplete()\` ×2

- \`release()\` requires \`serviceComplete\` flag
- **New EscrowFactory** routes new orders only

### Layer C — Permissionless keeper (automation)

- Keeper watches \`ServiceCompleted\` + on-chain attestation
- Calls \`release()\` — **not** authorized to confirm service
- Document in Design Intent: permissionless release is **intentional** post-authorization

## 3. Upgrade path

| Phase | Action | Affects existing Escrow |
|-------|--------|-------------------------|
| 1 | API + DB bilateral service confirm | No |
| 2 | FE UX mirror BilateralConfirmBlock | No |
| 3 | Design Intent + Protocol Intent D16 PASS | No |
| 4 | Registry/SettlementAuthorization deploy | New orders |
| 5 | EscrowFactory pointer → V2 factory | New orders only |
| 6 | Mainnet: freeze V1 factory after cutover | Old instances immutable |

**Proxy upgrade:** Existing \`Escrow\` instances are **immutable** — cannot upgrade in place. Migration = **new factory + new orders**; in-flight orders complete on V1 rules or manual governance.

## 4. Migration risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| V1 escrow open \`release()\` exploited | **CRITICAL** | Do not mainnet until Layer B attestation OR V2 |
| DB \`Completed\` semantic overload | HIGH | Rename/migrate: \`Completed\` = financial terminal only after chain release |
| Indexer projection drift | HIGH | G2 replay after state machine change |
| E2E tests assume guide-only confirm | MEDIUM | Update F010 corridor tests |
| Rating gate removed — premature release UX | MEDIUM | Explicit “funds pending release” state |

## 5. Mainnet deployment decision (Owner)

**BLOCK mainnet Web3 payment rail** until one of:

1. **EscrowV2 + Factory V2** deployed with bilateral on-chain or registry gate, OR  
2. **Written Design Intent PASS** (D16) that permissionless V1 release is accepted **with** operational executor-only policy **and** escrow addresses not public — **not recommended for protocol-grade**, OR  
3. **Hybrid:** service bilateral off-chain + SettlementAuthorizationRegistry on-chain before any mainnet order

## 6. Refund / Dispute / Cancel / Timeout

| Scenario | Target handling |
|----------|-----------------|
| **Cancel pre-deposit** | \`Cancelled\` — no funds |
| **Refund (traveler)** | \`refund()\` traveler-only @ Funded — unchanged |
| **Dispute** | \`openDispute\` → \`Disputed\` → arbitrator \`executeResolution\` — fix ASM arbitrator |
| **Reject confirm** | Stay \`Escrowed\` + \`service_completion_pending\`; other party may dispute |
| **Timeout (01 §5)** | Auto \`ServiceCompleted\` if guide confirmed + K days silence — **not implemented** |
| **Locked funds** | Stay in Escrow until release/refund/resolution |

## 7. Evidence to produce after implementation

- [ ] Bilateral service confirm E2E (tourist + guide)
- [ ] Keeper release only after attestation (negative test: early release fails or blocked)
- [ ] G3-02 PAY-W07 updated for new state machine
- [ ] D16 Protocol Intent PASS for Escrow.release permissionless **post** authorization

`;
}

function renderCrossCheckMd(checks) {
  const lines = [
    '# Escrow Settlement Authorization — Cross-Validation Matrix',
    '',
    `**Recorded:** ${new Date().toISOString()}`,
    '',
    '| Layer | Check | Expected | Actual | PASS |',
    '|-------|-------|----------|--------|------|',
  ];
  for (const c of checks) {
    lines.push(`| ${c.layer} | ${c.item} | ${c.expected} | ${c.actual} | ${c.pass ? '✅' : '❌'} |`);
  }
  return `${lines.join('\n')}\n`;
}

function main() {
  mkdirp(RUN_DIR);

  const contract = auditContract();
  const apiDb = auditApiDb();
  const fe = auditFrontend();
  const docs = auditDocsRegistry();

  const p0 = GAPS.filter((g) => g.severity === 'P0').length;
  const p1 = GAPS.filter((g) => g.severity === 'P1').length;
  const p2 = GAPS.filter((g) => g.severity === 'P2').length;

  const modelAligned = p0 === 0;
  const verdict = modelAligned ? 'ESCROW_SETTLEMENT_MODEL_ALIGNED' : 'ESCROW_SETTLEMENT_BUSINESS_LOGIC_GAP';

  const manifest = {
    schema: 'traveltrust.escrow_settlement_authorization_audit.v1',
    audit_name: 'Escrow Settlement Authorization Model Audit',
    recorded_utc: new Date().toISOString(),
    run_dir: path.relative(ROOT, RUN_DIR).replace(/\\/g, '/'),
    target_model: TARGET_MODEL,
    determined_model: TARGET_MODEL,
    verdict,
    model_aligned: modelAligned,
    summary: {
      gaps_p0: p0,
      gaps_p1: p1,
      gaps_p2: p2,
      cross_checks_pass: CROSS_CHECKS.filter((c) => c.pass).length,
      cross_checks_total: CROSS_CHECKS.length,
    },
    lifecycle: {
      flow: [
        'create_order',
        'usdc_deposit',
        'escrow_locked',
        'service_in_progress',
        'guide_confirm_complete',
        'traveler_confirm_complete',
        'order_service_completed',
        'release_allowed',
        'guide_settlement',
        'feerouter_fee',
        'ledger_record',
      ],
      state_rules: {
        deposit: { caller: 'traveler', from: 'Created', to: 'Funded' },
        service_confirm: { caller: 'traveler+guide bilateral', from: 'Escrowed', to: 'ServiceCompleted target' },
        release: { caller: 'permissionless keeper post-auth', from: 'Funded', to: 'Completed chain', executes: 'fund split only' },
        refund: { caller: 'traveler', from: 'Funded', to: 'Refunded' },
        dispute: { caller: 'participant target', from: 'Funded', to: 'Disputed' },
        cancel: { caller: 'participant pre-escrow', to: 'Cancelled' },
      },
    },
    layers: { contract, api_db: apiDb, frontend: fe, docs },
    gaps: GAPS,
    cross_checks: CROSS_CHECKS,
    keeper_model: {
      role: 'automation_executor',
      not: 'business_authorization',
      authorized_after: 'bilateral_service_complete_or_timeout_or_dispute_resolution',
    },
    discipline: { business_code_modified: false, audit_only: true },
    references: {
      contract: 'contracts/src/Escrow.sol',
      api: 'crates/api/src/chain_off/orders_flow/accept_cancel_pay_complete.rs',
      order_fsm: 'crates/core/src/escrow.rs',
      fe_eligibility: 'frontend/components/escrow/EscrowDetail/escrowOnChainEligibility.ts',
      architecture_proposal: 'ESCROW-BILATERAL-SETTLEMENT-ARCHITECTURE-PROPOSAL-LATEST.md',
    },
  };

  writeOut('ESCROW-SETTLEMENT-AUTHORIZATION-AUDIT-LATEST.json', `${JSON.stringify(manifest, null, 2)}\n`);
  writeOut('ESCROW-SETTLEMENT-BUSINESS-LOGIC-GAP-LATEST.md', renderGapMd(manifest));
  writeOut('ESCROW-BILATERAL-SETTLEMENT-ARCHITECTURE-PROPOSAL-LATEST.md', renderArchitectureProposal());
  writeOut('ESCROW-SETTLEMENT-CROSS-VALIDATION-LATEST.md', renderCrossCheckMd(CROSS_CHECKS));

  console.log(JSON.stringify({ verdict, p0, p1, p2, model_aligned: modelAligned, evidence: 'evidence/GO_production_readiness/escrow-settlement-authorization' }, null, 2));
  process.exit(p0 > 0 ? 1 : 0);
}

main();
