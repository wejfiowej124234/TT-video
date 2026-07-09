# Mainnet Deployment Execution v1

**Status:** PREP runbook — execute only after Package `MAINNET_DEPLOYMENT_PACKAGE_GENERATED`  
**SSOT after Freeze:** `MANIFEST/manifest.json` inside generated package  
**Rule:** RULE-DEPLOY-001 — no Sepolia param swap

---

## Phase chain (do not skip)

```text
Phase ②-F Exit Review PASS
  → Phase ③ Prerequisite Review PASS
  → Web3 Freeze PASS
  → generate-mainnet-deployment-package.cjs
  → Owner Package review + signoff
  → R-01 audit PASS
  → Shadow Launch GO
  → Wave 1 → validate → Wave 2 → validate → Wave 3 → validate
  → Mainnet Validation → Production GO
```

---

## Step 0 · Open the Package

```bash
# After Freeze
node scripts/dev/generate-mainnet-deployment-package.cjs
bash scripts/gates/check-mainnet-deployment-package-gate.sh
```

Open `evidence/GO_production_readiness/mainnet-deployment-package/package-*/MANIFEST/manifest.json`

---

## Step 1 · Owner + Engineering review

- [ ] Wave matrix (`wave-deployment-matrix.v1.yaml`)
- [ ] Registry snapshot matches Freeze manifest
- [ ] Rollback plan accepted
- [ ] RPC matrix (`rpc-matrix.v1.yaml`) — mainnet RPC only
- [ ] Owner signoff (`owner-signoff/OWNER-SIGNOFF-SIGNED.md`)

---

## Step 2 · Pre-broadcast gates

```bash
bash scripts/gates/check-phase2-exit-review-gate.sh
bash scripts/gates/check-phase3-deployment-prerequisite-review-gate.sh
bash scripts/gates/check-web3-freeze-gate.sh
bash scripts/gates/check-mainnet-deployment-package-gate.sh
bash scripts/gates/check-mainnet-launch-precheck-gate.sh
```

---

## Step 3 · Wave 1 — Core business (EscrowFactoryV2 · FeeRouter · Registry)

```bash
export TRAVELTRUST_MAINNET_PHASE3_AUTHORIZED=1   # Owner only
bash scripts/dev/phase3-mainnet-broadcast-escrow-factory-v2.sh
# Then forge broadcast from package deploy-scripts/ per wave matrix
node scripts/dev/run-mainnet-wave-validation.cjs --wave=1
```

---

## Step 4 · Contract + Explorer verify

See `verify/CONTRACT-VERIFY-PACKAGE.md` and `verify/EXPLORER-VERIFY-PACKAGE.md`

---

## Step 5 · Shadow Launch

Evidence: `evidence/mainnet_shadow_launch/run_<UTC>/`  
Verdict: `shadow_go_no_go.json` → `shadow_launch_verdict: GO`

---

## Step 6 · Wave 2 — Governance stack

Deploy `DeployGovernanceStack.s.sol` from package  
Validate: `run-mainnet-wave-validation.cjs --wave=2`

---

## Step 7 · Wave 3 — Extended modules

Deploy steward pool + country pool scripts  
Validate: `run-mainnet-wave-validation.cjs --wave=3`

---

## Step 8 · Mainnet Validation

Runbook: `docs/runbook/MAINNET-VALIDATION-V1.md`

---

## Abort / rollback

See `rollback/MAINNET-ROLLBACK-PREP-V1.md` and `emergency-recovery/EMERGENCY-RECOVERY-PREP-V1.md`
