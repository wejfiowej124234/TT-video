# TT · Production Implementation Reality Mapping Audit · DRY-RUN

> **SUPERSEDED_SNAPSHOT** · tip `652bbab5` ≠ current Active tip `97289a71` · pin `PSG-REL-20260720-WEB3-CAND-V2` · FG-15-B **ELAPSED** · not release mainline.


**Machine:** `TT_PRODUCTION_IMPLEMENTATION_REALITY_MAPPING_AUDIT_DRY_RUN`  
**Status:** `DRY_RUN_COMPLETE` · `REPORT_ONLY`  
**Recorded:** `2026-07-20T07:25:00Z`  
**唯一基准：** `PSG-REL-20260720-WEB3-CAND-V2` · tip `652bbab5…`  
**Staging：** `/meta` `f8181b63…`

```text
最大风险 = 实现状态不透明（Code/Test/Doc/Registry/Deploy/闭环 六态未统一）
本审计 = Reality Mapping（分类）≠ 再开普通 Gap 广扫
禁止：改 Candidate · 部署 · 动 ETA/L5/S7
修复：Post-Baseline PCR → Delta Recertify
```

---

## 0 · 直接回答你最关心的问题

> 「是不是很多东西代码已实现，但 PSG / 真源文档 / Runtime 没同步？」

| 答 | 说明 |
|----|------|
| **是，有一部分** | Auth tokens/Resend/IT、CMS Admin 工作流、health/metrics、idempotency 层等 **代码在** |
| **不能全归文档问题** | Auth 现行路径是 **设计未闭环**；Staging 是 **OLD_RUNTIME**；CMS FE fallback 是 **运行时假绿**；Ops Incident 多为 **占位** |
| **正确处理** | 用下方 **七态 Reality 分类** → Post-Baseline PCR · **不**塞进 Candidate |

```text
代码存在 → 测试存在 → 文档存在 → Registry 存在 → 部署存在 → 生产流程闭环
     ↑________________ 六态经常断裂（不透明）________________↑
```

---

## 1 · Reality 七态（本审计专用）

| 分类 | 含义 |
|------|------|
| **IMPLEMENTED_ALIGNED** | 代码 + 文档/登记 + Runtime 路径一致（仍可能 ≠ ③ GO） |
| **IMPLEMENTED_NOT_REGISTERED** | 代码/表/模块在 · PSG/路由未承认或未接线 |
| **IMPLEMENTED_NOT_PRODUCTION_READY** | Demo/局部可用 · **无生产闭环** |
| **OLD_RUNTIME** | 新 tip 未部署 / Staging 投影旧 |
| **OLD_DATA** | 数据源/键/展示旧或假 |
| **DOCUMENT_DRIFT** | 文档/IT 超前或过时相对 Runtime |
| **TRUE_MISSING** | 真无实现（无可用路径） |

---

## 2 · Reality Gap Matrix（核心面）

### 2.1 Auth Identity（示例：Schema READY · Flow NOT_CLOSED）

| 能力 | Code/Mig/Test | Runtime | Reality |
|------|---------------|---------|---------|
| 注册 OTP | ✅ | log → **直接 verified** | **IMPLEMENTED_NOT_PRODUCTION_READY** |
| Email Provider / Resend | ✅ 模块 | OTP **未调用** | **IMPLEMENTED_NOT_REGISTERED** |
| `auth_email_tokens` + 链接验证 | ✅ 表/repo/IT | **无 insert 接线** | **IMPLEMENTED_NOT_REGISTERED** + **DOCUMENT_DRIFT** |
| Forgot / Reset | stub + 孤儿基建 | `chain_off_stub` | Runtime **TRUE_MISSING** · 基建 ORPHAN |
| Email Change | — | — | **TRUE_MISSING** |
| Session list/revoke | ✅ | 无改密全撤 | **IMPLEMENTED_NOT_PRODUCTION_READY** |
| MFA（用户） | — | — | **TRUE_MISSING**（Admin TOTP 另计 PARTIAL） |
| Rate limit / Audit | 部分活 · forgot 限流孤儿 | 不完整 | **IMPLEMENTED_NOT_PRODUCTION_READY** |

