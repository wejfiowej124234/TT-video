# 发布中心 `/me/publish` · L5 十维企业审计（2026-06-13 · IA 边界满分）

**阶段口径：** ① 本地 ACTIVE · ②③ 见 [PUBLISH-HUB-PHASE-TASK-LIST.md](./PUBLISH-HUB-PHASE-TASK-LIST.md)

**边界评分 SSOT：** [PUBLISH-HUB-IA-BOUNDARY-SCORE.md](./PUBLISH-HUB-IA-BOUNDARY-SCORE.md)

---

## 十维矩阵

| # | 维度 | 结论 | 证据 |
|---|------|------|------|
| 1 | 业务逻辑 | ✅ | 五轨各读 owner API/BFF；不复制工作台状态机 |
| 2 | IA | ✅ | 发布中心 / 我的订单 / 我的帖子 三分 · 社区不在发布中心 |
| 3 | UI L5 | ✅ | Auth L5 壳 · `publishHubL5` · 统一卡片 |
| 4 | UX | ✅ | 双向边界 copy · 汇总 BFF · 身份默认筛选 |
| 5 | i18n | ✅ | `publish_hub_*` · `orders_list_publish_hub_*` zh/en |
| 6 | a11y | ✅ | tablist 键盘 · ≥44px CTA · 段级态 |
| 7 | 测试 | ✅ | contract + smoke 窄集 + PW 可选 |
| 8 | 文档 | ✅ | 五轨 SSOT · IA 评分 · ACTIVE 声明 |
| 9 | 安全 | ✅ | session owner 过滤 |
| 10 | 阶段诚实 | ✅ | ① ACTIVE ≠ ② GO |

---

## 已闭发现（PH-L5-IA-* · 2026-06-13）

| ID | 处置 |
|----|------|
| **IA-01** | 社区帖仅头像下拉 `/community/me/posts` |
| **IA-02** | `/orders` 反向指发布中心 |
| **IA-03** | QuickLinks `header_myOrders` 对齐 |
| **IA-04** | 商家工作台 ↔ 发布中心 merchant 轨 |
| **IA-05** | `?identity=` + 单槽默认筛选 |
| **IA-06** | 文档六轨漂移清零 |
| **P2-02** | `GET /me/publish-summary` BFF ① |

---

## ② 留闸

| 项 | 阶段 |
|----|------|
| traveltrust-api publish-summary 与 BFF staging 对拍 | ② PH-B-1 |
| 顶栏 identity switcher 全量 | ② PH-B-2 |
| staging 五轨 CRUD | ② PH-B-3 |

**Maintainer：** Sebastian Ward · ① 本地
