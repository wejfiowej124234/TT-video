# GO_95 · §7.2 前端业务与展示基线重验（2026-04-22）

## 1. 目的

在 **《95》§7.2**（点赞 / 收藏 / 市场星标 / Feed degraded / F-031 橱窗 / i18n·a11y）已 **`[x]`** 的前提下，重跑**契约路由闸**与 **i18n 机读门禁**，确认与 **04/13-1** 及 **150/37/13-1** 抽检叙述仍兼容。  
**不**替代各子条 **`evidence/GO_95_20260421_section7_2_*/README.md`** 的代码锚点深读；**不**替代 **§8.2**/**93**/**`test:a11y:ci`** 全量。

## 2. 命令与结果（仓库根 → `frontend/`）

```bash
bash scripts/run-check-04-routes.sh
# → exit 0

cd frontend && npm run test:i18n:ci
# → [i18n-gate] passed.
```

## 3. 与 §7.2 子条互证（仍以前序证据为主证）

| §7.2 子条 | 主证目录（2026-04-21） |
|-----------|-------------------------|
| 点赞 | `evidence/GO_95_20260421_section7_2_like_optimistic/` |
| 收藏（社区） | `evidence/GO_95_20260421_section7_2_collect_optimistic/` |
| 市场星标 | `evidence/GO_95_20260421_section7_2_market_star_bookmarks/` |
| Feed degraded | `evidence/GO_95_20260421_section7_2_feed_degraded/` |
| F-031 橱窗 | `evidence/GO_95_20260421_section7_2_commerce_showcase_f031/` |
| i18n/a11y 抽检 | `evidence/GO_95_20260421_section7_2_i18n_a11y_spotcheck/` |

## 4. 诚实边界

- **路由闸 + i18n-gate** 为横切**窄扇面**；未在本包重跑 **Vitest** 社区/市场单测全矩阵。
- **§7.2 i18n/a11y** 行所述 **`frontend/.i18n-coverage.json`** 等静态物未强制重读；若 CI 策略变更须同步 **§7.2** 证据句。
