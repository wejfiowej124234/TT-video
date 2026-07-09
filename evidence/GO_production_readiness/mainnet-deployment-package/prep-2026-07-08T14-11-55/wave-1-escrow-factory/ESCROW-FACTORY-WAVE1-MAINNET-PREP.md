# Escrow Factory · Wave-1 Mainnet PREP

**Status:** PREP — **do not broadcast** until `WEB3_FREEZE_PASS` + Owner authorization  
**Prep stamp:** fill on generate  
**Chain:** Ethereum Mainnet (`chain_id: 1`)

---

## Policy (honest boundary)

| Contract | Mainnet |
|----------|---------|
| `EscrowFactory.sol` / `Escrow.sol` (**V1**) | **FORBIDDEN** — testnet legacy only |
| `EscrowFactoryV2.sol` / `EscrowV2.sol` (**V2**) | **REQUIRED** — Wave 1 deploy target |

SSOT: `registry/escrow-bilateral-mainnet-policy.v1.yaml` · Owner ODR B3

---

## Wave-1 deploy target

| Item | Value |
|------|-------|
| Contract | `EscrowFactoryV2` |
| Script | `contracts/script/DeployEscrowFactoryV2.s.sol` |
| Guardian | `TIMELOCK_ADDRESS` (GovernanceTimelock) |
| Broadcast gate | `scripts/dev/phase3-mainnet-broadcast-escrow-factory-v2.sh` |
| Registry key | `escrow_factory_v2_address` |
| Env keys | `ESCROW_FACTORY_V2_ADDRESS`, `NEXT_PUBLIC_ESCROW_FACTORY_V2_ADDRESS` |

---

## Pre-broadcast checklist (Owner + Engineering)

- [ ] Phase ② Exit Review `PHASE2_EXIT_REVIEW_PASS`
- [ ] Phase ③ Prerequisite Review `PHASE3_DEPLOYMENT_PREREQUISITE_REVIEW_PASS`
- [ ] Web3 Freeze `WEB3_FREEZE_PASS` + bytecode hashes frozen
- [ ] Mainnet Deployment Package `MAINNET_DEPLOYMENT_PACKAGE_GENERATED`
- [ ] R-01 third-party audit PASS on frozen bytecode
- [ ] Shadow Launch GO + G6 no-rollback ack
- [ ] `export TRAVELTRUST_MAINNET_PHASE3_AUTHORIZED=1` (Owner only)
- [ ] Constructor params reviewed (`constructor-parameters.v1.yaml`)
- [ ] Timelock guardian address matches `protocol-convergence-deployments` mainnet block

---

## Deploy params template

Fill after Freeze — copy to package `constructor-parameters.v1.yaml`:

```yaml
wave_1:
  EscrowFactoryV2:
    guardian: "${TIMELOCK_ADDRESS}"  # GovernanceTimelock on mainnet
    chain_id: 1
    usdc_or_settlement_token: "${USDC_ADDRESS_MAINNET}"
    note: "Deploy via forge script — verify on Etherscan after broadcast"
```

---

## Post-broadcast wiring

1. Merge `ESCROW_FACTORY_V2_ADDRESS` into mainnet env + Fly secrets
2. Update `registry/protocol-convergence-deployments.v1.yaml` → `environments.mainnet.addresses`
3. Redeploy API + frontend with `/meta` parity check
4. `node scripts/dev/check-web3-system-master-map-parity.cjs`
5. `node scripts/dev/run-mainnet-wave-validation.cjs --wave=1`

---

## V1 legacy note (NOT a deploy target)

Existing Sepolia V1 factory (`escrow_factory_address`) completes legacy orders only.  
**No new mainnet V1 factory instances.** New mainnet escrows use V2 bilateral model only.
