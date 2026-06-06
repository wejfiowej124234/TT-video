# ②③ · Lighthouse / WCAG / Percy（U4–U5）

**阶段：** **② 测试网** 或 **③ 生产** — **不**在 **①** 用 `npm test` 绿冒充闭卷。

## ① 已做（工程锚点）

- `bash scripts/gates/verify-cinematic-l5-local.sh` — Vitest + §6.2 三 PNG 存在
- `CAPTURE_CINEMATIC_L5_REFRESH=1 bash scripts/gates/verify-cinematic-l5-local.sh` — 可选重导 PNG
- 顶栏 nav scrim、合规区、Pulse 正文对比度 token（`TT_LANDING_NAV_EMBEDDED_L5` / `TT_PAGE_COMPLIANCE_L5`）
- L1 公告标签簇 **closed ①（2026-06-03）** — `TT_PULSE_TICKER_L5` **`rgba(249,215,121,…)`** + **`globals.css`** **`[data-tt-traveltrust-pulse-label-cluster-l5]`** — **[`L1-PULSE-LABEL-CONTRAST-FREEZE.md`](./L1-PULSE-LABEL-CONTRAST-FREEZE.md)**

## ②③ 交付（maintainer）

| 项 | 命令 / 产物 |
|----|-------------|
| Lighthouse | `cd frontend && npm run lighthouse:traveltrust` → `evidence/GO_local_traveltrust_ph1/lighthouse/` |
| WCAG 逐条 | Lighthouse accessibility + 手验 focus 环 |
| 视觉回归 | Chromatic/Percy 或 committed Playwright snapshots（**TT-PH1-182**） |

签字前与 **[issues-phase1-ui-ux-traveltrust-v6.md](../../../docs/runbook/issues-phase1-ui-ux-traveltrust-v6.md)** **TT-PH1-162/182/184** 对拍。
