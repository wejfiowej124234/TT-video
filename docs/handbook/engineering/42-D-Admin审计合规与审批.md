# 42-D · Admin 审计、合规与审批导读

**Version:** 1.0.10 · **最后更新：** 2026-04-29  
**受众**：后端 / 安全 / 合规接口人（改 **`admin_audit_logs`**、**`admin_approval_requests`**、高危写审计、**Vault 导出**、审批元数据时）  
**状态**：现行  
**与 spec 关系**：**partial** — 承接 **[70](../../spec/70-管理员系统开发文档.md)** **§一点五（Vault SOP）**、**§四**（硬约束）、**§七**（审批模板）、**§九**（验收读法）的工程导读；**不替代** **[04](../../spec/04-后端与API.md)**、**[93](../../spec/93-全站功能验证矩阵-域别回归清单.md)** 表体；**DSAR / policy** 仍以 **70 §六 6.4**、**[500](../../spec/500-阶段法律与合规日志系统.md)**、**[530](../../spec/530-阶段数据权限隔离系统.md)** 等为 SSOT。  
**来源**：[70](../../spec/70-管理员系统开发文档.md) · [120](../../spec/120-阶段开发观测告警日志与审计链路.md)（观测互指）· [360](../../spec/360-阶段审批流系统-Approval-Workflow.md) · **[04](../../spec/04-后端与API.md)** **P5-2** 相关窗  
**与 spec 覆盖关系**：partial  

