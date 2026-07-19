# PSG · Production Readiness Register（唯一问题池）

**Machine:** `TT_PRODUCTION_READINESS_REGISTER`  
**Status:** **`FROZEN`** · 四桶冻结 · **Release Control Standby** · `2026-07-19`  
**Governance:** F-02 WAIT_WINDOW · heartbeat only · Frozen RC / Money-Path / Gate **不变**  
**发布裁决（只看 Gate）：** [TT-PSG-PRODUCTION-RELEASE-READINESS-GATE-LATEST.md](./TT-PSG-PRODUCTION-RELEASE-READINESS-GATE-LATEST.md) · `CONDITIONAL_GO`  
**机读：** [`registry/psg-production-release-readiness-gate.v1.yaml`](../../registry/psg-production-release-readiness-gate.v1.yaml)  
**决策版：** [TT-RELEASE-CONTROL-STANDBY-LATEST.md](./TT-RELEASE-CONTROL-STANDBY-LATEST.md)

> **PSG ≠ 全部修完才上线。** **PSG = 风险系统化验证与决策的唯一入口。**  
> **Register = 风险与发布状态地图** · **不是**「所有行必须跑一次的任务列表」。  
> **Finding 存在 ≠ 发布不合格。** 不要求零 Finding；要求 **Status · Evidence · Owner · 处理路径** 齐全。  
> 九维检查 **必须入本册** — 禁止「做过但散落 10 个文档」。  
> 发布前只通过 **PSG Gate Verdict** → `GO` / `CONDITIONAL_GO` / `NO-GO`。  
> Gate 含 **Coverage Acceptance（七维最终层）**：Fix 关闭后须复验覆盖门槛，**修完 ≠ GO**。  
> 仅 **RELEASE_BLOCKER** + **RELEASE_FIX_REQUIRED** 必须在 Release Window 修复并复验；其余有记录·Owner·计划即可。  
> 四桶 **冻结** — Completeness **停止扩展** — 禁新 Audit/Shadow/UI/CMS/Drift/E2E/Perf 灌池。  
> **禁止**把 Deferred / NOT_RUN / CITE **转化**为本窗审计任务 · **禁止**因 Acceptance 黄灯开 WAIT_WINDOW 旅程风暴。

### Register 三层（写死 · 防混淆）

| 层 | 名称 | 含义 | 本窗动作 |
|----|------|------|----------|
| **①** | **Verified Evidence** | 已检查 · 有证据 · `CLOSED` / `PASS` / `FINDING` | 不重跑 |
| **②** | **Release Action** | 已确认影响当前发布 · 等 Release Window | **仅** Fix Required=8 |
| **③** | **Governance Coverage** | 已登记覆盖 · **≠** 已执行检查 · **≠** 发布阻断 | `DEFERRED` / `NOT_RUN` / `CITE` · **不自动执行** |

**① 主轨（已 CLOSED）：** PFA · Hardening · Security/UI Shadow · CMS/Data · Final Paper · Dependency/Obs Paper（+ cite）。  
**② 唯一动作面：** Fix Required=8（WC · ACTIVE · Role · Trust · SHA · image…）。  
**③ 含 §2b：** Legal×5 · Artifact · TLS · Owner Signature · Status Template 等 — **Coverage 占位 only**。

**分类词汇（与 Gate 同键）：**

```text
PASS | CLOSED | RELEASE_FIX_REQUIRED | DEFERRED | ACCEPTED_RISK | NOT_RUN | BLOCKED
RELEASE_FIX_REQUIRED   ← 层② · 硬停子类见 Gate RELEASE_BLOCKER
```

---

## 1 · CLOSED（已验证 / 已归档 · 检查覆盖存在）

