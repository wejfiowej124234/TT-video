# Production Entry Review (PER)

**Review ID:** `PRODUCTION-ENTRY-REVIEW-v1`  
**Phase slot:** **Between ② Staging Engineering and ③ Production GO**  
**Nature:** Content · UX · Visual · Copy · a11y · SEO · Mobile · Legal · Trust · Consistency — **not** new feature development  
**Status:** **Wave remediation window** (backlog frozen · no code until Owner authorizes Wave A)  
**Wave SSOT:** [PER-WAVE-REMEDIATION-PLAN-v1.md](../../../runbook/PER-WAVE-REMEDIATION-PLAN-v1.md) · [per-wave-backlog.v1.yaml](../../../registry/per-wave-backlog.v1.yaml)  
**Findings SSOT:** [PER-ROUND1-FINDINGS-LATEST.md](./PER-ROUND1-FINDINGS-LATEST.md) · [PER-ROUND1-MATRIX-LATEST.json](./PER-ROUND1-MATRIX-LATEST.json)  
**Prior audit:** [PRODUCTION-CONTENT-UX-READINESS-AUDIT-20260709.md](./PRODUCTION-CONTENT-UX-READINESS-AUDIT-20260709.md)

---

## Phase ladder (updated)

```
① Local Engineering          CLOSED (CMS S0 · UI freeze corridors)
        |
② Staging Engineering        CLOSED (CMS deploy + UAT · 2026-07-09)
        |
Local ↔ Staging Alignment    **LOCAL_SSOT_READY** (2026-07-09) — [audit](./LOCAL-STAGING-FULL-ALIGNMENT-AUDIT-LATEST.md)
        |
Production Entry Review      **OPEN** — local walks only · staging after one-shot deploy
        |
③ Production GO              NOT STARTED
```

**Alignment SSOT:** [LOCAL-STAGING-FULL-ALIGNMENT-AUDIT-LATEST.md](./LOCAL-STAGING-FULL-ALIGNMENT-AUDIT-LATEST.md) · runner `bash scripts/dev/run-local-staging-full-alignment-audit.sh`

**Order (mandatory):** Align (local = SSOT) → PER Round 1 **on local only** (record) → Wave fixes → gates green → **one-shot** deploy → staging env-diff verify. **Do not** PER-walk staging while code drift is unclassified.

**PER ≠ Production GO.** PER exit is **necessary but not sufficient** for ③ (PSP · mainnet · infra · G-1/G-2 remain separate).

---

## Finding taxonomy (mandatory)

| Class | Meaning | Example |
|-------|---------|---------|
| **Confirmed Issue** | Reproducible defect or hygiene violation on user-visible surface | Raw i18n key on `/help` |
| **Verification Pending** | Dimension **not yet audited** — **not** a confirmed defect | Mobile 375px not walked |
| **PASS** | Dimension reviewed and meets L5 bar for current phase |

**Rule:** Never score **Verification Pending** as FAIL in aggregate verdict — track as open coverage.

---

## L5 scoring rubric (per page)

| L5 | Stars | Meaning |
|----|-------|---------|
| 5 | ★★★★★ | Production-ready · no confirmed issues · trust/copy/IA polished |
| 4 | ★★★★☆ | Shippable with minor polish backlog (P2) |
| 3 | ★★★☆☆ | Functional but visible content/UX gaps (P1) |
| 2 | ★★☆☆☆ | Confirmed issues affecting trust or comprehension |
| 1 | ★☆☆☆☆ | Blocker cluster · must fix before ③ |

**Dimensions (each page):** UI · UX · Copy · IA · Loading · Error · Empty · Mobile · i18n · SEO · a11y · Trust · Test traces

---

## Wave A — Confirmed Issue remediation (Production Hygiene)

| ID | Issue | Status |
|----|-------|--------|
| PER-WA-01 | `/help` raw i18n key `ui_link_nav_arrow_suffix` | ✅ FIXED (locales + contract test) |
| PER-WA-02 | Public-surface gate drift vs CMS roadmap | ✅ FIXED (gate + registry) |
| PER-WA-03 | Mock TTG swap visible in `NODE_ENV=production` without opt-in | ✅ FIXED (`allowChainOffMockPayUi` on gateway) |
| PER-WA-04 | Mock Pay / Mock Escrow production kill-switch proof | ⚠️ Partial — `allowChainOffMockPayUi` + Dockerfile `=0`; **PER** must verify live ③ build |
| PER-WA-05 | Test account personas on public chrome | **Confirmed** — seed nicknames; ③ bootstrap policy required |

