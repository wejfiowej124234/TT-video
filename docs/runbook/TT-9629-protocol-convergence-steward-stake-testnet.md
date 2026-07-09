# TT-9629 · Protocol Convergence · Steward 链上 stake（②）

**Status:** **② Anvil 可验** · **Sepolia/staging 另闸**  
**阶段：** **② 测试网** — **不** 替代 **③ 生产 GO** · **不** 冒充 **①** `chain_off`

**SSOT：** [protocol-convergence-P1-memo](../spec/governance-token/protocol-convergence-P1-memo.md)

---

## 执行顺序

| 序 | 动作 | 收口 |
|----|------|------|
| **0** | **部署前置闸**（ABI + SSOT hash + quote） | [TT-9630](./TT-9630-protocol-convergence-testnet-pregate.md) · `bash scripts/gates/check-protocol-convergence-pregate.sh` |
| **1** | **① 全链**（API + Admin） | `bash scripts/dev/smoke-steward-onboarding-local.sh` **exit 0** |
| **2** | **② Anvil 链上 stake** | `bash scripts/dev/smoke-steward-stake-anvil.sh` **exit 0** |
| **3** | **Sepolia / staging 部署** | `bash scripts/dev/deploy-steward-stake-pool-testnet.sh` → `.env` **`REGION_STEWARD_STAKE_POOL_ADDRESS`** |
| **4** | **API 读链** | `GET /api/v1/steward/stake-status` + Anvil smoke（含 ephemeral API HTTP 对拍） |
| **5** | **测试网只读验收** | `bash scripts/dev/smoke-steward-stake-testnet-readonly.sh`（部署后） |
| **6** | **Sepolia fork 预演** | `bash scripts/dev/smoke-steward-stake-sepolia-fork.sh`（真实 TTG · 非 broadcast） |

**禁止假完成：** ① smoke **≠** ② Anvil stake **≠** staging **`report.json` GO**。

---

## §1 · Anvil（本机 ② 切片）

```bash
bash scripts/dev/smoke-steward-stake-anvil.sh
```

证据：[evidence/GO_phase2_steward_stake_anvil/README.md](../../evidence/GO_phase2_steward_stake_anvil/README.md)

---

## §2 · Sepolia / staging（须凭据 · 勿提交）

**预检（不 broadcast）：**

```bash
DRY_RUN=1 bash scripts/dev/deploy-steward-stake-pool-testnet.sh
```

**部署：**

```bash
# 根 .env：CHAIN_RPC_URL · CHAIN_ID · GOVERNANCE_TOKEN_ADDRESS · 有余额的 PRIVATE_KEY
bash scripts/dev/deploy-steward-stake-pool-testnet.sh
```

证据目录：[evidence/GO_phase2_steward_stake_sepolia/README.md](../../evidence/GO_phase2_steward_stake_sepolia/README.md)

写入根 `.env`：

```env
REGION_STEWARD_STAKE_POOL_ADDRESS=0x…
```

**只读烟测（部署后 · 不要求 stake tx）：**

```bash
bash scripts/dev/smoke-steward-stake-testnet-readonly.sh
# 可选 HTTP：STEWARD_TESTNET_API_SMOKE=1（API 已重启并加载 pool 地址）
```

---

## §3 · 手工 forge（等价于 §2 部署脚本）

```bash
export PRIVATE_KEY=0x…          # 部署者
export CHAIN_RPC_URL=https://…  # Sepolia 或 staging 链
export STEWARD_TTG_ADDRESS=0x…    # 可选；缺省用 GOVERNANCE_TOKEN_ADDRESS

cd contracts
forge script script/DeployRegionStewardStakePool.s.sol:DeployRegionStewardStakePool \
  --rpc-url "$CHAIN_RPC_URL" --broadcast -vv
```

写入根 `.env`（示例键，按 14 §ABI 对拍）：

```env
REGION_STEWARD_STAKE_POOL_ADDRESS=0x…
```

---

## 互指

| 文档 | 用途 |
|------|------|
| [PHASE2-TESTNET-ACCEPTANCE.md](./PHASE2-TESTNET-ACCEPTANCE.md) | ② 总验收 · **轨 6** |
| [contracts/README.md](../../contracts/README.md) | Foundry 部署惯例 |
| [fund-flow-ssot §3](../spec/governance-token/fund-flow-ssot.v1.md) | TTG 质押轨 |

---

## 变更记录

| Date | Note |
|------|------|
| 2026-05-27 | §2 部署/只读烟测脚本；Anvil smoke 默认 ephemeral API HTTP 对拍 |
| 2026-05-27 | 初版：DeployRegionStewardStakePool + Anvil smoke |
