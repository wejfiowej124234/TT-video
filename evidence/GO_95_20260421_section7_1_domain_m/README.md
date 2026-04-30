# GO_95 · §7.1 域 M（静态 / 合规）审计证据 · 2026-04-21

## 前端路由 ↔ **04 §3.4**

| 路径 | 实现文件 | 备注 |
|------|----------|------|
| **`/help`** | **`frontend/app/help/page.tsx`** | **51-H2** / **51-O-40** 注释；FAQ **`details`** + 内链 **`/pay`**、**`/orders`**、**`/staking`**、**`/governance/fee-routes`** 等；**`ProductCrossNav`**。 |
| **`/privacy`** | **`frontend/app/privacy/page.tsx`** | **08-4** 第 3 章口径注释；链 **`/`**、**`/terms`**。 |
| **`/terms`** | **`frontend/app/terms/page.tsx`** | **08-4** 第 1～2 章口径注释；链 **`/`**、**`/privacy`**。 |
| **`/terms/community-guidelines`** | **`frontend/app/terms/community-guidelines/page.tsx`** | **04** 与 **§7.1** 域 M 横切（社区守则子路径）；占位与 **31 §3.3** 注释；链 **`/community/me`**、**`/terms`**。 |

## Footer 与站内入口

- **`frontend/components/landing/LandingFooter.tsx`**：**`/terms`**、**`/privacy`**、**`/help`**（与 **04**「Footer 链入」叙事一致）。  
- 其他 **`href="/help"`** / **`/terms`** / **`/privacy`** 抽检见仓库 **`rg 'href="/(help|privacy|terms)' frontend`**（治理页、订单页、**`CommunitySupportMenu`**、**`MarketSubsiteListFooterStrip`** 等）。

## API 面

本域页面为 **客户端 i18n 静态内容**，**不**要求 **`/api/v1`** 调用；**不**替代 **法务定稿 PDF** 或 **08-4** 全文签发。

## 命令

```bash
bash scripts/run-check-04-routes.sh
# exit 0（登记日）
```

## 边界

**不**将占位 **社区守则** 页当作法务已闭证；**不**替代 **93** 合规域人工回归。
