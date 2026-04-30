# F-027 · B-ESC-003

## 前置

- Postgres: `DATABASE_URL=postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust`
- API: `target/debug/traveltrust-api.exe`，`PORT=8080`，`SEED_TEST_ACCOUNTS=1`，`P3_CHAIN_OFF=1`，`PLAYWRIGHT_RELAX_META_CHAIN_GUARD=1`，`CHAIN_RPC_URL` 空，`API_RATE_LIMIT_PER_MINUTE=0`

## 复跑（**须** `REQUIRE_IDEMPOTENCY_KEY=1`，否则 F-028 会 skip）

```bash
# 终端 1：仓库根启动 API（环境同上）
./target/debug/traveltrust-api.exe

# 终端 2：frontend
export DATABASE_URL='postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust'
export PLAYWRIGHT_FULL_STACK=0 PLAYWRIGHT_API_ONLY=1
export PLAYWRIGHT_RELAX_META_CHAIN_GUARD=1 CHAIN_RPC_URL=''
export P3_CHAIN_OFF=1 REQUIRE_IDEMPOTENCY_KEY=1
export PLAYWRIGHT_API_BASE_URL='http://127.0.0.1:8080'
npm run e2e:api-f027-f028-f033-local
```

机读：`playwright-report.json` 顶层 `stats.expected` 应为 **3**。

**Last run**: 2026-04-23 UTC — **passed**（见 `../playwright-report.json`）。
