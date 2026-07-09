# Production Environment Matrix · Sepolia Scope（148 PRODUCTION_SCOPE_SEPOLIA）

**Recorded:** 20260608  
**Scope SSOT:** [148-PI3-005-Production-Scope-Decision-Report.md](../handbook/engineering/148-PI3-005-Production-Scope-Decision-Report.md)  
**Execution SSOT:** [151-PI3-002-Production-Domain-TLS-CDN-CORS-Execution-Report.md](../handbook/engineering/151-PI3-002-Production-Domain-TLS-CDN-CORS-Execution-Report.md)  
**Audit baseline:** [121-PI3-002](../handbook/engineering/121-PI3-002-Production-Domain-CDN-CORS-Readiness-Report.md)

> **≠ Production GO** — 本矩阵为 **Sepolia-scoped prod cutover** 环境对拍表；Owner 填实域名与 secrets 后方可 live 探针 PASS。

---

## 1 · Scope lock

| Key | Production value | Notes |
|-----|------------------|-------|
| `PRODUCTION_SCOPE` | **SEPOLIA** | 148 书面裁定 |
| `CHAIN_ID` / `NEXT_PUBLIC_CHAIN_ID` | **11155111** | Sepolia |
| `MAINNET_CUTOVER_AUTHORIZED` | **false** | PI3-005-M defer |
| Catalog consumer prod | **`NEXT_PUBLIC_CATALOG_API_ENABLED=0`** | 120/146 冻结 |
| Server geo validation prod | **`CATALOG_SERVER_GEO_VALIDATION=0`** | 145/146 冻结 |

---

## 2 · Fly apps（target topology）

| Layer | App | Config | Public host (target) |
|-------|-----|--------|----------------------|
| API | `tt-api-prod` | `deploy/fly/tt-api-prod/fly.toml` | `https://api.<brand-domain>` |
| Web | `tt-web-prod` | `frontend/fly.production.toml` | `https://app.<brand-domain>` |
| PG | `tt-traveltrust-prod` | PI3-001 · [152](../handbook/engineering/152-PI3-001-FlyPG-Backup-Disaster-Recovery-Report.md) | Fly private |

**Staging baseline（不得回归）：** `tt-api-staging` · `tt-web-staging` · `*.fly.dev`

---

## 3 · Web build env 对拍（tt-web-prod）

**Template:** `deploy/fly/tt-web-prod/build.env.sepolia-prod.example`  
**Owner local:** `deploy/fly/tt-web-prod/build.env.local`（gitignored）

| Variable | Must equal | Probe |
|----------|------------|-------|
| `NEXT_PUBLIC_API_BASE_URL` | `PROD_API_BASE` | `check-production-web-alignment.sh` §4 |
| `NEXT_PUBLIC_SITE_URL` | `PROD_WEB_BASE` | 同上 |
| `API_REWRITE_TARGET` | `PROD_API_BASE` | Next rewrites → API |
| `NEXT_PUBLIC_CHAIN_ID` | `11155111` | `/meta` chain_id |
| `NEXT_PUBLIC_RPC_URL` | Sepolia RPC | wallet connect |

---

## 4 · API secrets / env（tt-api-prod）

**Template:** `scripts/dev/.env.production.example`  
**Owner local:** `scripts/dev/.env.production.local`（gitignored）

| Variable | Production requirement |
|----------|------------------------|
| `PUBLIC_API_BASE_URL` | `https://api.<brand-domain>` |
| `CORS_ORIGINS` | **仅** `https://app.<brand-domain>`（`patch-tt-api-prod-cors.sh`） |
| `CHAIN_ID` | `11155111` |
| `SEED` | `0` |
| `HSTS` | `1`（prod 建议） |
| `DATABASE_URL` | Fly PG prod |

---

## 5 · TLS / DNS / CORS execution checklist

| Step | Owner action | Verification |
|------|--------------|--------------|
| 1 | Register brand domain · DNS → Fly | `fly certs show -a tt-web-prod` |
| 2 | `fly certs add app.<domain> -a tt-web-prod` | TLS verify on `PROD_WEB_BASE/` |
| 3 | `fly certs add api.<domain> -a tt-api-prod` | TLS verify on `PROD_API_BASE/health` |
| 4 | Fill build.env.local + .env.production.local | alignment §3–§4 |
| 5 | Deploy API + lock CORS | OPTIONS preflight from prod FE origin |
| 6 | Deploy Web | `/` 200/30x |
| 7 | Cookie/CSP smoke | `verify-production-cookie-csp-headers.sh` |
| 8 | Infra audit | `run-production-infrastructure-audit.sh` — no INF-P0-004 |
| 9 | Execution gate | `check-pi3-002-production-domain-tls-cdn-cors-execution.sh` → **PI3-002_GO** |

---

## 6 · CDN / HLS

| Item | Status |
|------|--------|
| CDN / HLS（P3-COM-1） | **NOT_STARTED** — P1 · PI3-007 · **不挡** PI3-002 P0 |

---

## 7 · Frozen cross-refs（不得借 PI3-002 变更）

| Freeze | Report | Prod default |
|--------|--------|--------------|
| Catalog S5 | 120 | `ENABLED=0` |
| Catalog C-S6 | 146 | staging opt-in only |
| Growth | 133 | chain-off runtime |
| Operations | 145 | Admin/O-S4 已 GO · prod 同 staging 程序 |
| Cold Start Consumer | 150 | 只读 API · 无 prod 特殊开关 |

---

## 8 · Gate commands

```bash
# Execution sprint（151）
bash scripts/check-pi3-002-production-domain-tls-cdn-cors-execution.sh

# Prod alignment（Owner 填实 PROD_* 后）
PROD_WEB_BASE=https://app.<domain> PROD_API_BASE=https://api.<domain> \
  bash scripts/dev/check-production-web-alignment.sh

# Readiness audit（121 · 只读）
bash scripts/check-pi3-002-production-domain-cdn-cors-readiness.sh
```

---

*Maintained by PI3-002 Execution Sprint · 151 · 2026-06-08*
