# PSG · Candidate v2 Change Boundary

> **ARCHIVED_OR_SUPERSEDED under FINAL RELEASE** · Active = Candidate v2 @ `97289a71` · pin `PSG-REL-20260720-WEB3-CAND-V2` · FG-15-B **ELAPSED** · not release mainline.  
> Cert suite **FORBIDDEN** until [TT-FINAL-RELEASE-BASELINE-LATEST](./TT-FINAL-RELEASE-BASELINE-LATEST.md) `freeze_status=FROZEN`。

**STATUS:** **SUPERSEDED_SNAPSHOT** · wait-window boundary archive · **≠** PSG Complete · **≠** Production GO  
**Recorded:** `2026-07-20T03:40:42Z`  
**ACTIVE pin:** `PSG-REL-20260720-WEB3-CAND-V2` · tip `97289a7185610ef0ad8822f0af04bfa533e42986`  
**ACTIVE deploy baseline:** `v311_fund_safety_candidate_v2`  
**Historical (NOT FOR PROMOTION):** FG-15-A / `v311_sepolia_clean_baseline` / pin `PSG-REL-20260719-FG15-09c72b93`

## Why historical PASS does not count

FG-15-A / Hardened / prior Coverage PASS artifacts are **ARCHIVED_HISTORICAL**. Candidate v2 redeployed Money Path contracts (FactoryV2 · SettlementRouter · FeeRouter). Only evidence under the Candidate v2 pin and `evidence/GO_fg15_observation_48h_candidate_v2/` (plus L1–L4 Candidate packs) may feed S7 Recalculate for this release.

## From → To

| Axis | From (historical) | To (Candidate v2 ACTIVE) |
|------|-------------------|---------------------------|
| Web3 mainline baseline | `v311_sepolia_clean_baseline` (FG-15-A) | `v311_fund_safety_candidate_v2` |
| EscrowFactory | FG-15-A / superseded attempts | `0x6e9a4c40…bdef` (V2) |
| SettlementRouter | historical / Hardened | `0x5a6df184…d6a` |
| FeeRouter | historical | `0xf406e6f1…b28` |
| Timelock | shared spine | `0x46240208…504c` (shared) |
| Governor / Treasury | FG-15-A spine | **unchanged shared** (not redeployed) |
| Observation | FG-15-A archive | FG-15-B **ELAPSED**（was `OBSERVATION_RUNNING`） |
| Hard Gate | CUTOVER_REFUSED | CUTOVER_REFUSED (untouched) |

## Included in this Candidate scope

- Money Path Happy + Dispute live PASS (Settlement scheduled)
- L1 Journey live evidence (7)
- L2 Live DB / sqlx / Runtime API / Certification Bundle
- L3 RBAC Decision (60/96 ACCEPTED residual) + Auth/Session evidence
- L4 Monitoring/Recovery process evidence + Owner templates
- FG-01..15 structure · capture templates · verification map
- L5 Contract Identity + Runtime Preflight
- Evidence Consolidation catalog / residual final classification

## Excluded (do not demand for this Final)

- EGM Evidence certification (entry not met)
- Merchant / Acquisition bilateral slots (SLOT_RESERVED)
- RBAC chase to 96/96
- Full 96-cell matrix expansion
- Mainnet Wave / real ETH
- Hard Gate flip
- Production GO
- Founder wallet fill (OWNER_INPUT — separate gate)

## Frozen

- V3.1.1 Economic Model Freeze (rules)
- PSG Archive `v1.1.0-psg-go.20260717` (immutable; do not mutate)
- FG-15-A evidence trees (append-only archive; NOT FOR PROMOTION)
- Certification Governance Framework HEAD (no Framework v1.2 churn)

## Post-ETA only

1. Settlement finalize  
2. L5 Final Evidence  
3. S7 Recalculate  
4. Formal Release Baseline (new cycle if GO)

**Honesty:** Preflight ALIGNED / LIVE_PASS ≠ L5 PASS ≠ `psg_complete`.
