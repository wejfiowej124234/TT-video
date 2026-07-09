# TT Project Mainline · Product Verification

**Status:** **ACTIVE** · **2026-06-30**  
**Supersedes (closed chapter):** Configuration → Governance → Convergence  
**Purpose:** **验产品** — not **验配置**

## Machine line

```
TT_PROJECT_MAINLINE: PRODUCT_VERIFICATION
```

## Mainline (must follow order · no skip)

```
Manual UAT
    ↓
Business Defect
    ↓
Regression
    ↓
Production Entry Review
    ↓
Testnet Sign-off
    ↓
Mainnet Preparation
```

| Step | What it proves | SSOT |
|------|----------------|------|
| **Manual UAT** | Personas · corridors · real UX | [manual-uat/README.md](../../evidence/manual-uat/README.md) · [TT-LOCAL-UI-MANUAL-UAT-CHECKLIST](TT-LOCAL-UI-MANUAL-UAT-CHECKLIST.md) |
| **Business Defect** | Bugs with severity · traceability | `evidence/manual-uat/summary/defects-registry.json` |
| **Regression** | Fix verified · no reopen | `evidence/manual-uat/regression/` |
| **Production Entry Review** | Quality gate before ②③ | [PER Regression](TT-PRODUCTION-ENTRY-REVIEW-REGRESSION.md) · Dashboard |
| **Testnet Sign-off** | ② staging / Sepolia / real callbacks | [PHASE2-START-CHECKLIST](PHASE2-START-CHECKLIST.md) · [TT-9618](TT-9618-onboarding-local-testnet.md) |
| **Mainnet Preparation** | ③ PSP · mainnet · go-live | [go-live-checklist](../go-live-checklist.md) |

## Dashboard focus (primary)

- Open P0 / P1 Business Bugs  
- Manual UAT Coverage  
- Regression  
- Production Readiness  

**Not** Configuration Sprint metrics.

## Configuration chapter (FROZEN · same day)

**[TT_CONFIGURATION_ZERO_DRIFT](TT-CONFIGURATION-ZERO-DRIFT-FROZEN.md)** graduated **2026-06-30**. Config drift recurrence = **PER Regression** only.

## Honest boundary

① Product verification progress **≠** ② Testnet Sign-off **≠** ③ Mainnet GO.
