# TT · V3.1.1 Sepolia · Recovery / Upgrade / Incident（Ops 证据）

**Machine contrib:** `TT_OPERATIONS_CERT` · `TT_RECOVERY_CERT`  
**Scope:** ② Sepolia V311 clean baseline · **≠** ③ Production  
**Discipline:** F-02 Timelock 窗内只读链上 · 本文为运维程序固化  
**Address pin:** `registry/v311-sepolia-address-matrix-freeze.v1.json`（**禁止**本文件改矩阵）

---

## 1 · Authority（已链上旁证）

| 项 | 值 |
|----|-----|
| Safe | `0x7c018293396325077bb4D039930dcEe11B7Fb1Cf` |
| Safe `getThreshold` | **1**（cast · Sepolia） |
| Safe Owner | `0x6Bf7C7C8566747EefeE1719b06369dac1CBd5f8b` |
| Timelock | `0x462402082B395F218FFB3634ec0611e39BdD504C` |
| Timelock delay | **172800s**（F-02 Queued 证据） |
| Governor | `0x1ce4fbE80557bC2111A814f60A2334de41032116` |
| Upgrade path | Safe → Timelock → `execute` / `upgradeTo`（EIP-1967 Transparent-style） |

---

## 2 · Upgrade Runbook

1. 变更仅允许经 Governor 提案或 Safe→Timelock 排队操作。  
2. **禁止** EOA 直改 ACTIVE 实现 / 矩阵。  
3. Queue 后等待 `getMinDelay`（当前 48h）再 Execute。  
4. Execute 后复跑：`bash scripts/dev/run-v311-web3-full-function_cert.sh`（或等价）至 **54/0/0**。  
5. 若改动已 PASS Phase：按 RE 纪律 **P4** 撤销受影响 Cert 并从最早 Phase 重验。

---

## 3 · Recovery Runbook

| 场景 | 动作 |
|------|------|
| RPC 不可用 | 切换备用 Sepolia RPC · 不改地址矩阵 |
| Indexer 漂移 | 复跑 I-01 · quarantine mock escrows · 禁止混 31337 |
| 错误提案 Queued | **勿** Execute · 等待过期或按治理取消路径（若有） |
| 密钥丢失 | Safe Owner 轮换（多签阈值）· Owner 人工 |
| 前端指错链 | 核对 `NEXT_PUBLIC_CHAIN_ID=11155111` · Config Baseline pin |

---

## 4 · Incident Runbook

1. **Detect：** Function Cert / Indexer reconcile / UI smoke 失败 · RC-02 探针告警  
2. **Triage：** 是否触及资金 / 权限 / 地址矩阵？→ P0  
3. **Contain：** 暂停广播 env（撤 `*_BROADCAST_OK`）· 不改 ACTIVE  
4. **Fix：** 最小 diff · 证据入 `evidence/GO_phase2_v311_final_release/`  
5. **Recert：** 从受影响 Phase 起按 Formal Ladder 重验  
6. **Close：** 更新 Closure Audit 项 · Board 状态

---

## 5 · Alert / Monitor / Backup（诚实）

| 项 | 状态 |
|----|------|
| Alert 路由（Pager/Webhook） | **OWNER_CONFIG**（本文件不伪造已接 pager） |
| Monitor 仪表 | 复用 Function Cert / RC-02 探针 · Staging 面板 OWNER |
| Backup（DB/证据） | Evidence 目录 + Git · 生产备份 OWNER |

**Ops Cert：** Security/Upgrade/Recovery/Incident **已文档化并链上旁证**；Alert/Monitor/Backup 生产接线仍 OWNER → 总评见 Evidence `P6.5-*`。
