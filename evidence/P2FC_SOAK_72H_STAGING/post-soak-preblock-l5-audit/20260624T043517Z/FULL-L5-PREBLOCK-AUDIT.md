# Post-soak Preblock Full L5 Audit

- **verdict:** WARN · soak_completed=False
- **backlog:** 180 files · stamp=20260624T013808Z

## Wave1 surface (itineraries / market / escrow / guide)

- **W1_ITINERARIES** itineraries hub (API): 1 files Δ195 [critical]
- **W1_MARKET** market consumer: 19 files Δ937 [high]
- **W1_ESCROW** escrow / orders: 4 files Δ329 [high]
- **W1_GUIDE** guide / provider media: 0 files Δ0 [none]

## TN-P1-010 dependency chain

- scripts_ready=True · gate_pass=False
- [high] TN-B02: db/mod.rs in backlog — reconcile after COMPLETED via internal spine (post-soak-execute)
- [high] TN-B03: compound DB + itineraries delta — run TN-P1-010 step-1 before wave1 deploy (post-soak-execute)
- [medium] TN-B04: await COMPLETED.json then run p2fc-run-tn-p1-010-independent.sh (defer-soak)

## Graduation G01–G08

- G-01 Open P0 = 0: ✅ 完成 · clear=—
- G-02 Open P1 = 0: ✅ 完成 · clear=—
- G-03 Readiness ≥ 100: ✅ 完成 · clear=—
- G-04 Perfect validation GO: ✅ 完成 · clear=—
- G-05 blocking_open = 0: ✅ 完成 · clear=—
- G-06 P2FC COMPLETED.json: ❌ 未完成 · clear=defer-soak
- G-07 indexer compound + TN-P1-010 @ freeze SHA: ❌ 未完成 · clear=post-soak-execute
- G-08 D1–D24 + surface 100%: ❌ 未完成 · clear=defer-soak

## Post-soak blockers summary

- [high] TN-B02: db/mod.rs in backlog — reconcile after COMPLETED via internal spine
- [high] TN-B03: compound DB + itineraries delta — run TN-P1-010 step-1 before wave1 deploy
- [medium] TN-B04: await COMPLETED.json then run p2fc-run-tn-p1-010-independent.sh
- [high] W1-B01: itineraries hub Δ195 — apply MR-02 defer in wave1
