# `/market` 自由市场 · L5 UI 解冻记录（2026-05-29 → 2026-05-30 已闭）

**阶段：① 本地** — 2026-05-30 维护者重新冻结并 **正式收口**；[`MARKET-L5-CLOSURE.md`](./MARKET-L5-CLOSURE.md) · [`FIVE-MAIN-ROUTES-PHASE1-FREEZE.md`](./FIVE-MAIN-ROUTES-PHASE1-FREEZE.md) `/market` 行 **冻结（ACTIVE）**。

## 状态

| 项 | 值 |
|---|---|
| **路由** | `/market`（旅行预约主入口；**不含** `/market/provider` · `/market/acquisition` Hub 冻结边界 — 收购 Hub 仍见 [`ME-IDENTITIES-UI-FREEZE`](../GO_local_auth_l5/ME-IDENTITIES-UI-FREEZE.md)） |
| **解冻期** | 2026-05-29 → **2026-05-30 CLOSED** |
| **解冻原因** | 对齐 `/` 首页 L5（暖金玻璃 · 宽版心 · LandingFooter）+ **真实 discover 数据**（默认不注入 dev 示意卡） |
| **机读锚点** | `data-tt-market-l5="1"` · `data-tt-market-ui-thaw="closed"` · **`data-tt-market-filter-sort-frozen="1"`** |
| **筛选/排序布局 SSOT** | **[`MARKET-FILTER-SORT-UI-FREEZE.md`](./MARKET-FILTER-SORT-UI-FREEZE.md)**（2026-05-30 定稿冻结） |

## 解冻期已完成（①）

- Hero / 双栏 / 卡片 / 页脚 L5 壳与首页 token 对齐
- 对比度：`tt-market-l5-cta-link` · banner count · filter chip `[color]` · footer `a:visited`
- 页面滚动 + sticky 向导栏（移除内列 `max-h` 滚动条）
- 真实数据：discover orders + guides；`TRAVELTRUST_MARKET_PUBLIC_SHOWCASE=1` 幂等补种向导
- 绑定流：own-order backfill · auto-select · guides empty retry
- **筛选带 + 排序条**：URL `sort` / `filters=open` · 重置 · 摘要 live · a11y · 见 **MARKET-FILTER-SORT-UI-FREEZE**
- **Facet 数据链 + guides 分页**：registry · hydrate/insert normalize · `GET /guides?country_code&limit&cursor` · 见 **MARKET-L5-CLOSURE**

## 重新冻结后边界（与五主路由一致）

- **仅允许**数据链路 / i18n / a11y·错误态 / 门闸
- **禁止**页面结构 / L5 视觉 token / layout lock 回流
- **禁止**用 **②③** staging / 主网 GO 冒充 **①** 完成
- **禁止**破坏 **`GET /api/v1/discover/orders`** 业务语义
- **禁止**动 **`/market/acquisition`** Hub UI 冻结壳（PD-009 子站）

## 真实数据（默认）

- 列表源：**仅** `GET /api/v1/discover/orders` + `GET /api/v1/guides`
- **不**默认注入 `marketDevVarietyOrders` 示意卡
- 本地需要空列表补位演示：`NEXT_PUBLIC_MARKET_DEV_VARIETY=1`
- 本地向导走查：`TRAVELTRUST_MARKET_PUBLIC_SHOWCASE=1`（API 启动）

## 机读验收

```bash
cd frontend
# 完整 ① 收口绿集见 MARKET-L5-CLOSURE.md
npx vitest run lib/marketUiL5Thaw.contract.test.ts lib/marketPageQuery.test.ts lib/marketGuideFilterQuery.test.ts components/market/marketTheme.contract.test.ts
```
