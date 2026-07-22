# PSG Source of Truth Consistency Audit · DRY-RUN

> **SUPERSEDED_SNAPSHOT** · tip `652bbab5` ≠ current Active tip `97289a71` · pin `PSG-REL-20260720-WEB3-CAND-V2` · FG-15-B **ELAPSED** · not release mainline.


**Machine:** `TT_PSG_SSOT_CONSISTENCY_AUDIT_DRY_RUN`  
**Status:** `DRY_RUN_COMPLETE` · `REPORT_ONLY` · **企业级对拍总册**  
**Recorded:** `2026-07-20T07:06:44Z`  
**PSG Active Pin（唯一现行基准）：** `PSG-REL-20260720-WEB3-CAND-V2`  
**Candidate SHA：** `652bbab51a1eb0652ea31f18ae4146fbe325a1ea`  
**Deploy baseline：** `v311_fund_safety_candidate_v2`

```text
唯一真源 = PSG Registry active + Candidate Identity + L1–L5 Matrix（诚实态）
本审计 = 确认 PSG 可信 → 反向对拍全系统 → Master Gap Checklist
禁止：改 Candidate · 部署 · 动 Final Closure / L5 / S7
修复：Formal Baseline 后 PCR → Fix → Delta Recertify
```

**回答「以前做过为什么又出现」：**  
因为过去优化落在 **代码/证据/局部 ①**，未强制 **认证版本 = 部署版本 = 数据版本 = 文档版本 = 用户体验** 同钉。本册把该等式写成对拍清单。

---

## 0 · PSG Source Validation（真源是否最新、完整、可信）

| 检查 | 结果 | 判定 |
|------|------|------|
| Registry active 唯一 pin | `PSG-REL-20260720-WEB3-CAND-V2` · status `WEB3_CANDIDATE_BASELINE_ACTIVE` | **PSG_VALID** |
| Candidate Pin 唯一 | `web3-mainline` + `web3-candidate-v2` + Release Identity 同钉 tip | **PSG_VALID** |
| FG-15-A / `09c72b93` | `ARCHIVED_HISTORICAL` · `NOT_FOR_PROMOTION`（残留允许，须勿当 ACTIVE） | **PSG_VALID**（归档）+ 活文误读风险见 EVIDENCE_DRIFT |
| Local HEAD = Identity SHA | ✅ `652bbab5…` | **PSG_VALID** |
| L1–L5 Matrix 是否「真实」 | Matrix：L1–L4 PARTIAL/NEED_FIX · L5 NOT_READY · `psg_complete: false`；STATUS 文件 `equals_l*_pass: false` | **PSG_VALID（诚实）** — 可信 ≠ 已 Complete |
| Evidence 对应当前 pin | L1–L4 / Candidate Identity 钉 CAND-V2 | **PSG_VALID**（层未 PASS） |
| PSG 是否「最新」 | Registry/Local tip **最新**；**Staging 非 tip** | 真源侧 VALID · Runtime 侧见 OLD_RUNTIME |
| PSG 是否「完整」 | **否** — Complete=0% · 五层无 PASS | 诚实缺口 · 非假 PASS |
| PSG 是否「可信」 | **是（作为未完成 candidacy 真源）** — 未宣称错误版本已认证通过 | **PSG_VALID** |

```text
PSG 可信 SSOT（Candidate 收口目标）
        ≠
Staging Runtime（f8181b63）
        ≠
Production Ready / PSG Complete
```

---

## 1 · 全系统对拍总表（相对 PSG tip）

### 1.1 Runtime Alignment

| 项 | vs PSG tip | Class |
|----|------------|-------|
| Local SHA | ✅ = tip | **PSG_VALID** |
| Staging `/meta` SHA | ❌ `f8181b63` | **OLD_RUNTIME** |
| Fly Image API v279 / Web ~7/19 | ❌ | **OLD_RUNTIME** |
| API/Web/Worker 同版本 | ⚠ Worker 未证 | **OLD_RUNTIME** / UNKNOWN |
| Env（合约投影） | ❌ V2 null · Fee 不一致 | **OLD_RUNTIME** |
| Feature flags（邮件 transport 等） | 生产级未武装 | **TRUE_FEATURE_GAP**（配置+代码） |

### 1.2 Database / Schema

| 项 | 结论 | Class |
|----|------|-------|
| Auth token / send-window migrations 存在 | 支持链接流 · 路由未用 | Schema **备好** · 行为 **TRUE_FEATURE_GAP** |
| L2 migration checksum pack | READY_FOR_RECALCULATE · ≠ PASS | **PSG_VALID**（诚实） |
| Staging schema 全量对 tip | 本 dry-run **未直连 PG diff** | UNKNOWN → Alignment 后 `PCR-DATA-*` |
| Soft-delete / FK / Index / Lifecycle 穷尽 | 未本轮法医全库 | UNKNOWN（记 Master · 非假绿） |
| Dual-write 默认 log_only · Outbox 默认 off | 生产数据面弱 | **TRUE_FEATURE_GAP** |
| CMS QA LATEST 键污染（SG=FR） | 证据/数据键 | **OLD_DATA** / **EVIDENCE_DRIFT** |

