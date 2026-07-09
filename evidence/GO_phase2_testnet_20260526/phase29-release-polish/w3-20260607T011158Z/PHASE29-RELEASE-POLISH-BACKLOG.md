# Phase ②.9 · Release Polish Backlog（实施前盘点 SSOT）

**生效：** 2026-06-07  
**状态：** **DEV_GATE OPEN · W3 完成 · ②.9 UI 8/8 DONE**  
**Phase ③ 入口：** **⏸ HOLD**（须 ②.9 完成 + R1–R7 + Owner 签核）

> **纪律：** 本文 **全部登记** 计划中的 UI 与功能改动。**开发未开始** — 须 §6 **实施前清单** 全部勾选后，Owner 显式 **`PHASE29_DEV_GATE: OPEN`** 方可写代码。

**机读索引：** [`phase29-release-polish-backlog.json`](../../evidence/GO_phase2_testnet_20260526/phase29-release-polish/phase29-release-polish-backlog.json)

**编排 SSOT：** [PHASE29-RELEASE-POLISH](./PHASE29-RELEASE-POLISH.md)

---

## 0 · 分类与风险图例

### 0.1 · 五维分类（每项可多选）

| 符号 | 类别 | 含义 |
|------|------|------|
| **UI** | UI 优化 | 文案 · a11y · 空态/加载/错误态 · 非结构微样式 · i18n |
| **BIZ** | 业务功能 | 新/改 API 契约 · 状态机 · 页面逻辑（无 DB 迁移时） |
| **DB** | 数据库变更 | sqlx 迁移 · seed · schema · 投影字段 |
| **RBAC** | 权限变更 | 角色 · console_role · admin 路由矩阵 · promote 规则 |
| **$$** | 资金流程变更 | Stripe · escrow · 链上支付/Claim · fee_schedule 实收 |

### 0.2 · 风险等级

| 等级 | 含义 | ②.9 准入 |
|------|------|----------|
| **L** | 纯 UI/copy/a11y；无 API/DB | **可进 ②.9** |
| **M** | 只读 API 或 FE 展示层；或 staging 证据/烟测 | **②.9 或 post-beta**（看是否触 BIZ） |
| **H** | DB/RBAC/$$/订单写路径/冻结结构 | **post-beta 或 Phase ③** |

### 0.3 · 回归范围代码

| 代码 | 复跑项 |
|------|--------|
| **L0** | `ci-local-delivery-minimum.sh` |
| **L1** | `run-admin-l5-green`（动 admin 时） |
| **L2** | `run-phase2-local-staging-parity-gate.sh --local-test` |
| **S5** | deploy API+Web + alignment |
| **DG** | `run-phase2-deep-release-gate.sh` |
| **S6** | `--staging-retest` + UAT 六大域 |
| **HAT** | `run-phase28-human-acceptance-test.sh` |
| **MKT** | `run-web3-itinerary-l5-green` / market vitest |
| **AUTH** | auth L5 contract tests |
| **ADM** | admin RBAC matrix / ADM-U01 |
| **COM** | community vitest / C-slot smoke |

### 0.4 · 实施桶

| 桶 | 说明 |
|----|------|
| **②.9** | 本轮 Release Polish 允许实施 |
| **post-beta** | 公测后 / Phase ③ 准备期 |
| **phase3** | Production Preparation / 公网 |
| **forbidden** | UI 冻结 · 禁止 |

---

## 1 · ②.9 In-Scope（UI 优化 · 计划实施）

| ID | 标题 | UI | BIZ | DB | RBAC | $$ | 风险 | 回归 | 优先级 | 状态 |
|----|------|:--:|:---:|:--:|:----:|:--:|:----:|------|:------:|------|
| **RP-001** | `/market` 搜索框可见性（label · `role=searchbox` · placeholder · 对比度） | ✓ | — | — | — | — | L | L0 · MKT · HAT | P2 | **DONE (W1)** |
| **RP-003** | Guide 角色 badge/文案（**仅** `/me`·`/guide` 展示层） | ✓ | — | — | — | — | L | L0 · L2 · HAT | P2 | **DONE (W3)** |
| **RP-006** | Admin 举报/争议队列空态与 skeleton 文案 | ✓ | — | — | — | — | L | L0 · L1 · HAT | P2 | **DONE (W2)** |
| **RP-010** | Admin capabilities 加载慢路径提示/骨架 copy | ✓ | — | — | — | — | L | L0 · L1 · ADM · HAT | P2 | **DONE (W2)** |
| **RP-011** | Admin meta `git_sha: unknown` 诚实披露样式 | ✓ | — | — | — | — | L | L0 · L1 | P2 | **DONE (W2)** |
| **RP-012** | Auth 登录/注册错误态 i18n + `aria-live` | ✓ | — | — | — | — | L | L0 · AUTH · HAT | P2 | **DONE (W1)** |
| **RP-013** | Community Feed 空态/加载微文案 | ✓ | — | — | — | — | L | L0 · COM · HAT | P2 | **DONE (W2)** |
| **RP-015** | `/me`→`/community` Hub 首次访问说明（tooltip/copy） | ✓ | — | — | — | — | L | L0 · L2 · HAT | P2 | **DONE (W3)** |

