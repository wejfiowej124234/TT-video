# TT · V3.1.1 Sepolia · Alert / Monitor · Owner Accept（Non-blocking）

**Machine contrib:** `TT_OPERATIONS_CERT`  
**Scope:** ② Sepolia RC · Solo Owner = Sebastian Ward  
**Class:** Non-blocking Risk · **ACCEPT**（非 Defect）· 对齐 Alignment Expected Difference / Non-blocking 政策  
**Recorded:** 2026-07-18

---

## 1 · Alert 程序（已文档化）

| 信号源 | 动作 |
|--------|------|
| Function Cert FAIL / OWNER_REQUIRED | Owner 查看 `evidence/GO_phase2_v311_web3_full_function_cert/` |
| I-01 Indexer reconcile FAIL | Quarantine + 复跑 · 禁 31337 混入 |
| RC-02 探针异常 | 记入 Closure Audit · 不自动改 ACTIVE |
| F-02 Timelock ETA | 日历提醒 Execute `2026-07-20T11:37:37Z` |

**Pager / Webhook 生产接线：** 延期至 Staging/Production 基础设施轨 · **不阻塞** Sepolia RC Ops 文档 Cert。

---

## 2 · Monitor

- 复用：Function Cert 总控 · RC-02 long-stability 探针 · Five-main / Wallet L5 ① 绿集  
- Staging 面板：OWNER 运维习惯 · 本 RC 不新增平行监控栈

---

## 3 · Owner Accept（写死）

```
TT_OPS_ALERT_PAGER: OWNER_ACCEPTED_NON_BLOCKING
TT_OPS_MONITOR_STACK: PROBES_SUFFICIENT_FOR_SEPOLIA_RC
```

Owner 接受：Sepolia RC 以探针 + Evidence 目录为告警面；独立 Pager 不作为本阶硬闸。  
若进入 ③ Production GO，须另开 Infrastructure / Operations Governance 域接线，**不**用本 Accept 冒充 ③。
