# V311 · Post-Execute Operator Card（一等前置 · 口径已锁）

**用途：** ETA 后照抄执行 · **禁止现场决策**  
**纪律：** `FROZEN_WAITING_EXECUTE` 直至 Execute · 不改协议 / ACTIVE / Runtime / Registry / Package / **Money-Path**  
**Dry Run：** `python scripts/dev/dry-run-v311-post-execute-ladder.py` → `TT_V311_POST_EXECUTE_LADDER_DRY_RUN`  
**详册：** [TT-V311-POST-EXECUTE-LADDER-DRY-RUN-LATEST.md](./TT-V311-POST-EXECUTE-LADDER-DRY-RUN-LATEST.md)  
**口径锁：** [TT-V311-PSG-STATUS-AND-LADDER-LOCK-LATEST.md](./TT-V311-PSG-STATUS-AND-LADDER-LOCK-LATEST.md)  
**Owner 一页纸：** [TT-OWNER-REVIEW-PACK-PRE-ETA-LATEST.md](./TT-OWNER-REVIEW-PACK-PRE-ETA-LATEST.md)  
**Acceptance Book：** [TT-PRODUCTION-ACCEPTANCE-BOOK-LATEST.md](./TT-PRODUCTION-ACCEPTANCE-BOOK-LATEST.md)  
**Launch Day 时间轴：** [TT-LAUNCH-DAY-TIMELINE-LATEST.md](./TT-LAUNCH-DAY-TIMELINE-LATEST.md)  
**Evidence Index：** [TT-PRODUCTION-EVIDENCE-INDEX-LATEST.md](./TT-PRODUCTION-EVIDENCE-INDEX-LATEST.md)  
**Rollback Tree：** [TT-PRODUCTION-ROLLBACK-DECISION-TREE-LATEST.md](./TT-PRODUCTION-ROLLBACK-DECISION-TREE-LATEST.md)  
**Pre-ETA 外围准备（纸面）：** [TT-PRE-ETA-PRODUCTION-PREP-TRACK-LATEST.md](./TT-PRE-ETA-PRODUCTION-PREP-TRACK-LATEST.md)

---

## ENTRY · 触发条件 → 立即本卡（Owner 已锁 · 2026-07-19）

**唯一触发（机读）：** F-02 heartbeat 出现 `execute_allowed_now=true`  
（通常对齐 ETA `2026-07-20T11:37:37Z`；**以 heartbeat 为准**，不以口头「已到」为准）

```text
heartbeat: execute_allowed_now=true
  → 立即解除 WAIT_WINDOW
  → 立即进入本 Operator Card ENTRY
  → 不扩范围 · 不改 Frozen RC · 不触碰 Money-Path
  → S0 → S1 → S2 → S4 → S3 → S5
  → 每步：证据 + verdict · FAIL=最小修复+单项复验 · 禁止全量重跑
  → 末：汇总 F-02 执行结果 + Production Prep Gate 状态
```

**禁止触发：** `execute_allowed_now=false` / `before_eta=true` / `PASS_CLAIM=FORBIDDEN` → **保持 WAIT_WINDOW** · 禁止 S1–S5

### 每 Step 固定循环（写死）

```text
Step N:
  1) 只读证据 + verdict（先落盘 · 再裁决）
  2) PASS → 下一 Step
  3) FAIL → 仅本 Step 最小修复 → 单项复验 → PASS 才继续
  4) 禁止：全量重跑 · 借失败改 Frozen RC / 开 Money-Path / 扩审计
```

| Step | 只读证据（先） | Verdict 期望 |
|------|----------------|--------------|
| **S0** | F-02 heartbeat JSON | `execute_allowed_now=true` · state 仍合法可 Execute |
| **S1** | `F-02-gov-timelock.json` · governor state | `PASS` · `final_state_int=7` |
| **S2** | Function `VERDICT-LATEST.json` | **54/0/0** |
| **S4** | `P5-UI-UX-CERT-LATEST.json` | UI Full **PASS** |
| **S3** | `P6-PRODUCT-CERT-LATEST.json` | Product **PASS**（消费 S2+S4） |
| **S5** | `GOVERNANCE-RC-CLOSE-LATEST.json` | Governance **CLOSED** · Money-Path **DEFERRED** |

