# FPC-100 · Full Production Certification（发布认证 · 非检查清单）

**Version:** 3.0.0  
**Status:** **ACTIVE · CERTIFICATION · 五层模型**  
**Release Dashboard:** [`FPC-100/FPC-100-RELEASE-DASHBOARD-LATEST.md`](FPC-100/FPC-100-RELEASE-DASHBOARD-LATEST.md) · **`TT_FULL_PRODUCTION_CERTIFICATION`**  
**Machine SSOT:** [`registry/full-production-certification-checklist.v1.yaml`](../../../../registry/full-production-certification-checklist.v1.yaml)  
**Page matrix:** [`FPC-100/FPC-100-PAGE-CERTIFICATION-MATRIX-LATEST.json`](FPC-100/FPC-100-PAGE-CERTIFICATION-MATRIX-LATEST.json)  
**Execution runbook:** [`docs/runbook/FPC-100-PRE-RELEASE-EXECUTION-PLAN-v1.md`](../../../../runbook/FPC-100-PRE-RELEASE-EXECUTION-PLAN-v1.md)  
**Code anchor:** `e9df0a73` · PER Round 1 Exit · **Local FREEZE**

---

## Certification ≠ Checklist

| Checklist | **Certification（FPC-100）** |
|-----------|------------------------------|
| 有没有看过 | **是否 PASS** |
| 抽查若干页 | **202/202 每页一张卡** |
| 口头「基本查了」 | **谁验证 · 什么证据 · 能否发布** |

**PER Round 1 仍然有效** — 公共走廊 10 页 · 15 CI 归零。  
**FPC-100 是更高一级的全站发布认证** — 含 **产品体验层（UI/UX L5）** 强制项。

---

## 五层认证模型（写死 · v3）

```
L1   页面覆盖 100%          202 page + surfaces
L2   每页 UI/UX L5          评分卡 · production_ready
L2.5 客户体验 CX ★★★★★     用户目标 · 主 CTA · 旅程 · 认知负荷（不是只看页面）
L3   业务流程               Guide/Provider/Acquisition/Escrow/Governance
L4   企业横切               SEO · a11y · mobile · security · perf · obs
L5   运营与真实 ★★★★★       Content · Lineage · API Contract · Ops · Lifecycle · Recovery · Truthfulness
```

| 层 | 回答的问题 | 完成判据 |
|----|------------|----------|
| **L1** | 每一个表面都查了吗？ | **202/202** |
| **L2** | 每页发布级 UI/UX？ | 每页卡 · UI/UX/Content/Function |
| **L2.5 CX** | 用户知道下一步吗？ | User Goal · Primary CTA · ≤3 点击 · Loading/Error 可行动 |
| **L3** | 业务闭环？ | BFM 全链 |
| **L4** | 企业闸？ | Gate PASS |
| **L5** | 能运营 · 数据可信 · 可恢复 · 100% 真实？ | 见下表 8 域 |

### L2.5 · Customer Experience（每页字段）

| 字段 | 说明 |
|------|------|
| `user_goal` | 用户来这页要达成什么 |
| `primary_cta` | 唯一主行动 |
| `time_to_complete` | 核心任务耗时 |
| `cognitive_load` | 低/中/高 |
| `user_journey_score` | 0–10 |

**必查：** 首次访问是否清楚下一步 · 是否只有一个主 CTA · 是否易迷路 · 核心操作是否 ≤3 次点击 · Loading 是否传达进度 · Error 是否告知下一步

### L5 · Operations & Truth — 8 个认证域

| # | 域 | 批次 | 要点 |
|---|-----|------|------|
| 1 | **Content Operations** | B30 | 公告/国家/Banner/Hero/图/视频 · Publish · SEO · ALT · i18n |
| 2 | **Data Lineage** | B31 | DB→API→Projection→Frontend→UI · 每个数字可追溯 |
| 3 | **API Contract** | B32 | 每个 GET/POST/PATCH/DELETE · Request/Response/Error/Empty |
| 4 | **Operations** | B33 | 管理员真能发公告/下架/回滚/审核/封禁/看日志 |
| 5 | **Lifecycle** | B34 | Create→Review→Publish→Visible→Archive→Delete |
| 6 | **Recovery** | B35 | API500/断网/CDN/缺图/Wallet 超时 · 页面仍可工作 |
| 7 | **Truthfulness** | B36 | 无 Mock/Demo/Placeholder/Fake/TODO/Coming Soon · **100%** |
| 8 | **CX** | B26 | （L2.5 全站收口） |

