# 230-阶段 Secret / Key 管理系统

### 读前摘要

| 你要找什么 | 单源 |
|------------|------|
| **须纳管的密钥类型** | **§二** |
| **治理目标（轮换/审计/零明文）** | **§三** |
| **与 220/170/140/120 串联** | **§一** |
| **契约** | **[04 §3.5](04-后端与API.md)**、**[14](14-合约-API-ABI-前后端对齐.md)** |
| **串联入口** | **[07 §零、§五](07-开发流程与顺序.md)** |

## 一、文档定位

本文定义 TravelTrust 在 230 阶段的“Secret 与 Key 管理系统”开发规范。

230 阶段不是补一个配置页，而是将所有敏感凭据纳入企业级密钥治理系统，保证可托管、可轮换、可审计、不可明文泄露。

与现有体系关系：

- 文档主入口：`docs/spec/00-文档索引.md`
- 文档串联：**[07-开发流程与顺序.md](07-开发流程与顺序.md) §零、§五**（[00-文档体系与阅读串联.md](00-文档体系与阅读串联.md) 兼容壳）
- 系统总览与安全基线：`docs/spec/01-总库总览.md`
- 架构与运行边界：`docs/spec/02-架构设计.md`
- 后端与运维边界：`docs/spec/04-后端与API.md`、`docs/spec/140-阶段开发云部署与交付架构.md`
- AI 与配置治理域：`docs/spec/170-阶段开发AI行程系统运行管理治理层.md`、`docs/spec/220-阶段配置中心-Config-Center.md`

权威与分层锚点：

- 冲突优先级：与 `01/03` 冲突时以 `01/03` 为准。
- 系统分层统一锚点：`02` §十四（`0~8` 九层 + 主链路 + 五中心）。
- Secret/Key 契约单源：统一以 `04 §3.5` 与 `14` 为准。
- 关键串联：密钥治理走 `230/220/170/140`，审批与审计链路联动 `360/120`。

## 二、敏感资产范围（必须纳管）

至少纳管以下密钥与凭据：

- AI Key
- RPC Key
- Wallet signer
- JWT secret
- Webhook secret
- Email / SMS key
- KYC provider key

硬约束：

- 不得将真实密钥明文存入业务 DB。
- 不得将真实密钥长期固化在 `.env` 作为唯一来源。
- 不得在后台页面、日志、错误栈中暴露明文。

## 三、系统目标

230 阶段目标是建立统一 Secret 与 Key 治理闭环：

1. Secret 托管统一：由 Secret Manager/Vault/KMS 管理。
2. 环境隔离清晰：dev/staging/prod 严格分层与权限隔离。
3. 轮换可执行：支持自动或半自动 rotation。
4. 审计可追溯：访问、变更、轮换、撤销全留痕。
5. 最小暴露面：服务按需拉取，后台只看元数据状态。

### 3.1 Current 快照（Target / Current / 证据锚点）

| 领域 | Target（230 目标） | Current（当前现状） | 证据锚点 |
|---|---|---|---|
| Secret 元数据查询 | 提供密钥元数据、轮换状态、环境隔离视图 | **`GET /api/v1/admin/secrets/metadata`** 已 **Implemented（基线）**；响应含 **`meta.build`**（与 **`GET /meta.build`** 同源） | `04 §3.5`、`14`、`crates/api/src/routes/admin.rs` |
| Secret 明文隔离 | 后台与日志仅允许元数据，不可见明文 | 规范已定义，需门禁持续校验 | `230` 本文、`140` |
| 配置与密钥解耦 | 配置中心仅存引用，不持有明文 | 220 已声明“引用治理”口径，需 230 闭环承接 | `220`、`170` |
| 发布门禁执行 | 230 专项门禁接入 CI 并 fail-closed | 已接入 `.github/workflows/secret-key-gate.yml`，并并入 `build.yml` 主流水线 | `.github/workflows/secret-key-gate.yml`、`.github/workflows/build.yml` |
| 校验模式边界 | Target 与 Implemented 的校验边界清晰可审计 | 当前为“Target 路由采用文档锚点校验 + Implemented 路由采用代码锚点校验”；实现级联调测试待补 | `.github/workflows/secret-key-gate.yml`、`crates/api/src/routes/admin.rs` |

