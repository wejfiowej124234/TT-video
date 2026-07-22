# Release Runtime Consistency Audit · DRY-RUN（WAIT_ETA）

> **SUPERSEDED_SNAPSHOT** · tip `652bbab5` ≠ current Active tip `97289a71` · pin `PSG-REL-20260720-WEB3-CAND-V2` · FG-15-B **ELAPSED** · not release mainline.


**Machine:** `TT_RELEASE_RUNTIME_CONSISTENCY_AUDIT_DRY_RUN`  
**Status:** `DRY_RUN_COMPLETE` · `REPORT_ONLY` · **≠ Candidate Final Closure**  
**Recorded:** `2026-07-20T06:58:53Z`  
**Pin / tip:** `PSG-REL-20260720-WEB3-CAND-V2` · `652bbab51a1eb0652ea31f18ae4146fbe325a1ea`  
**Staging API `/meta`:** `f8181b63507fe339e23a1e5285c4242a8bb3507e`  
**Parent freeze:** [Discovery Freeze](./TT-WAIT-ETA-DISCOVERY-FREEZE-LATEST.md) · [Runtime Drift](./TT-RELEASE-RUNTIME-DRIFT-AUDIT-DRY-RUN-LATEST.md)

```text
目标：找出「代码/证据以为是 A · 运行仍是 B」→ Formal Baseline 后独立 PCR
禁止：改 Candidate · redeploy · 修码 · 动 L5/S7 · 塞进 PSG-REL-20260720-WEB3-CAND-V2 收口
价值：验证 Delta Recertify / Alignment 框架需要 dry-run 清单，而非提前实现 Router
```

**诚实句：** Local/Registry/Evidence Identity **一致于 Candidate tip**；Staging Runtime **不一致**；Auth 生产缺口主要是 **TRUE_FEATURE_GAP**，不是「OTP 补丁未部署」。

---

## 0 · 版本三角（总览）

| 节点 | SHA / 状态 | vs Candidate tip |
|------|------------|------------------|
| Local HEAD | `652bbab5…` | ✅ 一致 |
| Candidate Pin / Release Identity | `652bbab5…` | ✅ 一致 |
| Staging API Fly `/meta` | `f8181b63…` | ❌ 落后 4 commits |
| Staging Web | 200 · Fly 进程 ~7/19 镜像族 | ❌ 未证明 = tip（无公开 git_sha） |
| Worker | 本 dry-run **未单独探针** | ⚠ UNKNOWN → Alignment 时补 |
| PSG L1–L5 | READY/prep · `equals_l*_pass=false` | ✅ 未假 PASS |

```text
WAIT_ETA →（本 Audit Dry-run）→ Formal Baseline → Independent PCR → Fix
  → PSG Delta Recertify → Production Readiness
```

---

## A · Runtime Version Drift

| 检查项 | 结果 | Class |
|--------|------|-------|
| Local HEAD = Candidate Pin | ✅ PASS | — |
| Staging / Fly SHA = Candidate | ❌ FAIL（`f8181b63` ≠ `652bbab5`） | **OLD_RUNTIME** · **CODE_NOT_DEPLOYED**（4 tip commits） |
| API / Web / Worker 同版本 | ⚠ API 已知旧；Web 无 git_sha；Worker 未证 | **OLD_RUNTIME** |
| Docker Image 是否旧 | ✅ API v279 @ 2026-07-19 | **OLD_RUNTIME** |
| Environment Variables 是否旧 | ⚠ `/meta` 合约投影 ≠ Candidate Money Path → env/配置旧或未注入 V2 | **OLD_RUNTIME** |
| Feature Flags 是否旧 | ⚠ 仓库示例仍 `EMAIL_TRANSPORT=log`；Staging 未在本轮读 secrets | **DOC_DRIFT**（示例）+ Alignment 时验 secrets |

**tip 未进 Staging 的 4 commits（CODE_NOT_DEPLOYED）：**  
`493596ae` · `09c72b93` · `1de17b6a` · `652bbab5`（Web3 freeze / identity 叙事为主 · **非** Auth OTP 补丁）。

---

## B · Database / Migration Drift

