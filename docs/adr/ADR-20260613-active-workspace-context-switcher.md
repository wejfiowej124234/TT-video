# ADR-20260613 · Active Workspace Context Switcher

**Status:** **accepted**（2026-06-12 · Owner Sebastian Ward · ① 本地 Sprint 1A/1B 已落地）

**阶段：** ② 测试网 staging 回归 · **不** 宣称 ③ Production GO

**Deciders:** Product / Engineering (Sebastian Ward)

**Related:** [ACCOUNT-OPERATING-MODEL-UX-WAVE1-SPRINT.md](../../frontend/evidence/GO_local_auth_l5/ACCOUNT-OPERATING-MODEL-UX-WAVE1-SPRINT.md) · [WORKSPACE-DEFINITION-SSOT.v1.md](../../frontend/evidence/GO_local_identity_workspace/WORKSPACE-DEFINITION-SSOT.v1.md) · PH-B-2 · P3-1～P3-4

---

## Context

① Wave 0 已冻结 IA（发布中心 / 订单 / 帖子三分）并落地 copy 优化，但 **多 operator 槽** 用户仍缺少 **全局经营上下文**：

- 发布中心 `?identity=` 与顶栏、工作台 **无三向同步**
- 设置 Hub 工作台捷径与 `/me/identities` **双主入口**
- 汇总条 ① 来自 Next BFF，② 需 api 真源（PH-B-1）

[IDENTITY-MULTI-SLOT-NAMING-L5-UPGRADE-PLAN](../../frontend/evidence/GO_local_auth_l5/IDENTITY-MULTI-SLOT-NAMING-L5-UPGRADE-PLAN.md) 将顶栏 switcher 标为 P3 OUT；MOIS-001 将其升为 P0。**本 ADR 仅覆盖 Publish Hub + 顶栏 UX 轨**，不实施 MOIS 全量 DB 迁移。

---

## Decision

1. 引入 **Workspace Context** 枚举：
   - `account` — 跨身份 aggregate（发布中心默认「全部」）
   - `guide` | `merchant` | `region_steward` | `acquisition` — 单 operator 槽
2. **持久化：** `localStorage` key `tt_active_workspace_context_v1`（`lib/header/activeWorkspaceContext.ts`）
3. **顶栏 UI：** authL5 用户菜单上方或 profile strip 下 **Context 下拉**（仅 active/pending 槽 + Account 总览）
4. **同步规则：**
   - Context → `/me/publish?identity=` + 默认 filter 轨
   - 工作台入口（Hub CTA · 设置捷径 · 发布中心深链）→ **当前 context** 对应 workbench
   - URL `?identity=` **显式存在时覆盖** context（deep link 赢）
5. **HTTP（② 可选增强）：** `X-TravelTrust-Workspace-Context` on mutating API；① 不强制
6. **Freeze 例外：** 修订 [HEADER-UTILITY-MENU-L5-FREEZE.md](../../frontend/evidence/GO_local_auth_l5/HEADER-UTILITY-MENU-L5-FREEZE.md) §后续变更边界 — 允许 Context 控件；**禁止**恢复 Console 白盒菜单

---

## Consequences

**Positive**

- 消除「发布中心筛 A、工作台却是 B」认知冲突
- PH-B-2 与 Wave 0 W0-4 单槽默认筛选 **统一产品叙事**
- 为 MOIS-001 Workspace Context _header 铺路

**Negative / risks**

- 顶栏 chrome 复杂度 ↑ · 须 a11y 复审
- localStorage 与 SSR 首屏不一致 → 需 `useSyncExternalStore` 或 cookie 镜像（② 选型）
- 与 MOIS 全量 `operator_slot_id` 归因 **可能二次迁移** — 本 ADR scope **仅 UI context**

---

## Compliance

| 检查 | 要求 |
|------|------|
| 五主路由 UI | **不**改 |
| 发布中心 IA 冻结 | **不**增第六轨 / 社区回流 |
| ① 假完成 | **禁止** 在 G-1/G-2 前 merge switcher 并宣称 ② GO |
| 机读 | `headerUserMenuNavModel` · `publishHubIdentityDefaultFilter` · `accountOperatingModelUxWave1` 绿 |

---

## Acceptance（W1-A1 done）

- [x] Owner 将本文 Status 改为 **accepted**（2026-06-12）
- [x] HEADER-UTILITY freeze 互指同批更新（Workspace Context switcher 例外）
- [x] `IDENTITY-MULTI-SLOT-NAMING-L5-UPGRADE-PLAN` P3-1～P3-4 标 **① in progress**
