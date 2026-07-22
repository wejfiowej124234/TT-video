# PSG Production Reality Consistency Audit · DRY-RUN

> **SUPERSEDED_SNAPSHOT** · tip `652bbab5` ≠ current Active tip `97289a71` · pin `PSG-REL-20260720-WEB3-CAND-V2` · FG-15-B **ELAPSED** · not release mainline.


**Machine:** `TT_PSG_PRODUCTION_REALITY_CONSISTENCY_AUDIT_DRY_RUN`  
**Alias:** Production System Reality Audit · Production Reality Alignment Audit  
**Status:** `DRY_RUN_COMPLETE` · `REPORT_ONLY` · **WAIT_ETA Discovery 终卷**  
**Recorded:** `2026-07-20T07:15:00Z`  
**唯一 SSOT：** `PSG-REL-20260720-WEB3-CAND-V2`  
**Candidate tip：** `652bbab51a1eb0652ea31f18ae4146fbe325a1ea` · `v311_fund_safety_candidate_v2`  
**Staging `/meta`：** `f8181b63507fe339e23a1e5285c4242a8bb3507e`  
**ETA Gate：** `WAITING_WINDOW`

```text
禁止：修改 Candidate · 部署 · 影响 ETA Final Closure / L5 / S7
本文件 = 六维等式 + 六大生产面 Reality 对拍 + Post-Formal-Baseline PCR 清单
上游合并：SSOT Consistency · Runtime Drift · Consistency · Gap Audit · Auth Delta · CMS · Hygiene
```

**终局问题：** Final Closure 之后，是否仍有遗漏的生产级缺口？  
**答：有。** Closure 只钉 Candidate 认证梯子；**Staging/数据/Auth 生产生命周期/CMS 治理** 等须 **独立 PCR**，否则再次出现「认证 A、运行 B」。

---

## 0.0 · Owner 确认 · 最重要发现排序（LOCKED）

| Pri | 发现 | 一句话 | 处置 |
|:---:|------|--------|------|
| **P0** | **Runtime 不一致** | 认证/Local=`652bbab5` · Staging=`f8181b63` → **认证 A、运行 B**；任何 Staging 测试可能假绿 | **Wave 0** `STAGING-RUNTIME-ALIGNMENT`（禁裸 deploy） |
| **P1** | **Auth = TRUE_FEATURE_GAP** | **已排除**「旧部署导致验证码问题」；是生产能力缺失（Generate→log→verified ≠ 生产闭环） | **Wave 1** `AUTH-PROD-HARDENING` |
| **P1** | **DB：Schema ≠ Production Lifecycle** | 有 `auth_email_tokens` ≠ 生产真用；须 Schema 层 + 行为层 + audit/soft-delete/backup/idempotency/outbox | **Wave 4** `DATA / OPS`（Alignment 附录可先 Schema attest） |
| **P2** | **CMS = 生产运营系统** | 非仅展示；须 内容→审核→发布→版本→审计，否则库对用户仍假 | **Wave 2** `CMS-GOV-CLEANUP` |
| **P2** | **UI/UX = 生产闭环** | **不**重设计；查 mock/fallback/死按钮/error/loading/empty/mobile/权限 | 并入 Alignment 烟测 + Wave 5 UX 项 |

**等窗剩余价值（仅）：** Maintain（Integrity · Catalog · Freshness · ETA Gate）防漂移 · Post-Baseline PCR 队列已齐。  
**禁止等窗：** redeploy · 修 Auth/CMS/DB · 开 Project B · 提前 L5/S7。

**生产 Auth 应有闭环（对照 · 非本窗实现）：**

```text
Create User Pending → Generate OTP → Send Email Provider → Verify Token
  → Activate Account → Audit
```

**现行 Reality：** Generate → log → verified（设计完成度问题 · 非部署问题）。

---

## 0 · 六维一致性检查清单（认证→…→体验）