**②.9 合计：** 8 项 · **均为 UI · 风险 L** · **禁止** 在本桶引入 BIZ/DB/RBAC/$$

---

## 2 · Post-Beta Backlog（功能 / 数据 / 权限 / 资金）

### 2.1 · 测试基建与 Meta（HAT / Deep Gate 衍生）

| ID | 标题 | UI | BIZ | DB | RBAC | $$ | 风险 | 回归 | 优先级 | 桶 |
|----|------|:--:|:---:|:--:|:----:|:--:|:----:|------|:------:|-----|
| **RP-002** | Staging 预置商家测试账号（seed + 审核捷径文档） | — | ✓ | ✓ | ✓ | — | M | L0 · L2 · DG · HAT · ADM | P2 | post-beta |
| **RP-004** | `meta.seed_test_accounts.enabled` 暴露 | — | ✓ | — | — | — | M | L0 · DG | P1 | post-beta |
| **RP-005** | 商家全闭环（注册→Admin 审核→listing 上架）手操/自动化 | — | ✓ | ✓ | ✓ | — | H | L2 · S6 · HAT · ADM | P2 | post-beta |

### 2.2 · 市场 / Web3 / 订单

| ID | 标题 | UI | BIZ | DB | RBAC | $$ | 风险 | 回归 | 优先级 | 桶 |
|----|------|:--:|:---:|:--:|:----:|:--:|:----:|------|:------:|-----|
| **RP-020** | `/market` 三子站 staging 筛选全链验证（MKT-FILT-P2-001～005） | — | ✓ | — | — | — | M | L2 · S6 · MKT | P2 | post-beta |
| **RP-021** | nil-guide 一步抢单（MKT-FILT-P2-011） | — | ✓ | — | — | ✓ | H | L0 · L2 · MKT · S6 | P2 | post-beta |
| **RP-022** | discover/guides 服务端 facet 筛选（MKT-FILT-P2-012） | — | ✓ | — | — | — | M | L0 · MKT | P2 | post-beta |
| **RP-023** | 收藏跨设备服务端同步（MKT-FILT-P2-009） | — | ✓ | ✓ | — | — | M | L0 · L2 · MKT | P2 | post-beta |
| **RP-024** | `/market` 列表性能 staging 对拍（MKT-FILT-P2-014） | ✓ | ✓ | — | — | — | M | L2 · S6 · MKT | P2 | post-beta |
| **RP-027** | `/market` 写链 staging（accept · bindGuide · 订单回填 · MKT-FILT-P2-013） | — | ✓ | — | — | ✓ | H | L2 · MKT · S6 · HAT | P2 | post-beta |
| **RP-028** | cursor 分页 catalog >200（MKT-FILT-P2-006） | — | ✓ | ✓ | — | — | M | L0 · L2 | P2 | post-beta |
| **RP-029** | 商家 Studio paid entitlement staging 对拍（MKT-FILT-P2-010） | — | ✓ | — | — | ✓ | M | L2 · S6 | P2 | post-beta |

### 2.3 · 社区 / 向导 / 身份

