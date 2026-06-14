# 发布中心 `/me/publish` · ① L5 ACTIVE 收口（2026-06-13 · IA 边界 100）

**阶段：① 本地** — 五轨功能 inventory + IA 边界满分 + 机读绿；**不**表示 ② 测试网 / ③ 生产 GO。

**设计 SSOT（FROZEN）：** [PUBLISH-HUB-L5-DESIGN.md](./PUBLISH-HUB-L5-DESIGN.md)

**IA 评分：** [PUBLISH-HUB-IA-BOUNDARY-SCORE.md](./PUBLISH-HUB-IA-BOUNDARY-SCORE.md) · **100 / 100**

**任务清单：** [PUBLISH-HUB-PHASE-TASK-LIST.md](./PUBLISH-HUB-PHASE-TASK-LIST.md)

**企业审计：** [PUBLISH-HUB-L5-AUDIT.md](./PUBLISH-HUB-L5-AUDIT.md)

**代码真源：** `frontend/app/me/publish/` · `frontend/lib/me/publishHub*.ts` · `frontend/components/me/publish/`

---

## 收口结论（ACTIVE）

| 项 | 状态 |
|----|------|
| **五轨功能 MVP** | trip · guide · merchant · acquisition · governance |
| **UI 冻结** | `data-tt-publish-hub-ui-frozen="1"` · `data-tt-ui-frozen=publish-hub-l5-20260612` |
| **L5 探针** | `data-tt-publish-hub-l5-closure-probe=publish-hub-full-v1` |
| **统一卡片** | `PublishHubItemCard` + `PublishHubItemThumb` |
| **「全部」智能隐藏** | `publishHubVisibleRailsModel` — 无内容/未解锁轨不堆屏 |
| **段级 loading/error** | `app/me/publish/loading.tsx` · `error.tsx` |
| **a11y** | tablist Arrow 键 · 卡片 `aria-labelledby` · CTA ≥44px |
| **社区帖 L5 边界** | 不在发布中心；头像下拉 **我的帖子** → `/community/me/posts` |
| **订单↔发布中心互指** | `/orders` 页眉边界 copy + `/me/publish` 副标题 |
| **汇总 BFF** | `GET /api/v1/me/publish-summary`（Next BFF ①） |
| **身份默认筛选** | `?identity=` · 单槽 `publishHubDefaultFilterFromUnlockedSlots` |
| **收口日** | **2026-06-13** |

**维护期纪律：** 仅 bugfix · 数据链/i18n/a11y/轨内容；**禁止**页面结构 / layout token 回流。

**诚实边界：** ① IA 100 **≠** ② traveltrust-api publish-summary 真源 **≠** ③ Production GO。

---

## 机读验收

```bash
bash scripts/dev/smoke-publish-hub-local.sh
```

末行：`TT_PUBLISH_HUB_SMOKE: OK phase=① six-rails+item-cards+summary+l5-closure`

**L5 full closure vitest：**

```bash
cd frontend && npm run test -- publishHubL5FullClosure publishHubUiFreeze publishHubVisibleRailsModel --run
```

**可选 Playwright：**

```bash
PLAYWRIGHT_PUBLISH_HUB=1 bash scripts/dev/smoke-publish-hub-local.sh
```

---

## 互指

| 读者 | 文档 |
|------|------|
| 机读 gate | [publish-hub-l5-local-gate.v1.json](./publish-hub-l5-local-gate.v1.json) |
| ② 任务 | [PUBLISH-HUB-PHASE-TASK-LIST.md §②](./PUBLISH-HUB-PHASE-TASK-LIST.md) |
| 多重身份 Hub | [ME-IDENTITIES-UI-FREEZE.md](./ME-IDENTITIES-UI-FREEZE.md) |
| Agent | `AGENTS.md` |

**Maintainer：** Sebastian Ward（塞巴斯蒂安·沃德）· ① 本地
