# 240-阶段 Feature Flag / 灰度系统

### 读前摘要

| 你要找什么 | 单源 |
|------------|------|
| **灰度业务场景与目标** | **§二** |
| **与 220/140/200/100 联动** | **§一** |
| **Current 快照** | **§2.1** |
| **契约** | **[04 §3.5](04-后端与API.md)**、**[14](14-合约-API-ABI-前后端对齐.md)** |
| **串联入口** | **[07 §零、§五](07-开发流程与顺序.md)** |

## 一、文档定位

本文定义 TravelTrust 在 240 阶段的“Feature Flag 与灰度系统”开发规范。

240 阶段不是简单开关表，而是支持按国家、城市、用户、向导、百分比进行可控实验与渐进发布的企业级上线系统。

与现有体系关系：

- 文档主入口：`docs/spec/00-文档索引.md`
- 文档串联：**[07-开发流程与顺序.md](07-开发流程与顺序.md) §零、§五**（[00-文档体系与阅读串联.md](00-文档体系与阅读串联.md) 兼容壳）
- 架构与发布基线：`docs/spec/02-架构设计.md`、`docs/spec/140-阶段开发云部署与交付架构.md`
- 配置治理基线：`docs/spec/220-阶段配置中心-Config-Center.md`
- AI 与业务策略联动：`docs/spec/170-阶段开发AI行程系统运行管理治理层.md`
- 财务与风控参数联动：`docs/spec/200-阶段财务对账结算与报表.md`、`docs/spec/100-阶段开发风控与仲裁执行系统.md`

权威与分层锚点：

- 冲突优先级：与 `01/03` 冲突时以 `01/03` 为准。
- 系统分层统一锚点：`02` §十四（`0~8` 九层 + 主链路 + 五中心）。
- Flag 契约单源：统一以 `04 §3.5` 与 `14` 为准。
- 关键串联：灰度发布走 `240/220/140`，审批与审计链路联动 `360/120`。

## 二、业务目标

240 阶段必须支持以下场景：

- 某国家开新功能。
- 某城市开 AI。
- 某用户测试新 UI。
- 某向导测试新规则。
- 1% 灰度放量。
- 快速回滚。

若无此系统将导致：

- 一改即全站生效，爆炸面不可控。
- 无法做实验与 A/B。
- 无法逐步上线与分域验证。

### 2.1 Current 快照（Target / Current / 证据锚点）

| 领域 | Target（240 目标） | Current（当前现状） | 证据锚点 |
|---|---|---|---|
| Flag 查询与发布路由 | `admin/flags` + 发布回滚链路闭环 | **`GET /api/v1/admin/flags`**、**`POST /api/v1/admin/flags/:id/publish`** 已 **Implemented（基线）**；列表响应 **`meta.build`**；发布 **`200`** 含 **`meta.build`**（均与 **`GET /meta.build`** 同源）；DB 表 **`feature_flags`**（迁移见 `crates/api/migrations`） | `04 §3.5`、`14`、`crates/api/src/routes/admin.rs`、`crates/api/src/db/config_center.rs` |
| 发布审批复核 | Flag 发布动作必须关联审批链路 | 审批基线已实现：`GET /api/v1/admin/approvals`、`POST /api/v1/admin/approvals/:id/approve` | `04 §3.5`、`crates/api/src/routes/admin.rs` |
| 灰度控制平面 | 按 scope/percent/window 的发布与回滚能力 | 当前以规划为主，后台最小工作台能力待补齐 | `70`、`13-1` |
| 发布门禁执行 | 240 专项门禁接入 CI 并 fail-closed | 已接入独立 workflow：`.github/workflows/feature-flag-gate.yml`；并入 `build.yml` 主流水线 | `.github/workflows/feature-flag-gate.yml`、`.github/workflows/build.yml` |
| 校验模式边界 | Target 与 Implemented 的校验边界清晰可审计 | **`GET/POST …/flags*`** 已落地：门禁以 **`04`** 文档锚点 + **`admin.rs`** 路由登记为主；**P0 表 `feature_targets`～`feature_logs` 等**仍为规划，未替代当前基线 | `.github/workflows/feature-flag-gate.yml`、`crates/api/src/routes/admin.rs` |