| 领域 | 产物 | 目的 | 状态 |
|------|------|------|------|
| Release Identity | [PFA-01](./TT-PFA-01-RC-FINAL-ATTESTATION-LATEST.md) | 发布哪个版本 | CLOSED · NEED_OWNER_CONFIRM（钉 SHA） |
| Chain Identity | [PFA-02](./TT-PFA-02-CHAIN-DEPLOYMENT-MANIFEST-LATEST.md) | ACTIVE/LEGACY 边界 | CLOSED · NEED_OWNER_CONFIRM |
| Config Contract | [PFA-03](./TT-PFA-03-CONFIG-CONTRACT-LATEST.md) | 运行依赖契约 | CLOSED · NEED_OWNER_CONFIRM |
| UI Runtime Binding | [PFA-UI-01](./TT-PFA-UI-01-RUNTIME-UI-BINDING-LATEST.md) | Finding 是否穿透 UX | **CLOSED · FINDING** |
| CMS / Data Ownership | CMS Specialty · Hardening P1 | 数据真源 | CLOSED |
| Security Shadow | Web3 Security+UI Shadow | 权限/边界 | CLOSED |
| RBAC Shadow | Hardening P0 | 角色权限纸面 | CLOSED |
| Escrow State | Hardening P1 | 业务状态映射 | CLOSED |
| Incident Response | Hardening P2 | 异常路径纸面 | CLOSED |
| Runbook / Ceremony | Prep Track · Operator Card · Rollback | 执行流程 | PAPER_READY |
| Hardening 全链 | [Chain CLOSED](./TT-PRODUCTION-READINESS-HARDENING-CHAIN-CLOSED-LATEST.md) | 禁重开 Shadow | CLOSED |
| Dependency + Obs/Backup | [Final Paper](./TT-PFA-FINAL-PAPER-REVIEW-LATEST.md) | 坏了找谁 · 如何发现/恢复 | CLOSED |
| T0 UI Readonly | [T0](./TT-UI-UX-T0-READONLY-ALIGNMENT-LATEST.md) | 五主/营销只读对拍 | CLOSED |
| Prod Readiness Shadow | [Shadow](./TT-PRODUCTION-READINESS-SHADOW-CHECK-LATEST.md) | 发布前影子检查 | CLOSED |

### 1b · CLOSED · 覆盖补登（cite-only · 不重跑 · 2026-07-19）

> 仓库**已有**证据/冻结/Cert，原先未显式出现在 §1 表。  
> **仅挂链入册** · **禁止**因此重开 Audit/Shadow/深挖。

| 维度 | 检查 / 产物 | 目的 | 入册方式 |
|------|-------------|------|----------|
| **经济/协议** | Constitution V3.1.1 Final · protocol-ssot | 经济规则唯一写入口 | CITE · CLOSED |
| **链基线 Cert** | V311 Sepolia Clean Baseline CERT | ACTIVE 部署已证 | CITE · CLOSED |
| **执行矩阵** | Web3 Active Execution Matrix + gate | 部署/FE/BE 唯一执行入口 | CITE · CLOSED |
| **Admin 能力** | Admin Backoffice CERT | RBAC/审批纸面 CONDITIONAL_PASS | CITE · CLOSED（live→Deferred） |
| **五主 UI** | FIVE-MAIN Phase1 Freeze | `/` `/market`… 结构冻结 | CITE · CLOSED |
| **Auth UI** | Login/Register UI Freeze | 登录注册壳冻结 | CITE · CLOSED |
| **商家入驻 UI** | Provider Register UI Freeze | 入驻壳冻结 | CITE · CLOSED |
| **收购 PD-009** | Acquisition + Me Identities Freeze | 旅行收购走廊 ① | CITE · CLOSED |
| **Escrow 草稿** | Escrow Draft Experience Freeze | 预链上订单体验 | CITE · CLOSED |
| **测试账号** | test-accounts immutable C1–E2 | 验收角色身份 | CITE · CLOSED |
| **仪式/回滚** | Operator Card · Launch Day · Rollback Tree · Acceptance Book | 当天执行与回滚 | CITE · PAPER_READY→CLOSED 覆盖 |
| **对齐策略** | Alignment Expected Difference Policy | Defect vs Expected | CITE · CLOSED |
| **Owner 队列** | Owner Final Human Queue · Release Control OA | 人工硬闸清单 | CITE · CLOSED（卫生） |
| **配置零漂移** | TT_CONFIGURATION_ZERO_DRIFT FROZEN | CFG 已毕业 | CITE · CLOSED |

---

## 2 · RELEASE_FIX_REQUIRED（必须修 · 本窗禁执行）

真源细表：[Min-Fix 候选](./TT-PFA-RELEASE-WINDOW-MIN-FIX-CANDIDATES-LATEST.md) · Gate 计数见 [Release Readiness Gate](./TT-PSG-PRODUCTION-RELEASE-READINESS-GATE-LATEST.md)  
**当前无** `RELEASE_BLOCKER` 打开项（资金 P0=0）。

