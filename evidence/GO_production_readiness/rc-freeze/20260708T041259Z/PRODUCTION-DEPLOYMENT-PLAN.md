# Production Deployment Plan · Post-RC Freeze

> **Generated:** 2026-07-08T04:12:59.479Z  
> **RC Freeze stamp:** `20260708T041259Z`  
> **Git SHA:** `f2e3fbc53122fb6a8f75f96f6e2b14006ac98842`  
> **Status:** PLAN ONLY — not Production GO

---

## 0 · Boundary

| Signal | Value |
|--------|-------|
| `TT_PRODUCTION_ENTRY_READY` | **YES** (RC validation complete) |
| `TT_PRODUCTION_GO` | **NO_GO** (PI3 infrastructure · Owner live resources) |
| `TT_SPRINT_B_ACTIVE` | **false** |

RC Freeze closes **product readiness validation**. Production cutover follows **PI3** ([`TT-RELEASE-PIPELINE.md`](../../docs/runbook/TT-RELEASE-PIPELINE.md)).

---

## 1 · Staging → Production surfaces

| Surface | Staging (validated) | Production target |
|---------|---------------------|-------------------|
| API | `tt-api-staging.fly.dev` | `tt-api-prod` · [`deploy/fly/tt-api-prod/`](../../deploy/fly/tt-api-prod/) |
| Web | `tt-web-staging.fly.dev` | `tt-web-prod` · [`deploy/fly/tt-web-prod/`](../../deploy/fly/tt-web-prod/) |

**Deploy scripts:**
- API: `bash scripts/dev/phase3-production-fly-deploy-and-sync.sh`
- Web: `bash scripts/dev/deploy-tt-web-production.sh`

---

## 2 · Pre-cutover checklist (PI3)

1. **Database** — `tt-traveltrust-prod` PG provisioned · backup policy
2. **Secrets** — `scripts/dev/.env.production.example` → Fly secrets (no mock-pay flags on prod unless explicitly waived)
3. **Domain / TLS** — production DNS · CORS patch (`patch-tt-api-prod-cors.sh`)
4. **CDN / assets** — G3 production CDN VERIFIED (not staging evidence)
5. **Stripe Live** — PI3-003
6. **Runtime parity** — `GET /meta` on prod matches RC registry expectations (no `P3_CHAIN_OFF` mock-pay on prod by default)
7. **Owner sign-off** — `production-go-decision-package.json` countersigned

---

## 3 · Recommended cutover sequence

```text
RC Freeze tag (this release)
    → PI3 infrastructure audit (run-production-infrastructure-audit.sh)
    → Production secrets + DNS
    → tt-api-prod deploy (phase3-production-fly-deploy-and-sync.sh)
    → tt-web-prod deploy (deploy-tt-web-production.sh)
    → Production smoke / PER regression
    → Owner Production GO package
```

---

## 4 · Rollback

- Fly: `fly releases -a tt-api-prod` / `fly releases -a tt-web-prod` → rollback to prior release
- Tag anchor: `f2e3fbc53122fb6a8f75f96f6e2b14006ac98842` for reproducible rebuild

---

## 5 · Evidence references

- RC manifest: `evidence/GO_production_readiness/rc-freeze/RC-FREEZE-MANIFEST-LATEST.json`
- RC sign-off: `evidence/GO_production_readiness/rc-freeze/RELEASE-CANDIDATE-FINAL-SIGNOFF-LATEST.json`
- Master checklist: `evidence/GO_production_readiness/PRODUCTION-READINESS-MASTER-CHECKLIST-LATEST.json`
- Final Gate #3: `evidence/GO_production_readiness/sprints/PRODUCTION-READINESS-FINAL-GATE-REEVALUATION-LATEST.json`