状态说明：`Current` 描述仓库事实，不等同于 240 全面验收完成。
补充说明：`/api/v1/admin/flags`、`/api/v1/admin/flags/:id/publish` 已在 **`04 §3.5` / `14`** 标为 **Implemented（基线）**；前端 **`/admin/flags`** 已消费列表与发布 Modal；**240 §五** 扩展表与规则引擎仍为后续增量。

## 三、范围定义（七大能力）

### 3.1 Feature Flag 管理

- Flag 生命周期：草稿、待发布、生效、暂停、下线。
- Flag 类型：功能开关、实验开关、风控策略开关、UI 开关。

### 3.2 目标人群投放

- 用户白名单、黑名单、分组标签投放。
- 向导群体、运营群体、测试群体定向投放。

### 3.3 地区投放

- 国家级投放。
- 城市级投放。
- 地区覆盖优先级与回退策略。

### 3.4 规则引擎

- 条件组合（AND/OR）、时间窗口、环境限制。
- 按用户属性、地区属性、业务属性路由。

### 3.5 灰度放量

- 百分比放量（如 1% -> 5% -> 20% -> 100%）。
- 批次放量计划、失败阈值回退。

### 3.6 A/B 实验

- 实验组与对照组划分。
- 指标采集与效果对比。
- 实验结束后的策略固化或下线。

### 3.7 观察与回滚

- 实时观察关键指标（错误率、延迟、转化、投诉率）。
- 一键回滚到上一稳定版本。

## 四、核心硬约束（必须写死）

1. Flag Before Release：新功能必须先入 Flag，再发布。
2. Scoped Rollout：上线必须有投放范围，不得默认全量。
3. Fast Rollback：关键 Flag 必须支持秒级回滚。
4. Audit Every Change：每次规则调整都要审计留痕。
5. Time Window Control：高风险功能必须配置生效时间窗口。
6. Environment Isolation：测试/预发/生产 Flag 严格隔离。

## 五、数据模型（必须具备）

240 阶段最小表集合（必须）：

- `feature_flags`
- `feature_targets`
- `feature_rules`
- `feature_rollouts`
- `feature_logs`

建议增强表：

- `feature_experiments`
- `feature_metrics_snapshots`
- `feature_approvals`

字段级要求：

- `feature_flags`：`flag_key`、`domain`、`status`、`owner`、`default_state`。
- `feature_targets`：`flag_key`、`target_type`（country/city/user/guide/cohort）、`target_value`。
- `feature_rules`：`flag_key`、`rule_expr`、`priority`、`effective_from`、`effective_to`。
- `feature_rollouts`：`flag_key`、`rollout_percent`、`phase_no`、`rollback_to`。
- `feature_logs`：`actor_id`、`action`、`flag_key`、`before_digest`、`after_digest`、`occurred_at`。

### 5.1 概念 API 与权威路由映射（对齐 `04 §3.5`、`14`）

| Flag 能力域 | 路由锚点（已登记） | 当前状态 |
|---|---|---|
| Feature Flag 查询 | `GET /api/v1/admin/flags` | Implemented（基线）；**`meta.build`** 同 **`GET /meta.build`** |
| Feature Flag 发布/回滚 | `POST /api/v1/admin/flags/:id/publish` | Implemented（基线）；**`200`** 含 **`meta.build`** |
| 发布审批复核 | `GET /api/v1/admin/approvals`、`POST /api/v1/admin/approvals/:id/approve` | Implemented（基线） |

执行说明：240 阶段新增或改名灰度接口时，必须先完成 `04 §3.5` 与 `14` 同步再进入实现。