| # | 维 | PSG 基准期望 | 当前 Reality | 判定 |
|---|-----|--------------|--------------|------|
| 1 | **认证版本** | CAND-V2 · tip `652bbab5` | Registry + Identity ✅ | ✅ ALIGNED |
| 2 | **代码版本** | Local = tip | Local HEAD = tip ✅ | ✅ ALIGNED |
| 3 | **部署版本** | Staging = tip + Candidate 合约 env | SHA `f8181b63` · V2 null · Fee 不一致 | ❌ **OLD_RUNTIME** · **CODE_DRIFT** |
| 4 | **数据库** | Schema/Migration/Lifecycle 支撑生产流 | Migration 在；Auth 表未接线；Outbox/dual-write 弱；CMS 键污染 | ⚠ **SCHEMA_DRIFT?**（未全库证）· **OLD_DATA** · **TRUE_FEATURE_GAP** |
| 5 | **文档** | 活文 = ACTIVE pin | 部分 `09c72b93`/FG-15-A 活命令 | ❌ **EVIDENCE_DRIFT** |
| 6 | **用户体验** | 生产级 Auth/业务/展示 | OTP 无真邮 · Reset stub · FE fallback 假绿 | ❌ **TRUE_FEATURE_GAP** |

```text
认证 ✅ = 代码(Local) ✅ ≠ 部署 ❌ ≠ 数据 ⚠ ≠ 文档 ⚠ ≠ 体验 ❌
```

---

## 1 · 六大生产面 Reality（优先审计）

### 面 A · Identity / Auth

| 项 | Class | PCR（Formal Baseline 后） |
|----|-------|---------------------------|
| 注册 OTP 真邮件 / 所有权证明 | TRUE_FEATURE_GAP | `PCR-AUTH-VERIFY-MODEL` · `PCR-AUTH-MAIL-TRANSPORT` |
| Forgot / Reset | TRUE_FEATURE_GAP | `PCR-AUTH-PASSWORD-RESET` |
| Email Change 缺失 | TRUE_FEATURE_GAP | `PCR-AUTH-EMAIL-CHANGE` |
| Session revoke-all | TRUE_FEATURE_GAP | `PCR-SEC-SESSION-REVOKE` |
| MFA / Admin step-up | TRUE_FEATURE_GAP | `PCR-SEC-2FA-ADR` · `PCR-SEC-ADMIN-STEPUP` |
| Rate limit / Audit | TRUE_FEATURE_GAP | `PCR-AUTH-LIMITS-AUDIT` |
| 「旧部署导致 Auth 回退」 | — | **排除**（非 OLD_RUNTIME） |

### 面 B · Database Schema / Data Lifecycle

| 项 | Class | PCR |
|----|-------|-----|
| `auth_email_tokens` 等 migration 存在 | PSG 侧备好 | — |
| 路由未消费 → 生产流空洞 | TRUE_FEATURE_GAP（非缺列） | AUTH-* |
| Staging 全库 vs tip checksum | SCHEMA_DRIFT · **未直连证** | `PCR-DATA-SCHEMA-ATTEST`（Alignment 附录） |
| Outbox 默认 off · dual-write log_only | TRUE_FEATURE_GAP · CODE_DRIFT（配置） | `PCR-DATA-OUTBOX-PROD` · `PCR-DATA-DUALWRITE-STRICT` |
| CMS QA LATEST / 展示源 | OLD_DATA · EVIDENCE_DRIFT | `PCR-CMS-QA-EVIDENCE-REPAIR` |
| Soft-delete / FK / Backup 穷尽 | UNKNOWN | `PCR-DATA-LIFECYCLE-REVIEW` |
| GDPR 删号/导出 | TRUE_FEATURE_GAP | `PCR-USER-GDPR-*` |

### 面 C · 核心业务流程