| ID | 标题 | UI | BIZ | DB | RBAC | $$ | 风险 | 回归 | 优先级 | 桶 |
|----|------|:--:|:---:|:--:|:----:|:--:|:----:|------|:------:|-----|
| **RP-014** | Community Feed 服务端搜索 `GET …/feed?q=` | — | ✓ | ✓ | — | — | M | L0 · COM · S6 | P1 | post-beta |
| **RP-036** | COM-②-4～8：评论持久化 · Feed 抽屉 E2E · 互动通知 API · C9 视觉 · staging CDN 视频 | ✓ | ✓ | ✓ | — | — | M–H | COM · S6 | P2 | post-beta |
| **RP-037** | `/guide` 档期/接单写路径薄入口（TT-93 · B-MKT-GDE） | ✓ | ✓ | — | — | ✓ | H | L0 · L2 · S6 · HAT | P2 | post-beta |
| **RP-007** | 旅行者支付/下单/争议全链手操覆盖 | — | ✓ | — | — | ✓ | H | L2 · S6 · HAT | P2 | post-beta |

### 2.4 · Onboarding / 商家入驻 / 治理

| ID | 标题 | UI | BIZ | DB | RBAC | $$ | 风险 | 回归 | 优先级 | 桶 |
|----|------|:--:|:---:|:--:|:----:|:--:|:----:|------|:------:|-----|
| **RP-030** | Onboarding Stripe 新场景 / webhook 扩展（ONB-P2-*） | — | ✓ | — | — | ✓ | H | L0 · L2 · S6 · DG | P1 | post-beta |
| **RP-031** | 商家入驻新步骤/新字段 | ✓ | ✓ | ✓ | ✓ | — | H | L0 · AUTH · ADM | P2 | post-beta |
| **RP-032** | 治理链上投票/Claim 钱包手操流程 | ✓ | ✓ | — | — | ✓ | H | L2 · S6 · HAT | P2 | post-beta |
| **RP-034** | 新 Admin RBAC 角色或路由 | — | ✓ | ✓ | ✓ | — | H | L0 · L1 · ADM · DG | P1 | post-beta |

### 2.5 · Phase ③ / 生产（不进 ②.9 · 不进 post-beta 窄轨）

| ID | 标题 | UI | BIZ | DB | RBAC | $$ | 风险 | 回归 | 优先级 | 桶 |
|----|------|:--:|:---:|:--:|:----:|:--:|:----:|------|:------:|-----|
| **RP-033** | Production CDN / HLS（G7 · C4/C5 pending） | — | ✓ | — | — | — | H | S6 · phase3 gate | P2 | phase3 |
| **RP-035** | Mainnet / live PSP 切换 | — | ✓ | ✓ | ✓ | ✓ | H | 全量 production gate | P0 | phase3 |
| **RP-038** | 生产域 + WAF + SSO Admin（UAT P8） | ✓ | ✓ | ✓ | ✓ | — | H | phase3 | P1 | phase3 |
| **RP-039** | CI 全绿 build（TS/ESLint in CI · UAT P6） | — | ✓ | — | — | — | M | L0 · CI | P2 | phase3 |
| **RP-040** | Dedicated prod domain + CDN（UAT P1） | — | ✓ | — | — | — | H | phase3 | P1 | phase3 |

---

## 3 · 禁止项（冻结 · 不得进入任何桶实施）

| ID | 标题 | 原因 | 文档 |
|----|------|------|------|
| **RP-025** | 五主路由 layout/token/结构变更 | Phase ① UI 冻结 | FIVE-MAIN-ROUTES-PHASE1-FREEZE |
| **RP-026** | Escrow 草稿页视觉/结构变更 | Phase ① 体验冻结 | ESCROW-DRAFT-EXPERIENCE-FREEZE |
| **RP-041** | Auth/Register L5 结构回流 | Auth UI 冻结 | AUTH-LOGIN/REGISTER-UI-FREEZE |
| **RP-042** | Provider Register L5 壳/门态结构 | Provider UI 冻结 | PROVIDER-REGISTER-UI-FREEZE |

---

## 4 · 风险汇总矩阵

| 风险 | UI 优化 | 业务功能 | DB | RBAC | $$ | ②.9 可实施 |
|------|---------|----------|-----|------|-----|------------|
| **L** | 8 | 0 | 0 | 0 | 0 | **8** |
| **M** | 1 | 12 | 4 | 0 | 2 | **0** |
| **H** | 0 | 8 | 4 | 5 | 8 | **0** |

**结论：** ②.9 **仅** §1 八项（纯 UI · L）可实施；§2 全部 **post-beta/phase3**；§3 **禁止**。

---

## 5 · 回归范围总表（按域）

