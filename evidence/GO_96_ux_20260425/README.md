# GO_96_ux_20260425 — 96-13 manual UX (parent routes)

**Per page (8)**: broken links / 404; empty / loading / error; 320 / 768 / 1024 / 1440; i18n; a11y (label, focus, keyboard); F-zone copy; wallet / chain errors; Lighthouse or Web Vitals sample.

## This round

### /pay — PASS (case 96-13-route-pay-f-zone)

- Nav: /orders, /escrow/:id, login returnUrl; invalid UUID has aria-invalid + hint.
- States: Suspense fallback; getOrder 403 vs generic errors; retry clears stale state.
- F-zone: pay_disclaimer states on-chain + reconciliation only; no platform payout address.
- Wallet: mock-pay and protocol pause from /meta; no raw stack on screen.

### /escrow/[id] — PASS (case 96-13-route-escrow-id-f-zone)

- invalid id → notFound; load error uses ApiErrorAlert + login/retry; segment error boundary hides error.message.
- Wrong network: EscrowChainMismatchActions maps switch errors via mapWalletWriteError (no raw wagmi/RPC text on screen).

## NOT_RUN (next human + Lighthouse)

/, /traveltrust, /community

Update evidence/GO_20260425/report.json cases and summary before release_gate=GO (with 95/93).

## /orders 与 /orders/[id]（本轮）

- **列表 `/orders`**：`mapApiReadError`、登录重试、加载骨架与 `sr-only` 状态；错误边界不展示裸 `error.message`。
- **深链 `/orders/:uuid`**：新增服务端路由，合法 UUID **307 跳转**至 `/escrow/:uuid`；非法 id **404**。便于分享与母表「订单详情」心智对齐。
- **Lighthouse**：列表重交互，建议在完成数据态抽样后单独跑（未写入本包 JSON）。

## /pay 复核（仅证据）

- 逻辑未改；捕获步骤与占位指标见同目录 `pay_lighthouse_CAPTURE.md`、`pay_3012.metrics-snippet.PENDING.json`。

## /pay — Lighthouse 实证（升级）

- 全量：`evidence/GO_96_ux_20260425/pay_3012.lighthouse.json`
- 摘录：`evidence/GO_96_ux_20260425/pay_3012.metrics-snippet.json`（performance / a11y 分数 + LCP/CLS/FCP 等）

## /governance（本轮代码）

- 提案列表执行态药丸：**Executed** 短文案改为 **Timelock 语义**；`title` 提示明确**非**收益兑付/资金分配。
- `proposal-status` 行错误：去掉裸 `api_error` 字串上屏，改统一 `governance_proposals_status_error_hint`。
- 投票/委托仍依赖既有 `mapApiReadError` / `mapOrderWriteError`；链上 Governor 模式仍为只读 calldata 说明。

## /market（本轮）

- 列表/向导加载失败与「加载更多」失败：统一 `ApiErrorAlert`（`tone="dark"`），避免裸 `<p>{message}</p>` 上屏。
- 布局：`min-w-0` + `w-full` 防止窄屏横向溢出；订单/向导玻璃卡片加 `min-w-0`。
- 文案：Hero 增加 `market_hero_listing_disclosure`；补全 `market_demo_trading_banner`、`market_local_favorites_disclaimer` i18n。
- 证据：`market_3012.lighthouse.json`、`market_3012.metrics-snippet.json`、`market_lighthouse_CAPTURE.md`；多宽度 PNG 见 `screenshots/market/` 说明。

## Admin — PASS（96-13-route-admin-finance + 96-13-route-admin-indexer）

同一批收口子路径（`report.json` 仍为两条 case；README 按 URL 展开）：

- **`/admin/finance`**：只读口径 `admin_finance_readonly_scope_note`；财务摘要缺失时的 **empty** 区与深链；CSV 导出 **`window.confirm`**；`!res.ok` 不把 API `message`/`error` 塞进 `Error.message`（控制台 `adminLogApiJsonStatus` / `console.warn`）；`min-w-0` 与摘要卡片区 **`admin_table_horizontal_scroll_hint`**；链向 **`/admin/finance-reconciliation`**。
- **`/admin/finance-reconciliation`**：`finance/summary` 拉取同上错误映射；`admin_finance_reconciliation_readonly_scope_note`；加载条 `role="status"`；Epic D 宽表外 **`admin_table_horizontal_scroll_hint`** + `aria-describedby`。
- **`/admin/indexer`**：`admin_indexer_readonly_scope_note`；health JSON `!res.ok` 映射同上。
- **`/admin/indexer/reconcile-reports`**：列表 `!res.ok` 映射同上；导出前 **page / all 各一确认文案**；导出失败不展示裸服务端字串；列表宽表 **`admin_table_horizontal_scroll_hint`** + `section[aria-describedby]`。

**Lighthouse + 截图**（与 `/pay`、`/market` 同级目录）：`admin_lighthouse_CAPTURE.md`、`admin_finance_3012.lighthouse.json`、`admin_indexer_3012.lighthouse.json`、对应 `*.metrics-snippet.json`、`screenshots/admin_*_final.jpg`（未登录时捕获为 login 重定向页）。
