# PER Wave Remediation Plan v1

**Plan ID:** `PER-WAVE-REMEDIATION-PLAN-v1`  
**Status:** **FROZEN** (2026-07-09)  
**Machine SSOT:** [registry/per-wave-backlog.v1.yaml](../../registry/per-wave-backlog.v1.yaml)  
**Source audit:** [PER-ROUND1-FINDINGS-LATEST.md](../spec/governance-token/evidence/phase3-production-entry-baseline/PER-ROUND1-FINDINGS-LATEST.md)

---

## Phase positioning (Release Engineering)

```
① Local SSOT                    ✅
        ↓
Local ↔ Staging Alignment       ✅
        ↓
PER Round 1 (record-only)       ✅  ← production entry review baseline established
        ↓
Wave A / B / C fix window       ← **CURRENT** (no drive-by fixes)
        ↓
Local Gate + PER Round 1 Recheck
        ↓
Commit SSOT snapshot
        ↓
One-shot Staging deploy
        ↓
Environment-diff verify only
        ↓
PER Round 2 / Production Entry Review exit
        ↓
③ Production GO (separate gates)
```

**This is not a test phase.** It is **defect convergence before Production Entry Review exit**.

**Rule:** PER Round 1 did its job — **establish the baseline**, not fix. Fixes happen only in **frozen Wave batches** on Local SSOT.

---

## Distance to Production Entry Review exit

| Layer | Status |
|-------|--------|
| Local SSOT | ✅ |
| Local ↔ Staging Alignment | ✅ |
| PER Round 1 | ✅ |
| Public Surface Hygiene | 🔄 Wave A |
| Copy / IA (consumer language) | 🔄 Wave B |
| Business Data Governance | 🔄 Wave C |
| Full Public Walk (mobile · en · escrow evidence) | 🔄 Wave C VP |
| Production Gate / GO | ⏳ Not started |

**Judgment:** Not a “big problem discovery” — **last-mile productionization**. Of 15 CIs: ~**3–5** likely blockers · ~**5–7** brand/UX · remainder evidence gaps.

---

## Wave definitions

### Wave A · Hygiene (highest priority)

**Goal:** Clear **Production Contamination Risk** — user must not infer “this is a test environment.”

| ID | P | Issue | Owner file(s) | Verification |
|----|---|-------|---------------|--------------|
| PER-R1-CI-03 | **P0** | Seed/test personas on chrome (CI-04) | `HeaderUserMenu.tsx` · seed registry | C1 login route walk |
| PER-R1-CI-04 | **P0** | mock-swap / Mock Pay prod proof (CI-05) | `TravelTrustStablecoinGateway.tsx` · `travelTrustUiGuards.ts` | `next build` + hygiene gate |
| PER-R1-CI-09 | **P0** | 间距调试 on `/traveltrust` | `TravelTrustSectionSpacingDebug.tsx` | No button without `?tt_spacing=1` |
| PER-R1-CI-01 | P1 | Next.js Dev Tools in DOM | `layout.tsx` · prod build | VP-09 prod server walk |

**Brand-critical routes:** `/` · `/traveltrust` · `/market`

---

### Wave B · Copy / IA (highest ROI)

**Goal:** Consumer-facing language and footer IA; hide operator/engineering surfaces.

| ID | P | Issue | Owner file(s) | Verification |
|----|---|-------|---------------|--------------|
| PER-R1-CI-02 | **P0** | Footer operator links (费路由/自检) | `LandingFooter.tsx` · locales | Public footer crawl |
| PER-R1-CI-12 | **P0** | 「① 本地已过滤…」on `/market` | `EmptyState.tsx` · locales | User-language footnote |
| PER-R1-CI-16 | P1 | Help: 08-4 · GET /meta · Runbook | `help/page.tsx` · locales | Copy review |
| PER-R1-CI-05 | P1 | Phase jargon (Sepolia ② · Phase 1/2/3) | locales · governance copy | Owner classify ② vs ③ |
| PER-R1-CI-06 | P1 | Home og:url localhost | home metadata | curl meta |
| PER-R1-CI-07 | P1 | SR text「① 本地 Mock」 | traveltrust cinematic | a11y tree |
| PER-R1-CI-08 | P1 | SEO Sepolia in meta | `/traveltrust` metadata | Owner classify |
| PER-R1-CI-11 | P1 | Demo labels Playmate/演示/币种未提供 | market + guides DB | Card copy audit |
| PER-R1-CI-13 | P1 | Admin console links on `/governance` hub | `GovernanceHubPageMain.tsx` | Public nav audit |
| PER-R1-CI-15 | P1 | Announcements EN title / zh UI | announcements page · locales | zh title match |
| PER-R1-CI-14 | P2 | D-4555-A/B on `/trust` | trust locales | Plain language on tourist page |

