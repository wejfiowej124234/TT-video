# 220-阶段配置中心（Config Center）

### 读前摘要

| 你要找什么 | 单源 |
|------------|------|
| **统一配置中心目标** | **§二** |
| **与 170/200/230/240 横切串联** | **§一** |
| **Current 快照** | **§2.1** |
| **契约单源** | **[04 §3.5](04-后端与API.md)**、**[14](14-合约-API-ABI-前后端对齐.md)** |
| **串联入口** | **[07 §五](07-开发流程与顺序.md)** |

## 一、文档定位

本文定义 TravelTrust 在 220 阶段的“统一配置中心（Config Center）”开发规范。

220 阶段不是普通配置文件管理，而是把开关、阈值、费率、风控规则、AI 开关、国家规则、城市规则、Feature Flag、灰度发布统一纳入可发布、可回滚、可审计的企业级配置系统。

与现有体系关系：

- 文档主入口：`docs/spec/00-文档索引.md`
- 业务线串联：**[07-开发流程与顺序.md](07-开发流程与顺序.md) §五**（[00-文档体系与阅读串联.md](00-文档体系与阅读串联.md) 兼容壳）
- 系统总览与硬约束：`docs/spec/01-总库总览.md`
- 架构与配置落点：`docs/spec/02-架构设计.md`
- 后端 API 与运行约束：`docs/spec/04-后端与API.md`
- 管理员系统：`docs/spec/70-管理员系统开发文档.md`
- AI 治理域：`docs/spec/170-阶段开发AI行程系统运行管理治理层.md`
- 财务与费率域：`docs/spec/200-阶段财务对账结算与报表.md`

权威与分层锚点：

- 冲突优先级：与 `01/03` 冲突时以 `01/03` 为准。
- 系统分层统一锚点：`02` §十四（`0~8` 九层 + 主链路 + 五中心）。
- 配置与发布契约单源：后台配置能力统一以 `04 §3.5` 与 `14` 为准。
- 关键串联：配置中心作为横切底座，联动 `170/200/220/230/240/250/360/400/421`。

## 二、问题与目标

若无统一配置中心，后续必然出现：

- 改一个费率要发版。
- 改一个限制要改代码。
- 不同国家无法配置不同规则。
- 测试环境和生产环境配置不一致。

220 阶段目标：

1. 配置统一：业务配置从代码剥离到统一系统。
2. 配置可控：支持版本发布、灰度生效、快速回滚。
3. 配置可审：每次配置变更可追溯到人、时间、原因。
4. 配置可分域：支持环境、国家、城市、用户群体级差异。
5. 配置可验证：发布前后自动校验，避免脏配置上线。

### 2.1 Current 快照（Target / Current / 证据锚点）

| 领域 | Target（220 目标） | Current（当前现状） | 证据锚点 |
|---|---|---|---|
| 配置查询与发布路由 | `admin/flags` + 发布回滚链路闭环 | **`GET /api/v1/admin/flags`**、**`POST /api/v1/admin/flags/:id/publish`** 已在 `admin.rs` 落地；**`GET /flags`** 与 **`GET /config/releases`**（**`/:id`**）响应 **`meta.build`** 与 **`GET /meta.build`** 同源（发布与审计对齐）；契约见 **`04 §3.5`** | `04 §3.5`、`crates/api/src/routes/admin.rs` |
| Secret/Key 元数据联动 | 配置发布可引用密钥元数据与轮换状态 | **`GET /api/v1/admin/secrets/metadata`** 已落地（无明文） | `04 §3.5`、`admin.rs` |
| 审批与审计绑定 | 配置发布动作必须关联审批号与审计记录 | 审批基线已实现：`GET /api/v1/admin/approvals`、`POST /api/v1/admin/approvals/:id/approve` | `04 §3.5`、`crates/api/src/routes/admin.rs` |
| 配置中心后台能力 | 配置键/值/版本/灰度/回滚/审计完整闭环 | **`/admin/config`** 导航台 + **`/admin/config/releases`**（列表筛选 + 详情 **`relist`** 回跳）+ flags/secrets 子页；完整键值中心仍迭代 | `70`、`13-1`、`frontend/app/admin/config` |
| 发布门禁执行 | 220 专项门禁接入 CI 并 fail-closed | 已接入独立 workflow：`.github/workflows/config-center-gate.yml`；并入 `build.yml` 主流水线 | `.github/workflows/config-center-gate.yml`、`.github/workflows/build.yml` |
| 校验模式边界 | Target 与 Implemented 的校验边界清晰可审计 | 当前为“Target 路由采用文档锚点校验 + Implemented 路由采用代码锚点校验”；实现级联调测试待补 | `.github/workflows/config-center-gate.yml`、`crates/api/src/routes/admin.rs` |