| 域 | 涉及 ID | ②.9 完成后最小复跑 | 若动 post-beta 额外 |
|----|---------|-------------------|---------------------|
| **Market** | RP-001, RP-020～029 | L0 · MKT · HAT | S6 · MKT smoke staging |
| **Admin** | RP-006,010,011,034 | L0 · L1 · HAT | ADM-U01 · DG G04 |
| **Auth** | RP-012,031 | L0 · AUTH · HAT | onboarding smoke |
| **Community** | RP-013,014,036 | L0 · COM · HAT | C-slot record scripts |
| **Guide** | RP-003,037 | L0 · L2 · HAT | TT-93 / orders smoke |
| **Seed/Meta** | RP-002,004 | — | DG · HAT |
| **Funds** | RP-007,021,027,030,032,035 | — | S6 · Stripe/escrow smoke |
| **全局** | 全部 ②.9 | **R1–R7**（见 PHASE29-RELEASE-POLISH §1） | 按上表叠加 |

---

## 6 · 实施前清单（开发 Gate · 须全部 ✅ 再写代码）

**当前：** `PHASE29_DEV_GATE: OPEN`（2026-06-07 · W1 批次 RP-001 + RP-012）

- [x] **B1** Owner 已审阅本文 §1–§3 全表，**无遗漏**计划项未登记  
- [x] **B2** §1 八项 **RP-001～015/003/006…** 交付定义已写清（文件路径 · 验收标准 · 不动 API 声明）  
- [x] **B3** §2 全部标记 **post-beta**，**不得**混入 ②.9 PR  
- [x] **B4** §3 冻结项已传达 — **PR 不得** 触 FIVE-MAIN / Escrow / Auth / Provider 结构  
- [x] **B5** 每项 §1 ID 已映射 **回归代码**（§0.3）  
- [x] **B6** `PHASE3_ENTRY_GATE: HOLD` 仍有效 — **禁止** 并行 Phase ③ 工作  
- [x] **B7** ②.9 分支策略：`phase29/release-polish` 或等效 · **一 ID 一 PR**（推荐）  
- [x] **B8** Owner 书面：**`PHASE29_DEV_GATE: OPEN`**

**开发开始后每项关闭条件：**

- [ ] 对应 RP-* **status → DONE**  
- [ ] 该 ID 映射的 **最小回归** exit 0  
- [ ] ②.9 批次全部 DONE 后跑 **R1–R7**（PHASE29-RELEASE-POLISH §1）

---

## 7 · 建议实施顺序（②.9 §1 · DEV_GATE OPEN 后）

| 批次 | ID | 理由 |
|------|-----|------|
| **W1** | RP-001 | HAT P2 直接来源 · 用户可见面最大 |
| **W1** | RP-012 | Auth 入口 · a11y 独立 · 回归 AUTH 绿集明确 |
| **W2** | RP-010 · RP-006 · RP-011 | Admin 域集中 · 一次 L1 |
| **W2** | RP-013 | Community copy · 与 Admin 无依赖 |
| **W3** | RP-015 · RP-003 | 低流量 Hub/Guide · 最后收口 |

---

## 8 · 机读键

```text
PHASE3_ENTRY_GATE: HOLD
PHASE29_RELEASE_POLISH: W3_DONE
PHASE29_DEV_GATE: OPEN
PHASE29_BACKLOG_ITEMS: 36
PHASE29_IN_SCOPE_UI: 8
PHASE29_IN_SCOPE_DONE: 8
PHASE29_POST_BETA: 26
PHASE29_FORBIDDEN: 4
PHASE29_PHASE3: 4
```

---

## 9 · 相关文档

| 文档 | 关系 |
|------|------|
| [PHASE29-RELEASE-POLISH](./PHASE29-RELEASE-POLISH.md) | 阶段纪律 · R1–R8 复跑 |
| [HUMAN-ACCEPTANCE-REPORT](./HUMAN-ACCEPTANCE-REPORT.md) | ②.8 基线 findings |
| [MARKET-SUBSITE-FILTER-PHASE2-BACKLOG](../../frontend/evidence/GO_local_web3_pages_closure/MARKET-SUBSITE-FILTER-PHASE2-BACKLOG.md) | RP-020～029 细项 |
| [COMMUNITY-PHASE-2-3-ROADMAP](../../frontend/evidence/GO_local_marketing_front_closure/COMMUNITY-PHASE-2-3-ROADMAP.md) | RP-036 |
| [TT-93-guide-schedule-next-001](./TT-93-guide-schedule-next-001.md) | RP-037 |

---

*Backlog 盘点完成 · 开发未开始 · 2026-06-07*