| 流 | Class | PCR |
|----|-------|-----|
| 登录/注册（①） | 可用 · 生产邮件链缺口 | AUTH-* |
| Market / Provider / Guide / Order（①） | 局部冻结 ≠ ② GO | `PCR-USER-ACQ-STAGING` 等（②） |
| Payment failure UX · mock-pay 模式 | TRUE_FEATURE_GAP | `PCR-PAY-FAILURE-UX` · `PCR-ESC-PAY-MODE-UX` |
| Escrow 草稿冻 · 上链 UI 未冻 | TRUE_FEATURE_GAP | `PCR-ESC-ONCHAIN-UI` |
| Settlement / Dispute（Candidate） | 证据轨；Staging 未投影 | OLD_RUNTIME → Alignment 后烟测 |
| Onboarding fee stub / Stripe | TRUE_FEATURE_GAP | `PCR-ONB-*` |
| Admin 高危/退款 | TRUE_FEATURE_GAP | `PCR-ADM-HIGHRISK-CONFIRM` |

### 面 D · UI / API 一致性

| 项 | Class | PCR |
|----|-------|-----|
| Staging UI ↔ 旧 API SHA | OLD_RUNTIME | Alignment + UI 烟测 |
| Unsplash 静默 fallback | TRUE_FEATURE_GAP | `PCR-CMS-NO-SILENT-FALLBACK` |
| 死按钮 / Mock 残留（抽样） | TRUE_FEATURE_GAP / UNKNOWN | 并入 UI 烟测 PCR |
| 五主 UI 冻结纪律 | 与 PSG ① 一致 | 保持 · 不回流 |

### 面 E · CMS / Admin / Ops

| 项 | Class | PCR |
|----|-------|-----|
| JP CLOSED · 330 LOCKED | ② 运营 VALID | — |
| fallback / bake / 外链 / 键污染 | TRUE_FEATURE_GAP · OLD_DATA · EVIDENCE_DRIFT | CMS-GOV-* |
| CMS Editor/Approver | TRUE_FEATURE_GAP | `PCR-CMS-RBAC` |
| Admin 审计覆盖 | TRUE_FEATURE_GAP | `PCR-SEC-ADMIN-AUDIT-COV` |
| L4 监控/Pager · on-call HOLD | TRUE_FEATURE_GAP · NEEDS_OWNER | `PCR-OPS-*` |

### 面 F · Web3 Runtime / Money Path

| 项 | Class | PCR |
|----|-------|-----|
| Candidate Identity Sepolia | 认证目标 VALID | — |
| Staging FactoryV2=null · SR 缺 · Fee≠ · Indexer 0 | OLD_RUNTIME | `PCR-STAGING-ALIGN-CAND-V2` · `PCR-WEB3-RUNTIME-IDENTITY` |
| tip 4 commits 未部署 | CODE_DRIFT | Alignment（禁裸 deploy） |
| L5 Final / S7 | 时间闸未到 | **Project A** · 非本 PCR 插队 |

---

## 2 · 分类总账（Master）

### OLD_RUNTIME
M-OR-01 Staging SHA · M-OR-02 Fly 镜像 · M-OR-03 合约/Indexer 投影 · M-OR-04 UI↔旧 API  

### OLD_DATA
M-OD-01 CMS 键/展示源 · M-OD-02 dual-write/outbox 滞后风险  

### SCHEMA_DRIFT
M-SD-01 Staging 全库未证 · M-SD-02（行为空洞归 FEATURE_GAP）  

### CODE_DRIFT
M-CD-01 tip 未部署 · M-CD-02 Auth 双层孤儿  

### TRUE_FEATURE_GAP
Auth 全链 · GDPR · CMS 治理硬闸 · Data workers · Onb stub · Escrow/Pay UX · Admin/Ops  

### EVIDENCE_DRIFT
`09c72b93` 活语气 · FG-15-A 脚本 · CODE-FREEZE 旧叙事 · SG QA 错键  

### NEEDS_OWNER
phone/backup · vesting 三参 · ③ 域/Stripe/钱包激活 · W5 Sign-off（ETA 后）  

---

