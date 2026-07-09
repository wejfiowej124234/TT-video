# TT-9630 · Protocol Convergence · ② 测试网部署前置闸

**Status:** **① 本地机读绿** · **② 部署后填地址再验**  
**阶段：** **② 测试网** — **不** 冒充 **③ 生产 GO**

**SSOT：** [protocol-convergence-P1-memo](../spec/governance-token/protocol-convergence-P1-memo.md) · [TT-9629](./TT-9629-protocol-convergence-steward-stake-testnet.md)

---

## 目标（四相等式）

部署后须能验证：

**SSOT（yaml hash） = 合约参数（immutables / minStake） = API 镜像（quote） = 前端显示（protocolSsot.v1.ts）**

---

## 序 0 · 部署前（仓库根 · ①）

```bash
cd contracts && forge build && cd ..
bash scripts/dev/sync-abi-from-forge.sh   # 含 RegionStewardStakePool + CountryPoolRedemptionEpochV0 ABI
bash scripts/gates/check-protocol-convergence-pregate.sh
bash scripts/dev/smoke-protocol-quote-parity-local.sh
```

| 产物 | 路径 |
|------|------|
| SSOT hash 登记 | `registry/protocol-convergence-deployments.v1.yaml` → `protocol_ssot.content_sha256` |
| ABI | `contracts/abi/RegionStewardStakePool.json` · `CountryPoolRedemptionEpochV0.json` |
| 对拍脚本 | `scripts/gates/check-protocol-quote-parity.py` |

**SSOT yaml 变更时：** `python scripts/dev/compute-protocol-ssot-hash.py` → 同批更新 registry `content_sha256`。

---

## 序 1 · 部署（②）

| 合约 | 脚本 | `.env` 键 |
|------|------|-----------|
| `RegionStewardStakePool` | `bash scripts/dev/deploy-steward-stake-pool-testnet.sh` | `REGION_STEWARD_STAKE_POOL_ADDRESS` |
| `CountryPoolRedemptionEpochV0`（CN 试点） | `forge script …DeployCountryPoolRedemptionEpochV0… --broadcast` | `COUNTRY_POOL_REDEMPTION_EPOCH_CN_ADDRESS` |

部署日志须打印地址行（与 Anvil smoke 同键名）。

---

## 序 2 · 部署后只读（②）

```bash
# 根 .env：CHAIN_RPC_URL + 上表地址
bash scripts/dev/smoke-steward-stake-testnet-readonly.sh
CHAIN_RPC_URL=… REGION_STEWARD_STAKE_POOL_ADDRESS=… \
  bash scripts/gates/check-protocol-quote-parity.sh
```

**HTTP（API 已加载地址）：**

```bash
PROTOCOL_QUOTE_HTTP=1 API_BASE=https://staging-api.example \
  python scripts/gates/check-protocol-quote-parity.py --http
```

---

## API / 前端对拍要点

| 路由 | 期望（例 CN+FR） |
|------|------------------|
| `GET /api/v1/steward/stake-quote?jurisdictions=CN,FR` | `cumulative_steward_stake_bps: 850` · `cumulative_ttg_units_required: 850000` |
| `GET /api/v1/redemption/quote?jurisdiction=CN` | `redemption_max_nav_pct_bps: 1000` · `redemption_window_days_per_quarter: 15` |
| `GET /api/v1/governance/protocol-reference` | `protocol_ssot_version: 1.0.1` |

链上（已部署时）：`minStakeAmount(CN)` = `10_000_000 ether × 400 bps / 10000`；赎回合约 `maxNavPctBps()==1000` · `windowSeconds()==1296000`。

---

## 互指

| 文档 | 用途 |
|------|------|
| [registry/protocol-convergence-deployments.v1.yaml](../../registry/protocol-convergence-deployments.v1.yaml) | 地址登记模板 |
| [evidence/GO_phase2_protocol_convergence_testnet_pregate](../../frontend/evidence/GO_phase2_protocol_convergence_testnet_pregate/README.md) | ① 绿集命令 |

---

## 变更记录

| Date | Note |
|------|------|
| 2026-05-28 | 初版：pregate · ABI · SSOT hash · quote 对拍 |