| 检查项 | 结果 | Class |
|--------|------|-------|
| Migration checksum（L2 pack） | 有 `MIGRATION-CHECKSUM-LATEST` · L2=`READY_FOR_RECALCULATE` · ≠ PASS | 证据备齐 · **非**本轮 DB 直连 diff |
| Schema vs 最新代码 | Auth 相关 migration **存在**：`auth_email_tokens` · `auth_email_send_window_events` | Schema **支持**链接流 · **路由未用** → 见 Feature |
| Seed / Demo 是否旧 | 未本轮全量对拍 | ⚠ UNKNOWN → Alignment 烟测 |
| CMS 数据结构 | 运营证据强；QA LATEST 跨国键漂移 | **DATA_DRIFT**（证据/键） |
| 用户状态字段 | `email_verified_at` 存在且注册即写 | 行为债 · **TRUE_FEATURE_GAP**（所有权证明） |
| Auth 表是否支持最新「生产」流程 | 表支持 · **handler stub / OTP 不接 Resend** | **TRUE_FEATURE_GAP**（非缺表） |

---

## C · Feature Runtime Audit

### Auth Identity

| 项 | 结论 | Class |
|----|------|-------|
| 注册验证码真实邮件 | 仅 `log` 外发；非 Resend | **TRUE_FEATURE_GAP** |
| `email_verified` 真实验证 | 注册成功即 verified | **TRUE_FEATURE_GAP** |
| Forgot Password 生产级 | stub `chain_off_stub` | **TRUE_FEATURE_GAP** |
| Reset Token 持久化 | PG helper 存在 · **路由未接** | **TRUE_FEATURE_GAP**（孤儿基建） |
| Email Change | 不存在 | **TRUE_FEATURE_GAP** |
| Session revoke 完整 | list/按后缀有；改密全撤无 | **TRUE_FEATURE_GAP**（部分） |
| 「因 Staging 太旧导致 Auth 回退」 | **已排除**（`auth.rs` tip ∈ staging 祖先） | — |

### User Account

| 项 | 结论 | Class |
|----|------|-------|
| 注册 / 登录 | ①/② 可用 | Feature OK · 生产邮件链缺口如上 |
| 找回密码 / 邮箱修改 | stub / 缺失 | **TRUE_FEATURE_GAP** |
| 用户资料 / 权限升级 | 未本轮深审 | ⚠ 记 Backlog 抽样项 |

### Payment / Web3

| 项 | Candidate | Staging `/meta` | Class |
|----|-----------|-----------------|-------|
| EscrowFactoryV2 | `0x6e9a4c40…` | **null** | **OLD_RUNTIME** |
| SettlementRouter | `0x5A6df184…` | **缺失** | **OLD_RUNTIME** |
| FeeRouter | `0xf406E6f1…` | `0x81A80092…` | **OLD_RUNTIME** |
| Indexer checkpoint | 观察轨 | **0** | **OLD_RUNTIME** / 弱同步 |
| Chain identity | Sepolia 证据根 | chain_id OK · 合约集否 | **OLD_RUNTIME** |
| Event sync | — | checkpoint 0 | **OLD_RUNTIME** |

### Market / CMS

| 项 | 结论 | Class |
|----|------|-------|
| 展示 / Catalog / COS | ② 运营成熟；FE Unsplash 可假绿 | **TRUE_FEATURE_GAP**/治理 · 或 **DATA_DRIFT**（源） |
| fallback 假数据 | 静默 Unsplash | **TRUE_FEATURE_GAP**（治理硬闸未做） |
| 国家内容键 | SG QA LATEST=FR 键等 | **DATA_DRIFT** · **DOC_DRIFT**（证据文件） |

### Admin / Operations

| 项 | 结论 | Class |
|----|------|-------|
| RBAC | L3 residual / READY ≠ PASS | 登记 residual · Alignment 后抽验 |
| Audit Log | Admin best-effort 有；Auth 审计弱 | **TRUE_FEATURE_GAP**（Auth） |
| Recovery / Monitoring / Owner | L4 Owner 字段已填 · ≠ L4 PASS | VALID 输入 · 非本窗修 |

---

## D · Evidence Consistency