| Finding | Sev | 当前动作 | 变更风险 |
|---------|-----|----------|----------|
| WC absent (`PFA-UI-WALLET-01` / PFA-CFG) | P1/P2 | Release Min-Fix · OA-H1 | 低（注入 secret · 不改 RC） |
| Legacy Governor UI (`PFA-UI-GOV-01`) | P1/P2 | Release Min-Fix · FE 钉 ACTIVE | 中（build env · 单项复验） |
| `/meta` governor class (`PFA-UI-GOV-02`) | info→P2 | Release 对拍 | 低 |
| Legacy Steward stake UI (`PFA-UI-STEWARD-01`) | P1/P2 | Release Min-Fix · FE 钉 ACTIVE | 中 |
| Role 完成路径 (`PFA-UI-ROLE-02`) | P2 | WC+ACTIVE 后单项复验 | 低 |
| Role Hub CTA (`PFA-UI-ROLE-01`) | info | 仅误导时最小改 | 低 |
| RC `candidate_sha` NOT_PINNED (PFA-01) | P2 | Owner 钉 publish object | 低（声明 · 不 retag） |
| Trust Surface (`PFA-UI-TRUST-01`) | — | **Reference only** · Min-Fix seq4 · **不增 Fix 计数**（并入既有 8 桶 / Role·Trust 主题） | — |

**开放计数（写死）：** `Release_Fix_Required_open = 8`（上表 Reference 行 **不**计入第 9 项）。  
**执行规则：** 最小修复 + **单项复验** · 禁全量重跑 · 禁 WAIT_WINDOW 预做。

---

## 2b · Register Completeness Update（2026-07-19 · No Audit / No Fix）

> **目的：** 补「有名无行」治理叶子 · **不是**重新审计。  
> **约束：** 状态仅 `DEFERRED` / `NOT_RUN` / `CITE` · **不**增加 Coverage · **不**增加 Fix Required · **不**改变 `CONDITIONAL_GO` · 不触碰 Frozen RC / Money-Path / WAIT_WINDOW。

### D9 · Legal / External Surface（第一优先）

| ID | Leaf | Status | Owner | Phase |
|----|------|--------|-------|-------|
| `PSG-LEGAL-TOS` | ToS | **DEFERRED** | Legal/Founder | Public Release |
| `PSG-LEGAL-PRIVACY` | Privacy | **DEFERRED** | Legal/Founder | Public Release |
| `PSG-LEGAL-TOKEN-DISCLOSURE` | Token Disclosure | **DEFERRED** | Legal/Founder | Public Release |
| `PSG-LEGAL-TRUST-CENTER` | Trust Center Disclosure | **DEFERRED** | Legal/Founder | Public Release |
| `PSG-LEGAL-INVESTOR-MATERIAL` | Investor Material Consistency | **DEFERRED** | Legal/Founder | Public Release |

### D1 · Artifact Integrity（挂名 · 不强制 SBOM 流程）

| ID | Leaf | Status | Owner | Note |
|----|------|--------|-------|------|
| `PSG-ART-INTEGRITY` | checksum / image digest / SBOM / signature·provenance | **NOT_RUN** / **DEFERRED** | Owner/Release | SHA·Tag·Archive 已有；完整仪式挂名即可 · **禁**本窗开 SBOM 工程 |

### D2 · TLS Owner（责任链 · 不验证书）

| ID | Leaf | Status | Owner | Renewal / Escalation |
|----|------|--------|-------|----------------------|
| `PSG-TLS-OWNER` | TLS Certificate | **DEFERRED** / **NOT_RUN** | Owner/Infra（待填） | Renewal: 待填 · Escalation: pause entry + HOLD |

### CITE · Timelock / Proposal #1（不复制任务）

| ID | Leaf | Status | Note |
|----|------|--------|------|
| `PSG-CITE-TIMELOCK-F02` | Timelock · Proposal #1 执行窗 | **CITE** | F-02 主轴已有 · **禁止**另开任务轨 |

### Trust Surface Reference（见 §2 · 不增 Fix）

| ID | Status | Maps to |
|----|--------|---------|
| `PFA-UI-TRUST-01` | Reference → existing Fix Required bucket | Min-Fix seq4 · open count **仍为 8** |

**Completeness Δ：** Register completeness ↑ · Gate Verdict **不变** · Fix Required **= 8**。

