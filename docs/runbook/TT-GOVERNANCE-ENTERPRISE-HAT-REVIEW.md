# TTG Governance Enterprise Human Acceptance Review

**Gate ID:** `TT_GOVERNANCE_ENTERPRISE_HAT`  
**Phase:** **② Sepolia · 企业级真人验收** · **≠** 代码审查 · **≠** ③ Production GO  
**SSOT:** [TTG-TOKENOMICS-FREEZE-V1.md](../spec/governance-token/TTG-TOKENOMICS-FREEZE-V1.md) · [GOV-FREEZE-V2-SEPOLIA-BASELINE-FREEZE.md](../spec/governance-token/GOV-FREEZE-V2-SEPOLIA-BASELINE-FREEZE.md)

---

## 验收哲学

| 验证 | 不验证 |
|------|--------|
| 业务 · 权限 · 资金 · 体验 · 认知 | 代码实现 · 单元测试绿集 |

**通过条件：** L1～L9 **全部 PASS** → 才允许 HAT-R1 **Phase B**（Execute → Treasury → Unstake）。

---

## 命令

```bash
# 0) 执行审核（机读辅助 + SSOT/RBAC 对拍 · 生成 ENTERPRISE-HAT-AUDIT-EXECUTION.json）
bash scripts/dev/run-tt-governance-enterprise-hat-audit.sh

# 1) 生成清单 + 机读辅助（非 PASS · 仅 prep）
bash scripts/dev/run-tt-governance-enterprise-hat-review.sh

# 2) 真人确认审核报告后签核（推荐 --from-audit）
export TT_GOVERNANCE_ENTERPRISE_HAT_SIGNER="Sebastian Ward"
bash scripts/dev/record-tt-governance-enterprise-hat-signoff.sh --from-audit
# 或逐层：--layer L4 --verdict PASS --notes "..."

# 3) 闸口校验
bash scripts/dev/assert-tt-governance-enterprise-hat-pass.sh

# 4) Phase B（须 Enterprise HAT + Timelock 到期）
export HAT_R1_LIVE_WALLET_OK=1
export TT_GOVERNANCE_ENTERPRISE_HAT_OK=1
bash scripts/dev/run-hat-r1-phase-b-when-ready.sh
```

**前置：** 前端 `:3012` · API `:8080` · Sepolia 钱包 · GovFreeze V2 基线 ACTIVE。

---

## 九层结构（摘要）

| 层 | 焦点 | 关键闸 |
|----|------|--------|
| **L1** | UI/UX · 3 秒认知 | 无旧分红/按持仓分现/Seat 退 USDC/单池叙事 · 多国家池 · P1–P4 |
| **L2** | TTG 购买 | 游客/持币人/Admin · GOV-04 · 25k · 三轮 · USDC 流向 |
| **L3** | Seat 主理人 | Stake 门槛 · 10 国 · 申请/审核/Active/Release · 180d |
| **L4** | 收益分配 | 45/55 · Steward 路径 · P4 须治理 · 无按持仓分现 |
| **L5** | Treasury | 提案→投票→Queue→Execute→支出 · 无 Admin/Seat 直转 |
| **L6** | 多身份 | Traveler/Guide/Merchant/Steward/Moderator/Admin 不串 |
| **L7** | Admin | 可见/可改/不可改边界 |
| **L8** | 异常路径 | 余额/权限/重复/释放中 · 提示与不串数据 |
| **L9** | 财务闭环 | 链上 = API = DB = 页面 |

完整勾选表见 `evidence/GO_tt_governance_enterprise_hat/<stamp>/ENTERPRISE-HAT-CHECKLIST.md`。

---

## 与 HAT-R1 关系

| 轨道 | 含义 |
|------|------|
| **HAT-R1 Phase A** | 真人钱包链上 tx 五层证据（已 PASS） |
| **Enterprise HAT** | ✅ L9 recheck PASS · **不扩 scope** |
| **CP Revenue HAT** | ✅ Four-Ledger PASS · **基线已锁定** |
| **下一轨** | 真人录屏 · Timelock 后 Phase B · [TT-GOVFREEZE-V2-ECONOMIC-BASELINE-ACCEPTANCE-ONLY.md](../../runbook/TT-GOVFREEZE-V2-ECONOMIC-BASELINE-ACCEPTANCE-ONLY.md) |
| **Concentration Audit** | GOV-02/03 机读对拍（补充 · 非替代 Enterprise HAT） |

---

## 诚实边界

- Enterprise HAT **② PASS** **≠** 全站 93 域矩阵 GO **≠** ③ Production GO
- 机读 prep（UI 扫描/API 抽样）仅为**签核辅助**，**不能**代替 L1～L9 真人 ☐
