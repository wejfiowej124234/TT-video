# GO_95 · §7.1 域 A（首页/落地）审计证据 · 2026-04-21

## 范围

- `(home)` → `frontend/app/(home)/page.tsx`（Landing / **25 §3.1** 注释）
- `/traveltrust` → `frontend/app/traveltrust/page.tsx` + `layout.tsx` 等
- `/network` → `frontend/app/network/page.tsx`（`permanentRedirect("/traveltrust")`）
- `/trust` → `frontend/app/trust/page.tsx`（`TrustTransparencyHub`）

## 契约对齐

- **04 §3.4** 前端路由表：`/`、`/traveltrust`、`/network` 已登记；本轮补 **`/trust`** 一行（与实现同批）。
- **13-1 §二 表 1**：Network 行已覆盖 `/traveltrust` 与 `/network`；本轮补 **`/trust`** 续行。

## 命令（仓库根 · Git Bash）

```bash
bash scripts/run-check-04-routes.sh
# exit 0 — 含 check-04-frontend-routes-vs-app、check-13-1-table1-routes-vs-app、check-13-1-routes-covered-by-04-frontend-table

python scripts/gates/check-13-1-table1-routes-vs-app.py
# exit 0
```

## 说明

本证据**不**替代 **§8.2** 行完成、**93/R-001** 回归或 **§7** 其余子节；仅闭合 **95 §7.1 · 域 A** 文档—路由—实现横切核对。
