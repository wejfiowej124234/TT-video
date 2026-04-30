# D-IDX-001 · F-029（E2E）

`e2e/f029-f030-f031-request.spec.ts` — internal indexer-status。

## 前置

- `DATABASE_URL=postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust`
- API: `target/debug/traveltrust-api.exe`，`PORT=8080`，`SEED_TEST_ACCOUNTS=1`，`P3_CHAIN_OFF=1`，`PLAYWRIGHT_RELAX_META_CHAIN_GUARD=1`，`CHAIN_RPC_URL` 空

## 复跑

```bash
# 仓库根：启动 API（环境同上）
./target/debug/traveltrust-api.exe

# frontend
export DATABASE_URL='postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust'
export SKIP_API_BUILD=1
npm run e2e:api-f029-f030-f031-local
```

机读：`playwright-report.json` 中 `stats.expected` 应为 **4**。

