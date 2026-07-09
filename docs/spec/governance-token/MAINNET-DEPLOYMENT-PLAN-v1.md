# Mainnet Deployment Plan v1 (P3-04)

**Plan ID:** `MAINNET_DEPLOYMENT_PLAN_V1`  
**Entry item:** P3-04  
**Date:** 2026-07-09  
**Gate:** `MAINNET_DEPLOYMENT_PLAN_READY = PASS`  
**Machine SSOT:** [`registry/mainnet-deployment-plan.v1.yaml`](../../../registry/mainnet-deployment-plan.v1.yaml)

---

## Purpose

Establish the **executable, auditable mainnet deployment playbook** — deployment-day order, preconditions, per-step evidence, and rollback boundaries.

**P3-04 is not mainnet deployment.** It produces the release script; execution waits for Owner authorization, security review, Web3 Freeze, and subsequent waves.

```
P3-03 Address Planning   (what · who · governance)
        ↓
P3-04 Deployment Plan    (when · how · evidence)  ← this doc
        ↓
P3-05+ Security · Ops · Broadcast
```

**Do not merge P3-03 and P3-04.** Address registry answers "where and who"; this plan answers "how deployment day runs."

---

## 1 · Deployment preconditions

All must be satisfied **before any mainnet broadcast**:

| Precondition | Status (P3-04) | Notes |
|--------------|----------------|-------|
| P3-01 Baseline FROZEN | ✅ PASS | `registry/phase3-production-entry-baseline.v1.yaml` |
| P3-02 Runtime Evidence | ✅ PASS | `VACANCY_PRODUCTION_ENTRY_RECONCILE` |
| P3-03 Address Planning | ✅ PASS | `MAINNET_ADDRESS_PLANNING_READY` |
| P3-04 Deployment Plan | ✅ PASS | This artifact |
| **Owner Approval** | ⏳ PENDING | `TRAVELTRUST_MAINNET_PHASE3_AUTHORIZED=1` · P3-08 |
| **Security Review** | ⏳ PENDING | P3-05 · R-01 external audit |
| **Final Config Freeze** | ⏳ PENDING | `WEB3_FREEZE_PASS` + generated deployment package |

Additional blockers unchanged: `mainnet_cutover_authorized: false` · `PRODUCTION_SCOPE_MAINNET: NOT_SELECTED`.

---

## 2 · Deployment order

Seven-step execution sequence (maps to [`registry/mainnet-address-registry.v1.yaml`](../../../registry/mainnet-address-registry.v1.yaml) `deployment_sequence`):

| Step | Action | Scripts / pattern |
|------|--------|-------------------|
| **1** | Deploy implementations | `DeployGovFreezeV2CleanBaseline.s.sol` · `DeployFundStackUnderTimelock.s.sol` · `DeployEscrowFactoryV2.s.sol` |
| **2** | Deploy proxies | `TimelockUpgradeableProxy` per G24 posture |
| **3** | Initialize proxy storage | `initializeProxyStorage` · params from `protocol-ssot.v1.yaml` |
| **4** | Configure roles | Treasury · Governor · Timelock · FeeRouter · EscrowFactoryV2 guardian |
| **5** | Transfer ownership | Proxy admin + contract owners → `GovernanceTimelock` |
| **6** | Verify contracts | Etherscan · bytecode hashes · `cast admin/implementation` |
| **7** | Enable production | Registry fill · env · API `/meta` · indexer · frontend |

Post-Freeze execution also follows [`docs/runbook/templates/mainnet-package/runbook/MAINNET-DEPLOYMENT-EXECUTION-V1.md`](../../../docs/runbook/templates/mainnet-package/runbook/MAINNET-DEPLOYMENT-EXECUTION-V1.md) wave matrix.

---

## 3 · Evidence chain

Each deployment action produces an artifact and passes a step gate:

```
Deployment Action
        ↓
Evidence Artifact
        ↓
Step Gate
```

