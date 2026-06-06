# Admin 工作台 · ① 本地收口证据（GO_local_admin_workspace_closure）

**阶段口径：** **① 本地** → **② 测试网** → **③ 公网/生产**

**诚实边界：** ① 机读绿集 + 手跑 smoke **≠** ② staging 六角色矩阵 **≠** ③ Production GO。

## 代码 SSOT（优先读）

| 文档 | 用途 |
|------|------|
| [`frontend/app/admin/README.md`](../../app/admin/README.md) | **71 路由** · L5 · SWR · smoke 命令 |
| [`ADMIN-L5-HOME-SYSTEM-OVERVIEW-CODE-SSOT.md`](ADMIN-L5-HOME-SYSTEM-OVERVIEW-CODE-SSOT.md) | 系统概况数据链 |

## Spec / Runbook

| 文档 | 用途 |
|------|------|
| [`docs/spec/70-管理员系统开发文档.md`](../../../docs/spec/70-管理员系统开发文档.md) **§3.0.2** | 首页 · L5 confirm · SWR |
| [`docs/spec/04-后端与API.md`](../../../docs/spec/04-后端与API.md) **§3.5** | Admin HTTP 契约表 |
| [`docs/spec/13-1-UI产品级SSOT与页面规范.md`](../../../docs/spec/13-1-UI产品级SSOT与页面规范.md) **表 2-补充** | 各 `/admin/*` Partial 能力 |
| [`docs/dev-local-smoke-baseline.md`](../../../docs/dev-local-smoke-baseline.md) **§11** | 本地烟测 |
| [`docs/runbook/ADM-U02-admin-permissions-2fa-approval.md`](../../../docs/runbook/ADM-U02-admin-permissions-2fa-approval.md) | RBAC · 2FA · 审批链 |

## 本目录证据链

| 文件 | 用途 |
|------|------|
| [`ADMIN-L5-AUDIT-TASKS.md`](ADMIN-L5-AUDIT-TASKS.md) | ① 已闭 API/RBAC/门闸勾选 |
| [`ADMIN-L5-PHASE-GAP-TASK-LIST.md`](ADMIN-L5-PHASE-GAP-TASK-LIST.md) | ①②③ 缺口 · M-01～M-03 |
| [`ADMIN-L5-FULL-AUDIT-BACKLOG.md`](ADMIN-L5-FULL-AUDIT-BACKLOG.md) | UX/产品分批 backlog |
| [`ADMIN-L5-PHASE1-VIS-CLOSURE.md`](ADMIN-L5-PHASE1-VIS-CLOSURE.md) | 目视收口 · SOV 交叉引用 |
| [`ADMIN-L5-HOME-SCREENSHOT-AUDIT-20260604.md`](ADMIN-L5-HOME-SCREENSHOT-AUDIT-20260604.md) | 截图审计 Vis-P0～P2 |
| [`ADM-U02-PHASE1-CLOSURE.md`](ADM-U02-PHASE1-CLOSURE.md) | ADM-U02 **①** 收口 |
| [`ADM-U02-PHASE2-CLOSURE.md`](ADM-U02-PHASE2-CLOSURE.md) | ADM-U02 **②** Not Started |

## ① 验收（本地）

```bash
bash scripts/dev/verify-admin-audit-closure.sh
bash scripts/dev/run-admin-l5-green.sh
bash scripts/dev/smoke-admin-rbac-matrix-local.sh    # M-01
bash scripts/dev/smoke-admin-adm-u02-local.sh        # M-02 · TT_ADM_U02_LOCAL: PASS
bash scripts/dev/smoke-admin-pages-local.sh          # M-03
```
