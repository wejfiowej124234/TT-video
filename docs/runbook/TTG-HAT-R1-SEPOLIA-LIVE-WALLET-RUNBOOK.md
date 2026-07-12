# HAT-R1 · Sepolia 真人钱包全链路验收

**状态：** **✅ Phase A PASS** · **⏳ Phase B WAIT**（~48h Timelock）· **GovFreeze V2 + TTG 已冻结**  
**SSOT:** [GOV-FREEZE-V2-SEPOLIA-BASELINE-FREEZE.md](../spec/governance-token/GOV-FREEZE-V2-SEPOLIA-BASELINE-FREEZE.md) · `TTG-TOKENOMICS-FREEZE-V1` · TTG `0x2837ea0c50e27d59b88af617abbb231a040062c5`  
**Phase:** ② Sepolia · **≠** ③ Production GO

---

## 基线冻结（维护期 · 禁止新功能 / GOV 参数变更）

```bash
bash scripts/dev/record-gov-freeze-v2-sepolia-baseline-freeze.sh
# TT_GOV_FREEZE_V2_BASELINE_FREEZE: RECORDED
```

---

## Governance Concentration Audit（800 万 TTG 场景 · GOV-02/03）

```bash
bash scripts/dev/run-governance-concentration-audit-sepolia.sh
# TT_GOV_CONCENTRATION_SUMMARY: PASS
```

验证：quorum 400 bps · GOV-03 cap_disabled（legacy Sepolia 可能仍 400 bps）· Seat 质押上限 · HAT-R1 proposal forVotes · 捕获风险披露（大持有人 + Timelock 48h 缓释 · 见 GENESIS §7.2）。

---

## Phase B（Timelock 到期后 · 须 Enterprise HAT PASS）

**Phase B 前新增闸：** [TT_GOVERNANCE_ENTERPRISE_HAT](TT-GOVERNANCE-ENTERPRISE-HAT-REVIEW.md) — L1～L9 企业级人工验收（业务/权限/资金/体验/认知 · **不验代码**）。

```bash
# Timelock 等待期间完成
bash scripts/dev/run-tt-governance-enterprise-hat-review.sh
# 真人 L1-L9 签核
bash scripts/dev/record-tt-governance-enterprise-hat-signoff.sh --all-pass
export TT_GOVERNANCE_ENTERPRISE_HAT_OK=1

# Timelock 到期后
export HAT_R1_LIVE_WALLET_OK=1
export HAT_R1_BROWSER_ACCEPT_OK=1
# 可选：显式覆盖；默认由 hat_r1_resolve_evid_dir 解析 latest-stamp / 最新 Phase A 目录
# export HAT_R1_EVID_DIR=evidence/GO_hat_r1_sepolia/<stamp>
bash scripts/dev/run-hat-r1-phase-b-when-ready.sh
```

## 前置（顺序写死）

0. **GovFreeze V2 Clean Baseline**（唯一 ② 测试网基线）

```bash
# 已部署则跳过
bash scripts/dev/run-g24-clean-baseline-01-root-cause-audit.sh
# 须: G24_CLEAN_BASELINE_01: PASS_CLEAN_BASELINE
```

1. **真人浏览器逐页验收**（治理 · Primary Market · Seat · Country Pool · Treasury · 收益 · 退出）

```bash
# 终端 A: cd frontend && npm run dev   # :3012
# 终端 B: API :8080（可选 · L4 证据）
bash scripts/dev/run-gov-freeze-v2-browser-page-acceptance.sh
# 签核 evidence/GO_gov_freeze_v2_browser_acceptance/latest/HUMAN-PAGE-ACCEPTANCE-CHECKLIST.md
export HAT_R1_BROWSER_ACCEPT_OK=1
```