## 3 · Formal Baseline 后正确顺序（Owner LOCKED · A→I）

### A · Project A（先完成 · 不插队）

```text
Settlement finalize → Bridge A → L5 Final → S7 → Formal Baseline
```

### B→I · 独立 Reality PCR（Baseline 之后）

| 阶 | Wave | Stream | Pri | 关键 PCR / 焦点 |
|----|:----:|--------|:---:|------------------|
| **B** | **0** | STAGING-RUNTIME-ALIGNMENT | **P0** | `PCR-STAGING-ALIGN-CAND-V2` · `PCR-WEB3-RUNTIME-IDENTITY` · Schema attest 附录 — **否则测试假绿** |
| **C** | **1** | AUTH-PROD-HARDENING | **P1** | `PCR-AUTH-*` · `PCR-SEC-SESSION-REVOKE` — Pending→Send→Verify→Activate→Audit |
| **D** | **2** | CMS-GOV-CLEANUP | **P2** | `PCR-CMS-GOV-*` — 审核→发布→版本→审计 |
| **E** | **3** | SEC / USER / ADMIN | P1/P2 | `PCR-SEC-*` · `PCR-USER-GDPR-*` · `PCR-ADM-*` |
| **F** | **4** | DATA / OPS / ONB | **P1** | Schema/行为/lifecycle · outbox · idempotency · backup · `PCR-OPS-*` · `PCR-ONB-*` |
| **G** | **5** | ESC-PAY UX / ACQ-② | **P2** | mock/fallback/死按钮/error/loading/empty/mobile/权限 · Pay failure UX |
| **H** | **6** | Hygiene | P2 | `PCR-HY-*` 文档/脚本 |
| **I** | **7** | Delta Recertify | — | 证明六维同钉 · ≠ Project B 全仓乱开 |

**车辆：** PCR → Version Gate →（Wave 0）Deploy Identity → Staging → Runtime Certification → Evidence（**新**根 · **禁止**改写 CAND-V2 Archive · **禁止**裸 `fly deploy`）。

---

## 4 · Final Closure 后遗漏风险（写死）

| 若只做 Candidate Formal Baseline… | 仍会留下 |
|-----------------------------------|----------|
| 不跑 Wave 0 | Staging 继续证明「旧系统」 |
| 不跑 Auth Wave | 生产身份生命周期仍假完成 |
| 不跑 CMS Wave | 展示假绿 / 证据键污染 |
| 不跑 Delta Recertify | 无法证明六维同钉 |

```text
Candidate Formal Baseline ≠ Staging Reality Alignment
≠ Auth Production Ready ≠ Production GO
```

---

## 5 · 引用索引

| 包 | 角色 |
|----|------|
| [SSOT Consistency](./TT-PSG-SSOT-CONSISTENCY-AUDIT-DRY-RUN-LATEST.md) | PSG 真源校验 |
| [Runtime Drift](./TT-RELEASE-RUNTIME-DRIFT-AUDIT-DRY-RUN-LATEST.md) | SHA/合约 |
| [Consistency A–E](./TT-RELEASE-RUNTIME-CONSISTENCY-AUDIT-DRY-RUN-LATEST.md) | PRC-01…08 |
| [Gap Audit](./TT-WAIT-ETA-PRODUCTION-READINESS-GAP-AUDIT-DRY-RUN-LATEST.md) | PRG-* |
| [Discovery Freeze](./TT-WAIT-ETA-DISCOVERY-FREEZE-LATEST.md) | 停广扫 |
| [Post-Baseline Backlog](./TT-POST-BASELINE-INDEPENDENT-BACKLOG-LATEST.md) | 队列 SSOT |

**机读：** [`TT-PSG-PRODUCTION-REALITY-CONSISTENCY-AUDIT-DRY-RUN-LATEST.json`](./TT-PSG-PRODUCTION-REALITY-CONSISTENCY-AUDIT-DRY-RUN-LATEST.json)