### Release Dashboard（唯一总结果）

**Machine key:** `TT_FULL_PRODUCTION_CERTIFICATION`  
**刷新：** `node scripts/dev/refresh-fpc-100-release-dashboard.cjs`  
**产物：** `FPC-100-RELEASE-DASHBOARD-LATEST.json` · `.md`

| 项 | 目标 |
|----|------|
| 页面 | 202 / 202 |
| UI · UX · CX | 202 / 202 |
| API Contract | 100% |
| Data Lineage · Content · Recovery · Truthfulness · Operations | PASS |
| Mobile · A11Y · Performance · Security · RBAC | PASS |
| Environment Diff | PASS（②） |

**终态一行：** `TT_FULL_PRODUCTION_CERTIFICATION: PASS` — 非「基本查了」

---

## 0. 定位与诚实边界

### 0.1 本清单解决什么

在 **PER Round 1 Exit**（15 CI 归零 · Final Spot Check PASS）之后，建立 **100% 深度认证** 的 **唯一 SSOT**，用于后续：

```
逐项检查 → 记录证据 →（必要时）修复 → 再部署 Staging → Environment Diff → PER on Staging
```

**不替代：** `04`/`93`/`14` 契约正文 · `go-live-checklist` ③ 闸 · CMS Content QA 运营轨。

### 0.2 阶段口径（禁止跳阶）

| 阶次 | FPC-100 含义 |
|------|----------------|
| **① Local** | 以 `e9df0a73` 为锚；批次 B00–B24 默认在本地 SSOT 执行 |
| **② Staging** | One-shot deploy 后 **必须** 复跑 B00/B01/B04/B21/B22 + Environment Diff |
| **③ Production** | FPC-100 全 PASS **≠** Production GO；仍须 PER · go-live · PSP 真链等 **③ 专闸** |

### 0.3 与 PER Round 1 / Round 2 关系

| 轨道 | 范围 |
|------|------|
| **PER Round 1** | ✅ 已完成 · 公共走廊 10 页 · 15 CI · Waves LOCK |
| **FPC-100** | 全量页面（202）· 全角色 · 全域 API · 横切维度 · BFM 业务闭环 |
| **Round 2（VP-01～09）** | 映射 FPC **B14–B18**（mobile · axe · `/me` · production build · full en）— **不阻断** Round 1 Exit |

### 0.4 Local Freeze 规则（写死）

**禁止** 在 FPC 批次执行期间改 Local 业务代码，**除非：**

1. Environment Diff 发现漂移且判定为 Local 缺陷  
2. Staging 独有问题需 Local 回修（须先记 DRIFT 证据）  
3. FPC 批次发现 **新 P0/P1**

否则：`Local A → Deploy → Staging B → Diff` 无法归因。

---

## 1. 全量盘点索引（真源指针）

### 1.1 页面（202 routes · 2026-07-09 实扫）

| 簇 | 数量 | 扫描锚 | 规范 |
|----|------|--------|------|
| **消费者 + 业务** | **88** | `frontend/app/**/page.tsx`（不含 admin） | 96-20 §5 · 13-1 表 1 |
| **Admin 工作台** | **114** | `frontend/app/admin/**/page.tsx` | 70 · admin README |
| **合计** | **202** | `find frontend/app -name page.tsx` | 96-20 Living 矩阵 |

**五主路由（UI 已冻结 · ①）：** `/` · `/traveltrust` · `/market` · `/did-rank` · `/community/*`  
→ [`FIVE-MAIN-ROUTES-PHASE1-FREEZE.md`](../../../../frontend/evidence/GO_local_marketing_front_closure/FIVE-MAIN-ROUTES-PHASE1-FREEZE.md)

**Web3 走廊（25 页清单）：** [`WEB3-PAGES-PHASE1-INVENTORY.md`](../../../../frontend/evidence/GO_local_web3_pages_closure/WEB3-PAGES-PHASE1-INVENTORY.md)

### 1.2 角色 / 人格