**Public footer policy (Owner):**

| Keep | Hide from consumer footer |
|------|---------------------------|
| About · Trust · Help · Community · Governance | Internal diagnostics · engineering gates · operator routes · FeeRouter self-check |

---

### Wave C · Business evidence & catalog governance

**Goal:** Prove **core transaction surface** and **single-source catalog projection** — not cosmetic-only fixes.

| ID | P | Issue | Owner file(s) | Verification |
|----|---|-------|---------------|--------------|
| PER-R1-CI-10 | **P1** | Duplicate Hangzhou guides (13×) | `guides.rs` · `useMarketPage.ts` · DDG registry | API count ↔ UI dedupe |
| PER-R1-VP-06 | **P1** | Escrow not evidenced | escrow corridor · smoke chain | Seeded order · buyer/provider · state flow |
| PER-R1-VP-09 | **P1** | Production build proof | `next build` | Closes A DevTools/mock ambiguity |
| PER-R1-VP-05 | P2 | `/me` logged-in | `app/me/*` | C1 session walk |
| PER-R1-VP-01..04,07,08 | P2 | mobile · en · a11y · SEO · community · errors | corridor | Round 2 coverage |

**Catalog invariant (must prove):**

```
Database → Catalog Projection → Public Market
```

Not: `DB → seed → mock/demo → frontend fallback` stacking.

**Escrow note:** Round 1 **L5=3.0** = **insufficient evidence**, not “Escrow product failed.” Round 2 must add: seeded order · logged-in user · buyer/provider · escrow state transitions — otherwise **Core transaction surface not fully evidenced**.

---

## Execution order (mandatory)

1. **Owner sign-off** on this plan + YAML (no code until signed).
2. **Wave A** batch fix → hygiene gate green.
3. **Wave B** batch fix → public-surface gate green.
4. **Wave C** batch fix + evidence scripts → catalog/escrow proof.
5. **PER Round 1 Recheck** (same 10 routes · record deltas only).
6. **Local Gate** full minimum set ([CONTRIBUTING](../../CONTRIBUTING.md#pre-push-local)).
7. **Commit** SSOT snapshot.
8. **One-shot** deploy API + Web → Staging.
9. **Environment-diff verify** — re-run `run-local-staging-full-alignment-audit.sh`.
10. **PER Round 2** → Production Entry Review exit review.

**Forbidden:** fix-on-sight during audit · per-page staging deploy · mixing PER with Wave execution.

---

## Gates (per wave)

```bash
# After Wave A
bash scripts/gates/check-production-ui-hygiene-gate.sh

# After Wave B
bash scripts/gates/check-public-surface-audit-gate.sh

# After Wave C (corridor)
bash scripts/dev/smoke-web3-itinerary-full-chain-local.sh

# After full batch + commit prep
bash scripts/dev/run-local-staging-full-alignment-audit.sh
```

---

## Evidence outputs (post-batch)

| Artifact | When |
|----------|------|
| `PER-WAVE-A-CLOSEOUT.md` | Wave A gate green |
| `PER-WAVE-B-CLOSEOUT.md` | Wave B gate green |
| `PER-WAVE-C-CLOSEOUT.md` | Wave C + escrow/catalog proof |
| `PER-ROUND1-RECHECK-LATEST.md` | After local batch before commit |
| Updated `LOCAL-STAGING-FULL-ALIGNMENT-AUDIT-LATEST.*` | After staging one-shot deploy |

---

## Honest boundary

- Wave plan frozen **≠** PER exit **≠** ③ Production GO  
- ② Sepolia honest disclosure items (**CI-05/08**) require **Owner classify**: keep on governance/announcements protocol zones for ②; rewrite for ③ consumer SEO at GO.  
- **No code changes** until Owner authorizes Wave A start.