### 末汇总（本卡收口 · ≠ Production GO）

| 汇总项 | 内容 |
|--------|------|
| **F-02 执行结果** | S0–S5 各 Step PASS/FAIL · tx/证据路径 · 停点（若有） |
| **Production Prep Gate** | Prep Track / Triple / CMS Specialty / Admin CONDITIONAL 旁证状态一行表 · **≠** Freeze · **≠** GO |

---

## LOCK-1 · S3 / S4 顺序（唯一 · 禁止再写「交错签发」）

```text
S0 → S1 Execute → S2 Function 54/0/0
                 ├→ S4 UI Full PASS
                 └→ S3 Product PASS（必须消费 Function + UI 的最终证据）
                 → S5 Governance CLOSED
```

| 规则 | 写死 |
|------|------|
| UI 可先做 | S4 可在 S2 后立即启动；可与 Product **准备**并行 |
| Product 签发 | **仅当** Function 54/0/0 **且** UI Full **PASS** 后，才允许 `stamp-v311-product-cert-aggregate.py` 出 **PASS** |
| 禁止 | 在 UI 未 PASS 时宣称 Product PASS · 宣称「S3/S4 随便交错签发」 |

---

## LOCK-2 · RE P10.5 ≠ Production GO（完整裁决链）

```text
RE P10.5 PASS
  → Governance RC CLOSED
  → Money-Path RC OPT-A
  → TRE-02 / REG-01 / REG-04 PASS
  → Money-Path Re-Audit PASS
  → Constitution Full Alignment PASS
  → PSG 六域汇聚
  → TT_PSG_SEPOLIA_FREEZE
  → Owner Final Sign-off
  → Production GO
```

**禁止：** P10.5 直接连 Production GO · Governance CLOSED 冒充 Freeze/GO · Money-Path 未过宣称 Consistency PASS。

---

## 0 · 现在（Execute 前）可做完

| # | 事项 | 命令 / 状态 |
|---|------|-------------|
| 1 | Dry Run | `python scripts/dev/dry-run-v311-post-execute-ladder.py` |
| 2 | GAP-PR-02 Sepolia overlay | `python scripts/dev/prepare-gap-pr02-sepolia-frontend-env.py` |
| 3 | WalletConnect（Owner） | `bash scripts/dev/set-walletconnect-project-id.sh '<32-hex>'` → `KEY_PRESENT` |
| 4 | F-02 心跳 | `python scripts/dev/stamp-v311-f02-execute-monitor-heartbeat.py` |

---

## 1 · Execute 后先检查哪些状态

| 检查 | 期望 | 失败则 |
|------|------|--------|
| `cast call $GOVERNOR 'state(uint256)(uint8)' 1` | **7** Executed | 仍 5→重试一次；**6 Expired→STOP** |
| `F-02-gov-timelock.json` | `status=PASS` · `final_state_int=7` · `execute_tx` | STOP · 不进 S2 |
| Heartbeat | `execute_done=true` | 重跑 heartbeat |

---

## 2 · 各阶如何启动（按 LOCK-1 序）