2. `bash scripts/dev/run-ttg-tokenomics-ui-alignment-audit.sh` → **G24-UI-ALIGN-01 PASS**（browser 脚本内已跑）
3. 钱包：Sepolia ETH + USDC ≥ 100 + TTG ≥ `minStake(jurisdiction)`（见下）
4. API `:8080` · 前端 `:3012`（截图/API 证据）

**GOV-04 vs Seat：** 见 [GOV-04-SEAT-STAKE-ADMISSION-AUDIT.md](../spec/governance-token/GOV-04-SEAT-STAKE-ADMISSION-AUDIT.md) · Primary Market 单钱包 **不能** 单独满足 Seat min stake · HAT-R1 Step2 用非 PM TTG 源。

---

## 命令

```bash
# 全序列：浏览器机读 + 人工签核闸 + Phase A
export HAT_R1_LIVE_WALLET_OK=1
export HAT_R1_WALLET_PK=0x...   # 真人 Sepolia 钱包
bash scripts/dev/run-hat-r1-govfreeze-v2-full-sequence.sh

# 预检（不发 tx）
bash scripts/dev/run-hat-r1-sepolia-live-wallet.sh --preflight-only

# Phase A（购买 → stake → seat → 提案 → 投票 → queue）
export HAT_R1_LIVE_WALLET_OK=1
export HAT_R1_WALLET_PK=0x...   # 真人 Sepolia 钱包
bash scripts/dev/run-hat-r1-sepolia-live-wallet.sh --phase a

# ≥48h 后 Phase B（execute → treasury → unstake）
export HAT_R1_EVID_DIR=evidence/GO_hat_r1_sepolia/<stamp>
bash scripts/dev/run-hat-r1-sepolia-live-wallet.sh --phase b

# 页面截图（前端已启动）
node scripts/dev/capture-hat-r1-screenshots.mjs --evid evidence/GO_hat_r1_sepolia/latest
```

---

## 每步证据（自动落盘 · **五层验收标准**）

**最终验收：** 每一步须同时收集下列五层证据（缺一视为该步 **未完成**）：

| 层 | 含义 | 落盘路径（每步目录内） |
|----|------|------------------------|
| **L1 页面展示** | 真人可见 UI · URL · 金额/权限文案 | `screenshots/` · `screenshots-README.md` · `capture-hat-r1-screenshots.mjs` |
| **L2 钱包签名** | 用户确认的交易 · tx hash | `tx-*.json` · `receipt-*.json` |
| **L3 链上事件** | receipt logs · 业务 event | `events-*.json` |
| **L4 API 返回** | 后端读面与页面一致 | `api-*.json` · `api-*-meta.json` |
| **L5 数据库状态** | 持久化状态（若 `DATABASE_URL` 可用） | `db-snapshot.sql` · `db-snapshot-meta.json` |

| 步 | 目录 | 五层要点 |
|----|------|----------|
| 0 | `step-00-preflight/` | 页面 manifest · protocol-reference/stake-quote API · DB baseline |
| 1 | `step-01-purchase/` | Primary Market 页 · approve/purchase tx · Transfer/Purchase events · quote API |
| 2 | `step-02-stake/` | 工作台 stake 区 · approve/stake tx · StewardStaked · stake-status API |
| 3 | `step-03-seat-application/` | Seat 申请 UI · （链下/API）· applications 读面 |
| 4–6 | `step-04..06-*` | 提案/投票/queue 页 · Governor tx · 提案 API · **EXECUTE_EARLIEST_UNIX.txt** |
| 7–10 | Phase B | execute · treasury · requestRelease · 同上五层 |

**grep：** `TT_HAT_R1_SUMMARY: PREFLIGHT_OK` · `TT_HAT_R1_SUMMARY: PASS phase=a|b`

---

## 48h Timelock

GovFreeze Timelock **delay = 172800s**。Phase A 结束写入 `EXECUTE_EARLIEST_UNIX.txt` · Phase B **不得**提前 execute（除非明确 `HAT_R1_FORCE_EXECUTE=1` 且接受 revert 风险）。
