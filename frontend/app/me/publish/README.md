# `/me/publish` · 发布中心 · 代码 SSOT

**阶段：① 本地 · Phase A MVP ACTIVE · L5 + IA 边界 100 已冻结（2026-06-13）**

**设计 SSOT（FROZEN）：** [`PUBLISH-HUB-L5-DESIGN.md`](../../evidence/GO_local_auth_l5/PUBLISH-HUB-L5-DESIGN.md)

**IA 边界 SSOT（ACTIVE / FROZEN · 100）：** [`PUBLISH-HUB-IA-BOUNDARY-SCORE.md`](../../evidence/GO_local_auth_l5/PUBLISH-HUB-IA-BOUNDARY-SCORE.md)

**阶段任务清单（① L5 + ② 测试网）：** [`PUBLISH-HUB-PHASE-TASK-LIST.md`](../../evidence/GO_local_auth_l5/PUBLISH-HUB-PHASE-TASK-LIST.md)

**互指：** [WORKSPACE-DEFINITION-SSOT.v1.md](../../evidence/GO_local_identity_workspace/WORKSPACE-DEFINITION-SSOT.v1.md) · [ACCOUNT-NAV-NAMING-P3.md](../../evidence/GO_local_auth_l5/ACCOUNT-NAV-NAMING-P3.md)

---

## 路由

| 路径 | 组件 |
|------|------|
| `/me/publish` | `PublishHubPageMain.tsx` |

**顶栏：** authL5 · `isAuthL5DarkHeaderPath("/me/publish")`

**机读：** `data-tt-publish-hub="1"` · `data-tt-publish-hub-ui-frozen="1"` · `data-tt-publish-hub-ia-boundary-frozen="1"`

---

## Phase A MVP（PH-A-1～A-8 · ACTIVE）

| 轨 | ① 状态 · API |
|----|-------------|
| trip | ✅ `GET /orders?business_line=trip&hat=traveler` |
| guide | ✅ `GET /me/guide-profile` |
| merchant | ✅ `GET /me/merchant-listings` + archive/delete |
| acquisition | ✅ `GET /me/acquisition-listings` + archive/delete |
| governance | ✅ `GET /governance/proposals?mine=1` |

**社区帖：** 不在发布中心 — 头像下拉 **我的帖子** → `/community/me/posts`

**卡片：** 五轨统一 `PublishHubItemCard`（缩略图 · status badge · 操作列）

---

## ① L5 收口（未完成 · 见任务清单 §1.3）

| ID | 项 |
|----|-----|
| PH-A-9 | 十维审计 + `publishHubL5FullClosure` |
| PH-A-10 | Playwright `e2e/publish-hub-l5.spec.ts` |
| PH-A-11 | a11y + loading/error 段级态 |
| PH-A-12 | listing cover · 社区 post 深链 |
| PH-A-13 | Phase ① ACTIVE 声明 + local gate JSON |

---

## ② 测试网（Not Started · 见任务清单 §②）

`PH-B-1`～`PH-B-10` · 须 **G-1/G-2** · 目标 `smoke-publish-hub-staging.sh`

---

## 验收

**MVP 绿集（当前可跑）：**

```bash
bash scripts/dev/smoke-publish-hub-local.sh   # 仓库根
```

**机读：**

```bash
cd frontend
npm run test:i18n:ci
npm run test -- publishHubPage publishHubUiFreeze publishHubGuideModel publishHubItemModel publishHubPhaseTaskList accountNavNamingP3 headerUserMenuNavModel --run
```