状态说明：`Current` 描述仓库事实，不等同于 230 全面验收完成。
补充说明：`/api/v1/admin/secrets/metadata` 已在 **`04 §3.5` / `14`** 标为 **Implemented（基线）**；`secret-key-gate` 对已实现路由按代码锚点校验，与文档登记一致。

## 四、范围定义（六大模块）

### 4.1 Secret 托管层

核心能力：

- 接入 Secret Manager/Vault/KMS。
- 按 provider、用途、环境、区域进行命名与分组。
- 支持版本化与生命周期管理。

最小要求（P0）：

- 生产 Secret 必须在托管系统内，不得仅存在本地文件。
- 支持密钥禁用与紧急撤销。

### 4.2 环境分层与隔离

核心能力：

- `dev/staging/prod` 独立命名空间。
- 测试与生产密钥完全隔离。
- 不同国家/城市节点可分域隔离。

最小要求（P0）：

- 跨环境读取必须禁止。
- 生产密钥访问需更高审批级别。

### 4.3 轮换（Rotation）系统

核心能力：

- 轮换策略：定期轮换、事件触发轮换、紧急轮换。
- 双 Key 过渡：新旧并行窗口，避免服务中断。
- 轮换回滚：新 Key 故障时可快速回退。

最小要求（P0）：

- 关键 Secret 必须配置轮换周期。
- 轮换失败必须自动告警并阻断发布。

### 4.4 访问控制与最小权限

核心能力：

- 按服务账号与角色授予最小读取权限。
- 读写分离、审批分离、审计分离。
- 高频访问检测与异常告警。

最小要求（P0）：

- 人工账号默认不可直接读取生产明文。
- 批量导出 Secret 必须禁止或强审批。

### 4.5 审计与取证

核心能力：

- 记录谁在何时访问或变更了哪些 Secret。
- 记录轮换事件、失败原因、回滚动作。
- 形成可导出审计证据包。

最小要求（P0）：

- 审计日志不可篡改。
- 高风险事件（泄露、越权）必须触发工单和告警。

### 4.6 后台可视化与操作面

后台只允许展示元数据，不展示明文。

可展示字段示例：

- `provider: openai`
- `env: prod`
- `status: active`
- `last_rotated: 2026-03-07T00:00:00Z`

最小要求（P0）：

- 后台支持密钥引用绑定、状态检查、轮换触发、审计查看。
- 后台严禁展示完整 key，仅可展示掩码或引用 ID。

## 五、数据模型建议（最小集合）

建议新增或确认以下实体：

- `secret_providers`
- `secret_refs`
- `secret_versions`
- `secret_rotations`
- `secret_access_audit`
- `secret_incidents`

字段级要求：

- `secret_refs`：`secret_ref_id`、`provider`、`env`、`status`、`last_rotated_at`。
- `secret_versions`：`version_no`、`created_by`、`created_at`、`is_active`。
- `secret_rotations`：`rotation_id`、`trigger_type`、`result`、`rollback_version`。
- `secret_access_audit`：`actor_id`、`action`、`target_ref`、`ip`、`occurred_at`。

### 5.1 概念 API 与权威路由映射（对齐 `04 §3.5`、`14`）

| Secret/Key 能力域 | 路由锚点（已登记） | 当前状态 |
|---|---|---|
| Secret 元数据与轮换状态 | `GET /api/v1/admin/secrets/metadata` | Target（已登记） |
| 配置发布前审批复核 | `GET /api/v1/admin/approvals`、`POST /api/v1/admin/approvals/:id/approve` | Implemented（基线） |