| ID | 用途 | Registry |
|----|------|----------|
| **C1–C4** | 旅行者 / 向导 / 商家 / 治理参与者 | [`test-accounts-business-immutable.v1.yaml`](../../../../registry/test-accounts-business-immutable.v1.yaml) |
| **E1** | Admin（Local only · Staging 探针跳过） | 同上 |
| **E2** | 运维 / 四中心 | 同上 |
| **HAT 六角色** | 注册→登出 7 步 | [`hat-six-role-matrix.v1.yaml`](../../../../registry/hat-six-role-matrix.v1.yaml) |

### 1.3 业务流程（BFM 三链）

| Flow | 步骤 | SSOT |
|------|------|------|
| **Guide** | 注册→资料→审核→上架→预约→订单→完成→评价 | [`business-flow-matrix.v1.yaml`](../../../../registry/business-flow-matrix.v1.yaml) |
| **Provider** | 注册→商品→发布→订单→完成 | 同上 |
| **Acquisition** | 发布→响应→成交→完成 | 同上 + [`acquisition-publish-trust-rules.v1.md`](../../artifacts/acquisition-publish-trust-rules.v1.md) |

### 1.4 API 域（`api_router()` 聚合）

**契约真源：** [`04-后端与API.md`](../../04-后端与API.md) §3.4  
**代码锚：** [`crates/api/src/routes/mod.rs`](../../../../crates/api/src/routes/mod.rs)  
**端口快照：** [`38-端口与接口完整清单.md`](../../38-端口与接口完整清单.md)  
**前端消费：** [`frontend/lib/api.ts`](../../../../frontend/lib/api.ts)

| 域模块 | 典型路径前缀 | FPC 批次 |
|--------|--------------|----------|
| health_meta | `/health` · `/meta` | B00 · B19 |
| auth | `/api/v1/auth/*` | B03 |
| guides · discover · market_subsite | `/api/v1/guides` · market subsite | B04 |
| orders · itineraries · intents | 订单 / 托管 / 行程 | B05 · B20 |
| governance* | 治理 / 提案 / 参数 | B06 |
| community · messages | 社区 / 消息 | B07 |
| me* · onboarding · provider_applications | Me / 入驻 | B03 · B08 |
| admin | `/api/v1/admin/*` | B09 |
| public_announcements · public_roadmap | 公共只读 | B06 · B12 |
| internal · hooks | 内部 / Webhook | B17 · B21 |

### 1.5 数据治理

| 层 | SSOT | Gate |
|----|------|------|
| **DDG 展示治理** | [`display-data-governance.v1.yaml`](../../../../registry/display-data-governance.v1.yaml) | `check-display-data-governance-ssot.sh` |
| **公共目录策略** | [`single-official-public-catalog-policy.v1.yaml`](../../../../registry/single-official-public-catalog-policy.v1.yaml) | B04 parity script |
| **CMS 运营** | [`cms-asset-matrix.v1.yaml`](../../../../data/catalog/cms-asset-matrix.v1.yaml) | B12 · Content QA（运营轨） |
| **Public surface audit** | [`traveltrust-public-surface-audit.v1.yaml`](../../../../registry/traveltrust-public-surface-audit.v1.yaml) | B01 |

### 1.6 权限 / RBAC

| 对象 | 路径 |
|------|------|
| 权限目录 | [`admin-rbac-permissions.v1.yaml`](../../../../registry/admin-rbac-permissions.v1.yaml) |
| 路由×权限探针 | [`admin-rbac-route-matrix.v1.yaml`](../../../../registry/admin-rbac-route-matrix.v1.yaml) |
| 运行时 deny 矩阵 | [`admin_rbac.rs`](../../../../crates/api/src/routes/admin/admin_rbac.rs) |
| Staging 矩阵 | [`admin-rbac-staging-probes.v1.yaml`](../../../../registry/admin-rbac-staging-probes.v1.yaml) |
| Runbook | [`ADM-U01-staging-rbac-matrix.md`](../../../../docs/runbook/ADM-U01-staging-rbac-matrix.md) |

---

## 2. 判定标准（全批次统一）