| 阶 | 启动命令 | 证据 | Gate |
|----|----------|------|------|
| **S1 Execute** | `TRAVELTRUST_V311_FUNCTION_CERT_BROADCAST_OK=1 bash scripts/dev/run-v311-function-cert-tier-c-item.sh F-02-gov-timelock` | `F-02-gov-timelock.json` | GOV-02 |
| **S2 Function** | `run-v311-web3-full-function-cert.sh` + gate check | `VERDICT-LATEST.json` | **54/0/0** · G-RC-02 |
| **S4 UI Full** | prepare → WC → activate Sepolia → L5 → Playwright → `stamp-v311-ui-ux-full-cert-aggregate.py` → restore Anvil | `P5-UI-UX-CERT-LATEST.json` | playwright=PASS · G-RC-04 |
| **S3 Product** | `python scripts/dev/stamp-v311-product-cert-aggregate.py`（**UI PASS 之后**） | `P6-PRODUCT-CERT-LATEST.json` | G-RC-03 |
| **S5 CLOSED** | `python scripts/dev/stamp-v311-governance-rc-close.py` | `GOVERNANCE-RC-CLOSE-LATEST.json` | G-RC-05 · DEFERRED Money-Path |

---

## 3 · 失败回退（写死）

```text
S1 FAIL / state≠7     → 停 S1 · 不进 S2
S2 ≠54/0/0            → 停 S2 · 不进 S4/S3 PASS 签发
S4 PARTIAL / playwright ❌ → 停 S4 · restore Anvil · 禁止 S3 PASS · 禁止 S5
S3 非 PASS（UI 未 PASS） → 脚本须拒绝 PASS · 回 S4
S5 前提不足            → close 脚本 exit 3 REFUSE（正确）
```

### 3.1 · 失败处置铁律（Owner 已锁 · 2026-07-19）

| 规则 | 写死 |
|------|------|
| 范围 | **仅**失败那一阶 · 不回溯已 PASS 阶 |
| 修复 | **最小修复**（根因一行/一脚本/一配置） |
| 复验 | **单项复验**该阶启动命令 + 该阶证据 stamp |
| 禁止 | **全量重跑** S0–S5 · 禁止借失败重开 Frozen RC / Money-Path / Prep 审计波 |
| 仍 FAIL | STOP · 记 Evidence · 不跳阶 · 不假 PASS |

**禁止：** 跳 Money-Path · 假 CLOSED · state=6 当 Executed · Consistency/Production GO 假签发

---

## 4 · ETA 连续执行（复制即用 · 已按 LOCK-1）

```bash
# S0) 确认 ETA
python scripts/dev/stamp-v311-f02-execute-monitor-heartbeat.py
# execute_allowed_now 必须为 true

# S1) Execute
export TRAVELTRUST_V311_FUNCTION_CERT_BROADCAST_OK=1
bash scripts/dev/run-v311-function-cert-tier-c-item.sh F-02-gov-timelock
# 确认 final_state_int=7

# S2) Function
bash scripts/dev/run-v311-web3-full-function-cert.sh
bash scripts/gates/check-v311-web3-full-function-cert.sh
# 须 54/0/0

# S4) UI Full（先于 Product 最终签发）
python scripts/dev/prepare-gap-pr02-sepolia-frontend-env.py
# 若 WC 未注入：bash scripts/dev/set-walletconnect-project-id.sh '<32-hex>'
node scripts/dev/probe-walletconnect-project-id.cjs   # KEY_PRESENT
bash scripts/dev/activate-frontend-sepolia-env.sh
bash scripts/gates/five-main-routes-ui-antiregression-gate.sh
bash scripts/dev/run-web3-itinerary-l5-green.sh
bash scripts/dev/smoke-wallet-connection-l5-local.sh
# Owner Playwright 真钱包真交易后：
python scripts/dev/stamp-v311-ui-ux-full-cert-aggregate.py   # 须 PASS
bash scripts/dev/restore-frontend-anvil-env.sh

# S3) Product（必须消费 Function + UI 最终证据）
python scripts/dev/stamp-v311-product-cert-aggregate.py   # 须 PASS

# S5) Governance CLOSED
python scripts/dev/stamp-v311-governance-rc-close.py      # 须 CLOSED · DEFERRED Money-Path
```

---

## 5 · Governance CLOSED 之后（不在本卡 Execute 窗内扩做）

仅当 S5 CLOSED 后，才进入 LOCK-2 的 Money-Path → Constitution → 六域汇聚 → Freeze → Sign-off → Production GO。  
**本卡结束于 S5。**
