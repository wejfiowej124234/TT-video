# Production Cutover Runbook · Sepolia Scope

**Scope SSOT:** [148 PI3-005 Production Scope Decision](../handbook/engineering/148-PI3-005-Production-Scope-Decision-Report.md) · **`PRODUCTION_SCOPE_SEPOLIA`**  
**Program:** PI3-006 · Go-Live Checklist & Production Cutover  
**Checklist SSOT:** [go-live-checklist.md](../go-live-checklist.md) §0–§11  
**Decision package:** [PRODUCTION-GO-DECISION-PACKAGE.md](./PRODUCTION-GO-DECISION-PACKAGE.md) · **M-00**  
**Discipline:** **Ops / cutover only** — **禁止新增产品功能代码**

---

## 1 · Scope lock（148）

| Item | Sepolia production |
|------|-------------------|
| `CHAIN_ID` | **11155111** (Sepolia testnet) |
| go-live **§9 Mainnet** | **N/A** — G0–G6+SL defer · `mainnet_section_9_status=N_A_SEPOLIA_SCOPE` |
| Mainnet Shadow Launch | **NOT_REQUIRED** for this cutover |
| Production GO path | PI3-001～004 Owner GO → PI3-006 checklist → G6 audit → M-00 |

---

## 2 · Pre-cutover gates（147 §7.1）

| Gate | Requirement | Script / evidence |
|------|-------------|-------------------|
| **G0** | 147 program audit GO | `check-pi3-closure-program-audit.sh` |
| **G1** | Scope locked | 148 archived · `PRODUCTION_SCOPE_SEPOLIA` |
| **G2** | Infra | PI3-001 **GO** + PI3-002 **GO** |
| **G3** | PSP | PI3-003 **GO** |
| **G4** | Quality | PI3-004 **GO** · prod `report.json` **`release_gate=GO`** |
| **G5** | Checklist | PI3-006 **GO** · P0 十二项 **12/12** |
| **G6** | Machine audit | `run-m00-final-release-audit.sh` · **BLOCKER=0** on **prod** bases |
| **G7** | Decision | **M-00 signed** · `PRODUCTION_GO_DECISION: GO` |

**Hard stop:** Any gate **NO-GO / HOLD** → **禁止 cutover**.

---

## 3 · Owner pre-cutover checklist（T-7 → T-1）

| Day | Action | Owner | Verify |
|-----|--------|-------|--------|
| T-7 | Confirm 151 prod domain + TLS + CORS locked | Infra | `check-pi3-002-production-domain-tls-cdn-cors-execution.sh` → **GO** |
| T-7 | Enable Fly PG prod backup + drill | Infra | `check-pi3-001-fly-pg-backup-disaster-recovery-execution.sh` → **GO** |
| T-5 | Stripe live keys + prod webhook on `api.<domain>` | Ops | `check-pi3-003-stripe-live-production-webhook-execution.sh` → **GO** |
| T-5 | R-003 prod A+B + six-domain UAT | QA | `check-pi3-004-production-readiness-verification-execution.sh` → **GO** |
| T-3 | Freeze deploy branch · record digest / `TRAVELTRUST_GIT_SHA` | Release | go-live **§0.1** |
| T-3 | Apply migrations on prod DB (dry-run + window plan) | Infra | go-live **§2.2** |
| T-1 | Rollback runbook review + on-call roster | Ops | go-live **§8** · **§10** |
| T-1 | Re-run M-00 audit on prod URLs | Release | `run-m00-final-release-audit.sh` |

---

## 4 · Cutover day sequence（go-live §7）

**Env (required):**

```bash
export PROD_API_BASE=https://api.<domain>
export PROD_WEB_BASE=https://app.<domain>
export PROD_UAT_EMAIL=...
export PROD_UAT_PASSWORD=...
```