| Verdict | 含义 | 能否进入下一批 |
|---------|------|----------------|
| **PASS** | 验收标准全部满足 · 无 P0/P1 | ✅ |
| **PASS_WITH_WARN** | 仅 P2/P3 视觉/文案 · Owner 书面接受 | ✅（须登记 WARN） |
| **FAIL** | 存在 P0/P1 | ❌ 须修复或开 Defect |
| **BLOCKED** | 环境/凭证/② 未就绪 | ❌ 标阶段 |
| **N/A** | 本环境不适用 · 须写理由 | ✅（不计 FAIL 分母时需注明） |

**P0/P1 示例：** 调试入口暴露 · Admin 泄漏 · 重复 catalog · RBAC 绕过 · `/meta` SHA 漂移 · 支付/托管资金风险。

**Expected Difference：** 仅 **CONFIRM_DESIGN** — 见 [`TT-ALIGNMENT-AUDIT-EXPECTED-DIFFERENCE-POLICY.md`](../../../../docs/runbook/TT-ALIGNMENT-AUDIT-EXPECTED-DIFFERENCE-POLICY.md)

---

## 3. 证据路径约定

**根目录：** `docs/spec/governance-token/evidence/phase3-production-entry-baseline/FPC-100/`

| 产物 | 命名 |
|------|------|
| 批次机读 | `FPC-100-BATCH-{Bxx}-LATEST.json` |
| 批次签收 | `FPC-100-BATCH-{Bxx}-CLOSEOUT.md` |
| 批次日志 | `FPC-100-BATCH-{Bxx}-{UTC}.log` |
| 总 rollup | `FPC-100-REGISTRY-LATEST.json` · `.md` |

**每条检查项最低字段：** `id` · `batch` · `phase` · `verdict` · `severity` · `owner_files[]` · `gate_or_manual` · `evidence_path` · `notes`

---

## 4. 分批执行计划（认证批次 · 含 L2 集群 B25-C*）

> **Machine 明细：** `registry/full-production-certification-checklist.v1.yaml` → `batches[]` · `certification_model.four_layers`

### Wave 0 · 锚点（B00 · L1）

| 批 | 名称 | Gate |
|----|------|------|
| **B00** | Anchor · meta/health · registry · **202 页矩阵 scaffold** | `scaffold-fpc-100-page-certification-matrix.cjs` · `run-fpc-batch-b00-anchor.cjs` |

### Wave L2 · 每页 UI/UX 认证（202 页 · 6 集群）

| 批 | 集群 | 约页数 |
|----|------|--------|
| **B25-C1** | marketing_brand | ~15 |
| **B25-C2** | market_commerce | ~25 |
| **B25-C3** | transaction_escrow | ~15 |
| **B25-C4** | identity_onboarding | ~20 |
| **B25-C5** | governance · community · trust/help | ~25 |
| **B25-C6** | admin_workspace | **114** |

### Wave L1 收口 · B23

**B23** = L1 **100% Coverage** 确认（非抽查）— 202/202 `layer1_surface_coverage` 全部完成。

### 原 Wave 1–5 批次（L3/L4 映射不变）

见 registry · 下文表格保留 B01–B24 摘要。

| 批 | 名称 | 重点 | Gate / 脚本 | 证据目录 |
|----|------|------|-------------|----------|
| **B00** | Anchor · Meta · Health · SHA | Local=`e9df0a73` ↔ Staging `/meta` · `/health` 200 | `run-local-staging-full-alignment-audit.sh` · `run-per-final-spot-check.sh` | `FPC-100/B00-anchor` |
| **B01** | Public Surface Parity | PER 7 页 + footer/metadata/copy/guides | `check-production-ui-hygiene-gate.sh` · `check-public-surface-audit-gate.sh` · `run-per-final-spot-check.sh` | `FPC-100/B01-public-surface` |

**B01 路由检查重点（与 PER 同套）：**

| 页面 | 检查重点 |
|------|----------|
| `/` | Footer · Chrome · Metadata · Spacing |
| `/traveltrust` | Hero · 间距 · 无 Debug UI · SEO |
| `/market` | Guide 列表 · 空态 · 无重复 |
| `/help` | 无工程术语 |
| `/trust` | 无内部 Spec 引用 |
| `/governance` | Public Hub · 无 Admin 泄漏 |
| `/traveltrust/announcements` | Metadata · 语言切换 |

