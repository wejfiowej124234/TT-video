# GO_95 · §7.1 域 I（争议前台）审计证据 · 2026-04-21



## 前端路由 ↔ **04 §3.4** 前端表



| 路径 | 实现要点 |

|------|----------|

| **`/disputes`** | **`frontend/app/disputes/page.tsx`**：**`getDisputes`**（**`frontend/lib/apiClient/disputes.ts`** → **`fetch(apiUrl(routes.disputes))`** = **`GET /api/v1/disputes`**）；**`getMeFull`**/**`meRoleFromGetMe`** 用于仲裁员视角；**`mapApiReadError`** / **`ApiErrorAlert`**。 |

| **`/disputes/[id]`** | **`frontend/app/disputes/[id]/page.tsx`**（壳）+ **`DisputeDetailPageClient.tsx`**：**`getDispute`**（**`routes.disputeById`** = **`GET /api/v1/disputes/:id`**）；**`postDisputeResolve`**/**`postDisputeExecuteResolutionIntent`**（**`routes.disputeResolve`**、**`routes.disputeExecuteResolutionIntent`** ↔ **04** **`POST …/dispute/:id/resolve`**、**`POST …/execute-resolution-intent`**）。 |



**Admin 争议**（**`frontend/app/admin/disputes/*`**）：走 **`routes.admin.disputes`**/**`admin.disputeById`**（**04** **`GET /api/v1/admin/disputes*`**）；与 **§7.1 域 L** 分轨，本域 I 以**用户前台** **`/disputes*`** 为主。



## **`api.ts` / `apiClient/disputes.ts`**



- **`routes.disputes`**、**`disputeById`**、**`disputeResolve`**、**`disputeExecuteResolutionIntent`**、**`orderDispute`**、**`orderOpenDisputeIntent`** — **`frontend/lib/api.ts`**。  

- **`disputes.test.ts`**：**`getDisputes`**/**`getDispute`**/**`postDisputeResolve`**/**`postDisputeExecuteResolutionIntent`** URL 与 **04** 同源。



## 命令



```bash

bash scripts/run-check-04-routes.sh

# exit 0

```



## 边界



**不**替代 **§8.2** 争议/证据行完成或 **`disputes::tests`** 全矩阵；**不**替代 **93 B** 争议域人工回归；**不**替代 **Escrow** 页内 **`DisputeResolutionFundBlock`**（属 **域 D** 横切）。

