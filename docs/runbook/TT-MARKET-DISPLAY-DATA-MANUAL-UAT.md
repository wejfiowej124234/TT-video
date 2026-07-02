# @deprecated — use docs/runbook/TT-DISPLAY-DATA-GOVERNANCE.md

**Version:** 1.0.0 · **生效：** 2026-07-01  
**SSOT 互指：** [`TT-OFFICIAL-OPS-PUBLIC-OPERATIONS-SSOT.md`](TT-OFFICIAL-OPS-PUBLIC-OPERATIONS-SSOT.md)

自由市场公众展示数据 **手测规范**（Phase 0+1）。适用于 ① 本地、② Staging；Production 仅作只读抽检。

---

## 0 · 前置

| 项 | 值 |
|----|-----|
| C3 账号 | `guide@test.com` / `Test123!` |
| C3 canonical bio | `测试向导账号，用于联调` |
| C3 城市 | 杭州 / Hangzhou |
| Staging Web | `https://tt-web-staging.fly.dev` |
| Staging API | `https://tt-api-staging.fly.dev` |
| 本地推荐 | `TRAVELTRUST_MARKET_CLEAN=1`（见 `scripts/dev/start-api-with-seed-README.md`） |

**注意：** C3 出现在 **`/market?view=guides`**（向导列表），不在 discover 订单栏。市场卡片不显示邮箱。

---

## 1 · AC-0.1 烟测不污染 C3

1. 在 Staging 执行：
   ```bash
   export STAGING_API_BASE=https://tt-api-staging.fly.dev
   bash scripts/dev/smoke-identity-p2-settings-staging.sh
   ```
2. 登录 C3，或 Admin 查 `guides` 行，确认 `bio` **仍为** canonical：`测试向导账号，用于联调`（**≠** 唯一依赖 `Staging P2 smoke`）。

---

## 2 · AC-0.2 市场 `[TEST]` 标签

1. 打开 `/market?view=guides`，城市筛 **杭州**（或 Hangzhou）。
2. 找到 C3 向导卡片（`data_origin=test`）。
3. 卡片标题旁应显示 **`[TEST]`**（中/英 locale 之一为 `[TEST]` 即可）。
4. （可选 · 仅 ① 本地 dev）空列表 showcase / dev variety 示意卡亦应带 `[TEST]`。

---

## 3 · AC-0.3 Staging/Prod 无公众 mock

1. Staging/Production 构建为 `NODE_ENV=production`。
2. `/market` 在 **无 API 数据、无筛选** 时不应出现硬编码国际 showcase 向导/订单墙。
3. 确认部署产物 **未** 设置 `NEXT_PUBLIC_MARKET_DEV_VARIETY=1`、`NEXT_PUBLIC_MARKET_MOCK_DETAIL=1`、`NEXT_PUBLIC_MARKET_SUBSITE_DEMO_FALLBACK=1`。

---

## 4 · AC-1.x Admin 可观测（Phase 1）

1. SuperAdmin 登录 Admin。
2. 侧栏 **Official Ops → 公众运营 / Public Operations** → `/admin/official/public-operations`。
3. Statistics 应展示五轨 `data_origin` 分桶：
   - `guides` · `orders` · `market_listings` · `community_posts`
   - `market_listings_by_variant.provider` · `market_listings_by_variant.acquisition`
4. 页内显示 `filter_enabled`（与 `TRAVELTRUST_PUBLIC_CATALOG_SURFACE` 同源）。
5. `/admin/guides` · `/admin/orders` 列表含 **数据来源 / data_origin** 列（只读）。
6. 无 `OFFICIAL_READ` 权限用户访问 stats API 应 **403**。

**Probe（API）：**

```bash
# 须 Admin Bearer + OFFICIAL_READ
curl -sS -H "Authorization: Bearer $ADMIN_TOKEN" \
  "$API_BASE/api/v1/admin/official/public-operations/stats" | jq .
```

---

## 5 · 证据

手测通过后，将 probe 输出或 Admin 截图存入：

`evidence/GO_official_ops_public_operations/<UTC>/`

Gate：`bash scripts/gates/check-official-ops-public-operations-ssot.sh`

---

## 6 · 非目标（本 runbook 不验）

- Publish/Unpublish 写按钮（**Phase 3 · post Production GO**）
- POI 图 / Landing 背景（Content Center）
- Phase 2–4 一切开发（**DEV FROZEN** 至 Production GO）
- Escrow / 订单状态机变更
