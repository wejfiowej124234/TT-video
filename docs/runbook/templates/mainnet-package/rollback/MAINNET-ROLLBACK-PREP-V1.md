# Mainnet Rollback PREP v1

**Status:** PREP — on-chain state is NOT reversible; pause / governance / reconcile only  
**Generated with:** Mainnet Deployment Package (post-Freeze)

---

## Honest boundary (G6)

Contract deployments on mainnet **cannot be rolled back**. This plan covers:

- Halt next wave
- Pause new user-facing flows
- Timelock-governed recovery
- Registry / env revert to last known-good
- Compensation / reconcile per ops policy

---

## Wave 1 abort — EscrowFactoryV2 · FeeRouter · Registry

**Trigger:** Shadow Launch P0 · verify failure · `/meta` parity fail · critical escrow bug

1. **Do not** start Wave 2
2. If Timelock + Governor live: emergency pause via Cert #10 path
3. API: disable new escrow creation routes pointing at failed factory address
4. Frontend: hide createEscrow CTA; show maintenance banner
5. Registry: revert `escrow_factory_v2_address` env slot (document in evidence)
6. Evidence: snapshot pre-wave registry from `registry-snapshot/`

---

## Wave 2 abort — Governance stack

**Trigger:** Timelock delay wrong · governor miswired · treasury access anomaly

1. Halt Wave 3
2. Do **not** force execute through Timelock
3. Engage GORP / DR replay per Cert #11–#12 runbooks
4. Owner + multisig review before any unpause

---

## Wave 3 abort — Extended modules

**Trigger:** Steward pool · country pool · primary market regression

1. Disable API routes to new pool addresses
2. Steward unstake: follow cert unstake runbook if funds at risk
3. Document residual on-chain state — cannot delete contracts

---

## Shadow Launch abort

If `shadow_go_no_go.json` → `NO_GO`:

- Stop all waves
- Root-cause in `evidence/mainnet_shadow_launch/run_<UTC>/`
- Re-enter Phase ③ validation — **no param swap retry**

---

## Evidence

| Item | Path |
|------|------|
| Rollback decision log | `evidence/mainnet_deploy/rollback/ROLLBACK-DECISION-<UTC>.md` |
| Pre-wave registry | `package-*/registry-snapshot/` |
| Owner abort signoff | `owner-signoff/ROLLBACK-OWNER-ACK-<UTC>.md` |

---

## Related

- `docs/runbook/TT-MAINNET-LAUNCH-PRECHECK-AFTER-B435-001.md` §6 G6
- Cert #10 emergency pause · Cert #11 DR drill
