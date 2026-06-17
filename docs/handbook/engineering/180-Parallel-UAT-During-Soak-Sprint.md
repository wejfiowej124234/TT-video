# 180 · staging-soak 冻结窗口 · 并行 UAT 与 token 债务审计

**Version:** 1.0.0 · **最后更新：** 2026-06-08  
**状态：** **ACTIVE**（与 **P2FC-S01 staging-soak** 同窗口）  
**阶段**：**① 本地 / staging-dev** — **非** `tt-api-staging` / `tt-web-staging` 变更

> **SSOT（必读）**：本 Sprint **不替代** [179](./179-Phase2-Full-Coverage-Validation-Report.md) soak 结论；**禁止** redeploy / restart / migration / config change 于 **staging-soak** 环境。

---

## 1. 目标

在 **`TESTNET_STAGING_FREEZE=ACTIVE`** 直至 **`evidence/P2FC_SOAK_72H_STAGING/COMPLETED.json`** 期间：

1. **保持 staging-soak 冻结运行** — 仅 health 轮询与 attestation；**不** redeploy / restart / migration / config  
2. **仅执行运营视角人工 UAT** — 以 **十条真实业务场景**（CMS · Official OPS · Growth · Referral · Early Bird · Moderation · Merchant · Guide · Traveler · Admin）为主线，local `:8080` + `:3012`；**逐步完成任务**并登记问题  
3. **问题只登记** — 写入 `findings.json` + `attachments/`；**不新增业务功能**  
4. **token debt audit** — 只记录 **34 §5.3** 违规，**不在 soak 窗口内修复**  
5. soak 完成 → **`scripts/ops/p2fc-rerun-after-soak.sh`** · post-soak graduation audit → 解除冻结 → **Token Debt Sprint** → **下一轮测试网** deploy/回归

---

## 2. 验收域

### 2.1 十条真实业务场景（运营视角人工 UAT · 主线）

**SSOT 步骤清单**：[operational-uat-scenarios.v1.json](../../../evidence/PARALLEL_UAT_SOAK_WINDOW/operational-uat-scenarios.v1.json)

| # | 场景 ID | 主线 | 主要 persona | 代表路由 |
|---|---------|------|--------------|----------|
| 1 | **SCN-CMS** | CMS | 运营 | `/admin/content/*` · consumer `GET /catalog/*` |
| 2 | **SCN-OFFICIAL-OPS** | Official OPS | 运营 | `/admin/official/*` · 冷启动 consumer |
| 3 | **SCN-GROWTH** | Growth | 运营 | `/admin/growth/*` · analytics |
| 4 | **SCN-REFERRAL** | Referral | 旅行者 + 运营 | `/me/referrals` · register · admin referral |
| 5 | **SCN-EARLY-BIRD** | Early Bird | 旅行者 + 运营 | register · `/admin/growth/early-bird` |
| 6 | **SCN-MODERATION** | Moderation | 运营 + 旅行者 | `/admin/community/reports` · 举报链 |
| 7 | **SCN-MERCHANT** | Merchant | 商家 | `/provider/register` · `/me/onboarding` |
| 8 | **SCN-GUIDE** | Guide | 向导 + 旅行者 | `/guide/*` · 接单链 |
| 9 | **SCN-TRAVELER** | Traveler | 旅行者 | `/` · `/market` · `/community` · `/me` |
| 10 | **SCN-ADMIN** | Admin | 管理员/运营 | `/admin` · analytics · permissions |

**审查方法**：以**首次使用者**与**运营人员**视角，按场景 `steps_*` **逐步完成任务**；凡 UI、交互、**命名**、**流程**、**反馈**与**认知成本**问题均写入 `findings.json`（`kind` 见 template）。

### 2.2 四平面机读 harness（可选 · local API）

| 平面 | 机读 harness（local API） |
|------|---------------------------|
| **P1 CMS** | `smoke-catalog-consumer-opt-in-staging-p0-local.sh` |
| **P2 Official OPS** | `rov-wave2-t4-cold-start.sh` |
| **P3 Growth** | `rov-wave1-t1` → `rov-wave1-t3-growth-funnel.sh` |
| **P4 Moderation** | `smoke-community-c3-staging-moderation.sh` |

**Token 审计（全仓 Admin/Me 新增面）**：`cd frontend && npm run check:tokens` → 仅写入 evidence，**exit 非 0 不阻塞 soak**。

---

## 3. 执行

### 3.1 本地 spine（推荐）

