# HUMAN-UAT · Admin Inbox Focus Product Baseline

**Stamp:** `20260730T124928Z`  
**Role:** Owner / Maintainer Admin  
**Env:** Local（本 policy 树）· Staging/Prod 仅在 tip 已含本 policy 后勾选

## 前置

- [ ] Runtime Data Closure PASS 已引用（`20260730T122703Z`）
- [ ] FE tip 仍为 `6929606a…` **或** Owner 已授权含本 policy 的新 tip（本包禁止自行 bake）
- [ ] CSS Baseline 仍为 `38ee6c50…`

## 截图清单（信息架构）

| # | 断言 | Local | Staging* | Prod* |
|---|------|-------|----------|-------|
| 1 | 首页首屏主列以 **收件箱/待办** 起头（非系统概况大卡） | ☐ | ☐ | ☐ |
| 2 | DOM/视觉顺序：**InboxStrip → SystemOverview** | ☐ | ☐ | ☐ |
| 3 | `data-tt-admin-home-inbox-focus="1"` 且 `data-tt-admin-home-focus-inbox-first="1"` | ☐ | ☐ | ☐ |
| 4 | **pending=0** 时仍为 Inbox Focus（不退回 warm「概况优先」） | ☐ | ☐ | ☐ |
| 5 | 系统概况 **默认折叠**（辅助） | ☐ | ☐ | ☐ |
| 6 | 域健康 / KPI / 模块墙为辅助折叠，不抢首屏 | ☐ | ☐ | ☐ |
| 7 | 运营动作入口仍在收件箱条内可达 | ☐ | ☐ | ☐ |
| 8 | 无 API/权限/模型行为变化（仅布局/展示优先级） | ☐ | ☐ | ☐ |

\* Staging/Prod：须 tip 已部署本 UX policy；本包 tip pin = UNCHANGED。

## Owner Sign-off（可选 · 截图后）

| 项 | 值 |
|----|-----|
| Date (UTC) | |
| Env checked | Local / Staging / Prod |
| Screenshots path | `evidence/.../shots/`（Owner 自存） |
| Verdict | PASS / FAIL |
| Notes | |

**① PASS ≠ ② Staging GO ≠ ③ Production GO**