| Step | Action | go-live | Script |
|------|--------|---------|--------|
| 1 | Deploy API + WEB to prod (pinned digest) | §0.1 | Fly deploy per 151 |
| 2 | Verify secrets: `SEED_TEST_ACCOUNTS=0`, no `P3_CHAIN_OFF` | §3.6 | infra audit |
| 3 | Cutover smoke | §7 | `bash scripts/dev/run-production-cutover-smoke.sh` |
| 4 | Indexer reconcile → tick (internal secret) | §4.2 | Runbook §2 |
| 5 | Stripe live admission fee smoke (if in scope) | §6 | 153 smoke script |
| 6 | Escrow SSOT drill (chain on) | §4.5 | Runbook §7.1.3 |
| 7 | Update go-live §0–§11 + P0 十二项 | §11 | Owner sign-off |

---

## 5 · Cutover smoke（§7 · Owner）

```bash
PROD_API_BASE=https://api.<domain> \
PROD_WEB_BASE=https://app.<domain> \
  bash scripts/dev/run-production-cutover-smoke.sh
```

**Minimum probes:**

| # | Probe | Expected |
|---|-------|----------|
| 1 | `GET ${PROD_API_BASE}/health` | 200 |
| 2 | `GET ${PROD_API_BASE}/meta` | 200 · `chain_id=11155111` |
| 3 | `GET ${PROD_WEB_BASE}/` | 200 · HTTPS |
| 4 | Internal indexer-tick without secret | 401/403 (not 200) |
| 5 | CORS: browser origin matches prod WEB | per 151 matrix |

Evidence: `evidence/pi3_006_go_live_production_cutover/cutover-smoke-<UTC>/`

---

## 6 · Rollback（§8）

| Trigger | Action |
|---------|--------|
| API 5xx spike / funds anomaly | Pause write paths · rollback API/WEB to prior digest |
| Indexer stall > threshold | Internal pause · reconcile · no public chain writes |
| Migration failure | TT-B324 runforward or **backup restore** (PI3-001) |
| Contract incident | **Pause only** — no on-chain revert assumption |

**Rollback authority:** Release Owner + on-call (documented in go-live §8.1).

---

## 7 · Post-cutover · M-00 Final Release Audit

```bash
PROD_API_BASE=https://api.<domain> \
PROD_WEB_BASE=https://app.<domain> \
  bash scripts/dev/run-m00-final-release-audit.sh
```

**Pass criteria:**

- `go_no_go.json` → **`verdict=GO`** · **`blocker=0`**
- `PRODUCTION-GO-DECISION-PACKAGE.md` → **`M-00_SIGNED: true`**
- **`PRODUCTION_GO_DECISION: GO`**
- **`PRODUCTION_CUTOVER_AUTHORIZED: true`**

Update baseline:

```bash
# After Owner closure — edit evidence/pi3_006_go_live_production_cutover/baseline_record.v1.json
# status=PASS · p0_twelve_items_closed=12 · m00_signed=true
python scripts/gates/check-pi3-006-go-live-production-cutover-baseline-record.py
bash scripts/check-pi3-006-go-live-production-cutover-execution.sh
```

---

## 8 · Forbidden shortcuts（147 §7.2）

| Forbidden | Why |
|-----------|-----|
| 145 Ops FREEZE → Production GO | B-layer ≠ A-layer PI3 |
| C7 / staging 93 → prod full-site GO | PI3-004 |
| `*.fly.dev` as production domain | PI3-002 |
| Skip M-00 | TT-MASTER |
| Skip go-live §0–§11 parallel sign-off | PI3-006 |

---

## 9 · Cross references

| Doc | Role |
|-----|------|
| [151](../handbook/engineering/151-PI3-002-Production-Domain-TLS-CDN-CORS-Execution-Report.md) | Domain / TLS / CORS |
| [152](../handbook/engineering/152-PI3-001-FlyPG-Backup-Disaster-Recovery-Report.md) | Backup / DR |
| [153](../handbook/engineering/153-PI3-003-Stripe-Live-Production-Webhook-Report.md) | Stripe live |
| [154](../handbook/engineering/154-PI3-004-Production-Readiness-Verification-Report.md) | R-003 prod |
| [155](../handbook/engineering/155-PI3-006-GoLive-Checklist-Production-Cutover-Report.md) | This program report |
| [PRODUCTION-OPS-RUNBOOK](./PRODUCTION-OPS-RUNBOOK.md) | Steady-state ops |

---

*PI3-006 · 155 execution sprint · no product feature code*
