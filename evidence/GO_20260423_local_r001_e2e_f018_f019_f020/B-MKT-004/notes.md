# B-MKT-004 · F-020（E2E）

覆盖 **3** 条 Playwright：星标 `POST|GET`、order `DELETE`、双星标 + `listing` 400 保列表。

## 前置

- `DATABASE_URL=postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust`
- API: `target/debug/traveltrust-api.exe`，`PORT=8080`，`SEED_TEST_ACCOUNTS=1`，`P3_CHAIN_OFF=1`，`PLAYWRIGHT_RELAX_META_CHAIN_GUARD=1`，`CHAIN_RPC_URL` 空

## 复跑

```bash
./target/debug/traveltrust-api.exe   # 仓库根，环境同上

cd frontend
export DATABASE_URL='postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust'
export SKIP_API_BUILD=1
npm run e2e:api-d-com-018-020-local
```

机读：`playwright-report.json` → `stats.expected` **= 7**。

