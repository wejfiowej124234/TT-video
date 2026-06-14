# Account Operating Model · ② Wave 1 Sprint 任务卡（企业 UX 跃迁）

**阶段口径：** ① 本地 → **② 测试网** → ③ 公网/生产

**前置（Wave 0 · ① 已满分）：** [ACCOUNT-OPERATING-MODEL-UX-WAVE0-SCORE.md](./ACCOUNT-OPERATING-MODEL-UX-WAVE0-SCORE.md) · [PUBLISH-HUB-IA-BOUNDARY-SCORE.md](./PUBLISH-HUB-IA-BOUNDARY-SCORE.md)

**入口闸：** [PHASE2-START-CHECKLIST · G-0～G-4](../../../docs/runbook/PHASE2-START-CHECKLIST.md) · [PHASE2-REPOSITORY-STATUS](../../../docs/runbook/PHASE2-REPOSITORY-STATUS.md)

**诚实边界：** 本文 **② 实施任务卡** ≠ 已实施 ≠ ③ Production GO；**G-1/G-2 未清禁止 ② 开工**。**① 本地代码收口**见 [ACCOUNT-OPERATING-MODEL-UX-WAVE1-LOCAL-SCORE.md](./ACCOUNT-OPERATING-MODEL-UX-WAVE1-LOCAL-SCORE.md)（**≠ ② GO**）。

---

## 0.1 三阶任务总表（W1-* · 机读 SSOT）

| 阶段 | 范围 | 状态 | SSOT |
|------|------|------|------|
| **① 本地** | W1-A1～A4 · W1-B1～B4 · W1-L1 | **✅ 代码已闭** | [WAVE1-LOCAL-SCORE](./ACCOUNT-OPERATING-MODEL-UX-WAVE1-LOCAL-SCORE.md) |
| **② 测试网** | W1-C1～C4 · W1-D1～D2 · PH-B-1～B-10 | **❌ backlog** | 本文 §1C/1D · G-1/G-2 |
| **③ 公网/生产** | W1-P1～P3 · PH-C-1～C-4 | **❌ backlog** | go-live-checklist |

**Marker（①）：** `account-operating-model-ux-wave1-local-20260612`

## 0. Sprint 目标（Wave 1 · 最小跃迁包）

| 目标 | 用户可感知结果 |
|------|----------------|
| **Context Spine** | 顶栏知道「当前经营身份」；发布中心筛选与工作台一致 |
| **真源聚合** | 汇总条与五轨计数来自 staging API，非仅 BFF mock |
| **Staging 回归** | 五轨 listing CRUD + 下架/market 一致 · PW 目视 |

**North Star 句：** *我在以谁的身份操作 → 我要处理哪类事 → 下一步去哪。*

---

## 1. 开工闸（Must · 全部 PASS 后写第一行代码）

| # | 闸 | 验收 |
|---|-----|------|
| G-0 | Phase ① 总验收绿 | `run-go-local-phase1-acceptance.sh` exit 0 |
| G-1 | staging 密钥/Stripe test 与生产零混用 | Owner 书面确认 |
| G-2 | staging API HTTPS + migrate 完成 | `STAGING_API_BASE` 可达 |
| G-3 | 范围句仅 **② 测试网** | 本文 + PR 描述 |
| G-4 | B 轨价目 staging 非零 | 关闭 `TRAVELTRUST_ONBOARDING_LOCAL_DEV=1` on staging |

**Owner 签字行：** _________________ · 日期 ______ · Wave 1 开工授权

---

## 2. 任务分解（与 PH-B / P3 对拍）

### Sprint 1A · 数据真源（P0 · 3～5 天）

| ID | 任务 | 交付 | 验收 | PH-B |
|----|------|------|------|------|
| **W1-A1** | **ADR** Active Workspace Context | [ADR-20260613](../../../docs/adr/ADR-20260613-active-workspace-context-switcher.md) **accepted** | Owner + 互指 HEADER-UTILITY freeze 例外 | PH-B-2 |
| **W1-A2** | `lib/header/activeWorkspaceContext.ts` | context 枚举 · localStorage · SSR 安全 | unit test exit 0 | P3-2 |
| **W1-A3** | api `GET /api/v1/me/publish-summary` | Rust handler 与 BFF 同形 JSON | contract + staging curl | **PH-B-1** |
| **W1-A4** | BFF 切 api 真源（staging） | `mePublishSummary` 读 api · ① localhost 仍 BFF 聚合 | diff schema test | PH-B-1 |

### Sprint 1B · Context Spine UI（P0 · 5～7 天）

| ID | 任务 | 交付 | 验收 | PH-B |
|----|------|------|------|------|
| **W1-B1** | 顶栏 **Workspace Context** 下拉 | 仅 active/pending operator 槽 · Account 总览项 | `headerUserMenuNavModel` + vitest | **PH-B-2** |
| **W1-B2** | Context ↔ `/me/publish?identity=` | 切换 context 更新 URL + 默认轨 | `publishHubIdentityDefaultFilter` e2e | PH-B-2 |
| **W1-B3** | Context ↔ 工作台 deep link | `/guide` `/provider` … 打开 **当前 context** 槽 | PW multi-demo | PH-B-2 |
| **W1-B4** | 发布中心 spine 行 i18n | 显示 `{contextLabel} · 产出总览` | zh/en + a11y | UX |

### Sprint 1L · ① 本地收口（P0 · 1 天）

| ID | 任务 | 交付 | 验收 | 阶段 |
|----|------|------|------|------|
| **W1-L1** | 本地绿集 + Wave1 contract 并集 | `smoke-publish-hub-local.sh` exit 0 | 末行 `TT_PUBLISH_HUB_SMOKE: OK` | **①** |

