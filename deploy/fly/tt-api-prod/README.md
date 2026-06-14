# tt-api-prod · Fly 部署（③ 生产基础设施）

**非业务代码** — 仅 Fly 拓扑与部署入口。

| 项 | 值 |
|----|-----|
| App | `tt-api-prod` |
| 配置 | `fly.toml`（本目录） |
| Secrets 清单 | `scripts/dev/.env.production.example` |
| 部署 | `bash scripts/dev/phase3-production-fly-deploy-and-sync.sh` |
| CORS | `PROD_WEB_BASE=… bash scripts/dev/patch-tt-api-prod-cors.sh` |

**前置：** `tt-traveltrust-prod` PG · 专用域名 DNS · `fly auth login`

**审计：** `bash scripts/dev/run-production-infrastructure-audit.sh`
