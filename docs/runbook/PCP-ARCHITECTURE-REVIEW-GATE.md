# PCP Architecture Review Gate · 架构变更门闸

**Status:** **ENFORCED** while `TT_PCP_ARCHITECTURE: FROZEN`  
**Parent:** [PCP-ARCHITECTURE-FINAL.md](PCP-ARCHITECTURE-FINAL.md) · [TT-PUBLIC-CONTENT-PLATFORM.md](TT-PUBLIC-CONTENT-PLATFORM.md)

---

## 1. 写死纪律

`TT_PCP_ARCHITECTURE: FROZEN` **不是文档装饰**。凡触及下列范围，**禁止**直接改代码或 migration：

| 范围 | 示例路径 / 概念 |
|------|-----------------|
| **Governance** | Governed View 定义 · `display_status` / `display_surfaces` SQL · Public Ops 写规则 |
| **Builder** | `crates/api/src/pcp/*` · Builder Contract · catalog 读路径 |
| **Capability** | DDG / OCS / SOPCP / OCIP 在 PCP 层的归属变更 |
| **Public API Pipeline** | 公众读 API 绕过 Governed View · 新 public catalog 路由 |
| **Public Content Center** | Admin Public Ops 与 PCP 写/读边界变更 |

**唯一合法流程：**

```text
Architecture Review  →  Approve  →  Implementation
```

无 **Approve** 记录的 PR / 部署 = **违规**，不得合入 main。

---

## 2. Architecture Review 触发条件

满足 **任一** 即须开 Review（即使「小改动」）：

- 新增或修改 `governed_*_v1` migration
- 新增或修改 `pcp/*_builder.rs`
- 修改 `db/*_catalog.rs` 公众读 SQL
- 修改 Public Ops 实体与 Governed View 的映射
- 修改 [PCP-PLATFORM-CAPABILITY-MATRIX.md](PCP-PLATFORM-CAPABILITY-MATRIX.md) 中的 owns/consumes 关系
- 修改 Phase 1 已签收验证链所覆盖的 API 契约

**不触发 Review（仍走普通 PR）：**

- Production Readiness 项（Security · Monitoring · Deploy · 见 [TT-PRODUCTION-READINESS-PROGRAM.md](TT-PRODUCTION-READINESS-PROGRAM.md)）
- Platform A（Identity · Wallet · Settlement · RBAC）非 PCP 路径
- 纯 bugfix **且** 不改变 Governed View 语义与 Builder Contract（须 Reviewer 书面确认）

---

## 3. Review 包（最小）

| # | 交付物 |
|---|--------|
| 1 | **变更说明** — 为何不能等 Phase 2 / Production Readiness 后 |
| 2 | **架构影响** — 影响哪一域 · 哪一层 · 是否破坏 7/7 ALIGNED |
| 3 | **回滚计划** — migration down / feature flag |
| 4 | **验证计划** — 须重跑 `validate-pcp-phase1-freeze-regression.cjs` 或等价链 |
| 5 | **Owner Approve** — 书面「Architecture Review APPROVED」 |

模板可附在 PR 描述或 `evidence/GO_public_content_platform/AR-<stamp>/` 目录。

---

## 4. Approve 后 Implementation

- 仍须：migration 新 ID · Staging 部署 · evidence JSON · 更新 [PCP-MIGRATION-HISTORY.md](PCP-MIGRATION-HISTORY.md) **一行**
- **禁止** 在 Implementation 中扩大 scope（顺带 SearchBuilder 等 Phase 2 项）
- 合并前：**Owner** 确认验证链 exit 0

---

## 5. 与主线关系

| 程序 | 关系 |
|------|------|
| **Production Readiness Program** | **当前主线** — 与 PCP Review **并行独立** |
| **Phase 2（SearchBuilder 等）** | **NOT_STARTED** — 须 Architecture Review **+** Owner Phase 2  scope **+** Production Readiness 进度评估 |
| **Architecture Closure 四件套** | Review 须引用；冲突以四件套为准 |

---

## 6. 违规处置

- CI / 人工审计发现无 Approve 的 PCP 架构变更 → **revert 或 block merge**
- 已部署 Staging → 回滚镜像 + 重跑 freeze regression
- 登记 defect：`classification=ARCHITECTURE_DRIFT` · Owner 签收

**FROZEN 的意义 = 流程强制执行，不是冻结文档版本号。**
