# TT · FCG-PAY-01 · G-RC WAIT_WINDOW · Post-ETA S1 Arm

**Machine:** `TT_FCG_PAY01_G_RC_WAIT_WINDOW_S1_ARM`  
**Status:** **L5 EMPIRICAL_PARTIAL · L5-A LOCAL WIRE CLOSED** · `2026-07-19`  
**L5-A Evidence：** [`L5A-FINANCIAL-FLOW-WIRING-CLOSURE-LATEST.json`](../../evidence/GO_phase2_fcg_full_capability_v2_sepolia/fg-web3/L5A-FINANCIAL-FLOW-WIRING-CLOSURE-LATEST.json)  
**Board：** [`PSG-COMPLETION-MATRIX-EMPIRICAL-BOARD-LATEST.json`](../../evidence/GO_phase2_fcg_full_capability_v2_sepolia/pending/PSG-COMPLETION-MATRIX-EMPIRICAL-BOARD-LATEST.json)  
**L3 Prep（并行·不替代 L5）：** [`L3-SECURITY-PREP-PARALLEL-LATEST.json`](../../evidence/GO_phase2_fcg_full_capability_v2_sepolia/pending/L3-SECURITY-PREP-PARALLEL-LATEST.json)

> **Official 产品真源（FTB Product Truth · OPS-2026.08.20-v9）：** `https://www.web3-ttg.com` · `git_sha=3e356617a498b0faac42e4ae457343d36294a770` · `build_time=2026-08-20T00:51:57Z` · image `hybrid-live-auth-pin-nontarget-v9-20260820` · bootstrap **v8** · API `8df2ab214fdd8b8e3bd00e77d8f4aaef43875e51` · **≠** git checkout · historical `daa5ae87` / `deployment-01M05JAAXJPTRZJAQEJ4JJWQMK` SUPERSEDED · M07 **NOT this wave** · SSOT [`TT-OFFICIAL-LIVING-PIN-INDEX-LATEST`](./TT-OFFICIAL-LIVING-PIN-INDEX-LATEST.md)

```text
ACTIVE: 未切换（v311 baseline）
L5: EMPIRICAL_PARTIAL · l5_pass=false

L5-A Financial Flow Wiring（① forge CLOSED）:
  ✅ Escrow↔SettlementRouter
  ✅ FeeRouter 四轨 live path（local）
  ✅ Distributable 生命周期
  ✅ Steward/Treasury flow（local）
  ❌ Chain=Indexer=API=DB=UI 五层等价（仍 OPEN）
  ❌ Sepolia wired EscrowFactory 重部署（仍 OPEN）

L3 Security: PREP_PARALLEL_ONLY · 不得覆盖/替代 L5
下一: 五层 rebind / Sepolia wired factory · 或继续 L5 缺口；L3 仅准备
```


---

## HOLD · 唯一等待事件

```text
G-RC: CLOSED ✅
下一触发: Owner 确认 CDR-19 Release Scope（启发式分类已出 · 非自动确认）
确认后: Commit → SHA Pin → Artifact/Bytecode/Evidence 绑定 → CDR-19 PASS
       → CLEAN Deploy → Matrix L1–L5

硬规则: WAIT_WINDOW ≠ 开发窗口 · PREP_READY ≠ PASS · Evidence Ready ≠ Production Ready
```

*(stamp 2026-07-19 · Dirty Audit complete)*


---

## 0 · 当前实况（本轮刷新）

| 项 | 值 |
|----|-----|
| Heartbeat | `MONITORING` · `FROZEN_WAITING_EXECUTE` |
| Proposal #1 | state **5 Queued** |
| ETA | **`2026-07-20T11:37:37Z`** |
| `execute_allowed_now` | **false** |
| S1 预检闸 | **REFUSE_S1_WAIT_WINDOW**（见 `G-RC-S1-PRE-EXECUTE-HEARTBEAT-GATE-LATEST.json`） |
| Execute 本轮 | **未执行**（正确） |
| G-RC-05 | **未 CLOSED** |
| PASS / GO | **禁止宣称** |
| Protocol v2 Implementation | **禁止** |

**ETA 后阶梯锁（写死 · 禁止提前）：**  
S0 Heartbeat(`execute_allowed_now=true`) → **S1** `F-02-gov-timelock` + Receipt → **S2** G-RC-02（F-02→F-01→F-03→I-01）→ **S4** Real Wallet TX → **S3** Product → **S5** G-RC-05 Close  

机读：`g-rc-05-close-bundle/G-RC-POST-ETA-LADDER-LOCK-LATEST.json`  
本轮：`execute_allowed_now=false` → **无提前操作** · PREAUTH_ONLY · **不启动 Protocol v2**

---

## 1 · ETA 达成后 · 仅 S1（复制即用）

**触发硬闸（须全部为真）：** `execute_allowed_now=true` ∧ `before_eta=false` ∧ chain **11155111**

```bash
# S0 再确认
python scripts/dev/stamp-v311-f02-execute-monitor-heartbeat.py
# 必须看到 execute_allowed_now=true —— 否则 STOP，保持 WAIT_WINDOW

# S1 Execute only
export TRAVELTRUST_V311_FUNCTION_CERT_BROADCAST_OK=1
bash scripts/dev/run-v311-function-cert-tier-c-item.sh F-02-gov-timelock
```

**Receipt Evidence（PASS 须齐）：**

| 证据 | 期望 |
|------|------|
| `tier_c_state/F-02-gov-timelock.json` | `status=PASS` · `final_state_int=7` · **execute_tx** |
| Heartbeat `proposal_1` | `execute_done=true` · state Executed |
| Chain | **11155111 only** |

**FAIL：** state≠7 / Expired(6) / 错链 → **停 S1** · 不进后续。

---

## 2 · S1 PASS 后顺序（锁死 · 仍非本 WAIT 窗执行）

```text
S1 Receipt PASS
  → 清 F-02，再处理 F-01 / F-03 / I-01（Sepolia 活证）
  → Playwright Real Wallet Real TX → P5 PASS
  → Product Acceptance → P6 PASS
  → stamp-v311-governance-rc-close.py → G-RC-05 CLOSED
```

---

## 3 · 全程禁止（至 G-RC-05）

| 禁止 |
|------|
| ETA 前 Execute / 任何绕过 |
| Money-Path / Protocol v2 **编码** |
| Protocol v2 **部署** |
| **ACTIVE** 切换 |
| Step 3 Happy Path |
| 假 PASS / Production GO |
