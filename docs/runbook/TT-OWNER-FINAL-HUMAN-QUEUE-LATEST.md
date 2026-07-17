# TT Owner · 最终人工清单（OA 硬闸 · LATEST）

**STATUS:** ACTIVE · 2026-07-17 · **Phase② Staging Reality Closure**（独立批次）  
**AI_AUTO / AI_ASSIST queues:** **EMPTY**  
**Production:** `TT_PRODUCTION_GO: GO`（不重开）  
**Phase② batch:** [TT-PHASE2-STAGING-REALITY-CLOSURE-LATEST.md](./TT-PHASE2-STAGING-REALITY-CLOSURE-LATEST.md) · `OA-01=BLOCKED` · `OA-02=LOCKED_BY_OA01` · `OA-04=FORBIDDEN`  
**Freeze / Baseline:** `RC-FREEZE-20260717T094900Z` · SHA `0bbc7adbd3142b111463fc398288ab94be5c0b84`  
**Solo:** [TT-PSG-SOLO-DEVELOPER-WORKFLOW-LATEST.md](./TT-PSG-SOLO-DEVELOPER-WORKFLOW-LATEST.md)  
**Companion：** [驾驶舱](./TT-MODULE-RELEASE-COCKPIT-LATEST.md)

> **禁止**整体 `git stash pop stash@{0}`。  
> **OA-05 / GO：CLOSED。** Phase② 未 CLOSED 前 **禁止 OA-04**。

---

## 优先级总表（Phase②）

| # | ID | 事项 | 状态 | 回传 |
|---|-----|------|------|------|
| 1 | **OA-01** | WC Project ID + probe（+ Staging Web rebuild） | **BLOCKED** | `WC_PROJECT_ID: KEY_PRESENT` |
| 2 | **OA-02** | P1 Real Device Batch | LOCKED_BY_OA01 | `TT_REAL_DEVICE_BATCH_P1: PASS` |
| 3 | Ambient / Guest | SLA + HOLD 增量 | WAITING | 分项 Evidence |
| 4 | **OA-03** | Timelock Execute | WAITING | tx Evidence |
| — | **OA-04** | 生产密钥 / 正式部署 | **FORBIDDEN** | Phase② CLOSED 后 |
| — | **OA-05** | Production GO | **CLOSED · GO** | — |

---

## OA 摘要（详表见 Production Execution Checklist）

### OA-01 · WalletConnect Project ID

| | |
|--|--|
| **必须人工** | Reown/WC Cloud 账号与域名绑定；仓库无可读 Project ID |
| **入口** | https://cloud.reown.com → `bash scripts/dev/set-walletconnect-project-id.sh '<ID>'` → Staging Web redeploy |
| **AI 已备** | AX-WC-01 preflight · inject 脚本 · 探针 |

### OA-02 · P1 Real Device Batch

| | |
|--|--|
| **必须人工** | 真人真机扫码 / Deep Link / 四卡原子签收 |
| **入口** | [`REAL-DEVICE-BATCH-P1.md`](../../evidence/GO_module_release_ladder/REAL-DEVICE-BATCH-P1.md) · Checklist 附录 A |
| **AI 已备** | AX-RD-01 日志模板 |

### OA-03 · Timelock Execute（链上签名）

| | |
|--|--|
| **必须人工** | 钱包签名；禁 AI 代 broadcast |
| **入口** | `phase2-sepolia-l2-resume-timelock-waiting.sh` · Checklist 附录 B · `TRAVELTRUST_PHASE2_SEPOLIA_BROADCAST_OK=1` |
| **AI 已备** | AX-TL-01 status→execute 清单（未执行） |

### OA-04 · DNS / R2 / Stripe / 生产密钥

| | |
|--|--|
| **必须人工** | 正式密钥与控制台写操作 |
| **入口** | PI3 · Secret Catalog · Media R2 CDN checklists（索引见 AX-SEC-01） |
| **AI 已备** | AX-SEC-01 清单索引（无密钥） |

### OA-05 · Owner Sign-off / Production GO

| | |
|--|--|
| **必须人工** | H1 · Phase② CLOSED · Reality 收口 · Entry · **GO 裁决** |
| **入口** | [HUMAN-ACCEPTANCE-REPORT](./HUMAN-ACCEPTANCE-REPORT.md) · [go-live-checklist](../go-live-checklist.md) · Checklist OA-05 |
| **AI 已备** | AX-EV-01 证据汇总 · Entry PREP · AX-UAT-01 / AX-AMB-01 模板（SLA/UAT **执行与接受**仍属你） |

---

## 四类对照（勿混）

| 类 | 状态 |
|----|------|
| A AI_AUTO | CLOSED 11/11 |
| B AI_ASSIST | CLOSED 9/9 prep |
| C OWNER_ACTION | **OPEN · OA-01～05** |
| D PRODUCTION_GO | **NO_GO** |

**折叠说明（不再单列人工工程项）：** Governance/CMS 抽验 · TW-023/024 · Cert finalize · R-08 HOLD · Ambient SLA 接受 · UAT52 执行 · Block B —— 模板/观测/索引已在 **AI_ASSIST**；实际操作并入 **OA-02 / OA-03 / OA-05** 路径，不另开工程队列。

**诚实边界：** AI_ASSIST prep CLOSED ≠ OWNER_ACTION 完成 ≠ Ambient SLA CLOSED ≠ Production GO。
