# TT Owner · 最终人工清单（OA 硬闸 · LATEST）

**STATUS:** ACTIVE · 2026-07-17 · **Post–Production GO residual human ops**  
**AI_AUTO / AI_ASSIST queues:** **EMPTY**  
**Production:** `TT_PRODUCTION_GO: GO`（矩阵 · Owner Sign-off 已闭 · Tag `v1.1.0-psg-go.20260717`）  
**Freeze / Baseline:** `RC-FREEZE-20260717T094900Z` · SHA `0bbc7adbd3142b111463fc398288ab94be5c0b84`  
**Solo:** [TT-PSG-SOLO-DEVELOPER-WORKFLOW-LATEST.md](./TT-PSG-SOLO-DEVELOPER-WORKFLOW-LATEST.md)（含 W5 时间隔离复检）  
**Owner 唯一执行页（SSOT）：** [TT-PRODUCTION-EXECUTION-CHECKLIST-LATEST.md](./TT-PRODUCTION-EXECUTION-CHECKLIST-LATEST.md)  
**Companion：** [驾驶舱](./TT-MODULE-RELEASE-COCKPIT-LATEST.md) · Inbox `evidence/GO_module_release_ladder/OWNER-RETURN-INBOX/`

> **OA-05 / Production GO Decision：CLOSED · GO** — 禁止用本页重开 GO 叙事。  
> **OA-01～04** = GO **之后**的 Staging 激活 / 真机 / Timelock / 生产密钥落地（独立批次）。  
> **禁止**扩 PSG 治理 SSOT；Hotfix/Feature 从 Tag 开分支。

---

## 优先级总表（残余人控 · OA-01～04）

| # | ID | 事项 | 预估 | 回传 |
|---|-----|------|------|------|
| 1 | **OA-01** | WalletConnect Project ID + inject + Staging Web redeploy | 10–20 min | `WC_PROJECT_ID: KEY_PRESENT` |
| 2 | **OA-02** | P1 Real Device Batch（Wallet→Order→Provider·Guide） | 45–90 min | `TT_REAL_DEVICE_BATCH_P1: PASS` |
| 3 | **OA-03** | Timelock READY 后 **钱包签名 execute**（SC-E→…→A） | 20–40 min（窗后） | `op done=true` + tx |
| 4 | **OA-04** | DNS / R2 / Stripe Live / 生产密钥 | 1–3 h | 勾选表（非秘密） |
| — | **OA-05** | Owner Sign-off → Production GO | — | **CLOSED · GO** |

**WC 探针**仍可能 `KEY_ABSENT` — **≠** 否决 `TT_PRODUCTION_GO: GO`。

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
