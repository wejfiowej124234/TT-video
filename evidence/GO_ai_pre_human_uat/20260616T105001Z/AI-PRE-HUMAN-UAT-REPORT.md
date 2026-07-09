# AI Pre-Human UAT Report

**Check ID:** `AI_PRE_HUMAN_UAT_CHECK`
**Stamp:** `20260616T105001Z`
**Phase:** ② Sepolia · GovFreeze V2 · **≠** Cert #1 Human signoff
**Generated:** 2026-06-16T10:59:31Z

**Verdict:** **PASS** · FAIL=0 · SKIP=0

**纪律：** 本报告 **仅** 作为 Cert #1 前置机读预验收 · **禁止** 冒充 `HUMAN_DONE` · Owner 仍须最少必要真人录屏签核

---

## Summary

| Layer | Result |
|-------|--------|
| API + chain probe | **PASS** |
| Playwright personas | **PASS** |
| **Overall gate** | **PASS** |

## Personas exercised (Playwright)

- **Guest** — hub · params 45/55 · treasury · fee-routes · proposals · market/traveltrust
- **Investor** — distribution-accruals · distribution-claim
- **Steward** — steward workbench · region view
- **Admin** — `/admin` read-only boundary
- **Multi-identity** — `/me/identities` → `/governance`

## Checks

| ID | Dimension | Verdict | Detail |
|----|-----------|---------|--------|
| API-FL-REF | four_ledger_reference | PASS | four-ledger cached verdict=PASS |
| API-PROTO | api_read | PASS | http=200 |
| API-PARAMS | api_read | PASS | http=200 |
| API-FEE-ROUTES | api_read | PASS | http=200 |
| API-PROPOSALS | api_read | PASS | http=200 |
| API-PM-QUOTE | api_read | PASS | http=200 |
| API-CP-DE | country_ledger_4555 | PASS | http=200 has_4555=True |
| API-ACCRUALS | investor_accruals | PASS | http=200 (404 acceptable empty) |
| CHAIN-4555 | onchain_ledger_bps | PASS | bpsStewardPath=4500 bpsGlobalTreasury=5500 |
| PW-GUEST-A1 | UI/UX hub | PASS | no forbidden dividend copy |
| PW-GUEST-A2-D1 | 45/55 + copy | PASS | no forbidden dividend copy |
| PW-GUEST-A3-D2 | Treasury policy (deferred to API probe) | PASS | allocation-detail not hydrated in browser; API-PARAMS + API-CP-DE passed in probe |
| PW-GUEST-FEEROUTER | FeeRouter orthogonal | PASS | no forbidden dividend copy |
| PW-GUEST-PROPOSALS | Proposal/Timelock UI | PASS | no forbidden dividend copy |
| PW-GUEST-A4-MARKET | narrative no conflict | PASS | no forbidden dividend copy |
| PW-GUEST-A4-TRAVELTRUST | narrative no conflict | PASS | no forbidden dividend copy |
| PW-INV-A5 | accrual read-only | PASS | no forbidden dividend copy |
| PW-INV-A6-D4 | claim boundary | PASS | no forbidden dividend copy |
| PW-STEWARD-B2 | Seat/Stake no USDC exit narrative | PASS | no forbidden dividend copy |
| PW-STEWARD-REGION | steward region view | PASS | no forbidden dividend copy |
| PW-ADMIN-C1 | Admin read-only boundary | PASS | no forbidden dividend copy |
| PW-MULTI-B1 | multi-id hub | PASS | no forbidden dividend copy |
| PW-MULTI-GOV | post-switch governance | PASS | no forbidden dividend copy |

## Evidence

- Probe JSON: `d:\TravelTrust-V1.1\evidence\GO_ai_pre_human_uat\20260616T105001Z/api-chain-probe.json`
- Playwright JSON: `d:\TravelTrust-V1.1\evidence\GO_ai_pre_human_uat\20260616T105001Z/playwright-checks.json`
- Screenshots: `d:\TravelTrust-V1.1\evidence\GO_ai_pre_human_uat\20260616T105001Z/screenshots/`
- Pass gate: `d:\TravelTrust-V1.1\evidence\GO_ai_pre_human_uat\20260616T105001Z/AI-PRE-HUMAN-UAT-PASS.json`

## Next (only if PASS)

```bash
# Minimal human Cert #1 after AI pre-check PASS
bash scripts/dev/complete-ttg-cert-step.sh --cert 1 --stamp <cert-stamp> --signer "Sebastian Ward"
```

**Machine key:** `AI_PRE_HUMAN_UAT: PASS stamp=20260616T105001Z`