| Step | Action | Evidence artifact | Gate ID |
|------|--------|-------------------|---------|
| 1 | Broadcast implementations | tx hashes · `broadcast/run-latest.json` · forge log | `STEP_01_IMPLEMENTATIONS_EVIDENCE` |
| 2 | Broadcast proxies | tx hashes · proxy manifest | `STEP_02_PROXIES_EVIDENCE` |
| 3 | Initialize | init event logs · storage snapshot | `STEP_03_INIT_EVIDENCE` |
| 4 | Configure | role snapshot JSON · `cast call` bundle | `STEP_04_CONFIGURE_EVIDENCE` |
| 5 | Transfer ownership | owner/admin `cast` proof | `STEP_05_OWNERSHIP_EVIDENCE` |
| 6 | Verify | explorer receipts · bytecode diff | `STEP_06_VERIFY_EVIDENCE` |
| 7 | Enable | production enable record · `/meta` parity | `STEP_07_ENABLE_EVIDENCE` |

**Evidence root:** `evidence/mainnet_deploy/step-NN-*/`

**P3-04 dry-run (no broadcast):**

```bash
node scripts/dev/run-mainnet-deployment-plan-dry-run.cjs
```

---

## 4 · Rollback plan

**Honest boundary:** on-chain deployments cannot be rolled back like a database.

| Phase | When | Allowed response | Forbidden |
|-------|------|------------------|-----------|
| **Before ownership transfer** | Deploy/init/config failure | Abort sequence · do not publish addresses · document abandoned deploys | Claim production ready |
| **After proxy · before governance transfer** | Verify/role mismatch | Disable activation · no API `/meta` · no indexer on new addresses | Arbitrary state revert |
| **After governance transfer** | Post-enable critical bug | Emergency pause via Timelock · `FeeRouter.setDistributePaused` · disable new escrow routes | Undo ownership / proxy admin |

Template: [`MAINNET-ROLLBACK-PREP-V1.md`](../../../docs/runbook/templates/mainnet-package/rollback/MAINNET-ROLLBACK-PREP-V1.md)

---

## 5 · ABI-002 · Escrow V2 preparation status

| Field | Value |
|-------|-------|
| Previous | `FUTURE_MAINNET_REQUIRED` |
| **P3-04 status** | **`DEPLOYMENT_PREPARATION_READY`** |
| **Not** | `MAINNET_READY` · `DEPLOYED` · `VERIFIED` · `ACTIVE` |

**Preparation artifacts (ready):**

| Artifact | Path |
|----------|------|
| Source | `contracts/src/EscrowV2.sol` |
| ABI | `contracts/abi/EscrowV2.json` |
| Factory ABI | `contracts/abi/EscrowFactoryV2.json` |
| Deploy script | `contracts/script/DeployEscrowFactoryV2.s.sol` |
| Forge test | `contracts/test/EscrowV2.t.sol` |

Having ABI + script **≠** deployed · verified · production-enabled. Mainnet address remains **TBD** in address registry.

Policy: [`registry/escrow-bilateral-mainnet-policy.v1.yaml`](../../../registry/escrow-bilateral-mainnet-policy.v1.yaml)

---

## 6 · P3-04 scope

| Allowed | Forbidden |
|---------|-----------|
| Documentation · registry · gate | Mainnet broadcast |
| Script skeleton · dry-run simulation | Real deployment |
| ABI export (`EscrowV2.json`) | Fund transfer |
| | Production multisig operations |

---

## 7 · P3-04 exit criteria

P3-04 is **COMPLETE** when:

1. This doc + `registry/mainnet-deployment-plan.v1.yaml` exist and cross-reference P3-03.
2. Preconditions · 7-step order · evidence chain · rollback plan documented.
3. ABI-002 = `DEPLOYMENT_PREPARATION_READY` (not `MAINNET_READY`).
4. `bash scripts/gates/check-mainnet-deployment-plan-gate.sh` → `MAINNET_DEPLOYMENT_PLAN_READY: PASS`.
5. Dry-run evidence: `P3-04-DRY-RUN.json`.

**Next:** P3-05 Security review refresh.

---

## Related

- P3-03: [`MAINNET-ADDRESS-PLANNING-v1.md`](./MAINNET-ADDRESS-PLANNING-v1.md)
- Address registry: [`registry/mainnet-address-registry.v1.yaml`](../../../registry/mainnet-address-registry.v1.yaml)
- Post-freeze package: [`registry/mainnet-deployment-package.v1.yaml`](../../../registry/mainnet-deployment-package.v1.yaml)
- Closeout: [`evidence/phase3-production-entry-baseline/P3-04-DEPLOYMENT-PLAN-CLOSEOUT.md`](./evidence/phase3-production-entry-baseline/P3-04-DEPLOYMENT-PLAN-CLOSEOUT.md)
