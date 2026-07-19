# TT · Clean Sepolia Redeploy V3.1.1（A1-R1 正式改轨）

**Machine:** `TT_CLEAN_SEPOLIA_REDEPLOY_V311`  
**Registry:** [`registry/psg-clean-sepolia-redeploy-v311.v1.yaml`](../../registry/psg-clean-sepolia-redeploy-v311.v1.yaml)  
**Economic SSOT:** [TT-ECONOMIC-CONSTITUTION-V3.1.1-FINAL.md](../spec/governance-token/TT-ECONOMIC-CONSTITUTION-V3.1.1-FINAL.md) · **LOCKED**  
**Phase A:** [TT-PHASE-A-FULL-ENGINEERING-CLOSURE-LATEST.md](./TT-PHASE-A-FULL-ENGINEERING-CLOSURE-LATEST.md) · **COMPLETE**（工程）  
**Recorded:** 2026-07-18T09:10:00Z  
**Status:** **COMPLETE · LOCKED** · Gaps CLOSED · Full Alignment **PASS** · **`TT_PSG_V311_SEPOLIA_CLEAN_BASELINE_CERT: PASS`（唯一 ② 基线）** · **RC Preparation ACTIVE** · **`TT_PSG_SEPOLIA_FREEZE: NOT_CLAIMED`** · **非** Production GO

**Certification:** [TT-PSG-V311-SEPOLIA-CLEAN-BASELINE-CERT-LATEST.md](./TT-PSG-V311-SEPOLIA-CLEAN-BASELINE-CERT-LATEST.md) · Registry [`psg-v311-sepolia-clean-baseline-cert.v1.yaml`](../../registry/psg-v311-sepolia-clean-baseline-cert.v1.yaml) · Freeze [`v311-sepolia-address-matrix-freeze.v1.json`](../../registry/v311-sepolia-address-matrix-freeze.v1.json)  

**RC track:** [TT-PSG-SEPOLIA-RC-PREPARATION-LATEST.md](./TT-PSG-SEPOLIA-RC-PREPARATION-LATEST.md) · **禁止**新增协议功能 / 改 ACTIVE 地址矩阵

---

## 0 · 改轨（写死）

| 旧 | 新 |
|----|-----|
| `REDEPLOY_OR_UPGRADE` · in-place Timelock Bundle U-PM | **`CLEAN_SEPOLIA_REDEPLOY`** |
| Phase B Entry Review → schedule → 48h → execute | **废止**（未 schedule） |
| Gap `BLOCKED_BY_A1_R1` / `TIMELOCK_ONLY` | **`REDEPLOY_RESOLUTION`** · blocker **`CLEAN_SEPOLIA_REDEPLOY`** |

**禁止：** 将 T-04 / T-05 / DEP-01 / R-01 直接标 `CLOSED` / `PASS`，直至新栈 on-chain verify + Full Constitution Re-Alignment **全部 PASS**。  
**禁止：** 物理删除历史 Evidence / 旧部署记录 / 假装旧合约不存在。  
**允许：** 活动配置、Registry ACTIVE、UI 移除旧地址引用；旧块标 `LEGACY_SUPERSEDED` / `DEPRECATED`。

---

## 1 · 硬停旧 Bundle

```bash
# 下列任一 schedule / Safe batch / confirm 均 exit 2
bash scripts/dev/run-owner-pm-remediation-exec.sh schedule
bash scripts/dev/run-owner-pm-remediation-wallet-sign.sh prepare-safe-batch
bash scripts/dev/run-phase-b-wallet-sign-confirm-timelock.sh
```

只读 `precheck` / `verify-schedule`（无状态翻转）可保留诊断；**不得**翻转 `entry_review_pass` 或进入 `PHASE_B_TIMELOCK`。

---

## 2 · 部署硬约束（构造期）

| 约束 | |
|------|--|
| `usdcTreasury` / sink | **必须** = 同次部署的 `GovernanceTreasuryP4Cap` proxy |
| **禁止** | 缺省回落 `TIMELOCK_ADMIN` / Safe |
| Caps | `800_000 / 1_200_000 / 3_000_000` TTG（`TtgGovFreezeConstants`） |
| Timelock | 新实例 · delay `172800` · admin = Safe |
| Baseline key | `v311_sepolia_clean_baseline` |

Forge: `contracts/script/DeployV311SepoliaCleanBaseline.s.sol`  
Broadcast: `TRAVELTRUST_PHASE2_SEPOLIA_BROADCAST_OK=1 bash scripts/dev/phase2-sepolia-broadcast-v311-clean-baseline.sh`  
Cutover: `bash scripts/dev/apply-v311-sepolia-clean-cutover.sh`

---

## 3 · 阶梯（写死）

```text
HARD_STOP Bundle
  → Deploy V311 clean stack（sink=P4Cap）
  → Evidence GO_phase2_v311_sepolia_clean_baseline/
  → Cutover Registry · env · BE · FE · IX · Runtime
  → On-chain verify（roles · caps · sink · rails）
  → Local → Sepolia 全链路 Re-Alignment
  → Gap Matrix regen · T-04/T-05/DEP-01/R-01 CLOSED（理由=REDEPLOY_RESOLUTION）
  → PSG + Git Baseline 刷新（新周期 · 不改 v1.1.0-psg-go.20260717 archive）
  → gov_freeze_v2_clean_baseline → LEGACY_SUPERSEDED
```

---

## 4 · 相关（LEGACY 只读）

- [TT-A1-R1-T04-T05-RESOLUTION-PLAN-LATEST.md](./TT-A1-R1-T04-T05-RESOLUTION-PLAN-LATEST.md) · **SUPERSEDED · path abandoned**
- [TT-OWNER-TIMELOCK-REMEDIATION-BUNDLE-U-PM-PLAN-LATEST.md](./TT-OWNER-TIMELOCK-REMEDIATION-BUNDLE-U-PM-PLAN-LATEST.md) · **ABANDONED**
- [TT-PHASE-B-ENTRY-REVIEW-LATEST.md](./TT-PHASE-B-ENTRY-REVIEW-LATEST.md) · **SUPERSEDED_BY_CLEAN_REDEPLOY**
- [GOV-FREEZE-V2-SEPOLIA-BASELINE-FREEZE.md](../spec/governance-token/GOV-FREEZE-V2-SEPOLIA-BASELINE-FREEZE.md) · 维护窗被本轨取代（待 SUPERSEDED）