```text
应有：Pending → OTP → Send Provider → Verify → Activate → Audit
现行：Generate → log → verified
≠ 旧部署问题（已排除）· = 设计完成度 / NOT_PRODUCTION_READY
```

### 2.2 Ops 运维系统（**优先级抬升** · 单独重扫）

| 柱 | 存在 | Reality |
|----|------|---------|
| **Runtime** health/meta/metrics | ✅ | **IMPLEMENTED_ALIGNED**（端点）+ Staging **OLD_RUNTIME**（SHA） |
| **Incident** | Admin 合成/占位 incident | **IMPLEMENTED_NOT_PRODUCTION_READY** |
| **Alerts** | ENV/DB 规则 · Prometheus 示例 | **IMPLEMENTED_NOT_PRODUCTION_READY** |
| **Recovery** backup status / Fly 脚本 | 基线证据有 · **非**连续 restore 产品闭环 | **IMPLEMENTED_NOT_PRODUCTION_READY** |
| **Release** deploy record / rollback 产品化 | `/meta` SHA · migration_rollbacks 列表 | **PARTIAL** + **OLD_RUNTIME** |
| **Governance** admin audit / catalog approve | 写审计较强 | **IMPLEMENTED_ALIGNED**（审计写）· 审批 **PARTIAL** |
| On-call / SLA 自动化 | 文档 / Owner 字段 | **DOCUMENT_DRIFT** / process · **NEEDS_OWNER**（backup HOLD） |

**裁决：** 不能只看 `operations_owner` / `recovery_budget`。Ops = Runtime+Incident+Recovery+Release+Governance；多数属 **做了观测/占位 · 未形成生产运维闭环**（B/C 型不透明），不是「完全没写代码」。

### 2.3 CMS = Content Operation System

| 步 | Reality |
|----|---------|
| Create → Review → Approve → Publish → Version → Audit | **IMPLEMENTED_ALIGNED**（Admin Catalog） |
| Rollback | **IMPLEMENTED_NOT_PRODUCTION_READY**（非全族一键） |
| 公开展示 / Unsplash fallback / QA 键 | **OLD_DATA** + **IMPLEMENTED_NOT_PRODUCTION_READY** |

### 2.4 Database Schema ≠ Lifecycle

| 项 | Reality |
|----|---------|
| Auth token 表 | Schema READY · Service **未用** → **IMPLEMENTED_NOT_REGISTERED** |
| Idempotency 层 | **IMPLEMENTED_ALIGNED**（层）· 支付面仍 specialty |
| Outbox / dual-write | **IMPLEMENTED_NOT_PRODUCTION_READY**（默认 off / log_only） |
| Soft delete 模式 | **TRUE_MISSING**（无统一 `deleted_at` 模式） |
| Backup/restore 产品闭环 | **IMPLEMENTED_NOT_PRODUCTION_READY** |
| Staging 全库 vs tip | 未直连 → 记 **SCHEMA attest** PCR（Alignment 附录） |

### 2.5 Business Flow（Backend+DB+API+UI+Evidence）

| 流 | Reality（摘要） |
|----|-----------------|
| 注册/登录 | UI/API 有 · Auth 生产闭环缺 → **NOT_PRODUCTION_READY** |
| Market/Order/Escrow 草稿 | ① 多面对齐 · Staging tip 旧 → **OLD_RUNTIME** 叠加 |
| Payment/Settlement | Candidate 证据轨 · Staging 合约投影否 → **OLD_RUNTIME** |
| Onboarding fee/Stripe | stub / fail-closed → **NOT_PRODUCTION_READY** / **TRUE_MISSING**（未配） |
| Dispute/Governance 全生产 | 部分 ① · 生产闭环另闸 → **NOT_PRODUCTION_READY** |