```bash
export DATABASE_URL=postgres://traveltrust:traveltrust@localhost:5432/traveltrust
export SEED_TEST_ACCOUNTS=1
bash scripts/dev/start-api-for-playwright.sh   # :8080

# 另终端
cd frontend
NEXT_PUBLIC_CATALOG_API_ENABLED=1 npm run dev   # :3012
```

### 3.2 记录会话（harness + token · 不 deploy staging）

```bash
bash scripts/ops/parallel-uat-during-soak.sh
```

产出：`evidence/PARALLEL_UAT_SOAK_WINDOW/run-<UTC>/`

| 文件 | 用途 |
|------|------|
| `manifest.json` | 会话元数据 · freeze SHA · harness 摘要 |
| `tracks/token-debt-check-tokens.log` | **34 §5.3** 全量违规清单 |
| `tracks/*.log` | CMS / Growth / Official / Moderation 机读探针 |
| `findings.json` | **人工** UI/交互/token 问题（从 template 复制后编辑） |
| `attachments/` | 截图 / 录屏 |

模板：[findings.template.json](../../../evidence/PARALLEL_UAT_SOAK_WINDOW/findings.template.json)

### 3.3 运营视角人工 UAT（只记录）

**场景 SSOT**：`operational-uat-scenarios.v1.json` · 进度跟踪 `findings.json` → `operational_uat.scenario_progress[]`。

对每条问题在 `findings.json` 追加 `items[]`：

- `scenario_id` · `track` · `persona` · `surface` · `severity`  
- `kind`：`ui` / `interaction` / `naming` / `workflow` / `feedback` / `cognitive_cost` / `a11y` / `copy` / `data`  
- `steps[]` / `expected` / `actual` · `cognitive_cost_notes` · `evidence[]`  
- `status`: **`open`** — soak 期间 **不得** fix/deploy staging  
- 完成某场景审查后，将对应 `scenario_progress[].status` 改为 **`reviewed`**（仍可追加 open findings）

### 3.4 Product Experience Audit（静态 IA/UX · 不验代码正确性）

**方法**：五角色（Traveler · Guide · Merchant · Operator · Admin）× 九域（CMS · Official OPS · Growth · Referral · Early Bird · Community Moderation · Market · Identity · Governance）— 审查信息架构、导航、命名、交互反馈、空态、错误提示、任务路径与认知成本。

```bash
python scripts/ops/generate-ux-findings-report.py
```

产出：

| 文件 | 用途 |
|------|------|
| `run-*/ux-findings-report.v1.json` | 机读 UX Findings Report · P0/P1/P2 |
| `run-*/ux-findings-report.v1.md` | 人读摘要 |
| `run-*/findings.json` | 合并 `UX-P*` 条目（`audit_source: product_experience_audit.v1`） |

**后序**：审计完成 → **统一 UX 优化 Sprint**（P0→P1→P2）→ spot-check 复审 → **真人 UAT** → 33/33 GO → Token Debt → 下一轮测试网。

### 3.6 Admin UX Cleanup Sprint（soak 窗口 · 不增业务功能）

**目标**：新运营无需培训 · 5 分钟内完成 CMS 发布 / Growth 分析 / 举报处理 / Official OPS 日常操作。

已落地（local）：P0 IA/命名/breadcrumb/Home · 风险类 P1 确认与 Banner · 运营术语 subtitle。

---

**视角**：首次接触系统的 **Operator** — 不验代码正确性；审查菜单命名、页面标题、说明文案、信息架构、空态、指标定义、操作反馈、风险提示、任务路径。

**分级**：P0 看不懂 · P1 容易误操作 · P2 效率低 · **目标**：真人 UAT 前无需培训即可完成日常运营。

```bash
python scripts/ops/generate-admin-ux-findings-report.py
```

产出：`run-*/admin-ux-findings-report.v1.json` · `.md` · 合并 `findings.json`（`ADMIN-UX-P*` · `audit_source: admin_product_experience_audit.v1`）

### 3.7 Admin Reality UAT（记录 only · 暂停 UX 改动）

**纪律**：暂停新增 Admin UX 改动 · **不修复** · **不重构** · 仅登记。

**允许导航**：Home Daily Ops · Operator Guide · Sidebar（若走 deep link / 命令面板捷径，记 `extra_clicks`）

**四项日常任务**：CMS 发布 · Growth 分析 · Community 举报处理 · Official OPS

登记 `findings.json` → `REUAT-*`（`kind`: blocked / lost / terminology / extra_clicks / misunderstanding / cognitive_cost · `fix_policy: deferred_post_reality_uat`）

会话元数据：`run-*/admin-reality-uat-session.v1.json` · `.md`

