# B-ORD-006 · F-011（E2E）

`POST …/set-escrow-address` → `GET …/orders/:id` 读回 `escrow_address`（链下占位；真链托管仍 ISS-007）。

## 前置

- `DATABASE_URL=postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust`
- API: `target/debug/traveltrust-api.exe`，`PORT=8080`，`SEED_TEST_ACCOUNTS=1`，`P3_CHAIN_OFF=1`，`PLAYWRIGHT_RELAX_META_CHAIN_GUARD=1`，`CHAIN_RPC_URL` 空

## 复跑

```bash
./target/debug/traveltrust-api.exe

cd frontend
export DATABASE_URL='postgres://traveltrust:traveltrust@127.0.0.1:5432/traveltrust'
export SKIP_API_BUILD=1
npm run e2e:api-b-orders-local
```

机读：`playwright-report.json` → `stats.expected` **= 3**。