### 2.6 UI/UX（生产闭环 · 非重设计）

| 项 | Reality |
|----|---------|
| mock / fallback / 假绿 | **OLD_DATA** / **NOT_PRODUCTION_READY** |
| 死按钮 / error / loading / empty / mobile / 权限 | 抽样缺口 → Wave 5 烟测 PCR |
| 五主 UI 冻 | **IMPLEMENTED_ALIGNED**（① 纪律） |

### 2.7 Web3 Runtime

```text
PSG Candidate tip → Deploy → Staging → Indexer → UI
         ✅              ❌        ❌         弱
```

| 项 | Reality |
|----|---------|
| tip 未上 Staging | **OLD_RUNTIME** · **CODE** 未部署 |
| FactoryV2/SR/Fee/Indexer | **OLD_RUNTIME** |

---

## 3 · 不透明类型汇总（A/B/C）

| 型 | 含义 | 本系统实例 |
|----|------|------------|
| **A 没实现** | TRUE_MISSING | Email Change · 用户 MFA · 统一 soft-delete |
| **B 实现了文档没承认/超前** | DOCUMENT_DRIFT · NOT_REGISTERED | Forgot IT vs stub · Resend 未登记进 OTP 路径 |
| **C 代码有未接入流程** | NOT_REGISTERED · NOT_PRODUCTION_READY | `auth_email_tokens` · Outbox off · Incident 占位 |

---

## 4 · Post-Baseline PCR 队列（映射 Reality 态）

保持 [A→I 顺序](./TT-PSG-PRODUCTION-REALITY-CONSISTENCY-AUDIT-DRY-RUN-LATEST.md#3--formal-baseline-后正确顺序owner-locked--ai)；本 Mapping 校正理解：

| Wave | 焦点 Reality 态 | PCR 强调 |
|:----:|-----------------|----------|
| **0** | OLD_RUNTIME | 先消灭「认证 A / 运行 B」· 否则 Mapping 在 Staging 上仍假 |
| **1** | Auth NOT_PRODUCTION_READY / NOT_REGISTERED | 接线或删除孤儿 · 真邮件闭环 · **非**「补文档假装齐」 |
| **2** | CMS OLD_DATA / Rollback NOT_READY | 运营闭环 + 去假绿 |
| **3** | SEC/USER/ADMIN | GDPR · step-up · audit cov |
| **4** | **Ops 抬升** + DATA lifecycle | Incident/Recovery/Release 产品化 · Outbox/dual-write/backup · Schema attest · 可拆 `PCR-OPS-RUNTIME\|INCIDENT\|RECOVERY\|RELEASE` |
| **5** | UI 生产闭环 | mock/fallback/死按钮/… |
| **6** | DOCUMENT_DRIFT | Hygiene |
| **7** | 全态复验 | Delta Recertify |

**Ops 说明：** 从「只填 Owner 字段」升级为 Wave 4 内 **P1 运维闭环**（与 DB lifecycle 同波，可拆 `PCR-OPS-RUNTIME|INCIDENT|RECOVERY|RELEASE`）。

---

## 5 · 与先前审计关系

| 包 | 关系 |
|----|------|
| Production Reality Consistency | 六维等式 · Pri P0–P2 |
| 本 Mapping | **实现不透明** 七态矩阵 · Ops 抬升 |
| Gap / Consistency / Auth Delta | 细节证据源 · 本册不重复开单 |

---

## 6 · 诚实边界

```text
IMPLEMENTED_ALIGNED ≠ Production GO
有表 / 有测试 / 有 Runbook ≠ 生产流程闭环
不要改 PSG pin 来「承认」未闭环能力
```

**机读：** [`TT-PRODUCTION-IMPLEMENTATION-REALITY-MAPPING-AUDIT-DRY-RUN-LATEST.json`](./TT-PRODUCTION-IMPLEMENTATION-REALITY-MAPPING-AUDIT-DRY-RUN-LATEST.json)