**后序**：Reality UAT 完成 → **Admin Reality Alignment Sprint** → **Admin Final Spot Check**（`:3012` 三条 Guide 路径 · `AFSC-*`）→ 等待 soak 完成 · 真人 UAT

### 3.8 Admin Final Spot Check（`:3012` · record-only · 暂停 UX）

**纪律**：除 P0/P1 **阻塞**外不新增 UX 改动 · 等待 `staging-soak` 完成。

**三条路径**：Guide → Countries → 发布 · Guide → Official Hub → 冷启动 · Guide → Reports → 两步结案

```bash
bash scripts/ops/run-admin-final-spot-check.sh
```

产出：`run-*/admin-final-spot-check.v1.json` · 合并 `findings.json`（`AFSC-*`）

### 3.9 Admin UX 工作流关闭（FROZEN · 2026-06-08）

**状态**：`CLOSED_FROZEN` — **禁止**一切 Admin IA / 导航 / Operator Guide / Home Daily Ops / Shell 菜单文案改动，直至 Owner 解除 soak 后另开 Sprint。

| 类别 | 处理 |
|------|------|
| `REUAT-*` / `ADMIN-UX-*` 未关闭 P1/P2 | **不进入** UX Backlog · 冻结 |
| `AFSC-001/002/003` | **环境层 P1**（`layer: env` · `ux_backlog: false`）· 非 UX 回归 |
| Alignment Sprint 已落地 | 保留 · 不再迭代 |

```bash
python scripts/ops/close-admin-ux-workflow.py   # 更新 findings admin_ux_workflow 块
```

**后序（唯一出口）**：soak COMPLETED → 33/33 GO → **Token Debt Sprint**（CSS token · 34 §5.3）→ 下一轮测试网 · 真人 Admin UAT 另排期

---

| 允许 | 禁止 |
|------|------|
| local / staging-dev 启停 | **tt-api-staging** / **tt-web-staging** redeploy |
| 编辑 `findings.json` + 附件 | staging secrets / fly.toml / migration on soak 环境 |
| 本地 feature 实验分支 | `TESTNET_FREEZE_OVERRIDE=1` 除非 Owner 紧急授权 |
| 记录 token 违规行号 | soak 窗口内批量改 token 并宣称 ② GO |

---

## 5. soak 完成后序

1. `evidence/P2FC_SOAK_72H_STAGING/COMPLETED.json`  
2. `P2FC_SOAK_DIR=evidence/P2FC_SOAK_72H_STAGING bash scripts/ops/p2fc-rerun-after-soak.sh` → **post-soak graduation audit**  
3. 解除 **`TESTNET_STAGING_FREEZE`**  
4. **Token debt Sprint** — 清 `check:tokens` · 引用 `tracks/token-debt-check-tokens.log` + `token-debt-sprint-plan.v1.json`  
5. **下一轮测试网** — deploy + `pra-staging-fullchain` + `smoke-staging-web`

### 5.1 Token Debt Sprint 规划（soak 窗口仅统计 · 不修复）

```bash
cd frontend && npm run check:tokens 2>&1 | tee evidence/.../tracks/token-debt-check-tokens.log
python scripts/ops/plan-token-debt-sprint.py
```

| 批次 | 范围 | 说明 |
|------|------|------|
| **B1-admin-ops** | `app/admin/**` · `components/admin/**` | CSS token 替换 · **不含** IA/Guide 改动 |
| **B2-escrow-orders** | escrow · disputes · orders | 最大命中域之一 |
| **B3-me-guide-provider** | me · guide · provider | skeleton / banner |
| **B4-trust-governance-market** | trust · governance · market | status callout · badges |
| **B5-shell-misc** | 其余 | home loading · traveltrust 等 |

产出：`run-*/token-debt-sprint-plan.v1.json` · `.md`（按 rule · domain · batch 汇总）

---

## 6. 变更 log

| 日期 | 变更 |
|------|------|
| 2026-06-08 | 初版 · 与 179 §5 soak 窗口并行 · `parallel-uat-during-soak.sh` |
| 2026-06-08 | §3.5 · Admin PEA · `generate-admin-ux-findings-report.py` · ADMIN-UX-P0/P1/P2 |
| 2026-06-08 | §3.7 · Admin Reality UAT · REUAT-* · record-only · pause UX fixes |
| 2026-06-08 | §3.8 · Admin Final Spot Check · AFSC-* · `run-admin-final-spot-check.sh` |
| 2026-06-08 | §3.9 · Admin UX CLOSED_FROZEN · AFSC env-layer · Token Debt plan §5.1 |