> **SSOT（必读）**：**engineering 仅为**（**Explanation / How-to**）**导读**；**不替代** **spec**。**HTTP 机读**真源 **[04 §3.4](../../spec/04-后端与API.md)**；**域矩阵**真源 **[93](../../spec/93-全站功能验证矩阵-域别回归清单.md)**；**链上 ABI 与对齐叙述**真源 **[14](../../spec/14-合约-API-ABI-前后端对齐.md)** + **`contracts/`** + **`check-55-s13`** 等脚本；**实现**真源 **`crates/`·`contracts/`·`frontend/`** 与当次 **PR** 可复核产物（含**同 PR 脚本闭包**）。本文件仅为导读，**不**形成第二套机读 SSOT（与 **[手册 00 §3](../00-手册总览与编制规范.md#hb-00-master-table)**、**[engineering/README](./README.md)**、磁盘 **`NN`** 主序 **[三处对拍](./02-生产级文档约束与合入门禁.md#hb-prod-doc-triple-sync)**）。

> **SSOT 边界（防误用）**：本文为 **70** 审计 / Vault / 审批 的工程导读；**DSAR、合规长表**仍以 **70 §六**、**[500](../../spec/500-阶段法律与合规日志系统.md)**、**[530](../../spec/530-阶段数据权限隔离系统.md)** 等为准。**`| METHOD | /path |`** 以 **[04 §3.4](../../spec/04-后端与API.md)** 为准；**矩阵**以 **[93](../../spec/93-全站功能验证矩阵-域别回归清单.md)** 为准。**禁止**以本文替代 **70 / 04 / 93** 或仅凭本文删 **`docs` 下 `spec` 子树**（程序见 **[08 §3](./08-文档与spec迁移台账.md#mig-2-matrix)** + **[09 §3](./09-文档迁移覆盖审计报告.md#audit-coverage)**（**同 PR** 对拍）+ **[08 §2](./08-文档与spec迁移台账.md#mig-delete-policy)**、**[SPEC-MIGRATION-STATUS](../corpus/SPEC-MIGRATION-STATUS.md)**、**[98 §2](../../spec/98-以代码为真源的文档体系与旧文档替代路线图.md)**）。

**先读**：[40-D-Admin机制](./40-D-Admin机制.md) · [41-D-索引与对账导读](./41-D-索引与对账导读.md) · [06-工程模块技术文档编制契约](./06-工程模块技术文档编制契约与验证闭环.md)

---

<a id="d42-1-scope"></a>

## 1. 模块职责（L1）

- **解决**：把 **「高危写须审计 / 审批四段式 / Vault 离线导出只读 / 反自审」** 落实为**可执行的合入与排错路径**（链到 **04**、**迁移**、**单测**），避免只在 **70** 目标态表格中「已写即已做」的误读。  
- **边界**：**索引器 health / reconcile HTTP** 的逐步 curl 以 **[41-D](./41-D-索引与对账导读.md)** 为准；**本篇**只写与 **审计行、审批单、导出签名** 交叉的入口。

---

<a id="d42-2-mechanism"></a>

## 2. 核心机制（L2）

1. **审计行**：**`admin_audit_logs`** 记录 **who/when/action/resource/request_id/result** 等；高危写路径须在事务内写入或硬失败（语义见 **70 §四**、**§九**）。  
2. **审批单**：**`admin_approval_requests`** 承载 **角色变更** 等已落地基线；**`No Self-Approval` / `Expire and Revalidate`** 等与 **70 §七**、**[360](../../spec/360-阶段审批流系统-Approval-Workflow.md)** 目标态对齐——**实现以 `crates/api/src/db/admin/approvals.rs` 与路由测试为准**。  
3. **Vault 离线导出（P5-2-C3）**：**`GET …/admin/region-vault/forwarded-events/export`** 等契约在 **04**；**逐步命令**以 **70 §一点五** + **`scripts/README`** 为真源；仓库提供 **`bash scripts/vault-forwarded-export-fetch.sh`**（及 **`.ps1`**）组包。  
4. **错误体**：Admin 与业务 API 共用 **`err_key`** 形态（**70** 与 **04** 互指）；**429** 限流键名见 **04** 散文。

**与 [70](../../spec/70-管理员系统开发文档.md) 的显式回读锚（≥5）**：文首 **读前摘要** · **§一点五**（Vault SOP）· **§四**（硬约束）· **§七**（审批）· **§九**（验收）— 均为本文合规章源，**不**以 handbook 句覆盖 **70** 证据表。

---

<a id="d42-3-model"></a>

## 3. 数据与状态模型（L2～L3）

- **`admin_audit_logs`** / **`admin_approval_requests`**：最小必填字段与 **append-only** 约束见 **70 §6.4**；**不得**在本篇复述宽表。  
- **合规占位（DSAR / policy_bindings）**：**70** 已列字段目标；**实现未闭环前**不得标 **Implemented**（见 **70 §9.2**）。  
- **导出侧车文件**：**`.export.sha256`**、可选 **Ed25519** 头；校验 **`bash scripts/verify-reconcile-export-ed25519.sh`**（参数见 **Runbook §2.55**、**70 §一点五**）。

---

<a id="d42-4-relations"></a>

## 4. 系统关系（强制）

| 真源 | 与本篇关系 |
|------|------------|
| **[70](../../spec/70-管理员系统开发文档.md)** **§一点五、§四、§七、§九** | 产品 SOP 与门禁读法（**≥5** 锚点已分散于上节与 **§9**） |
| **[04](../../spec/04-后端与API.md)** | **Admin** 导出、审批 **POST**、**audit-logs** **GET** 的契约 |
| **[93](../../spec/93-全站功能验证矩阵-域别回归清单.md)** **§4.5** | **D-ADM-*** 与 Admin 读路径抽检（**不**抄矩阵） |
| **`crates/api/migrations/*admin_audit*`**、**`*admin_approval*`** | 表结构真源 |
| **`crates/api/src/routes/admin/tests.rs`** | **`approval_requires_super_admin_role`** 等审批与审计单测 |
| **[ops/RUNBOOK](../../../ops/RUNBOOK.md)** **§2.55** | Vault / reconcile 运维互指 |

---

<a id="d42-5-usage"></a>

## 5. 工程使用方式

- **改审批语义**：改 **`db/admin/approvals.rs`** + **04** 相关行 + 补 **`admin/tests.rs`** + **93** 若行为可见于矩阵。  
- **拉 Vault 离线包**：配置 **`ADMIN_BEARER_TOKEN`**（**不含** `Bearer ` 前缀）、可选 **`API_BASE_URL`**，执行 **`bash scripts/vault-forwarded-export-fetch.sh`**（详见 **`scripts/README`**）。  
- **验签**：若响应头含 **Ed25519** 指纹，按 **70 §一点五** 步 6 调用 **`bash scripts/verify-reconcile-export-ed25519.sh`**。

---

<a id="d42-6-verify"></a>

## 6. 工程验证（强制）

```bash
bash scripts/run-check-04-routes.sh
```

```bash
cargo test -p traveltrust-api approval_requires_super_admin_role
```

```bash
# 可选：须有效 Admin token 与可达 API（见 scripts/README · Vault 导出）
# bash scripts/vault-forwarded-export-fetch.sh
```

```bash
bash scripts/check-handbook-engineering-content.sh
```

**§2b 证据（70 簇）**：[EVIDENCE-70-admin-cluster-verified.md](./EVIDENCE-70-admin-cluster-verified.md#ev70-v1)（**[09 §2b.1](./09-文档迁移覆盖审计报告.md#audit-verified-evidence-70)** **V-1～V-3**；**[08 §3](./08-文档与spec迁移台账.md#mig-2-matrix)** **spec/70** 行 **覆盖度 full**；与 **40-D**/**41-D** **§2b** **同簇**）

**Reviewed-by:** @ghost 2026-04-28（默认 **CODEOWNERS** `* @ghost`；真人 Owner 替换规则见证据包 **§V-3**）

---

<a id="d42-7-debug"></a>

## 7. 调试与排错（强制）

| 现象 | 优先查看 |
|------|----------|
| **审批 403** | 是否 **`super_admin`**；**`approval_requires_super_admin_role`** 单测与 **04** 路由。 |
| **审计未写入但写成功** | **70 §四**「审计失败硬失败」目标态 vs 当前实现；查 **`admin_audit_logs`** 写入路径。 |
| **Vault 脚本失败** | **`ADMIN_BEARER_TOKEN`**；**04** 导出路径是否 **404**；**Runbook §2.55**。 |
| **Ed25519 校验失败** | **OpenSSL 3+**；**`GET /meta`** 中公钥字段与脚本参数顺序（**70 §一点五**）。 |

---

<a id="d42-8-limits"></a>

## 8. 边界与限制

- **不**把 **500/530** 全量合规叙事迁入本篇；只提供 **70** 锚点与 **合入路径**。  
- **不**用 **`INTERNAL_API_SECRET`** 完成 **Vault 导出**（**Admin Bearer** 专用，见 **70**）。  
- **簇级**：与 **40-D / 41-D** 组成 **70** 工程三篇；**spec/70** **不删除**。

---

<a id="d42-9-refs"></a>

## 9. 参考（强制，只引用）

- [70](../../spec/70-管理员系统开发文档.md)（**§一点五**、**§四**、**§七**、**§九**、**§6.4**）· [04](../../spec/04-后端与API.md) · [93](../../spec/93-全站功能验证矩阵-域别回归清单.md) · [120](../../spec/120-阶段开发观测告警日志与审计链路.md) · [360](../../spec/360-阶段审批流系统-Approval-Workflow.md) · [500](../../spec/500-阶段法律与合规日志系统.md) · [530](../../spec/530-阶段数据权限隔离系统.md) · [ops/RUNBOOK](../../../ops/RUNBOOK.md) · [scripts/README](../../../scripts/README.md) · [40-D](./40-D-Admin机制.md) · [41-D](./41-D-索引与对账导读.md)

---

## 变更记录

| Version | 日期 | 摘要 |
|---------|------|------|
| 1.0.10 | 2026-04-29 | **§2b**：补 **08 §3**/**09 §2b.1** 对拍句 + **#ev70-v1**（与 **EVIDENCE-70** **V-1** 台账段互指）。 |
| 1.0.9 | 2026-04-29 | **SSOT 边界**：删 **spec** 程序句与 **08 §3**/**09 §3**（**同 PR**）/**08 §2**/**STATUS**/**98 §2** 全文对齐（与 **engineering/README**/**spec/00 读前** 同源）。 |
| 1.0.8 | 2026-04-29 | 文首 **SSOT（必读）** 与 **08/README** 对拍：补 **14** + **`contracts/`** + **`check-55-s13`** 等脚本句（无正文语义变更）。 |
| 1.0.7 | 2026-04-29 | 文首 **SSOT（必读）** 与 **engineering/README** 同形（**仅为导读**；**不替代 spec**；**PR** 闭包链）。 |
| 1.0.6 | 2026-04-29 | 文首 **SSOT（必读）** 与 **手册 00 §3**/**README**/**三处对拍** 同形（**04 §3.4**/**93**/代码+门禁）。 |
| 1.0.4 | 2026-04-29 | 文首 **SSOT（必读）** 标准句。 |
| 1.0.3 | 2026-04-29 | 文首 **SSOT 边界** 引（**70/500/530/04/93**、**删 spec** 程序）。 |
| 1.0.2 | 2026-04-28 | **下一篇** 链 **50-链上与ABI导读**（**14** 簇承接）。 |
| 1.0.1 | 2026-04-28 | **§2b** 证据链 + **Reviewed-by**（**V-3**）。 |
| 1.0.0 | 2026-04-28 | 首版：**70 簇** 审计 / 审批 / Vault 导读。 |

---

**上一篇**：[41-D-索引与对账导读](./41-D-索引与对账导读.md) · **下一篇**：[50-链上与ABI导读](./50-链上与ABI导读.md) · **[手册 00 §3](../00-手册总览与编制规范.md#hb-00-master-table)**
