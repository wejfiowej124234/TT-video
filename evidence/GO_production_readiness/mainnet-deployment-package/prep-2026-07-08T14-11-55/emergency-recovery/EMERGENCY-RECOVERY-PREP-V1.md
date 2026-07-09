# Emergency Recovery PREP v1 — Mainnet

**Status:** PREP — operational recovery without on-chain rollback  
**Aligns with:** REVIEW-09 Disaster Recovery · Cert #10–#12 · GORP

---

## Trigger matrix (summary)

| Trigger | First action | Runbook ref |
|---------|--------------|-------------|
| RPC down / degraded | Failover RPC · pause chain writes | TT-MAINNET §2 |
| Indexer panic / lag | Stop indexer-tick · replay from checkpoint | `crates/api/src/chain/indexer.rs` |
| API crash loop | Fly rollback to last green release | `deploy/fly/tt-api-prod/` |
| DB corruption | Restore from backup · reconcile | ops DR policy |
| Factory pause needed | Timelock emergency pause (Cert #10) | `run-tt-governance-cert-10-emergency-pause.sh` |
| Treasury anomaly | Treasury pause · Owner alert | GovernanceTreasury |
| Bad mainnet deploy | Halt waves · rollback PREP | `rollback/MAINNET-ROLLBACK-PREP-V1.md` |
| Proxy incident | Timelock upgrade path only | G24 posture registry |

Full matrix: `docs/runbook/TT-MAINNET-LAUNCH-PRECHECK-AFTER-B435-001.md` §4

---

## Cert-linked recovery chain

```text
Cert #10 Emergency Pause
  → Cert #11 DR Drill / Unpause
  → Cert #12 GORP / Indexer replay
  → Phase ②-F re-validation if needed
```

Prep scripts ready: `scripts/dev/run-tt-governance-cert-{10,11,12}-*.sh`

---

## Indexer replay (G2)

Before cutover validation; repeat after incident:

```bash
# Staging clone + mainnet RPC (per ops policy)
curl -X POST "$API/internal/indexer-replay" -H "..." -d '{}'
curl -X POST "$API/internal/indexer-reconcile" ...
curl "$API/admin/observability/overview"
```

Evidence: `evidence/mainnet_deploy/recovery/indexer-replay-<UTC>.json`

---

## Emergency contacts & roles

| Role | Responsibility |
|------|----------------|
| Owner | Abort / authorize unpause / Wave halt |
| Engineering lead | Execute runbook · evidence capture |
| On-call | Indexer / API / RPC first response |
| Security | R-01 escalation · incident comms |

---

## Recovery evidence pack

After any P0 incident, capture:

- [ ] Timeline (UTC)
- [ ] Trigger ID from matrix
- [ ] Commands run + exit codes
- [ ] `/meta` + cast verify snapshot
- [ ] Owner decision record
- [ ] GORP signoff if Cert #12 invoked

Path: `evidence/mainnet_deploy/emergency-recovery/INCIDENT-<UTC>/`

---

## Does NOT replace

- On-chain rollback (impossible)
- Skipping Timelock for upgrades
- Sepolia param copy to mainnet