### 2b-final · 最终两行占位（此后 Completeness **停止扩展**）

> **Coverage Sufficient。** 继续补叶子 **不**提升上线确定性。  
> 下列为允许的最后 Completeness 增量 · **非阻断** · **不进 Gate 计数** · 之后 Register Completeness **FROZEN**。

| ID | Leaf | Status | Owner | Note |
|----|------|--------|-------|------|
| `PSG-RELEASE-OWNER-SIG` | Release Owner Signature | **CITE** / **CLOSED** hygiene | Owner/Founder | 本切片最终负责人署名位 · **不产生任务** |
| `PSG-EXT-STATUS-TEMPLATE` | External Status Communication Template | **DEFERRED** | Owner | 谁发公告 · 何渠道 · 谁批准 · **不进 Gate** |

**禁止再补：** SBOM 工程化 · Legal 文案制作 · Settlement/Dispute 深拆 · Indexer SLA 重建 · 任何新 Audit/Shadow/Checklist 膨胀。

---

## 3 · DEFERRED（后续阶段 · 有 Owner · 有计划）

| Finding / 项 | Sev | 阶段 | 说明 |
|--------------|-----|------|------|
| Admin UI / live RBAC (`PFA-UI-ADMIN-01`) | — | **PFA-04** | NOT_RUN → Access Boundary · **本地 Coverage 旁证已记**（见下 · **≠** 关闭本 DEFERRED） |
| Live 角色矩阵 (`PFA-UI-ROLE-03`) | — | **PFA-04** | 人工旅程 |

### 3a · Coverage Phase3 · Register 关联漂移（本地 · `ΔFix=0`）

| Cell / ID | 现象 | 处置 | Status |
|-----------|------|------|--------|
| `RBAC\|Tourist\|CAP_ADMIN_DENY\|F_DENY_API` · cite `PFA-UI-ADMIN-01` | `tourist@test.com` 被 seed promote 成 `admin` → Tourist Admin 拒测假失败 | `seed_repair_immutable_business_account_roles` + promote 拒 immutable 业务邮箱（`crates/api/src/chain_off/auth.rs`）→ 复验 403 | **CLOSED**（本地种子角色）· **Alignment 未闭环** |
| Data `Announcement\|Create` | 创建体缺 `kind` / 错 `content_tier` | 探针对齐 `CmsAnnouncementCreateInput` + DB check（**非**产品逻辑改） | **CLOSED**（探针）· **Alignment 未闭环** |
| Consistency Step4 · Git/Build 漂移 | 干净 tip 缺 `session_cookie` / `production_metrics` / `revoke_all_sessions_for_user` → Staging 部署 COMPILE_FAIL | 最小入提交：`main.rs` mods + `production_metrics.rs` + `users_sessions::revoke_all_sessions_for_user` → SHA `0a0265d3` | **CLOSED**（可构建对齐）· Staging ALIGNED 另证 |
| Consistency Step4 · Staging smoke · `PSG-COV-STG-MIG-01` | tip `179cf7c3` 镜像构建成功但启动失败：DB 已应用 `20260713180000`，镜像 migration 集缺失（WIP 未提交） | 纳入 `20260713*`/`20260715*`/`20260716*` migrations → tip `9528f593` | **CLOSED**（文件已入 Git） |
| Consistency Step4 · Staging smoke · `PSG-COV-STG-MIG-02` | tip `9528f593`/`406fb32c`：CRLF→LF 后仍 crash；根因扩展为 `20260713180000` DB checksum ≠ tip 文件 SHA384 | `.gitattributes eol=lf` + 对齐 `_sqlx_migrations.checksum`→ tip LF SHA384 · Staging `/meta`=`406fb32c` | **CLOSED**（Staging boot + SHA 对拍）· Coverage Recalculate 另窗 |