### 1.3 Auth & Identity

| 项 | Class |
|----|-------|
| 注册/登录可用（①） | Feature 存在 |
| 真邮件 OTP · 所有权证明 · Reset · Email Change · 改密撤会话 · MFA | **TRUE_FEATURE_GAP** |
| Rate limit / Audit 不完整 | **TRUE_FEATURE_GAP** |
| 「Staging 旧导致 Auth 回退」 | **已排除**（auth tip ∈ staging 祖先） |

### 1.4 Business Flow

| 流 | Class |
|----|-------|
| 市场浏览 / Provider / Guide / Order（① 局部） | 多面 ① 冻结/烟测 · **≠** ②/③ GO |
| Payment / Escrow / Settlement（Candidate Money Path） | 证据在 Sepolia 轨；**Staging `/meta` 未投影** → **OLD_RUNTIME** + 证后 **NEEDS** Delta |
| Dispute / Governance | 部分 ①；链上完整生产级另闸 | **TRUE_FEATURE_GAP** / ② 债 |
| Admin 高危确认 / 退款路径 | **TRUE_FEATURE_GAP** |
| Onboarding fee stub / Stripe | **TRUE_FEATURE_GAP** |

### 1.5 UI/UX

| 项 | Class |
|----|-------|
| 五主 / Auth UI / Escrow 草稿冻 | **PSG_VALID**（① UI 纪律） |
| 已上链 Escrow UI 未冻 · 死按钮/Mock 残留风险 | **TRUE_FEATURE_GAP** |
| FE Unsplash fallback 假绿 | **TRUE_FEATURE_GAP** / **OLD_DATA**（展示源） |
| 页面 vs 最新 API（Staging） | 可能对旧镜像 | **OLD_RUNTIME** |
| loading/error/空态/i18n/移动端穷尽 | 未全站法医 | UNKNOWN（抽样 Backlog） |

### 1.6 CMS / Data Governance

| 项 | Class |
|----|-------|
| JP Country CLOSED · 330 LOCKED | **PSG_VALID**（② 内容运营） |
| Unsplash / bake / 外链 / QA 键 | **TRUE_FEATURE_GAP** · **OLD_DATA** · **EVIDENCE_DRIFT** |
| Draft 泄漏 / 重复 | 风险登记 CMS Audit | **TRUE_FEATURE_GAP** |

### 1.7 Web3

| 项 | Class |
|----|-------|
| Candidate Identity / Sepolia 地址证据 | **PSG_VALID**（认证目标） |
| Staging FactoryV2/SR/Fee/Indexer | **OLD_RUNTIME** |
| Money Path L5 Final | 未跑（等 ETA） | 时间闸 · **≠** 假 PASS |

### 1.8 Evidence / Docs / Scripts

| 项 | Class |
|----|-------|
| Active Registry / Identity | **PSG_VALID** |
| 活文仍写 `09c72b93` 为「当前」· FG-15-A 活命令 | **EVIDENCE_DRIFT** |
| 废弃 `run-fg15-*` 被教 | **EVIDENCE_DRIFT**（脚本） |
| Archive 保留 | **PSG_VALID**（勿删） |

### 1.9 NEEDS_OWNER

| 项 | Class |
|----|-------|
| phone（可选）· 备份 on-call HOLD | **NEEDS_OWNER** |
| Vesting cliff/duration/start | **NEEDS_OWNER** |
| Stripe live / 品牌域 / Founder 钱包激活 | **NEEDS_OWNER**（③） |
| Formal Baseline / W5 Sign-off | **NEEDS_OWNER**（ETA 后 · 非本窗） |

---

## 2 · Production Readiness Master Gap Checklist

> 合并：Consistency PRC-* · Gap Audit PRG-* · 本 SSOT 对拍。  
> **禁止**塞进 `PSG-REL-20260720-WEB3-CAND-V2` Final Closure。

### PSG_VALID（符合现行 PSG 真源声明）

| ID | 项 |
|----|-----|
| M-PV-01 | Active pin 唯一 · Local = Identity SHA |
| M-PV-02 | FG-15-A 已 ARCHIVED · 非 Promotion |
| M-PV-03 | L1–L5 **未假 PASS** · `psg_complete=false` |
| M-PV-04 | Candidate Sepolia Identity 证据根存在 |
| M-PV-05 | Discovery Freeze / 等窗禁止项已文档化 |

### OLD_RUNTIME

| ID | 项 | → PCR 流 |
|----|-----|----------|
| M-OR-01 | Staging SHA ≠ tip（4 commits） | STAGING-RUNTIME-ALIGNMENT |
| M-OR-02 | Fly 镜像旧 | 同上 |
| M-OR-03 | `/meta` FactoryV2/SR/Fee/Indexer | 同上 + WEB3-RUNTIME-IDENTITY |
| M-OR-04 | Staging UI 可能对旧 API | Alignment 后烟测 |