### Sprint 1C · Staging 回归（P1 · 5 天 · **② only**）

| ID | 任务 | 交付 | 验收 | PH-B |
|----|------|------|------|------|
| **W1-C1** | 五轨 CRUD smoke | `smoke-publish-hub-staging.sh` 扩展 | 末行 `TT_PUBLISH_HUB_STAGING: OK` | **PH-B-3** · **②** |
| **W1-C2** | merchant/acquisition 下架 ↔ discover | listing 状态 staging 一致 | PH-B-5 子集 | **②** |
| **W1-C3** | Playwright staging | `e2e/publish-hub-l5.spec.ts` 对 staging host | PH-B-7 | **②** |
| **W1-C4** | 治理 `?mine=1` 对拍 | 非空 proposals · governor 投影 | 与治理 L5 同批 | **PH-B-4** · **②** |

### Sprint 1D · 文档与 GO 旁证（P1 · 1 天 · **② only**）

| ID | 任务 | 交付 | 验收 |
|----|------|------|------|
| **W1-D1** | `PUBLISH-HUB-PHASE-TASK-LIST` PH-B 行改 **closed** | 仅 B-1～B-3 + B-7 本 sprint | 机读对拍 | **②** |
| **W1-D2** | `GO_phase2_*` 证据目录 | smoke log + PW 截图 | PH-B-10 | **②** |

### Sprint 3P · 公网/生产（**③ only · 另闸**）

| ID | 任务 | 交付 | 验收 | PH-C |
|----|------|------|------|------|
| **W1-P1** | 主网 governance 轨 / 链上 exec 同步 | 发布中心 proposals 与链一致 | go-live 治理子集 | **PH-C-1** |
| **W1-P2** | Production PSP + webhook | 无测试网密钥混用 | go-live-checklist | **PH-C-3** |
| **W1-P3** | 93 全矩阵 Production GO | 非 ISS-007 窄切片 PARTIAL_GO | evidence/GO + go-live | **PH-C-4** |

---

## 3. ADR 摘要（W1-A1）

**决策：** 引入 **Workspace Context**（单选 operator 槽 + Account  aggregate 视图），HTTP 可选 `X-TravelTrust-Workspace-Context`；**不**恢复 `users.role` 经营 SSOT。

**备选 rejected：** (a) 仅 URL `?identity=` 无顶栏 — 多入口仍困惑；(b) 五工作台并列顶栏 — 与 Hub 重复。

**影响面：** `headerUserMenuNavModel` · `HEADER-UTILITY-MENU-L5-FREEZE` 例外修订 · `/me/publish` · 各 workbench 默认路由。

**完整正文：** [docs/adr/ADR-20260613-active-workspace-context-switcher.md](../../../docs/adr/ADR-20260613-active-workspace-context-switcher.md)

---

## 4. E2E 场景表（staging · multi-demo@test.com）

| # | 场景 | 步骤 | 期望 |
|---|------|------|------|
| E1 | Context 切换 | 顶栏选 **商家** → 开 `/me/publish` | 筛选=商家 · summary merchant 计数 >0 |
| E2 | 三向同步 | context=guide · 手动改 URL `?identity=merchant` | context 与 URL 冲突时 **URL 赢** + toast |
| E3 | 工作台 | context=merchant · 点头像进 `/provider` | 收件箱 merchant_service 过滤 |
| E4 | 下架回归 | 发布中心下架 listing → `/market` discover | 条目不可见 · api 200 |
| E5 | 订单边界 | `/orders` 读 boundary copy → 发布中心 | 互链 200 · 无社区轨 |
| E6 | api 汇总 | login → GET api publish-summary | 字段同 BFF schema |

---

## 5. Contract / 机读清单（② 绿集目标）

```bash
# ② staging（须 G-1/G-2 + deploy）
export STAGING_API_BASE=https://your-staging-api
bash scripts/dev/smoke-publish-hub-staging.sh

# 前端 contract（合入每 PR）
cd frontend && npm run test -- accountOperatingModelUxWave1 publishHubServerSummaryModel headerUserMenuNavModel publishHubIdentityDefaultFilter --run

# 可选 PW staging
PLAYWRIGHT_PUBLISH_HUB=1 PLAYWRIGHT_BASE_URL=https://your-staging-fe \
  npx playwright test e2e/publish-hub-l5.spec.ts
```

**末行 SSOT：** `TT_PUBLISH_HUB_STAGING: OK phase=② wave1`

---

## 6. ② 完成后 · Wave 2 预览（不在本 sprint）

| ID | 项 | 说明 |
|----|-----|------|
| W2-1 | 设置旅行组 **移除** 工作台捷径 | 仅 Hub + 发布中心 |
| W2-2 | 发布中心任务模式 segmented | 总览/待处理/草稿 |
| W2-3 | MOIS-001 全量 slot 写权限 | 见 multi-operator-identity-sprint.v1 |

---

## 7. 禁止（本 sprint）

- 用 ① `smoke-publish-hub-local.sh` 冒充 **② GO**
- 未 accepted ADR 即改顶栏 IA 结构
- 发布中心新增第六轨 / 社区回流（IA 冻结）
- ISS-007 窄切片 PARTIAL_GO 冒充 PH-B-8 全矩阵

---

**Maintainer：** Sebastian Ward · ② 测试网（Prepared · ① 本地代码已闭）

**一句话结论：** **① W1-A/B/L 已本地收口**（见 LOCAL-SCORE）；**G-1/G-2 清闸后** 按 **1C → 1D** 交付 ②；**③ W1-P*** 与 go-live 另闸。
