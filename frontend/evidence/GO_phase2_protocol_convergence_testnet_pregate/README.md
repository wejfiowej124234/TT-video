# Protocol Convergence · ② 测试网部署前置闸 · ① 本地证据

**阶段：** **① 本地机读** — 部署前须绿；**②** 填测试网地址后再跑链/HTTP 对拍。

**Runbook：** [TT-9630-protocol-convergence-testnet-pregate](../../../docs/runbook/TT-9630-protocol-convergence-testnet-pregate.md)

---

## 推送前（须 exit 0）

```bash
cd contracts && forge build && cd ..
bash scripts/dev/sync-abi-from-forge.sh
bash scripts/gates/check-protocol-convergence-pregate.sh
bash scripts/dev/smoke-protocol-quote-parity-local.sh

cargo test -p traveltrust-api cn_fr_cumulative_stake_quote redemption_quote_cn -- --nocapture
cd frontend && npm run test -- protocolSsot.v1 accountNavNamingP3 --run
```

**末行锚点：** `TT_SMOKE_PROTOCOL_QUOTE_PARITY: OK`

---

## 登记真源

| 项 | 路径 |
|----|------|
| SSOT hash | `registry/protocol-convergence-deployments.v1.yaml` |
| ABI | `contracts/abi/RegionStewardStakePool.json` · `CountryPoolRedemptionEpochV0.json` |
| 对拍 | `scripts/gates/check-protocol-quote-parity.py` |

---

## ② 部署后（另闸）

```bash
bash scripts/dev/smoke-steward-stake-testnet-readonly.sh
# 填 COUNTRY_POOL_REDEMPTION_EPOCH_CN_ADDRESS 后：
CHAIN_RPC_URL=… REGION_STEWARD_STAKE_POOL_ADDRESS=… \
  COUNTRY_POOL_REDEMPTION_EPOCH_CN_ADDRESS=… \
  bash scripts/gates/check-protocol-quote-parity.sh
```

**非** staging `report.json` **GO**。