### OLD_DATA

| ID | 项 | → PCR 流 |
|----|-----|----------|
| M-OD-01 | CMS QA LATEST 键污染 / 展示源与 Catalog 不一致风险 | CMS-GOV-CLEANUP |
| M-OD-02 | Dual-write log_only / Outbox off 导致数据面滞后风险 | DATA-* |

### CODE_DRIFT

| ID | 项 | → PCR 流 |
|----|-----|----------|
| M-CD-01 | tip 未部署（CODE_NOT_DEPLOYED） | Alignment |
| M-CD-02 | 孤儿 Auth 模块 vs stub 路由（代码双层） | AUTH-PROD-HARDENING |

### SCHEMA_DRIFT

| ID | 项 | → PCR 流 |
|----|-----|----------|
| M-SD-01 | Staging 全库 vs tip migration **未本轮证** | Alignment 附录 · `PCR-DATA-*` |
| M-SD-02 | 表在 · 生产流程未用（非缺列，是行为） | 归 TRUE_FEATURE_GAP（Auth） |

### TRUE_FEATURE_GAP

| ID | 项 | → PCR 流 |
|----|-----|----------|
| M-FG-01 | Auth 生产生命周期（OTP 真邮/Reset/EmailΔ/审计） | AUTH-PROD-HARDENING |
| M-FG-02 | Session revoke-all · Admin step-up · Cookie 策略 | SEC-* |
| M-FG-03 | GDPR 删号/导出 | USER-GDPR |
| M-FG-04 | CMS 静默 fallback / bake 硬闸 | CMS-GOV |
| M-FG-05 | Outbox/Dual-write/幂等支付面 | DATA-* |
| M-FG-06 | Onboarding stub / Stripe | ONB-* |
| M-FG-07 | Escrow 上链 UI / Pay failure UX | ESC-PAY |
| M-FG-08 | L4 监控/Pager | OPS-* |

### EVIDENCE_DRIFT

| ID | 项 | → PCR 流 |
|----|-----|----------|
| M-ED-01 | 活 Runbook `09c72b93`「当前」语气 | Hygiene |
| M-ED-02 | FG-15-A living 脚本命令 | Hygiene |
| M-ED-03 | Candidate CODE-FREEZE/README 旧叙事 | Hygiene |
| M-ED-04 | CMS SG QA 文件错误国家键 | CMS-GOV |

### NEEDS_OWNER

| ID | 项 |
|----|-----|
| M-NO-01 | phone / backup on-call |
| M-NO-02 | Vesting 时间参数 |
| M-NO-03 | ③ 品牌域 · Stripe live · 钱包激活 |
| M-NO-04 | ETA 后 Formal Sign-off（W5） |

---

## 3 · Gap Map → 修复流（不变）

```text
当前 PSG（可信 · 未 Complete）
    ↓
本 SSOT Consistency Audit（dry-run）✅
    ↓
Production Gap Map（本章）
    ↓
WAIT_ETA Maintain（不修）
    ↓
Formal Baseline
    ↓
Independent PCR（按 Post-Baseline Backlog Wave 0–7）
    ↓
Fix
    ↓
PSG Delta Recertify
    ↓
Production Ready（另闸 · ≠ 本 pin 自动 GO）
```

**SSOT 队列：** [TT-POST-BASELINE-INDEPENDENT-BACKLOG-LATEST](./TT-POST-BASELINE-INDEPENDENT-BACKLOG-LATEST.md)  
**详表：** [Gap Audit PRG](./TT-WAIT-ETA-PRODUCTION-READINESS-GAP-AUDIT-DRY-RUN-LATEST.md) · [Consistency PRC](./TT-RELEASE-RUNTIME-CONSISTENCY-AUDIT-DRY-RUN-LATEST.md)

---

## 4 · 等式验收（企业级收口定义）

```text
认证版本 = 代码版本 = 部署版本 = 数据版本 = 文档版本 = 用户实际体验
```

| 等式左边 | 当前 |
|----------|------|
| 认证版本 | ✅ tip `652bbab5` / CAND-V2 |
| 代码版本（Local） | ✅ = tip |
| 部署版本（Staging） | ❌ |
| 数据版本 | ⚠ / ❌（CMS 键 · dual-write/outbox） |
| 文档版本 | ⚠ 活文漂移 |
| 用户体验（生产级） | ❌ 多 TRUE_FEATURE_GAP |

**唯一已对齐：** 认证 ↔ Local 代码 tip。  
**最大断裂：** 认证/Local ↔ Staging 部署+合约投影。

---

## 5 · 诚实边界

```text
PSG 可信 ≠ PSG Complete
PSG Complete ≠ Production GO
本 Master Checklist ≠ 已修复
禁止用本审计重开 Candidate pin 或提前 S7
```

**机读：** [`TT-PSG-SSOT-CONSISTENCY-AUDIT-DRY-RUN-LATEST.json`](./TT-PSG-SSOT-CONSISTENCY-AUDIT-DRY-RUN-LATEST.json)