执行说明：230 阶段新增或改名密钥治理接口时，必须先完成 `04 §3.5` 与 `14` 同步再进入实现。

Target/Implemented 生效边界：`5.1` 中 `Target` 状态能力，在未完成“代码落地 + 契约登记 + 门禁证据”三项前，不得用于 `Implemented` 验收或对外宣称。

## 六、后台模块要求

后台新增一级模块：`Secret / Key 管理`

子模块（必须）：

- Secret 目录
- Secret 引用绑定
- 轮换中心
- 环境隔离视图
- 审计日志
- 事件与告警

## 七、权限模型（最小角色）

建议最小角色（密钥域作用域标签）：

- `SECRET_VIEWER`
- `SECRET_OPERATOR`
- `SECRET_ROTATION_MANAGER`
- `SECRET_AUDITOR`

与 `70` 角色体系映射（统一口径，避免双轨 RBAC）：

| Secret 域角色 | 70 角色主映射 | 说明 |
|---|---|---|
| `SECRET_VIEWER` | `Ops` / `Auditor`（只读） | 仅查看元数据与状态 |
| `SECRET_OPERATOR` | `Ops`（受限） | 可维护引用，不可读取明文 |
| `SECRET_ROTATION_MANAGER` | `SuperAdmin`（或经授权 `Ops`） | 可触发轮换与回滚，必须双人复核 |
| `SECRET_AUDITOR` | `Auditor` | 仅读审计，不可执行变更 |

冲突优先规则：若 `SECRET_*` 与 `70` 六角色授权冲突，以 `70` 主角色约束为准，`SECRET_*` 仅作为密钥域作用域标签。

权限约束：

- `SECRET_VIEWER` 仅查看元数据。
- `SECRET_OPERATOR` 可维护引用，不可读取明文。
- `SECRET_ROTATION_MANAGER` 可触发轮换与回滚。
- `SECRET_AUDITOR` 仅读审计，不可执行变更。
- 生产密钥轮换与撤销必须双人复核。

## 八、实施计划（230 阶段）

### 8.1 P0（必须）

- 接入 Secret Manager/Vault/KMS 三选一或组合。
- 完成环境分层与访问隔离。
- 完成 rotation 与审计闭环。
- 完成后台元数据视图与操作约束。

### 8.2 P1（增强）

- 自动轮换编排与异常自愈。
- 密钥风险评分与到期预测。
- 多区域密钥复制与容灾联动。

### 8.3 P2（规模化）

- 跨云统一 Secret 抽象层。
- 细粒度密钥访问策略引擎。
- 安全基线自动巡检与合规报表。

## 九、发布门禁（分层：P0 必须全过）

### 9.1 P0（最小可发布门禁，必须全过）

1. 生产 Secret 不在 DB/.env 明文存储。
2. 后台页面无法显示真实 key。
3. 关键 Secret 轮换演练通过。
4. 审计日志完整可追溯。
5. 越权访问告警与拦截机制生效。

### 9.1.1 量化门禁基线（P0，必须写入 CI 并按 fail-closed 执行）

- 路由锚点可用性：`/api/v1/admin/secrets/metadata`、审批锚点检查通过率 = 100%。
- 明文隔离检查：密钥管理文档与路由中“不可明文”约束检查通过率 = 100%。
- 证据字段完整性：`workflow + job + check + commit_sha + ci_run_id + env + rule_id + severity + owner + generated_at + passed` 完整率 = 100%。
- 轮换抽样完整性：抽样 10 条轮换记录，`rotation_id + actor + rotated_at` 完整率 = 100%（Current 阶段允许 drill 证据替代）。

证据文件绑定（最小集合）：

