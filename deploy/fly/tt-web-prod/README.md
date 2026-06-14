# tt-web-prod · Fly 部署（③ 生产基础设施）

| 项 | 值 |
|----|-----|
| App | `tt-web-prod` |
| Fly 配置 | `frontend/fly.production.toml` |
| Build env | `build.env.example` → `build.env.local`（勿提交） |
| 部署 | `bash scripts/dev/deploy-tt-web-production.sh` |

**前置：** `tt-api-prod` 已部署且 `/health` 200 · `NEXT_PUBLIC_*` 与 API `/meta` 对拍