> **不**增加 Fix Required（仍 **= 8**）· **不**改 `CONDITIONAL_GO` · **不**关闭 PFA-04 Access Boundary DEFERRED · **不**触碰 Web3 Min-Fix。  
> **Consistency Control：** [TT-PSG-COVERAGE-CONSISTENCY-CONTROL-LATEST](./TT-PSG-COVERAGE-CONSISTENCY-CONTROL-LATEST.md) —  
> 修复路径必须 **Register → Fix → Local → Git SHA → Staging 同 SHA → Evidence → Recalculate**；**禁止**仅本地计入 Coverage PASS · **禁止**伪造 ALIGNED。  
> **Domain Batch：** [TT-PSG-DOMAIN-BATCH-CLOSURE-LATEST](./TT-PSG-DOMAIN-BATCH-CLOSURE-LATEST.md) — 域序 RBAC→Journey→Data→UI→Web3 · **一域一批一部署** · Web3=HOLD（Fix=8）。
| Finding / 项 | Sev | 阶段 | 说明 |
|--------------|-----|------|------|
| Final User Journey Acceptance | — | Release / Staging Validation | **不**进 WAIT_WINDOW（防 UX Finding 风暴） |
| Escrow on-chain UI + `/rate` | P2 | Money-Path / 专项冻结后 | HRD-ESM-03 |
| Escrow Composite fund-stack | P2 | **Money-Path 后** | CONFIRMED_DESIGN 双面 |
| Settlement / Dispute 走廊 | — | **Money-Path** | 完整性挂名见 §7 · **禁**提前打开 |
| Pulse/CMS 双轨 | P2 | 数据治理后续 | HRD-DOM-03 |
| CSP/HSTS | P2 | Security Hardening / ③ | PFA-CFG-04 |
| Performance Smoke（首页/P95/CDN） | — | 低优先 · Staging | 非压测 |
| Legal / External Surface（五行） | — | Public Release | **明细见 §2b** · Owner Legal/Founder |
| Dependency Ownership 纸面 (A) | — | Final Paper **DONE** | 见 §5 / §5b |
| Observability/Backup 纸面 (B) | — | Final Paper **DONE** | 见 §5 / §5b |
| Prod Domain/DNS 未定 | P2 | ③ Owner 填 | PFA-FP-DEP-02 |
| DB backup drill | P2 | 后续演练 | PFA-FP-OBS-03 |

---

## 4 · ACCEPTED_RISK（已知 · 有应对 · 本切片接受）

| 项 | 说明 | 处理方案 |
|----|------|----------|
| EscrowFactory / FeeRouter = LEGACY_COMPOSITE | 不在 ACTIVE gov spine | Money-Path 前按 composite 消费 · 不伪装 ACTIVE |
| Staging FE example ≠ ACTIVE | 已知误绑类 | Release Min-Fix 钉 ACTIVE · 非 WAIT_WINDOW 改 Registry |
| Solo On-call = Owner | 无第二人 | 升级路径 = pause entry + HOLD（IR / P2 Card） |
| Alert/Pager 未接线 | OWNER_CONFIG | 生产接线 Owner · 不伪称已接 |
| PFA-01 baseline OK ≠ publish pinned | 身份清晰 | Owner 书面钉 `candidate_sha` |
| Dirty worktree ≠ RC | 已阻断误用 | Release 禁止用 HEAD 当发布对象 |

---

## 5 · 可选纸面（48h 内最多两项 · 非强制 · 非大型审计）

| ID | 检查 | 目的 | 状态 |
|----|------|------|------|
| **A** Dependency Ownership | Fly/DB/RPC/Storage/DNS/WC/Email 谁负责 | 坏了找谁 | **DONE** · NEED_OWNER_CONFIRM · [Final Paper](./TT-PFA-FINAL-PAPER-REVIEW-LATEST.md) |
| **B** Observability + Backup Paper | 发现机制↔事故卡 · 恢复路径 | 如何发现与恢复 | **DONE** · PASS · [Final Paper](./TT-PFA-FINAL-PAPER-REVIEW-LATEST.md) |

**明确不做（WAIT_WINDOW）：** 接生产监控 · 压测 · 渗透 · 全量 E2E · Money-Path · 全系统 Drift · 新泛审计。

---



## 5b · Final Paper Review（补充 · 2026-07-19）

**不改变** §1–4 四桶分类定义。本补充仅挂证据：

| Check | result | Evidence |
|-------|--------|----------|
| A Dependency Ownership | **NEED_OWNER_CONFIRM** | `pfa-final-paper-review-20260719/` · [Runbook](./TT-PFA-FINAL-PAPER-REVIEW-LATEST.md) |
| B Observability + Backup | **PASS** | 同上 |

**入桶建议（不改既有行，仅增量）：**