**Public Surface Parity 维度：** Metadata · Footer · Public Copy · Guide Count · Announcement Title · Governance Hub · **`/meta`** · **`/health`**

---

### Wave 1 · 消费者主脊（P0）

| 批 | 名称 | 路由/域 | Gate | 验收标准（摘要） |
|----|------|---------|------|------------------|
| **B02** | 五主路由 | `/` … `/community/*` | `five-main-routes-ui-antiregression-gate.sh` · `run-web3-itinerary-l5-green.sh` | UI 冻结未回流 · landing/market 数据链绿集 exit 0 |
| **B03** | Auth · 入驻 | `/auth/*` · register 链 | `auth-contract-gate.sh` · `smoke-provider-onboarding-local.sh` | 93 §1 A 域 · POST 直连 API |
| **B04** | Market · DDG | `/market*` · guides API | `vertical-slice-01` · `run-market-guide-catalog-parity.sh` · DDG gate | Hangzhou=1 · trust-gate=0 · 无 demo 标签 |
| **B05** | Web3 黄金路径 | pay → orders → escrow | `run-web3-itinerary-l5-green.sh` · full-chain smoke | 93 §2.0 B 域 P0 五连 PASS |

---

### Wave 2 · 治理 · 社区 · 身份（P1）

| 批 | 名称 | Gate | VP 映射 |
|----|------|------|---------|
| **B06** | Governance · Trust · TT 网络 | `smoke-governance-proposals-l5-local.sh` · announcement lane gate | — |
| **B07** | Community | `vertical-slice-04` · community media guard | VP-07 深度 |
| **B08** | Me · 收购 PD-009 | `smoke-acquisition-pd009-local.sh` · `me-routes-local-gate.sh` | **VP-05** `/me` hub walk |

---

### Wave 3 · Admin · 业务闭环 · API（P0/P1）

| 批 | 名称 | 规模 | Gate |
|----|------|------|------|
| **B09** | Admin · RBAC | **114** admin 页 | `smoke-admin-rbac-matrix-local.sh` · staging matrix · platform-40 |
| **B10** | Business Flow Matrix | 3 flows × 8/5/4 steps | `run-production-readiness-master-checklist.cjs` |
| **B11** | API 契约 parity | 04 ↔ mod.rs ↔ api.ts | `run-check-04-routes.sh` · `smoke-api-public-routes.sh` · `cargo test -p traveltrust-api` |

---

### Wave 4 · 数据 · 横切质量（P1/P2）

| 批 | 维度 | Gate / 参考 | VP |
|----|------|-------------|-----|
| **B12** | CMS · DDG · Official ops | DDG · OCS · CMS announcements gates | — |
| **B13** | SEO · i18n | `siteMetadataBase.test.ts` · home disclosure gate | **VP-02** full en |
| **B14** | a11y · keyboard · axe | 96-13 走查清单 | **VP-03** |
| **B15** | Mobile 375px | 96-16 D 维度 · 截图矩阵 | **VP-01** |
| **B16** | Performance | `check-frontend-npm-build.sh` · CWV  spot | VP-04 深度 |
| **B17** | Security | `check-invariants.sh` · RBAC · internal 403 | PRM-SEC-* |
| **B18** | Production build | hygiene + `next build` | **VP-09** DevTools |
| **B19** | Observability | `/health` · `/meta` · logging spot | monitoring 域 |

---

### Wave 5 · Web3 · 支付 · infra · 全量收口（P0/P1）

| 批 | 名称 | 阶段 | Gate |
|----|------|------|------|
| **B20** | Web3 · Sepolia · vacancy | ①② | web3 deployment/runtime/vacancy gates |
| **B21** | Stripe · webhook | **②** | PI3-003 stripe baseline |
| **B22** | DR · Fly · infra | ②③ prep | phase3 infra SSOT · PG backup |
| **B23** | **全页矩阵 202** | ①② | 96-20 §0.2 证据 · page forensic |
| **B24** | **93 + R-002 回归** | ①② | r002 validate · ci-local-minimum · go-no-go |

---

## 5. 横切维度 × 批次映射