Target/Implemented 生效边界：**本节 `5.1` 表内三条路由**已标 **Implemented（基线）**；**§五** 扩展表（`feature_targets` 等）与规则引擎仍为 **Target**，须待“代码落地 + 契约登记 + 门禁证据”后再标 **Implemented**。

## 六、后台模块要求

后台新增一级模块：`Feature Flag / 灰度`

子模块（必须）：

- 开关控制
- 人群选择
- 地区选择
- 时间窗口
- 灰度计划
- A/B 实验
- 回滚中心
- 变更日志

## 七、权限模型（最小角色）

建议最小角色（作用域标签）：

- `FLAG_VIEWER`
- `FLAG_EDITOR`
- `FLAG_RELEASE_MANAGER`
- `FLAG_AUDITOR`

与 `70` 角色体系映射（统一口径，避免双轨 RBAC）：

| Flag 域角色 | 70 角色主映射 | 说明 |
|---|---|---|
| `FLAG_VIEWER` | `Ops` / `Auditor`（只读） | 仅查看开关状态与发布历史 |
| `FLAG_EDITOR` | `Ops` / `Risk`（受限） | 可编辑草稿，不可发布 |
| `FLAG_RELEASE_MANAGER` | `SuperAdmin`（或经授权 `Ops`） | 可放量与回滚，必须双人复核 |
| `FLAG_AUDITOR` | `Auditor` | 只读变更日志与实验结果 |

冲突优先规则：若 `FLAG_*` 与 `70` 六角色授权冲突，以 `70` 主角色约束为准，`FLAG_*` 仅作为灰度域作用域标签。

权限约束：

- `FLAG_EDITOR` 可编辑规则草稿，不可直接全量发布。
- `FLAG_RELEASE_MANAGER` 可执行放量与回滚。
- 高风险 Flag 发布必须双人复核。
- `FLAG_AUDITOR` 仅读变更日志与实验结果。

## 八、实施计划（240 阶段）

### 8.1 P0（必须）

- 完成五张核心表落地。
- 完成开关控制、人群选择、地区选择、时间窗口四类后台能力。
- 完成 1% 灰度与回滚最小闭环。
- 完成核心业务路径 Flag 化改造。

### 8.2 P1（增强）

- A/B 实验平台化与指标自动评估。
- 放量异常自动暂停与自动回退。
- 跨端（Web/Admin/API）Flag 一致性校验。

### 8.3 P2（规模化）

- 多区域多策略编排。
- 智能放量策略（指标驱动）。
- Flag 生命周期治理与技术债自动清理。

## 九、发布门禁（分层：P0 必须全过）

### 9.1 P0（最小可发布门禁，必须全过）

1. 关键新功能全部通过 Flag 管理。
2. 生产放量必须有范围、比例、时间窗口。
3. 灰度与回滚演练通过。
4. A/B 试验数据可追溯可复盘。
5. 全量发布前完成跨区域验证与审计记录。

### 9.1.1 量化门禁基线（P0，必须写入 CI 并按 fail-closed 执行）

- 路由锚点可用性：`/api/v1/admin/flags`、`/api/v1/admin/flags/:id/publish`、审批锚点检查通过率 = 100%。
- 灰度策略约束检查：文档中“Flag Before Release”“Scoped Rollout”约束检查通过率 = 100%。
- 证据字段完整性：`workflow + job + check + commit_sha + ci_run_id + env + rule_id + severity + owner + generated_at + passed` 完整率 = 100%。
- 发布抽样完整性：抽样 10 条发布记录，`flag_key + actor + released_at` 完整率 = 100%（Current 阶段允许 drill 证据替代）。

证据文件绑定（最小集合）：

- 路由锚点：`evidence/GO_YYYYMMDD/feature_flag_routes.log`
- 门禁汇总：`evidence/GO_YYYYMMDD/feature_flag_gate_summary.json`
- 量化指标：`evidence/GO_YYYYMMDD/feature_flag_gate_metrics.json`
- 字段检查：`evidence/GO_YYYYMMDD/feature_flag_evidence_field_report.json`
- 发布抽样：`evidence/GO_YYYYMMDD/flag_release_sampling_report.json`