**Gate:**

```bash
bash scripts/gates/check-production-ui-hygiene-gate.sh
bash scripts/gates/check-public-surface-audit-gate.sh
```

---

## Page-by-page PER matrix (rolling)

**Legend:** `C` = Confirmed Issue · `V` = Verification Pending · `·` = PASS (spot-check or prior freeze)

| Page | Route | L5 | UI | UX | Copy | IA | Load | Err | Empty | Mob | i18n | SEO | a11y | Trust | Traces | Notes |
|------|-------|-----|----|----|------|-----|------|-----|-------|-----|------|-----|------|-------|--------|-------|
| **首页** | `/` | **4.5** ★★★★☆ | · | · | · | · | V | · | V | V | · | V | · | · | · | ① freeze · Pulse CMS · mobile/SEO pending |
| **TravelTrust** | `/traveltrust` | **4.5** ★★★★☆ | · | · | · | · | V | V | · | V | · | V | · | · | C→fixed | Mock swap gated for prod build |
| **Announcements** | `/traveltrust/announcements` | **5** ★★★★★ | · | · | · | · | · | · | · | V | · | V | · | · | · | ② CMS production copy verified |
| **Trust** | `/trust` | **4** ★★★★☆ | · | · | · | · | V | V | V | V | · | V | · | · | · | Prior public-surface PASS |
| **Market** | `/market` | **4** ★★★★☆ | · | · | · | · | V | · | V | V | · | V | · | · | V | Demo banners only on API degrade |
| **Escrow** | `/escrow/[id]` | **4** ★★★★☆ | · | · | · | · | V | · | V | V | · | V | · | · | V | Mock pay meta-gated · draft frozen |
| **Governance** | `/governance/*` | **4** ★★★★☆ | · | · | · | · | V | V | V | V | · | V | · | · | · | Sepolia honesty OK for ② |
| **Community** | `/community/*` | **3.5** ★★★☆☆ | · | V | · | · | V | V | V | V | · | V | · | · | V | Showcase/mock paths — prod API proof pending |
| **Me** | `/me/*` | **3.5** ★★★☆☆ | · | V | · | · | V | V | V | V | · | V | · | · | V | Publish hub Phase-A placeholders |
| **Help** | `/help` | **3** ★★★☆☆ | · | · | C→fixed | · | · | · | · | V | C→fixed | V | · | · | V | Internal refs (`08-4`) — copy polish P1 |
| **Auth** | `/auth/*` | **4** ★★★★☆ | · | · | · | · | · | · | · | V | · | V | · | · | · | UI freeze ① |
| **Admin** | `/admin/*` | **—** | V | V | V | · | V | V | V | V | V | V | V | · | V | **Operator surface** — separate PER track; staging badge OK on ② |

**Aggregate PER (public corridor only):** **4.0 / 5** — **NOT MET** for ③ until mobile · SEO · community/me · help copy · test-identity policy verified.

---

## PER checklist dimensions (site-wide)

| Dimension | Status | Evidence |
|-----------|--------|----------|
| Content QA | **ACTIVE** | CMS ② · PER page matrix |
| UX QA | **Verification Pending** | 96-20 full walk not done |
| Visual QA | **Partial** | Five-main freeze ① |
| Copy QA | **Partial** | Public-surface + CMS · help internal refs remain |
| Accessibility | **Verification Pending** | 37 closed ① · no fresh axe sweep |
| SEO | **Verification Pending** | — |
| Mobile | **Verification Pending** | — |
| Empty / Error / Loading | **Verification Pending** | 39 §3.3 prior PASS · not re-walked |
| Permission / Legal / Trust | **Partial** | 40 + 08-4 · terms placeholder note |
| Consistency | **Partial** | FIVE-MAIN + CMS lanes aligned |

---

## Execution order (PER sprint)

1. **Wave A hygiene** — gates green (WA-01..03 done)  
2. **Page walks** — top public corridor rows above (browser + 375px + en/zh)  
3. **Confirmed Issue log** — append to [PRODUCTION-CONTENT-UX-READINESS-AUDIT-20260709.md](./PRODUCTION-CONTENT-UX-READINESS-AUDIT-20260709.md) §Confirmed only  
4. **Coverage log** — same doc §Verification Pending  
5. **PER exit review** — all public pages ≥ L5 4.0 · zero P0 Confirmed · Owner sign-off  
6. **Then** Production GO decision (③ separate checklist)

---

## Honest boundary

PER complete on **marketing + disclosure corridor** **≠** full **128-route** 96-20 matrix **≠** ③ Production GO.