- 路由锚点：`evidence/GO_YYYYMMDD/secret_key_routes.log`
- 门禁汇总：`evidence/GO_YYYYMMDD/secret_key_gate_summary.json`
- 量化指标：`evidence/GO_YYYYMMDD/secret_key_gate_metrics.json`
- 字段检查：`evidence/GO_YYYYMMDD/secret_key_evidence_field_report.json`
- 轮换抽样：`evidence/GO_YYYYMMDD/secret_rotation_sampling_report.json`

当前状态说明：230 专项 gate 已接入 `.github/workflows/secret-key-gate.yml`，并已并入 `.github/workflows/build.yml` 主流水线；按“主流水线 + 独立 gate”双轨证据强制校验执行。

### 9.2 P1/P2（增强门禁，按阶段收口）

1. `admin/secrets/metadata` 从 Target 升级为 Implemented 后，纳入强制发布门禁。
2. 自动轮换与异常回滚链路落地后，纳入规模化门禁。
3. 多区域密钥复制与一致性验证落地后，纳入跨域门禁。

### 9.3 门禁执行锚点（仓库现有入口）

| 门禁类别 | 执行入口 | 证据落点 |
|---|---|---|
| Secret 路由与审批锚点 | `GET /api/v1/admin/secrets/metadata`、`GET /api/v1/admin/approvals`、`POST /api/v1/admin/approvals/:id/approve` | `evidence/GO_YYYYMMDD/` |
| 轮换抽样与字段复核 | 轮换演练记录（drill 或真实记录） | 采样报告 + 门禁汇总 |

执行说明：若 CI 有同名或等效 Job，以 CI 结果为主证据；本地回归用于复核。门禁不全则 fail-closed。

### 9.4 执行入口（工作流/命令/责任人）

- 代码与测试入口：`cargo test -p traveltrust-api`、`cd frontend && npm run test`。
- 当前 CI 入口：`.github/workflows/build.yml`（主流水线并轨） + `.github/workflows/secret-key-gate.yml`（230 专项门禁）。
- 责任人：`api-backend`（路由与契约）、`admin-security`（密钥治理链路）、`ops-sre`（轮换演练证据）。
- 发布原则：230 门禁失败或证据缺失时，不得将 Secret/Key 链路标记为 `Implemented`。

### 9.5 证据字段规范（发布证据 JSON 最小字段）

Secret/Key 治理相关证据最小字段必须包含：

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

- `170` AI Key 管理依赖 230 的托管与轮换能力。
- `220` 配置中心只管理 Secret 引用，不管理 Secret 明文。
- `230` 是全系统安全底座，保障 AI、RPC、签名、Webhook、KYC 等敏感能力可持续运营。

结论：Secret/Key 管理必须独立成系统，否则后续在生产环境会出现泄露风险、不可审计风险和不可恢复风险。

## 文档同步门禁（与权威层级对齐）

- 冲突优先级：与 `01/03` 冲突时以 `01/03` 为准。
- API/契约变更：新增、删除、改名接口或状态口径变更，必须同步 `04 §3.5` 与 `14`。
- 页面/RBAC 变更：涉及密钥后台菜单、角色动作、轮换审批时，必须同步 `13-1` 与 `70`。
- 数据模型/运维门禁口径变更：必须同步 `120/140` 与 Runbook。
- 文档串联变更：必须同步 **[07-开发流程与顺序](07-开发流程与顺序.md)（§零～§五正文）**、[00-文档索引](00-文档索引.md)；[00-文档体系与阅读串联](00-文档体系与阅读串联.md) 为兼容壳（涉及 CI 关键词如 `82` 时须核对）。

---

文档版本：1.0.3
最后更新：2026-03-08
适用阶段：230-阶段开发（Secret / Key 管理系统）

> 实现状态标签：`Target`（阶段规划文档）
> 证据口径：与代码不一致时，以代码事实为准；进入上线验收前需补 `Implemented` 证据条目。
> Implemented 证据回填路径：`docs/spec/15-多维度文档与技术检查报告.md` 附录〇 + `evidence/GO_YYYYMMDD/`。
