# G24-P-UPGRADE-01 · Proxy 架构闸（Sepolia broadcast 前必过）

**Gate ID:** `G24-P-UPGRADE-01`  
**Phase:** **② Sepolia** · broadcast **前**执行  
**SSOT 经济参数:** [TTG-TOKENOMICS-FREEZE-V1.md](TTG-TOKENOMICS-FREEZE-V1.md)（数值不变）  
**机读 posture:** [registry/g24-p-upgrade-01-contract-posture.v1.yaml](../../../registry/g24-p-upgrade-01-contract-posture.v1.yaml)

---

## 0 · 硬纪律

| 项 | 要求 |
|----|------|
| **Governable Shell** | 正式基线地址 **MUST** = `TimelockUpgradeableProxy` · **admin = GOV Timelock** |
| **禁止** | 裸 `new Implementation()` 地址写入 env / registry 作为测试网正式基线 |
| **Immutable Core** | CountryPool Ledger + Settlement vaults **禁止** Proxy 换逻辑（G23-04 ABI 冻结） |
| **Timelock** | 控制面 · `delay`/`admin` **immutable** · fresh deploy · **不作 Proxy 用户地址** |

---

## 1 · 逐合约 posture 矩阵

| 合约 | Posture | Sepolia 正式地址 | 升级路径 |
|------|---------|------------------|----------|
| **TravelTrustGovernor** | PROXY_REQUIRED | Governor **Proxy** | Timelock `upgradeTo` |
| **GovernanceTimelock** | CONTROLLER_NON_UPGRADEABLE | Timelock 本体 | 新 Timelock 部署 |
| **GovernanceTreasuryP4Cap** | PROXY_REQUIRED | Treasury P4 **Proxy** | Timelock `upgradeTo` |
| **TtgPrimaryMarketV1** | PROXY_REQUIRED | Primary Market **Proxy** | Timelock `upgradeTo` |
| **TtgSeatConcentrationRegistry** | PROXY_REQUIRED | Seat Registry **Proxy** | Timelock `upgradeTo` |
| **RegionStewardStakePool** | PROXY_REQUIRED | Stake Pool **Proxy** | Timelock `upgradeTo` |
| **CountryPoolNetProfitLedger** | IMMUTABLE_EXEMPT | 直 deploy · ABI 冻结 | **禁止** Proxy |
| **CountryPool Settlement vaults** | IMMUTABLE_EXEMPT | 直 deploy | **禁止** Proxy |

---

## 2 · 机读验收

```bash
bash scripts/gates/check-g24-p-upgrade-01-proxy-architecture.sh
```

末行须：`G24_P_UPGRADE_01_SUMMARY: PASS`

**链上 broadcast 后对拍（附加）：**

```bash
cast call $PROXY "admin()(address)"   # == GOV_FREEZE_V1_TIMELOCK
cast call $PROXY "implementation()(address)"  # non-zero
```

---

## 3 · 与 TT-PHASE2-CONTRACT-DEPLOYMENT-READINESS 关系

- **Escrow / Ledger 45/55 数学** 仍为 **Immutable Core** — 与本闸 **IMMUTABLE_EXEMPT** 一致  
- **GOV / Treasury P4 / Primary Market / Seat / Stake Pool** 属 **Governable Shell** — 本闸 **强制 Proxy**（覆盖旧「全仓零 Proxy」中对 Shell 的 redeploy-only 叙述）

---

## 4 · 变更记录

| Version | Date | Note |
|---------|------|------|
| v1-20260616 | 2026-06-16 | 初版 · G24-P-UPGRADE-01 · Sepolia GOV 基线 Proxy 强制 |
