# TT-STAGING-API-DB-TRANSIENT-503 · Staging API/DB 瞬时故障

**Issue ID：** `STAGING_API_DB_TRANSIENT_503`  
**总账：** [`registry/open-issues.v1.yaml`](../../registry/open-issues.v1.yaml)  
**Evidence：** `evidence/GO_staging_infra_console_errors/20260703T130900Z/staging-api-db-transient-503.json`  
**分类：** Production Infrastructure（**非** Market Runtime · **非** OCS / DDG / SOPCP）

```text
Market Default Filter Audit: CLOSED (不重开)
OCS · DDG · SOPCP: CLOSED (Evidence Reused)
```

---

## 症状

| 表现 | 说明 |
|------|------|
| `GET /api/v1/market/acquisition/listings` → **503** | JSON `error: market_listings_catalog_db_read_failed` |
| `GET …/official/cold-start/surfaces/market_feed` → **ERR_CONNECTION_CLOSED** | 浏览器 TCP 中断；API 日志可能无 503 |
| 硬刷新后恢复 **200** | 瞬时故障，非目录缺数据 |

---

## 根因（已证实日志）

```text
market_listings_list_failed variant=acquisition:
  error communicating with database: expected to read 5 bytes, got 0 bytes at EOF
→ HTTP 503
```

Postgres 连接池 **stale connection** / 网络 EOF — **不是** 前端默认筛选、**不是** OCS 目录错误。

---

## 即时处置

```bash
# 探针（应 200）
curl -sI "https://tt-api-staging.fly.dev/api/v1/market/acquisition/listings?limit=5"
curl -sI "https://tt-api-staging.fly.dev/api/v1/official/cold-start/surfaces/market_feed"
curl -s "https://tt-api-staging.fly.dev/health"

# 近期 503
fly logs -a tt-api-staging --no-tail | grep "status=503\|market_listings_list_failed"
```

用户侧：**硬刷新 / 数秒后重试**（前端 catalog fetch 无自动 retry，503 时可能短暂空列表）。

---

## 工程轨道（PI3 · 已部署 20260703T133800Z）

- [x] SQLx/Pg 池：`startup/pool_config.rs` · `test_before_acquire` · Fly env 见 `deploy/fly/tt-api-staging/fly.toml`
- [x] `/health/ready` 深度探针含 DB ping
- [x] 观测：`traveltrust_pg_transient_retry_*` metrics · `market_listings_list_failed` stderr
- [x] 读路径：`db/pg_transient_retry.rs` · listings + cold-start surface

---

## 恢复验证（20260703T130900Z）

| 端点 | 探针结果 |
|------|----------|
| `acquisition/listings?limit=50` | **200** · items=**10** |
| `official/cold-start/surfaces/market_feed` | **200** |

Evidence：`evidence/GO_staging_infra_console_errors/20260703T130900Z/recovery-probe.json`

---

## 关闭条件

- [x] 连接池/重试/探针改动已部署 staging + local mirror（20260703T133800Z）
- [x] acquisition/listings · market_feed · `/health/ready` 探针 **200**
- [x] 总账 `status: CLOSED` + `closed_utc`