| 项 | 结果 | Class |
|----|------|-------|
| Evidence 引用旧 SHA 当 ACTIVE tip | Candidate Identity = tip ✅；部分 CODE-FREEZE/README / DOC-VS-DEPLOY 仍 `09c72b93` 语气 | **DOC_DRIFT** / **EVIDENCE** |
| Report 旧 Registry | Hygiene 已列 | **DOC_DRIFT** |
| Runbook 旧版本 / 活命令 FG-15-A | Hygiene | **DOC_DRIFT** · **SCRIPT_DRIFT** |
| 废弃脚本 | `run-fg15-*` 默认 DEPRECATED | **SCRIPT_DRIFT** |
| Archive vs Active 混淆 | 风险在活文 · Archive 本身应保留 | **DOC_DRIFT** |

---

## E · Deployment Consistency

| 项 | 结果 | Class |
|----|------|-------|
| Local PASS 是否进 Staging | tip **未**进 Staging | **CODE_NOT_DEPLOYED** |
| Staging 是否对应 Candidate | **否** | **OLD_RUNTIME** |
| Production Candidate 可复现 | 证据根可复现 Sepolia Identity；**Staging 不能**当复现面 | Alignment 后 |
| Build Artifact 可追溯 | `/meta.git_sha` 有值 · `deployed_at=null` | ⚠ 追溯弱 · Alignment 加强 |

---

## Production Readiness Gap Checklist（Formal Baseline 后）

| ID | Class | 摘要 | 目标 PCR 流 |
|----|-------|------|-------------|
| PRC-01 | OLD_RUNTIME · CODE_NOT_DEPLOYED | Staging SHA ≠ tip（4 commits） | **STAGING-RUNTIME-ALIGNMENT** |
| PRC-02 | OLD_RUNTIME | FactoryV2/SR/FeeRouter/Indexer 与 Candidate 不一致 | **STAGING-RUNTIME-ALIGNMENT** |
| PRC-03 | TRUE_FEATURE_GAP | Auth 邮件所有权 / Reset / Email Change / 会话硬化 | **AUTH-PROD-HARDENING** |
| PRC-04 | TRUE_FEATURE_GAP | CMS 静默 fallback / bake 硬闸 | **CMS-GOV-CLEANUP** |
| PRC-05 | DATA_DRIFT | CMS QA LATEST 键污染（SG=FR 等） | **CMS-GOV-CLEANUP** |
| PRC-06 | DOC_DRIFT | 活 Runbook/`09c72b93` 当前语气 | Hygiene `PCR-HY-*` |
| PRC-07 | SCRIPT_DRIFT | FG-15-A living 命令 | Hygiene |
| PRC-08 | UNKNOWN→Alignment | Worker 版本 · Staging secrets 全量 · Seed 对拍 | Alignment 清单附录 |

**禁止：** 将 PRC-* 塞进当前 Candidate v2 Final Closure / `PSG-REL-20260720-WEB3-CAND-V2` 证据根。

---

## 分类计数（本 dry-run）

| Class | 角色 |
|-------|------|
| **OLD_RUNTIME** | Staging 镜像/合约/Indexer |
| **CODE_NOT_DEPLOYED** | tip 4 commits 未上 Fly |
| **DATA_DRIFT** | CMS 证据键 / 展示源风险 |
| **DOC_DRIFT** | 活文档旧 tip 叙事 |
| **SCRIPT_DRIFT** | FG-15-A 脚本仍被教 |
| **TRUE_FEATURE_GAP** | Auth 生产生命周期 · CMS 治理硬闸 |

---

## 与 Delta Recertify Framework

本文件 = **Consistency / Drift dry-run 清单**（发现问题 → 分类 → backlog）。  
**不是**实现 Router · **不是**启动 Project B · **不是**现在 Fix。

Framework 价值验证：若跳过本步，Formal Baseline 后容易再次「认证 A、运行 B」。

---

## 机读

[`TT-RELEASE-RUNTIME-CONSISTENCY-AUDIT-DRY-RUN-LATEST.json`](./TT-RELEASE-RUNTIME-CONSISTENCY-AUDIT-DRY-RUN-LATEST.json)
