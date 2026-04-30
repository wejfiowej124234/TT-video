# D-COM-002 · F-015（E2E）

**2** 条 Playwright：发帖+详情一致；Bearer 发帖 + 无头 `GET` 详情。

## 前置

- `DATABASE_URL=postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust`
- API: `target/debug/traveltrust-api.exe`，`PORT=8080`，`SEED_TEST_ACCOUNTS=1`，`P3_CHAIN_OFF=1`，`PLAYWRIGHT_RELAX_META_CHAIN_GUARD=1`，`CHAIN_RPC_URL` 空

## 复跑

```bash
# 仓库根启动 API（环境同上）
./target/debug/traveltrust-api.exe

cd frontend
export DATABASE_URL='postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust'
export SKIP_API_BUILD=1
npm run e2e:api-d-com-015-017-local
```

机读：`playwright-report.json` → `stats.expected` **= 6**。

