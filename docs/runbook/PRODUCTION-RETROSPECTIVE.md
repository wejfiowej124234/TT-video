# Production Retrospective · V1 Launch Baseline Freeze

**Purpose:** After `TT_PRODUCTION_GO: GO`, freeze the **immutable V1 production launch baseline** — same role as G2 Retrospective for Wave 2.

**Prerequisites:**

| Key | Required |
|-----|----------|
| `TT_PRODUCTION_READINESS_G3_GATE` | **PASS** |
| `TT_PRODUCTION_GO` | **GO**（仅 via [`TT-PRODUCTION-GO-DECISION-PACKAGE.md`](TT-PRODUCTION-GO-DECISION-PACKAGE.md)） |

**Execute:**

```bash
bash scripts/dev/run-production-retrospective.sh
```

---

## Frozen artifacts

| File | Content |
|------|---------|
| `production-evidence-index.json` | G3 six domains + GO decision + G2 baseline paths |
| `production-machine-keys-snapshot.yaml` | G1/G2/G3/GO machine keys at launch |
| `final-master-matrix-snapshot.yaml` | Full Matrix at GO |
| `launch-timeline.json` | Gate chain + G3 domain evidence roots |
| `lessons-learned.json` | Post-launch lessons (append over time) |
| `production-baseline.json` | V1 reproducibility pointer |
| `production-retrospective-signoff.json` | `TT_PRODUCTION_RETROSPECTIVE: COMPLETE` |

**Latest:** `evidence/GO_production_readiness/production-retrospective/latest/`

---

## Release Train position

```text
… G3 Gate PASS
        ↓
Production GO Decision Package  (G3-06 · sole GO authority)
        ↓
TT_PRODUCTION_GO: GO
        ↓
Production Retrospective       ← this step
        ↓
V1 baseline immutable for all future versions
```

---

## Honest boundary

- Retrospective **≠** ongoing ops — ops runbooks remain live  
- V1 baseline **must not** be rewritten when shipping V2 — new work gets new evidence stamps  
- ① local evidence **≠** ③ Production GO

**G3 Domains:** [`G3-PRODUCTION-DOMAINS.md`](G3-PRODUCTION-DOMAINS.md)
