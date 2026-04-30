# GO_95 · §7.1 域 L（Admin）审计证据 · 2026-04-21

## 前端路由 ↔ **04 §3.4** / **04 §3.5 Admin API** / **70**

| 要点 | 说明 |
|------|------|
| **App Router** | **`frontend/app/admin/**`**：**`find frontend/app/admin -name 'page.tsx' | wc -l`** → **57** 个 **`page.tsx`**（**不**等价「57 页各已逐条手测」）。 |
| **壳与 IA** | **`frontend/app/admin/layout.tsx`**：**`AdminShellBar`**（**`frontend/components/admin/AdminShellBar.tsx`**；注释 **70 / 07 §5.6C**）、**`robots: { index: false, follow: false }`**。 |
| **HTTP 基址** | 各页经 **`apiUrl(routes.admin.*)`** 指向 **`/api/v1/admin/...`**；**`routes.admin`** 树见 **`frontend/lib/api.ts`**（首段 **`users`/`guides`/`orders`/`disputes`/`reviews`/`audit*`/`approvals*`/`finance*`/`feeRouter*`/`crossCheck`/`driftSummary`/`regionVault*`** 等，与 **04 §3.5** 表界内对读）。 |
| **鉴权头** | 列表/读：**`getAuthHeaders()`**（**`Authorization: Bearer <traveltrust_session_token>`** 优先；见 **`frontend/lib/apiClient/core.ts`** **`AUTH_SESSION_TOKEN_KEY`**）；写：**`writeRequestHeaders()`**（**`Idempotency-Key`/`X-Idempotency-Key`** + **`getAuthHeaders()`**，**50-F2**）。 |
| **统一 fetch** | **`adminFetchJson`**（**`frontend/lib/adminFetchDisplay.ts`**）→ **`fetchJsonWithApiStatusLog`**；错误语义注释对齐 **`crates/api/src/routes/admin.rs`** **`require_admin_actor`** 等（**70 / 13-1**）。 |

## 抽检页面（代表扇面）

- **`frontend/app/admin/users/page.tsx`**：**`adminFetchJson`** + **`routes.admin.users`** / **`userRoleChangeRequest`**；**`getAuthHeaders`**/**`writeRequestHeaders`**。  
- **`frontend/app/admin/cross-check/page.tsx`**、**`drift-summary`**、**`indexer/page.tsx`**、**`disputes/[id]/page.tsx`** 等：**`routes.admin.crossCheck`**/**`driftSummary`**/**`indexerHealth`**/**`disputeById`** 同源模式（grep **`adminFetchJson`** / **`routes.admin`**）。

## 命令

```bash
bash scripts/run-check-04-routes.sh
# exit 0（2026-04-21 本证据包登记时）
```

## 边界

**不**替代 **§8.2** Admin 相关行「行完成」、**93 B** 管理域深测、或 **70** 全文终验；**不**将 **57** **`page.tsx`** 计数误记为 **93 PASS** 或 **ISS-007** 闭证。