状态说明：`Current` 描述仓库事实，不等同于 220 全面验收完成。
补充说明：`config-center-gate` 仍以 **`04`** 文档锚点校验 flags/secrets 路由登记；实现与 **`admin.rs`** 一致。完整「键值 + 校验报告 + 自动门禁升级」仍以 **220** 验收表为准。

## 三、范围定义（九类配置能力）

### 3.1 开关（Switches）

- 系统开关、模块开关、应急开关。
- 支持按环境、国家、城市、用户群体覆盖。

### 3.2 阈值（Thresholds）

- 风控阈值、限流阈值、重试阈值、告警阈值。
- 支持分层覆盖与默认回退。

### 3.3 费率（Rates）

- 平台费率、手续费、分账比例、惩罚率。
- 与财务域结算规则联动，版本化生效。

### 3.4 风控规则（Risk Rules）

- 命中条件、评分权重、处置动作、SLA。
- 支持策略版本与规则实验。

### 3.5 AI 开关（AI Toggles）

- 模型开关、Prompt 线路开关、AI 功能范围开关。
- 与 170 阶段 AI 运营治理中心联动。

### 3.6 国家规则（Country Rules）

- 国家级业务策略、费率、合规阈值、可用能力。
- 支持国家默认 + 城市覆写。

### 3.7 城市规则（City Rules）

- 城市级运营限制、价格参数、服务策略。
- 城市规则优先级高于国家默认规则。

### 3.8 Feature Flag

- 新功能开关、实验开关、黑白名单开关。
- 支持群组投放、百分比放量、定时生效。

### 3.9 灰度发布（Rollout）

- 灰度计划、批次放量、自动回退阈值。
- 发布过程与结果必须有审计记录。

## 四、核心硬约束（必须写死）

1. Config First：所有可运营参数必须进入配置中心，不得散落硬编码。
2. Versioned Release：配置变更必须通过版本发布，不得直接覆盖线上值。
3. Safe Rollback：每个发布版本必须支持一键回滚。
4. Scope Aware：配置必须支持 env/country/city/cohort 多级范围。
5. Audit by Default：每次配置变更必须带操作者、原因、审批与差异。
6. Validation Gate：未通过配置校验不得发布。

## 五、数据模型（必须具备）

220 阶段最小表集合（必须）：

- `config_keys`
- `config_values`
- `config_versions`
- `config_rollouts`
- `config_audit`

建议增强表：

- `config_scopes`
- `config_validation_reports`
- `config_release_approvals`
- `config_change_requests`

字段级要求：

- `config_keys`：`key`、`domain`、`value_type`、`default_value`、`is_sensitive`。
- `config_values`：`key`、`scope_type`、`scope_code`、`value`、`effective_from`。
- `config_versions`：`version_no`、`status`、`created_by`、`approved_by`、`released_at`。
- `config_rollouts`：`version_no`、`rollout_strategy`、`rollout_percent`、`rollback_to`。
- `config_audit`：`actor_id`、`action`、`before_digest`、`after_digest`、`reason`、`occurred_at`。

### 5.1 概念 API 与权威路由映射（对齐 `04 §3.5`、`14`）

| 配置治理能力域 | 路由锚点（已登记） | 当前状态 |
|---|---|---|
| Feature Flag 查询 | `GET /api/v1/admin/flags` | Implemented（基线，`admin.rs`） |
| Feature Flag 发布/回滚 | `POST /api/v1/admin/flags/:id/publish` | Implemented（基线，`super_admin`） |
| Secret 元数据绑定 | `GET /api/v1/admin/secrets/metadata` | Implemented（基线，无明文） |
| 配置发布审批复核 | `GET /api/v1/admin/approvals`、`POST /api/v1/admin/approvals/:id/approve` | Implemented（基线） |

执行说明：220 阶段新增或改名配置接口时，必须先完成 `04 §3.5` 与 `14` 同步再进入实现。