| 维度 | 主要批次 | 辅助真源 |
|------|----------|----------|
| **SEO / Metadata** | B01 · B13 | `siteMetadataBase.ts` · PER spot check patterns |
| **i18n** | B13 · B23 | `locales/zh.ts` · `en.ts` · 96-13 |
| **a11y** | B14 | 96-13 · L5 product excellence contracts |
| **Mobile** | B15 | 96-16 D1–D12 |
| **Performance** | B16 | PRM-PER-* · npm build |
| **Security** | B17 · B09 | open-issues · alignment audit policy |
| **Production build** | B18 | hygiene gate Wave A |
| **Observability** | B00 · B19 | health_meta handlers |
| **RBAC** | B09 · B17 | admin RBAC registries |
| **Data governance** | B04 · B12 | DDG · catalog policy |

---

## 6. Staging 部署后强制复跑（Environment Diff）

One-shot deploy **`e9df0a73`** 后 **立即**（不改 Local）：

```bash
# 1. 全量 Local ↔ Staging 对拍
bash scripts/dev/run-local-staging-full-alignment-audit.sh

# 2. Public Surface（改 WEB/API base 指向 staging）
WEB_BASE=https://tt-web-staging.fly.dev \
API_BASE=https://tt-api-staging.fly.dev \
  bash scripts/dev/run-per-final-spot-check.sh
```

**必须通过：**

| 检查项 | Local | Staging |
|--------|-------|---------|
| Git SHA | `e9df0a73` | `/meta` 同 SHA |
| Guide count | Hangzhou=1 | 同左 |
| trust-gate on list | 0 | 0 |
| Public Surface 7 页 | PASS | PASS |
| `/health` | 200 | 200 |

漂移分类：**DEFECT** · **DRIFT** · **CONFIG** · **SEED/DATA** · **EXPECTED_DIFFERENCE**（只确认不修）

---

## 7. FPC-100 总 Exit 判据（`TT_FULL_PRODUCTION_CERTIFICATION: PASS`）

```
L1: 202/202 coverage
AND L2: 202/202 production_ready
AND L2.5: 202/202 CX PASS
AND L3: all business flows PASS
AND L4: enterprise P0 batches PASS
AND L5: Content · Lineage · API Contract · Ops · Lifecycle · Recovery · Truthfulness 100% PASS
AND Environment Diff PASS (②)
AND OPEN P0/P1 = 0
```

刷新 Dashboard：`node scripts/dev/refresh-fpc-100-release-dashboard.cjs`

**不等于：** Production GO · ③ 主网 · Stripe Live。

---

## 8. 与现有 SSOT 互指

| 文档 | 关系 |
|------|------|
| [`PER-ROUND1-EXIT.md`](PER-ROUND1-EXIT.md) | FPC 前置 · 已完成 |
| [`PER-WAVE-REMEDIATION-PLAN-v1.md`](../../../../runbook/PER-WAVE-REMEDIATION-PLAN-v1.md) | Wave 轨 · LOCK |
| [`TT-PROJECT-MAINLINE-PRODUCT-VERIFICATION.md`](../../../../runbook/TT-PROJECT-MAINLINE-PRODUCT-VERIFICATION.md) | 产品验收入口 |
| [`TT-PRODUCTION-READINESS-MASTER-MATRIX.md`](../../../../runbook/TT-PRODUCTION-READINESS-MASTER-MATRIX.md) | G3 阻塞项台账 |
| [`93` 全站功能验证矩阵](../../93-全站功能验证矩阵-域别回归清单.md) | B24 用例正文 |
| [`96-20` 页面对齐](../../96-20-前后端页面对齐与UI生产级审计报告.md) | B23 全页枚举 |
| [`go-live-checklist.md`](../../../../go-live-checklist.md) | ③ 最终 GO |

---

## 9. 本轮交付物（仅计划 · 无执行）

| 产物 | 路径 |
|------|------|
| 本清单（Human SSOT） | 本文 |
| Machine registry | `registry/full-production-certification-checklist.v1.yaml` |
| 执行 Runbook | `docs/runbook/FPC-100-PRE-RELEASE-EXECUTION-PLAN-v1.md` |
| 证据根（空 · 待批次填充） | `FPC-100/README.md` |

**下一步（Owner）：** 从 **B00** 开始逐项执行 · 填证据 JSON · **不修改 Local 代码** 直至 Diff 或 P0/P1 强制开口。
