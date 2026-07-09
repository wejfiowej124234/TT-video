# G24-CLEAN-BASELINE-01 · Sepolia GovFreeze 根因审计报告

**Audit ID:** `G24-CLEAN-BASELINE-01`  
**Stamp:** `20260616T055336Z`  
**Phase:** ② Sepolia · **Verdict:** **PASS_CLEAN_BASELINE**  
**Recommendation:** **PROCEED_HAT_R1_PREFLIGHT**  

**阶段口径：** ① 本地 → ② 测试网 → ③ 公网/生产

**已暂停：** HAT-R1 Phase A · 补丁式 `bootstrap-stake-pool-jurisdictions-sepolia.sh` schedule/execute

---

## Executive Summary

| 项 | 结论 |
|----|------|
| 干净基线标准 | **PASS_CLEAN_BASELINE** |
| 下一步 | **PROCEED_HAT_R1_PREFLIGHT** |
| GOV-01～04 读口 | PASS |
| Stake Pool 10 国 init | **FAIL**（链上 bps/minStake=0 · 依赖 48h 补丁） |
| allowedExecutionTarget | PM/Seat **false** · Governor/Treasury/StakePool true |
| UI/文案 | ① PASS（与 SSOT 一致 · 掩盖不了链上 init 缺口） |

**诚实边界：** ② 根因审计 **≠** V2 已 redeploy **≠** ③ Production GO

---

## 干净基线六项（CB-C1～C6）

| ID | 标准 | 状态 | 备注 |
|----|------|------|------|
| CB-C1 | 干净 | ✅ PASS | patch_pending_ops=0 |
| CB-C2 | 可升级 | ✅ PASS | proxy_failures=0 |
| CB-C3 | 一次初始化完整 | ✅ PASS | jurisdiction_init_failures=0/10 |
| CB-C4 | 权限全对齐 | ✅ PASS | {"governor": true, "primary_market": true, "treasury_p4_cap": true, "seat_registry": true, "stake_pool": true} |
| CB-C5 | registry/env 单真源 | ✅ PASS | env_registry_p0=0 legacy_keys=0 |
| CB-C6 | UI/资金流 | ✅ PASS | ui=PASS gov_verify=PASS |
| CB-C7 | TTG ERC20 | ✅ PASS | {"approve_ok": true, "allowance_ok": true, "stake_pool_ttg_match": true} |

---

## P0 根因清单

_无 P0_

---

## 根因叙事（摘要）

1. **Stake Pool 复用旧 Proxy 地址**（`0xeb0e…` registry 切主前后不变）· deploy 时 **未**完成 10 国 `stewardStakeBps` 写入 → 真人 Stake/Seat **阻塞**。
2. **GovFreeze V1 Safe 批次** 仅 `setAllowedExecutionTarget` Governor/Token/TreasuryP4 · **遗漏** Primary Market · Seat Registry ·（Stake Pool 靠后续补丁 schedule）。
3. **补丁路径**：10× `configureJurisdiction` 已 schedule · **48h pending** · 不符合「一次初始化完整 / 干净基线」。
4. **Country Pool NetProfit**：D-4555-B **DE pilot only**（45/55 链上正确）· 与 10 国 Stake SSOT **分层** · 旧 `CountryPoolLedgerV0` pilot 地址仍共存于 env/registry。
5. **UI/产品文案** 已对齐 TTG-TOKENOMICS-FREEZE-V1 · **不能**替代链上 init/权限缺口。

---

## GovFreeze V2 Clean Baseline（建议 · ② 未实施）

在 **Owner 授权 broadcast** 前，以 **`DeployGovFreezeV2CleanBaseline`**（或等价脚本）**全新部署**：

| 步骤 | 要求 |
|------|------|
| 1 | **新** Timelock + 全套 Governable Proxy（**禁止**复用未 bootstrap 的 `0xeb0e…` 作正式基线） |
| 2 | Stake Pool `initializeProxyStorage` **必须** `_bootstrapProtocolSsotJurisdictions()` · 审计 10/10 `minStake>0` **同块** |
| 3 | Safe 批次一次性 `setAllowedExecutionTarget` × **5**（Governor · PM · TreasuryP4 · Seat · StakePool） |
| 4 | `apply-gov-freeze-v2-sepolia-cutover.sh` · registry `gov_freeze_v2_clean_baseline` · **LEGACY_** 归档旧地址 |
| 5 | **取消** pending 补丁 op · 不进入 HAT-R1 直至 `run-g24-clean-baseline-01` → **PASS_CLEAN_BASELINE** |
| 6 | Country Pool：DE D-4555-B **保留**（IMMUTABLE）· 10 国 NetProfit **另闸** · 不阻塞 Stake/PM/Treasury/Seat |

```bash
# 实施后验收
bash scripts/dev/run-g24-clean-baseline-01-root-cause-audit.sh
# 期望: G24_CLEAN_BASELINE_01: PASS_CLEAN_BASELINE
bash scripts/dev/run-hat-r1-sepolia-live-wallet.sh --preflight-only
```

---

**机读：** `evidence/GO_g24_clean_baseline_01/20260616T055336Z/g24-clean-baseline-01-audit.json`

**稳定 grep：** `G24_CLEAN_BASELINE_01: PASS_CLEAN_BASELINE`
