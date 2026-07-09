# Phase ② · GovFreeze V1 Sepolia · 切主 + HAT 证据索引

**Baseline stamp:** `20260616T023243Z`（唯一链上治理 Proxy 基线 · 勿用 `20260616T021904Z`）  
**Phase:** **② Sepolia** · **≠** staging GO · **≠** ③ Production GO

---

## 1. 切主（env / registry / API / frontend）

| 动作 | 命令 | 证据 |
|------|------|------|
| 合并 GovFreeze 地址 | `bash scripts/dev/apply-gov-freeze-v1-sepolia-cutover.sh` | `evidence/GO_phase2_gov_freeze_v1_sepolia/cutover/` |
| 链上 16 项回归 | `bash scripts/dev/verify-gov-freeze-v1-sepolia-onchain.sh` | `evidence/GO_phase2_gov_freeze_v1_sepolia/latest/` |

**写入面：** `.env.phase2-chain-deploy.local` · 根 `.env` · `frontend/.env.local` · `registry/protocol-convergence-deployments.v1.yaml`

---

## 2. 本地 UI 巡检（① vitest）

```bash
bash scripts/dev/audit-gov-freeze-v1-governance-ui-local.sh
```

覆盖：治理 Hub · params/Treasury · 主理人 · Country Pool · Primary Market · 兑换/收益 · 提案路由。

---

## 3. 全链路 HAT（②）

```bash
cargo run -p traveltrust-api &
bash scripts/dev/run-gov-freeze-v1-sepolia-hat-full-chain.sh
```

顺序：权限 → 兑换 → 质押 → Seat → 提案读面 → 收益 → 退出读面 → UI vitest。

**grep：** `TT_GOV_FREEZE_V1_HAT_FULL_CHAIN_SUMMARY: PASS`

---

## 4. 真人测试入口

| 项 | 状态 |
|----|------|
| 切主 + verify + API 烟测 | ✅ |
| 钱包 tx 全链（execute/退出） | ☐ 真人阶段 · 48h Timelock |
| ③ Production GO | ☐ |

**诚实边界：** 本包 = ② Sepolia 切主 + 读面 HAT · **≠** ③ GO。
