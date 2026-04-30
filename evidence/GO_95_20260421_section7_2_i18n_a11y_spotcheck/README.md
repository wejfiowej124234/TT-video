# GO_95 · §7.2 i18n/a11y（**150** / **13-1** 抽检 · §7.2 扇面）· 2026-04-21

## 规范对读（抽检口径）

| 文档 | 与本批关系 |
|------|------------|
| **[150-阶段开发国际化与可访问性](../../docs/spec/150-阶段开发国际化与可访问性.md)** | **§三** i18n 最小要求 / **§二** 目标；工程门禁见 **`frontend/package.json`** **`test:i18n:ci`**、**`Build/frontend`** 叙事（**150 §2.1** 表）。 |
| **[13-1-UI产品级SSOT与页面规范](../../docs/spec/13-1-UI产品级SSOT与页面规范.md)** | 浅色页 **AA / 触控（B-107）** 与 **05/22** 对齐；路由真值与 **`run-check-04-routes`** 内 **`check-13-1-table1-routes-vs-app`** 同链。 |
| **[37-国际化与可访问性落地清单](../../docs/spec/37-国际化与可访问性落地清单.md)** | 落地清单；代码侧 **`communityA11yFocus.ts`** 文件头互指 **37 §3.1**。 |

## i18n（机读门禁）

- **`frontend/scripts/check-i18n-coverage.mjs`**（**`npm run test:i18n:ci`**）：关键前缀 **`common_` / `orders_` / `disputes_` / `order_` / `escrow_`** 与 **5 条 key routes**（**login / place_order / orders / disputes / order_detail**）**`passed: true`**。  
- **产物**：**`frontend/.i18n-coverage.json`**（**`[i18n-gate] passed.`** 登记日）。

## a11y（§7.2 相关组件扇面 · 触控 + 焦点）

- **`frontend/lib/communityA11yFocus.ts`**：**`communityShellTabFocus`**/**`communityCyanPillFocus`** 等 **`focus-visible:ring-*`** + **`ring-offset-slate-950`**（与 **`app/community/layout`** 深底壳一致）。  
- **触控目标**：**`frontend/components/community/*.tsx`** 与 **`frontend/components/market/*.tsx`** 内广泛 **`min-h-[44px]`**（**Feed 筛选条 / 卡片动作 / 市场卡** 等与 **13-1 B-107** 同口径抽检）。  
- **读屏 / 实时区域**：**`CommunityFeedFilterBar.tsx`** **`feedError`**：**`role="alert"`** **`aria-live="polite"`**（与 **§7.2 Feed degraded** 证据包互证）；**`CommunityMePostsShowcaseThumbGrid.tsx`** **`aria-label`** / **`aria-hidden`** 装饰图标。

## 13-1 路由契约（仓库根门禁）

```bash
bash scripts/run-check-04-routes.sh
# exit 0（含 check-13-1-table1-routes-vs-app / check-13-1-routes-covered-by-04-frontend-table）
```

## i18n 命令（登记日）

```bash
cd frontend && npm run test:i18n:ci
# [i18n-gate] passed.
```

## 边界

**不**替代 **150** 全文终验 / **`test:a11y:ci`** 全站 Lighthouse 阻断语义；**不**替代 **37** 全量页面矩阵；**不**替代 **93**/**E2E** 人工回归。
