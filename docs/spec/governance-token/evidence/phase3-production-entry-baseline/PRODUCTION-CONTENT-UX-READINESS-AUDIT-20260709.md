# Production Content & UX Readiness Audit

**Audit ID:** `PRODUCTION-CONTENT-UX-READINESS-20260709`  
**Superseded scoring:** See **[PRODUCTION-ENTRY-REVIEW.md](./PRODUCTION-ENTRY-REVIEW.md)** for page L5 matrix (rolling)  
**Effective UTC:** 2026-07-09 (rev. 2 — taxonomy split)

---

## Executive verdict

| Item | Result |
|------|--------|
| **Production Content & UX GO** | **❌ NOT MET** |
| **Production Entry Review** | **ACTIVE** — see [PRODUCTION-ENTRY-REVIEW.md](./PRODUCTION-ENTRY-REVIEW.md) |
| **Wave A (Production Hygiene)** | **IN PROGRESS** — WA-01..03 **fixed** · WA-04..05 open |

---

## Finding taxonomy (user-approved)

### Confirmed Issue — must fix before ③

| ID | Finding | Status |
|----|---------|--------|
| **CI-01** | `/help` rendered raw i18n key `ui_link_nav_arrow_suffix` | ✅ **FIXED** 2026-07-09 |
| **CI-02** | `check-public-surface-audit-gate.sh` drifted after CMS roadmap migration | ✅ **FIXED** 2026-07-09 |
| **CI-03** | Mock TTG swap button reachable in production build without opt-in env | ✅ **FIXED** 2026-07-09 (`allowChainOffMockPayUi`) |
| **CI-04** | Seed/test personas visible on public chrome (e.g. 「测试游客」) | **OPEN** — ③ identity bootstrap policy |
| **CI-05** | Mock Pay / Mock Escrow depend on meta + env; need **live ③ build proof** | **OPEN** — gate partial (`check-production-ui-hygiene-gate.sh`) |

### Verification Pending — coverage gap (not confirmed defects)

| ID | Item | Notes |
|----|------|-------|
| **VP-01** | Mobile 375px layout | Not walked this sprint |
| **VP-02** | SEO (OG · canonical · hreflang) | Not audited |
| **VP-03** | Full zh/en i18n parity (128 routes) | Help spot-check only |
| **VP-04** | Admin production skin (Staging badge · maintainer copy) | Operator surface · separate PER track |
| **VP-05** | 96-20 full route matrix manual walk | PER page-by-page in progress |
| **VP-06** | Community showcase / market demo-on-degrade | Needs prod API happy-path proof |
| **VP-07** | a11y axe / keyboard sweep | 37 ① closure · not re-run |

---

## Phase ladder

```
① Local Engineering       CLOSED
② Staging Engineering     CLOSED (CMS)
Production Entry Review   ACTIVE  ← current
③ Production GO             NOT STARTED
```

---

## Wave A gates

```bash
bash scripts/gates/check-production-ui-hygiene-gate.sh      # mock UI + help i18n
bash scripts/gates/check-public-surface-audit-gate.sh       # disclosure + CMS SSOT
```

---

## Staging spot-check reference (2026-07-09)

| URL | Confirmed at audit time | After Wave A |
|-----|-------------------------|--------------|
| `/traveltrust/announcements` | ✅ CMS production copy | — |
| `/traveltrust` | ✅ Pulse · mock swap labeled | Mock swap hidden in prod build |
| `/help` | ❌ raw i18n keys | ✅ fixed locally — redeploy web to verify on ② |

---

## Honest boundary

**Confirmed Issue cleared ≠ Verification Pending cleared ≠ Production GO.**

PER exit requires public corridor **L5 ≥ 4.0** per [PRODUCTION-ENTRY-REVIEW.md](./PRODUCTION-ENTRY-REVIEW.md) and zero open **CI-*** P0 items.