Target/Implemented 生效边界：`5.1` 中 `Target` 状态能力，在未完成“代码落地 + 契约登记 + 门禁证据”三项前，不得用于 `Implemented` 验收或对外宣称。

## 六、后台模块要求

后台新增一级模块：`配置中心`

子模块（必须）：

- 配置键管理
- 配置值管理
- 配置版本发布
- 灰度发布管理
- 回滚中心
- 配置审计日志
- 配置校验报告

关键操作流程（必须）：

- 新建或编辑配置。
- 生成发布版本。
- 审批通过后发布。
- 按灰度策略放量。
- 异常触发自动或手动回滚。
- 留痕并归档审计。

## 七、权限模型（最小角色）

建议最小配置域角色（作用域标签）：

- `CONFIG_VIEWER`
- `CONFIG_EDITOR`
- `CONFIG_RELEASE_MANAGER`
- `CONFIG_AUDITOR`

与 `70` 角色体系映射（统一口径，避免双轨 RBAC）：

| 配置域角色 | 70 角色主映射 | 说明 |
|---|---|---|
| `CONFIG_VIEWER` | `Ops` / `Auditor`（只读） | 只读配置快照与发布历史 |
| `CONFIG_EDITOR` | `Ops` / `Risk`（受限） | 可编辑草稿，不可发布 |
| `CONFIG_RELEASE_MANAGER` | `SuperAdmin`（或经授权 `Ops`） | 可发布与回滚，必须双人复核 |
| `CONFIG_AUDITOR` | `Auditor` | 只读审计导出，不可改配置 |

冲突优先规则：若 `CONFIG_*` 与 `70` 六角色授权冲突，以 `70` 主角色约束为准，`CONFIG_*` 仅作为配置域作用域标签。

权限约束：

- `CONFIG_EDITOR` 可改草稿，不可直接发布。
- `CONFIG_RELEASE_MANAGER` 才可发布/回滚。
- `CONFIG_AUDITOR` 仅读审计，不可改配置。
- 费率、风控阈值、生产开关发布必须双人复核。

## 八、实施计划（220 阶段）

### 8.1 P0（必须）

- 完成 `config_keys/config_values/config_versions/config_rollouts/config_audit` 五表落地。
- 完成后台配置页面、版本发布、回滚、审计四大能力。
- 完成环境、国家、城市三级配置覆盖与读取优先级。
- 完成 Feature Flag 与灰度发布最小闭环。

### 8.1.1 P0 未落地项与阻塞说明（Current）

截至 `2026-03-08`，以下 P0 项仍处于“规划要求已写入，仓库实现证据待补”状态：

- `config_keys`：未检索到对应 migration/DDL 证据。
- `config_values`：未检索到对应 migration/DDL 证据。
- `config_versions`：未检索到对应 migration/DDL 证据。
- `config_rollouts`：未检索到对应 migration/DDL 证据。
- `config_audit`：未检索到对应 migration/DDL 证据。

阻塞口径：上述五表任一未落地时，220 不得从 `Target` 升级为 `Implemented`。
证据回填位置：`crates/api/migrations/*`（DDL）+ `docs/spec/15-多维度文档与技术检查报告.md`（实现证据附录）。

### 8.2 P1（增强）

- 配置变更审批流平台化。
- 配置差异对比与影响面分析。
- 配置实验评估与自动化回退策略。

### 8.3 P2（规模化）

- 多区域配置同步与一致性治理。
- 配置策略模板化与策略市场。
- 配置变更与业务指标自动关联分析。

## 九、发布门禁（分层：P0 必须全过）

### 9.1 P0（最小可发布门禁，必须全过）

1. 配置变更只能通过版本发布流程生效。
2. 生产配置发布具备审批与审计记录。
3. 灰度发布与回滚演练通过。
4. 国家/城市差异配置回归测试通过。
5. 关键配置（费率/风控/AI 开关）变更通过影响校验。

### 9.1.1 量化门禁基线（P0，必须写入 CI 并按 fail-closed 执行）

- 配置路由锚点可用性：`/api/v1/admin/flags`、`/api/v1/admin/flags/:id/publish`、`/api/v1/admin/secrets/metadata` 检查通过率 = 100%。
- 审批锚点完整性：`/api/v1/admin/approvals`、`/api/v1/admin/approvals/:id/approve` 检查通过率 = 100%。
- 配置证据完整性：`workflow + job + check + commit_sha + ci_run_id + env + rule_id + severity + owner + generated_at + passed` 完整率 = 100%。
- 发布抽样完整性：抽样 10 条配置发布记录，`approval_no + actor + released_at` 完整率 = 100%（Current 阶段允许 drill 证据替代）。