当前状态说明：240 专项 gate 已接入 `.github/workflows/feature-flag-gate.yml`，并已并入 `.github/workflows/build.yml` 主流水线；按“主流水线 + 独立 gate”双轨证据强制校验执行。

### 9.2 P1/P2（增强门禁，按阶段收口）

1. `admin/flags` 从 Target 升级为 Implemented 后，纳入强制发布门禁。
2. 自动回退与异常暂停链路落地后，纳入规模化门禁。
3. 跨区域多策略编排与一致性验证落地后，纳入跨域门禁。

### 9.3 门禁执行锚点（仓库现有入口）

| 门禁类别 | 执行入口 | 证据落点 |
|---|---|---|
| Flag 路由与审批锚点 | `GET /api/v1/admin/flags`、`POST /api/v1/admin/flags/:id/publish`、`GET /api/v1/admin/approvals` | `evidence/GO_YYYYMMDD/` |
| 发布抽样与字段复核 | 灰度发布演练记录（drill 或真实记录） | 采样报告 + 门禁汇总 |

执行说明：若 CI 有同名或等效 Job，以 CI 结果为主证据；本地回归用于复核。门禁不全则 fail-closed。

### 9.4 执行入口（工作流/命令/责任人）

- 代码与测试入口：`cargo test -p traveltrust-api`、`cd frontend && npm run test`。
- 当前 CI 入口：`.github/workflows/build.yml`（主流水线并轨） + `.github/workflows/feature-flag-gate.yml`（240 专项门禁）。
- 责任人：`api-backend`（路由与契约）、`admin-platform`（灰度治理链路）、`ops-sre`（发布演练证据）。
- 发布原则：240 门禁失败或证据缺失时，不得将 Feature Flag 链路标记为 `Implemented`。

### 9.5 证据字段规范（发布证据 JSON 最小字段）

Feature Flag 治理相关证据最小字段必须包含：

- `workflow`
- `job`
- `check`
- `commit_sha`
- `ci_run_id`
- `env`
- `rule_id`
- `severity`
- `owner`
- `generated_at`（UTC）
- `passed`

字段缺失、时间戳非 UTC、`passed` 缺失视为门禁失败。

## 十、与既有阶段关系

- `220` 提供统一配置治理底座，`240` 提供上线与实验执行层。
- `170` 的 AI 能力上线应通过 240 的地区与人群灰度。
- `200` 的费率和财务策略调整可通过 240 先做小流量验证。

结论：Feature Flag 与灰度系统是稳定上线能力的核心，没有 240 阶段就没有可控实验、渐进放量和安全回滚。

## 文档同步门禁（与权威层级对齐）

- 冲突优先级：与 `01/03` 冲突时以 `01/03` 为准。
- API/契约变更：新增、删除、改名接口或状态口径变更，必须同步 `04 §3.5` 与 `14`。
- 页面/RBAC 变更：涉及灰度后台菜单、角色动作、发布审批时，必须同步 `13-1` 与 `70`。
- 数据模型/运维门禁口径变更：必须同步 `120/140` 与 Runbook。
- 文档串联变更：必须同步 **[07-开发流程与顺序](07-开发流程与顺序.md)（§零～§五正文）**、[00-文档索引](00-文档索引.md)；[00-文档体系与阅读串联](00-文档体系与阅读串联.md) 为兼容壳（涉及 CI 关键词如 `82` 时须核对）。

---

文档版本：1.0.2
最后更新：2026-03-08
适用阶段：240-阶段开发（Feature Flag / 灰度系统）

> 实现状态标签：`Target`（阶段规划文档）
> 证据口径：与代码不一致时，以代码事实为准；进入上线验收前需补 `Implemented` 证据条目。
> Implemented 证据回填路径：`docs/spec/15-多维度文档与技术检查报告.md` 附录〇 + `evidence/GO_YYYYMMDD/`。