| 项 | 建议桶 |
|----|--------|
| Domain/DNS OWNER_CONFIRM | Deferred / Owner ③ 填域名 |
| Email optional | Deferred / Accepted optional |
| Metrics paper · pager 未接 | Accepted Risk（已有） |
| DB backup drill NOT_RUN | Deferred（演练） |
| Dep/Obs 纸面本身 | Closed（本审查完成） |

**此后：** 停止新审计 · heartbeat only · Min-Fix 仅 Release Window。

## 6 · 当前最大风险（非「未知 Bug 数量」）

1. 发布对象是否唯一（PFA-01）  
2. ACTIVE/LEGACY 是否清晰且 FE 不误绑（PFA-02 / UI-01）  
3. Release Window 修复是否受控（Min-Fix 队列）  
4. 上线当天执行是否混乱（Operator Card · Launch Day）

---

## 7 · 总设计 · 尚未「深扫」、但应登记的维度（不新开轨）

> **原则：** 缺的是 Register **行**（存在+分类），不是再跑一轮审计。  
> 下列全部默认 **DEFERRED** 或 **ACCEPTED_RISK** · Owner/计划已写 · **WAIT_WINDOW 禁止开工扫描**。

| 层 | 检查主题 | 建议分类 | 计划（不现做） |
|----|----------|----------|----------------|
| **③ 支付真链** | Money-Path 实跑 · 真 USDC escrow | DEFERRED | Money-Path 窗 · 另闸 |
| **③ PSP** | Stripe 等法币 | DEFERRED / N/A | 可选 · 不挡 Web3 切片 |
| **③ 主网** | Mainnet 地址 · 主网 RPC · 主网 GO | DEFERRED | 新 Release cycle · ≠ 本 Sepolia 窗 |
| **权限真验** | Admin/Guide/Provider live 交叉 | DEFERRED | Staging Validation / PFA-04 |
| **旅程验收** | Tourist→…→Admin 全人工 | DEFERRED | Release/Staging · 防 Finding 风暴 |
| **已上链 Escrow UI** | Protocol shell · `/rate` | DEFERRED | 专项冻结后 |
| **Indexer 生产** | lag SLA · reconcile 值班 | DEFERRED | Obs 接线后 |
| **隐私/合规文案** | ToS · Privacy · Token 披露 vs 页 | DEFERRED | **§2b 五行已挂** · 公开前执行 |
| **对外材料** | 白皮书/PPT vs Constitution | DEFERRED | **§2b Investor Material** · 公开前对齐 |
| **Artifact Integrity** | checksum / SBOM / provenance | NOT_RUN / DEFERRED | **§2b** · 禁本窗开 SBOM |
| **TLS Owner** | 证书续期责任链 | DEFERRED / NOT_RUN | **§2b** · 不验证书 |
| **安全加固** | CSP/HSTS · 限流 · WAF | DEFERRED | ③ Security Hardening |
| **密钥仪式** | Safe 多签演练 · 密钥托管证明 | DEFERRED / ACCEPTED Solo | Solo 书面接受或后期 |
| **备份演练** | DB restore drill PASS | DEFERRED | PI3-001 · 非本窗 Fix |
| **性能** | 首屏/登录/列表手感 | DEFERRED | Staging smoke · **非**压测 |
| **a11y / i18n** | 全站无障碍 · 文案覆盖 | DEFERRED | 维护轨 |
| **SEO / 公开 meta** | OG · sitemap · 索引 | DEFERRED | 营销轨 |
| **多端** | 真机 OA-02 · 移动端 | DEFERRED | ③ / Owner 队列 |
| **内容国别** | JP Content QA → Country CLOSED | 并行 HOLD | **≠** 本发布 Gate 硬依赖 |
| **Drift 全仓** | 全系统 Drift Audit | **禁止现开** | 破坏冻结 · 有怀疑再窄查 |

### 不要纳入的方式（写死）

| × | 原因 |
|---|------|
| 新全站 UI / Security / CMS / Drift / E2E / Perf 轨 | 制造 Deferred Finding · 不提升 Gate |
| 「扫到零 Finding 才 GO」 | 与 Gate 纪律冲突 |
| 把 Money-Path / 主网塞进本 CONDITIONAL_GO | 跳阶 |

**Agent default：** heartbeat only · Register **FROZEN** · Completeness **停止扩展**（§2b-final 为末次）· 不执行 Min-Fix · 仅待 `execute_allowed_now=true` → Fix Required=8。