证据文件绑定（最小集合）：

- 配置路由锚点：`evidence/GO_YYYYMMDD/config_center_routes.log`
- 配置门禁汇总：`evidence/GO_YYYYMMDD/config_center_gate_summary.json`
- 量化指标：`evidence/GO_YYYYMMDD/config_center_gate_metrics.json`
- 审计字段检查：`evidence/GO_YYYYMMDD/config_center_evidence_field_report.json`
- 发布抽样：`evidence/GO_YYYYMMDD/config_release_sampling_report.json`

当前状态说明：220 专项 gate 已接入 `.github/workflows/config-center-gate.yml`，并已并入 `.github/workflows/build.yml` 主流水线；按“主流水线 + 独立 gate”双轨证据强制校验执行。

### 9.2 P1/P2（增强门禁，按阶段收口）

1. `admin/flags` 从 Target 升级为 Implemented 后，纳入强制发布门禁。
2. 配置差异影响面分析与自动回滚策略落地后，纳入规模化门禁。
3. 配置发布审批流与多区域同步稳定后，纳入跨域门禁。

### 9.3 门禁执行锚点（仓库现有入口）

| 门禁类别 | 执行入口 | 证据落点 |
|---|---|---|
| 配置路由与审批锚点 | `GET /api/v1/admin/flags`、`POST /api/v1/admin/flags/:id/publish`、`GET /api/v1/admin/secrets/metadata`、`GET /api/v1/admin/approvals` | `evidence/GO_YYYYMMDD/` |
| 发布抽样与字段复核 | 配置发布演练记录（drill 或真实记录） | 采样报告 + 门禁汇总 |

执行说明：若 CI 有同名或等效 Job，以 CI 结果为主证据；本地回归用于复核。门禁不全则 fail-closed。

### 9.4 执行入口（工作流/命令/责任人）

- 代码与测试入口：`cargo test -p traveltrust-api`、`cd frontend && npm run test`。
- 当前 CI 入口：`.github/workflows/build.yml`（主流水线并轨） + `.github/workflows/config-center-gate.yml`（220 专项门禁）。
- 责任人：`api-backend`（路由与契约）、`admin-platform`（配置治理链路）、`ops-sre`（发布演练证据）。
- 发布原则：220 门禁失败或证据缺失时，不得将配置中心链路标记为 `Implemented`。

### 9.5 证据字段规范（发布证据 JSON 最小字段）

配置治理相关证据最小字段必须包含：

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

- `170` 管理 AI 运行治理，但 AI 参数发布能力依赖统一配置中心。
- `200` 管理财务费率与结算口径，费率配置必须接入配置中心版本管理。
- `220` 作为横切治理底座，为风控、财务、AI、运营提供统一配置发布与审计能力。

结论：Config Center 是企业级系统必备，不是普通 config；没有 220 阶段，后续运营与治理将不可控、不可审计、不可回滚。

## 文档同步门禁（与权威层级对齐）

- 冲突优先级：与 `01/03` 冲突时以 `01/03` 为准。
- API/契约变更：新增、删除、改名接口或状态口径变更，必须同步 `04 §3.5` 与 `14`。
- 页面/RBAC 变更：涉及配置后台菜单、角色动作、发布审批时，必须同步 `13-1` 与 `70`。
- 数据模型/运维门禁口径变更：必须同步 `120/140` 与 Runbook。
- 文档串联变更：必须同步 **[07-开发流程与顺序](07-开发流程与顺序.md)（§零～§五正文）**、[00-文档索引](00-文档索引.md)；[00-文档体系与阅读串联](00-文档体系与阅读串联.md) 为兼容壳（涉及 CI 关键词如 `82` 时须核对）。

---

文档版本：1.0.3
最后更新：2026-03-08
适用阶段：220-阶段开发（配置中心 Config Center）

> 实现状态标签：`Target`（阶段规划文档）
> 证据口径：与代码不一致时，以代码事实为准；进入上线验收前需补 `Implemented` 证据条目。
> Implemented 证据回填路径：`docs/spec/15-多维度文档与技术检查报告.md` 附录〇 + `evidence/GO_YYYYMMDD/`。
